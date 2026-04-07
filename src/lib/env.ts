function warnOnce(msg: string) {
  if (typeof window === 'undefined') return
  const w = window as unknown as { __envWarned?: Set<string> }
  w.__envWarned ??= new Set<string>()
  const set = w.__envWarned
  if (set.has(msg)) return
  set.add(msg)
  console.warn(msg)
}

const rawUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseUrl =
  rawUrl && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')
    ? `https://${rawUrl}`
    : rawUrl
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

if (!supabaseUrl || !supabaseAnonKey) {
  warnOnce(
    'Supabase env missing. Create a .env (copy .env.example) and set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY.',
  )
}

export const env = { supabaseUrl, supabaseAnonKey }

