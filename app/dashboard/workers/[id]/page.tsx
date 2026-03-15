"use client"

import { use } from "react"
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
  OPEN: "bg-gray-100 text-gray-700",
  ASSIGNED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
}

const URGENCY_STYLES: Record<Urgency, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
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
      <span className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <div className="text-sm text-gray-900">{children}</div>
      </div>
    </div>
  )
}

// ─── Ticket Card ──────────────────────────────────────────────────────────────

function TicketCard({ ticket, customerName }: { ticket: Ticket; customerName: string }) {
  return (
    <Link
      href={`/dashboard/tickets/${ticket.id}`}
      className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-200 transition-all duration-150"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-mono text-xs font-semibold text-gray-500">{ticket.ticket_ref}</span>
        <div className="flex items-center gap-1.5">
          <UrgencyBadge urgency={ticket.urgency} />
          <StatusBadge status={ticket.status} />
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-sm text-gray-700 mb-1">
        <Wrench size={13} className="text-gray-400" />
        <span className="capitalize font-medium">{ticket.job_type}</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
        <Building2 size={12} className="text-gray-400" />
        <span className="font-mono">{ticket.property}</span>
      </div>
      {customerName && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
          <User size={12} className="text-gray-400" />
          <span>{customerName}</span>
        </div>
      )}
      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-2">
        <Clock size={12} />
        <span>{fmtDateTime(ticket.created_at)}</span>
      </div>
    </Link>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { workers, tickets, customers } = useTickets()
  const router = useRouter()

  const worker = workers.find(w => w.id === id)

  if (!worker) {
    return (
      <div className="p-6 text-sm text-gray-400">
        Worker not found.{" "}
        <button onClick={() => router.back()} className="text-blue-600 underline">Go back</button>
      </div>
    )
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
          className="p-1.5 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors duration-150 text-gray-700"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">{worker.full_name}</h1>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            worker.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {worker.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="flex flex-col gap-6">
        {/* Worker info card */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Worker Details</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <FieldRow icon={<User size={16} />} label="Full Name">{worker.full_name}</FieldRow>
            <FieldRow icon={<Phone size={16} />} label="Phone">{worker.phone}</FieldRow>
            <FieldRow icon={<Wrench size={16} />} label="Skills">
              {worker.skills.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {worker.skills.map(s => (
                    <span key={s} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full capitalize">
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </FieldRow>
            <FieldRow icon={<TicketCheck size={16} />} label="Open Tickets">
              <span className="font-mono font-semibold">{worker.open_tickets}</span>
            </FieldRow>
          </div>
        </div>

        {/* Active tickets */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">
            Active Tickets{" "}
            <span className="ml-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs normal-case font-semibold">
              {activeTickets.length}
            </span>
          </h2>
          {activeTickets.length === 0 ? (
            <p className="text-sm text-gray-400">No active tickets.</p>
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
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">
            Past Tickets{" "}
            <span className="ml-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs normal-case font-semibold">
              {pastTickets.length}
            </span>
          </h2>
          {pastTickets.length === 0 ? (
            <p className="text-sm text-gray-400">No completed tickets.</p>
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
