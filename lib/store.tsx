"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { Ticket, TicketEvent } from "@/types/index"
import { mockTickets, mockTicketEvents } from "@/lib/mock-data"

interface TicketContextType {
  tickets: Ticket[]
  ticketEvents: TicketEvent[]
  addTicket: (ticket: Ticket) => void
  updateTicket: (id: string, updates: Partial<Ticket>) => void
  deleteTicket: (id: string) => void
  addEvent: (event: TicketEvent) => void
}

const TicketContext = createContext<TicketContextType | null>(null)

export function TicketProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets)
  const [ticketEvents, setTicketEvents] = useState<TicketEvent[]>(mockTicketEvents)

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
    <TicketContext.Provider value={{ tickets, ticketEvents, addTicket, updateTicket, deleteTicket, addEvent }}>
      {children}
    </TicketContext.Provider>
  )
}

export function useTickets() {
  const ctx = useContext(TicketContext)
  if (!ctx) throw new Error("useTickets must be used within TicketProvider")
  return ctx
}
