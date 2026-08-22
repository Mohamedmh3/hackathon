# Project: [Your Hackathon Project Name]

hackathon project. Prioritize working code over perfect architecture. No deployment needed — only the GitHub repo is judged.

## Stack
- Frontend: React + Vite + TypeScript + Tailwind + shadcn/ui
- Backend: Node.js + Express + TypeScript
- Database: Supabase (Postgres)
- State management: React Query (@tanstack/react-query)
- Testing: Vitest

## Folder structure
- /frontend — Vite React app
  - /src/components — reusable UI components
  - /src/components/ui — shadcn/ui components
  - /src/pages — route-level views
  - /src/hooks/queries — React Query hooks
  - /src/lib/supabaseClient.ts — Supabase client init
  - /src/lib/api.ts — functions calling our backend
  - /src/lib/utils.ts — shadcn's cn() helper
- /backend
  - /src/routes — Express route definitions
  - /src/controllers — request handling logic
  - /src/services — business logic, Supabase queries
  - /src/middleware — auth/JWT middleware
  - /src/types — shared TypeScript types

## Conventions
- Functional React components only, use hooks.
- Type everything — no `any` unless truly unavoidable.
- Backend responses always shaped as: { success: boolean, data?: T, error?: string }
- Always wrap async DB/API calls in try/catch.
- Commit messages: type: short description (e.g. feat: add login form)
- Keep components small — split when a file exceeds ~150 lines.

## Supabase
- Use the Supabase JS client (@supabase/supabase-js) directly from backend services.
- Never hardcode Supabase keys — always read from environment variables.

## Before generating code
Briefly explain the approach in 1-2 sentences before writing it, so we can log it in AI_USAGE.md.