import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { createBoard, deleteBoard, listBoards } from '../data/localStore'
import type { Board } from '../types'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { errorMessage } from '../lib/errors'

export function DashboardPage() {
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')

  const canCreate = useMemo(() => name.trim().length >= 2, [name])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    listBoards()
      .then((b) => {
        if (cancelled) return
        setBoards(b)
      })
      .catch((e: unknown) => toast.error(errorMessage(e) || 'Failed to load boards'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-1">Boards</h1>
          <p className="mt-1 text-sm text-text-2">Create multiple boards and manage tasks Trello-style.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-3"></span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr,360px]">
        <div className="glass rounded-2xl p-5">
          <div className="text-sm font-semibold text-text-1">Your boards</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {loading ? (
              <>
                <div className="h-24 rounded-2xl border border-white/10 bg-white/5" />
                <div className="h-24 rounded-2xl border border-white/10 bg-white/5" />
              </>
            ) : boards.length ? (
              boards.map((b) => (
                <div
                  key={b.id}
                  className="group rounded-2xl border border-white/10 bg-black/20 p-4 shadow-card transition hover:border-white/15"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-text-1">{b.name}</div>
                      <div className="mt-1 text-xs text-text-3">Board</div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 transition group-hover:opacity-100"
                      onClick={async () => {
                        const t = toast.loading('Deleting board…')
                        try {
                          await deleteBoard(b.id)
                          setBoards((prev) => prev.filter((x) => x.id !== b.id))
                          toast.success('Board deleted', { id: t })
                        } catch (e: unknown) {
                          toast.error(errorMessage(e) || 'Delete failed', { id: t })
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                  <div className="mt-4">
                    <Link
                      to={`/b/${b.id}`}
                      className="focus-ring inline-flex items-center rounded-xl border border-white/10 bg-panel-1 px-3 py-2 text-xs font-semibold text-text-1 shadow-soft transition hover:border-white/15"
                    >
                      Open board →
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="sm:col-span-2 rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-text-2">
                No boards yet. Create your first board on the right.
              </div>
            )}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="text-sm font-semibold text-text-1">Create a board</div>
          <form
            className="mt-4 space-y-3"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!canCreate) return
              const t = toast.loading('Creating board…')
              try {
                const b = await createBoard(name.trim())
                setBoards((prev) => [b, ...prev])
                setName('')
                toast.success('Board created', { id: t })
              } catch (err: unknown) {
                toast.error(errorMessage(err) || 'Create failed', { id: t })
              }
            }}
          >
            <Input label="Board name" placeholder="e.g. Personal Sprint" value={name} onChange={(e) => setName(e.target.value)} />
            <Button type="submit" variant="primary" className="w-full" disabled={!canCreate}>
              Create board
            </Button>
            <p className="text-xs text-text-3">
              Tip: you can make multiple boards for work, personal, or portfolio projects.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

