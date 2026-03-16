"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useTickets } from "@/lib/store"
import { Ticket, Urgency, Status, TicketEvent } from "@/types/index"
import {
  ArrowLeft,
  X,
  Check,
  Pencil,
  Trash2,
  Settings,
  FileText,
  Building2,
  Wrench,
  AlertTriangle,
  Circle,
  HardHat,
  CalendarClock,
  Mail,
  MessageCircle,
  Phone,
  ClipboardPen,
  MapPin,
  KeyRound,
  User,
  PhoneCall,
  ContactRound,
  FileWarning,
  ImageIcon,
  Camera,
  StickyNote,
  Activity,
  MessageSquarePlus,
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

const VIA_ICONS: Record<Ticket["reported_via"], React.ReactNode> = {
  email: <Mail size={14} />,
  whatsapp: <MessageCircle size={14} />,
  phone: <Phone size={14} />,
  manual: <ClipboardPen size={14} />,
}

const VIA_LABELS: Record<Ticket["reported_via"], string> = {
  email: "Email",
  whatsapp: "WhatsApp",
  phone: "Phone",
  manual: "Manual",
}

const EVENT_STYLES: Record<
  TicketEvent["event_type"],
  { border: string; dot: string; label: string; text: string }
> = {
  CREATED:      { border: "border-slate-600",      dot: "bg-slate-400",                                                    label: "Created",       text: "text-slate-400" },
  ASSIGNED:     { border: "border-blue-500/30",     dot: "bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.4)]",              label: "Assigned",      text: "text-blue-400" },
  STATUS_CHANGE:{ border: "border-amber-500/30",    dot: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.4)]",             label: "Status Change", text: "text-amber-400" },
  NOTE:         { border: "border-purple-500/30",   dot: "bg-purple-400 shadow-[0_0_6px_rgba(192,132,252,0.4)]",           label: "Note",          text: "text-purple-400" },
  COMPLETED:    { border: "border-emerald-500/30",  dot: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]",           label: "Completed",     text: "text-emerald-400" },
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

function FieldRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-500 mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <div className="text-xs text-slate-400 mb-0.5">{label}</div>
        <div className="text-sm text-white">{children}</div>
      </div>
    </div>
  )
}

// ─── Edit Form Type ───────────────────────────────────────────────────────────

