const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const PASSWORD_ITERATIONS = 120000;
const HISTORY_LIMIT = 25;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

let dbCache = null;
let writeQueue = Promise.resolve();

function nowIso() {
  return new Date().toISOString();
}

function json(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(JSON.stringify(payload));
}

function notFound(res) {
  json(res, 404, { error: "Not found" });
}

async function ensureDatabase() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.writeFile(
      DB_FILE,
      JSON.stringify({ users: {}, nextUserId: 1, createdAt: nowIso() }, null, 2)
    );
  }
}

async function loadDb() {
  if (dbCache) {
    return dbCache;
  }
  await ensureDatabase();
  const raw = await fs.readFile(DB_FILE, "utf8");
  dbCache = JSON.parse(raw);
  dbCache.users ||= {};
  dbCache.nextUserId ||= 1;
  return dbCache;
}

async function saveDb(db) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmpFile = `${DB_FILE}.tmp`;
  await fs.writeFile(tmpFile, JSON.stringify(db, null, 2));
  await fs.rename(tmpFile, DB_FILE);
  dbCache = db;
}

function withDb(mutator) {
  writeQueue = writeQueue.then(async () => {
    const db = await loadDb();
    const result = await mutator(db);
    await saveDb(db);
    return result;
  });
  return writeQueue;
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let body = "";
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("Request body is too large"));
        req.destroy();
        return;
      }
      body += chunk.toString("utf8");
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function normalizeUsername(username) {
  return String(username || "").trim().toLowerCase();
}

function validateUsername(username) {
  return /^[a-z0-9_]{3,20}$/.test(username);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("base64")) {
  const hash = crypto
    .pbkdf2Sync(String(password), salt, PASSWORD_ITERATIONS, 64, "sha512")
    .toString("base64");
  return { salt, hash, iterations: PASSWORD_ITERATIONS, digest: "sha512" };
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function verifyPassword(password, passwordRecord) {
  const attempt = crypto
    .pbkdf2Sync(
      String(password),
      passwordRecord.salt,
      passwordRecord.iterations || PASSWORD_ITERATIONS,
      64,
      passwordRecord.digest || "sha512"
    )
    .toString("base64");
  return safeEqual(attempt, passwordRecord.hash);
}

function createToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function publicProfile(user) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    createdAt: user.createdAt
  };
}

function getBearerToken(req) {
  const value = req.headers.authorization || "";
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : "";
}

function findUserByTokenHash(db, tokenHash) {
  const now = Date.now();
  for (const user of Object.values(db.users)) {
    user.sessions ||= [];
    const session = user.sessions.find((entry) => {
      return entry.expiresAt && Date.parse(entry.expiresAt) > now && safeEqual(entry.tokenHash, tokenHash);
    });
    if (session) {
      return { user, session };
    }
  }
  return null;
}

async function requireAuth(req) {
  const token = getBearerToken(req);
  if (!token) {
    throw Object.assign(new Error("Missing session"), { status: 401 });
  }
  const db = await loadDb();
  const found = findUserByTokenHash(db, hashToken(token));
  if (!found) {
    throw Object.assign(new Error("Invalid or expired session"), { status: 401 });
  }
  return publicProfile(found.user);
}

function summarizeSave(save) {
  const stats = save?.stats || {};
  const player = save?.player || {};
  const currency = save?.currency || {};
  const cats = save?.cats?.owned || {};
  return {
    level: player.level || 1,
    title: player.title || "Rookie Whisker",
    coins: Math.floor(currency.coins || 0),
    gems: Math.floor(currency.gems || 0),
    catsOwned: Object.keys(cats).length,
    battlesWon: stats.battlesWon || 0,
    bossesDefeated: stats.bossesDefeated || 0,
    achievements: Array.isArray(save?.achievements?.unlocked)
      ? save.achievements.unlocked.length
      : 0,
    zone: save?.story?.zone || "velvet-lounge"
  };
}

function shouldCreateHistory(user, reason) {
  if (!user.save) {
    return false;
  }
  if (reason === "manual" || reason === "checkpoint" || reason === "restore") {
    return true;
  }
  const last = user.saveHistory?.[user.saveHistory.length - 1];
  if (!last) {
    return true;
  }
  return Date.now() - Date.parse(last.savedAt) > 1000 * 60;
}

function addHistory(user, reason) {
  user.saveHistory ||= [];
  user.saveHistory.push({
    id: crypto.randomUUID(),
    savedAt: nowIso(),
    reason,
    revision: user.saveRevision || 0,
    summary: summarizeSave(user.save),
    save: user.save
  });
  if (user.saveHistory.length > HISTORY_LIMIT) {
    user.saveHistory = user.saveHistory.slice(-HISTORY_LIMIT);
  }
}

