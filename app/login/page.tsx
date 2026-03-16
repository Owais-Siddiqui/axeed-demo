"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, portalFor } from "@/lib/auth-context"
import { Building2, Lock, Mail, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const { login, session, isAuthLoading } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // If already logged in, redirect to the correct portal
  useEffect(() => {
    if (!isAuthLoading && session) {
      router.replace(portalFor(session.role))
    }
  }, [session, isAuthLoading, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const err = await login(email.trim(), password)
    setLoading(false)
    if (err) {
      setError(err)
    }
    // Successful login: useEffect above will redirect
  }

  if (isAuthLoading) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/50 to-slate-950 flex items-center justify-center px-4">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 w-full max-w-md animate-slideInUp">

        {/* Logo / Branding */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-xl p-2.5 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            <Building2 size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">FacilitiesDesk</h1>
            <p className="text-xs text-slate-400">Facilities Management System</p>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-white mb-1">Sign in</h2>
        <p className="text-sm text-slate-400 mb-6">Enter your credentials to access your account.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500/50 transition-all duration-200"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full pl-9 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500/50 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-lg py-2.5 text-sm font-medium hover:from-indigo-400 hover:to-violet-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* Quick-login hints for demo */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Demo accounts</p>
          <div className="space-y-1.5">
            {[
              { label: "Admin", email: "admin@facilitiesdesk.com", pw: "admin123" },
              { label: "Customer (Sara)", email: "sara.ibrahim@email.com", pw: "sara123" },
              { label: "Worker (Hassan)", email: "hassan@facilitiesdesk.com", pw: "hassan123" },
            ].map(acc => (
              <button
                key={acc.email}
                type="button"
                onClick={() => { setEmail(acc.email); setPassword(acc.pw); setError(null) }}
                className="w-full text-left flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-3 py-2 hover:bg-white/10 hover:border-indigo-500/30 transition-all duration-200"
              >
                <span className="text-sm font-medium text-slate-200">{acc.label}</span>
                <span className="text-xs text-slate-500 font-mono">{acc.email}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
