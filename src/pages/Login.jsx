import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login, error } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    const user = await login(email, password)
    setSubmitting(false)
    if (user) navigate(`/${user.role}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-navy px-4">
      <div className="w-full max-w-sm bg-white p-8">
        <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
        <p className="text-sm text-slate-500 mt-1">Meridian Hospital System</p>

        {error && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 px-3 py-2">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your email"
              required
              className="mt-1 w-full border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-accent"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="mt-1 w-full border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-accent"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-brand-accent py-2.5 text-sm font-medium text-white hover:bg-brand-accent-dark disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-500">
          Forgot your password? Contact your administrator to have it reset.
        </p>
      </div>
    </div>
  )
}