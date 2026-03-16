"use client"

import { useEffect, ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth, portalFor } from "@/lib/auth-context"
import { LoadingGate } from "@/lib/store"
import NavLinks from "@/app/NavLinks"

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

  const isLoginPage = pathname === "/login"

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-sm text-gray-400">Loading…</div>
      </div>
    )
  }

  // Login page: full-screen, no nav, no loading gate
  if (isLoginPage) {
    return <main className="bg-gray-50 min-h-screen">{children}</main>
  }

  // Not logged in yet: render nothing (redirect is in flight)
  if (!session) return null

  const currentDate = formatNavDate(new Date())

  return (
    <>
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <NavLinks />
        <span className="text-sm text-gray-500">{currentDate}</span>
      </nav>
      <main className="bg-gray-50 min-h-screen">
        <LoadingGate>{children}</LoadingGate>
      </main>
    </>
  )
}
