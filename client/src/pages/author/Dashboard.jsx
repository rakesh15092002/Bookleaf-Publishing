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
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">

          <div>
            <h3 className="flex items-center gap-2 text-slate-900 font-bold text-lg">
              <Activity size={18} className="text-blue-600" />
              Recent Activity
            </h3>

            <p className="text-xs text-slate-500 mt-1">
              Latest support requests and status updates
            </p>
          </div>

          <Link
            to="/author/tickets"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-all"
          >
            View All
            <ChevronRight size={14} />
          </Link>

        </div>

        {/* Content */}
        {recentTickets.length === 0 ? (

          <div className="py-24 px-6 text-center">

            <div className="w-20 h-20 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-5">
              <Inbox size={30} className="text-blue-600" />
            </div>

            <h3 className="text-lg font-bold text-slate-800">
              No Recent Activity
            </h3>

            <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
              You haven't created any support tickets yet.
            </p>

            <Link
              to="/author/tickets/new"
              className="inline-flex items-center gap-2 mt-6 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all shadow-sm"
            >
              <Plus size={16} />
              Create Ticket
            </Link>

          </div>

        ) : (

          <div className="divide-y divide-gray-100">

            {recentTickets.map((ticket) => (

              <Link
                key={ticket.id}
                to={`/author/tickets/${ticket.id}`}
                className="group flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-6 py-5 hover:bg-slate-50 transition-all border-l-4 border-l-transparent hover:border-l-blue-600"
              >

                {/* Left */}
                <div className="min-w-0 flex-1">

                  <p className="text-sm sm:text-[15px] font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                    {ticket.subject}
                  </p>

                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">

                    <BookOpen
                      size={13}
                      className="text-slate-400"
                    />

                    <span className="truncate">
                      {ticket.books?.title || "General Inquiry"}
                    </span>

                  </div>

                </div>

                {/* Right */}
                <div className="flex flex-wrap items-center gap-3 pt-3 lg:pt-0 border-t border-gray-100 lg:border-none">

                  {ticket.ai_category && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-[11px] font-semibold border border-purple-100">
                      <Bot size={12} />
                      {ticket.ai_category}
                    </span>
                  )}

                  <PriorityBadge
                    priority={ticket.admin_priority || ticket.ai_priority}
                  />

                  <StatusBadge
                    status={ticket.status}
                  />

                  <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-medium">
                    {ticket.updated_at || ticket.created_at
                      ? new Date(
                        ticket.updated_at || ticket.created_at
                      ).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })
                      : "—"}
                  </span>

                  <ArrowRight
                    size={16}
                    className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all hidden sm:block"
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}