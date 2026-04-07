import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { errorMessage } from '../lib/errors'

export function SignupPage() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const canSubmit = useMemo(() => email.trim() && password.trim().length >= 6, [email, password])

  return (
    <div className="mx-auto max-w-md">
      <div className="glass rounded-2xl p-6 sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight text-text-1">Create account</h1>
        <p className="mt-2 text-sm text-text-2">Start building boards in seconds.</p>

        <form
          className="mt-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!canSubmit) return
            setLoading(true)
            const t = toast.loading('Creating account…')
            try {
              const { error } = await supabase.auth.signUp({
                email,
                password,
              })
              if (error) throw error
              toast.success('Account created', { id: t })
              nav('/app')
            } catch (err: unknown) {
              toast.error(errorMessage(err) || 'Signup failed', { id: t })
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
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint="Supabase requires 6+ characters by default."
          />
          <Button type="submit" variant="primary" className="w-full" disabled={!canSubmit || loading}>
            {loading ? 'Creating…' : 'Sign up'}
          </Button>
        </form>

        <div className="mt-5 text-center text-xs text-text-3">
          Already have an account?{' '}
          <Link className="text-text-1 underline decoration-white/20 underline-offset-4" to="/login">
            Log in
          </Link>
        </div>
      </div>
    </div>
  )
}

