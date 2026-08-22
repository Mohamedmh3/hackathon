# Hackathon Project

This repository contains the full hackathon solution:
- [frontend/](frontend): React + Vite + TypeScript + Tailwind + shadcn/ui
- [backend/](backend): Node.js + Express + TypeScript + Supabase

## Quick Start

### 1) Install dependencies
```bash
npm install
```

### 2) Backend setup
Go to [backend/](backend) and follow [README.md](backend/README.md):
- configure `.env`
- apply SQL files in order
- run backend with `npm run dev`

### 3) Run tests
From [backend/](backend):
```bash
npm test
```

## Supabase SQL Order
Run these files from [backend/sql/](backend/sql):
1. [001_mvp_schema.sql](backend/sql/001_mvp_schema.sql)
2. [002_transfer_flow_function.sql](backend/sql/002_transfer_flow_function.sql)
3. [003_seed_syrian_mock_data.sql](backend/sql/003_seed_syrian_mock_data.sql)
4. [004_seed_syrian_extended_demo.sql](backend/sql/004_seed_syrian_extended_demo.sql)

Optional reset:
- [005_reset_demo_data.sql](backend/sql/005_reset_demo_data.sql)

## Security Note
- Environment files are ignored by git via [`.gitignore`](.gitignore).
- Never commit secrets (Supabase keys, DB passwords, JWT secrets).

## Project History
Conversation/work history is documented in [docs/chat-history.md](docs/chat-history.md).