import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { to: '/products', label: 'Products', icon: '📦' },
  { to: '/customers', label: 'Customers', icon: '👥' },
  { to: '/orders', label: 'Orders', icon: '🛒' },
]

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/products': 'Products',
  '/customers': 'Customers',
  '/orders': 'Orders',
}

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{background: 'linear-gradient(135deg, #0f0c29 0%, #1a1a3e 50%, #0d0d2b 100%)'}}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-44 flex flex-col
        transform transition-transform duration-200 ease-in-out
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{background: 'rgba(15,12,40,0.95)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(139,92,246,0.2)'}}>

        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-5" style={{borderBottom: '1px solid rgba(139,92,246,0.2)'}}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{background: 'linear-gradient(135deg,#6366f1,#8b5cf6)'}}>
            IO
          </div>
          <div>
            <p className="text-white font-bold text-xs leading-tight">InventoryOS</p>
            <p className="text-purple-400 text-xs leading-tight" style={{fontSize:'9px'}}>Management System</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all
                ${isActive
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }
              `}
              style={({ isActive }) => isActive ? {background: 'rgba(99,102,241,0.3)', border: '1px solid rgba(99,102,241,0.4)'} : {}}
            >
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User Controls */}
        <div className="px-3 py-4" style={{borderTop: '1px solid rgba(139,92,246,0.2)'}}>
          <p className="text-gray-500 text-xs mb-3 px-1">User Controls</p>
          <div className="flex gap-2">
            <NavLink
              to="/login"
              className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-xs text-gray-400 hover:text-white transition-all"
              style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}}
            >
              <span className="text-lg">👤</span>
              <span style={{fontSize:'9px'}}>LOGIN</span>
            </NavLink>
            <button
              onClick={handleLogout}
              className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-xs text-gray-400 hover:text-red-400 transition-all"
              style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}}
            >
              <span className="text-lg">⏻</span>
              <span style={{fontSize:'9px'}}>LOGOUT</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-3" style={{background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)'}}>
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-gray-400" onClick={() => setSidebarOpen(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <h1 className="text-white font-bold text-lg">{pageTitles[location.pathname] || 'InventoryOS'}</h1>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{background: 'linear-gradient(135deg,#6366f1,#8b5cf6)'}}>
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
