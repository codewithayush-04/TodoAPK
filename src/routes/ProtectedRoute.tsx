import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="glass rounded-2xl p-6">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

