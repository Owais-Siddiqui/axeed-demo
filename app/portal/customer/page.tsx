"use client"

import { useState, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { useTickets } from "@/lib/store"
import { Ticket, Urgency, Status } from "@/types/index"
import {
  Plus,
  X,
  Inbox,
  CheckCircle2,
  Loader2,
  UserCheck,
  Building2,
  MapPin,
  Calendar,
  Phone,
  Mail,
  MessageCircle,
  AlertCircle,
} from "lucide-react"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    OPEN: "bg-gray-100 text-gray-700",
    ASSIGNED: "bg-blue-100 text-blue-700",
    IN_PROGRESS: "bg-amber-100 text-amber-700",
    COMPLETED: "bg-green-100 text-green-700",
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
    low: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-red-100 text-red-700",
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

function fmtShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

const SELECT_CLS = "border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"

type FilterTab = "all" | Status

type FormState = {
  jobType: string
  urgency: Urgency
  locationNotes: string
  accessInstructions: string
  jobDescription: string
}

const EMPTY_FORM: FormState = {
  jobType: "plumbing",
  urgency: "low",
  locationNotes: "",
  accessInstructions: "",
  jobDescription: "",
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CustomerPortal() {
  const { session } = useAuth()
  const { customers, workers, tickets, addTicket } = useTickets()

  const [activeTab, setActiveTab] = useState<FilterTab>("all")
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // Find this customer's record
  const customer = customers.find(c => c.id === session?.linkedId)

  // Filter tickets for this customer only
  const myTickets = useMemo(() =>
    tickets.filter(t => t.customer_email === customer?.email),
    [tickets, customer]
  )

  const filteredTickets = useMemo(() => {
    if (activeTab === "all") return myTickets
    return myTickets.filter(t => t.status === activeTab)
  }, [myTickets, activeTab])

  const counts = useMemo(() => ({
    all: myTickets.length,
    OPEN: myTickets.filter(t => t.status === "OPEN").length,
    ASSIGNED: myTickets.filter(t => t.status === "ASSIGNED").length,
    IN_PROGRESS: myTickets.filter(t => t.status === "IN_PROGRESS").length,
    COMPLETED: myTickets.filter(t => t.status === "COMPLETED").length,
  }), [myTickets])

  async function handleSubmit() {
    if (!customer || !form.jobDescription.trim()) return
    setSaving(true)
    const maxNum = tickets.reduce((max, t) => {
      const n = parseInt(t.ticket_ref.replace("TKT-", "") || "0")
      return n > max ? n : max
    }, 0)
    const ticketRef = `TKT-${String(maxNum + 1).padStart(4, "0")}`
    const now = new Date().toISOString()
    const newTicket: Ticket = {
      id: "",
      ticket_ref: ticketRef,
      customer_email: customer.email,
      worker_id: null,
      property: customer.property_ref,
      job_type: form.jobType,
      urgency: form.urgency,
      status: "OPEN",
      ai_summary: form.jobDescription,
      eta_description: null,
      location_notes: form.locationNotes || null,
      access_instructions: form.accessInstructions || null,
      reported_via: "email",
      resolution_notes: null,
      attachments: [],
      completion_photos: [],
      assigned_at: null,
      in_progress_at: null,
      done_at: null,
      created_at: now,
      updated_at: now,
    }
    await addTicket(newTicket)
    setSaving(false)
    setShowModal(false)
    setForm(EMPTY_FORM)
  }

  if (!customer) {
    return (
      <div className="p-6 text-sm text-gray-500">Loading your profile…</div>
    )
  }

  const contractDate = new Date(customer.contract_expiry)
  const now = new Date()
  const daysToExpiry = Math.ceil((contractDate.getTime() - now.getTime()) / 86_400_000)
  const contractStatus =
    daysToExpiry < 0 ? "expired" :
    daysToExpiry <= 30 ? "soon" : "ok"

  const tabs: { key: FilterTab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "all", label: "All", icon: <Inbox size={14} />, count: counts.all },
    { key: "OPEN", label: "Open", icon: <AlertCircle size={14} />, count: counts.OPEN },
    { key: "ASSIGNED", label: "Assigned", icon: <UserCheck size={14} />, count: counts.ASSIGNED },
    { key: "IN_PROGRESS", label: "In Progress", icon: <Loader2 size={14} />, count: counts.IN_PROGRESS },
    { key: "COMPLETED", label: "Completed", icon: <CheckCircle2 size={14} />, count: counts.COMPLETED },
  ]

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">

      {/* ── Profile Card ── */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold">
              {customer.full_name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{customer.full_name}</h1>
              <p className="text-sm text-gray-500">{customer.email}</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors duration-150 shrink-0"
          >
            <Plus size={16} />
            Raise a Ticket
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <InfoTile icon={<Building2 size={15} />} label="Building" value={customer.building_name} />
          <InfoTile icon={<MapPin size={15} />} label="Unit" value={`${customer.unit_number}${customer.floor ? `, ${customer.floor}` : ""}`} />
          <InfoTile icon={<MapPin size={15} />} label="Area" value={`${customer.area}, ${customer.city}`} />
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Calendar size={15} />
              Contract Expiry
            </div>
            <span
              className={`text-sm font-semibold ${
                contractStatus === "expired" ? "text-red-600" :
                contractStatus === "soon" ? "text-amber-600" :
                "text-gray-900"
              }`}
            >
              {fmtShortDate(customer.contract_expiry)}
            </span>
            {contractStatus === "expired" && <span className="text-xs text-red-500">Expired</span>}
            {contractStatus === "soon" && <span className="text-xs text-amber-500">Expires in {daysToExpiry}d</span>}
          </div>
        </div>
      </div>

      {/* ── Tickets Section ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Your Tickets</h2>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors duration-150 ${
                activeTab === tab.key
                  ? "bg-white text-gray-900 font-semibold shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.icon}
              {tab.label}
              <span className={`text-xs font-medium rounded-full px-1.5 ${
                activeTab === tab.key ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-500"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Ticket Cards */}
        {filteredTickets.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <p className="text-gray-400 text-sm">No tickets in this category.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map(ticket => {
              const worker = workers.find(w => w.id === ticket.worker_id)
              return (
                <TicketCard key={ticket.id} ticket={ticket} workerName={worker?.full_name} />
              )
            })}
          </div>
        )}
      </div>

      {/* ── New Ticket Modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto"
          onClick={() => { setShowModal(false); setForm(EMPTY_FORM) }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full mx-auto mt-24 mb-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Raise a New Ticket</h2>
              <button
                onClick={() => { setShowModal(false); setForm(EMPTY_FORM) }}
                className="hover:bg-gray-100 rounded-full p-1 text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Read-only customer info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                  <input readOnly value={customer.full_name} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-gray-50 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
                  <input readOnly value={customer.property_ref} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-gray-50 cursor-not-allowed" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                  <select
                    value={form.jobType}
                    onChange={e => setForm(f => ({ ...f, jobType: e.target.value }))}
                    className={`w-full ${SELECT_CLS}`}
                  >
                    {["plumbing", "electrical", "hvac", "carpentry", "general"].map(j => (
                      <option key={j} value={j} className="capitalize">{j.charAt(0).toUpperCase() + j.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                  <select
                    value={form.urgency}
                    onChange={e => setForm(f => ({ ...f, urgency: e.target.value as Urgency }))}
                    className={`w-full ${SELECT_CLS}`}
                  >
                    {(["low", "medium", "high"] as Urgency[]).map(u => (
                      <option key={u} value={u} className="capitalize">{u.charAt(0).toUpperCase() + u.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location Notes</label>
                <input
                  type="text"
                  value={form.locationNotes}
                  onChange={e => setForm(f => ({ ...f, locationNotes: e.target.value }))}
                  placeholder="e.g. Kitchen, under the sink on the left side"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Access Instructions</label>
                <input
                  type="text"
                  value={form.accessInstructions}
                  onChange={e => setForm(f => ({ ...f, accessInstructions: e.target.value }))}
                  placeholder="e.g. Key with building security, available after 6pm"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Describe the Issue <span className="text-red-500">*</span></label>
                <textarea
                  rows={4}
                  value={form.jobDescription}
                  onChange={e => setForm(f => ({ ...f, jobDescription: e.target.value }))}
                  placeholder="Describe the problem in as much detail as possible…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setForm(EMPTY_FORM) }}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !form.jobDescription.trim()}
                className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
              >
                {saving ? "Submitting…" : "Submit Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-xs text-gray-400">{icon}{label}</div>
      <span className="text-sm font-semibold text-gray-900 truncate">{value}</span>
    </div>
  )
}

function TicketCard({ ticket, workerName }: { ticket: Ticket; workerName?: string }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button
        className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors duration-100"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-semibold text-gray-500">{ticket.ticket_ref}</span>
            <StatusBadge status={ticket.status} />
            <UrgencyBadge urgency={ticket.urgency} />
          </div>
          <p className="text-sm text-gray-800 font-medium truncate">{ticket.ai_summary}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-gray-400 capitalize">{ticket.job_type}</p>
          <p className="text-xs text-gray-400 mt-0.5">{fmtDate(ticket.created_at)}</p>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-3">
          {ticket.eta_description && (
            <Detail label="ETA" value={ticket.eta_description} />
          )}
          {ticket.location_notes && (
            <Detail label="Location" value={ticket.location_notes} />
          )}
          {ticket.access_instructions && (
            <Detail label="Access" value={ticket.access_instructions} />
          )}
          {workerName && (
            <Detail label="Assigned Worker" value={workerName} />
          )}
          {ticket.resolution_notes && (
            <Detail label="Resolution" value={ticket.resolution_notes} />
          )}
          {ticket.status === "COMPLETED" && ticket.done_at && (
            <Detail label="Completed On" value={fmtDate(ticket.done_at)} />
          )}
        </div>
      )}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-gray-700">{value}</p>
    </div>
  )
}
