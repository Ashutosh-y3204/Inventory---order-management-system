import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Users, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { customersApi } from '../api/customers'
import toast from 'react-hot-toast'

const PAGE_SIZE = 10

function Avatar({ name }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const palette = [
    { bg: 'rgba(99,102,241,0.2)', text: '#818cf8', border: 'rgba(99,102,241,0.3)' },
    { bg: 'rgba(34,197,94,0.2)', text: '#4ade80', border: 'rgba(34,197,94,0.3)' },
    { bg: 'rgba(245,158,11,0.2)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
    { bg: 'rgba(236,72,153,0.2)', text: '#f472b6', border: 'rgba(236,72,153,0.3)' },
    { bg: 'rgba(20,184,166,0.2)', text: '#2dd4bf', border: 'rgba(20,184,166,0.3)' },
  ]
  const c = palette[name.charCodeAt(0) % palette.length]
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {initials}
    </div>
  )
}

function CustomerModal({ customer, onClose, onSave }) {
  const [form, setForm] = useState(customer ? { name: customer.name, email: customer.email, phone: customer.phone || '' } : { name: '', email: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email format'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      if (customer) { await customersApi.update(customer.id, form); toast.success('Customer updated') }
      else { await customersApi.create(form); toast.success('Customer created') }
      onSave()
    } catch (err) { toast.error(err.response?.data?.detail || err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box max-w-md">
        <div className="modal-header">
          <h2 className="text-base font-semibold text-white">{customer ? 'Edit Customer' : 'Add Customer'}</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-white/10"><X size={16} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Jane Smith" />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="label">Email Address</label>
            <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@example.com" />
            {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="label">Phone (optional)</label>
            <input className="input" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 555-0100" />
          </div>
        </form>
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? 'Saving...' : customer ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [page, setPage] = useState(1)

  const filtered = customers.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function load() {
    setLoading(true)
    try {
      const res = await customersApi.getAll()
      setCustomers(res.data)
    } catch (err) { toast.error(err.response?.data?.detail || err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { setPage(1) }, [search])

  async function handleDelete(c) {
    if (!confirm(`Delete "${c.name}"? This cannot be undone.`)) return
    try {
      await customersApi.delete(c.id)
      toast.success('Customer deleted')
      load()
    } catch (err) { toast.error(err.response?.data?.detail || err.message) }
  }

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="page-header">
        <div>
          <h2 className="text-xl font-semibold text-white">Customers</h2>
          <p className="text-sm text-gray-400">{filtered.length} customer{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setModal({ type: 'create' })} className="btn-primary">
          <Plus size={16} /> Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input className="input pl-9" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <tr>
                <th className="th">Customer</th>
                <th className="th">Email</th>
                <th className="th">Phone</th>
                <th className="th">Total Orders</th>
                <th className="th">Joined</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 skeleton rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <Users size={36} className="mx-auto text-gray-600 mb-3" />
                    <p className="text-gray-400 text-sm">No customers found</p>
                    {search && <p className="text-gray-600 text-xs mt-1">Try a different search</p>}
                  </td>
                </tr>
              ) : paginated.map(c => (
                <tr key={c.id} className="table-row">
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <Avatar name={c.name} />
                      <span className="text-white font-medium">{c.name}</span>
                    </div>
                  </td>
                  <td className="td text-gray-300">{c.email}</td>
                  <td className="td text-gray-400 text-xs">{c.phone || '—'}</td>
                  <td className="td">
                    {c.total_orders != null
                      ? <span className="badge-blue">{c.total_orders} order{c.total_orders !== 1 ? 's' : ''}</span>
                      : <span className="text-gray-600 text-xs">—</span>
                    }
                  </td>
                  <td className="td text-gray-500 text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="td">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setModal({ type: 'edit', customer: c })}
                        className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(c)}
                        className="p-1.5 rounded-md hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs text-gray-500">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
            <div className="flex gap-2 items-center">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-white/10 text-gray-400 transition-colors">
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs text-gray-400">Page {page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-white/10 text-gray-400 transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {modal?.type === 'create' && <CustomerModal customer={null} onClose={() => setModal(null)} onSave={() => { setModal(null); load() }} />}
      {modal?.type === 'edit' && <CustomerModal customer={modal.customer} onClose={() => setModal(null)} onSave={() => { setModal(null); load() }} />}
    </div>
  )
}
