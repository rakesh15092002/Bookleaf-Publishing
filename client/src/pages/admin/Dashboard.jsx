import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'
import { ticketsAPI } from '../../services/api'
import { supabase } from '../../lib/supabase'

function StatCard({ label, value, icon, color, subtext }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        {subtext && (
          <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>
        )}
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-200 p-5 h-24"
          />
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 h-80" />
    </div>
  )
}

export default function AdminDashboard() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  // ─── Fetch Tickets ─────────────────────────────
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await ticketsAPI.getAll()

        console.log('Tickets API Response:', res.data)

        // Handle multiple response formats safely
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
        console.error('Error fetching tickets:', error)
        setTickets([])
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [])

  // ─── Realtime: New ticket ──────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-tickets-insert')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tickets'
        },
        (payload) => {
          const newTicket = payload.new

          setTickets((prev) => {
            const safePrev = Array.isArray(prev) ? prev : []

            const exists = safePrev.find(
              (t) => t.id === newTicket.id
            )

            if (exists) return safePrev

            return [newTicket, ...safePrev]
          })

          setToast({
            message: `🎫 New ticket from ${newTicket.author_id}`,
            subject: newTicket.subject
          })

          setTimeout(() => setToast(null), 4000)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // ─── Realtime: Ticket Update ───────────────────
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-tickets-update')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets'
        },
        (payload) => {
          setTickets((prev) => {
            const safePrev = Array.isArray(prev)
              ? prev
              : []

            return safePrev.map((t) =>
              t.id === payload.new.id
                ? payload.new
                : t
            )
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // ─── Safe tickets array ────────────────────────
  const safeTickets = Array.isArray(tickets)
    ? tickets
    : []

  // ─── Stats ─────────────────────────────────────
  const total = safeTickets.length

  const open = safeTickets.filter(
    (t) => t.status === 'open'
  ).length

  const inProgress = safeTickets.filter(
    (t) => t.status === 'in_progress'
  ).length

  const critical = safeTickets.filter(
    (t) =>
      (t.admin_priority || t.ai_priority) ===
      'critical'
  ).length

  const unassigned = safeTickets.filter(
    (t) => !t.assigned_to
  ).length

  // ─── Recent Tickets ────────────────────────────
  const recentTickets = [...safeTickets]
    .sort(
      (a, b) =>
        new Date(b.created_at) -
        new Date(a.created_at)
    )
    .slice(0, 6)

  // ─── Critical Tickets ──────────────────────────
  const criticalTickets = safeTickets
    .filter(
      (t) =>
        (t.admin_priority ||
          t.ai_priority) === 'critical' &&
        t.status !== 'resolved' &&
        t.status !== 'closed'
    )
    .slice(0, 3)

  if (loading) {
    return (
      <Layout title="Admin Dashboard">
        <Skeleton />
      </Layout>
    )
  }

  return (
    <Layout title="Admin Dashboard">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Tickets"
          value={total}
          icon="🎫"
          color="bg-blue-50"
        />

        <StatCard
          label="Open"
          value={open}
          icon="📬"
          color="bg-amber-50"
          subtext={`${inProgress} in progress`}
        />

        <StatCard
          label="Critical"
          value={critical}
          icon="🔴"
          color="bg-red-50"
          subtext="needs attention"
        />

        <StatCard
          label="Unassigned"
          value={unassigned}
          icon="👤"
          color="bg-purple-50"
          subtext="not assigned yet"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Tickets */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">
              Recent Tickets
            </h3>

            <Link
              to="/admin/tickets"
              className="text-sm text-[#1a56db] hover:underline"
            >
              View all →
            </Link>
          </div>

          {recentTickets.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-4xl mb-3">🎉</p>
              <p className="text-gray-500 font-medium">
                Koi ticket nahi abhi
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  to={`/admin/tickets/${ticket.id}`}
                  className={`flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors group border-l-4 ${
                    (ticket.admin_priority ||
                      ticket.ai_priority) ===
                    'critical'
                      ? 'border-l-red-400'
                      : 'border-l-transparent'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate group-hover:text-[#1a56db] transition-colors">
                      {ticket.subject}
                    </p>

                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      👤 {ticket.author_id} •{' '}
                      {ticket.created_at
                        ? new Date(
                            ticket.created_at
                          ).toLocaleDateString(
                            'en-IN',
                            {
                              day: 'numeric',
                              month: 'short'
                            }
                          )
                        : 'N/A'}
                    </p>
                  </div>

                  {ticket.ai_category && (
                    <span className="hidden sm:inline-flex px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full whitespace-nowrap">
                      🤖 {ticket.ai_category}
                    </span>
                  )}

                  <div className="flex items-center gap-2 shrink-0">
                    <PriorityBadge
                      priority={
                        ticket.admin_priority ||
                        ticket.ai_priority
                      }
                    />

                    <StatusBadge
                      status={ticket.status}
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Critical Tickets */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">
              🔴 Critical Tickets
            </h3>

            <p className="text-xs text-gray-400 mt-0.5">
              Immediate attention needed
            </p>
          </div>

          {criticalTickets.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-3xl mb-2">✅</p>
              <p className="text-sm text-gray-500">
                No critical tickets!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {criticalTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  to={`/admin/tickets/${ticket.id}`}
                  className="block px-5 py-4 hover:bg-red-50 transition-colors group"
                >
                  <p className="text-sm font-medium text-gray-800 truncate group-hover:text-red-600 transition-colors">
                    {ticket.subject}
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-400">
                      {ticket.author_id}
                    </p>

                    <StatusBadge
                      status={ticket.status}
                    />
                  </div>

                  {ticket.ai_category && (
                    <span className="mt-2 inline-flex px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                      🤖 {ticket.ai_category}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="px-5 py-4 rounded-xl shadow-lg border bg-green-50 border-green-200 text-green-800">
            <p className="font-semibold text-sm">
              {toast.message}
            </p>

            {toast.subject && (
              <p className="text-xs text-gray-600 mt-1 truncate max-w-xs">
                "{toast.subject}"
              </p>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}