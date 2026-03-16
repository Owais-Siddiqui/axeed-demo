import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { TicketProvider } from "@/lib/store"
import { AuthProvider } from "@/lib/auth-context"
import LayoutShell from "@/app/LayoutShell"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FacilitiesDesk",
  description: "Facilities management ticketing system",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <TicketProvider>
            <LayoutShell>{children}</LayoutShell>
          </TicketProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
