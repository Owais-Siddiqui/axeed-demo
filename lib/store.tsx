"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
  ReactNode,
} from "react"
import { Ticket, TicketEvent, Customer, Worker } from "@/types/index"

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
  customers: Customer[]
  workers: Worker[]
  tickets: Ticket[]
  ticketEvents: TicketEvent[]
  isLoading: boolean
  error: string | null
  addTicket: (ticket: Ticket) => Promise<Ticket | null>
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>
  deleteTicket: (id: string) => Promise<void>
  addEvent: (event: TicketEvent) => Promise<void>
  addCustomer: (customer: Customer) => Promise<void>
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>
  deleteCustomer: (id: string) => Promise<void>
  addWorker: (worker: Worker) => Promise<void>
  updateWorker: (id: string, updates: Partial<Worker>) => Promise<void>
  deleteWorker: (id: string) => Promise<void>
  dashboardState: DashboardState
  setDashboardState: Dispatch<SetStateAction<DashboardState>>
}

const TicketContext = createContext<TicketContextType | null>(null)

// ─── Provider ────────────────────────────────────────────────────────────────

export function TicketProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [ticketEvents, setTicketEvents] = useState<TicketEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardState, setDashboardState] = useState<DashboardState>(DEFAULT_DASHBOARD)

  useEffect(() => {
    async function loadAll() {
      try {
        setIsLoading(true)
        const res = await fetch("/api/data")
        if (!res.ok) {
          const { error } = await res.json()
          throw new Error(error ?? "Failed to load data")
        }
        const data = await res.json()
        setCustomers(data.customers as Customer[])
        setWorkers(data.workers as Worker[])
        setTickets(data.tickets as Ticket[])
        setTicketEvents(data.ticketEvents as TicketEvent[])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data")
      } finally {
        setIsLoading(false)
      }
    }
    loadAll()
  }, [])

  async function addTicket(ticket: Ticket): Promise<Ticket | null> {
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ticket),
    })
    if (res.ok) {
      const { data } = await res.json()
      setTickets(prev => [data as Ticket, ...prev])
      return data as Ticket
    }
    return null
  }

  async function updateTicket(id: string, updates: Partial<Ticket>) {
    const res = await fetch(`/api/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })
    if (res.ok) setTickets(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)))
  }

  async function deleteTicket(id: string) {
    const res = await fetch(`/api/tickets/${id}`, {
      method: "DELETE",
    })
    if (res.ok) setTickets(prev => prev.filter(t => t.id !== id))
  }

  async function addEvent(event: TicketEvent) {
    const res = await fetch("/api/ticket-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    })
    if (res.ok) {
      const { data } = await res.json()
      setTicketEvents(prev => [...prev, data as TicketEvent])
    }
  }

  async function addCustomer(customer: Customer) {
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customer),
    })
    if (res.ok) {
      const { data } = await res.json()
      setCustomers(prev => [...prev, data as Customer].sort((a, b) => a.full_name.localeCompare(b.full_name)))
    }
  }

  async function updateCustomer(id: string, updates: Partial<Customer>) {
    const res = await fetch(`/api/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })
    if (res.ok) setCustomers(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)))
  }

  async function deleteCustomer(id: string) {
    const res = await fetch(`/api/customers/${id}`, { method: "DELETE" })
    if (res.ok) setCustomers(prev => prev.filter(c => c.id !== id))
  }

  async function addWorker(worker: Worker) {
    const res = await fetch("/api/workers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(worker),
    })
    if (res.ok) {
      const { data } = await res.json()
      setWorkers(prev => [...prev, data as Worker].sort((a, b) => a.full_name.localeCompare(b.full_name)))
    }
  }

  async function updateWorker(id: string, updates: Partial<Worker>) {
    const res = await fetch(`/api/workers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })
    if (res.ok) setWorkers(prev => prev.map(w => (w.id === id ? { ...w, ...updates } : w)))
  }

  async function deleteWorker(id: string) {
    const res = await fetch(`/api/workers/${id}`, { method: "DELETE" })
    if (res.ok) setWorkers(prev => prev.filter(w => w.id !== id))
  }

  return (
    <TicketContext.Provider
      value={{
        customers,
        workers,
        tickets,
        ticketEvents,
        isLoading,
        error,
        addTicket,
        updateTicket,
        deleteTicket,
        addEvent,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addWorker,
        updateWorker,
        deleteWorker,
        dashboardState,
        setDashboardState,
      }}
    >
      {children}
    </TicketContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTickets() {
  const ctx = useContext(TicketContext)
  if (!ctx) throw new Error("useTickets must be used within TicketProvider")
  return ctx
}

// ─── LoadingGate ─────────────────────────────────────────────────────────────

export function LoadingGate({ children }: { children: ReactNode }) {
  const { isLoading, error } = useTickets()
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400 text-sm">
        Loading...
      </div>
    )
  }
  if (error) {
    return (
      <div className="p-6 text-red-600 text-sm">
        Error: {error}
      </div>
    )
  }
  return <>{children}</>
}
