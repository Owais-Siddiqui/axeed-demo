"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, HardHat, Ticket, Briefcase, LogOut, Building2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function NavLinks() {
  const pathname = usePathname()
  const { session, logout } = useAuth()

  if (!session) return null

  const { role, name } = session

  // Admin: full nav
  const adminLinks = [
    { href: "/dashboard", label: "Tickets", icon: <LayoutDashboard size={18} />, exact: true },
    { href: "/dashboard/customers", label: "Customers", icon: <Users size={18} />, exact: false },
    { href: "/dashboard/workers", label: "Workers", icon: <HardHat size={18} />, exact: false },
  ]

  // Customer: single link
  const customerLinks = [
    { href: "/portal/customer", label: "My Tickets", icon: <Ticket size={18} />, exact: false },
  ]

  // Worker: single link
  const workerLinks = [
    { href: "/portal/worker", label: "My Jobs", icon: <Briefcase size={18} />, exact: false },
  ]

  const links =
    role === "admin" ? adminLinks :
    role === "customer" ? customerLinks :
    workerLinks

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-6 flex items-center gap-3">
        <div className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-xl p-2 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
          <Building2 size={20} />
        </div>
        <span className="font-bold text-white text-lg tracking-tight">FacilitiesDesk</span>
      </div>

      {/* Navigation links */}
      <nav className="flex flex-col gap-1 px-3 flex-1">
        {links.map(({ href, label, icon, exact }) => {
          const active = exact
            ? pathname === href || pathname?.startsWith("/dashboard/tickets")
            : pathname?.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                active
                  ? "bg-indigo-500/10 text-indigo-400 font-semibold shadow-[inset_0_0_0_1px_rgba(99,102,241,0.15)]"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {icon}
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div className="mt-auto px-3 pb-5 pt-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-semibold">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white leading-tight truncate">{name}</p>
            <p className="text-xs text-slate-500 capitalize leading-tight">{role}</p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="flex items-center gap-1.5 p-2 rounded-lg text-sm text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors duration-150"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
