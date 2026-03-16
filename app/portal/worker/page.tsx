"use client"

import { useState, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { useTickets } from "@/lib/store"
import { Ticket, Urgency, Status } from "@/types/index"
import {
  Wrench,
  CheckCircle2,
  Loader2,
  UserCheck,
  AlertCircle,
  MapPin,
  KeyRound,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    OPEN: "bg-slate-700 text-slate-300",
    ASSIGNED: "bg-blue-500/15 text-blue-400",
    IN_PROGRESS: "bg-amber-500/15 text-amber-400",
    COMPLETED: "bg-emerald-500/15 text-emerald-400",
  }
  const labels: Record<Status, string> = {
    OPEN: "Open",
    ASSIGNED: "Assigned",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
  }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  const styles: Record<Urgency, string> = {
    low: "bg-emerald-500/15 text-emerald-400",
    medium: "bg-amber-500/15 text-amber-400",
    high: "bg-rose-500/15 text-rose-400",
  }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[urgency]}`}>
      {urgency}
    </span>
  )
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  })
}

type FilterTab = "active" | "COMPLETED"

// ─── Component ───────────────────────────────────────────────────────────────

export default function WorkerPortal() {
  const { session } = useAuth()
  const { workers, tickets, customers, updateTicket } = useTickets()

  const [activeTab, setActiveTab] = useState<FilterTab>("active")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const worker = workers.find(w => w.id === session?.linkedId)

  const myTickets = useMemo(() =>
    tickets.filter(t => t.worker_id === worker?.id),
    [tickets, worker]
  )

  const filteredTickets = useMemo(() => {
    if (activeTab === "COMPLETED") return myTickets.filter(t => t.status === "COMPLETED")
    return myTickets.filter(t => t.status !== "COMPLETED")
  }, [myTickets, activeTab])

  const counts = useMemo(() => ({
    active: myTickets.filter(t => t.status !== "COMPLETED").length,
    COMPLETED: myTickets.filter(t => t.status === "COMPLETED").length,
  }), [myTickets])

  async function handleStatusUpdate(ticket: Ticket, newStatus: "IN_PROGRESS" | "COMPLETED") {
    setUpdatingId(ticket.id)
    const now = new Date().toISOString()
    const updates: Partial<Ticket> = {
      status: newStatus,
      updated_at: now,
      ...(newStatus === "IN_PROGRESS" ? { in_progress_at: now } : {}),
      ...(newStatus === "COMPLETED" ? { done_at: now } : {}),
    }
    await updateTicket(ticket.id, updates)
    setUpdatingId(null)
  }

  if (!worker) {
    return <div className="p-6 text-sm text-slate-500">Loading your profile…</div>
  }

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "active", label: "Active Jobs", count: counts.active },
    { key: "COMPLETED", label: "Completed", count: counts.COMPLETED },
  ]

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">

      {/* ── Worker Profile Card ── */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl font-bold">
            {worker.full_name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{worker.full_name}</h1>
            <p className="text-sm text-slate-400">{worker.phone}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
              worker.is_active ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-700 text-slate-500"
            }`}>
              {worker.is_active ? "Active" : "Inactive"}
            </span>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{counts.active}</p>
              <p className="text-xs text-slate-500">open jobs</p>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="flex items-center gap-2 mt-4">
          <Wrench size={14} className="text-slate-500" />
          <div className="flex flex-wrap gap-1.5">
            {worker.skills.map(skill => (
              <span key={skill} className="bg-slate-700 text-slate-300 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Jobs Section ── */}
      <div className="space-y-4">
        {/* Tab Bar */}
        <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm transition-colors duration-150 ${
                activeTab === tab.key
                  ? "bg-slate-700 text-white font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
              <span className={`text-xs font-medium rounded-full px-1.5 ${
                activeTab === tab.key ? "bg-amber-500/15 text-amber-400" : "bg-slate-700 text-slate-500"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {filteredTickets.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-10 text-center">
            <p className="text-slate-400 text-sm">
              {activeTab === "active" ? "No active jobs assigned to you." : "No completed jobs yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map(ticket => {
              const customer = customers.find(c => c.email === ticket.customer_email)
              return (
                <WorkerTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  customerName={customer?.full_name}
                  isUpdating={updatingId === ticket.id}
                  onStatusUpdate={handleStatusUpdate}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Worker Ticket Card ───────────────────────────────────────────────────────

function WorkerTicketCard({
  ticket,
  customerName,
  isUpdating,
  onStatusUpdate,
}: {
  ticket: Ticket
  customerName?: string
  isUpdating: boolean
  onStatusUpdate: (ticket: Ticket, status: "IN_PROGRESS" | "COMPLETED") => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden ${
      ticket.urgency === "high" ? "border-l-4 border-l-rose-500" :
      ticket.urgency === "medium" ? "border-l-4 border-l-amber-500" :
      "border-l-4 border-l-emerald-500"
    }`}>
      {/* Header row */}
      <div className="px-5 py-4 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-mono text-xs font-semibold text-slate-400">{ticket.ticket_ref}</span>
            <StatusBadge status={ticket.status} />
            <UrgencyBadge urgency={ticket.urgency} />
            <span className="text-xs text-slate-400 capitalize bg-slate-700 rounded-full px-2 py-0.5">{ticket.job_type}</span>
          </div>
          <p className="text-sm text-slate-200 font-medium line-clamp-2">{ticket.ai_summary}</p>
          {customerName && (
            <p className="text-xs text-slate-500 mt-1">Customer: {customerName} · {ticket.property}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Action buttons */}
          {ticket.status === "ASSIGNED" && (
            <button
              onClick={() => onStatusUpdate(ticket, "IN_PROGRESS")}
              disabled={isUpdating}
              className="flex items-center gap-1.5 bg-amber-500 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-amber-400 disabled:opacity-50 transition-colors duration-150"
            >
              <Loader2 size={13} />
              {isUpdating ? "Updating…" : "Start Job"}
            </button>
          )}
          {ticket.status === "IN_PROGRESS" && (
            <button
              onClick={() => onStatusUpdate(ticket, "COMPLETED")}
              disabled={isUpdating}
              className="flex items-center gap-1.5 bg-emerald-600 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-emerald-500 disabled:opacity-50 transition-colors duration-150"
            >
              <CheckCircle2 size={13} />
              {isUpdating ? "Updating…" : "Mark Done"}
            </button>
          )}
          {ticket.status === "COMPLETED" && (
            <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
              <CheckCircle2 size={14} />
              Completed
            </span>
          )}

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded-lg transition-colors duration-100"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-700/50 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ticket.eta_description && (
            <Detail icon={<Clock size={13} />} label="ETA" value={ticket.eta_description} />
          )}
          {ticket.location_notes && (
            <Detail icon={<MapPin size={13} />} label="Location" value={ticket.location_notes} />
          )}
          {ticket.access_instructions && (
            <Detail icon={<KeyRound size={13} />} label="Access Instructions" value={ticket.access_instructions} />
          )}
          <Detail icon={<AlertCircle size={13} />} label="Submitted" value={new Date(ticket.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })} />
          {ticket.done_at && (
            <Detail icon={<CheckCircle2 size={13} />} label="Completed On" value={new Date(ticket.done_at).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })} />
          )}
        </div>
      )}
    </div>
  )
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">
        {icon}
        {label}
      </div>
      <p className="text-sm text-slate-300">{value}</p>
    </div>
  )
}
