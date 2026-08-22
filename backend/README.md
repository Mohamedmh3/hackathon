# Backend Setup

## 1) Install dependencies
```bash
npm install
```

## 2) Configure environment
Copy `.env.example` to `.env` and set real Supabase values.

## 3) Apply SQL schema
Run `sql/001_mvp_schema.sql` in Supabase SQL Editor.
Then run `sql/002_transfer_flow_function.sql` for the Phase 5 transfer RPC.
Optional demo seed: run `sql/003_seed_syrian_mock_data.sql`.
Extended demo seed: run `sql/004_seed_syrian_extended_demo.sql`.
Reset demo data: run `sql/005_reset_demo_data.sql`.

## 4) Run locally
```bash
npm run dev
```

## 5) Validate
```bash
npm run typecheck
npm run build
npm test
```

## 6) Quick smoke check (manual)
1. Start API with `npm run dev`
2. Verify health endpoint: `GET /api/health`
3. Register + login via `/api/auth/register` and `/api/auth/login`
   - Register body: `{ "email": "user@example.com", "password": "Pass1234", "fullName": "User Name" }`
   - Login body: `{ "email": "user@example.com", "password": "Pass1234" }`
   - Password rule: 8-72 chars, must include letters and numbers
4. Use returned bearer token on protected endpoints
5. Test one flow end-to-end:
   - create sport → create club → create player → create contract
   - transfer player with `/api/contracts/transfer`
   - verify player profile + dashboard + public listing

## Language (English + Arabic)
- API defaults to English responses.
- Send `Accept-Language: ar` to receive Arabic for supported response messages (errors and core success messages).

## Phase 2 endpoints
- `GET /api/clubs` (auth)
- `POST /api/clubs` (admin)
- `PATCH /api/clubs/:id` (admin)
- `PATCH /api/clubs/:id/status` (admin)
- `GET /api/clubs/:id/stats` (admin, or club staff for their own club)
- `GET /api/sports` (auth)
- `POST /api/sports` (admin)
- `PATCH /api/sports/:id` (admin)
- `DELETE /api/sports/:id` (admin)

## Phase 3 endpoints
- `GET /api/players` (admin, club_staff)
- `POST /api/players` (admin, club_staff)
- `PATCH /api/players/:id` (admin, club_staff)
- `PATCH /api/players/:id/status` (admin, club_staff)
- `GET /api/players/:id/profile` (admin, club_staff, player with ownership check)
- `GET /api/players/me/profile` (player)

## Phase 4 endpoints
- `GET /api/contracts` (admin, club_staff)
- `POST /api/contracts` (admin, club_staff)
- `PATCH /api/contracts/:id` (admin, club_staff)
- `PATCH /api/contracts/:id/close` (admin, club_staff)
- `GET /api/contracts/expiring/soon?days=30` (admin, club_staff)
- `GET /api/contracts/me/active` (player)

## Phase 5 endpoint
- `POST /api/contracts/transfer` (admin, club_staff with source/destination club scope)

## Phase 6 endpoints
- `GET /api/players/:playerId/documents` (admin, club_staff)
- `POST /api/players/:playerId/documents` (admin, club_staff)
- `DELETE /api/players/:playerId/documents/:documentId` (admin, club_staff)
- `GET /api/players/:playerId/achievements` (admin, club_staff, player owner)
- `POST /api/players/:playerId/achievements` (admin, club_staff, player owner)
- `PATCH /api/players/:playerId/achievements/:achievementId` (admin, club_staff, player owner)
- `DELETE /api/players/:playerId/achievements/:achievementId` (admin, club_staff, player owner)

## Phase 7 endpoints
- `GET /api/dashboard/overview?days=30` (admin, club_staff)
- `GET /api/dashboard/players-by-status` (admin, club_staff)
- `GET /api/dashboard/players-by-sport` (admin, club_staff)
- `GET /api/dashboard/players-by-club` (admin, club_staff)
- `GET /api/dashboard/contracts-expiring?days=30` (admin, club_staff)

## Phase 8 endpoints
- `GET /api/public/players` (public)
- `GET /api/public/clubs` (public)
- `GET /api/favorites/me` (authenticated user)
- `POST /api/favorites/me` (authenticated user, exactly one of `playerId` or `clubId`)
- `DELETE /api/favorites/me/:favoriteId` (authenticated user)
