const TOKEN_KEY = "cat-clicker-session-token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(path, {
    ...options,
    headers,
    body: options.body && typeof options.body !== "string" ? JSON.stringify(options.body) : options.body
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Request failed with ${response.status}`);
  }
  return payload;
}

export async function signup({ username, password, displayName }) {
  const result = await apiRequest("/api/signup", {
    method: "POST",
    body: { username, password, displayName }
  });
  setToken(result.token);
  return result;
}

export async function login({ username, password }) {
  const result = await apiRequest("/api/login", {
    method: "POST",
    body: { username, password }
  });
  setToken(result.token);
  return result;
}

export async function logout() {
  try {
    await apiRequest("/api/logout", { method: "POST", body: {} });
  } finally {
    setToken(null);
  }
}

export async function fetchSave() {
  return apiRequest("/api/save");
}

export async function writeSave(save, reason = "autosave") {
  return apiRequest("/api/save", {
    method: "POST",
    body: { save, reason }
  });
}

export async function fetchHistory() {
  return apiRequest("/api/history");
}

export async function restoreHistory(historyId) {
  return apiRequest("/api/history/restore", {
    method: "POST",
    body: { historyId }
  });
}

export async function fetchLeaderboard() {
  return apiRequest("/api/leaderboard");
}
