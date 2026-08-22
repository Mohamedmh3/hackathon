# Frontend (React + Vite)

## Run locally
```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Backend connection
- Default dev mode uses Vite proxy:
  - `/api/*` -> `http://localhost:4000/api/*`
- If you want direct API base URL, copy [.env.example](./.env.example) to `.env` and set:
  - `VITE_API_BASE_URL=http://localhost:4000`

## Auth integration
- Login/Register now call backend:
  - `POST /api/auth/login`
  - `POST /api/auth/register`
  - `GET /api/auth/me`
- Access token is stored in local storage session and restored on refresh.
