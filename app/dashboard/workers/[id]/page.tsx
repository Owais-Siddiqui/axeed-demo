"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useTickets } from "@/lib/store"
import { Ticket, Urgency, Status } from "@/types/index"
import {
  ArrowLeft,
  Phone,
  Wrench,
  Building2,
  User,
  Clock,
  TicketCheck,
  Mail,
} from "lucide-react"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

// ─── Badges ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<Status, string> = {
  OPEN: "bg-slate-700 text-slate-300",
  ASSIGNED: "bg-blue-500/15 text-blue-400",
  IN_PROGRESS: "bg-amber-500/15 text-amber-400",
  COMPLETED: "bg-emerald-500/15 text-emerald-400",
}

const URGENCY_STYLES: Record<Urgency, string> = {
  low: "bg-emerald-500/15 text-emerald-400",
  medium: "bg-amber-500/15 text-amber-400",
  high: "bg-rose-500/15 text-rose-400",
}

function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[status]}`}>
      {status.replace("_", " ")}
    </span>
  )
}

function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${URGENCY_STYLES[urgency]}`}>
      {urgency}
    </span>
  )
}

// ─── FieldRow ─────────────────────────────────────────────────────────────────

function FieldRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-500 mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
        <div className="text-sm text-white">{children}</div>
      </div>
    </div>
  )
}

// ─── Ticket Card ──────────────────────────────────────────────────────────────

function TicketCard({ ticket, customerName }: { ticket: Ticket; customerName: string }) {
  return (
    <Link
      href={`/dashboard/tickets/${ticket.id}`}
      className="block bg-slate-800 border border-slate-700/50 rounded-xl p-4 hover:shadow-[0_0_15px_rgba(99,102,241,0.1)] hover:border-indigo-500/20 transition-all duration-150"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-mono text-xs font-semibold text-slate-400">{ticket.ticket_ref}</span>
        <div className="flex items-center gap-1.5">
          <UrgencyBadge urgency={ticket.urgency} />
          <StatusBadge status={ticket.status} />
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-sm text-slate-300 mb-1">
        <Wrench size={13} className="text-slate-500" />
        <span className="capitalize font-medium">{ticket.job_type}</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
        <Building2 size={12} className="text-slate-500" />
        <span className="font-mono">{ticket.property}</span>
      </div>
      {customerName && (
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
          <User size={12} className="text-slate-500" />
          <span>{customerName}</span>
        </div>
      )}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
        <Clock size={12} />
        <span>{fmtDateTime(ticket.created_at)}</span>
      </div>
    </Link>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { workers, tickets, customers, updateWorker } = useTickets()
  const router = useRouter()
  const [toggling, setToggling] = useState(false)

  const worker = workers.find(w => w.id === id)

  if (!worker) {
    return (
      <div className="p-6 text-sm text-slate-400">
        Worker not found.{" "}
        <button onClick={() => router.back()} className="text-indigo-400 underline">Go back</button>
      </div>
    )
  }

  async function handleToggleActive() {
    setToggling(true)
    try {
      await updateWorker(id, { is_active: !worker.is_active })
    } finally {
      setToggling(false)
    }
  }

  const workerTickets = tickets.filter(t => t.worker_id === id)
  const activeTickets = workerTickets.filter(t => t.status !== "COMPLETED")
  const pastTickets = workerTickets.filter(t => t.status === "COMPLETED")

  function getCustomerName(customerEmail: string) {
    return customers.find(c => c.email === customerEmail)?.full_name ?? ""
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/dashboard/workers")}
          className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-full transition-colors duration-150 text-slate-300"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white">{worker.full_name}</h1>
        <button
          onClick={handleToggleActive}
          disabled={toggling}
          title={worker.is_active ? "Click to set Inactive" : "Click to set Active"}
          className={`text-xs font-semibold px-2 py-0.5 rounded-full transition-colors duration-150 disabled:opacity-50 ${
            worker.is_active
              ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
              : "bg-slate-700 text-slate-500 hover:bg-slate-600"
          }`}
        >
          {toggling ? "Saving…" : worker.is_active ? "Active" : "Inactive"}
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {/* Worker info card */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase mb-4">Worker Details</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <FieldRow icon={<User size={16} />} label="Full Name">{worker.full_name}</FieldRow>
            <FieldRow icon={<Phone size={16} />} label="Phone">{worker.phone}</FieldRow>
            <FieldRow icon={<Mail size={16} />} label="Email">{worker.email || <span className="text-slate-500">—</span>}</FieldRow>
            <FieldRow icon={<Wrench size={16} />} label="Skills">
              {worker.skills.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {worker.skills.map(s => (
                    <span key={s} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full capitalize">
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-slate-500">—</span>
              )}
            </FieldRow>
            <FieldRow icon={<TicketCheck size={16} />} label="Open Tickets">
              <span className="font-mono font-semibold">{worker.open_tickets}</span>
            </FieldRow>
            <FieldRow icon={<span className="w-4 h-4 flex items-center justify-center text-slate-500">⚡</span>} label="Active Status">
              <div className="flex items-center gap-2 mt-0.5">
                <button
                  type="button"
                  onClick={handleToggleActive}
                  disabled={toggling}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-50 ${
                    worker.is_active ? "bg-emerald-500" : "bg-slate-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                      worker.is_active ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="text-sm text-slate-300">{worker.is_active ? "Active" : "Inactive"}</span>
              </div>
            </FieldRow>
          </div>
        </div>

        {/* Active tickets */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase mb-3">
            Active Tickets{" "}
            <span className="ml-1 bg-indigo-500/15 text-indigo-400 px-2 py-0.5 rounded-full text-xs normal-case font-semibold">
              {activeTickets.length}
            </span>
          </h2>
          {activeTickets.length === 0 ? (
            <p className="text-sm text-slate-400">No active tickets.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {activeTickets.map(t => (
                <TicketCard key={t.id} ticket={t} customerName={getCustomerName(t.customer_email)} />
              ))}
            </div>
          )}
        </div>

        {/* Past tickets */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase mb-3">
            Past Tickets{" "}
            <span className="ml-1 bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full text-xs normal-case font-semibold">
              {pastTickets.length}
            </span>
          </h2>
          {pastTickets.length === 0 ? (
            <p className="text-sm text-slate-400">No completed tickets.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {pastTickets.map(t => (
                <TicketCard key={t.id} ticket={t} customerName={getCustomerName(t.customer_email)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
