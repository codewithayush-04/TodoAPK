-- Kanban Task Manager (Supabase) schema + RLS
-- Run this in Supabase SQL Editor.

create extension if not exists "pgcrypto";

-- Boards
create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- Tasks
create type if not exists public.task_status as enum ('todo', 'in_progress', 'done');
create type if not exists public.task_priority as enum ('low', 'medium', 'high');

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  priority public.task_priority not null default 'medium',
  status public.task_status not null default 'todo',
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_board_status_pos_idx on public.tasks(board_id, status, position);
create index if not exists boards_user_idx on public.boards(user_id);

-- Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at
before update on public.tasks
for each row execute procedure public.set_updated_at();

-- RLS
alter table public.boards enable row level security;
alter table public.tasks enable row level security;

-- Boards policies
drop policy if exists "boards_select_own" on public.boards;
create policy "boards_select_own" on public.boards
for select using (auth.uid() = user_id);

drop policy if exists "boards_insert_own" on public.boards;
create policy "boards_insert_own" on public.boards
for insert with check (auth.uid() = user_id);

drop policy if exists "boards_update_own" on public.boards;
create policy "boards_update_own" on public.boards
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "boards_delete_own" on public.boards;
create policy "boards_delete_own" on public.boards
for delete using (auth.uid() = user_id);

-- Tasks policies
drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own" on public.tasks
for select using (auth.uid() = user_id);

drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own" on public.tasks
for insert with check (auth.uid() = user_id);

drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own" on public.tasks
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own" on public.tasks
for delete using (auth.uid() = user_id);

