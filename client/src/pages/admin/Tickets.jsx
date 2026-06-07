import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, SlidersHorizontal, Layers, Activity, Calendar, User, ArrowRight, Bot } from 'lucide-react'
import Layout from '../../components/Layout'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'
import { ticketsAPI } from '../../services/api'
import { supabase } from '../../lib/supabase'

function Skeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-gray-100 rounded-lg w-2/3" />
            <div className="h-3 bg-gray-100 rounded-lg w-1/3" />
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-24 bg-gray-100 rounded-full" />
            <div className="h-6 w-20 bg-gray-100 rounded-full" />
            <div className="h-6 w-20 bg-gray-100 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

const STATUS_FILTERS = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' }
]

const PRIORITY_FILTERS = [
  { label: 'All Priorities', value: 'all' },
  { label: '🔴 Critical', value: 'critical' },
  { label: '🟠 High', value: 'high' },
  { label: '🔵 Medium', value: 'medium' },
  { label: '⚪ Low', value: 'low' }
]

export default function AdminTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [isOnline, setIsOnline] = useState(false)

  // ─── Fetch Historical Snapshot Data ───────────────────────────
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await ticketsAPI.getAll()
        const ticketsData =
          Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.data?.tickets)
            ? res.data.tickets
            : Array.isArray(res.data?.data)
            ? res.data.data
            : []

        setTickets(ticketsData)
      } catch (error) {
        console.error('Error fetching operational queue list:', error)
        setTickets([])
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [])

  // ─── Unified Realtime Engine Lifecycle Subscription ─────────────
  useEffect(() => {
    const dynamicSessionKey = Math.random().toString(36).substring(7)
    const channel = supabase.channel(`admin-queue-stream-${dynamicSessionKey}`)

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
    const priority = ticket.admin_priority || ticket.ai_priority
    const matchStatus = statusFilter === 'all' || ticket.status === statusFilter
    const matchPriority = priorityFilter === 'all' || priority === priorityFilter

    const searchText = search.toLowerCase().trim()
    const matchSearch =
      searchText === '' ||
      ticket.subject?.toLowerCase().includes(searchText) ||
      ticket.author_id?.toLowerCase().includes(searchText) ||
      ticket.ai_category?.toLowerCase().includes(searchText)

    return matchStatus && matchPriority && matchSearch
  })

  // ─── Balanced Operational Urgency Sorting ───────────────────────
  const sorted = [...filtered].sort((a, b) => {
    const priorityWeightMatrix = { critical: 0, high: 1, medium: 2, low: 3 }
    const weightA = priorityWeightMatrix[a.admin_priority || a.ai_priority] ?? 4
    const weightB = priorityWeightMatrix[b.admin_priority || b.ai_priority] ?? 4

    if (weightA !== weightB) return weightA - weightB
    return new Date(b.created_at) - new Date(a.created_at)
  })

  if (loading) {
    return (
      <Layout title="Operations Control Queue">
        <Skeleton />
      </Layout>
    )
  }

  return (
    <Layout title="Operations Control Queue">
      {/* Real-time Connection Tracker Badge */}
      <div className="mb-6 flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400 animate-bounce'}`} />
          <div>
            <h4 className="text-sm font-bold text-gray-800">
              {isOnline ? 'Live Synchronization Feed Active' : 'Establishing Socket Handshake...'}
            </h4>
            <p className="text-xs text-gray-400 font-medium">Bypassing RLS gateways securely via server publication</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-500">
          <Activity size={14} className="text-gray-400" />
          <span>Stream Live</span>
        </div>
      </div>

      {/* Glassmorphic Search & Filter Control Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 space-y-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search matching threads by title, author identification strings, or AI category models..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50/50 text-gray-800 placeholder-gray-400 border border-gray-100 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:bg-white transition-all"
          />
        </div>

        {/* Dynamic Filtering Navigation Tray */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2 border-t border-gray-50">
          <div className="flex gap-1.5 flex-wrap bg-gray-50 p-1.5 rounded-xl border border-gray-100/50">
            {STATUS_FILTERS.map((filter) => {
              const count =
                filter.value === 'all'
                  ? safeTickets.length
                  : safeTickets.filter((t) => t.status === filter.value).length

              const isActive = statusFilter === filter.value

              return (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all ${
                    isActive
                      ? 'bg-white text-[#1a56db] shadow-sm border border-gray-100'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  {filter.label} 
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] ${isActive ? 'bg-blue-50 text-blue-600' : 'bg-gray-200/60 text-gray-500'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-3 self-end lg:self-center bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100/50">
            <SlidersHorizontal size={14} className="text-gray-400" />
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Severity Layer:</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-700 focus:outline-none cursor-pointer"
            >
              {PRIORITY_FILTERS.map((p) => (
                <option key={p.value} value={p.value} className="bg-white font-medium">
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 px-1">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <Layers size={14} />
          <span>{sorted.length} active case rows matching</span>
        </p>
      </div>

      {/* Main Core Ticket Grid Stack Datagrid */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm divide-y divide-gray-100/80">
        {sorted.length === 0 ? (
          <div className="py-20 text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
              🔍
            </div>
            <h5 className="text-sm font-bold text-gray-800">No records found</h5>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              No support workflows match your current state parameters. Try adjusting your active workspace control filters.
            </p>
          </div>
        ) : (
          sorted.map((ticket) => {
            const priority = ticket.admin_priority || ticket.ai_priority

            return (
              <Link
                key={ticket.id}
                to={`/admin/tickets/${ticket.id}`}
                className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 hover:bg-gray-50/70 transition-all transform hover:-translate-y-0.5 group border-l-4 ${
                  priority === 'critical' ? 'border-l-red-500' : 'border-l-transparent'
                }`}
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <h4 className="text-sm font-bold text-gray-800 truncate group-hover:text-[#1a56db] transition-colors leading-snug">
                    {ticket.subject}
                  </h4>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-400 font-medium">
                    <span className="font-mono text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded text-[10px]">
                      #{ticket.id?.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="flex items-center gap-1">
                      <User size={13} className="text-gray-300" />
                      <span>Partner: {ticket.author_id}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={13} className="text-gray-300" />
                      <span>
                        {ticket.created_at
                          ? new Date(ticket.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                          : 'N/A'}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-3 md:pt-0 border-t border-gray-50 md:border-transparent">
                  <div className="flex items-center gap-2">
                    {ticket.ai_category && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 border border-purple-100 text-purple-700 text-[10px] font-extrabold tracking-wide uppercase rounded-lg shadow-sm">
                        <Bot size={12} className="text-purple-500" />
                        <span>{ticket.ai_category}</span>
                      </span>
                    )}
                    <PriorityBadge priority={priority} />
                    <StatusBadge status={ticket.status} />
                  </div>
                  <ArrowRight size={16} className="text-gray-300 group-hover:text-[#1a56db] group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            )
          })
        )}
      </div>
    </Layout>
  )
}