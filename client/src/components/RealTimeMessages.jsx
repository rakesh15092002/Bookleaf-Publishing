import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { messagesAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function RealTimeMessages({ ticketId }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isOnline, setIsOnline] = useState(false)
  const bottomRef = useRef(null)

  // 1. Snapshot historical data stream array from Express server layers
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await messagesAPI.getAll(ticketId)
        const msgs = Array.isArray(res.data) ? res.data : (res.data?.data || [])
        setMessages(msgs)
      } catch (err) {
        console.error('Messages fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    if (ticketId) fetchMessages()
  }, [ticketId])

  // 2. Clear out fixed subscription strings channel pipeline
  useEffect(() => {
    if (!ticketId || !user?.role) return

    // Dynamic unique session generation resets past locked instances safely
    const customInstanceSalt = Math.random().toString(36).substring(7)
    const channel = supabase.channel(`direct-chat-stream-${customInstanceSalt}`)
    
    const targetCleanUUID = String(ticketId).toLowerCase().trim()
    console.log(`🔌 Initializing open channel socket interface on ticket reference: ${targetCleanUUID}`)

    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
        // 🚨 SHORT-CIRCUIT: Filter condition hata kar client side validation trigger kiya
      }, (payload) => {
        console.log('⚡ RAW REALTIME DATABOUND DATA EVENT INTERCEPTED:', payload.new)
        const incomingMsg = payload.new

        // Strict client-side check checks data payload parameters manually
        if (String(incomingMsg.ticket_id).toLowerCase().trim() !== targetCleanUUID) return
        if (incomingMsg.is_internal && user.role === 'author') return

        setMessages((prev) => {
          if (prev.some(m => m.id === incomingMsg.id)) return prev
          const filteredTimeline = prev.filter(m => !String(m.id).startsWith('temp-'))
          return [...filteredTimeline, incomingMsg]
        })
      })
      .on('status', (status) => {
        console.log(`📡 REALTIME WEBSOCKET BACKEND BROADCAST UPDATE: ${status}`)
        setIsOnline(status === 'SUBSCRIBED') // Force state verification switch execution
      })
      .subscribe()

    return () => {
      console.log('🔌 Unlinking current message loop pipeline contexts...')
      supabase.removeChannel(channel)
    }
  }, [ticketId, user?.role])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    if (e) e.preventDefault()
    const content = newMessage.trim()
    if (!content || sending) return

    const tempId = `temp-${Date.now()}`
    const optimisticMessage = {
      id: tempId,
      content,
      sender_role: user.role,
      sender_id: user.id,
      is_internal: false,
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, optimisticMessage])
    setNewMessage('')

    try {
      setSending(true)
      await messagesAPI.send(ticketId, content, false)
    } catch (err) {
      console.error('REST endpoint dropped delivery, rolling back state array items:', err)
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setNewMessage(content)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1a56db]" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Synchronization Track State UI Component */}
      <div className={`flex items-center gap-2 px-4 py-2 border-b text-xs font-semibold ${
        isOnline ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'
      }`}>
        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-amber-400'}`} />
        {isOnline ? '🔴 Live Sync Connected' : '⏳ Connecting...'}
      </div>

      {/* Primary Message Stream Rendering Desk */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[320px] max-h-[450px]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10 text-center">
            <span className="text-3xl mb-1">💬</span>
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = String(msg.sender_id).trim() === String(user.id).trim() || 
                         String(msg.sender_role).toLowerCase() === String(user.role).toLowerCase()
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm border ${
                  msg.is_internal 
                    ? 'bg-purple-50 border-purple-200 text-purple-900 rounded-bl-none'
                    : isMe 
                    ? 'bg-[#1a56db] border-blue-600 text-white rounded-br-none' 
                    : 'bg-gray-50 border-gray-200 text-gray-800 rounded-bl-none'
                }`}>
                  {msg.is_internal && (
                    <span className="text-xs text-purple-700 font-bold block mb-1">🔒 Internal Note</span>
                  )}
                  <p className="break-words leading-relaxed">{msg.content}</p>
                  <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 bg-gray-50 border-t border-gray-100">
        <div className="flex gap-2">
          <textarea
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your reply here... (Enter to send)"
            rows={1}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#1a56db] bg-white text-gray-700"
          />
          <button
            onClick={() => handleSend()}
            disabled={sending || !newMessage.trim()}
            className="bg-[#1a56db] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}