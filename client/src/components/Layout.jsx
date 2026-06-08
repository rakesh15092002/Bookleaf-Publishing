import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext' // Imported context for global state
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  BookOpen, 
  Ticket, 
  LogOut, 
  Users, 
  Settings, 
  Terminal 
} from 'lucide-react'

export default function Layout({ children, title, action }) {
  const { user, logout } = useAuth() // Extracting active user data and logout function
  const [desktopOpen, setDesktopOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // 🟩 Dynamic Role Detection directly from actual user data
  const isAdmin = user?.role?.toLowerCase() === 'admin'
  const currentRoleLabel = isAdmin ? 'Admin Control' : 'Author Portal'
  
  // 🟩 DYNAMIC NAME FIX: Deriving initials and names from actual state data
  const userLetter = user?.name ? user?.name[0].toUpperCase() : 'U'
  const userName = user?.name || 'Guest User'

  const isActive = (path) => location.pathname === path

  useEffect(() => {
    setMobileOpen(false)
  }, [location])

  const authorNavigation = [
    { name: 'Dashboard', path: '/author/dashboard', icon: LayoutDashboard },
    { name: 'My Books', path: '/author/books', icon: BookOpen },
    { name: 'My Tickets', path: '/author/tickets', icon: Ticket },
  ]

  const adminNavigation = [
    { name: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Ticket Queue', path: '/admin/tickets', icon: Ticket },
    { name: 'Author Registry', path: '/admin/authors', icon: Users },
    // 
    {name:'Settings', path:'/admin/settings', icon:Settings},
    
  ]

  const activeNavigation = isAdmin ? adminNavigation : authorNavigation

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      setDesktopOpen(!desktopOpen)
    } else {
      setMobileOpen(!mobileOpen)
    }
  }

  // 🟩 FIXED: Utilizing context logout to ensure comprehensive session wipe
  const handleLogoutClick = () => {
    console.log('🔄 Initiating global authentication session wipe out...')
    logout() 
    navigate('/login', { replace: true })
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      
      {/* 1. MOBILE DRAWER OVERLAY BACKDROP */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
        />
      )}

      {/* 2. ADAPTIVE SIDEBAR CONTAINER */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200/80 p-5 flex flex-col justify-between
        transition-all duration-300 ease-in-out lg:static lg:h-screen shrink-0
        ${mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
        ${desktopOpen ? 'lg:w-64' : 'lg:w-20 lg:px-3'}
      `}>
        <div className="space-y-6">
          
          <div className={`flex items-center justify-between border-b border-slate-100 pb-4 ${!desktopOpen && 'lg:justify-center lg:flex-col lg:gap-3'}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 bg-[#1a56db] rounded-xl flex items-center justify-center text-white text-lg font-black shadow-sm shrink-0">
                B
              </div>
              <div className={`transition-opacity duration-200 ${desktopOpen ? 'block' : 'lg:hidden'}`}>
                {/* 🟩 DESIGN TWEAK: Logo text set to soft black for professional feel */}
                <h1 className="text-sm font-black text-slate-800 tracking-tight">BookLeaf</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{currentRoleLabel}</p>
              </div>
            </div>
            
            <button
              onClick={handleToggle}
              className={`p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-100 shadow-sm bg-white transition-all hover:scale-105 ${
                !desktopOpen && 'lg:w-9 lg:h-9 lg:flex lg:items-center lg:justify-center'
              }`}
              title={desktopOpen ? 'Collapse Menu' : 'Expand Menu'}
            >
              {mobileOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>

          <nav className="space-y-1">
            {activeNavigation.map((item) => {
              const ActiveIcon = item.icon
              const active = isActive(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all group relative ${
                    active
                      ? 'bg-blue-50 text-[#1a56db] shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  } ${!desktopOpen && 'lg:justify-center lg:px-2'}`}
                  title={!desktopOpen ? item.name : ''}
                >
                  <ActiveIcon size={18} className={active ? 'text-[#1a56db]' : 'text-slate-400 group-hover:text-slate-700'} />
                  <span className={`transition-opacity duration-200 ${desktopOpen ? 'block' : 'lg:hidden'}`}>
                    {item.name}
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <button 
            onClick={handleLogoutClick}
            className={`w-full flex items-center justify-between p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50/50 transition-colors font-bold text-xs sm:text-sm ${!desktopOpen && 'lg:justify-center lg:p-1'}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs border shrink-0 shadow-sm transition-transform group-hover:scale-105 ${
                isAdmin 
                  ? 'bg-purple-50 text-purple-600 border-purple-100' 
                  : 'bg-gradient-to-br from-indigo-50 to-blue-50/80 text-indigo-600 border-indigo-100'
              }`}>
                {userLetter}
              </div>
              {/* 🟩 DESIGN TWEAK: Softened user name color from text-slate-700 to text-slate-600 for better balance */}
              <span className={`truncate max-w-[110px] text-slate-600 ${desktopOpen ? 'block' : 'lg:hidden'}`}>
                {userName}
              </span>
            </div>
            <LogOut size={16} className={`shrink-0 ${desktopOpen ? 'block' : 'lg:hidden'}`} />
          </button>
        </div>
      </aside>

      {/* 3. MAIN WORKSPACE VIEWSCREEN */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        
        {/* Floating Mobile Toggle (Replaces Header for cleaner UI) */}
        <button
          onClick={() => setMobileOpen(true)}
          className="absolute top-4 left-4 z-30 p-2 rounded-xl text-slate-500 bg-white border border-slate-200 shadow-sm lg:hidden"
        >
          <Menu size={18} />
        </button>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 pt-16 lg:pt-8 bg-slate-50/50">
          
          {/* Main Content Area Top Section - Softened Colors for Premium Look */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/60 pb-5">
            <div>
              {/* 🟩 DESIGN TWEAK: Primary page title softened from text-slate-900 to text-slate-800 */}
              <h2 className="text-xl sm:text-2xl font-black text-slate-700 tracking-tight">
                {title}
              </h2>
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>

          {children}
        </main>
      </div>

    </div>
  )
}