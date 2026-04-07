# Kanban Task Manager (React + Supabase)

A modern **black/grey**, Trello-style Kanban task manager for a developer portfolio.

## Features

- **Auth**: Supabase email/password signup + login
- **Boards**: create/delete multiple boards
- **Kanban**: To Do / In Progress / Done
- **Tasks**: create, edit, delete (title, description, due date, priority)
- **Drag & drop**: move tasks across columns with smooth UI
- **Search & filters**: search text + filter by priority + due date range
- **Optional realtime**: auto-refresh on DB changes (Supabase Realtime)
- **Toasts**: success/error loading states

## Setup (Supabase)

1. Create a Supabase project
2. In Supabase SQL Editor, run:
   - `supabase_schema.sql`
3. In Supabase Auth settings:
   - Enable Email auth (default)

## Local dev

1. Create `.env` (copy from `.env.example`)

```bash
cp .env.example .env
```

2. Fill:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

3. Install + run:

```bash
npm install
npm run dev
```

Open `http://localhost:5173/`.

## Build

```bash
npm run build
npm run preview
```
