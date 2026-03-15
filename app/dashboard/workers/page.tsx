"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTickets } from "@/lib/store"
import { Worker } from "@/types/index"
import { Plus, Pencil, X } from "lucide-react"

// ─── Blank form ───────────────────────────────────────────────────────────────

const BLANK = {
  full_name: "",
  phone: "",
  skills: "",
  is_active: true,
  open_tickets: 0,
}

// ─── Input helpers ────────────────────────────────────────────────────────────

const INPUT_CLS =
  "border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
const LABEL_CLS = "block text-sm font-medium text-gray-700 mb-1"

// ─── Component ────────────────────────────────────────────────────────────────

export default function WorkersPage() {
  const { workers, addWorker, updateWorker } = useTickets()
  const router = useRouter()

  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)

  function openAdd() {
    setEditId(null)
    setForm(BLANK)
    setShowModal(true)
  }

  function openEdit(e: React.MouseEvent, w: Worker) {
    e.stopPropagation()
    setEditId(w.id)
    setForm({
      full_name: w.full_name,
      phone: w.phone,
      skills: w.skills.join(", "),
      is_active: w.is_active,
      open_tickets: w.open_tickets,
    })
    setShowModal(true)
  }

  function set<K extends keyof typeof BLANK>(field: K, value: (typeof BLANK)[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!form.full_name || !form.phone) return
    setSaving(true)
    try {
      const skillsArray = form.skills
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)

      if (editId) {
        await updateWorker(editId, {
          full_name: form.full_name,
          phone: form.phone,
          skills: skillsArray,
        })
      } else {
        const newWorker: Worker = {
          id: "",
          full_name: form.full_name,
          phone: form.phone,
          skills: skillsArray,
          is_active: false,
          open_tickets: 0,
        }
        await addWorker(newWorker)
      }
      setShowModal(false)
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
          <p className="text-sm text-gray-500 mt-0.5">{workers.length} total</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-blue-700 transition-colors duration-150"
        >
          <Plus size={16} />
          Add Worker
        </button>
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
              {workers.map(w => (
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
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        w.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {w.is_active ? "Active" : "Inactive"}
                    </span>
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
              {workers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                    No workers yet. Add one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
                <label className={LABEL_CLS}>Phone *</label>
                <input className={INPUT_CLS} value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+971551234567" />
              </div>

              <div>
                <label className={LABEL_CLS}>Skills</label>
                <input
                  className={INPUT_CLS}
                  value={form.skills}
                  onChange={e => set("skills", e.target.value)}
                  placeholder="plumbing, electrical, hvac"
                />
                <p className="text-xs text-gray-400 mt-1">Comma-separated list</p>
              </div>

            </div>

            <div className="flex justify-end gap-3 mt-6">
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
