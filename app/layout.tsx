import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { TicketProvider } from "@/lib/store"
import { LayoutDashboard } from "lucide-react"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FacilitiesDesk",
  description: "Facilities management ticketing system",
}

function formatNavDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const currentDate = formatNavDate(new Date())

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <TicketProvider>
          <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-900">
              <LayoutDashboard size={20} />
              <span className="font-bold">FacilitiesDesk</span>
            </div>
            <span className="text-sm text-gray-500">{currentDate}</span>
          </nav>
          <main className="bg-gray-50 min-h-screen">
            {children}
          </main>
        </TicketProvider>
      </body>
    </html>
  )
}
