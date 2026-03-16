"use client"

import { useEffect, useState, ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth, portalFor } from "@/lib/auth-context"
import { LoadingGate } from "@/lib/store"
import NavLinks from "@/app/NavLinks"
import { Menu, X } from "lucide-react"

function formatNavDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default function LayoutShell({ children }: { children: ReactNode }) {
  const { session, isAuthLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isLoginPage = pathname === "/login"

  // Close sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    if (isAuthLoading) return

    if (!session) {
      if (!isLoginPage) router.replace("/login")
      return
    }

    const correctPortal = portalFor(session.role)

    // If on login page and already logged in → redirect to portal
    if (isLoginPage) {
      router.replace(correctPortal)
      return
    }

    // Role-based access enforcement
    if (session.role !== "admin" && pathname.startsWith("/dashboard")) {
      router.replace(correctPortal)
      return
    }
    if (session.role === "customer" && pathname.startsWith("/portal/worker")) {
      router.replace(correctPortal)
      return
    }
    if (session.role === "worker" && pathname.startsWith("/portal/customer")) {
      router.replace(correctPortal)
      return
    }
    if (session.role === "admin" && pathname.startsWith("/portal/")) {
      router.replace(correctPortal)
      return
    }
  }, [session, isAuthLoading, pathname, isLoginPage, router])

  // Show spinner while determining auth state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-sm text-slate-500">Loading…</div>
      </div>
    )
  }

  // Login page: full-screen, no nav, no loading gate
  if (isLoginPage) {
    return <main className="bg-slate-950 min-h-screen">{children}</main>
  }

  // Not logged in yet: render nothing (redirect is in flight)
  if (!session) return null

  const currentDate = formatNavDate(new Date())

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 z-50 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <NavLinks />
        <div className="px-5 py-4 border-t border-slate-800">
          <p className="text-xs text-slate-500">{currentDate}</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="font-bold text-white text-sm">FacilitiesDesk</span>
        </div>
        <main className="flex-1">
          <LoadingGate>{children}</LoadingGate>
        </main>
      </div>
    </div>
  )
}
