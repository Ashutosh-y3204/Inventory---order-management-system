import { useEffect, useState } from 'react'
import { Plus, X, ShoppingCart, Trash2, ChevronDown, ChevronUp, Search, Ban, ChevronLeft, ChevronRight } from 'lucide-react'
import { ordersApi } from '../api/orders'
import { productsApi } from '../api/products'
import { customersApi } from '../api/customers'
import toast from 'react-hot-toast'

const PAGE_SIZE = 10

const STATUS_BADGE = {
  pending: 'badge-yellow',
  completed: 'badge-green',
  cancelled: 'badge-red',
  processing: 'badge-blue',
}

function CreateOrderModal({ onClose, onSave }) {
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [customerId, setCustomerId] = useState('')
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    Promise.all([customersApi.getAll(), productsApi.getAll()])
      .then(([c, p]) => { setCustomers(c.data); setProducts(p.data) })
      .catch(err => toast.error(err.response?.data?.detail || err.message))
  }, [])

  const getProduct = (id) => products.find(p => p.id === Number(id))

  function addItem() { setItems([...items, { product_id: '', quantity: 1 }]) }
  function removeItem(i) { setItems(items.filter((_, idx) => idx !== i)) }
  function updateItem(i, field, value) {
    const updated = [...items]
    updated[i] = { ...updated[i], [field]: value }
    setItems(updated)
  }

  const calculateTotal = () => items.reduce((sum, item) => {
    const p = getProduct(item.product_id)
    return sum + (p ? p.price * (Number(item.quantity) || 0) : 0)
  }, 0)

  function validate() {
    const e = {}
    if (!customerId) e.customer = 'Select a customer'
    items.forEach((item, i) => {
      if (!item.product_id) e[`item_${i}_product`] = 'Select a product'
      if (!item.quantity || Number(item.quantity) < 1) e[`item_${i}_qty`] = 'Min qty 1'
      const p = getProduct(item.product_id)
      if (p && Number(item.quantity) > p.stock_quantity) e[`item_${i}_qty`] = `Max ${p.stock_quantity} available`
    })
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      await ordersApi.create({
        customer_id: Number(customerId),
        items: items.map(i => ({ product_id: Number(i.product_id), quantity: Number(i.quantity) }))
      })
      toast.success('Order created successfully')
      onSave()
    } catch (err) { toast.error(err.response?.data?.detail || err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box max-w-xl flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="modal-header flex-shrink-0">
          <h2 className="text-base font-semibold text-white">Create New Order</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-white/10"><X size={16} className="text-gray-400" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Customer */}
          <div>
            <label className="label">Customer</label>
            <select className="input" value={customerId} onChange={e => setCustomerId(e.target.value)}>
              <option value="">Select a customer...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.email}</option>)}
            </select>
            {errors.customer && <p className="text-xs text-red-400 mt-1">{errors.customer}</p>}
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label mb-0">Order Items</label>
              <button type="button" onClick={addItem} className="text-xs flex items-center gap-1" style={{ color: '#818cf8' }}>
                <Plus size={12} /> Add item
              </button>
            </div>
            <div className="space-y-3">
              {items.map((item, i) => {
                const product = getProduct(item.product_id)
                const exceeds = product && Number(item.quantity) > product.stock_quantity
                return (
                  <div key={i} className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <select className="input text-sm" value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)}>
                          <option value="">Select product...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id} disabled={p.stock_quantity === 0}>
                              {p.name} — ${Number(p.price).toFixed(2)} ({p.stock_quantity} in stock){p.stock_quantity === 0 ? ' [Out of stock]' : ''}
                            </option>
                          ))}
                        </select>
                        {errors[`item_${i}_product`] && <p className="text-xs text-red-400 mt-1">{errors[`item_${i}_product`]}</p>}
                      </div>
                      <div className="w-24">
                        <input className={`input text-sm ${exceeds ? 'border-red-500/60' : ''}`} type="number" min="1"
                          max={product?.stock_quantity || 9999} value={item.quantity}
                          onChange={e => updateItem(i, 'quantity', e.target.value)} placeholder="Qty" />
                        {errors[`item_${i}_qty`] && <p className="text-xs text-red-400 mt-1">{errors[`item_${i}_qty`]}</p>}
                      </div>
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)} className="p-2 rounded-md hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    {product && (
                      <div className="flex justify-between text-xs text-gray-400 px-1">
                        <span>Unit: ${Number(product.price).toFixed(2)} · Stock: {product.stock_quantity}</span>
                        <span className="font-medium text-white">Subtotal: ${(product.price * (Number(item.quantity) || 0)).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Total */}
          <div className="rounded-xl px-4 py-3 flex justify-between items-center" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <span className="text-sm font-medium text-gray-300">Order Total</span>
            <span className="text-xl font-bold text-white">${calculateTotal().toFixed(2)}</span>
          </div>
        </div>
        <div className="modal-footer flex-shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? 'Placing...' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  )
}

