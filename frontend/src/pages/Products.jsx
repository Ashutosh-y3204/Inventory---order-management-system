import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Pencil, Trash2, X, Package, RefreshCw, SlidersHorizontal, History, ChevronLeft, ChevronRight } from 'lucide-react'
import { productsApi } from '../api/products'
import toast from 'react-hot-toast'

const CATEGORIES = ['All', 'General', 'Mouse', 'Keyboard', 'Monitor', 'Cable', 'Headphone', 'Storage']
const EMPTY_FORM = { name: '', sku: '', category: 'General', price: '', stock_quantity: '' }
const PAGE_SIZE = 10

/* ─── Modals ─── */

function ProductModal({ product, onClose, onSave }) {
  const [form, setForm] = useState(product ? {
    name: product.name, sku: product.sku,
    category: product.category || 'General',
    price: product.price, stock_quantity: product.stock_quantity,
  } : EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.sku.trim()) e.sku = 'SKU is required'
    if (!form.price || Number(form.price) <= 0) e.price = 'Price must be > 0'
    if (form.stock_quantity === '' || Number(form.stock_quantity) < 0) e.stock_quantity = 'Stock must be ≥ 0'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const payload = { ...form, price: Number(form.price), stock_quantity: Number(form.stock_quantity) }
      if (product) { await productsApi.update(product.id, payload); toast.success('Product updated') }
      else { await productsApi.create(payload); toast.success('Product created') }
      onSave()
    } catch (err) { toast.error(err.response?.data?.detail || err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box max-w-md">
        <div className="modal-header">
          <h2 className="text-base font-semibold text-white">{product ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-white/10"><X size={16} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="label">Product Name</label>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Wireless Mouse" />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="label">SKU</label>
            <input className="input font-mono" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value.toUpperCase() })} placeholder="e.g. WM-001" />
            {errors.sku && <p className="text-xs text-red-400 mt-1">{errors.sku}</p>}
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Price ($)</label>
              <input className="input" type="number" min="0.01" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
              {errors.price && <p className="text-xs text-red-400 mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="label">Stock Qty</label>
              <input className="input" type="number" min="0" value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} placeholder="0" />
              {errors.stock_quantity && <p className="text-xs text-red-400 mt-1">{errors.stock_quantity}</p>}
            </div>
          </div>
        </form>
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? 'Saving...' : product ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

