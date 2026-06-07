import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Ticket, IndianRupee, Package, Bot, ChevronRight, Activity, ArrowRight } from 'lucide-react'

import Layout from '../../components/Layout'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'
import StatCard from '../../components/authorComponents/StatCard'
import DashboardSkeleton from '../../components/authorComponents/DashboardSkeleton'
import { ticketsAPI, booksAPI } from '../../services/api'
import { supabase } from '../../lib/supabase'

export default function AuthorDashboard() {
  const [tickets, setTickets] = useState([])
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(false)

  // ─── Fetch Initial Full-Stack Snapshots ───────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ticketsRes, booksRes] = await Promise.all([
          ticketsAPI.getAll(),
          booksAPI.myBooks()
        ])
        setTickets(ticketsRes.data?.data || ticketsRes.data || [])
        setBooks(booksRes.data?.data || booksRes.data || [])
      } catch (err) {
        console.error('REST endpoint snapshot pull dropped:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // ─── Realtime Database Live Stream Binding ───────────────
  useEffect(() => {
    const dynamicSessionToken = Math.random().toString(36).substring(7)
    const channel = supabase.channel(`author-dashboard-stream-${dynamicSessionToken}`)

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
  const safeBooks = Array.isArray(books) ? books : []

  // ─── Computed Mathematical Metric Reductions ─────────────
  const openTicketsCount = safeTickets.filter(
    (t) => t.status === 'open' || t.status === 'in_progress'
  ).length

  const royaltyPendingTotal = safeBooks.reduce((sum, b) => sum + (b.royalty_pending || 0), 0)
  const totalCopiesSoldCount = safeBooks.reduce((sum, b) => sum + (b.total_copies_sold || b.copies_sold || 0), 0)

  // ─── 🟩 FIXED REALTIME TIMELINE SORTING ───────────────────
  // Status changes and admin edits will automatically push the ticket to the top of the queue
  const recentTickets = [...safeTickets]
    .sort((a, b) => {
      const timeA = new Date(a.updated_at || a.created_at)
      const timeB = new Date(b.updated_at || b.created_at)
      return timeB - timeA
    })
    .slice(0, 5)

  if (loading) {
    return (
      <Layout title="Dashboard Portal">
        <DashboardSkeleton />
      </Layout>
    )
  }

  return (
    <Layout
      title="Dashboard Portal"
      action={
        <Link
          to="/author/tickets/new"
          className="bg-[#1a56db] hover:bg-blue-700 text-white text-[11px] font-extrabold uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
        >
          + New Support Case
        </Link>
      }
    >
      {/* Realtime Stream Synced Tracking Alert Panel */}
      <div
        className={`mb-8 px-5 py-3 rounded-2xl text-[11px] font-extrabold tracking-widest uppercase border flex items-center justify-between shadow-sm transition-all bg-white ${isOnline ? 'border-emerald-100 text-emerald-700' : 'border-amber-100 text-amber-700'
          }`}
      >
        <div className="flex items-center gap-3">
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
          <span>{isOnline ? 'Live Data Stream Binding Established' : 'Synchronizing Feed Desk Pipes...'}</span>
        </div>
        <div className="text-[10px] text-slate-400 font-bold tracking-widest hidden sm:block">CHANNEL: POSTGRES_CHANGES</div>
      </div>

      {/* Numerical Metrics Matrix Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard
          label="My Catalog Titles"
          value={safeBooks.length}
          icon={BookOpen}
          bgColor="bg-blue-50"
          iconColor="text-blue-600"
        />

        <StatCard
          label="Open Support Tickets"
          value={openTicketsCount}
          icon={Ticket}
          bgColor="bg-amber-50"
          iconColor="text-amber-600"
        />

        <StatCard
          label="Pending Royalty Profits"
          value={`₹${royaltyPendingTotal.toLocaleString('en-IN')}`}
          icon={IndianRupee}
          bgColor="bg-rose-50"
          iconColor="text-rose-500"
        />

        <StatCard
          label="Total Copies Sold"
          value={totalCopiesSoldCount.toLocaleString('en-IN')}
          icon={Package}
          bgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Main Stream Queue Panel Workspace */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <h3 className="font-black text-slate-900 text-base tracking-tight flex items-center gap-2.5">
            <Activity size={18} className="text-slate-400" />
            <span>Recent Activity Timeline</span>
          </h3>
          <Link
            to="/author/tickets"
            className="text-[11px] font-extrabold text-[#1a56db] hover:text-blue-800 flex items-center gap-1 uppercase tracking-widest transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg"
          >
            <span>View Full Queue</span>
            <ChevronRight size={14} strokeWidth={2.5} />
          </Link>
        </div>

        {recentTickets.length === 0 ? (
          <div className="py-24 text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl shadow-sm">
              📬
            </div>
            <p className="text-slate-900 font-black text-lg tracking-tight">No active support threads</p>
            <p className="text-slate-500 font-medium text-sm mt-2 leading-relaxed">
              If you require operational assistance regarding catalog metrics or payouts, open a case thread.
            </p>
            <Link
              to="/author/tickets/new"
              className="mt-6 inline-block bg-slate-900 text-white text-[11px] font-extrabold tracking-widest uppercase px-5 py-3 rounded-xl hover:bg-slate-800 shadow-sm transition-colors"
            >
              File Support Ticket
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentTickets.map((ticket) => (
              <Link
                key={ticket.id}
                to={`/author/tickets/${ticket.id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 hover:bg-slate-50 transition-all group border-l-4 border-l-transparent hover:border-l-[#1a56db]"
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="text-[15px] font-bold text-slate-900 truncate group-hover:text-[#1a56db] transition-colors leading-snug tracking-tight">
                    {ticket.subject}
                  </p>
                  <p className="text-xs text-slate-500 truncate flex items-center gap-2 font-semibold">
                    <BookOpen size={14} className="text-slate-400" />
                    <span>Context: {ticket.books?.title || 'General Account Level Inquiry'}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 border-t border-slate-100 sm:border-none pt-3 sm:pt-0">
                  <div className="flex items-center gap-2.5">
                    {ticket.ai_category && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 border border-purple-100/50 text-purple-700 text-[10px] font-extrabold tracking-widest uppercase rounded-lg shadow-sm">
                        <Bot size={12} className="text-purple-500" />
                        <span>{ticket.ai_category}</span>
                      </span>
                    )}
                    <PriorityBadge priority={ticket.admin_priority || ticket.ai_priority} />
                    <StatusBadge status={ticket.status} />
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold tracking-widest uppercase text-slate-400 hidden md:block">
                      {ticket.updated_at || ticket.created_at
                        ? new Date(ticket.updated_at || ticket.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short'
                        })
                        : '—'}
                    </span>
                    <ArrowRight size={16} className="text-slate-300 group-hover:text-[#1a56db] group-hover:translate-x-1 transition-all hidden sm:block" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}