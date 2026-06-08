import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, SlidersHorizontal, Layers, Activity,
  Calendar, User, ChevronRight, Bot, Hash, X
} from 'lucide-react'
import Layout from '../../components/Layout'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'
import { ticketsAPI } from '../../services/api'
import { supabase } from '../../lib/supabase'

function Skeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="px-6 py-5 flex items-center gap-5">
          <div className="w-2 h-12 bg-gray-100 rounded-full shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-gray-100 rounded-lg w-2/3" />
            <div className="h-3 bg-gray-100 rounded-lg w-1/3" />
          </div>
          <div className="flex gap-2 shrink-0">
            <div className="h-7 w-24 bg-gray-100 rounded-lg" />
            <div className="h-7 w-18 bg-gray-100 rounded-lg" />
            <div className="h-7 w-20 bg-gray-100 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

const STATUS_FILTERS = [
  { label: 'All',         value: 'all' },
  { label: 'Open',        value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Resolved',    value: 'resolved' },
  { label: 'Closed',      value: 'closed' },
]

const PRIORITY_FILTERS = [
  { label: 'All Priorities', value: 'all' },
  { label: 'Critical',       value: 'critical' },
  { label: 'High',           value: 'high' },
  { label: 'Medium',         value: 'medium' },
  { label: 'Low',            value: 'low' },
]

const PRIORITY_BAR = {
  critical: 'border-l-red-500    bg-red-50/25',
  high:     'border-l-orange-400  bg-orange-50/20',
  medium:   'border-l-amber-400   bg-transparent',
  low:      'border-l-emerald-400 bg-transparent',
}

const PRIORITY_HOVER = {
  critical: 'hover:bg-red-50/50    hover:shadow-red-100/60',
  high:     'hover:bg-orange-50/50 hover:shadow-orange-100/60',
  medium:   'hover:bg-blue-50/40   hover:shadow-blue-100/40',
  low:      'hover:bg-emerald-50/40 hover:shadow-emerald-100/40',
}

export default function AdminTickets() {
  const [tickets,        setTickets]        = useState([])
  const [loading,        setLoading]        = useState(true)
  const [statusFilter,   setStatusFilter]   = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [search,         setSearch]         = useState('')
  const [isOnline,       setIsOnline]       = useState(false)

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await ticketsAPI.getAll()
        const data =
          Array.isArray(res.data) ? res.data
          : Array.isArray(res.data?.tickets) ? res.data.tickets
          : Array.isArray(res.data?.data) ? res.data.data
          : []
        setTickets(data)
      } catch (e) {
        console.error(e)
        setTickets([])
      } finally {
        setLoading(false)
      }
    }
    fetchTickets()
  }, [])

  useEffect(() => {
    const key = Math.random().toString(36).substring(7)
    const ch = supabase.channel(`admin-queue-${key}`)
    ch
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets' }, (payload) => {
        setTickets((prev) => {
          const p = Array.isArray(prev) ? prev : []
          if (p.some((t) => t.id === payload.new.id)) return p
          return [payload.new, ...p]
        })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tickets' }, (payload) => {
        setTickets((prev) =>
          (Array.isArray(prev) ? prev : []).map((t) =>
            t.id === payload.new.id ? { ...t, ...payload.new } : t
          )
        )
      })
      .subscribe((status) => setIsOnline(status === 'SUBSCRIBED'))
    return () => supabase.removeChannel(ch)
  }, [])

  const safeTickets = Array.isArray(tickets) ? tickets : []

  const filtered = safeTickets.filter((ticket) => {
    const priority = ticket.admin_priority || ticket.ai_priority
    const matchStatus   = statusFilter   === 'all' || ticket.status === statusFilter
    const matchPriority = priorityFilter === 'all' || priority === priorityFilter
    const q = search.toLowerCase().trim()
    const matchSearch =
      q === '' ||
      ticket.subject?.toLowerCase().includes(q) ||
      ticket.author_id?.toLowerCase().includes(q) ||
      ticket.ai_category?.toLowerCase().includes(q)
    return matchStatus && matchPriority && matchSearch
  })

  const sorted = [...filtered].sort((a, b) => {
    const w = { critical: 0, high: 1, medium: 2, low: 3 }
    const wa = w[a.admin_priority || a.ai_priority] ?? 4
    const wb = w[b.admin_priority || b.ai_priority] ?? 4
    if (wa !== wb) return wa - wb
    return new Date(b.created_at) - new Date(a.created_at)
  })

  const hasFilters = statusFilter !== 'all' || priorityFilter !== 'all' || search

  if (loading) return <Layout title="All Tickets"><Skeleton /></Layout>

  return (
    <Layout title="All Tickets">

      {/* ── Live Status Bar ── */}
      <div className="mb-5 flex items-center justify-between bg-white rounded-2xl border border-gray-100 px-5 py-3.5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
          <p className="text-sm font-semibold text-gray-700">
            {isOnline ? 'Live sync active' : 'Connecting…'}
          </p>
          <span className="hidden sm:block text-gray-300">·</span>
          <p className="hidden sm:block text-xs text-gray-400">Changes reflect instantly</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold text-gray-400 uppercase tracking-wide">
          <Activity size={13} />
          <span>Live</span>
        </div>
      </div>

      {/* ── Search + Filters ── */}
      <div className="bg-white rounded-2xl border border-blue-100 shadow-sm shadow-blue-50 p-5 mb-5 space-y-4 ring-1 ring-blue-50">

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by subject, author, or AI category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-10 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 focus:bg-white transition-all duration-200"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Status + Priority row */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">

          {/* Status pills */}
          <div className="flex gap-2 flex-wrap flex-1">
            {STATUS_FILTERS.map((f) => {
              const count = f.value === 'all'
                ? safeTickets.length
                : safeTickets.filter((t) => t.status === f.value).length
              const active = statusFilter === f.value
              return (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all duration-200
                    ${active
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                >
                  {f.label}
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-all duration-200
                    ${active ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Priority dropdown — custom styled */}
          <div className="relative self-start lg:self-center shrink-0">
            <SlidersHorizontal size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className={`
                appearance-none h-10 pl-8 pr-8 rounded-xl text-xs font-semibold
                border transition-all duration-200 cursor-pointer focus:outline-none
                focus:ring-2 focus:ring-blue-500/25
                ${priorityFilter !== 'all'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-white'
                }
              `}
            >
              {PRIORITY_FILTERS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            {/* Custom chevron */}
            <svg
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none transition-colors duration-200 ${priorityFilter !== 'all' ? 'text-white/70' : 'text-gray-400'}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Active filters summary */}
        {hasFilters && (
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Active:</span>
            {search && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-semibold rounded-lg">
                "{search}"
                <button onClick={() => setSearch('')} className="hover:text-blue-900 transition-colors"><X size={11} /></button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-semibold rounded-lg">
                {STATUS_FILTERS.find(f => f.value === statusFilter)?.label}
                <button onClick={() => setStatusFilter('all')} className="hover:text-blue-900 transition-colors"><X size={11} /></button>
              </span>
            )}
            {priorityFilter !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-semibold rounded-lg">
                {PRIORITY_FILTERS.find(f => f.value === priorityFilter)?.label}
                <button onClick={() => setPriorityFilter('all')} className="hover:text-blue-900 transition-colors"><X size={11} /></button>
              </span>
            )}
            <button
              onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); setSearch('') }}
              className="ml-auto text-[11px] font-bold text-gray-400 hover:text-red-500 transition-colors"
            >
              Clear all ×
            </button>
          </div>
        )}
      </div>

      {/* ── Result Count ── */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <Layers size={14} className="text-gray-400" />
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          {sorted.length} ticket{sorted.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* ── Ticket List ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Column Header */}
        {sorted.length > 0 && (
          <div className="hidden lg:grid grid-cols-[2.5fr_160px_130px_110px_110px_36px] gap-4 px-7 py-3 bg-gray-50 border-b border-gray-100">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Subject</span>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Category</span>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Date</span>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Priority</span>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status</span>
            <span />
          </div>
        )}

        {sorted.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Search size={26} className="text-gray-300" />
            </div>
            <h5 className="text-sm font-bold text-gray-700">No tickets found</h5>
            <p className="text-xs text-gray-400 mt-1.5 max-w-xs leading-relaxed">
              No tickets match your current filters. Try adjusting or clearing them.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100/70">
            {sorted.map((ticket, idx) => {
              const priority   = ticket.admin_priority || ticket.ai_priority
              const barClass   = PRIORITY_BAR[priority]   || 'border-l-gray-200 bg-transparent'
              const hoverClass = PRIORITY_HOVER[priority] || 'hover:bg-gray-50'

              return (
                <Link
                  key={ticket.id}
                  to={`/admin/tickets/${ticket.id}`}
                  className={`
                    group flex flex-col lg:grid lg:grid-cols-[2.5fr_160px_130px_110px_110px_36px]
                    lg:items-center gap-3 lg:gap-4 px-7 py-5
                    border-l-[3px] ${barClass} ${hoverClass}
                    hover:shadow-md hover:pl-9
                    transition-all duration-200 ease-out
                  `}
                >
                  {/* Subject + meta */}
                  <div className="min-w-0 flex items-center gap-4">
                    <span className="hidden lg:flex w-7 h-7 rounded-xl bg-gray-100 group-hover:bg-blue-100 items-center justify-center text-xs font-bold text-gray-400 group-hover:text-blue-600 shrink-0 transition-all duration-200">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors duration-200 leading-snug">
                        {ticket.subject}
                      </p>
                      <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Hash size={11} className="shrink-0 text-gray-300" />
                          {ticket.id?.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-gray-400 truncate max-w-[160px]">
                          <User size={11} className="shrink-0 text-gray-300" />
                          <span className="truncate">{ticket.author_id}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="min-w-0">
                    {ticket.ai_category ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-violet-50 text-violet-700 border border-violet-100 text-xs font-semibold rounded-lg whitespace-nowrap max-w-full truncate">
                        <Bot size={11} className="shrink-0" />
                        <span className="truncate">{ticket.ai_category}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300 font-medium">—</span>
                    )}
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 whitespace-nowrap">
                    <Calendar size={12} className="shrink-0 text-gray-300" />
                    {ticket.created_at
                      ? new Date(ticket.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })
                      : '—'}
                  </div>

                  {/* Priority */}
                  <div>
                    <PriorityBadge priority={priority} />
                  </div>

                  {/* Status */}
                  <div>
                    <StatusBadge status={ticket.status} />
                  </div>

                  {/* Arrow */}
                  <div className="hidden lg:flex items-center justify-center w-8 h-8 rounded-xl bg-gray-50 group-hover:bg-blue-100 transition-all duration-200 shrink-0">
                    <ChevronRight
                      size={16}
                      className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all duration-200"
                    />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {sorted.length > 0 && (
        <p className="mt-3 text-xs text-gray-400 text-right px-1">
          Showing {sorted.length} of {safeTickets.length} total tickets
        </p>
      )}

    </Layout>
  )
}