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
  CREATED:      { border: "border-gray-300",  dot: "bg-gray-400",   label: "Created",       text: "text-gray-600" },
  ASSIGNED:     { border: "border-blue-300",  dot: "bg-blue-500",   label: "Assigned",      text: "text-blue-600" },
  STATUS_CHANGE:{ border: "border-amber-300", dot: "bg-amber-500",  label: "Status Change", text: "text-amber-600" },
  NOTE:         { border: "border-purple-300",dot: "bg-purple-500", label: "Note",          text: "text-purple-600" },
  COMPLETED:    { border: "border-green-300", dot: "bg-green-500",  label: "Completed",     text: "text-green-600" },
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
      <span className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <div className="text-xs text-gray-500 mb-0.5">{label}</div>
        <div className="text-sm text-gray-900">{children}</div>
      </div>
    </div>
  )
}

// ─── Edit Form Type ───────────────────────────────────────────────────────────

type EditForm = {
  customerId: string
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
  const customer = ticket ? customers.find(c => c.id === ticket.customer_id) : null
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
    customerId: ticket?.customer_id ?? "",
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
      <div className="p-6 flex items-center gap-3 text-gray-500">
        <button
          onClick={() => router.push("/dashboard")}
          className="hover:bg-gray-100 rounded-full p-1.5 transition-colors duration-150"
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
      customerId: ticket!.customer_id,
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
      customer_id: editForm.customerId,
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

    if (selectedStatus !== prevStatus) {
      await addEvent({
        id: crypto.randomUUID(),
        ticket_id: ticket!.id,
        event_type: selectedStatus === "COMPLETED" ? "COMPLETED" : "STATUS_CHANGE",
        actor: "Manager",
        note: `Status changed from ${prevStatus} to ${selectedStatus}.`,
        created_at: now,
      })
    }
    if (selectedWorkerId !== prevWorker) {
      await addEvent({
        id: crypto.randomUUID(),
        ticket_id: ticket!.id,
        event_type: "ASSIGNED",
        actor: "Manager",
        note: selectedWorkerId
          ? `Assigned to ${workers.find(w => w.id === selectedWorkerId)?.full_name ?? "worker"}.`
          : "Worker unassigned.",
        created_at: now,
      })
    }
  }

  async function handleAddNote() {
    if (!noteText.trim()) return
    await addEvent({
      id: crypto.randomUUID(),
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
    router.push("/dashboard")
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
          onClick={() => router.push("/dashboard")}
          className="hover:bg-gray-100 rounded-full p-1.5 transition-colors duration-150 text-gray-600 flex-shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="font-mono font-bold text-xl text-gray-900">{ticket.ticket_ref}</span>
        <StatusBadge status={ticket.status} />
        <div className="flex-1" />
        <button
          onClick={handleOpenEdit}
          className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors duration-150"
        >
          <Pencil size={16} />
          Edit
        </button>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center gap-2 border border-red-300 text-red-600 rounded-lg px-3 py-1.5 text-sm hover:bg-red-50 transition-colors duration-150"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>

      {/* ── Section 1: Ticket Details ── */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <FileText size={18} className="text-gray-500" />
          <h2 className="font-semibold text-gray-900">Ticket Details</h2>
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
            {worker?.full_name ?? <span className="text-gray-400">Unassigned</span>}
          </FieldRow>
          <FieldRow icon={<CalendarClock size={16} />} label="ETA">
            {ticket.eta_description ?? <span className="text-gray-400">—</span>}
          </FieldRow>
          <FieldRow icon={<span className="flex items-center">{VIA_ICONS[ticket.reported_via]}</span>} label="Reported Via">
            <span className="flex items-center gap-1">
              {VIA_LABELS[ticket.reported_via]}
            </span>
          </FieldRow>
          <FieldRow icon={<MapPin size={16} />} label="Location Notes">
            {ticket.location_notes ?? <span className="text-gray-400">—</span>}
          </FieldRow>
          <div className="col-span-2">
            <FieldRow icon={<KeyRound size={16} />} label="Access Instructions">
              {ticket.access_instructions ?? <span className="text-gray-400">—</span>}
            </FieldRow>
          </div>
        </div>
        {ticket.ai_summary && (
          <div className="mt-5 bg-gray-50 rounded-lg p-3 text-sm italic text-gray-600">
            {ticket.ai_summary}
          </div>
        )}
      </div>

      {/* ── Section 2: Customer Details ── */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <User size={18} className="text-gray-500" />
          <h2 className="font-semibold text-gray-900">Customer Details</h2>
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
              {customer.emergency_contact ?? <span className="text-gray-400">—</span>}
            </FieldRow>
            <FieldRow icon={<ContactRound size={16} />} label="Preferred Contact">
              <span className="capitalize">{customer.preferred_contact}</span>
            </FieldRow>
            <FieldRow icon={<FileWarning size={16} />} label="Contract Expiry">
              <span className={contractExpiringSoon ? "text-red-600 flex items-center gap-1" : ""}>
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
          <p className="text-sm text-gray-400">Customer not found.</p>
        )}
      </div>

      {/* ── Section 3: Issue Photos ── */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <ImageIcon size={18} className="text-gray-500" />
          <h2 className="font-semibold text-gray-900">Issue Photos</h2>
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
                  <div className="text-xs font-medium text-gray-700">{att.label}</div>
                  <div className="text-xs text-gray-400">{att.uploaded_by}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No attachments yet.</p>
        )}
      </div>

      {/* ── Section 4: Status & Assignment ── */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Settings size={18} className="text-gray-500" />
          <h2 className="font-semibold text-gray-900">Update Status & Worker</h2>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value as Status)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="OPEN">OPEN</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
          <select
            value={selectedWorkerId}
            onChange={e => setSelectedWorkerId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Unassigned</option>
            {workers.map(w => (
              <option key={w.id} value={w.id}>{w.full_name}</option>
            ))}
          </select>
          <button
            onClick={handleStatusSave}
            className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-blue-700 transition-colors duration-150"
          >
            <Check size={16} />
            Save Changes
          </button>
        </div>
      </div>

      {/* ── Section 5: Activity Timeline ── */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Activity size={18} className="text-gray-500" />
          <h2 className="font-semibold text-gray-900">Activity</h2>
        </div>
        <div className="space-y-3">
          {events.length === 0 && (
            <p className="text-sm text-gray-400">No activity yet.</p>
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
                  <span className="text-xs text-gray-500">· {event.actor}</span>
                </div>
                {event.note && (
                  <p className="text-sm text-gray-700 mt-0.5 ml-4">{event.note}</p>
                )}
                <p className="text-xs text-gray-400 mt-0.5 ml-4">{fmtDateTime(event.created_at)}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Section 6: Notes ── */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <StickyNote size={18} className="text-gray-500" />
          <h2 className="font-semibold text-gray-900">Notes</h2>
        </div>
        <div className="space-y-3 mb-5">
          {notes.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <StickyNote size={16} />
              No notes yet.
            </div>
          )}
          {notes.map(note => (
            <div key={note.id} className="bg-gray-50 rounded-lg p-3">
              <span className="text-sm font-semibold text-gray-800">{note.actor}</span>
              <p className="text-sm text-gray-700 mt-0.5">{note.note}</p>
              <p className="text-xs text-gray-400 mt-1">{fmtDateTime(note.created_at)}</p>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-3">
          <textarea
            rows={2}
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Add a note..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <button
            onClick={handleAddNote}
            disabled={!noteText.trim()}
            className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 whitespace-nowrap"
          >
            <MessageSquarePlus size={16} />
            Add Note
          </button>
        </div>
      </div>

      {/* ── Section 7: Completion Photos (COMPLETED only) ── */}
      {ticket.status === "COMPLETED" && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Camera size={18} className="text-gray-500" />
            <h2 className="font-semibold text-gray-900">Completion Photos</h2>
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
                    <div className="text-xs font-medium text-gray-700">{att.label}</div>
                    <div className="text-xs text-gray-400">{att.uploaded_by}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No completion photos yet.</p>
          )}
        </div>
      )}

      {/* ── Edit Ticket Modal ── */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full mx-auto mt-24 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Edit Ticket</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="hover:bg-gray-100 rounded-full p-1 text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                <select
                  value={editForm.customerId}
                  onChange={e => {
                    const c = customers.find(c => c.id === e.target.value)
                    setEditForm(f => ({ ...f, customerId: e.target.value, property: c?.property_ref ?? f.property }))
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
                <input
                  type="text"
                  value={editForm.property}
                  onChange={e => setEditForm(f => ({ ...f, property: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                  <select
                    value={editForm.jobType}
                    onChange={e => setEditForm(f => ({ ...f, jobType: e.target.value }))}
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
                    value={editForm.urgency}
                    onChange={e => setEditForm(f => ({ ...f, urgency: e.target.value as Urgency }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {(["low", "medium", "high"] as Urgency[]).map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reported Via</label>
                  <select
                    value={editForm.reportedVia}
                    onChange={e => setEditForm(f => ({ ...f, reportedVia: e.target.value as Ticket["reported_via"] }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {(["email", "whatsapp", "phone", "manual"] as Ticket["reported_via"][]).map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ETA</label>
                  <input
                    type="text"
                    value={editForm.eta}
                    onChange={e => setEditForm(f => ({ ...f, eta: e.target.value }))}
                    placeholder="e.g. Within 24 hours"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location Notes</label>
                <input
                  type="text"
                  value={editForm.locationNotes}
                  onChange={e => setEditForm(f => ({ ...f, locationNotes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Access Instructions</label>
                <input
                  type="text"
                  value={editForm.accessInstructions}
                  onChange={e => setEditForm(f => ({ ...f, accessInstructions: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">AI Summary</label>
                <textarea
                  rows={3}
                  value={editForm.aiSummary}
                  onChange={e => setEditForm(f => ({ ...f, aiSummary: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {ticket.status === "COMPLETED" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Notes</label>
                  <textarea
                    rows={3}
                    value={editForm.resolutionNotes}
                    onChange={e => setEditForm(f => ({ ...f, resolutionNotes: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm hover:bg-gray-50 transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-blue-700 transition-colors duration-150"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Ticket</h2>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-mono font-semibold">{ticket.ticket_ref}</span>? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
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