type EditForm = {
  customerEmail: string
  property: string
  jobType: string
  urgency: Urgency
  reportedVia: Ticket["reported_via"]
  locationNotes: string
  accessInstructions: string
  eta: string
  aiSummary: string
  resolutionNotes: string
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { customers, workers, tickets, ticketEvents, updateTicket, deleteTicket, addEvent } = useTickets()

  const ticket = tickets.find(t => t.id === params.id)
  const customer = ticket ? customers.find(c => c.email === ticket.customer_email) : null
  const worker = ticket ? workers.find(w => w.id === ticket.worker_id) : null
  const events = ticket
    ? ticketEvents.filter(e => e.ticket_id === ticket.id).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    : []
  const notes = events.filter(e => e.event_type === "NOTE").reverse()

  // ── Local state ──────────────────────────────────────────────────────────

  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<Status>(ticket?.status ?? "OPEN")
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(ticket?.worker_id ?? "")
  const [noteText, setNoteText] = useState("")
  const [editForm, setEditForm] = useState<EditForm>({
    customerEmail: ticket?.customer_email ?? "",
    property: ticket?.property ?? "",
    jobType: ticket?.job_type ?? "plumbing",
    urgency: ticket?.urgency ?? "low",
    reportedVia: ticket?.reported_via ?? "email",
    locationNotes: ticket?.location_notes ?? "",
    accessInstructions: ticket?.access_instructions ?? "",
    eta: ticket?.eta_description ?? "",
    aiSummary: ticket?.ai_summary ?? "",
    resolutionNotes: ticket?.resolution_notes ?? "",
  })

  // ── Not found ────────────────────────────────────────────────────────────

  if (!ticket) {
    return (
      <div className="p-6 flex items-center gap-3 text-slate-500">
        <button
          onClick={() => router.back()}
          className="hover:bg-slate-700 rounded-full p-1.5 transition-colors duration-150"
        >
          <ArrowLeft size={20} />
        </button>
        <span>Ticket not found.</span>
      </div>
    )
  }

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleOpenEdit() {
    setEditForm({
      customerEmail: ticket!.customer_email,
      property: ticket!.property,
      jobType: ticket!.job_type,
      urgency: ticket!.urgency,
      reportedVia: ticket!.reported_via,
      locationNotes: ticket!.location_notes ?? "",
      accessInstructions: ticket!.access_instructions ?? "",
      eta: ticket!.eta_description ?? "",
      aiSummary: ticket!.ai_summary,
      resolutionNotes: ticket!.resolution_notes ?? "",
    })
    setShowEditModal(true)
  }

  async function handleEditSave() {
    const now = new Date().toISOString()
    await updateTicket(ticket!.id, {
      customer_email: editForm.customerEmail,
      property: editForm.property,
      job_type: editForm.jobType,
      urgency: editForm.urgency,
      reported_via: editForm.reportedVia,
      location_notes: editForm.locationNotes || null,
      access_instructions: editForm.accessInstructions || null,
      eta_description: editForm.eta || null,
      ai_summary: editForm.aiSummary,
      resolution_notes: editForm.resolutionNotes || null,
      updated_at: now,
    })
    setShowEditModal(false)
  }

  async function handleStatusSave() {
    const now = new Date().toISOString()
    const prevStatus = ticket!.status
    const prevWorker = ticket!.worker_id ?? ""

    // Build timestamp fields for the new status
    const timestampUpdates: Partial<Ticket> = {}
    if (selectedStatus !== prevStatus) {
      if (selectedStatus === "ASSIGNED")    timestampUpdates.assigned_at    = now
      if (selectedStatus === "IN_PROGRESS") timestampUpdates.in_progress_at = now
      if (selectedStatus === "COMPLETED")   timestampUpdates.done_at        = now
    }

    await updateTicket(ticket!.id, {
      status: selectedStatus,
      worker_id: selectedWorkerId || null,
      updated_at: now,
      ...timestampUpdates,
    })
  }

  async function handleAddNote() {
    if (!noteText.trim()) return
    await addEvent({
      id: "",
      ticket_id: ticket!.id,
      event_type: "NOTE",
      actor: "Manager",
      note: noteText.trim(),
      created_at: new Date().toISOString(),
    })
    setNoteText("")
  }

  async function handleDeleteConfirm() {
    await deleteTicket(ticket!.id)
    router.back()
  }

  // ── Contract expiry check ─────────────────────────────────────────────────

  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  const contractExpiry = customer ? new Date(customer.contract_expiry) : null
  const contractExpiringSoon = contractExpiry ? contractExpiry <= thirtyDaysFromNow : false

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="animate-fadeIn p-6 max-w-5xl mx-auto space-y-6">

      {/* ── Top Bar ── */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="hover:bg-slate-700 rounded-full p-1.5 transition-colors duration-150 text-slate-400 flex-shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="font-mono font-bold text-xl text-white">{ticket.ticket_ref}</span>
        <StatusBadge status={ticket.status} />
        <div className="flex-1" />
        <button
          onClick={handleOpenEdit}
          className="flex items-center gap-2 border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 rounded-lg px-3 py-1.5 text-sm hover:bg-indigo-500/20 transition-colors duration-150"
        >
          <Pencil size={16} />
          Edit
        </button>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center gap-2 border border-rose-500/30 text-rose-400 rounded-lg px-3 py-1.5 text-sm hover:bg-rose-500/10 transition-colors duration-150"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>

      {/* ── Section 1: Ticket Details ── */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <FileText size={18} className="text-slate-400" />
          <h2 className="font-semibold text-white">Ticket Details</h2>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <FieldRow icon={<Building2 size={16} />} label="Property">
            <span className="font-mono">{ticket.property}</span>
          </FieldRow>
          <FieldRow icon={<Wrench size={16} />} label="Job Type">
            <span className="capitalize">{ticket.job_type}</span>
          </FieldRow>
          <FieldRow icon={<AlertTriangle size={16} />} label="Urgency">
            <UrgencyBadge urgency={ticket.urgency} />
          </FieldRow>
          <FieldRow icon={<Circle size={16} />} label="Status">
            <StatusBadge status={ticket.status} />
          </FieldRow>
          <FieldRow icon={<HardHat size={16} />} label="Assigned Worker">
            {worker?.full_name ?? <span className="text-slate-500">Unassigned</span>}
          </FieldRow>
          <FieldRow icon={<CalendarClock size={16} />} label="Created At">
            {new Date(ticket.created_at).toLocaleString()}
          </FieldRow>
          <FieldRow icon={<span className="flex items-center">{VIA_ICONS[ticket.reported_via]}</span>} label="Reported Via">
            <span className="flex items-center gap-1">
              {VIA_LABELS[ticket.reported_via]}
            </span>
          </FieldRow>
          <FieldRow icon={<MapPin size={16} />} label="Location Notes">
            {ticket.location_notes ?? <span className="text-slate-500">—</span>}
          </FieldRow>
          <div className="col-span-2">
            <FieldRow icon={<KeyRound size={16} />} label="Access Instructions">
              {ticket.access_instructions ?? <span className="text-slate-500">—</span>}
            </FieldRow>
          </div>
        </div>
        {ticket.ai_summary && (
          <div className="mt-5 bg-slate-700/30 border border-slate-600/50 rounded-lg p-3 text-sm italic text-slate-300">
            {ticket.ai_summary}
          </div>
        )}
      </div>

      {/* ── Section 2: Customer Details ── */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <User size={18} className="text-slate-400" />
          <h2 className="font-semibold text-white">Customer Details</h2>
        </div>
        {customer ? (
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <FieldRow icon={<User size={16} />} label="Full Name">
              {customer.full_name}
            </FieldRow>
            <FieldRow icon={<Mail size={16} />} label="Email">
              {customer.email}
            </FieldRow>
            <FieldRow icon={<Phone size={16} />} label="Phone">
              {customer.phone}
            </FieldRow>
            <FieldRow icon={<Building2 size={16} />} label="Building Name">
              {customer.building_name}
            </FieldRow>
            <FieldRow icon={<MapPin size={16} />} label="Location">
              {[customer.unit_number, customer.floor, customer.area, customer.city]
                .filter(Boolean)
                .join(", ")}
            </FieldRow>
            <FieldRow icon={<PhoneCall size={16} />} label="Emergency Contact">
              {customer.emergency_contact ?? <span className="text-slate-500">—</span>}
            </FieldRow>
            <FieldRow icon={<ContactRound size={16} />} label="Preferred Contact">
              <span className="capitalize">{customer.preferred_contact}</span>
            </FieldRow>
            <FieldRow icon={<FileWarning size={16} />} label="Contract Expiry">
              <span className={contractExpiringSoon ? "text-rose-400 flex items-center gap-1" : ""}>
                {customer.contract_expiry}
                {contractExpiringSoon && (
                  <span className="flex items-center gap-1 ml-1">
                    <AlertTriangle size={12} />
                    <span className="text-xs font-medium">Expiring Soon</span>
                  </span>
                )}
              </span>
            </FieldRow>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Customer not found.</p>
        )}
      </div>

      {/* ── Section 3: Issue Photos ── */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <ImageIcon size={18} className="text-slate-400" />
          <h2 className="font-semibold text-white">Issue Photos</h2>
        </div>
        {ticket.attachments.length > 0 ? (
          <div className="grid grid-cols-3 gap-4">
            {ticket.attachments.map(att => (
              <div key={att.id}>
                <img
                  src={att.url}
                  alt={att.label}
                  className="w-full rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-200 cursor-zoom-in object-cover aspect-video"
                />
                <div className="mt-1.5">
                  <div className="text-xs font-medium text-slate-300">{att.label}</div>
                  <div className="text-xs text-slate-500">{att.uploaded_by}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No attachments yet.</p>
        )}
      </div>

      {/* ── Section 4: Status & Assignment ── */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Settings size={18} className="text-slate-400" />
          <h2 className="font-semibold text-white">Update Status & Worker</h2>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value as Status)}
            className="border border-slate-600 bg-slate-800 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="OPEN">OPEN</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
          <select
            value={selectedWorkerId}
            onChange={e => setSelectedWorkerId(e.target.value)}
            className="border border-slate-600 bg-slate-800 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Unassigned</option>
            {workers.map(w => (
              <option key={w.id} value={w.id}>{w.full_name}</option>
            ))}
          </select>
          <button
            onClick={handleStatusSave}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-lg px-4 py-2 text-sm hover:brightness-110 transition-all duration-150"
          >
            <Check size={16} />
            Save Changes
          </button>
        </div>
      </div>

      {/* ── Section 5: Activity Timeline ── */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Activity size={18} className="text-slate-400" />
          <h2 className="font-semibold text-white">Activity</h2>
        </div>
        <div className="space-y-3">
          {events.length === 0 && (
            <p className="text-sm text-slate-500">No activity yet.</p>
          )}
          {events.map(event => {
            const style = EVENT_STYLES[event.event_type]
            return (
              <div
                key={event.id}
                className={`border-l-4 ${style.border} pl-4 py-1`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`} />
                  <span className={`text-xs font-semibold uppercase ${style.text}`}>
                    {style.label}
                  </span>
                  <span className="text-xs text-slate-400">· {event.actor}</span>
                </div>
                {event.note && (
                  <p className="text-sm text-slate-300 mt-0.5 ml-4">{event.note}</p>
                )}
                <p className="text-xs text-slate-500 mt-0.5 ml-4">{fmtDateTime(event.created_at)}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Section 6: Notes ── */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <StickyNote size={18} className="text-slate-400" />
          <h2 className="font-semibold text-white">Notes</h2>
        </div>
        <div className="space-y-3 mb-5">
          {notes.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <StickyNote size={16} />
              No notes yet.
            </div>
          )}
          {notes.map(note => (
            <div key={note.id} className="bg-slate-700/50 rounded-lg p-3">
              <span className="text-sm font-semibold text-slate-200">{note.actor}</span>
              <p className="text-sm text-slate-300 mt-0.5">{note.note}</p>
              <p className="text-xs text-slate-500 mt-1">{fmtDateTime(note.created_at)}</p>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-3">
          <textarea
            rows={2}
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Add a note..."
            className="flex-1 bg-slate-700/50 border border-slate-600 text-white placeholder:text-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <button
            onClick={handleAddNote}
            disabled={!noteText.trim()}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-lg px-4 py-2 text-sm hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 whitespace-nowrap"
          >
            <MessageSquarePlus size={16} />
            Add Note
          </button>
        </div>
      </div>

      {/* ── Section 7: Completion Photos (COMPLETED only) ── */}
      {ticket.status === "COMPLETED" && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Camera size={18} className="text-slate-400" />
            <h2 className="font-semibold text-white">Completion Photos</h2>
          </div>
          {ticket.completion_photos.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {ticket.completion_photos.map(att => (
                <div key={att.id}>
                  <img
                    src={att.url}
                    alt={att.label}
                    className="w-full rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-200 cursor-zoom-in object-cover aspect-video"
                  />
                  <div className="mt-1.5">
                    <div className="text-xs font-medium text-slate-300">{att.label}</div>
                    <div className="text-xs text-slate-500">{att.uploaded_by}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No completion photos yet.</p>
          )}
        </div>
      )}

      {/* ── Edit Ticket Modal ── */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-start justify-center overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl animate-scaleIn p-6 max-w-lg w-full mx-auto mt-24 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Edit Ticket</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="hover:bg-slate-700 rounded-full p-1 text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Customer</label>
                <select
                  value={editForm.customerEmail}
                  onChange={e => {
                    const c = customers.find(c => c.email === e.target.value)
                    setEditForm(f => ({ ...f, customerEmail: e.target.value, property: c?.property_ref ?? f.property }))
                  }}
                  className="w-full bg-slate-700/50 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.email}>{c.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Property</label>
                <input
                  type="text"
                  value={editForm.property}
                  onChange={e => setEditForm(f => ({ ...f, property: e.target.value }))}
                  className="w-full bg-slate-700/50 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Job Type</label>
                  <select
                    value={editForm.jobType}
                    onChange={e => setEditForm(f => ({ ...f, jobType: e.target.value }))}
                    className="w-full bg-slate-700/50 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {["plumbing", "electrical", "hvac", "carpentry", "general"].map(j => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Urgency</label>
                  <select
                    value={editForm.urgency}
                    onChange={e => setEditForm(f => ({ ...f, urgency: e.target.value as Urgency }))}
                    className="w-full bg-slate-700/50 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {(["low", "medium", "high"] as Urgency[]).map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Reported Via</label>
                  <select
                    value={editForm.reportedVia}
                    onChange={e => setEditForm(f => ({ ...f, reportedVia: e.target.value as Ticket["reported_via"] }))}
                    className="w-full bg-slate-700/50 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {(["email", "whatsapp", "phone", "manual"] as Ticket["reported_via"][]).map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">ETA</label>
                  <input
                    type="text"
                    value={editForm.eta}
                    onChange={e => setEditForm(f => ({ ...f, eta: e.target.value }))}
                    placeholder="e.g. Within 24 hours"
                    className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder:text-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Location Notes</label>
                <input
                  type="text"
                  value={editForm.locationNotes}
                  onChange={e => setEditForm(f => ({ ...f, locationNotes: e.target.value }))}
                  className="w-full bg-slate-700/50 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Access Instructions</label>
                <input
                  type="text"
                  value={editForm.accessInstructions}
                  onChange={e => setEditForm(f => ({ ...f, accessInstructions: e.target.value }))}
                  className="w-full bg-slate-700/50 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">AI Summary</label>
                <textarea
                  rows={3}
                  value={editForm.aiSummary}
                  onChange={e => setEditForm(f => ({ ...f, aiSummary: e.target.value }))}
                  className="w-full bg-slate-700/50 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {ticket.status === "COMPLETED" && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Resolution Notes</label>
                  <textarea
                    rows={3}
                    value={editForm.resolutionNotes}
                    onChange={e => setEditForm(f => ({ ...f, resolutionNotes: e.target.value }))}
                    className="w-full bg-slate-700/50 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="border border-slate-600 text-slate-300 rounded-lg px-4 py-2 text-sm hover:bg-slate-700 transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-lg px-4 py-2 text-sm hover:brightness-110 transition-all duration-150"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-center justify-center">
          <div className="bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl animate-scaleIn p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold text-white mb-2">Delete Ticket</h2>
            <p className="text-sm text-slate-400 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-mono font-semibold">{ticket.ticket_ref}</span>? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="border border-slate-600 text-slate-300 rounded-lg px-4 py-2 text-sm hover:bg-slate-700 transition-colors duration-150"
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
