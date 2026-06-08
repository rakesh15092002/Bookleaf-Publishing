import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, BookOpen, Bot, Calendar, ShieldAlert, MessageSquare, Hash, Lock } from 'lucide-react';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import { ticketsAPI, messagesAPI } from '../../services/api';
import { supabase } from '../../lib/supabase';

function MessageBubble({ message, currentRole }) {
  const isMe = message.sender_role === currentRole;
  return (
    <div className={`flex w-full mb-3.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm transition-all duration-200 ${isMe ? 'bg-[#1a56db] text-white rounded-br-none font-medium' : 'bg-white border border-gray-200 text-slate-800 rounded-bl-none font-medium'}`}>
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <div className={`text-[10px] mt-1.5 font-mono text-right font-bold ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
          {new Date(message.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider shrink-0">{label}</span>
      <div className="text-xs font-bold text-slate-700 text-right min-w-0 truncate">{value}</div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-gray-100 h-16" />
      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 h-[500px]" />
        <div className="w-full lg:w-72 bg-white rounded-2xl border border-gray-100 h-[500px]" />
      </div>
    </div>
  );
}

export default function AuthorTicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  const bottomRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ticketResponse, messagesResponse] = await Promise.all([
          ticketsAPI.getById(id),
          messagesAPI.getAll(id)
        ]);
        const ticketData = ticketResponse.data?.data || ticketResponse.data;
        const messagesData = messagesResponse.data?.data || messagesResponse.data || [];
        setTicket(ticketData);
        const filteredMessages = messagesData.filter((msg) => !msg.is_internal);
        setMessages(filteredMessages);
      } catch (error) {
        console.error('Error fetching ticket data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase.channel(`ticket-channel-${id}`);
    channel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `ticket_id=eq.${id}`
    }, (payload) => {
      if (!payload.new.is_internal) {
        setMessages((prev) => {
          const exists = prev.find((msg) => msg.id === payload.new.id);
          if (exists) return prev;
          return [...prev, payload.new];
        });
      }
    });
    channel.on('status', (status) => {
      setIsOnline(status === 'SUBSCRIBED');
    });
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!reply.trim() || sending) return;
    const optimisticMessage = {
      id: 'temp-' + Date.now(),
      content: reply.trim(),
      sender_role: 'author',
      is_internal: false,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setReply('');
    setSending(true);
    try {
      const response = await messagesAPI.send(id, optimisticMessage.content);
      const savedMessage = response.data?.data || response.data;
      setMessages((prev) => prev.map((msg) => msg.id === optimisticMessage.id ? savedMessage : msg));
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));
      setReply(optimisticMessage.content);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <Layout title="Case Thread Details"><Skeleton /></Layout>;
  }

  if (!ticket) {
    return (
      <Layout title="Case Thread Details">
        <div className="bg-white border border-gray-100 rounded-2xl py-20 text-center max-w-md mx-auto px-4">
          <p className="text-4xl mb-4">😕</p>
          <h5 className="text-sm font-bold text-gray-800">Ticket not found</h5>
          <button
            onClick={() => navigate('/author/tickets')}
            className="mt-5 inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition"
          >
            <ArrowLeft size={14} />
            <span>Back to Tickets</span>
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Case Thread Details">

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100 -mx-4 sm:-mx-6 px-4 sm:px-6 py-0 mb-5 shadow-sm">
        <div className="flex items-center justify-between gap-4 h-14">

          {/* Left group */}
          <div className="flex items-center gap-0 min-w-0 flex-1">

            {/* Back button */}
            <button
              onClick={() => navigate('/author/tickets')}
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs font-bold px-3 py-2 rounded-xl hover:bg-gray-100 transition shrink-0"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>

            {/* Divider */}
            <span className="w-px h-5 bg-gray-200 mx-2 shrink-0" />

            {/* ID badge */}
            <span className="font-mono text-[10px] font-extrabold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg uppercase tracking-wider shrink-0">
              #{ticket.id?.slice(0, 8).toUpperCase()}
            </span>

            {/* Status badge */}
            <span className="ml-2 shrink-0">
              <StatusBadge status={ticket.status} />
            </span>

            {/* Divider */}
            <span className="w-px h-5 bg-gray-200 mx-3 shrink-0 hidden sm:block" />

            {/* Subject */}
            <h2 className="text-sm font-bold text-slate-800 truncate hidden sm:block">
              {ticket.subject}
            </h2>
          </div>

          {/* Right: Live pill */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full shrink-0">
            <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {isOnline ? 'Live' : 'Connecting'}
            </span>
          </div>
        </div>

        {/* Subject on mobile */}
        <p className="text-xs font-bold text-slate-700 pb-2.5 truncate sm:hidden">
          {ticket.subject}
        </p>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col lg:flex-row gap-5 items-start" style={{ height: 'calc(100vh - 165px)' }}>

        {/* ── Chat Panel ── */}
        <div className="w-full flex-1 bg-white rounded-2xl border border-gray-200 flex flex-col h-full shadow-sm overflow-hidden">

          {/* Support Thread header */}
          <div className="px-5 py-3 border-b border-gray-100 bg-white flex items-center gap-2 shrink-0">
            <MessageSquare size={14} className="text-[#1a56db]" />
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-widest">Support Thread</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-5 bg-slate-50/40 space-y-2">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-xs mx-auto">
                <div className="w-12 h-12 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-center mb-3">
                  <MessageSquare size={20} className="text-[#1a56db]" />
                </div>
                <h5 className="text-sm font-bold text-gray-800">No messages yet</h5>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed font-medium">
                  Send your first message below and our support team will respond shortly.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} currentRole="author" />
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3.5 bg-white border-t border-gray-100 shrink-0">
            {ticket.status === 'closed' ? (
              <div className="flex items-center justify-center gap-2 text-amber-600 bg-amber-50 border border-amber-100 rounded-xl py-3 text-xs font-bold">
                <Lock size={13} />
                <span>This ticket is closed and locked.</span>
              </div>
            ) : (
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 px-4 py-2.5 bg-slate-50 text-slate-800 placeholder-gray-400 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:bg-white transition-all font-medium"
                />
                <button
                  type="submit"
                  disabled={!reply.trim() || sending}
                  className="bg-[#1a56db] hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center shrink-0"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="w-full lg:w-72 shrink-0 space-y-4 lg:sticky lg:top-0 h-full overflow-y-auto pb-4 scrollbar-none">

          {/* Ticket Info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <p className="text-[11px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-100 pb-2.5 mb-1">
              <ShieldAlert size={13} />
              <span>Ticket Info</span>
            </p>
            <div className="pt-1.5">
              <InfoRow label="Status" value={<StatusBadge status={ticket.status} />} />
              <InfoRow label="Priority" value={<PriorityBadge priority={ticket.admin_priority || ticket.ai_priority} />} />
              <InfoRow
                label="Category"
                value={
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 border border-purple-100 text-purple-700 text-[10px] font-extrabold uppercase rounded">
                    <Bot size={11} className="text-purple-400" />
                    <span>{ticket.admin_category || ticket.ai_category || 'Unassigned'}</span>
                  </span>
                }
              />
              <InfoRow
                label="Created"
                value={
                  <span className="flex items-center gap-1 text-gray-500 font-mono text-[11px]">
                    <Calendar size={11} className="text-gray-300" />
                    {new Date(ticket.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                }
              />
            </div>
          </div>

          {/* Linked Book */}
          {ticket.books && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <p className="text-[11px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-100 pb-2.5 mb-1">
                <BookOpen size={13} />
                <span>Linked Book</span>
              </p>
              <div className="pt-1">
                <InfoRow label="Title" value={ticket.books.title} />
                <InfoRow label="ISBN" value={
                  <span className="font-mono bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded text-[10px] tracking-wide">
                    {ticket.books.isbn}
                  </span>
                } />
              </div>
            </div>
          )}

          {/* Original Description */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <p className="text-[11px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-100 pb-2.5 mb-1">
              <Hash size={13} />
              <span>Original Description</span>
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
  );
}