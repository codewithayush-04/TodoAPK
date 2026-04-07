export type Board = {
  id: string
  name: string
  created_at: string
}

export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export type TaskItem = {
  id: string
  board_id: string
  title: string
  description: string | null
  due_date: string | null
  priority: TaskPriority
  status: TaskStatus
  position: number
  created_at: string
  updated_at: string
}

