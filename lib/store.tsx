"use client"

import { createContext, useContext, useState, Dispatch, SetStateAction, ReactNode } from "react"
import { Ticket, TicketEvent } from "@/types/index"
import { mockTickets, mockTicketEvents } from "@/lib/mock-data"

// ─── Dashboard state (persists across navigation) ────────────────────────────

export type DashboardState = {
  view: "table" | "kanban"
  search: string
  filterStatus: string
  filterJobType: string
  filterUrgency: string
  activeCard: string | null
}

const DEFAULT_DASHBOARD: DashboardState = {
  view: "table",
  search: "",
  filterStatus: "",
  filterJobType: "",
  filterUrgency: "",
  activeCard: null,
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface TicketContextType {
  tickets: Ticket[]
  ticketEvents: TicketEvent[]
  addTicket: (ticket: Ticket) => void
  updateTicket: (id: string, updates: Partial<Ticket>) => void
  deleteTicket: (id: string) => void
  addEvent: (event: TicketEvent) => void
  dashboardState: DashboardState
  setDashboardState: Dispatch<SetStateAction<DashboardState>>
}

const TicketContext = createContext<TicketContextType | null>(null)

export function TicketProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets)
  const [ticketEvents, setTicketEvents] = useState<TicketEvent[]>(mockTicketEvents)
  const [dashboardState, setDashboardState] = useState<DashboardState>(DEFAULT_DASHBOARD)

  function addTicket(ticket: Ticket) {
    setTickets(prev => [ticket, ...prev])
  }

  function updateTicket(id: string, updates: Partial<Ticket>) {
    setTickets(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)))
  }

  function deleteTicket(id: string) {
    setTickets(prev => prev.filter(t => t.id !== id))
  }

  function addEvent(event: TicketEvent) {
    setTicketEvents(prev => [...prev, event])
  }

  return (
    <TicketContext.Provider
      value={{ tickets, ticketEvents, addTicket, updateTicket, deleteTicket, addEvent, dashboardState, setDashboardState }}
    >
      {children}
    </TicketContext.Provider>
  )
}

export function useTickets() {
  const ctx = useContext(TicketContext)
  if (!ctx) throw new Error("useTickets must be used within TicketProvider")
  return ctx
}
