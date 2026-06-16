import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Area, AreaChart
} from 'recharts'
import { dashboardApi } from '../api/dashboard'

const COLORS = ['#6366f1', '#f97316', '#22c55e', '#eab308', '#ec4899', '#14b8a6']

const cardStyle = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px'
}

function StatCard({ label, value, icon, color, sub, loading }) {
  const colors = {
    indigo: { bg: 'rgba(99,102,241,0.15)', text: '#818cf8', border: 'rgba(99,102,241,0.25)' },
    emerald: { bg: 'rgba(34,197,94,0.15)', text: '#4ade80', border: 'rgba(34,197,94,0.25)' },
    amber: { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
    red: { bg: 'rgba(239,68,68,0.15)', text: '#f87171', border: 'rgba(239,68,68,0.25)' },
    teal: { bg: 'rgba(20,184,166,0.15)', text: '#2dd4bf', border: 'rgba(20,184,166,0.25)' },
  }
  const c = colors[color] || colors.indigo
  return (
    <div className="p-5 flex items-start gap-4" style={cardStyle}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: c.bg, border: `1px solid ${c.border}` }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-gray-400 text-xs font-medium truncate">{label}</p>
        {loading ? (
          <div className="mt-1 h-7 w-20 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.1)' }} />
        ) : (
          <p className="text-white text-2xl font-bold mt-0.5">{value}</p>
        )}
        {sub && !loading && <p className="text-xs mt-0.5" style={{ color: c.text }}>{sub}</p>}
      </div>
    </div>
  )
}

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

const tooltipStyle = {
  contentStyle: { background: '#1a1a3e', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: 'white', fontSize: '12px' }
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [revenue, setRevenue] = useState([])
  const [stockStatus, setStockStatus] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [s, r, st, ls, ro] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getRevenueByCategory(),
          dashboardApi.getStockStatus(),
          dashboardApi.getLowStockTable(),
          dashboardApi.getRecentOrders(),
        ])
        setStats(s.data)
        setRevenue(r.data.length ? r.data.map(d => ({ name: d.category, value: Number(d.revenue) })) : [])
        setStockStatus(st.data.length ? st.data : [])
        setLowStock(ls.data || [])
        setRecentOrders(ro.data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalRevenue = revenue.reduce((sum, d) => sum + d.value, 0)
  const fmt = (n) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Number(n).toFixed(2)}`

  return (
    <div className="p-5 space-y-5 max-w-screen-xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-white text-xl font-bold">Overview</h2>
        <p className="text-gray-400 text-sm">Monitor your inventory and business metrics</p>
      </div>

      {/* Stats — 5 cards */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard label="Total Revenue" value={fmt(stats?.total_revenue ?? 0)} icon="💰" color="teal" sub="lifetime" loading={loading} />
        <StatCard label="Total Products" value={stats?.total_products ?? 0} icon="📦" color="indigo" loading={loading} />
        <StatCard label="Total Customers" value={stats?.total_customers ?? 0} icon="👥" color="emerald" loading={loading} />
        <StatCard label="Total Orders" value={stats?.total_orders ?? 0} icon="🛒" color="amber" loading={loading} />
        <StatCard label="Low Stock Alerts" value={stats?.low_stock_alerts ?? 0} icon="⚠️" color="red" sub={stats?.low_stock_alerts > 0 ? 'needs attention' : 'all healthy'} loading={loading} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Donut */}
        <div className="p-5" style={cardStyle}>
          <h3 className="text-white font-semibold mb-4 text-sm">Revenue by Category</h3>
          {revenue.length === 0 && !loading ? (
            <div className="flex items-center justify-center h-64 text-gray-500 text-sm">No revenue data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={revenue} cx="50%" cy="45%" innerRadius={65} outerRadius={105}
                  paddingAngle={3} dataKey="value" labelLine={false} label={CustomPieLabel}>
                  {revenue.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Revenue']} {...tooltipStyle} />
                <Legend iconType="circle" formatter={(v) => <span style={{ color: '#9ca3af', fontSize: '11px' }}>{v}</span>} />
                <text x="50%" y="41%" textAnchor="middle" fill="white" fontSize="15" fontWeight="bold">
                  ${totalRevenue.toLocaleString()}
                </text>
                <text x="50%" y="47%" textAnchor="middle" fill="#9ca3af" fontSize="9">TOTAL REVENUE</text>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar Stock Status */}
        <div className="p-5" style={cardStyle}>
          <h3 className="text-white font-semibold mb-4 text-sm">Stock Status by Product</h3>
          {stockStatus.length === 0 && !loading ? (
            <div className="flex items-center justify-center h-64 text-gray-500 text-sm">No products yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stockStatus.slice(0, 6)} layout="vertical" margin={{ top: 5, right: 40, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => v.length > 14 ? v.slice(0, 13) + '…' : v} />
                <Tooltip {...tooltipStyle} />
                <Legend iconType="circle" formatter={(v) => <span style={{ color: '#9ca3af', fontSize: '11px' }}>{v === 'current_stock' ? 'Current Stock' : 'Pending Orders'}</span>} />
                <Bar dataKey="current_stock" name="current_stock" fill="#6366f1" radius={[0, 4, 4, 0]} />
                <Bar dataKey="pending_orders" name="pending_orders" fill="#f97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Low Stock */}
        <div style={cardStyle}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <h3 className="text-white text-sm font-semibold">Low Stock Products</h3>
              {lowStock.length > 0 && (
                <span className="badge-red">{lowStock.length}</span>
              )}
            </div>
            <Link to="/products" className="text-purple-400 text-xs hover:text-purple-300">View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Product', 'SKU', 'Stock', 'Threshold', 'Status'].map(h => (
                    <th key={h} className="th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-3 skeleton rounded w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : lowStock.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-gray-500 py-10 text-xs">✅ All products have healthy stock</td></tr>
                ) : lowStock.map(p => (
                  <tr key={p.id} className="table-row">
                    <td className="td text-white font-medium">{p.name}</td>
                    <td className="td text-gray-400 font-mono">{p.sku}</td>
                    <td className="td text-white font-semibold">{p.current_stock}</td>
                    <td className="td text-gray-400">{p.safety_threshold}</td>
                    <td className="td">
                      <span className={p.current_stock === 0 ? 'badge-red' : 'badge-yellow'}>
                        {p.current_stock === 0 ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Orders */}
        <div style={cardStyle}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <span>🛒</span>
              <h3 className="text-white text-sm font-semibold">Recent Orders</h3>
            </div>
            <Link to="/orders" className="text-purple-400 text-xs hover:text-purple-300">View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Order #', 'Customer', 'Product', 'Total', 'Date'].map(h => (
                    <th key={h} className="th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-3 skeleton rounded w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : recentOrders.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-gray-500 py-10 text-xs">No orders yet</td></tr>
                ) : recentOrders.map((o, i) => (
                  <tr key={i} className="table-row">
                    <td className="td text-purple-400 font-mono font-bold">{o.order_id}</td>
                    <td className="td text-gray-300">{o.customer || `#${o.customer_id}`}</td>
                    <td className="td text-white">{o.product || o.category || '—'}</td>
                    <td className="td text-green-400 font-semibold">${Number(o.total).toFixed(2)}</td>
                    <td className="td text-gray-500">{o.date ? new Date(o.date).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
