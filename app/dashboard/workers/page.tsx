"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTickets } from "@/lib/store"
import { Worker } from "@/types/index"
import { Plus, Pencil, X, Search, ChevronDown } from "lucide-react"
import { Pagination } from "@/components/pagination"

// ─── Constants ────────────────────────────────────────────────────────────────

const SKILL_OPTIONS = ["Plumbing", "Electrical", "HVAC", "Carpentry", "General", "Painting", "Tiling", "Landscaping"]

const BLANK = {
  full_name: "",
  email: "",
  phone: "",
  skills: [] as string[],
  is_active: true,
  open_tickets: 0,
}

// ─── Input helpers ────────────────────────────────────────────────────────────

const INPUT_CLS =
  "border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
const LABEL_CLS = "block text-sm font-medium text-gray-700 mb-1"

// ─── Skills Dropdown ──────────────────────────────────────────────────────────

function SkillsDropdown({
  selected: selectedProp,
  onChange,
}: {
  selected: string[]
  onChange: (skills: string[]) => void
}) {
  const selected = Array.isArray(selectedProp) ? selectedProp : []
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function toggle(skill: string) {
    onChange(
      selected.includes(skill)
        ? selected.filter(s => s !== skill)
        : [...selected, skill]
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full flex items-center justify-between bg-white"
      >
        <span className={selected.length === 0 ? "text-gray-400" : "text-gray-900"}>
          {selected.length === 0
            ? "Select skills…"
            : selected.join(", ")}
        </span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1">
          {SKILL_OPTIONS.map(skill => (
            <label
              key={skill}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-800"
            >
              <input
                type="checkbox"
                checked={selected.includes(skill)}
                onChange={() => toggle(skill)}
                className="accent-blue-600 w-4 h-4 rounded"
              />
              {skill}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WorkersPage() {
  const { workers, addWorker, updateWorker } = useTickets()
  const router = useRouter()

  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<typeof BLANK>(BLANK)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!search.trim()) return workers
    const q = search.toLowerCase()
    return workers.filter(
      w =>
        w.full_name.toLowerCase().includes(q) ||
        w.phone.toLowerCase().includes(q) ||
        (w.email ?? "").toLowerCase().includes(q) ||
        w.skills.some(s => s.toLowerCase().includes(q))
    )
  }, [workers, search])

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  function openAdd() {
    setEditId(null)
    setForm(BLANK)
    setSaveError(null)
    setShowModal(true)
  }

  function openEdit(e: React.MouseEvent, w: Worker) {
    e.stopPropagation()
    setSaveError(null)
    setEditId(w.id)
    const skills = Array.isArray(w.skills)
      ? w.skills
      : typeof w.skills === "string"
        ? (w.skills as string).split(",").map(s => s.trim()).filter(Boolean)
        : []
    setForm({
      full_name: w.full_name,
      email: w.email ?? "",
      phone: w.phone,
      skills,
      is_active: w.is_active,
      open_tickets: w.open_tickets,
    })
    setShowModal(true)
  }

  function set<K extends keyof typeof BLANK>(field: K, value: (typeof BLANK)[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleToggleActive(e: React.MouseEvent, w: Worker) {
    e.stopPropagation()
    setToggling(w.id)
    try {
      await updateWorker(w.id, { is_active: !w.is_active })
    } finally {
      setToggling(null)
    }
  }

  async function handleSave() {
    if (!form.full_name || !form.phone) return
    setSaving(true)
    setSaveError(null)
    try {
      if (editId) {
        await updateWorker(editId, {
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          skills: form.skills,
          is_active: form.is_active,
        })
      } else {
        const newWorker: Worker = {
          id: "",
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          skills: form.skills,
          is_active: form.is_active,
          open_tickets: 0,
        }
        await addWorker(newWorker)
      }
      setShowModal(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Workers</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length !== workers.length
              ? `${filtered.length} of ${workers.length} total`
              : `${workers.length} total`}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-blue-700 transition-colors duration-150"
        >
          <Plus size={16} />
          Add Worker
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search by name, phone, or skill…"
          className="border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-sm bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Name", "Phone", "Skills", "Status", "Open Tickets", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paged.map(w => (
                <tr
                  key={w.id}
                  onClick={() => router.push(`/dashboard/workers/${w.id}`)}
                  className="hover:bg-blue-50 cursor-pointer transition-colors duration-150"
                >
                  <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{w.full_name}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{w.phone}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {w.skills.map(skill => (
                        <span key={skill} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full capitalize">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={e => handleToggleActive(e, w)}
                      disabled={toggling === w.id}
                      title={w.is_active ? "Click to set Inactive" : "Click to set Active"}
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full transition-colors duration-150 disabled:opacity-50 ${
                        w.is_active
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {w.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-mono">{w.open_tickets}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={e => openEdit(e, w)}
                      className="p-1.5 hover:bg-gray-100 rounded-full transition-colors duration-150 text-gray-500"
                    >
                      <Pencil size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                    {search ? "No workers match your search." : "No workers yet. Add one to get started."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination
            total={filtered.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
          />
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto"
          onClick={() => setShowModal(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 mt-16 mb-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                {editId ? "Edit Worker" : "Add Worker"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-full">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className={LABEL_CLS}>Full Name *</label>
                <input className={INPUT_CLS} value={form.full_name} onChange={e => set("full_name", e.target.value)} placeholder="Khalid Hassan" />
              </div>

              <div>
                <label className={LABEL_CLS}>Email</label>
                <input className={INPUT_CLS} type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="worker@example.com" />
              </div>

              <div>
                <label className={LABEL_CLS}>Phone *</label>
                <input className={INPUT_CLS} value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+971551234567" />
              </div>

              <div>
                <label className={LABEL_CLS}>Skills</label>
                <SkillsDropdown
                  selected={form.skills}
                  onChange={skills => set("skills", skills)}
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <label className={LABEL_CLS + " mb-0"}>Active Status</label>
                <button
                  type="button"
                  onClick={() => set("is_active", !form.is_active)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                    form.is_active ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                      form.is_active ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-gray-400 -mt-3">
                {form.is_active ? "Worker is active and can be assigned tickets." : "Worker is inactive and won't appear in assignment options."}
              </p>
            </div>

            {saveError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-4">
                {saveError}
              </p>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="border border-red-300 text-red-600 rounded-lg px-4 py-2 text-sm hover:bg-red-50 transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.full_name || !form.phone}
                className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors duration-150"
              >
                {saving ? "Saving…" : editId ? "Save Changes" : "Add Worker"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
