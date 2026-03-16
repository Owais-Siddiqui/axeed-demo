"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTickets } from "@/lib/store"
import { Customer } from "@/types/index"
import { Plus, Pencil, X, AlertTriangle, Search } from "lucide-react"
import { Pagination } from "@/components/pagination"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function expiryStatus(dateStr: string): "expired" | "soon" | "ok" {
  const diff = (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  if (diff < 0) return "expired"
  if (diff <= 30) return "soon"
  return "ok"
}

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

// ─── Blank form ───────────────────────────────────────────────────────────────

const BLANK: Omit<Customer, "id"> = {
  full_name: "",
  email: "",
  phone: "",
  property_ref: "",
  building_name: "",
  floor: "",
  unit_number: "",
  area: "",
  city: "",
  emergency_contact: "",
  contract_expiry: "",
  preferred_contact: "email",
}

// ─── Input / Select helpers ───────────────────────────────────────────────────

const INPUT_CLS =
  "w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
const LABEL_CLS = "block text-sm font-medium text-slate-300 mb-1"

// ─── Component ────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const { customers, addCustomer, updateCustomer } = useTickets()
  const router = useRouter()

  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<Customer, "id">>(BLANK)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  useEffect(() => { setPage(1) }, [search])

  function openAdd() {
    setEditId(null)
    setForm(BLANK)
    setShowModal(true)
  }

  function openEdit(e: React.MouseEvent, c: Customer) {
    e.stopPropagation()
    setEditId(c.id)
    setForm({
      full_name: c.full_name,
      email: c.email,
      phone: c.phone,
      property_ref: c.property_ref,
      building_name: c.building_name,
      floor: c.floor ?? "",
      unit_number: c.unit_number,
      area: c.area,
      city: c.city,
      emergency_contact: c.emergency_contact ?? "",
      contract_expiry: c.contract_expiry,
      preferred_contact: c.preferred_contact,
    })
    setShowModal(true)
  }

  function set(field: keyof Omit<Customer, "id">, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!form.full_name || !form.email || !form.phone || !form.contract_expiry) return
    setSaving(true)
    try {
      if (editId) {
        await updateCustomer(editId, {
          ...form,
          floor: form.floor || null,
          emergency_contact: form.emergency_contact || null,
        })
      } else {
        const newCustomer: Customer = {
          id: "",
          ...form,
          floor: form.floor || null,
          emergency_contact: form.emergency_contact || null,
        }
        await addCustomer(newCustomer)
      }
      setShowModal(false)
    } finally {
      setSaving(false)
    }
  }

  const q = search.toLowerCase()
  const filtered = customers.filter(c =>
    !q ||
    c.full_name.toLowerCase().includes(q) ||
    c.email.toLowerCase().includes(q) ||
    c.phone.includes(q) ||
    c.building_name.toLowerCase().includes(q) ||
    c.area.toLowerCase().includes(q)
  )
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Customers</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {search ? `${filtered.length} of ${customers.length}` : customers.length} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, building…"
              className="pl-9 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
            />
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-lg px-4 py-2 text-sm hover:from-indigo-400 hover:to-violet-500 transition-colors duration-150"
          >
            <Plus size={16} />
            Add Customer
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-800 border-b border-slate-700">
            <tr>
              {["Name", "Email", "Phone", "Building", "Area", "Contract Expiry", "Contact Pref", ""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {paged.map(c => {
              const exp = expiryStatus(c.contract_expiry)
              return (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/dashboard/customers/${c.id}`)}
                  className="hover:bg-indigo-500/5 cursor-pointer transition-colors duration-150"
                >
                  <td className="px-4 py-3 font-semibold text-white">{c.full_name}</td>
                  <td className="px-4 py-3 text-slate-400">{c.email}</td>
                  <td className="px-4 py-3 text-slate-400">{c.phone}</td>
                  <td className="px-4 py-3 text-slate-400">{c.building_name}</td>
                  <td className="px-4 py-3 text-slate-400">{c.area}</td>
                  <td className="px-4 py-3">
                    <span className="text-slate-300">{fmtDate(c.contract_expiry)}</span>
                    {exp === "soon" && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full font-medium">
                        <AlertTriangle size={11} /> Expiring Soon
                      </span>
                    )}
                    {exp === "expired" && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs bg-rose-500/15 text-rose-400 px-2 py-0.5 rounded-full font-medium">
                        <AlertTriangle size={11} /> Expired
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-400">{c.preferred_contact}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={e => openEdit(e, c)}
                      className="p-1.5 hover:bg-slate-700 rounded-full transition-colors duration-150 text-slate-400"
                    >
                      <Pencil size={15} />
                    </button>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-500 text-sm">
                  {search ? `No customers match "${search}"` : "No customers yet. Add one to get started."}
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

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-start justify-center overflow-y-auto"
          onClick={() => setShowModal(false)}
        >
          <div className="bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl animate-scaleIn p-6 max-w-lg w-full mx-4 mt-16 mb-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">
                {editId ? "Edit Customer" : "Add Customer"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-700 rounded-full text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>Full Name *</label>
                  <input className={INPUT_CLS} value={form.full_name} onChange={e => set("full_name", e.target.value)} placeholder="Ahmed Al Mansoori" />
                </div>
                <div>
                  <label className={LABEL_CLS}>Email *</label>
                  <input className={INPUT_CLS} type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="ahmed@example.com" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>Phone *</label>
                  <input className={INPUT_CLS} value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+971501234567" />
                </div>
                <div>
                  <label className={LABEL_CLS}>Property Ref *</label>
                  <input className={INPUT_CLS} value={form.property_ref} onChange={e => set("property_ref", e.target.value)} placeholder="Villa-12" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>Building Name *</label>
                  <input className={INPUT_CLS} value={form.building_name} onChange={e => set("building_name", e.target.value)} placeholder="Al Reef Villas" />
                </div>
                <div>
                  <label className={LABEL_CLS}>Floor</label>
                  <input className={INPUT_CLS} value={form.floor ?? ""} onChange={e => set("floor", e.target.value)} placeholder="7th Floor" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>Unit Number *</label>
                  <input className={INPUT_CLS} value={form.unit_number} onChange={e => set("unit_number", e.target.value)} placeholder="Apt B7" />
                </div>
                <div>
                  <label className={LABEL_CLS}>Area *</label>
                  <input className={INPUT_CLS} value={form.area} onChange={e => set("area", e.target.value)} placeholder="Al Barsha" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>City *</label>
                  <input className={INPUT_CLS} value={form.city} onChange={e => set("city", e.target.value)} placeholder="Dubai" />
                </div>
                <div>
                  <label className={LABEL_CLS}>Emergency Contact</label>
                  <input className={INPUT_CLS} value={form.emergency_contact ?? ""} onChange={e => set("emergency_contact", e.target.value)} placeholder="+971509876543" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>Contract Expiry *</label>
                  <input className={INPUT_CLS} type="date" value={form.contract_expiry} onChange={e => set("contract_expiry", e.target.value)} />
                </div>
                <div>
                  <label className={LABEL_CLS}>Preferred Contact *</label>
                  <select className={INPUT_CLS} value={form.preferred_contact} onChange={e => set("preferred_contact", e.target.value)}>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="phone">Phone</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="border border-slate-600 text-slate-300 rounded-lg px-4 py-2 text-sm hover:bg-slate-700 transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.full_name || !form.email || !form.phone || !form.contract_expiry}
                className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-lg px-4 py-2 text-sm hover:from-indigo-400 hover:to-violet-500 disabled:opacity-50 transition-colors duration-150"
              >
                {saving ? "Saving…" : editId ? "Save Changes" : "Add Customer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
