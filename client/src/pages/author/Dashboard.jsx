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
  // Ab status changes aur admin edits hamesha ticket ko push karke top par layenge
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
          className="bg-[#1a56db] hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
        >
          + New Support Case
        </Link>
      }
    >
      {/* Realtime Stream Synced Tracking Alert Panel */}
      <div
        className={`mb-6 px-4 py-3 rounded-2xl text-xs font-bold border flex items-center justify-between shadow-sm transition-all bg-white ${
          isOnline ? 'border-emerald-100 text-emerald-800' : 'border-amber-100 text-amber-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
          <span>{isOnline ? 'LIVE DATA STREAM BINDING ESTABLISHED' : 'SYNCHRONIZING FEED DESK PIPES...'}</span>
        </div>
        <div className="text-[10px] text-gray-400 font-mono hidden sm:block">Channel: Postgres_Changes</div>
      </div>

      {/* Numerical Metrics Matrix Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="My Catalog Titles"
          value={safeBooks.length}
          icon={BookOpen}
          bgColor="bg-blue-50/70"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Open Support Tickets"
          value={openTicketsCount}
          icon={Ticket}
          bgColor="bg-amber-50/70"
          iconColor="text-amber-600"
          {...tickets}
        />
        <StatCard
          label="Pending Royalty Profits"
          value={`₹${royaltyPendingTotal.toLocaleString('en-IN')}`}
          icon={IndianRupee}
          bgColor="bg-rose-50/70"
          iconColor="text-rose-500"
        />
        <StatCard
          label="Total Copies Sold"
          value={totalCopiesSoldCount.toLocaleString('en-IN')}
          icon={Package}
          bgColor="bg-emerald-50/70"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Main Stream Queue Panel Workspace */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Activity size={16} className="text-gray-400" />
            <span>Recent Activity Timeline</span>
          </h3>
          <Link
            to="/author/tickets"
            className="text-xs font-bold text-[#1a56db] hover:text-blue-700 flex items-center gap-0.5 uppercase tracking-wider transition-colors"
          >
            <span>View Full Queue</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {recentTickets.length === 0 ? (
          <div className="py-20 text-center max-w-sm mx-auto">
            <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
              📬
            </div>
            <p className="text-slate-800 font-bold text-sm">No recorded support threads</p>
            <p className="text-gray-400 text-xs mt-1 leading-relaxed">
              If you require operational assistance regarding catalog metrics or payouts, open a case thread.
            </p>
            <Link
              to="/author/tickets/new"
              className="mt-5 inline-block bg-[#1a56db] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 shadow-sm transition"
            >
              File Support Ticket
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentTickets.map((ticket) => (
              <Link
                key={ticket.id}
                to={`/author/tickets/${ticket.id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50/50 transition-all group border-l-4 border-l-transparent hover:border-l-[#1a56db]"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-bold text-slate-800 truncate group-hover:text-[#1a56db] transition-colors leading-snug">
                    {ticket.subject}
                  </p>
                  <p className="text-xs text-slate-500 truncate flex items-center gap-1.5 font-medium">
                    <BookOpen size={13} className="text-gray-300" />
                    <span>Context: {ticket.books?.title || 'General Account Level Inquiry'}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t border-gray-50 sm:border-none pt-2 sm:pt-0">
                  <div className="flex items-center gap-2">
                    {ticket.ai_category && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-purple-50 border border-purple-100 text-purple-700 text-[10px] font-extrabold tracking-wide uppercase rounded-md shadow-sm">
                        <Bot size={11} className="text-purple-400" />
                        <span>{ticket.ai_category}</span>
                      </span>
                    )}
                    <PriorityBadge priority={ticket.admin_priority || ticket.ai_priority} />
                    <StatusBadge status={ticket.status} />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-mono hidden md:block">
                      {ticket.updated_at || ticket.created_at
                        ? new Date(ticket.updated_at || ticket.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short'
                          })
                        : '—'}
                    </span>
                    <ArrowRight size={14} className="text-gray-300 group-hover:text-[#1a56db] group-hover:translate-x-0.5 transition-all hidden sm:block" />
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