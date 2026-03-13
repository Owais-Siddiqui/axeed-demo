"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useTickets } from "@/lib/store"
import { mockCustomers, mockWorkers } from "@/lib/mock-data"
import { Ticket, Urgency, Status } from "@/types/index"
import {
  LayoutList,
  Inbox,
  UserCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Search,
  SlidersHorizontal,
  Plus,
  Columns,
  Mail,
  MessageCircle,
  Phone,
  ClipboardPen,
  Pencil,
  Trash2,
  Clock,
  Building2,
  Wrench,
  HardHat,
  X,
} from "lucide-react"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isOverdue(ticket: Ticket): boolean {
  if (ticket.urgency !== "high") return false
  if (!["OPEN", "ASSIGNED"].includes(ticket.status)) return false
  const hoursDiff = (Date.now() - new Date(ticket.created_at).getTime()) / 3_600_000
  return hoursDiff > 24
}

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

function ViaIcon({ via }: { via: Ticket["reported_via"] }) {
  const icons: Record<Ticket["reported_via"], React.ReactNode> = {
    email: <Mail size={14} />,
    whatsapp: <MessageCircle size={14} />,
    phone: <Phone size={14} />,
    manual: <ClipboardPen size={14} />,
  }
  return <span className="text-gray-500 flex items-center">{icons[via]}</span>
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

// ─── Component ───────────────────────────────────────────────────────────────

type FormState = {
  customerId: string
  property: string
  jobType: string
  urgency: Urgency
  reportedVia: Ticket["reported_via"]
  locationNotes: string
  accessInstructions: string
  aiSummary: string
}

const EMPTY_FORM: FormState = {
  customerId: "",
  property: "",
  jobType: "plumbing",
  urgency: "low",
  reportedVia: "email",
  locationNotes: "",
  accessInstructions: "",
  aiSummary: "",
}

const KANBAN_COLUMNS: { status: Status; label: string }[] = [
  { status: "OPEN", label: "Open" },
  { status: "ASSIGNED", label: "Assigned" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "COMPLETED", label: "Completed" },
]

export default function DashboardPage() {
  const router = useRouter()
  const { tickets, addTicket, deleteTicket, addEvent } = useTickets()

  const [view, setView] = useState<"table" | "kanban">("table")
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterJobType, setFilterJobType] = useState("")
  const [filterUrgency, setFilterUrgency] = useState("")
  const [activeCard, setActiveCard] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  // ── Stats ──────────────────────────────────────────────────────────────────

  const stats = useMemo(
    () => ({
      total: tickets.length,
      open: tickets.filter(t => t.status === "OPEN").length,
      assigned: tickets.filter(t => t.status === "ASSIGNED").length,
      inProgress: tickets.filter(t => t.status === "IN_PROGRESS").length,
      completed: tickets.filter(t => t.status === "COMPLETED").length,
      overdue: tickets.filter(isOverdue).length,
    }),
    [tickets]
  )

  const statCards = [
    { key: "total", label: "Total", count: stats.total, icon: <LayoutList size={20} /> },
    { key: "open", label: "Open", count: stats.open, icon: <Inbox size={20} /> },
    { key: "assigned", label: "Assigned", count: stats.assigned, icon: <UserCheck size={20} /> },
    { key: "inProgress", label: "In Progress", count: stats.inProgress, icon: <Loader2 size={20} /> },
    { key: "completed", label: "Completed", count: stats.completed, icon: <CheckCircle2 size={20} /> },
    { key: "overdue", label: "Overdue", count: stats.overdue, icon: <AlertCircle size={20} /> },
  ]

  // ── Filtered tickets ───────────────────────────────────────────────────────

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      if (activeCard === "open" && ticket.status !== "OPEN") return false
      if (activeCard === "assigned" && ticket.status !== "ASSIGNED") return false
      if (activeCard === "inProgress" && ticket.status !== "IN_PROGRESS") return false
      if (activeCard === "completed" && ticket.status !== "COMPLETED") return false
      if (activeCard === "overdue" && !isOverdue(ticket)) return false
      if (filterStatus && ticket.status !== filterStatus) return false
      if (filterJobType && ticket.job_type !== filterJobType) return false
      if (filterUrgency && ticket.urgency !== filterUrgency) return false
      if (search) {
        const customer = mockCustomers.find(c => c.id === ticket.customer_id)
        const q = search.toLowerCase()
        const hit =
          ticket.ticket_ref.toLowerCase().includes(q) ||
          ticket.property.toLowerCase().includes(q) ||
          (customer?.full_name.toLowerCase().includes(q) ?? false)
        if (!hit) return false
      }
      return true
    })
  }, [tickets, activeCard, filterStatus, filterJobType, filterUrgency, search])

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleCardClick(key: string) {
    if (key === "total") {
      setActiveCard(null)
    } else {
      setActiveCard(prev => (prev === key ? null : key))
    }
  }

  function handleCustomerChange(customerId: string) {
    const customer = mockCustomers.find(c => c.id === customerId)
    setForm(f => ({ ...f, customerId, property: customer?.property_ref ?? "" }))
  }

  function handleAddTicket() {
    const maxNum = tickets.reduce((max, t) => {
      const n = parseInt(t.ticket_ref.replace("TKT-", "") || "0")
      return n > max ? n : max
    }, 0)
    const ticketRef = `TKT-${String(maxNum + 1).padStart(4, "0")}`
    const now = new Date().toISOString()
    const newTicket: Ticket = {
      id: crypto.randomUUID(),
      ticket_ref: ticketRef,
      customer_id: form.customerId,
      worker_id: null,
      property: form.property,
      job_type: form.jobType,
      urgency: form.urgency,
      status: "OPEN",
      ai_summary: form.aiSummary,
      eta_description: null,
      location_notes: form.locationNotes || null,
      access_instructions: form.accessInstructions || null,
      reported_via: form.reportedVia,
      resolution_notes: null,
      attachments: [],
      completion_photos: [],
      created_at: now,
      updated_at: now,
    }
    addTicket(newTicket)
    addEvent({
      id: crypto.randomUUID(),
      ticket_id: newTicket.id,
      event_type: "CREATED",
      actor: "Manager",
      note: `Ticket created manually. Job type: ${form.jobType}, Urgency: ${form.urgency}.`,
      created_at: now,
    })
    setShowAddModal(false)
    setForm(EMPTY_FORM)
  }

  function handleDeleteConfirm() {
    if (deleteTargetId) {
      deleteTicket(deleteTargetId)
      setDeleteTargetId(null)
    }
  }

  const deleteTarget = tickets.find(t => t.id === deleteTargetId)

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-6 gap-4">
        {statCards.map(card => {
          const isActive = card.key === "total" ? activeCard === null : activeCard === card.key
          return (
            <button
              key={card.key}
              onClick={() => handleCardClick(card.key)}
              className={`bg-white rounded-xl shadow-sm p-4 flex flex-col gap-2 hover:shadow-md transition-shadow duration-200 cursor-pointer text-left ${
                isActive ? "ring-2 ring-blue-500 bg-blue-50" : ""
              }`}
            >
              <div className="text-gray-500">{card.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{card.count}</div>
              <div className="text-sm text-gray-500">{card.label}</div>
            </button>
          )
        })}
      </div>

      {/* ── Controls Row ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
        </div>

        <div className="flex items-center gap-1 text-gray-500">
          <SlidersHorizontal size={16} />
        </div>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">OPEN</option>
          <option value="ASSIGNED">ASSIGNED</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="COMPLETED">COMPLETED</option>
        </select>

        <select
          value={filterJobType}
          onChange={e => setFilterJobType(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Job Types</option>
          <option value="plumbing">plumbing</option>
          <option value="electrical">electrical</option>
          <option value="hvac">hvac</option>
          <option value="carpentry">carpentry</option>
          <option value="general">general</option>
        </select>

        <select
          value={filterUrgency}
          onChange={e => setFilterUrgency(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Urgencies</option>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
        </select>

        <div className="flex-1" />

        {/* View Toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setView("table")}
            className={`${
              view === "table" ? "bg-blue-600 text-white" : "bg-white border border-gray-300 text-gray-500"
            } rounded-md px-3 py-1.5 flex items-center`}
          >
            <LayoutList size={18} />
          </button>
          <button
            onClick={() => setView("kanban")}
            className={`${
              view === "kanban" ? "bg-blue-600 text-white" : "bg-white border border-gray-300 text-gray-500"
            } rounded-md px-3 py-1.5 flex items-center`}
          >
            <Columns size={18} />
          </button>
        </div>

        {/* New Ticket */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-blue-700 transition-colors duration-150"
        >
          <Plus size={16} />
          New Ticket
        </button>
      </div>

      {/* ── Table View ── */}
      {view === "table" && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-white border-b border-gray-200">
                <tr>
                  {["Ticket Ref", "Customer", "Property", "Job Type", "Urgency", "Status", "Worker", "Via", "Created At", "Actions"].map(col => (
                    <th
                      key={col}
                      className="text-xs uppercase text-gray-500 font-semibold px-4 py-3 text-left whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTickets.map(ticket => {
                  const customer = mockCustomers.find(c => c.id === ticket.customer_id)
                  const worker = mockWorkers.find(w => w.id === ticket.worker_id)
                  const overdue = isOverdue(ticket)
                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
                      className={`transition-colors duration-150 hover:bg-blue-50 cursor-pointer ${
                        overdue ? "bg-red-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-mono">{ticket.ticket_ref}</span>
                          {overdue && (
                            <span className="flex items-center gap-1 text-red-600 text-xs font-medium">
                              <Clock size={12} /> Overdue
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{customer?.full_name ?? "—"}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">{ticket.property}</td>
                      <td className="px-4 py-3 text-sm capitalize text-gray-700">{ticket.job_type}</td>
                      <td className="px-4 py-3"><UrgencyBadge urgency={ticket.urgency} /></td>
                      <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
                      <td className="px-4 py-3 text-sm">
                        {worker?.full_name ?? <span className="text-gray-400">Unassigned</span>}
                      </td>
                      <td className="px-4 py-3"><ViaIcon via={ticket.reported_via} /></td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {fmtDate(ticket.created_at)}
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
                            className="hover:bg-gray-100 rounded-full p-1.5 transition-colors duration-150 text-gray-500"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteTargetId(ticket.id)}
                            className="hover:bg-gray-100 rounded-full p-1.5 transition-colors duration-150 text-gray-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filteredTickets.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-gray-400 text-sm">
                      No tickets match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Kanban View ── */}
      {view === "kanban" && (
        <div className="grid grid-cols-4 gap-4">
          {KANBAN_COLUMNS.map(({ status, label }) => {
            const colTickets = filteredTickets.filter(t => t.status === status)
            const badgeStyle: Record<Status, string> = {
              OPEN: "bg-gray-100 text-gray-700",
              ASSIGNED: "bg-blue-100 text-blue-700",
              IN_PROGRESS: "bg-amber-100 text-amber-700",
              COMPLETED: "bg-green-100 text-green-700",
            }
            return (
              <div key={status} className="bg-gray-100 rounded-xl p-3 min-h-96">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-semibold text-sm text-gray-700">{label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeStyle[status]}`}>
                    {colTickets.length}
                  </span>
                </div>
                {colTickets.map(ticket => {
                  const customer = mockCustomers.find(c => c.id === ticket.customer_id)
                  const worker = mockWorkers.find(w => w.id === ticket.worker_id)
                  const overdue = isOverdue(ticket)
                  return (
                    <div
                      key={ticket.id}
                      onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
                      className={`bg-white rounded-lg shadow-sm p-4 mb-3 hover:shadow-md transition-shadow duration-200 cursor-pointer ${
                        overdue ? "border-l-4 border-red-400" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs text-gray-500">{ticket.ticket_ref}</span>
                        <UrgencyBadge urgency={ticket.urgency} />
                      </div>
                      <div className="font-medium text-sm text-gray-900 mb-1">
                        {customer?.full_name ?? "—"}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                        <Building2 size={12} />
                        <span>{ticket.property}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                        <Wrench size={12} />
                        <span className="capitalize">{ticket.job_type}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <HardHat size={12} />
                          <span>{worker?.full_name ?? <span className="text-gray-400">Unassigned</span>}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {overdue && (
                            <span className="flex items-center gap-1 text-red-600 text-xs font-medium">
                              <Clock size={12} /> Overdue
                            </span>
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); setDeleteTargetId(ticket.id) }}
                            className="hover:bg-gray-100 rounded-full p-1 transition-colors duration-150 text-gray-400"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Add Ticket Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full mx-auto mt-24 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">New Ticket</h2>
              <button
                onClick={() => { setShowAddModal(false); setForm(EMPTY_FORM) }}
                className="hover:bg-gray-100 rounded-full p-1 text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                <select
                  value={form.customerId}
                  onChange={e => handleCustomerChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select customer...</option>
                  {mockCustomers.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
                <input
                  type="text"
                  value={form.property}
                  onChange={e => setForm(f => ({ ...f, property: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                  <select
                    value={form.jobType}
                    onChange={e => setForm(f => ({ ...f, jobType: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {["plumbing", "electrical", "hvac", "carpentry", "general"].map(j => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                  <select
                    value={form.urgency}
                    onChange={e => setForm(f => ({ ...f, urgency: e.target.value as Urgency }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {(["low", "medium", "high"] as Urgency[]).map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reported Via</label>
                <select
                  value={form.reportedVia}
                  onChange={e => setForm(f => ({ ...f, reportedVia: e.target.value as Ticket["reported_via"] }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {(["email", "whatsapp", "phone", "manual"] as Ticket["reported_via"][]).map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location Notes</label>
                <input
                  type="text"
                  value={form.locationNotes}
                  onChange={e => setForm(f => ({ ...f, locationNotes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Access Instructions</label>
                <input
                  type="text"
                  value={form.accessInstructions}
                  onChange={e => setForm(f => ({ ...f, accessInstructions: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">AI Summary</label>
                <textarea
                  rows={3}
                  value={form.aiSummary}
                  onChange={e => setForm(f => ({ ...f, aiSummary: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowAddModal(false); setForm(EMPTY_FORM) }}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm hover:bg-gray-50 transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTicket}
                disabled={!form.customerId}
                className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Ticket</h2>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-mono font-semibold">{deleteTarget?.ticket_ref}</span>? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm hover:bg-gray-50 transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="bg-red-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-red-700 transition-colors duration-150"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
