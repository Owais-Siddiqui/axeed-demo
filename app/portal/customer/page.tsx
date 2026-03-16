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

function fmtShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

const SELECT_CLS = "border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"

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
      <div className="p-6 text-sm text-slate-500">Loading your profile…</div>
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
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center text-xl font-bold">
              {customer.full_name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{customer.full_name}</h1>
              <p className="text-sm text-slate-400">{customer.email}</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-150 shrink-0"
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
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Calendar size={15} />
              Contract Expiry
            </div>
            <span
              className={`text-sm font-semibold ${
                contractStatus === "expired" ? "text-rose-400" :
                contractStatus === "soon" ? "text-amber-400" :
                "text-white"
              }`}
            >
              {fmtShortDate(customer.contract_expiry)}
            </span>
            {contractStatus === "expired" && <span className="text-xs text-rose-400">Expired</span>}
            {contractStatus === "soon" && <span className="text-xs text-amber-400">Expires in {daysToExpiry}d</span>}
          </div>
        </div>
      </div>

      {/* ── Tickets Section ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Your Tickets</h2>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors duration-150 ${
                activeTab === tab.key
                  ? "bg-slate-700 text-white font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.icon}
              {tab.label}
              <span className={`text-xs font-medium rounded-full px-1.5 ${
                activeTab === tab.key ? "bg-sky-500/15 text-sky-400" : "bg-slate-700 text-slate-500"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Ticket Cards */}
        {filteredTickets.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-10 text-center">
            <p className="text-slate-400 text-sm">No tickets in this category.</p>
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
          className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-start justify-center overflow-y-auto"
          onClick={() => { setShowModal(false); setForm(EMPTY_FORM) }}
        >
          <div
            className="bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl animate-scaleIn p-6 max-w-lg w-full mx-auto mt-24 mb-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Raise a New Ticket</h2>
              <button
                onClick={() => { setShowModal(false); setForm(EMPTY_FORM) }}
                className="hover:bg-slate-700 rounded-full p-1 text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Read-only customer info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Your Name</label>
                  <input readOnly value={customer.full_name} className="w-full border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-400 bg-slate-700/30 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Property</label>
                  <input readOnly value={customer.property_ref} className="w-full border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-400 bg-slate-700/30 cursor-not-allowed" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Job Type</label>
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
                  <label className="block text-sm font-medium text-slate-300 mb-1">Urgency</label>
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
                <label className="block text-sm font-medium text-slate-300 mb-1">Location Notes</label>
                <input
                  type="text"
                  value={form.locationNotes}
                  onChange={e => setForm(f => ({ ...f, locationNotes: e.target.value }))}
                  placeholder="e.g. Kitchen, under the sink on the left side"
                  className="w-full border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Access Instructions</label>
                <input
                  type="text"
                  value={form.accessInstructions}
                  onChange={e => setForm(f => ({ ...f, accessInstructions: e.target.value }))}
                  placeholder="e.g. Key with building security, available after 6pm"
                  className="w-full border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Describe the Issue <span className="text-rose-400">*</span></label>
                <textarea
                  rows={4}
                  value={form.jobDescription}
                  onChange={e => setForm(f => ({ ...f, jobDescription: e.target.value }))}
                  placeholder="Describe the problem in as much detail as possible…"
                  className="w-full border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setForm(EMPTY_FORM) }}
                className="border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !form.jobDescription.trim()}
                className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-lg px-4 py-2 text-sm hover:from-sky-400 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
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
      <div className="flex items-center gap-1.5 text-xs text-slate-500">{icon}{label}</div>
      <span className="text-sm font-semibold text-white truncate">{value}</span>
    </div>
  )
}

function TicketCard({ ticket, workerName }: { ticket: Ticket; workerName?: string }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
      <button
        className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-slate-700/50 transition-colors duration-100"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-semibold text-slate-400">{ticket.ticket_ref}</span>
            <StatusBadge status={ticket.status} />
            <UrgencyBadge urgency={ticket.urgency} />
          </div>
          <p className="text-sm text-slate-200 font-medium truncate">{ticket.ai_summary}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-slate-500 capitalize">{ticket.job_type}</p>
          <p className="text-xs text-slate-500 mt-0.5">{fmtDate(ticket.created_at)}</p>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-700/50 pt-4 space-y-3">
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
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-slate-300">{value}</p>
    </div>
  )
}
