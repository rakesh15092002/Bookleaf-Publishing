import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Send, EyeOff, BookOpen, MessageSquare, ArrowLeft, Bot, Shield, AlertCircle, User, FileText, ChevronDown, Sparkles } from 'lucide-react'
import Layout from '../../components/Layout'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'
import { ticketsAPI, messagesAPI } from '../../services/api'
import { supabase } from '../../lib/supabase'

// ─── DYNAMIC BORDER GRADIENT ANIMATION ENGINE ─────────────
// Tailwind config ko bina touch kiye hum linear global rules apply kar rahe hain
const styleInject = `
  @keyframes borderFlow {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .animate-ai-gradient-glow {
    background-size: 200% 200%;
    animation: borderFlow 4s linear infinite;
  }
`;

// ─── LOCAL SUB-COMPONENT 1: AI DRAFT BOX (MOVING GRADIENT BORDER) ───
function AIDraftBox({ ticket, handleUseDraft, draftCopied }) {
  if (!ticket?.ai_draft) return null

  return (
    /* 🟩 UPGRADED: Absolute luxury moving gradient border box layer padding setup */
    <div className="p-[2px] bg-gradient-to-r from-purple-600 via-indigo-500 via-fuchsia-500 to-purple-600 rounded-2xl animate-ai-gradient-glow shadow-[0_0_18px_rgba(168,85,247,0.22)] transition-all duration-300 hover:shadow-[0_0_24px_rgba(168,85,247,0.35)] relative overflow-hidden group">

      {/* Internal layout surface background structure masking */}
      <div className="bg-gradient-to-br from-purple-50/95 to-indigo-50/60 rounded-[14px] p-4.5 relative overflow-hidden h-full w-full">
        <div className="absolute -top-6 -right-6 p-4 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-300">
          <Sparkles size={60} className="text-purple-600" />
        </div>

        <div className="flex items-center justify-between gap-2 mb-2.5 relative z-10">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-sm shrink-0 shadow-purple-200">
              <Bot size={13} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-black text-purple-950 tracking-tight leading-tight">AI Co-Pilot Draft</h4>
                <span className="inline-flex items-center text-[8px] bg-purple-600 text-white px-1 rounded font-black tracking-widest uppercase scale-90">LIVE</span>
              </div>
              <p className="text-[9px] text-purple-400 font-bold font-mono tracking-wider">Llama-3 Groq Core</p>
            </div>
          </div>
          <button
            onClick={handleUseDraft}
            className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm shrink-0 ${draftCopied ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-100' : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm shadow-purple-200 hover:scale-[1.02]'
              }`}
          >
            {draftCopied ? 'Copied' : 'Use Draft'}
          </button>
        </div>
        <div className="max-h-40 overflow-y-auto text-xs text-purple-950 leading-relaxed bg-white/90 border border-purple-200/60 rounded-xl p-3.5 shadow-inner whitespace-pre-wrap font-medium custom-scrollbar">
          {ticket.ai_draft}
        </div>
      </div>
    </div>
  )
}

// ─── LOCAL HELPERS FOR SIDEBAR ────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center gap-3 py-2 border-b border-slate-100 last:border-0">
      <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider shrink-0">{label}</span>
      <div className="text-xs font-bold text-slate-700 text-right min-w-0 truncate">{value}</div>
    </div>
  )
}

// ─── LOCAL SUB-COMPONENT 2: METADATA SIDEBAR ──────────────
function TicketMetaSidebar({ ticket, updating, handleStatusChange, handlePriorityChange, handleCategoryChange, priority }) {
  const [statusOpen, setStatusOpen] = useState(false)
  const [priorityOpen, setPriorityOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)

  const sidebarRef = useRef(null)

  const currentStatus = ticket.status || 'open'
  const currentPriority = ticket.admin_priority || ticket.ai_priority || 'medium'
  const currentCategory = ticket.admin_category || ticket.ai_category || 'General Query'

  const statusMap = {
    open: { label: 'Open Thread', dotColor: 'bg-emerald-500 ring-emerald-100' },
    in_progress: { label: 'In Progress', dotColor: 'bg-amber-500 ring-amber-100' },
    resolved: { label: 'Resolved State', dotColor: 'bg-indigo-500 ring-indigo-100' },
    closed: { label: 'Closed & Locked', dotColor: 'bg-rose-500 ring-rose-100' }
  }

  const priorityMap = {
    critical: { label: 'Critical Level', dotColor: 'bg-rose-500 ring-rose-100' },
    high: { label: 'High Urgency', dotColor: 'bg-amber-500 ring-amber-100' },
    medium: { label: 'Medium Stable', dotColor: 'bg-blue-500 ring-blue-100' },
    low: { label: 'Low Baseline', dotColor: 'bg-slate-400 ring-slate-100' }
  }

  const categoriesList = [
    'Royalty & Payments',
    'Book Production',
    'Distribution',
    'Contract & Rights',
    'Technical Issues',
    'General Query'
  ]

  useEffect(() => {
    function handleClickOutside(event) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setStatusOpen(false)
        setPriorityOpen(false)
        setCategoryOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="w-full space-y-4" ref={sidebarRef}>

      {/* State Mutator Desk Block */}
      <div className="bg-white rounded-2xl  border border-gray-200 p-5 shadow-sm space-y-5">
        <p className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-200">
          <Shield size={16} className="text-white" />
          <span>Update Ticket</span>
        </p>

        {/* System Status Dropdown */}
        <div className="space-y-1.5 relative">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400">
            <span>System Status</span>
            {updating === 'status' && <span className="text-blue-500 animate-pulse lowercase">updating...</span>}
          </div>
          <button
            type="button"
            disabled={updating === 'status'}
            onClick={() => { setStatusOpen(!statusOpen); setPriorityOpen(false); setCategoryOpen(false); }}
            className="w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100/60 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-between transition-all shadow-sm focus:ring-2 focus:ring-blue-600 focus:bg-white"
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-2.5 h-2.5 rounded-full ring-4 shrink-0 ${statusMap[currentStatus]?.dotColor || 'bg-slate-400'}`} />
              <span className="uppercase tracking-wide text-slate-700 font-black">{statusMap[currentStatus]?.label || currentStatus}</span>
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${statusOpen ? 'transform rotate-180' : ''}`} />
          </button>
          {statusOpen && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
              {Object.keys(statusMap).map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { handleStatusChange(key); setStatusOpen(false); }}
                  className={`w-full px-3 py-2.5 text-left flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${currentStatus === key ? 'bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-50/80'}`}
                >
                  <div className={`w-2 h-2 rounded-full ring-4 shrink-0 ${statusMap[key].dotColor}`} />
                  <span>{statusMap[key].label}</span>
                  {currentStatus === key && <span className="ml-auto text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-black tracking-widest">Active</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Priority Control Dropdown */}
        <div className="space-y-1.5 relative">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400">
            <span>Priority Control Tower</span>
            {updating === 'priority' && <span className="text-blue-500 animate-pulse lowercase">updating...</span>}
          </div>
          <button
            type="button"
            disabled={updating === 'priority'}
            onClick={() => { setPriorityOpen(!priorityOpen); setStatusOpen(false); setCategoryOpen(false); }}
            className="w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100/60 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-between transition-all shadow-sm focus:ring-2 focus:ring-blue-600 focus:bg-white"
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-2.5 h-2.5 rounded-full ring-4 shrink-0 ${priorityMap[currentPriority]?.dotColor || 'bg-slate-400'}`} />
              <span className="uppercase tracking-wide text-slate-700 font-black">{priorityMap[currentPriority]?.label || currentPriority}</span>
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${priorityOpen ? 'transform rotate-180' : ''}`} />
          </button>
          {priorityOpen && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
              {Object.keys(priorityMap).map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { handlePriorityChange(key); setPriorityOpen(false); }}
                  className={`w-full px-3 py-2.5 text-left flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${currentPriority === key ? 'bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-50/80'}`}
                >
                  <div className={`w-2 h-2 rounded-full ring-4 shrink-0 ${priorityMap[key].dotColor}`} />
                  <span>{priorityMap[key].label}</span>
                  {currentPriority === key && <span className="ml-auto text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-black tracking-widest">Active</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Inquiry Classification Dropdown */}
        <div className="space-y-1.5 relative">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400">
            <span>Inquiry Classification</span>
            {updating === 'category' && <span className="text-blue-500 animate-pulse lowercase">updating...</span>}
          </div>
          <button
            type="button"
            disabled={updating === 'category'}
            onClick={() => { setCategoryOpen(!categoryOpen); setStatusOpen(false); setPriorityOpen(false); }}
            className="w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100/60 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-between transition-all shadow-sm focus:ring-2 focus:ring-blue-600 focus:bg-white"
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span className="tracking-wide text-slate-700 font-black truncate max-w-[200px]">{currentCategory}</span>
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${categoryOpen ? 'transform rotate-180' : ''}`} />
          </button>
          {categoryOpen && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1.5 max-h-56 overflow-y-auto scrollbar-none animate-in fade-in slide-in-from-top-1 duration-150">
              {categoriesList.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => { handleCategoryChange(cat); setCategoryOpen(false); }}
                  className={`w-full px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider transition-colors block truncate ${currentCategory === cat ? 'bg-slate-50 text-slate-900 border-l-4 border-l-blue-600 pl-3' : 'text-slate-600 hover:bg-slate-50/80'}`}
                >
                  <span>{cat}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Metadata Inspection (RUNNING GRADIENT ANIMATED GLOW BORDER TOO!) */}
      {/* 🟩 UPGRADED: Added the same beautiful continuous flowing border style to the metadata block */}
      <div className="p-[2px] bg-gradient-to-r from-purple-600 via-fuchsia-500 to-indigo-500 rounded-2xl animate-ai-gradient-glow shadow-[0_0_12px_rgba(168,85,247,0.1)] relative overflow-hidden">
        <div className="bg-white rounded-[14px] p-4.5 space-y-1 relative h-full w-full">
          <div className="absolute top-3 right-3 opacity-20 text-purple-500 animate-pulse">
            <Sparkles size={14} />
          </div>

          <p className="text-[11px] font-black text-purple-900 uppercase tracking-widest pb-1 flex items-center gap-1.5 border-b border-purple-50">
            <AlertCircle size={13} className="text-purple-500" />
            <span>Metadata & AI Analytics</span>
          </p>

          <InfoRow label="Active State" value={<StatusBadge status={ticket.status} />} />
          <InfoRow label="Merged Priority" value={<PriorityBadge priority={priority} />} />

          <InfoRow
            label="AI Engine Tag"
            value={
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black uppercase rounded-lg shadow-sm shadow-purple-100">
                <Bot size={11} className="text-purple-100" />
                <span>{ticket.ai_category || '—'}</span>
              </span>
            }
          />
          <InfoRow label="Registry ID" value={<span className="font-mono text-slate-500 uppercase font-bold">#{ticket.id?.slice(0, 8)}</span>} />
          <InfoRow
            label="Ingest Timestamp"
            value={
              <span className="font-mono text-[11px] text-slate-600 font-bold">
                {new Date(ticket.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            }
          />
        </div>
      </div>

      {/* Connected Author Info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4.5 shadow-sm">
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest pb-2 flex items-center gap-1.5">
          <User size={13} className="text-gray-400" />
          <span>Author Anchor Bounds</span>
        </p>
        <div className="flex items-center gap-2.5 border-b border-slate-50 pb-2.5 mb-1.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-sm shrink-0 uppercase">
            {ticket.author_id?.[0] || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-slate-800 truncate leading-snug">{ticket.author_id}</p>
          </div>
        </div>
        {ticket.books && (
          <div className="pt-1.5 space-y-0.5">
            <InfoRow label="Title Mapping" value={ticket.books.title} />
            <InfoRow label="Index Standard" value={<span className="font-mono bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded text-[10px] font-bold">{ticket.books.isbn}</span>} />
          </div>
        )}
      </div>

      {/* Original Case Payload */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4.5 shadow-sm">
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest pb-2 flex items-center gap-1.5">
          <FileText size={13} className="text-gray-400" />
          <span>Original Case Payload</span>
        </p>
        <div className="max-h-28 overflow-y-auto scrollbar-none">
          <p className="text-xs text-slate-600 leading-relaxed font-bold whitespace-pre-wrap">
            {ticket.description}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── LOCAL SUB-COMPONENT 3: CHAT MESSAGE BUBBLE ───────────
function MessageBubble({ message }) {
  const isAdmin = message.sender_role === 'admin'
  const isInternal = message.is_internal

  return (
    <div className={`flex w-full mb-3.5 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm transition-all ${isInternal
          ? 'bg-amber-50/90 border border-amber-200/70 text-amber-900 rounded-br-none'
          : isAdmin
            ? 'bg-[#1a56db] text-white rounded-br-none font-medium'
            : 'bg-slate-100 border border-slate-200/40 text-slate-800 rounded-bl-none font-medium'
        }`}>
        {isInternal && (
          <div className="flex items-center gap-1 text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">
            <EyeOff size={11} />
            <span>Internal Audit Note</span>
          </div>
        )}
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <div className={`text-[10px] mt-1.5 font-mono text-right font-bold flex items-center justify-end gap-1 ${isInternal ? 'text-amber-500' : isAdmin ? 'text-blue-200' : 'text-gray-400'
          }`}>
          <span>{isAdmin ? '👤 Admin' : '✍️ Author'}</span>
          <span>•</span>
          <span>
            {new Date(message.created_at).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="animate-pulse flex flex-col lg:flex-row gap-5">
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 h-[550px]" />
      <div className="w-full lg:w-96 bg-white rounded-2xl border border-gray-100 h-[550px]" />
    </div>
  )
}

// ─── MAIN EXPORT COMPONENT ────────────────────────────────
export default function AdminTicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [ticket, setTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [reply, setReply] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isOnline, setIsOnline] = useState(false)
  const [updating, setUpdating] = useState('')
  const [draftCopied, setDraftCopied] = useState(false)

  const bottomRef = useRef(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ticketRes, messagesRes] = await Promise.all([
          ticketsAPI.getById(id),
          messagesAPI.getAll(id)
        ])
        setTicket(ticketRes.data?.data || ticketRes.data)
        setMessages(messagesRes.data?.data || messagesRes.data || [])
      } catch (err) {
        console.error('❌ Fetch operational error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  useEffect(() => {
    if (!id) return
    const channel = supabase.channel(`admin-messages-${id}-${Date.now()}`)
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `ticket_id=eq.${id}` }, (payload) => {
      setMessages(prev => {
        if (prev.find(m => m.id === payload.new.id)) return prev
        const tempIndex = prev.findIndex(m => m.id?.startsWith('temp-'))
        if (tempIndex !== -1) {
          const updated = [...prev]; updated[tempIndex] = payload.new; return updated
        }
        return [...prev, payload.new]
      })
    })
    channel.on('status', status => setIsOnline(status === 'SUBSCRIBED')).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = async (e) => {
    if (e) e.preventDefault()
    if (!reply.trim() || sending) return
    const tempId = 'temp-' + Date.now()
    const content = reply.trim()
    setMessages(prev => [...prev, { id: tempId, content, sender_role: 'admin', is_internal: isInternal, created_at: new Date().toISOString() }])
    setReply('')
    try {
      setSending(true)
      await messagesAPI.send(id, content, isInternal)
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempId)); setReply(content); console.error(err)
    } finally { setSending(false) }
  }

  const handleStatusChange = async (status) => {
    try { setUpdating('status'); await ticketsAPI.updateStatus(id, status); setTicket(prev => ({ ...prev, status })) }
    catch (err) { console.error(err) } finally { setUpdating('') }
  }

  const handlePriorityChange = async (priority) => {
    try { setUpdating('priority'); await ticketsAPI.updatePriority(id, priority); setTicket(prev => ({ ...prev, admin_priority: priority })) }
    catch (err) { console.error(err) } finally { setUpdating('') }
  }

  const handleCategoryChange = async (category) => {
    try { setUpdating('category'); await ticketsAPI.updateCategory(id, category); setTicket(prev => ({ ...prev, admin_category: category })) }
    catch (err) { console.error(err) } finally { setUpdating('') }
  }

  const handleUseDraft = () => {
    setReply(ticket.ai_draft); setIsInternal(false); setDraftCopied(true)
    setTimeout(() => setDraftCopied(false), 2000)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (loading) return <Layout title="Operational Desk"><Skeleton /></Layout>
  if (!ticket) return <Layout title="Operational Desk"><div className="text-center py-20 text-slate-800 font-bold">Operational missing</div></Layout>

  return (
    <Layout
      title="Ticket Management Console"
      action={
        <button onClick={() => navigate('/admin/tickets')} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-slate-600 text-xs font-bold uppercase px-3.5 py-2 rounded-xl hover:bg-gray-50 transition shadow-sm">
          <ArrowLeft size={14} /><span>Back to Tickets</span>
        </button>
      }
    >
      {/* 🟩 INJECTED: Runtime linear global dynamic styles container element */}
      <style>{styleInject}</style>

      <div className="flex flex-col lg:flex-row gap-5 items-start">

        {/* LEFT CHAT AREA CONTAINER */}
        <div className="w-full flex-1 bg-white rounded-2xl border border-gray-200 flex flex-col h-[calc(100vh-160px)] min-h-[500px] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/40">
            <div className="min-w-0">
              <h3 className="font-black text-slate-800 text-sm sm:text-base truncate tracking-tight">{ticket.subject}</h3>
              <p className="text-[11px] text-slate-400 font-bold truncate mt-0.5 flex items-center gap-1"><BookOpen size={12} /><span>Context: {ticket.books?.title || 'Account Parameter'}</span></p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 bg-slate-50/20 space-y-2">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center"><h5 className="text-sm font-bold text-slate-800">Secure Feed Clear</h5></div>
            ) : (
              messages.map(msg => <MessageBubble key={msg.id} message={msg} />)
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-4 bg-white border-t border-gray-100 space-y-3 shadow-inner">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-fit border border-gray-200/30">
              <button type="button" onClick={() => setIsInternal(false)} className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${!isInternal ? 'bg-white text-[#1a56db] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}><MessageSquare size={13} /><span>Public Channel</span></button>
              <button type="button" onClick={() => setIsInternal(true)} className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${isInternal ? 'bg-amber-500 text-white shadow-sm shadow-amber-100' : 'text-slate-500 hover:text-slate-800'}`}><EyeOff size={13} /><span>Internal Note</span></button>
            </div>
            <form onSubmit={handleSend} className="flex gap-2 items-end">
              <textarea value={reply} onChange={e => setReply(e.target.value)} onKeyDown={handleKeyDown} rows={Math.min(4, Math.max(1, reply.split('\n').length || 1))} placeholder={isInternal ? 'Write a private note...' : 'Transmit response (Press Enter to send, Shift+Enter for new line)...'} className={`flex-1 px-4 py-2.5 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none max-h-32 min-h-[40px] overflow-y-auto font-medium ${isInternal ? 'border-amber-300 bg-amber-50/50 focus:ring-amber-400 text-amber-900 custom-scrollbar' : 'border-slate-200 bg-slate-50/80 focus:ring-[#1a56db] text-slate-800 custom-scrollbar'}`} />
              <button type="submit" disabled={!reply.trim() || sending} className={`w-10 h-10 rounded-xl shadow-sm flex items-center justify-center shrink-0 transition-all disabled:opacity-40 ${isInternal ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-100' : 'bg-[#1a56db] hover:bg-blue-700 text-white shadow-blue-100'}`}>{sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={14} />}</button>
            </form>
          </div>
        </div>

        {/* RIGHT SIDEBAR MODULE */}
        <div className="w-full lg:w-96 shrink-0 space-y-4 max-h-[calc(100vh-160px)] overflow-y-auto pr-1 pb-4">
          <AIDraftBox ticket={ticket} handleUseDraft={handleUseDraft} draftCopied={draftCopied} />
          <TicketMetaSidebar ticket={ticket} updating={updating} handleStatusChange={handleStatusChange} handlePriorityChange={handlePriorityChange} handleCategoryChange={handleCategoryChange} priority={ticket.admin_priority || ticket.ai_priority} />
        </div>

      </div>
    </Layout>
  )
}