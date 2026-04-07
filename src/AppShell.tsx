import { Link, Outlet } from 'react-router-dom'

export function AppShell() {
  return (
    <div className="min-h-screen bg-glow">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <header className="flex items-center justify-between">
          
          <Link to="/" className="flex items-center gap-3">
            <img 
              src="/logo2.png" 
              alt="Task Grid Logo" 
              className="h-9 w-9 rounded-xl object-cover shadow-soft"
            />
            <div className="leading-tight">
              <div className="text-sm font-semibold text-text-1">
                Task Grid
              </div>
            </div>
          </Link>

        </header>

        <main className="mt-6">
          <Outlet />
        </main>

        <footer className="mt-8 border-t border-white/5 pt-6 text-xs text-text-3">
          Make Your Daily reminders.<br />
          @AyushGupta
        </footer>
      </div>
    </div>
  )
}
