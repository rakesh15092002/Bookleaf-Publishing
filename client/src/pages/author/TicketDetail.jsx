import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  Send, 
  ArrowLeft, 
  BookOpen, 
  Bot, 
  Calendar, 
  ShieldAlert, 
  MessageSquare, 
  Hash, 
  Activity,
  Lock
} from 'lucide-react'
import Layout from '../../components/Layout'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'
import { ticketsAPI, messagesAPI } from '../../services/api'
import { supabase } from '../../lib/supabase'

// ─── Modern Message Bubble Layout ─────────────────────────
function MessageBubble({ message, currentRole }) {
  const isMe = message.sender_role === currentRole
  return (
    <div className={`flex w-full mb-3.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm transition-all duration-200 ${
        isMe
          ? 'bg-[#1a56db] text-white rounded-br-none font-medium'
          : 'bg-slate-100 border border-slate-200/40 text-slate-800 rounded-bl-none font-medium'
      }`}>
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <div className={`text-[10px] mt-1.5 font-mono text-right font-bold ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
          {new Date(message.created_at).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Precision Information Row ────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider shrink-0">{label}</span>
      <div className="text-xs font-bold text-slate-700 text-right min-w-0 truncate">{value}</div>
    </div>
  )
}

// ─── Modern Skeleton Animation ────────────────────────────
function Skeleton() {
  return (
    <div className="animate-pulse flex flex-col lg:flex-row gap-5">
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 h-[550px]" />
      <div className="w-full lg:w-72 bg-white rounded-2xl border border-gray-100 h-[350px] lg:h-[550px]" />
    </div>
  )
}

export default function AuthorTicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [ticket, setTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isOnline, setIsOnline] = useState(false)

  const bottomRef = useRef(null)

  // ─── Fetch Snapshot Lifecycle Data ───────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ticketRes, messagesRes] = await Promise.all([
          ticketsAPI.getById(id),
          messagesAPI.getAll(id)
        ])
        
        const ticketData = ticketRes.data?.data || ticketRes.data
        const messagesData = messagesRes.data?.data || messagesRes.data || []
        
        setTicket(ticketData)
        const msgs = messagesData.filter(m => !m.is_internal)
        setMessages(msgs)
      } catch (err) {
        console.error('❌ Fetch error observed:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  // ─── Realtime Engine Stream Sync ──────────────────────────
  useEffect(() => {
    if (!id) return
    
    const channelName = `author-messages-${id}-${Math.random().toString(36).substring(7)}`
    const channel = supabase.channel(channelName)
    
    channel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `ticket_id=eq.${id}`
    }, (payload) => {
      if (!payload.new.is_internal) {
        setMessages(prev => {
          const exists = prev.find(m => m.id === payload.new.id)
          if (exists) return prev
          return [...prev, payload.new]
        })
      }
    })
    
    channel.on('status', (status) => {
      if (status === 'SUBSCRIBED') {
        setIsOnline(true)
      } else {
        setIsOnline(false)
      }
    })
    
    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  // ─── Smooth Anchor Scroll ────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ─── Send Operational Reply Message ─────────────────────
  const handleSend = async (e) => {
    e.preventDefault()
    if (!reply.trim() || sending) return

    const optimistic = {
      id: 'temp-' + Date.now(),
      content: reply.trim(),
      sender_role: 'author',
      is_internal: false,
      created_at: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, optimistic])
    setReply('')

    try {
      setSending(true)
      const response = await messagesAPI.send(id, optimistic.content)
      const savedMessage = response.data?.data || response.data
      setMessages(prev => prev.map(m => m.id === optimistic.id ? savedMessage : m))
    } catch (err) {
      console.error('❌ Transmit drop error:', err)
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setReply(optimistic.content)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <Layout title="Case Thread Details"><Skeleton /></Layout>
  }

  if (!ticket) {
    return (
      <Layout title="Case Thread Details">
        <div className="bg-white border border-gray-100 rounded-2xl py-20 text-center max-w-md mx-auto px-4">
          <p className="text-4xl mb-4">😕</p>
          <h5 className="text-sm font-bold text-gray-800">Operational record not found</h5>
          <button
            onClick={() => navigate('/author/tickets')}
            className="mt-5 inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition"
          >
            <ArrowLeft size={14} />
            <span>Return to Main Queue</span>
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout 
      title="Case Thread Details"
      action={
        <button
          onClick={() => navigate('/author/tickets')}
          className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-slate-600 text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl hover:bg-gray-50 transition shadow-sm"
        >
          <ArrowLeft size={14} />
          <span>Queue View</span>
        </button>
      }
    >
      {/* Real-time Status Connection Grid Header */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="min-w-0">
          <span className="font-mono text-[10px] font-extrabold text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded uppercase tracking-wider">
            Thread ID: #{ticket.id?.slice(0, 8).toUpperCase()}
          </span>
          <h2 className="text-base font-black text-slate-800 mt-1 truncate leading-tight">{ticket.subject}</h2>
        </div>
        
        <div className="flex items-center gap-2 self-start sm:self-center bg-slate-50 border border-gray-100 px-3 py-1.5 rounded-xl shrink-0">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {isOnline ? 'Realtime Live' : 'Connecting Sync...'}
          </span>
        </div>
      </div>

      {/* Main Structural Twin Desk Split Panel */}
      <div className="flex flex-col-reverse lg:flex-row gap-5 items-start">

        {/* ── Left Side: Custom Modern Conversation Workspace ── */}
        <div className="w-full flex-1 bg-white rounded-2xl border border-gray-200 flex flex-col h-[520px] shadow-sm overflow-hidden">
          
          {/* Chat Panel Subsection Container Message Logs */}
          <div className="flex-1 overflow-y-auto px-5 py-5 bg-slate-50/30 space-y-2">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-xs mx-auto">
                <div className="w-12 h-12 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-center mb-3">
                  <MessageSquare size={20} className="text-[#1a56db]" />
                </div>
                <h5 className="text-sm font-bold text-gray-800">Secure pipeline open</h5>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed font-medium">
                  State parameters are mapped. Broadcast a reply node using the input area below.
                </p>
              </div>
            ) : (
              messages.map(msg => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  currentRole="author"
                />
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Core Interactive Reply Form Block */}
          <div className="px-4 py-3.5 bg-white border-t border-gray-100">
            {ticket.status === 'closed' ? (
              <div className="flex items-center justify-center gap-2 text-amber-600 bg-amber-50/60 border border-amber-100 rounded-xl py-3 text-xs sm:text-sm font-bold tracking-wide">
                <Lock size={14} />
                <span>This issue line is officially finalized and locked.</span>
              </div>
            ) : (
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Type an update statement or attach logs descriptions..."
                  className="flex-1 px-4 py-2.5 bg-slate-50/80 text-slate-800 placeholder-gray-400 border border-gray-200/80 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:bg-white transition-all font-medium"
                />
                <button
                  type="submit"
                  disabled={!reply.trim() || sending}
                  className="bg-[#1a56db] hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center shrink-0"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={14} className="transform rotate-0" />
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── Right Side: Sticky Parameter Control Panel Meta Desk ── */}
        <div className="w-full lg:w-72 shrink-0 space-y-4">

          {/* Core Ticket Information Module Block */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-50 pb-2">
              <ShieldAlert size={13} className="text-gray-400" />
              <span>Pipeline Meta Settings</span>
            </p>
            <div className="pt-1.5">
              <InfoRow label="State Pillar" value={<StatusBadge status={ticket.status} />} />
              <InfoRow label="Priority Tier" value={<PriorityBadge priority={ticket.admin_priority || ticket.ai_priority} />} />
              <InfoRow
                label="AI Category"
                value={
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 border border-purple-100 text-purple-700 text-[10px] font-extrabold uppercase rounded shadow-sm">
                    <Bot size={11} className="text-purple-400" />
                    <span>{ticket.admin_category || ticket.ai_category || 'Unassigned'}</span>
                  </span>
                }
              />
              <InfoRow
                label="Timeline Node"
                value={
                  <span className="flex items-center gap-1 text-gray-500 font-mono text-[11px]">
                    <Calendar size={12} className="text-gray-300" />
                    <span>
                      {new Date(ticket.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </span>
                }
              />
            </div>
          </div>

          {/* Contextual Distribution Bound Book Information Module Block */}
          {ticket.books && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-50 pb-2">
                <BookOpen size={13} className="text-gray-400" />
                <span>Bound Ledger Target</span>
              </p>
              <div className="pt-1">
                <InfoRow label="Title Mapping" value={ticket.books.title} />
                <InfoRow label="Index Standard" value={<span className="font-mono bg-gray-50 border border-gray-100 px-1 py-0.5 rounded tracking-wide text-[10px]">{ticket.books.isbn}</span>} />
              </div>
            </div>
          )}

          {/* Granular Case Description Field Block */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-50 pb-2">
              <Hash size={13} className="text-gray-400" />
              <span>Original Case Payload</span>
            </p>
            <div className="pt-2 max-h-[160px] overflow-y-auto scrollbar-none">
              <p className="text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  )
}