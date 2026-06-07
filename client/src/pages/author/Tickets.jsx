import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Ticket,
  BookOpen,
  Bot,
  ChevronRight,
  Inbox,
  Activity,
  Search,
  SlidersHorizontal,
  Calendar
} from 'lucide-react'

import Layout from '../../components/Layout'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'
import { ticketsAPI } from '../../services/api'
import { supabase } from '../../lib/supabase'

// ─── Modern Skeleton Loader ───────────────────────────────────
function Skeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-gray-100 rounded-lg w-2/3" />
            <div className="h-3 bg-gray-100 rounded-lg w-1/3" />
          </div>
          <div className="flex gap-2 h-7 w-44 bg-gray-100 rounded-full" />
        </div>
      ))}
    </div>
  )
}

const FILTERS = [
  { label: 'All Tickets', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' },
]

export default function AuthorTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [isOnline, setIsOnline] = useState(false)

  // ─── Fetch Initial Snapshot ───────────────────────────────────
  useEffect(() => {
    ticketsAPI
      .getAll()
      .then((res) => setTickets(res.data.data || res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // ─── Realtime Engine Live Sync ────────────────────────────────
  useEffect(() => {
    const dynamicSessionKey = Math.random().toString(36).substring(7)
    const channel = supabase.channel(`author-tickets-grid-${dynamicSessionKey}`)

    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets' }, (payload) => {
        setTickets((prev) => {
          const verifiedPrev = Array.isArray(prev) ? prev : []
          if (verifiedPrev.some((t) => t.id === payload.new.id)) return verifiedPrev
          return [payload.new, ...verifiedPrev]
        })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tickets' }, (payload) => {
        setTickets((prev) => {
          const verifiedPrev = Array.isArray(prev) ? prev : []
          return verifiedPrev.map((t) => (t.id === payload.new.id ? { ...t, ...payload.new } : t))
        })
      })
      .subscribe((status) => {
        setIsOnline(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const safeTickets = Array.isArray(tickets) ? tickets : []

  // ─── Computed Reactive Filter + Search Calculations ─────────────
  const filtered = safeTickets.filter((ticket) => {
    const matchStatus = activeFilter === 'all' || ticket.status === activeFilter

    const searchText = search.toLowerCase().trim()
    const matchSearch =
      searchText === '' ||
      ticket.subject?.toLowerCase().includes(searchText) ||
      ticket.ai_category?.toLowerCase().includes(searchText)

    return matchStatus && matchSearch
  })

  // Sort latest first
  const sorted = [...filtered].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  if (loading) {
    return (
      <Layout title="My Support Tickets">
        <Skeleton />
      </Layout>
    )
  }

  return (
    <Layout
      title="My Support Tickets"
      action={
        <Link
          to="/author/tickets/new"
          className="inline-flex items-center gap-2 bg-[#1a56db] hover:bg-blue-700 text-white text-xs sm:text-sm font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-sm transition-all transform hover:-translate-y-0.5"
        >
          <Plus size={16} />
          <span>New Ticket</span>
        </Link>
      }
    >
      {/* Realtime Replication Status Bar */}
      <div className="mb-6 flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
          <div>
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
              {isOnline ? 'Live Ticket Queue Sync Active' : 'Connecting Realtime Nodes...'}
            </h4>
            <p className="text-[11px] text-gray-400 mt-0.5 font-medium">Status upgrades from the admin panel mirror instantly below.</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          <Activity size={12} className="text-gray-400" />
          <span>Active Feed</span>
        </div>
      </div>

      {/* Control Filters Tray Component with Search Box */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 mb-6 space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search through past case descriptions or AI classification types..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50/60 text-gray-800 placeholder-gray-400 border border-gray-100 rounded-xl pl-11 pr-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:bg-white transition-all font-medium"
          />
        </div>

        {/* Modern Horizontal Scrollable Filter Tabs Container */}
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
          <div className="flex gap-1.5 min-w-max bg-gray-50 p-1.5 rounded-xl border border-gray-100/50">
            {FILTERS.map((f) => {
              const count =
                f.value === 'all'
                  ? safeTickets.length
                  : safeTickets.filter((t) => t.status === f.value).length

              const isActive = activeFilter === f.value

              return (
                <button
                  key={f.value}
                  onClick={() => setActiveFilter(f.value)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all ${isActive
                      ? 'bg-white text-[#1a56db] shadow-sm border border-gray-200/50'
                      : 'text-gray-500 hover:text-[#1a56db] hover:bg-white/40'
                    }`}
                >
                  {f.label}
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono ${isActive ? 'bg-blue-50 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                    ({count})
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Responsive Ticket Grid Desk */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm divide-y divide-gray-50">
        {sorted.length === 0 ? (
          <div className="py-20 text-center max-w-sm mx-auto px-4 flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mb-4">
              <Inbox className="text-[#1a56db]" size={26} />
            </div>

            <h5 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              No Support Tickets Found
            </h5>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-medium max-w-xs mx-auto">
              {activeFilter === 'all'
                ? 'There are currently no support tickets recorded under this author account configuration.'
                : `There are currently no records matching the "${activeFilter.replace('_', ' ')}" status criteria.`}
            </p>

            {activeFilter === 'all' && (
              <Link
                to="/author/tickets/new"
                className="mt-5 inline-flex items-center gap-2 bg-[#1a56db] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-blue-700 shadow-sm transition-all"
              >
                <Plus size={14} />
                <span>Create First Ticket</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {sorted.map((ticket) => {
              const priority = ticket.admin_priority || ticket.ai_priority

              return (
                <Link
                  key={ticket.id}
                  to={`/author/tickets/${ticket.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-gray-50/40 transition-all transform hover:-translate-y-0.5 group border-l-4 border-l-transparent hover:border-l-[#1a56db]"
                >
                  {/* Left Metadata Block Layout */}
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="text-sm font-bold text-gray-800 truncate group-hover:text-[#1a56db] transition-colors leading-snug">
                      {ticket.subject}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-400 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <BookOpen size={13} className="text-gray-300" />
                        <span className="truncate max-w-[150px]">
                          {ticket.books?.title || 'General Account Level'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 font-medium">
                        <Calendar size={13} className="text-gray-300" />
                        <span>
                          {new Date(ticket.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Status Control Trait Area */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-3 sm:pt-0 border-t border-gray-50 sm:border-transparent">
                    <div className="flex items-center gap-2">
                      {ticket.ai_category && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-purple-50 border border-purple-100 text-purple-700 text-[10px] font-extrabold tracking-wide uppercase rounded-md shadow-sm">
                          <Bot size={11} className="text-purple-400" />
                          <span>{ticket.ai_category}</span>
                        </span>
                      )}
                      <PriorityBadge priority={priority} />
                      <StatusBadge status={ticket.status} />
                    </div>

                    <ChevronRight
                      size={16}
                      className="text-gray-300 group-hover:text-[#1a56db] group-hover:translate-x-0.5 transition-all hidden sm:block"
                    />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}