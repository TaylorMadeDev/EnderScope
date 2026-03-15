# EnderScope

Minecraft server discovery and analysis dashboard.

EnderScope is a full-stack app with:
- Express backend for scanning/discovery, auth, task orchestration, settings, and logs
- React frontend dashboard for running jobs and viewing results in real time

## What It Does

- Shodan discovery for Minecraft hosts with query/version filters
- TCP reachability scanning over IP lists, host:port pairs, and CIDR ranges
- Whitelist status checks via Minecraft login handshake behavior
- Session-based auth (email/password and Google OAuth)
- In-app task progress tracking and live log viewing
- Optional Discord notifications for non-whitelisted results

## Architecture

- Backend: [backend/src/server.js](backend/src/server.js)
- API routes: [backend/src/routes/api.js](backend/src/routes/api.js)
- Auth routes: [backend/src/routes/auth.js](backend/src/routes/auth.js)
- Frontend app/router: [frontend/src/App.jsx](frontend/src/App.jsx)

Backend responsibilities:
- Serves API at /api and auth at /auth
- Persists users in MySQL-compatible DB
- Stores scanner settings in [backend/data/config/config.json](backend/data/config/config.json)
- Writes runtime logs to [backend/data/logs/serverbuster.log](backend/data/logs/serverbuster.log)
- Serves built frontend from frontend/dist when present

Frontend responsibilities:
- Provides landing/login/register and protected dashboard routes
- Proxies /api and /auth to backend during development

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | Node.js, Express, express-session, mysql2 |
| Frontend | React 18, React Router, Vite, Tailwind CSS, GSAP |
| Auth | Email/password (bcryptjs), Google OAuth 2.0 |
| Discovery | Shodan API, raw TCP sockets, Minecraft protocol handshake logic |

## Prerequisites

- Node.js 18+
- npm 9+
- MySQL-compatible database (MySQL, MariaDB, TiDB Cloud, etc.)

Python is only needed if you plan to run the archived code in [backend/legacy_python](backend/legacy_python).

## Quick Start

1. Install dependencies.

```bash
cd backend
npm install
cd ../frontend
npm install
```

2. Configure backend environment variables (see Environment Variables below).

3. Create DB schema using [backend/db/schema.sql](backend/db/schema.sql).

4. Start backend.

```bash
cd backend
npm run dev
```

5. Start frontend.

```bash
cd frontend
npm run dev
```

Default local URLs:
- Backend: http://localhost:8000
- Frontend: http://localhost:5173

## Environment Variables (Backend)

Configuration is loaded from [backend/src/config.js](backend/src/config.js).

Core server:
- PORT (default: 8000)
- FRONTEND_URL (default: http://localhost:5173)
- SESSION_SECRET (default fallback exists for local dev)

Database:
- DATABASE_URL (preferred, e.g. mysql://user:pass@host:4000/dbname)
- DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS (used when DATABASE_URL is not set)
- DB_SSL (false/off/0, true, or skip-verify)
- DB_CA (optional CA cert content)

Google OAuth:
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_REDIRECT_URI (default: http://localhost:PORT/auth/google-callback)

Example:

```env
PORT=8000
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=replace-with-a-strong-secret

DATABASE_URL=mysql://USERNAME:PASSWORD@HOST:4000/serverbuster
DB_SSL=true

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google-callback
```

## Database Setup

Run the schema in [backend/db/schema.sql](backend/db/schema.sql):
- Creates users table
- Supports local accounts and Google-linked accounts

If using TiDB Cloud, keep TLS enabled with DB_SSL=true unless your environment requires a different SSL mode.

## API Overview

Auth routes:
- GET /auth/session
- POST /auth/login
- POST /auth/register
- POST /auth/logout
- GET /auth/google
- GET /auth/google-callback

Task and scanner routes:
- POST /api/shodan/search
- POST /api/bruteforce/scan
- POST /api/whitelist/check
- GET /api/tasks/:taskId
- POST /api/tasks/:taskId/cancel
- GET /api/dashboard/stats

Config and logs:
- GET /api/settings
- PUT /api/settings
- GET /api/logs

## Production Build

Build the frontend:

```bash
cd frontend
npm run build
```

Start backend in production mode:

```bash
cd backend
npm start
```

When frontend/dist exists, the backend serves it directly.

## Project Structure

- [backend](backend): Active Node.js backend
- [frontend](frontend): Active React frontend
- [backend/legacy_python](backend/legacy_python): Archived previous Python backend
- [auth](auth): Legacy PHP auth files (not part of active runtime)

## Security and Usage Notes

- Use this software only on infrastructure you own or are explicitly authorized to test.
- Never commit real secrets. Keep credentials in environment variables.
- Set a strong SESSION_SECRET in non-local environments.

## Troubleshooting

- Port already in use:
	- Change PORT or stop the other process.
- Login/registration failing:
	- Verify DB connectivity and that [backend/db/schema.sql](backend/db/schema.sql) was applied.
- Google login redirect mismatch:
	- Ensure GOOGLE_REDIRECT_URI matches your provider config exactly.
- Frontend cannot reach backend in dev:
	- Confirm backend is running on port 8000 and Vite proxy is active in [frontend/vite.config.js](frontend/vite.config.js).

## License

MIT
