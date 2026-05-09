# Trading Signal Tracking Application

Full-stack app to record trading signals, stream live prices from **Binance’s public API**, evaluate **target / stop-loss / expiry** rules on the server, and visualize **ROI** and **time remaining** in a responsive React dashboard.

## Architecture

```mermaid
flowchart LR
  subgraph client [Frontend Vite React]
    UI[Forms and dashboard]
    API_LAYER[Axios service]
  end
  subgraph server [Backend Express]
    Routes[Routes]
    Ctrl[Controllers]
    Svc[Services]
    Binance[Binance client]
  end
  DB[(PostgreSQL)]
  BinanceAPI[Binance REST]
  UI --> API_LAYER
  API_LAYER --> Routes
  Routes --> Ctrl
  Ctrl --> Svc
  Svc --> DB
  Svc --> Binance
  Binance --> BinanceAPI
```

**Backend layers**

- **`routes/`** — HTTP route wiring only.
- **`controllers/`** — parse requests, call services, set status codes.
- **`services/`** — business logic: persistence, Binance pricing, `updateSignalStatus(signal)`.
- **`middleware/`** — global error handler and 404.
- **`utils/`** — validation, DTO mapping, decimals / ROI helpers.
- **`config/`** — env loading and Prisma client singleton.

**Frontend**

- **`services/api.js`** — single Axios instance and REST helpers.
- **`hooks/`** — `useSignals` (15s polling + manual refresh), `useNow` (tick for countdown).
- **`components/`** — signal form and dashboard table / mobile cards.
- **`pages/`** — dashboard composition.

**Signal status rules** (implemented in `backend/src/services/signalStatus.service.js`)

1. **Terminal:** `TARGET_HIT`, `STOPLOSS_HIT`, `EXPIRED` are never moved to another status.
2. **Expiry:** If `status === OPEN` and `now > expiry_time` → `EXPIRED`; then no further transitions.
3. **BUY:** `live >= target` → `TARGET_HIT`; `live <= stop_loss` → `STOPLOSS_HIT`.
4. **SELL:** `live <= target` → `TARGET_HIT`; `live >= stop_loss` → `STOPLOSS_HIT`.
5. **ROI % (2 decimals):** BUY `(current - entry) / entry * 100`; SELL `(entry - current) / entry * 100`. Persisted on terminal outcomes as `realized_roi`.

---

## Prerequisites

- **Node.js** 18+ (20+ recommended)
- **PostgreSQL** 14+ (with `gen_random_uuid()` — PostgreSQL 13+)

---

## Repository layout

```
TradingApp/
├── backend/          # Express + Prisma API
├── frontend/         # Vite + React + Tailwind UI
└── README.md
```

---

## Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env: set DATABASE_URL and optional PORT / BINANCE_BASE_URL
npm install
npx prisma generate
npx prisma migrate deploy   # or: npx prisma migrate dev --name init
npm run dev                 # http://localhost:4000 (default)
```

### Backend environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string, e.g. `postgresql://user:pass@localhost:5432/trading_signals?schema=public` |
| `PORT` | No | API port (default `4000`) |
| `BINANCE_BASE_URL` | No | Default `https://api.binance.com` (no trailing slash required) |

### Prisma commands

| Command | Purpose |
|---------|---------|
| `npx prisma generate` | Generate Prisma Client after schema changes |
| `npx prisma migrate dev` | Create and apply a migration in development |
| `npx prisma migrate deploy` | Apply migrations in CI / production |
| `npx prisma db push` | Push schema without migration files (prototyping only) |
| `npx prisma studio` | Open database GUI |

---

## Frontend setup

```bash
cd frontend
cp .env.example .env
# Set VITE_API_BASE_URL to your API base, e.g. http://localhost:4000/api
npm install
npm run dev          # http://localhost:5173
npm run build        # output in frontend/dist
```

### Frontend environment variables

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | REST base URL including `/api`, e.g. `http://localhost:4000/api` |

---

## PostgreSQL setup (local quick start)

**macOS (Homebrew)**

```bash
brew install postgresql@16
brew services start postgresql@16
createdb trading_signals
```

Build a connection string and place it in `backend/.env` as `DATABASE_URL`.

**Docker (alternative)**

```bash
docker run --name pg-signals -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=app -e POSTGRES_DB=trading_signals -p 5432:5432 -d postgres:16
# DATABASE_URL=postgresql://app:postgres@localhost:5432/trading_signals?schema=public
```

Then run `npx prisma migrate deploy` from `backend/`.

---

## REST API

Base path: `{origin}/api` (e.g. `http://localhost:4000/api`).

### `POST /signals`

Create a signal.

**Body (JSON)**

| Field | Type | Notes |
|-------|------|--------|
| `symbol` | string | Normalized to Binance style (e.g. `BTCUSDT`) |
| `direction` | `"BUY"` \| `"SELL"` | |
| `entry_price` | number | |
| `stop_loss` | number | BUY: &lt; entry; SELL: &gt; entry |
| `target_price` | number | BUY: &gt; entry; SELL: &lt; entry |
| `entry_time` | ISO 8601 | May be in the past |
| `expiry_time` | ISO 8601 | Must be after `entry_time` |

**Responses**

- `201` — `{ "success": true, "data": { ...signal } }`
- `400` — `{ "success": false, "error": "...", "details": [...] }`

### `GET /signals`

Returns all signals, refreshing status with Binance for each row (see business rules).

**Response:** `200` — `{ "success": true, "data": [ ... ] }`  
Each item may include `current_price`, `roi_percent`, and `price_error` if Binance failed for that symbol.

### `GET /signals/:id`

Single signal with live enrichment (same shape as list items).

**Responses:** `200` | `404`

### `DELETE /signals/:id`

**Responses:** `204` (no body) | `404`

### `GET /signals/:id/status`

Same enrichment as GET by id, with `meta.binance_error` when price lookup failed.

**Response:** `200` — `{ "success": true, "signal": { ... }, "meta": { "binance_error": null | string } }`

### `GET /health`

`200` — `{ "ok": true, "service": "trading-signals-api" }`

---

## Frontend behavior

- **Signal form:** client-side validation aligned with backend; loading state and inline errors; success toast on create.
- **Dashboard:** table on `md+`, stacked cards on small screens.
- **Auto-refresh:** `GET /signals` every **15 seconds** via `setInterval` in `useSignals`.
- **Countdown:** updates every second toward `expiry_time`.
- **Status badges:** color-coded (`OPEN`, `TARGET_HIT`, `STOPLOSS_HIT`, `EXPIRED`).

---

## Deployment (outline)

1. **Database:** managed PostgreSQL; set `DATABASE_URL`.
2. **Backend:** set env vars; `npm ci`; `npx prisma migrate deploy`; `npm start` (or run `node src/server.js` behind **PM2**, **systemd**, or a PaaS).
3. **Frontend:** build with `VITE_API_BASE_URL` pointing to the public API (e.g. `https://api.example.com/api`); deploy `frontend/dist` to **Netlify**, **Vercel**, **S3+CloudFront**, etc.
4. **CORS:** backend uses `cors({ origin: true })`; tighten `origin` to your frontend domain in production.

---

## Development scripts

| Location | Command | Purpose |
|----------|---------|---------|
| `backend/` | `npm run dev` | Nodemon + Express |
| `backend/` | `npm start` | Production-style start |
| `frontend/` | `npm run dev` | Vite dev server |
| `frontend/` | `npm run build` | Production bundle |

---

## License

Provided as sample application code for evaluation and extension.
