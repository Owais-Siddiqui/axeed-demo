"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import { AuthSession, UserRole } from "@/types/index"

const STORAGE_KEY = "fd_session"

interface AuthContextType {
  session: AuthSession | null
  isAuthLoading: boolean
  login: (email: string, password: string) => Promise<string | null>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setSession(JSON.parse(stored))
    } catch {
      // ignore
    }
    setIsAuthLoading(false)
  }, [])

  async function login(email: string, password: string): Promise<string | null> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) return data.error ?? "Login failed"
    const s: AuthSession = data.session
    setSession(s)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    return null
  }

  function logout() {
    setSession(null)
    localStorage.removeItem(STORAGE_KEY)
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ session, isAuthLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}

// Role-based redirect helpers
export function portalFor(role: UserRole): string {
  if (role === "admin") return "/dashboard"
  if (role === "customer") return "/portal/customer"
  return "/portal/worker"
}
