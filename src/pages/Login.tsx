import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { errorMessage } from '../lib/errors'

export function LoginPage() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const canSubmit = useMemo(() => email.trim() && password.trim(), [email, password])

  return (
    <div className="mx-auto max-w-md">
      <div className="glass rounded-2xl p-6 sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight text-text-1">Welcome back</h1>
        <p className="mt-2 text-sm text-text-2">Log in to your boards.</p>

        <form
          className="mt-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!canSubmit) return
            setLoading(true)
            const t = toast.loading('Signing in…')
            try {
              const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
              })
              if (error) throw error
              toast.success('Signed in', { id: t })
              nav('/app')
            } catch (err: unknown) {
              toast.error(errorMessage(err) || 'Login failed', { id: t })
            } finally {
              setLoading(false)
            }
          }}
        >
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" variant="primary" className="w-full" disabled={!canSubmit || loading}>
            {loading ? 'Signing in…' : 'Login'}
          </Button>
        </form>

        <div className="mt-5 text-center text-xs text-text-3">
          New here?{' '}
          <Link className="text-text-1 underline decoration-white/20 underline-offset-4" to="/signup">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  )
}

