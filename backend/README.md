# Parcela API (NestJS + MongoDB)

REST API for sender bookings, recipient tracking, and station data.

## Stack

- **NestJS 11**
- **MongoDB** via Mongoose
- **SMS** via [mNotify](https://mnotify.com) (`/api/sms/quick`)

## Setup

### 1. MongoDB

Local (Docker):

```bash
docker run -d --name parcela-mongo -p 27017:27017 mongo:7
```

Or use [MongoDB Atlas](https://www.mongodb.com/atlas) and set `MONGODB_URI`.

### 2. Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | Mongo connection string |
| `MNOTIFY_API_KEY` | From mNotify dashboard |
| `MNOTIFY_SENDER_ID` | Approved sender ID (e.g. `Parcela`) |
| `MNOTIFY_ENABLED` | `true` to send real SMS; `false` logs only |
| `PUBLIC_WEB_URL` | Used in SMS tracking + portal links (production: `https://useparcela.com`) |
| `CORS_ORIGINS` | Web + Expo dev URLs |
| `SEED_ON_STARTUP` | `true` (default) — upsert stations on API start |
| `SEED_RESET` | `true` — remove legacy demo parcels from the database (one-off) |

### 3. Seed database

Stations are upserted automatically when the API starts (`SEED_ON_STARTUP=true`).

To seed manually without starting the HTTP server:

```bash
# from repo root
npm run seed

# or from backend/
npm run seed
npm run seed:reset   # remove legacy demo parcels, then sync stations
```

**Stations** — 27 VIP & STC terminals from `src/data/ghana-stations.ts`

### 4. Run

```bash
# from repo root
npm run api

# or from backend/
npm run start:dev
```

API: **http://localhost:3002/api**

Health check: `GET /api/health`

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Service health |
| `GET` | `/api/stations` | List stations (`?q=&operator=&lat=&lng=&excludeId=`) |
| `GET` | `/api/stations/:id` | Single station |
| `POST` | `/api/bookings` | Create pre-booking |
| `GET` | `/api/bookings/:reference` | Get booking by reference |
| `GET` | `/api/tracking/code/:code` | Track by pickup code or booking ref |
| `GET` | `/api/tracking/token/:token` | Track by link token |
| `GET` | `/api/parcels/pending` | Pending drop-offs (staff prep) |

### Create booking body

```json
{
  "stationId": "acc-kaneshie",
  "destinationStationId": "acc-circle-vip",
  "senderName": "Kofi Annan",
  "senderPhone": "0241234567",
  "recipientName": "Ama Mensah",
  "recipientPhone": "0559876543",
  "items": [
    { "parcelType": "box", "description": "Clothes", "fragile": false }
  ]
}
```

On success, sends booking SMS to sender (when `MNOTIFY_ENABLED=true`).

## Frontend wiring

- Web: `NEXT_PUBLIC_API_URL=http://localhost:3002/api` in `.env.local`
- Mobile: `EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:3002/api` (use machine IP, not `localhost`, on a physical device)
