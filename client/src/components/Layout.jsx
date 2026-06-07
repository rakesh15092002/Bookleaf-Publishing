import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
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
  const [desktopOpen, setDesktopOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // 🟩 Dynamic Role Detection based on route mapping
  const isAdmin = location.pathname.startsWith('/admin')
  const currentRoleLabel = isAdmin ? 'Admin Control' : 'Author Portal'
  const userLetter = isAdmin ? 'A' : 'P'
  const userName = isAdmin ? 'System Administrator' : 'Priya Sharma'

  const isActive = (path) => location.pathname === path

  useEffect(() => {
    setMobileOpen(false)
  }, [location])

  // 🟩 Dynamic Navigation Array Selection based on User Privilege Role
  const authorNavigation = [
    { name: 'Dashboard', path: '/author/dashboard', icon: LayoutDashboard },
    { name: 'My Books', path: '/author/books', icon: BookOpen },
    { name: 'My Tickets', path: '/author/tickets', icon: Ticket },
  ]

  const adminNavigation = [
    { name: 'Control Center', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Global Tickets', path: '/admin/tickets', icon: Ticket },
    { name: 'System Logs', path: '/admin/logs', icon: Terminal },
  ]

  const activeNavigation = isAdmin ? adminNavigation : authorNavigation

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      setDesktopOpen(!desktopOpen)
    } else {
      setMobileOpen(!mobileOpen)
    }
  }

  // 🟩 FIXED: Functional Logout pipeline that safely wipes active sessions
  const handleLogout = () => {
    console.log('🔄 Initiating global authentication session wipe out...')
    
    // Auth token credentials, tokens, aur roles ko local storage se clear karo
    localStorage.removeItem('token')
    localStorage.removeItem('user_role')
    localStorage.removeItem('user_session')
    
    // Explicit safety flush for session storage fallback vectors
    sessionStorage.clear()
    
    // Redirect instantly to root landing login panel route window
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
          
          {/* SIDEBAR HEADER: Logo and Hamburger Control */}
          <div className={`flex items-center justify-between border-b border-slate-100 pb-4 ${!desktopOpen && 'lg:justify-center lg:flex-col lg:gap-3'}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 bg-[#1a56db] rounded-xl flex items-center justify-center text-white text-lg font-black shadow-sm shrink-0">
                B
              </div>
              <div className={`transition-opacity duration-200 ${desktopOpen ? 'block' : 'lg:hidden'}`}>
                <h1 className="text-sm font-black text-slate-800 tracking-tight">BookLeaf</h1>
                {/* 🟩 Dynamic Role Sub-label */}
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

          {/* Nav Links Mapping Panel — Dynamic route list */}
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

        {/* Bottom Profile Identity Context Element */}
        <div className="border-t border-slate-100 pt-4">
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center justify-between p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50/50 transition-colors font-bold text-xs sm:text-sm ${!desktopOpen && 'lg:justify-center lg:p-1'}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {/* 🟩 Dynamic color configuration switch for Admin vs Author placeholder look */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs border shrink-0 shadow-sm transition-transform group-hover:scale-105 ${
                isAdmin 
                  ? 'bg-purple-50 text-purple-600 border-purple-100' 
                  : 'bg-gradient-to-br from-indigo-50 to-blue-50/80 text-indigo-600 border-indigo-100'
              }`}>
                {userLetter}
              </div>
              <span className={`truncate max-w-[110px] text-slate-700 ${desktopOpen ? 'block' : 'lg:hidden'}`}>
                {userName}
              </span>
            </div>
            <LogOut size={16} className={`shrink-0 ${desktopOpen ? 'block' : 'lg:hidden'}`} />
          </button>
        </div>
      </aside>

      {/* 3. MAIN WORKSPACE VIEWSCREEN EXPANSION DESK */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Core Global Fixed Header Navbar */}
        <header className="bg-white border-b border-slate-200/80 px-4 sm:px-6 h-16 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-100 shadow-sm bg-white lg:hidden shrink-0"
            >
              <Menu size={18} />
            </button>
            
            <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight truncate pl-1">
              {title}
            </h2>
          </div>

          {action && <div className="shrink-0 ml-2">{action}</div>}
        </header>

        {/* Global Inner Workspace Frame Row */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          {children}
        </main>
      </div>

    </div>
  )
}