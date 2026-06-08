import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, 
  Ticket, 
  Bot, 
  Users, 
  BookOpen, 
  Terminal,
  LogOut
} from 'lucide-react'

const authorLinks = [
  { to: '/author/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/author/books', label: 'My Books', icon: BookOpen },
  { to: '/author/tickets', label: 'My Tickets', icon: Ticket },
]

const adminLinks = [
  { to: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
  { to: '/admin/tickets', label: 'Admin Tickets', icon: Ticket },
  { to: '/admin/ai-agents', label: 'AI Co-Pilot Desk', icon: Bot },
  { to: '/admin/authors', label: 'Author Registry', icon: Users },
  { to: '/admin/knowledge', label: 'Knowledge Base', icon: BookOpen },
  { to: '/admin/logs', label: 'System Logs', icon: Terminal },
];

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  // Dynamic link routing based on exact role matching
  const links = user?.role?.toLowerCase() === 'admin' ? adminLinks : authorLinks

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-[240px] min-h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-50">
      {/* Brand Logo Section */}
      <div className="px-6 py-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#1a56db] rounded-xl flex items-center justify-center shadow-sm">
            <BookOpen size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-gray-900 tracking-tight">BookLeaf</h1>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Publishing Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 text-[#1a56db]'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon 
                    size={18} 
                    className={isActive ? 'text-[#1a56db]' : 'text-gray-400'} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {link.label}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Premium Profile Section */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-xl bg-gray-50 border border-gray-100 shadow-sm transition-all hover:shadow-md">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1a56db] to-blue-400 flex items-center justify-center text-white text-sm font-bold shadow-inner shrink-0">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          
          {/* min-w-0 ensures the truncate works correctly within the flexbox */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">
              {user?.name || 'Unknown User'}
            </p>
            <p className="text-xs font-medium text-gray-500 capitalize truncate">
              {user?.role || 'Guest'} Role
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
        >
          <LogOut size={18} className="text-gray-400 group-hover:text-red-500 transition-colors" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}