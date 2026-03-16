"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTickets } from "@/lib/store"
import { Ticket, Urgency, Status, Customer } from "@/types/index"
import { Pagination } from "@/components/pagination"
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
  Calendar,
} from "lucide-react"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isOverdue(ticket: Ticket): boolean {
  if (ticket.status === "COMPLETED") return false
  const statusStart =
    ticket.status === "IN_PROGRESS" ? ticket.in_progress_at :
    ticket.status === "ASSIGNED"    ? ticket.assigned_at :
    ticket.created_at  // OPEN
  if (!statusStart) return false
  return (Date.now() - new Date(statusStart).getTime()) / 3_600_000 > 24
}

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

function ViaIcon({ via }: { via: Ticket["reported_via"] }) {
  const icons: Record<Ticket["reported_via"], React.ReactNode> = {
    email: <Mail size={14} />,
    whatsapp: <MessageCircle size={14} />,
    phone: <Phone size={14} />,
    manual: <ClipboardPen size={14} />,
  }
  return <span className="text-slate-400 flex items-center">{icons[via]}</span>
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

// ─── Searchable Customer Combobox ─────────────────────────────────────────────

function CustomerCombobox({
  selectedEmail,
  onSelect,
  customers,
}: {
  selectedEmail: string
  onSelect: (email: string, propertyRef: string, fullName: string) => void
  customers: Customer[]
}) {
  const [inputText, setInputText] = useState(selectedEmail)
  const [open, setOpen] = useState(false)

  const matches = customers.filter(c =>
    !inputText || c.email.toLowerCase().includes(inputText.toLowerCase())
  )

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputText(e.target.value)
    setOpen(true)
    if (selectedEmail) onSelect("", "", "") // clear selection while user types
  }

  function handleSelect(c: Customer) {
    setInputText(c.email)
    setOpen(false)
    onSelect(c.email, c.property_ref, c.full_name)
  }

  return (
    <div className="relative">
      <input
        type="email"
        value={inputText}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Type customer email to search..."
        className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        autoComplete="off"
      />
      {open && (
        <div className="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {matches.length > 0 ? (
            matches.map(c => (
              <button
                key={c.id}
                type="button"
                onMouseDown={e => { e.preventDefault(); handleSelect(c) }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-500/10 transition-colors duration-100 ${
                  selectedEmail === c.email ? "bg-indigo-500/10 font-medium" : ""
                }`}
              >
                <div className="text-white">{c.email}</div>
                <div className="text-slate-500 text-xs">{c.full_name}</div>
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-slate-500">No customers found</div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

type FormState = {
  customerEmail: string
  customerName: string
  property: string
  jobType: string
  urgency: Urgency
  reportedVia: Ticket["reported_via"]
  locationNotes: string
  accessInstructions: string
  jobDescription: string
}

const EMPTY_FORM: FormState = {
  customerEmail: "",
  customerName: "",
  property: "",
  jobType: "plumbing",
  urgency: "low",
  reportedVia: "email",
  locationNotes: "",
  accessInstructions: "",
  jobDescription: "",
}

const KANBAN_COLUMNS: { status: Status; label: string }[] = [
  { status: "OPEN", label: "Open" },
  { status: "ASSIGNED", label: "Assigned" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "COMPLETED", label: "Completed" },
]

const SELECT_CLS =
  "border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"

const INPUT_CLS =
  "w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"

const LABEL_CLS = "block text-sm font-medium text-slate-300 mb-1"

// ─── Component ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const { customers, workers, tickets, addTicket, deleteTicket, dashboardState, setDashboardState } = useTickets()

  // Destructure persistent state from context
  const { view, search, filterStatus, filterJobType, filterUrgency, filterDatePreset, filterDateFrom, filterDateTo, activeCard } = dashboardState

  // Setters that update context (persisted across navigation)
  const setView = (v: "table" | "kanban") => setDashboardState(s => ({ ...s, view: v }))
  const setSearch = (q: string) => setDashboardState(s => ({ ...s, search: q }))
  const setFilterStatus = (v: string) => setDashboardState(s => ({ ...s, filterStatus: v }))
  const setFilterJobType = (v: string) => setDashboardState(s => ({ ...s, filterJobType: v }))
  const setFilterUrgency = (v: string) => setDashboardState(s => ({ ...s, filterUrgency: v }))
  const setFilterDatePreset = (v: string) => setDashboardState(s => ({ ...s, filterDatePreset: v, filterDateFrom: "", filterDateTo: "" }))
  const setFilterDateFrom = (v: string) => setDashboardState(s => ({ ...s, filterDateFrom: v }))
  const setFilterDateTo = (v: string) => setDashboardState(s => ({ ...s, filterDateTo: v }))
  const setActiveCard = (card: string | null) => setDashboardState(s => ({ ...s, activeCard: card }))

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1) }, [search, filterStatus, filterJobType, filterUrgency, filterDatePreset, filterDateFrom, filterDateTo, activeCard])

  // Local-only modal state (not persisted)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  // ── Stats ──────────────────────────────────────────────────────────────────

  // Base-filtered tickets: apply all filters except activeCard, used for stat card counts
  const baseFilteredTickets = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    return tickets.filter(ticket => {
      if (filterStatus   && ticket.status    !== filterStatus)   return false
      if (filterJobType  && ticket.job_type  !== filterJobType)  return false
      if (filterUrgency  && ticket.urgency   !== filterUrgency)  return false

      if (filterDatePreset) {
        const created = new Date(ticket.created_at)
        if (filterDatePreset === "today") {
          const end = new Date(todayStart.getTime() + 86_400_000)
          if (created < todayStart || created >= end) return false
        } else if (filterDatePreset === "week") {
          const weekStart = new Date(todayStart.getTime() - todayStart.getDay() * 86_400_000)
          const weekEnd = new Date(weekStart.getTime() + 7 * 86_400_000)
          if (created < weekStart || created >= weekEnd) return false
        } else if (filterDatePreset === "month") {
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
          if (created < monthStart || created >= monthEnd) return false
        } else if (filterDatePreset === "custom") {
          if (filterDateFrom && created < new Date(filterDateFrom)) return false
          if (filterDateTo) {
            const to = new Date(filterDateTo)
            to.setDate(to.getDate() + 1)
            if (created >= to) return false
          }
        }
      }

      if (search) {
        const customer = customers.find(c => c.email === ticket.customer_email)
        const q = search.toLowerCase()
        const hit =
          ticket.ticket_ref.toLowerCase().includes(q) ||
          ticket.property.toLowerCase().includes(q) ||
          (customer?.full_name.toLowerCase().includes(q) ?? false)
        if (!hit) return false
      }
      return true
    })
  }, [tickets, filterStatus, filterJobType, filterUrgency, filterDatePreset, filterDateFrom, filterDateTo, search, customers])

  const stats = useMemo(
    () => ({
      total: baseFilteredTickets.length,
      open: baseFilteredTickets.filter(t => t.status === "OPEN").length,
      assigned: baseFilteredTickets.filter(t => t.status === "ASSIGNED").length,
      inProgress: baseFilteredTickets.filter(t => t.status === "IN_PROGRESS").length,
      completed: baseFilteredTickets.filter(t => t.status === "COMPLETED").length,
      overdue: baseFilteredTickets.filter(isOverdue).length,
    }),
    [baseFilteredTickets]
  )

  const statCards = [
    { key: "total",      label: "Total",       count: stats.total,      icon: <LayoutList size={20} /> },
    { key: "open",       label: "Open",        count: stats.open,       icon: <Inbox size={20} /> },
    { key: "assigned",   label: "Assigned",    count: stats.assigned,   icon: <UserCheck size={20} /> },
    { key: "inProgress", label: "In Progress", count: stats.inProgress, icon: <Loader2 size={20} /> },
    { key: "completed",  label: "Completed",   count: stats.completed,  icon: <CheckCircle2 size={20} /> },
    { key: "overdue",    label: "Overdue",     count: stats.overdue,    icon: <AlertCircle size={20} /> },
  ]

  // ── Filtered tickets ───────────────────────────────────────────────────────

  const filteredTickets = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    return tickets.filter(ticket => {
      if (activeCard === "open"       && ticket.status !== "OPEN")        return false
      if (activeCard === "assigned"   && ticket.status !== "ASSIGNED")    return false
      if (activeCard === "inProgress" && ticket.status !== "IN_PROGRESS") return false
      if (activeCard === "completed"  && ticket.status !== "COMPLETED")   return false
      if (activeCard === "overdue"    && !isOverdue(ticket))              return false
      if (filterStatus   && ticket.status    !== filterStatus)   return false
      if (filterJobType  && ticket.job_type  !== filterJobType)  return false
      if (filterUrgency  && ticket.urgency   !== filterUrgency)  return false

      if (filterDatePreset) {
        const created = new Date(ticket.created_at)
        if (filterDatePreset === "today") {
          const end = new Date(todayStart.getTime() + 86_400_000)
          if (created < todayStart || created >= end) return false
        } else if (filterDatePreset === "week") {
          const weekStart = new Date(todayStart.getTime() - todayStart.getDay() * 86_400_000)
          const weekEnd = new Date(weekStart.getTime() + 7 * 86_400_000)
          if (created < weekStart || created >= weekEnd) return false
        } else if (filterDatePreset === "month") {
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
          if (created < monthStart || created >= monthEnd) return false
        } else if (filterDatePreset === "custom") {
          if (filterDateFrom && created < new Date(filterDateFrom)) return false
          if (filterDateTo) {
            const to = new Date(filterDateTo)
            to.setDate(to.getDate() + 1)
            if (created >= to) return false
          }
        }
      }

      if (search) {
        const customer = customers.find(c => c.email === ticket.customer_email)
        const q = search.toLowerCase()
        const hit =
          ticket.ticket_ref.toLowerCase().includes(q) ||
          ticket.property.toLowerCase().includes(q) ||
          (customer?.full_name.toLowerCase().includes(q) ?? false)
        if (!hit) return false
      }
      return true
    })
  }, [tickets, activeCard, filterStatus, filterJobType, filterUrgency, filterDatePreset, filterDateFrom, filterDateTo, search])

  const pagedTickets = filteredTickets.slice((page - 1) * pageSize, page * pageSize)

  const hasFilters = !!(search || filterStatus || filterJobType || filterUrgency || filterDatePreset || activeCard)

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleCardClick(key: string) {
    if (key === "total") {
      setActiveCard(null)
    } else {
      setActiveCard(activeCard === key ? null : key)
    }
  }

  function clearAllFilters() {
    setDashboardState(s => ({
      ...s,
      search: "",
      filterStatus: "",
      filterJobType: "",
      filterUrgency: "",
      filterDatePreset: "",
      filterDateFrom: "",
      filterDateTo: "",
      activeCard: null,
    }))
  }

  async function handleAddTicket() {
    const maxNum = tickets.reduce((max, t) => {
      const n = parseInt(t.ticket_ref.replace("TKT-", "") || "0")
      return n > max ? n : max
    }, 0)
    const ticketRef = `TKT-${String(maxNum + 1).padStart(4, "0")}`
    const now = new Date().toISOString()
    const newTicket: Ticket = {
      id: "",
      ticket_ref: ticketRef,
      customer_email: form.customerEmail,
      worker_id: null,
      property: form.property,
      job_type: form.jobType,
      urgency: form.urgency,
      status: "OPEN",
      ai_summary: form.jobDescription,
      eta_description: null,
      location_notes: form.locationNotes || null,
      access_instructions: form.accessInstructions || null,
      reported_via: form.reportedVia,
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
              className={`bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex flex-col gap-2 hover:shadow-[0_0_15px_rgba(99,102,241,0.15)] hover:border-indigo-500/30 transition-all duration-300 cursor-pointer text-left ${
                isActive ? "ring-2 ring-indigo-500 bg-indigo-500/10 border-indigo-500/30" : ""
              }`}
            >
              <div className="text-slate-400">{card.icon}</div>
              <div className="text-2xl font-bold text-white">{card.count}</div>
              <div className="text-sm text-slate-400">{card.label}</div>
            </button>
          )
        })}
      </div>

      {/* ── Controls Row ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-500 bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56 transition-all duration-200"
          />
        </div>

        <div className="flex items-center gap-1 text-slate-500">
          <SlidersHorizontal size={16} />
        </div>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className={SELECT_CLS}
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>

        <select
          value={filterJobType}
          onChange={e => setFilterJobType(e.target.value)}
          className={SELECT_CLS}
        >
          <option value="">All Job Types</option>
          <option value="plumbing">Plumbing</option>
          <option value="electrical">Electrical</option>
          <option value="hvac">HVAC</option>
          <option value="carpentry">Carpentry</option>
          <option value="general">General</option>
        </select>

        <select
          value={filterUrgency}
          onChange={e => setFilterUrgency(e.target.value)}
          className={SELECT_CLS}
        >
          <option value="">All Urgencies</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        {/* Date Filter */}
        <div className="flex items-center gap-1 text-slate-500">
          <Calendar size={16} />
        </div>
        <select
          value={filterDatePreset}
          onChange={e => setFilterDatePreset(e.target.value)}
          className={SELECT_CLS}
        >
          <option value="">All Dates</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="custom">Custom Range</option>
        </select>
        {filterDatePreset === "custom" && (
          <>
            <input
              type="date"
              value={filterDateFrom}
              onChange={e => setFilterDateFrom(e.target.value)}
              className={SELECT_CLS}
            />
            <span className="text-slate-500 text-sm">to</span>
            <input
              type="date"
              value={filterDateTo}
              onChange={e => setFilterDateTo(e.target.value)}
              className={SELECT_CLS}
            />
          </>
        )}

        {/* Clear Filters */}
        <button
          onClick={clearAllFilters}
          disabled={!hasFilters}
          className={`flex items-center gap-1.5 border rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
            hasFilters
              ? "border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
              : "border-slate-700 text-slate-600 cursor-not-allowed"
          }`}
        >
          <X size={14} />
          Clear Filters
        </button>

        <div className="flex-1" />

        {/* View Toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setView("table")}
            className={`${
              view === "table" ? "bg-indigo-500 text-white" : "bg-slate-800 border border-slate-600 text-slate-400"
            } rounded-md px-3 py-1.5 flex items-center transition-all duration-200`}
          >
            <LayoutList size={18} />
          </button>
          <button
            onClick={() => setView("kanban")}
            className={`${
              view === "kanban" ? "bg-indigo-500 text-white" : "bg-slate-800 border border-slate-600 text-slate-400"
            } rounded-md px-3 py-1.5 flex items-center transition-all duration-200`}
          >
            <Columns size={18} />
          </button>
        </div>

        {/* New Ticket */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-lg px-4 py-2 text-sm hover:from-indigo-400 hover:to-violet-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all duration-300"
        >
          <Plus size={16} />
          New Ticket
        </button>
      </div>

      {/* ── Table View ── */}
      {view === "table" && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-800 border-b border-slate-700">
                <tr>
                  {["Ticket Ref", "Customer", "Property", "Job Type", "Urgency", "Status", "Worker", "Via", "Created At", "Actions"].map(col => (
                    <th
                      key={col}
                      className="text-xs uppercase text-slate-400 font-semibold px-4 py-3 text-left whitespace-nowrap tracking-wide"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {pagedTickets.map(ticket => {
                  const customer = customers.find(c => c.email === ticket.customer_email)
                  const worker = workers.find(w => w.id === ticket.worker_id)
                  const overdue = isOverdue(ticket)
                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
                      className={`transition-all duration-200 hover:bg-indigo-500/5 cursor-pointer ${
                        overdue ? "bg-rose-500/5" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-white">{ticket.ticket_ref}</span>
                          {overdue && (
                            <span className="flex items-center gap-1 text-rose-400 text-xs font-medium">
                              <Clock size={12} /> Overdue
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-white">{customer?.full_name ?? "—"}</td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-300">{ticket.property}</td>
                      <td className="px-4 py-3 text-sm capitalize text-slate-200">{ticket.job_type}</td>
                      <td className="px-4 py-3"><UrgencyBadge urgency={ticket.urgency} /></td>
                      <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-200">
                        {worker?.full_name ?? <span className="text-slate-500 font-normal">Unassigned</span>}
                      </td>
                      <td className="px-4 py-3"><ViaIcon via={ticket.reported_via} /></td>
                      <td className="px-4 py-3 text-sm text-slate-400 whitespace-nowrap">
                        {fmtDate(ticket.created_at)}
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
                            className="hover:bg-slate-700 rounded-full p-1.5 transition-colors duration-150 text-slate-500"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteTargetId(ticket.id)}
                            className="hover:bg-slate-700 rounded-full p-1.5 transition-colors duration-150 text-slate-500"
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
                    <td colSpan={10} className="px-4 py-12 text-center text-slate-500 text-sm">
                      No tickets match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            total={filteredTickets.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
          />
        </div>
      )}

      {/* ── Kanban View ── */}
      {view === "kanban" && (
        <div className="grid grid-cols-4 gap-4">
          {KANBAN_COLUMNS.map(({ status, label }) => {
            const colTickets = filteredTickets.filter(t => t.status === status)
            const badgeStyle: Record<Status, string> = {
              OPEN:        "bg-slate-700 text-slate-300",
              ASSIGNED:    "bg-blue-500/15 text-blue-400",
              IN_PROGRESS: "bg-amber-500/15 text-amber-400",
              COMPLETED:   "bg-emerald-500/15 text-emerald-400",
            }
            return (
              <div key={status} className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-3 min-h-96">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-semibold text-sm text-slate-200">{label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeStyle[status]}`}>
                    {colTickets.length}
                  </span>
                </div>
                {colTickets.map(ticket => {
                  const customer = customers.find(c => c.email === ticket.customer_email)
                  const worker = workers.find(w => w.id === ticket.worker_id)
                  const overdue = isOverdue(ticket)
                  return (
                    <div
                      key={ticket.id}
                      onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
                      className={`bg-slate-800 border border-slate-700/50 rounded-lg p-4 mb-3 hover:shadow-[0_0_15px_rgba(99,102,241,0.1)] hover:border-indigo-500/20 transition-all duration-300 cursor-pointer ${
                        overdue ? "border-l-4 border-l-rose-500" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-semibold text-slate-300">{ticket.ticket_ref}</span>
                        <UrgencyBadge urgency={ticket.urgency} />
                      </div>
                      <div className="font-semibold text-sm text-white mb-1">
                        {customer?.full_name ?? "—"}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                        <Building2 size={12} />
                        <span>{ticket.property}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400 mb-3">
                        <Wrench size={12} />
                        <span className="capitalize">{ticket.job_type}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs font-medium text-slate-300">
                          <HardHat size={12} />
                          <span>{worker?.full_name ?? <span className="text-slate-500 font-normal">Unassigned</span>}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {overdue && (
                            <span className="flex items-center gap-1 text-rose-400 text-xs font-medium">
                              <Clock size={12} /> Overdue
                            </span>
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); setDeleteTargetId(ticket.id) }}
                            className="hover:bg-slate-700 rounded-full p-1 transition-colors duration-150 text-slate-500"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-start justify-center overflow-y-auto" onClick={() => { setShowAddModal(false); setForm(EMPTY_FORM) }}>
          <div className="bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl p-6 max-w-lg w-full mx-auto mt-24 mb-8 animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">New Ticket</h2>
              <button
                onClick={() => { setShowAddModal(false); setForm(EMPTY_FORM) }}
                className="hover:bg-slate-700 rounded-full p-1 text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={LABEL_CLS}>Customer Email</label>
                {/* key forces remount + state reset each time the modal opens */}
                <CustomerCombobox
                  key={showAddModal ? "open" : "closed"}
                  selectedEmail={form.customerEmail}
                  onSelect={(email, prop, name) => setForm(f => ({ ...f, customerEmail: email, property: prop, customerName: name }))}
                  customers={customers}
                />
              </div>

              {form.customerName && (
                <div>
                  <label className={LABEL_CLS}>Customer Name</label>
                  <input
                    type="text"
                    value={form.customerName}
                    readOnly
                    className="w-full bg-slate-700/30 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
                  />
                </div>
              )}

              {form.property && (
                <div>
                  <label className={LABEL_CLS}>Property</label>
                  <input
                    type="text"
                    value={form.property}
                    readOnly
                    className="w-full bg-slate-700/30 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>Job Type</label>
                  <select
                    value={form.jobType}
                    onChange={e => setForm(f => ({ ...f, jobType: e.target.value }))}
                    className={`w-full ${SELECT_CLS}`}
                  >
                    {["plumbing", "electrical", "hvac", "carpentry", "general"].map(j => (
                      <option key={j} value={j} className="capitalize">{j}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>Urgency</label>
                  <select
                    value={form.urgency}
                    onChange={e => setForm(f => ({ ...f, urgency: e.target.value as Urgency }))}
                    className={`w-full ${SELECT_CLS}`}
                  >
                    {(["low", "medium", "high"] as Urgency[]).map(u => (
                      <option key={u} value={u} className="capitalize">{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={LABEL_CLS}>Reported Via</label>
                <select
                  value={form.reportedVia}
                  onChange={e => setForm(f => ({ ...f, reportedVia: e.target.value as Ticket["reported_via"] }))}
                  className={`w-full ${SELECT_CLS}`}
                >
                  {(["email", "whatsapp", "phone", "manual"] as Ticket["reported_via"][]).map(v => (
                    <option key={v} value={v} className="capitalize">{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={LABEL_CLS}>Location Notes</label>
                <input
                  type="text"
                  value={form.locationNotes}
                  onChange={e => setForm(f => ({ ...f, locationNotes: e.target.value }))}
                  placeholder="e.g. Kitchen, under the sink on the left side"
                  className={INPUT_CLS}
                />
              </div>

              <div>
                <label className={LABEL_CLS}>Access Instructions</label>
                <input
                  type="text"
                  value={form.accessInstructions}
                  onChange={e => setForm(f => ({ ...f, accessInstructions: e.target.value }))}
                  placeholder="e.g. Key with building security, available after 6pm"
                  className={INPUT_CLS}
                />
              </div>

              <div>
                <label className={LABEL_CLS}>Job Description</label>
                <textarea
                  rows={3}
                  value={form.jobDescription}
                  onChange={e => setForm(f => ({ ...f, jobDescription: e.target.value }))}
                  placeholder="Describe the issue in detail..."
                  className={`${INPUT_CLS} resize-none`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowAddModal(false); setForm(EMPTY_FORM) }}
                className="border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTicket}
                disabled={!form.customerEmail}
                className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-lg px-4 py-2 text-sm hover:from-indigo-400 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-center justify-center">
          <div className="bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-scaleIn">
            <h2 className="text-lg font-semibold text-white mb-2">Delete Ticket</h2>
            <p className="text-sm text-slate-400 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-mono font-semibold text-white">{deleteTarget?.ticket_ref}</span>? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="bg-rose-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-rose-500 transition-colors duration-150"
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
