"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useTickets } from "@/lib/store"
import { Ticket, Urgency, Status } from "@/types/index"
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  PhoneCall,
  ContactRound,
  FileWarning,
  AlertTriangle,
  Wrench,
  HardHat,
  Clock,
} from "lucide-react"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

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

function expiryStatus(dateStr: string): "expired" | "soon" | "ok" {
  const diff = (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  if (diff < 0) return "expired"
  if (diff <= 30) return "soon"
  return "ok"
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

function TicketCard({ ticket, workerName }: { ticket: Ticket; workerName: string }) {
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
      {workerName && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
          <HardHat size={12} className="text-gray-400" />
          <span>{workerName}</span>
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

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { customers, tickets, workers } = useTickets()
  const router = useRouter()

  const customer = customers.find(c => c.id === id)

  if (!customer) {
    return (
      <div className="p-6 text-sm text-gray-400">
        Customer not found.{" "}
        <button onClick={() => router.back()} className="text-blue-600 underline">Go back</button>
      </div>
    )
  }

  const customerTickets = tickets.filter(t => t.customer_email === customer.email)
  const activeTickets = customerTickets.filter(t => t.status !== "COMPLETED")
  const pastTickets = customerTickets.filter(t => t.status === "COMPLETED")
  const exp = expiryStatus(customer.contract_expiry)

  function getWorkerName(workerId: string | null) {
    if (!workerId) return ""
    return workers.find(w => w.id === workerId)?.full_name ?? ""
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/dashboard/customers")}
          className="p-1.5 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors duration-150 text-gray-700"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">{customer.full_name}</h1>
      </div>

      <div className="flex flex-col gap-6">
        {/* Customer info card */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Customer Details</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <FieldRow icon={<User size={16} />} label="Full Name">{customer.full_name}</FieldRow>
            <FieldRow icon={<Mail size={16} />} label="Email">{customer.email}</FieldRow>
            <FieldRow icon={<Phone size={16} />} label="Phone">{customer.phone}</FieldRow>
            <FieldRow icon={<Building2 size={16} />} label="Building">{customer.building_name}</FieldRow>
            <FieldRow icon={<MapPin size={16} />} label="Location">
              {[customer.unit_number, customer.floor, customer.area, customer.city].filter(Boolean).join(", ")}
            </FieldRow>
            <FieldRow icon={<PhoneCall size={16} />} label="Emergency Contact">
              {customer.emergency_contact ?? <span className="text-gray-400">—</span>}
            </FieldRow>
            <FieldRow icon={<ContactRound size={16} />} label="Preferred Contact">
              <span className="capitalize">{customer.preferred_contact}</span>
            </FieldRow>
            <FieldRow icon={<FileWarning size={16} />} label="Contract Expiry">
              <span className={exp !== "ok" ? (exp === "expired" ? "text-red-600" : "text-amber-600") : ""}>
                {fmtDate(customer.contract_expiry)}
              </span>
              {exp === "soon" && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  <AlertTriangle size={11} /> Expiring Soon
                </span>
              )}
              {exp === "expired" && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                  <AlertTriangle size={11} /> Expired
                </span>
              )}
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
                <TicketCard key={t.id} ticket={t} workerName={getWorkerName(t.worker_id)} />
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
                <TicketCard key={t.id} ticket={t} workerName={getWorkerName(t.worker_id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
