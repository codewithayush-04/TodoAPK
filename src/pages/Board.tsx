import { useEffect, useMemo, useState } from 'react'
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
  type DraggableProvided,
  type DraggableStateSnapshot,
  type DroppableProvided,
  type DroppableStateSnapshot,
} from 'react-beautiful-dnd'
import { format, isAfter, isBefore, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import { Link, useParams } from 'react-router-dom'
import { bulkUpdatePositions, createTask, deleteTask, listTasks, updateTask } from '../data/localStore'
import type { TaskItem, TaskPriority, TaskStatus } from '../types'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { errorMessage } from '../lib/errors'

const columns: Array<{ key: TaskStatus; title: string; hint: string }> = [
  { key: 'todo', title: 'To Do', hint: 'Queue up what’s next' },
  { key: 'in_progress', title: 'In Progress', hint: 'Focus zone' },
  { key: 'done', title: 'Done', hint: 'Ship it' },
]

function priorityLabel(p: TaskPriority) {
  return p === 'high' ? 'High' : p === 'medium' ? 'Medium' : 'Low'
}

function priorityPill(p: TaskPriority) {
  if (p === 'high') return 'border-red-500/20 bg-red-500/10 text-red-100'
  if (p === 'medium') return 'border-amber-500/20 bg-amber-500/10 text-amber-100'
  return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100'
}

function groupByStatus(items: TaskItem[]) {
  const map: Record<TaskStatus, TaskItem[]> = { todo: [], in_progress: [], done: [] }
  for (const t of items) map[t.status].push(t)
  for (const k of Object.keys(map) as TaskStatus[]) map[k].sort((a, b) => a.position - b.position)
  return map
}

function renumber(list: TaskItem[], status: TaskStatus) {
  return list.map((t, idx) => ({ ...t, status, position: idx }))
}

type EditorState =
  | { open: false }
  | {
      open: true
      mode: 'create' | 'edit'
      taskId?: string
      title: string
      description: string
      due_date: string
      priority: TaskPriority
      status: TaskStatus
    }

export function BoardPage() {
  const { boardId } = useParams()
  const id = boardId ?? ''

  const [loading, setLoading] = useState(true)
  const [all, setAll] = useState<TaskItem[]>([])
  const [q, setQ] = useState('')
  const [priority, setPriority] = useState<'all' | TaskPriority>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const [editor, setEditor] = useState<EditorState>({ open: false })

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    listTasks(id)
      .then((items) => {
        if (cancelled) return
        setAll(items)
      })
      .catch((e: unknown) => toast.error(errorMessage(e) || 'Failed to load tasks'))
      .finally(() => !cancelled && setLoading(false))

    return () => {
      cancelled = true
    }
  }, [id])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    const fromD = from ? parseISO(from) : null
    const toD = to ? parseISO(to) : null
    return all.filter((t) => {
      if (priority !== 'all' && t.priority !== priority) return false
      if (term) {
        const hay = `${t.title}\n${t.description ?? ''}`.toLowerCase()
        if (!hay.includes(term)) return false
      }
      if (fromD && t.due_date) {
        const due = parseISO(t.due_date)
        if (isBefore(due, fromD)) return false
      }
      if (toD && t.due_date) {
        const due = parseISO(t.due_date)
        if (isAfter(due, toD)) return false
      }
      if ((fromD || toD) && !t.due_date) return false
      return true
    })
  }, [all, q, priority, from, to])

  const byStatus = useMemo(() => groupByStatus(filtered), [filtered])

  function openCreate(status: TaskStatus) {
    setEditor({
      open: true,
      mode: 'create',
      title: '',
      description: '',
      due_date: '',
      priority: 'medium',
      status,
    })
  }

  function openEdit(t: TaskItem) {
    setEditor({
      open: true,
      mode: 'edit',
      taskId: t.id,
      title: t.title,
      description: t.description ?? '',
      due_date: t.due_date ?? '',
      priority: t.priority,
      status: t.status,
    })
  }

  async function persistColumn(status: TaskStatus, nextList: TaskItem[]) {
    const normalized = renumber(nextList, status)
    await bulkUpdatePositions(normalized.map((t) => ({ id: t.id, status: t.status, position: t.position })))
    setAll((prev) => {
      const other = prev.filter((t) => t.status !== status)
      const byId = new Map(prev.map((x) => [x.id, x] as const))
      const updated = normalized.map((t) => {
        const old = byId.get(t.id)
        return old ? { ...old, status: t.status, position: t.position } : t
      })
      return [...other, ...updated]
    })
  }

  async function onDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const srcStatus = source.droppableId as TaskStatus
    const dstStatus = destination.droppableId as TaskStatus

    const current = groupByStatus(all)
    const src = [...current[srcStatus]]
    const dst = srcStatus === dstStatus ? src : [...current[dstStatus]]

    const movingIdx = src.findIndex((t) => t.id === draggableId)
    if (movingIdx < 0) return
    const [moving] = src.splice(movingIdx, 1)
    dst.splice(destination.index, 0, { ...moving, status: dstStatus })

    // optimistic UI update for smoothness
    const nextAll = [
      ...all.filter((t) => t.status !== srcStatus && t.status !== dstStatus),
      ...renumber(src, srcStatus),
      ...renumber(dst, dstStatus),
    ]
    setAll(nextAll)

    const t = toast.loading('Updating…')
    try {
      if (srcStatus === dstStatus) {
        await persistColumn(srcStatus, dst)
      } else {
        await bulkUpdatePositions([
          ...renumber(src, srcStatus).map((x) => ({ id: x.id, status: x.status, position: x.position })),
          ...renumber(dst, dstStatus).map((x) => ({ id: x.id, status: x.status, position: x.position })),
        ])
      }
      toast.success('Updated', { id: t })
    } catch (e: unknown) {
      toast.error(errorMessage(e) || 'Update failed', { id: t })
      // fallback: refetch
      listTasks(id).then(setAll).catch(() => {})
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-text-3">
            <Link className="hover:text-text-1" to="/app">
              Boards
            </Link>
            <span></span>
            <span className="text-text-2"></span>
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text-1">Create Your Task</h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="Search tasks…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="sm:w-64"
          />
          <div className="flex gap-2">
            <select
              className="focus-ring rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-text-1"
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'all' | TaskPriority)}
            >
              <option value="all">All priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <Button
              variant="secondary"
              onClick={() => {
                setQ('')
                setPriority('all')
                setFrom('')
                setTo('')
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Input label="Due from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="Due to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="text-xs text-text-3">
          Showing <span className="text-text-2">{filtered.length}</span> task(s)
        </div>
      </div>

      <div className="mt-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid gap-4 lg:grid-cols-3">
            {columns.map((c) => (
              <div key={c.key} className="glass rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-text-1">{c.title}</div>
                    <div className="mt-1 text-xs text-text-3">{c.hint}</div>
                  </div>
                  <Button size="sm" variant="primary" onClick={() => openCreate(c.key)}>
                    + Task
                  </Button>
                </div>

                <Droppable droppableId={c.key}>
                  {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={[
                        'mt-4 min-h-[120px] space-y-3 rounded-2xl p-1 transition',
                        snapshot.isDraggingOver ? 'bg-white/[0.04]' : 'bg-transparent',
                      ].join(' ')}
                    >
                      {loading ? (
                        <>
                          <div className="h-20 rounded-2xl border border-white/10 bg-white/5" />
                          <div className="h-20 rounded-2xl border border-white/10 bg-white/5" />
                        </>
                      ) : byStatus[c.key].length ? (
                        byStatus[c.key].map((t, index) => (
                          <Draggable draggableId={t.id} index={index} key={t.id}>
                            {(
                              dragProvided: DraggableProvided,
                              dragSnapshot: DraggableStateSnapshot,
                            ) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                className={[
                                  'rounded-2xl border border-white/10 bg-black/20 p-4 shadow-card transition',
                                  dragSnapshot.isDragging ? 'rotate-[0.6deg] scale-[1.02]' : 'hover:border-white/15',
                                ].join(' ')}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="truncate text-sm font-semibold text-text-1">{t.title}</div>
                                    {t.description ? (
                                      <div className="mt-1 line-clamp-2 text-xs text-text-2">{t.description}</div>
                                    ) : null}
                                  </div>
                                  <div className="flex shrink-0 items-center gap-1">
                                    <button
                                      className="focus-ring rounded-lg px-2 py-1 text-xs text-text-3 transition hover:bg-white/5 hover:text-text-1"
                                      onClick={() => openEdit(t)}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      className="focus-ring rounded-lg px-2 py-1 text-xs text-text-3 transition hover:bg-white/5 hover:text-text-1"
                                      onClick={async () => {
                                        const toastId = toast.loading('Deleting…')
                                        try {
                                          await deleteTask(t.id)
                                          setAll((prev) => prev.filter((x) => x.id !== t.id))
                                          toast.success('Deleted', { id: toastId })
                                        } catch (e: unknown) {
                                          toast.error(errorMessage(e) || 'Delete failed', { id: toastId })
                                        }
                                      }}
                                    >
                                      Del
                                    </button>
                                  </div>
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  <span
                                    className={[
                                      'inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-semibold',
                                      priorityPill(t.priority),
                                    ].join(' ')}
                                  >
                                    {priorityLabel(t.priority)}
                                  </span>
                                  {t.due_date ? (
                                    <span className="text-[11px] font-semibold text-text-3">
                                      Due {format(parseISO(t.due_date), 'MMM d')}
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-text-3">No due date</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-5 text-sm text-text-2">
                          {q || priority !== 'all' || from || to
                            ? 'No tasks match the current filters.'
                            : 'No tasks yet. Add your first task.'}
                        </div>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      <Modal
        open={editor.open}
        onClose={() => setEditor({ open: false })}
        title={editor.open && editor.mode === 'edit' ? 'Edit task' : 'Create task'}
      >
        {editor.open ? (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault()
              const toastId = toast.loading(editor.mode === 'edit' ? 'Saving…' : 'Creating…')
              try {
                if (editor.mode === 'create') {
                  const current = groupByStatus(all)[editor.status]
                  const pos = current.length
                  const created = await createTask({
                    board_id: id,
                    title: editor.title.trim(),
                    description: editor.description.trim() ? editor.description.trim() : null,
                    due_date: editor.due_date || null,
                    priority: editor.priority,
                    status: editor.status,
                    position: pos,
                  })
                  setAll((prev) => [...prev, created])
                  toast.success('Task created', { id: toastId })
                } else {
                  const updated = await updateTask(editor.taskId!, {
                    title: editor.title.trim(),
                    description: editor.description.trim() ? editor.description.trim() : null,
                    due_date: editor.due_date || null,
                    priority: editor.priority,
                  })
                  setAll((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
                  toast.success('Saved', { id: toastId })
                }
                setEditor({ open: false })
              } catch (err: unknown) {
                toast.error(errorMessage(err) || 'Save failed', { id: toastId })
              }
            }}
          >
            <Input
              label="Title"
              placeholder="e.g. Ship landing page"
              value={editor.title}
              onChange={(e) => setEditor({ ...editor, title: e.target.value })}
            />
            <label className="block">
              <div className="mb-1 text-xs font-semibold text-text-2">Description</div>
              <textarea
                className="focus-ring w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-text-1 placeholder:text-text-3 shadow-soft/30 transition hover:border-white/15"
                rows={4}
                placeholder="What does done look like?"
                value={editor.description}
                onChange={(e) => setEditor({ ...editor, description: e.target.value })}
              />
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Due date"
                type="date"
                value={editor.due_date}
                onChange={(e) => setEditor({ ...editor, due_date: e.target.value })}
              />
              <label className="block">
                <div className="mb-1 text-xs font-semibold text-text-2">Priority</div>
                <select
                  className="focus-ring w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-text-1 hover:border-white/15"
                  value={editor.priority}
                  onChange={(e) => setEditor({ ...editor, priority: e.target.value as TaskPriority })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setEditor({ open: false })}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!editor.title.trim() || editor.title.trim().length < 2}
              >
                {editor.mode === 'edit' ? 'Save' : 'Create'}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  )
}

