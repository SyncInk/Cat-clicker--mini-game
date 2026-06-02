# Cat Clicker

Cat Clicker is a desktop-first premium web game prototype built with HTML, CSS, JavaScript, and a dependency-free Node backend.

## What is included

- Required sign-in and sign-up before play
- Secure password hashing with PBKDF2
- Account-based backend save files
- Autosave, manual checkpoints, and restore history
- Offline income
- Cat collection with rarity tiers
- Upgrades, skill tree, quests, daily rewards, achievements, cosmetics, story zones, arena battles, boss fights, and leaderboard support
- Procedural Web Audio music and sound effects
- Desktop-first UI intended for large screens and keyboard/mouse play

## Run locally

Requirements:

- Node.js 18 or newer
- A modern desktop browser

Start the game:

```bash
npm start
```

Open:

```text
http://localhost:3000
```

No npm install is required because the prototype uses Node built-ins only.

## Save data

Local save data is stored in:

```text
data/db.json
```

This file is ignored by git because it contains account records, password hashes, sessions, and player saves.

For production, move saves to managed storage such as PostgreSQL, Supabase, Neon, PlanetScale, Firebase, or a host with a persistent disk. Do not rely on temporary server files on hosts that erase disk state during deploys.

## Deploy with GitHub

GitHub is the source-code host. GitHub Pages is not enough for this version because Pages cannot run `server.js` or store account progress.

Recommended path:

1. Create a GitHub repository.
2. Commit this project.
3. Push to GitHub.
4. Deploy the repository to a Node-capable host such as Render, Railway, Fly.io, Heroku, or a VPS.
5. Configure the host to run:

```bash
npm start
```

6. Set the web service port to use the host-provided `PORT` environment variable. This server already reads `process.env.PORT`.
7. Configure persistent storage:
   - Simple prototype: set `DATA_DIR` to a mounted persistent disk path.
   - Production: replace `data/db.json` with a managed database.
8. Enable HTTPS on the host.
9. Test sign-up, autosave, logout, login, offline rewards, history restore, battles, and leaderboard after deployment.

Useful git commands:

```bash
git init
git add .
git commit -m "Build Cat Clicker web game"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## Required production checklist

- Node.js 18+
- GitHub repository
- Node-capable hosting provider
- Persistent database or persistent disk
- HTTPS
- Backups for saves
- Unique production secrets if you later add signed cookies, JWTs, OAuth, payments, or admin tools
- Abuse protection such as rate limits and stricter server-side validation before public launch
