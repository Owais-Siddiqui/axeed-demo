"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, HardHat } from "lucide-react"

const links = [
  { href: "/dashboard", label: "Tickets", icon: <LayoutDashboard size={16} /> },
  { href: "/dashboard/customers", label: "Customers", icon: <Users size={16} /> },
  { href: "/dashboard/workers", label: "Workers", icon: <HardHat size={16} /> },
]

export default function NavLinks() {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-6">
      <span className="font-bold text-gray-900">FacilitiesDesk</span>
      <nav className="flex items-center gap-1">
        {links.map(({ href, label, icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard" || pathname?.startsWith("/dashboard/tickets")
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
    </div>
  )
}
