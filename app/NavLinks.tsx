"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, HardHat, Ticket, Briefcase, LogOut } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function NavLinks() {
  const pathname = usePathname()
  const { session, logout } = useAuth()

  if (!session) return null

  const { role, name } = session

  // Admin: full nav
  const adminLinks = [
    { href: "/dashboard", label: "Tickets", icon: <LayoutDashboard size={16} />, exact: true },
    { href: "/dashboard/customers", label: "Customers", icon: <Users size={16} />, exact: false },
    { href: "/dashboard/workers", label: "Workers", icon: <HardHat size={16} />, exact: false },
  ]

  // Customer: single link
  const customerLinks = [
    { href: "/portal/customer", label: "My Tickets", icon: <Ticket size={16} />, exact: false },
  ]

  // Worker: single link
  const workerLinks = [
    { href: "/portal/worker", label: "My Jobs", icon: <Briefcase size={16} />, exact: false },
  ]

  const links =
    role === "admin" ? adminLinks :
    role === "customer" ? customerLinks :
    workerLinks

  return (
    <div className="flex items-center gap-6">
      <span className="font-bold text-gray-900">FacilitiesDesk</span>
      <nav className="flex items-center gap-1">
        {links.map(({ href, label, icon, exact }) => {
          const active = exact
            ? pathname === href || pathname?.startsWith("/dashboard/tickets")
            : pathname?.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors duration-150 ${
                active
                  ? "bg-blue-50 text-blue-600 font-semibold"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {icon}
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div className="flex items-center gap-3 ml-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-800 leading-tight">{name}</p>
            <p className="text-xs text-gray-400 capitalize leading-tight">{role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          title="Sign out"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-150"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </div>
  )
}
