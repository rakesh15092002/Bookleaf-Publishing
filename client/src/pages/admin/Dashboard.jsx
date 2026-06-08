import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'
import { ticketsAPI } from '../../services/api'
import { supabase } from '../../lib/supabase'
import {
  Ticket,
  MailOpen,
  AlertCircle,
  UserX,
  ArrowRight,
  CheckCircle2,
  Bell,
  Bot,
  User,
} from 'lucide-react'
 
function StatCard({ label, value, icon: Icon, colorClass, subtext }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorClass}`}>
        <Icon size={20} strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        {subtext && <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>}
      </div>
    </div>
  )
}
 
function Skeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-2xl h-24" />
        ))}
      </div>
      <div className="bg-gray-100 rounded-2xl h-80" />
    </div>
  )
}
 
export default function AdminDashboard() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
 
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
        console.error('Error fetching tickets:', error)
        setTickets([])
      } finally {
        setLoading(false)
      }
    }
    fetchTickets()
  }, [])
 
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-tickets-insert')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets' }, (payload) => {
        const newTicket = payload.new
        setTickets((prev) => {
          const safePrev = Array.isArray(prev) ? prev : []
          if (safePrev.find((t) => t.id === newTicket.id)) return safePrev
          return [newTicket, ...safePrev]
        })
        setToast({ message: `New ticket from ${newTicket.author_id}`, subject: newTicket.subject })
        setTimeout(() => setToast(null), 4000)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])
 
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-tickets-update')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tickets' }, (payload) => {
        setTickets((prev) =>
          (Array.isArray(prev) ? prev : []).map((t) =>
            t.id === payload.new.id ? payload.new : t
          )
        )
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])
 
  const safeTickets = Array.isArray(tickets) ? tickets : []
 
  const total      = safeTickets.length
  const open       = safeTickets.filter((t) => t.status === 'open').length
  const inProgress = safeTickets.filter((t) => t.status === 'in_progress').length
  const critical   = safeTickets.filter((t) => (t.admin_priority || t.ai_priority) === 'critical').length
  const unassigned = safeTickets.filter((t) => !t.assigned_to).length
 
  const recentTickets = [...safeTickets]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 8)
 
  if (loading) {
    return (
      <Layout title="Dashboard">
        <Skeleton />
      </Layout>
    )
  }
 
  return (
    <Layout title="Dashboard">
 
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Tickets"
          value={total}
          icon={Ticket}
          colorClass="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Open"
          value={open}
          icon={MailOpen}
          colorClass="bg-amber-50 text-amber-600"
          subtext={`${inProgress} in progress`}
        />
        <StatCard
          label="Critical"
          value={critical}
          icon={AlertCircle}
          colorClass="bg-red-50 text-red-600"
          subtext="Needs attention"
        />
        <StatCard
          label="Unassigned"
          value={unassigned}
          icon={UserX}
          colorClass="bg-violet-50 text-violet-600"
          subtext="Not assigned yet"
        />
      </div>
 
      {/* Recent Tickets — full width */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-5 rounded-full bg-blue-500" />
            <h3 className="text-sm font-semibold text-gray-800">Recent Tickets</h3>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[11px] font-bold rounded-full">
              {recentTickets.length}
            </span>
          </div>
          <Link
            to="/admin/tickets"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            View all <ArrowRight size={13} />
          </Link>
        </div>
 
        {recentTickets.length === 0 ? (
          <div className="py-20 text-center">
            <CheckCircle2 size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-400 font-medium">No tickets yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentTickets.map((ticket, idx) => {
              const priority   = ticket.admin_priority || ticket.ai_priority
              const isCritical = priority === 'critical'
 
              const barColor = {
                critical: 'border-l-red-500',
                high:     'border-l-orange-400',
                medium:   'border-l-amber-400',
                low:      'border-l-emerald-400',
              }[priority] || 'border-l-transparent'
 
              return (
                <Link
                  key={ticket.id}
                  to={`/admin/tickets/${ticket.id}`}
                  className={`
                    group flex items-center gap-4 px-6 py-4
                    border-l-[3px] ${barColor}
                    ${isCritical ? 'bg-red-50/20' : 'bg-white'}
                    hover:bg-blue-50/40 hover:pl-8 hover:shadow-sm
                    transition-all duration-200 ease-out
                  `}
                >
                  {/* Row number */}
                  <span className="hidden lg:flex w-6 h-6 rounded-lg bg-gray-100 group-hover:bg-blue-100 text-[11px] font-bold text-gray-400 group-hover:text-blue-600 items-center justify-center shrink-0 transition-colors duration-200">
                    {idx + 1}
                  </span>
 
                  {/* Subject + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors duration-200">
                      {ticket.subject}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <User size={11} className="shrink-0" />
                        {ticket.author_id}
                      </span>
                      {ticket.created_at && (
                        <span className="text-xs text-gray-400">
                          · {new Date(ticket.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>
 
                  {/* AI Category */}
                  {ticket.ai_category && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-violet-50 text-violet-600 border border-violet-100 text-[11px] font-semibold rounded-lg whitespace-nowrap">
                      <Bot size={10} />
                      {ticket.ai_category}
                    </span>
                  )}
 
                  {/* Badges */}
                  <div className="flex items-center gap-2 shrink-0">
                    <PriorityBadge priority={priority} />
                    <StatusBadge status={ticket.status} />
                  </div>
 
                  <ArrowRight
                    size={15}
                    className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-200 shrink-0"
                  />
                </Link>
              )
            })}
          </div>
        )}
      </div>
 
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-2 fade-in duration-300">
          <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl shadow-lg border bg-white border-gray-200 max-w-sm">
            <div className="mt-0.5 w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Bell size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800">{toast.message}</p>
              {toast.subject && (
                <p className="text-xs text-gray-500 mt-0.5 truncate">"{toast.subject}"</p>
              )}
            </div>
          </div>
        </div>
      )}
 
    </Layout>
  )
}