function leaderboardScore(save) {
  const stats = save?.stats || {};
  const player = save?.player || {};
  const achievements = save?.achievements?.unlocked || [];
  const catsOwned = Object.keys(save?.cats?.owned || {}).length;
  return Math.floor(
    (stats.totalCoinsEarned || 0) / 80 +
      (player.level || 1) * 250 +
      (stats.battlesWon || 0) * 120 +
      (stats.arenaWins || 0) * 150 +
      (stats.bossesDefeated || 0) * 520 +
      catsOwned * 95 +
      achievements.length * 110
  );
}

async function handleApi(req, res, url) {
  try {
    if (req.method === "POST" && url.pathname === "/api/signup") {
      const body = await readJson(req);
      const username = normalizeUsername(body.username);
      const password = String(body.password || "");
      const displayName = String(body.displayName || username).trim().slice(0, 24) || username;

      if (!validateUsername(username)) {
        json(res, 400, { error: "Usernames must be 3-20 characters using letters, numbers, or underscores." });
        return;
      }
      if (password.length < 8) {
        json(res, 400, { error: "Passwords must be at least 8 characters." });
        return;
      }

      const result = await withDb(async (db) => {
        if (db.users[username]) {
          throw Object.assign(new Error("That username is already taken."), { status: 409 });
        }
        const token = createToken();
        const now = nowIso();
        const user = {
          id: String(db.nextUserId++),
          username,
          displayName,
          password: hashPassword(password),
          sessions: [
            {
              tokenHash: hashToken(token),
              createdAt: now,
              expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString()
            }
          ],
          save: null,
          saveRevision: 0,
          saveHistory: [],
          createdAt: now,
          updatedAt: now
        };
        db.users[username] = user;
        return { token, profile: publicProfile(user) };
      });

      json(res, 201, result);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/login") {
      const body = await readJson(req);
      const username = normalizeUsername(body.username);
      const password = String(body.password || "");
      const result = await withDb(async (db) => {
        const user = db.users[username];
        if (!user || !verifyPassword(password, user.password)) {
          throw Object.assign(new Error("Invalid username or password."), { status: 401 });
        }
        const token = createToken();
        const now = nowIso();
        user.sessions ||= [];
        user.sessions = user.sessions.filter((session) => Date.parse(session.expiresAt) > Date.now());
        user.sessions.push({
          tokenHash: hashToken(token),
          createdAt: now,
          expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString()
        });
        user.updatedAt = now;
        return { token, profile: publicProfile(user) };
      });
      json(res, 200, result);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/auth/google") {
      const body = await readJson(req);
      const credential = String(body.credential || "");
      if (!credential) {
        json(res, 400, { error: "Missing credential" });
        return;
      }
      try {
        const payloadBase64 = credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const payloadJson = Buffer.from(payloadBase64, "base64").toString("utf8");
        const payload = JSON.parse(payloadJson);
        const email = normalizeUsername(payload.email);
        const displayName = String(payload.name || email).trim().slice(0, 24);

        if (!email) {
          json(res, 400, { error: "Google token did not contain an email." });
          return;
        }

        const result = await withDb(async (db) => {
          let user = db.users[email];
          const now = nowIso();
          if (!user) {
            user = {
              id: String(db.nextUserId++),
              username: email,
              displayName,
              password: hashPassword(crypto.randomBytes(32).toString("hex")),
              sessions: [],
              save: null,
              saveRevision: 0,
              saveHistory: [],
              createdAt: now,
              updatedAt: now
            };
            db.users[email] = user;
          }
          
          const token = createToken();
          user.sessions ||= [];
          user.sessions = user.sessions.filter((session) => Date.parse(session.expiresAt) > Date.now());
          user.sessions.push({
            tokenHash: hashToken(token),
            createdAt: now,
            expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString()
          });
          user.updatedAt = now;
          return { token, profile: publicProfile(user) };
        });
        json(res, 200, result);
      } catch (err) {
        json(res, 400, { error: "Invalid Google credential" });
      }
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/logout") {
      const token = getBearerToken(req);
      if (!token) {
        json(res, 200, { ok: true });
        return;
      }
      await withDb(async (db) => {
        const found = findUserByTokenHash(db, hashToken(token));
        if (found) {
          found.user.sessions = found.user.sessions.filter(
            (session) => !safeEqual(session.tokenHash, hashToken(token))
          );
          found.user.updatedAt = nowIso();
        }
      });
      json(res, 200, { ok: true });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/me") {
      json(res, 200, { profile: await requireAuth(req) });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/save") {
      const tokenHash = hashToken(getBearerToken(req));
      const db = await loadDb();
      const found = findUserByTokenHash(db, tokenHash);
      if (!found) {
        json(res, 401, { error: "Invalid or expired session" });
        return;
      }
      json(res, 200, {
        profile: publicProfile(found.user),
        save: found.user.save,
        revision: found.user.saveRevision || 0,
        updatedAt: found.user.updatedAt,
        history: (found.user.saveHistory || []).map(({ id, savedAt, reason, revision, summary }) => ({
          id,
          savedAt,
          reason,
          revision,
          summary
        }))
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/save") {
      const body = await readJson(req);
      const tokenHash = hashToken(getBearerToken(req));
      const incomingSave = body.save;
      const reason = String(body.reason || "autosave").slice(0, 32);
      if (!incomingSave || typeof incomingSave !== "object") {
        json(res, 400, { error: "A save object is required." });
        return;
      }

      const result = await withDb(async (db) => {
        const found = findUserByTokenHash(db, tokenHash);
        if (!found) {
          throw Object.assign(new Error("Invalid or expired session"), { status: 401 });
        }
        const user = found.user;
        if (shouldCreateHistory(user, reason)) {
          addHistory(user, reason);
        }
        const stampedSave = structuredClone(incomingSave);
        stampedSave.meta ||= {};
        stampedSave.meta.lastServerSavedAt = nowIso();
        stampedSave.meta.accountId = user.id;
        user.save = stampedSave;
        user.saveRevision = (user.saveRevision || 0) + 1;
        user.updatedAt = nowIso();
        return {
          ok: true,
          revision: user.saveRevision,
          updatedAt: user.updatedAt,
          summary: summarizeSave(user.save)
        };
      });
      json(res, 200, result);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/history") {
      const tokenHash = hashToken(getBearerToken(req));
      const db = await loadDb();
      const found = findUserByTokenHash(db, tokenHash);
      if (!found) {
        json(res, 401, { error: "Invalid or expired session" });
        return;
      }
      json(res, 200, {
        history: (found.user.saveHistory || []).map(({ id, savedAt, reason, revision, summary }) => ({
          id,
          savedAt,
          reason,
          revision,
          summary
        }))
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/history/restore") {
      const body = await readJson(req);
      const historyId = String(body.historyId || "");
      const tokenHash = hashToken(getBearerToken(req));
      const result = await withDb(async (db) => {
        const found = findUserByTokenHash(db, tokenHash);
        if (!found) {
          throw Object.assign(new Error("Invalid or expired session"), { status: 401 });
        }
        const user = found.user;
        const entry = (user.saveHistory || []).find((item) => item.id === historyId);
        if (!entry) {
          throw Object.assign(new Error("Save history entry not found."), { status: 404 });
        }
        if (user.save) {
          addHistory(user, "restore");
        }
        const restored = structuredClone(entry.save);
        restored.meta ||= {};
        restored.meta.restoredAt = nowIso();
        restored.meta.lastServerSavedAt = nowIso();
        user.save = restored;
        user.saveRevision = (user.saveRevision || 0) + 1;
        user.updatedAt = nowIso();
        return { save: user.save, revision: user.saveRevision, updatedAt: user.updatedAt };
      });
      json(res, 200, result);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/leaderboard") {
      const db = await loadDb();
      const leaders = Object.values(db.users)
        .filter((user) => user.save)
        .map((user) => ({
          username: user.username,
          displayName: user.displayName,
          score: leaderboardScore(user.save),
          summary: summarizeSave(user.save)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);
      json(res, 200, { leaders });
      return;
    }

    notFound(res);
  } catch (error) {
    json(res, error.status || 500, { error: error.message || "Server error" });
  }
}

async function serveStatic(req, res, url) {
  const decodedPath = decodeURIComponent(url.pathname);
  const relativePath = decodedPath === "/" ? "index.html" : decodedPath.replace(/^\/+/, "");
  const filePath = path.resolve(PUBLIC_DIR, relativePath);

  if (filePath !== PUBLIC_DIR && !filePath.startsWith(PUBLIC_DIR + path.sep)) {
    json(res, 403, { error: "Forbidden" });
    return;
  }

  try {
    const file = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-store" : "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; media-src 'self'; object-src 'none'; base-uri 'self'; frame-src https://accounts.google.com; frame-ancestors 'none'"
    });
    res.end(file);
  } catch (error) {
    if (error.code === "ENOENT") {
      const fallback = await fs.readFile(path.join(PUBLIC_DIR, "index.html"));
      res.writeHead(200, {
        "Content-Type": MIME_TYPES[".html"],
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff"
      });
      res.end(fallback);
      return;
    }
    json(res, 500, { error: "Could not read static asset." });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (url.pathname.startsWith("/api/")) {
    await handleApi(req, res, url);
    return;
  }
  await serveStatic(req, res, url);
});

ensureDatabase()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Cat Clicker server running at http://localhost:${PORT}`);
      console.log(`Save database: ${DB_FILE}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start Cat Clicker:", error);
    process.exitCode = 1;
  });
