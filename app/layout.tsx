import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { TicketProvider, LoadingGate } from "@/lib/store"
import NavLinks from "@/app/NavLinks"

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
            <NavLinks />
            <span className="text-sm text-gray-500">{currentDate}</span>
          </nav>
          <main className="bg-gray-50 min-h-screen">
            <LoadingGate>{children}</LoadingGate>
          </main>
        </TicketProvider>
      </body>
    </html>
  )
}
