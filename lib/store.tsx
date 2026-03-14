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
import { supabase } from "@/lib/supabase"
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
  addTicket: (ticket: Ticket) => Promise<void>
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>
  deleteTicket: (id: string) => Promise<void>
  addEvent: (event: TicketEvent) => Promise<void>
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
        const [cusRes, wrkRes, tktRes, evtRes] = await Promise.all([
          supabase.from("customers").select("*").order("full_name"),
          supabase.from("workers").select("*").order("full_name"),
          supabase.from("tickets").select("*").order("created_at", { ascending: false }),
          supabase.from("ticket_events").select("*").order("created_at"),
        ])
        if (cusRes.error) throw new Error(cusRes.error.message)
        if (wrkRes.error) throw new Error(wrkRes.error.message)
        if (tktRes.error) throw new Error(tktRes.error.message)
        if (evtRes.error) throw new Error(evtRes.error.message)
        setCustomers(cusRes.data as Customer[])
        setWorkers(wrkRes.data as Worker[])
        setTickets(tktRes.data as Ticket[])
        setTicketEvents(evtRes.data as TicketEvent[])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data")
      } finally {
        setIsLoading(false)
      }
    }
    loadAll()
  }, [])

  async function addTicket(ticket: Ticket) {
    const { error } = await supabase.from("tickets").insert(ticket)
    if (!error) setTickets(prev => [ticket, ...prev])
  }

  async function updateTicket(id: string, updates: Partial<Ticket>) {
    const { error } = await supabase.from("tickets").update(updates).eq("id", id)
    if (!error) setTickets(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)))
  }

  async function deleteTicket(id: string) {
    const { error } = await supabase.from("tickets").delete().eq("id", id)
    if (!error) setTickets(prev => prev.filter(t => t.id !== id))
  }

  async function addEvent(event: TicketEvent) {
    const { error } = await supabase.from("ticket_events").insert(event)
    if (!error) setTicketEvents(prev => [...prev, event])
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
