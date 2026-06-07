import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, 
  Ticket, 
  Bot, 
  Users, 
  BookOpen, 
  Terminal,
  LogOut // Import fix kiya
} from 'lucide-react'

// Author ke links yahan define karo
const authorLinks = [
  { to: '/author/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/author/books', label: 'My Books', icon: BookOpen },
  { to: '/author/tickets', label: 'My Tickets', icon: Ticket },
]

const adminLinks = [
  { to: '/admin/dashboard', label: 'Control Center', icon: LayoutDashboard },
  { to: '/admin/tickets', label: 'Global Tickets', icon: Ticket },
  { to: '/admin/ai-agents', label: 'AI Co-Pilot Desk', icon: Bot },
  { to: '/admin/authors', label: 'Author Registry', icon: Users },
  { to: '/admin/knowledge', label: 'Knowledge Base', icon: BookOpen },
  { to: '/admin/logs', label: 'System Logs', icon: Terminal },
];

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  // Role check karo (dhyan rahe role 'admin' hi ho)
 // Sidebar.jsx mein yeh line change karo:
const links = user?.role?.toLowerCase() === 'admin' ? adminLinks : authorLinks

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-[220px] min-h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0">
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#1a56db] rounded-lg flex items-center justify-center">
            <BookOpen size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900">BookLeaf</h1>
            <p className="text-xs text-gray-400">Publishing Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links.map((link) => {
          const Icon = link.icon
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#1a56db] text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} className={isActive ? 'text-white' : 'text-gray-400'} />
                  {link.label}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100 space-y-1">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gray-50">
          <div className="w-7 h-7 rounded-full bg-[#1a56db] flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-gray-800 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all"
        >
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </aside>
  )
}