function RestockModal({ product, onClose, onSave }) {
  const [qty, setQty] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!qty || Number(qty) <= 0) { toast.error('Enter a valid quantity'); return }
    setLoading(true)
    try {
      await productsApi.restock(product.id, { quantity: Number(qty), note: note || undefined })
      toast.success(`Restocked ${qty} units of ${product.name}`)
      onSave()
    } catch (err) { toast.error(err.response?.data?.detail || err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box max-w-sm">
        <div className="modal-header">
          <h2 className="text-base font-semibold text-white">Restock Product</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-white/10"><X size={16} className="text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <p className="text-white font-medium text-sm">{product.name}</p>
            <p className="text-gray-400 text-xs mt-0.5">Current stock: <span className="text-white font-semibold">{product.stock_quantity}</span></p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Quantity to Add</label>
              <input className="input" type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} placeholder="e.g. 50" autoFocus />
            </div>
            <div>
              <label className="label">Note (optional)</label>
              <input className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Supplier restock" />
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? 'Restocking...' : '+ Add Stock'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AdjustModal({ product, onClose, onSave }) {
  const [qty, setQty] = useState('')
  const [reason, setReason] = useState('correction')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const q = Number(qty)
    if (qty === '' || isNaN(q)) { toast.error('Enter a valid adjustment'); return }
    setLoading(true)
    try {
      await productsApi.adjust(product.id, { quantity_change: q, note: note || undefined })
      toast.success(`Stock adjusted by ${q > 0 ? '+' : ''}${q}`)
      onSave()
    } catch (err) { toast.error(err.response?.data?.detail || err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box max-w-sm">
        <div className="modal-header">
          <h2 className="text-base font-semibold text-white">Adjust Stock</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-white/10"><X size={16} className="text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <p className="text-white font-medium text-sm">{product.name}</p>
            <p className="text-gray-400 text-xs mt-0.5">Current stock: <span className="text-white font-semibold">{product.stock_quantity}</span></p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Adjustment (positive or negative)</label>
              <input className="input" type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder="e.g. -5 or +10" autoFocus />
              <p className="text-xs text-gray-500 mt-1">New stock: {qty !== '' && !isNaN(Number(qty)) ? Math.max(0, product.stock_quantity + Number(qty)) : '—'}</p>
            </div>
            <div>
              <label className="label">Reason</label>
              <select className="input" value={reason} onChange={e => setReason(e.target.value)}>
                <option value="correction">Inventory Correction</option>
                <option value="damage">Damaged / Lost</option>
                <option value="return">Customer Return</option>
                <option value="audit">Audit Adjustment</option>
              </select>
            </div>
            <div>
              <label className="label">Note (optional)</label>
              <input className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="Additional notes..." />
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? 'Adjusting...' : 'Apply Adjustment'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TransactionsModal({ product, onClose }) {
  const [txns, setTxns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    productsApi.getTransactions(product.id)
      .then(r => setTxns(r.data || []))
      .catch(err => toast.error(err.response?.data?.detail || err.message))
      .finally(() => setLoading(false))
  }, [product.id])

  const typeColors = {
    restock: 'badge-green', sale: 'badge-blue', adjustment: 'badge-yellow',
    cancel: 'badge-purple', return: 'badge-gray'
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box max-w-lg flex flex-col" style={{ maxHeight: '80vh' }}>
        <div className="modal-header flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white">Transaction History</h2>
            <p className="text-xs text-gray-400">{product.name} · {product.sku}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-white/10"><X size={16} className="text-gray-400" /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading transactions...</div>
          ) : txns.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No transactions yet</div>
          ) : (
            <table className="w-full text-xs">
              <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <tr>
                  {['Date', 'Type', 'Qty Change', 'Stock After', 'Note'].map(h => (
                    <th key={h} className="th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {txns.map((t, i) => (
                  <tr key={i} className="table-row">
                    <td className="td text-gray-400">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="td"><span className={typeColors[t.transaction_type] || 'badge-gray'}>{t.transaction_type}</span></td>
                    <td className={`td font-mono font-semibold ${t.quantity_change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {t.quantity_change > 0 ? '+' : ''}{t.quantity_change}
                    </td>
                    <td className="td text-white">{t.stock_after}</td>
                    <td className="td text-gray-400">{t.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="modal-footer flex-shrink-0">
          <button onClick={onClose} className="btn-secondary w-full justify-center">Close</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Stock Badge ─── */
function StockBadge({ qty }) {
  if (qty === 0) return <span className="badge-red">Out of Stock</span>
  if (qty <= 10) return <span className="badge-yellow">{qty} low</span>
  return <span className="badge-green">{qty} in stock</span>
}

/* ─── Action Menu ─── */
function ActionMenu({ product, onEdit, onDelete, onRestock, onAdjust, onHistory }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
        <SlidersHorizontal size={14} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-44 rounded-xl overflow-hidden shadow-xl"
            style={{ background: '#1a1a3e', border: '1px solid rgba(255,255,255,0.12)' }}>
            {[
              { label: 'Edit', icon: <Pencil size={12} />, action: onEdit },
              { label: 'Restock', icon: <RefreshCw size={12} />, action: onRestock },
              { label: 'Adjust Stock', icon: <SlidersHorizontal size={12} />, action: onAdjust },
              { label: 'History', icon: <History size={12} />, action: onHistory },
              { label: 'Delete', icon: <Trash2 size={12} />, action: onDelete, danger: true },
            ].map(item => (
              <button key={item.label} onClick={() => { setOpen(false); item.action() }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs transition-colors ${item.danger ? 'text-red-400 hover:bg-red-500/10' : 'text-gray-300 hover:bg-white/10'}`}>
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Main Page ─── */
export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null) // { type, product? }

  const filtered = products
    .filter(p => category === 'All' || p.category === category)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function load() {
    setLoading(true)
    try {
      const res = await productsApi.getAll()
      setProducts(res.data)
    } catch (err) { toast.error(err.response?.data?.detail || err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { setPage(1) }, [search, category])

  async function handleDelete(product) {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return
    try {
      await productsApi.delete(product.id)
      toast.success('Product deleted')
      load()
    } catch (err) { toast.error(err.response?.data?.detail || err.message) }
  }

  function closeModal() { setModal(null) }
  function afterSave() { closeModal(); load() }

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="page-header">
        <div>
          <h2 className="text-xl font-semibold text-white">Products</h2>
          <p className="text-sm text-gray-400">{filtered.length} product{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setModal({ type: 'create' })} className="btn-primary">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Search + Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="input pl-9" placeholder="Search by name or SKU..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${category === cat ? 'text-white' : 'text-gray-400 hover:text-white'}`}
              style={category === cat ? { background: 'rgba(99,102,241,0.3)', border: '1px solid rgba(99,102,241,0.4)' } : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <tr>
                <th className="th">Name</th>
                <th className="th">SKU</th>
                <th className="th">Category</th>
                <th className="th">Price</th>
                <th className="th">Stock</th>
                <th className="th">Added</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 skeleton rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <Package size={36} className="mx-auto text-gray-600 mb-3" />
                    <p className="text-gray-400 text-sm">No products found</p>
                    {search && <p className="text-gray-600 text-xs mt-1">Try a different search term</p>}
                  </td>
                </tr>
              ) : paginated.map(p => (
                <tr key={p.id} className="table-row">
                  <td className="td text-white font-medium">{p.name}</td>
                  <td className="td text-gray-400 font-mono text-xs">{p.sku}</td>
                  <td className="td"><span className="badge-gray">{p.category || 'General'}</span></td>
                  <td className="td text-gray-200">${Number(p.price).toFixed(2)}</td>
                  <td className="td"><StockBadge qty={p.stock_quantity} /></td>
                  <td className="td text-gray-500 text-xs">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="td">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setModal({ type: 'edit', product: p })} className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                        <Pencil size={13} />
                      </button>
                      <ActionMenu
                        product={p}
                        onEdit={() => setModal({ type: 'edit', product: p })}
                        onDelete={() => handleDelete(p)}
                        onRestock={() => setModal({ type: 'restock', product: p })}
                        onAdjust={() => setModal({ type: 'adjust', product: p })}
                        onHistory={() => setModal({ type: 'history', product: p })}
                      />
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
            <p className="text-xs text-gray-500">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-white/10 text-gray-400 transition-colors">
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs text-gray-400 px-2 py-1">Page {page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-white/10 text-gray-400 transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.type === 'create' && <ProductModal product={null} onClose={closeModal} onSave={afterSave} />}
      {modal?.type === 'edit' && <ProductModal product={modal.product} onClose={closeModal} onSave={afterSave} />}
      {modal?.type === 'restock' && <RestockModal product={modal.product} onClose={closeModal} onSave={afterSave} />}
      {modal?.type === 'adjust' && <AdjustModal product={modal.product} onClose={closeModal} onSave={afterSave} />}
      {modal?.type === 'history' && <TransactionsModal product={modal.product} onClose={closeModal} />}
    </div>
  )
}