function OrderRow({ order, onCancel }) {
  const [expanded, setExpanded] = useState(false)
  const status = order.status || 'completed'

  return (
    <>
      <tr className="table-row" onClick={() => setExpanded(!expanded)} style={{ cursor: 'pointer' }}>
        <td className="td text-purple-400 font-mono font-bold">#{order.id.toString().padStart(4, '0')}</td>
        <td className="td text-gray-200">{order.customer_name || `Customer #${order.customer_id}`}</td>
        <td className="td text-white font-semibold">${Number(order.total_amount).toFixed(2)}</td>
        <td className="td"><span className="badge-blue">{order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}</span></td>
        <td className="td"><span className={STATUS_BADGE[status] || 'badge-gray'}>{status}</span></td>
        <td className="td text-gray-500 text-xs">{new Date(order.created_at).toLocaleDateString()}</td>
        <td className="td">
          <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
            {(status === 'pending' || status === 'processing' || status === 'completed') && (
              <button onClick={() => onCancel(order)}
                className="p-1.5 rounded-md hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors" title="Cancel order">
                <Ban size={13} />
              </button>
            )}
            {expanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
          </div>
        </td>
      </tr>
      {expanded && order.items && order.items.length > 0 && (
        <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
          <td colSpan={7} className="px-6 py-3">
            <div className="space-y-1.5">
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Order Items</p>
              {order.items.map(item => (
                <div key={item.id} className="flex items-center gap-6 text-xs rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <span className="text-white font-medium flex-1">{item.product_name || `Product #${item.product_id}`}</span>
                  <span className="text-gray-400">× {item.quantity}</span>
                  <span className="text-gray-400">@ ${Number(item.price).toFixed(2)}</span>
                  <span className="text-green-400 font-semibold">= ${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const filtered = orders
    .filter(o => statusFilter === 'all' || (o.status || 'completed') === statusFilter)
    .filter(o => !search || `#${o.id}`.includes(search) || (o.customer_name || '').toLowerCase().includes(search.toLowerCase()))

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function load() {
    setLoading(true)
    try {
      const res = await ordersApi.getAll()
      setOrders((res.data || []).reverse())
    } catch (err) { toast.error(err.response?.data?.detail || err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { setPage(1) }, [search, statusFilter])

  async function handleCancel(order) {
    if (!confirm(`Cancel order #${order.id.toString().padStart(4, '0')}? Stock will be restored.`)) return
    try {
      await ordersApi.cancel(order.id)
      toast.success('Order cancelled. Stock restored.')
      load()
    } catch (err) { toast.error(err.response?.data?.detail || err.message) }
  }

  const STATUSES = ['all', 'pending', 'processing', 'completed', 'cancelled']

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="page-header">
        <div>
          <h2 className="text-xl font-semibold text-white">Orders</h2>
          <p className="text-sm text-gray-400">{filtered.length} order{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} /> New Order
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="input pl-9" placeholder="Search by order # or customer..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all ${statusFilter === s ? 'text-white' : 'text-gray-400 hover:text-white'}`}
              style={statusFilter === s ? { background: 'rgba(99,102,241,0.3)', border: '1px solid rgba(99,102,241,0.4)' } : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <tr>
                <th className="th">Order ID</th>
                <th className="th">Customer</th>
                <th className="th">Total</th>
                <th className="th">Items</th>
                <th className="th">Status</th>
                <th className="th">Date</th>
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
                    <ShoppingCart size={36} className="mx-auto text-gray-600 mb-3" />
                    <p className="text-gray-400 text-sm">No orders found</p>
                    {!search && statusFilter === 'all' && (
                      <button onClick={() => setShowModal(true)} className="mt-3 text-xs text-purple-400 hover:text-purple-300">
                        Create your first order →
                      </button>
                    )}
                  </td>
                </tr>
              ) : paginated.map(order => <OrderRow key={order.id} order={order} onCancel={handleCancel} />)}
            </tbody>
          </table>
        </div>

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

      {showModal && <CreateOrderModal onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); load() }} />}
    </div>
  )
}
