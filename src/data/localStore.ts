import type { Board, TaskItem, TaskPriority, TaskStatus } from '../types'

type Store = {
  boards: Board[]
  tasks: TaskItem[]
}

const STORE_KEY = 'kanban_store_v1'

function nowIso() {
  return new Date().toISOString()
}

function uid() {
  return crypto.randomUUID()
}

function load(): Store {
  const raw = localStorage.getItem(STORE_KEY)
  if (!raw) return { boards: [], tasks: [] }
  try {
    return JSON.parse(raw) as Store
  } catch {
    return { boards: [], tasks: [] }
  }
}

function save(s: Store) {
  localStorage.setItem(STORE_KEY, JSON.stringify(s))
}

export async function listBoards(): Promise<Board[]> {
  const s = load()
  return s.boards.slice().sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function createBoard(name: string): Promise<Board> {
  const s = load()
  const b: Board = { id: uid(), name, created_at: nowIso() }
  s.boards.unshift(b)
  save(s)
  return b
}

export async function deleteBoard(boardId: string) {
  const s = load()
  s.boards = s.boards.filter((b) => b.id !== boardId)
  s.tasks = s.tasks.filter((t) => t.board_id !== boardId)
  save(s)
}

export async function listTasks(boardId: string): Promise<TaskItem[]> {
  const s = load()
  return s.tasks
    .filter((t) => t.board_id === boardId)
    .slice()
    .sort((a, b) => {
      if (a.status !== b.status) return a.status.localeCompare(b.status)
      if (a.position !== b.position) return a.position - b.position
      return a.created_at.localeCompare(b.created_at)
    })
}

export async function createTask(input: {
  board_id: string
  title: string
  description?: string | null
  due_date?: string | null
  priority?: TaskPriority
  status?: TaskStatus
  position?: number
}): Promise<TaskItem> {
  const s = load()
  const t: TaskItem = {
    id: uid(),
    board_id: input.board_id,
    title: input.title,
    description: input.description ?? null,
    due_date: input.due_date ?? null,
    priority: input.priority ?? 'medium',
    status: input.status ?? 'todo',
    position: input.position ?? 0,
    created_at: nowIso(),
    updated_at: nowIso(),
  }
  s.tasks.push(t)
  save(s)
  return t
}

export async function updateTask(
  taskId: string,
  patch: Partial<Pick<TaskItem, 'title' | 'description' | 'due_date' | 'priority' | 'status' | 'position'>>,
): Promise<TaskItem> {
  const s = load()
  const idx = s.tasks.findIndex((t) => t.id === taskId)
  if (idx < 0) throw new Error('Task not found')
  const next = { ...s.tasks[idx], ...patch, updated_at: nowIso() }
  s.tasks[idx] = next
  save(s)
  return next
}

export async function deleteTask(taskId: string) {
  const s = load()
  s.tasks = s.tasks.filter((t) => t.id !== taskId)
  save(s)
}

export async function bulkUpdatePositions(updates: Array<{ id: string; status: TaskStatus; position: number }>) {
  const s = load()
  const byId = new Map(s.tasks.map((t) => [t.id, t] as const))
  for (const u of updates) {
    const t = byId.get(u.id)
    if (!t) continue
    t.status = u.status
    t.position = u.position
    t.updated_at = nowIso()
  }
  save(s)
}

