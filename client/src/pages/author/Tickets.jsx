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
      {/* <div className="mb-6 flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
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
      </div> */}

      {/* Filter & Search Section */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5 mb-6">
        {/* Search Box */}
        <div className="relative mb-5">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search cases, AI classifications, keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
          />
        </div>

        {/* Filters */}
        <div className="overflow-x-auto scrollbar-none">
          <div className="flex gap-2 min-w-max">
            {FILTERS.map((f) => {
              const count =
                f.value === "all"
                  ? safeTickets.length
                  : safeTickets.filter((t) => t.status === f.value).length;

              const isActive = activeFilter === f.value;

              return (
                <button
                  key={f.value}
                  onClick={() => setActiveFilter(f.value)}
                  className={`group flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 whitespace-nowrap
              ${isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md scale-[1.02]"
                      : "bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-100"
                    }
            `}
                >
                  <span>{f.label}</span>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold
                ${isActive
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                      }
              `}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
  {sorted.length === 0 ? (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-5">
        <Inbox size={32} className="text-blue-600" />
      </div>

      <h3 className="text-lg font-bold text-slate-800">
        No Support Tickets Found
      </h3>

      <p className="mt-2 text-sm text-slate-500 max-w-md leading-relaxed">
        {activeFilter === "all"
          ? "No tickets have been created yet. Start by creating your first support request."
          : `No tickets match the selected "${activeFilter.replace(
              "_",
              " "
            )}" filter.`}
      </p>

      {activeFilter === "all" && (
        <Link
          to="/author/tickets/new"
          className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold shadow-md transition-all"
        >
          <Plus size={16} />
          Create Ticket
        </Link>
      )}
    </div>
  ) : (
    <div className="p-3 space-y-3">
      {sorted.map((ticket) => {
        const priority = ticket.admin_priority || ticket.ai_priority;

        return (
          <Link
            key={ticket.id}
            to={`/author/tickets/${ticket.id}`}
            className="group flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl border border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-md transition-all duration-300"
          >
            {/* Left Side */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-3">
                <div className="hidden sm:flex w-10 h-10 rounded-xl bg-blue-50 items-center justify-center border border-blue-100">
                  <BookOpen size={18} className="text-blue-600" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                    {ticket.subject}
                  </h3>

                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <BookOpen size={13} />
                      {ticket.books?.title || "General Account"}
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} />
                      {new Date(ticket.created_at).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center justify-between lg:justify-end gap-3 flex-wrap">
              {ticket.ai_category && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100 text-xs font-semibold">
                  <Bot size={12} />
                  {ticket.ai_category}
                </span>
              )}

              <PriorityBadge priority={priority} />

              <StatusBadge status={ticket.status} />

              <div className="hidden lg:flex items-center justify-center w-9 h-9 rounded-xl bg-gray-50 group-hover:bg-blue-100 transition-all">
                <ChevronRight
                  size={18}
                  className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all"
                />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  )}
</div>
    </Layout>
  )
}