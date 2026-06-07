import { useState, useEffect } from 'react'
import { BookOpen, Layers, Grid, List, Ticket, X, FileText, AlertCircle, MessageSquareText, HelpCircle, Send } from 'lucide-react'
import Layout from '../../components/Layout'
import { booksAPI, ticketsAPI } from '../../services/api'

// ─── Modern Status Badge for Books ────────────────────────
function BookStatusBadge({ status }) {
  const styles = {
    published: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    in_production: 'bg-amber-50 border-amber-100 text-amber-700',
    under_review: 'bg-blue-50 border-blue-100 text-blue-700',
  }
  const labels = {
    published: 'Published',
    in_production: 'In Production',
    under_review: 'Under Review',
  }
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border whitespace-nowrap tracking-wider uppercase shrink-0 ${styles[status] || 'bg-gray-50 border-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  )
}

// ─── Sleek Royalty Analytics Bar ──────────────────────────
function RoyaltyBar({ paid, total, compact }) {
  const percent = total > 0 ? Math.round((paid / total) * 100) : 0
  return (
    <div className="space-y-1 w-full">
      {!compact && (
        <div className="flex justify-between items-center text-xs font-bold font-mono">
          <span className="text-gray-400 uppercase tracking-wider text-[10px]">Payout:</span>
          <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">{percent}% Settled</span>
        </div>
      )}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden min-w-[70px] sm:min-w-[90px]">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

// ─── Premium Big Card View ────────────────────────────────
function BookCard({ book, onRaiseTicket }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col justify-between gap-5 hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="font-black text-slate-800 text-lg tracking-tight leading-snug truncate">{book.title}</h3>
            <p className="font-mono text-[11px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded w-fit mt-1">
              ISBN: {book.isbn || 'PENDING'}
            </p>
          </div>
          <BookStatusBadge status={book.status} />
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="bg-slate-50 border border-gray-100 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Genre</p>
            <p className="text-xs font-bold text-slate-700 mt-1 truncate">{book.genre || 'General'}</p>
          </div>
          <div className="bg-slate-50 border border-gray-100 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">MRP</p>
            <p className="text-xs font-extrabold text-slate-800 font-mono mt-1">₹{book.mrp || 0}</p>
          </div>
          <div className="bg-blue-50/60 border border-blue-100/40 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Sold</p>
            <p className="text-xs sm:text-sm font-black text-blue-700 font-mono mt-0.5">
              {(book.total_copies_sold || book.copies_sold || 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="border border-gray-200/60 rounded-xl p-4 bg-gray-50/40 space-y-3 shadow-inner">
          <div className="flex justify-between items-center text-xs sm:text-sm font-bold">
            <span className="text-slate-500 font-semibold">Gross Earnings</span>
            <span className="text-slate-800 font-mono font-black text-sm">₹{(book.total_royalty_earned || 0).toLocaleString('en-IN')}</span>
          </div>
          <RoyaltyBar paid={book.royalty_paid} total={book.total_royalty_earned} compact={false} />
          <div className="grid grid-cols-2 gap-4 pt-1.5 border-t border-gray-200/60">
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Paid</p>
              <p className="text-xs font-bold text-emerald-600 font-mono">₹{(book.royalty_paid || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 font-bold uppercase">Pending</p>
              <p className="text-xs font-bold text-rose-500 font-mono">₹{(book.royalty_pending || 0).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-3 border-t border-gray-50">
        {book.available_on && book.available_on.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {book.available_on.map((platform) => (
              <span key={platform} className="px-2 py-0.5 border border-blue-100 bg-blue-50 text-blue-600 text-[10px] font-extrabold tracking-wider uppercase rounded">{platform}</span>
            ))}
          </div>
        )}
        {/* 🟩 UPGRADED: Darker, Bigger Solid Button for Grid View */}
        <div className="flex justify-end pt-1">
          <button
            onClick={() => onRaiseTicket(book)}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white bg-[#1a56db] hover:bg-blue-700 transition-all px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md"
          >
            <Ticket size={15} /> <span>Raise Ticket</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Highly Scalable Compact List Row View ────────────────
function BookRow({ book, onRaiseTicket }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-5 py-3 bg-white hover:bg-gray-50/60 border border-gray-200 rounded-xl transition-all shadow-sm transform hover:-translate-y-0.5">
      <div className="min-w-0 flex-1 lg:max-w-[28%]">
        <h4 className="font-bold text-slate-800 text-sm sm:text-base truncate leading-normal">{book.title}</h4>
        <p className="text-[10px] font-mono font-bold text-gray-400 tracking-wide">ISBN: {book.isbn || 'N/A'}</p>
      </div>

      <div className="flex items-center flex-wrap gap-1 shrink-0 min-w-0 hidden md:flex">
        {book.available_on && book.available_on.length > 0 ? (
          book.available_on.map((platform) => (
            <span key={platform} className="px-2 py-0.5 border border-blue-50 bg-blue-50/50 text-blue-600 text-[9px] font-extrabold tracking-wide uppercase rounded-md">{platform}</span>
          ))
        ) : (
          <span className="text-[10px] text-gray-400 font-semibold italic">No Active Channels</span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:flex sm:items-center gap-x-5 gap-y-1 text-xs font-semibold text-slate-600 border-t lg:border-t-0 pt-1.5 lg:pt-0 border-gray-100">
        <div className="min-w-[60px]"><span className="text-[9px] uppercase text-gray-400 block font-bold tracking-wider">MRP</span><span className="font-mono text-slate-700 font-extrabold">₹{book.mrp}</span></div>
        <div className="min-w-[60px]"><span className="text-[9px] uppercase text-gray-400 block font-bold tracking-wider">Sold</span><span className="font-mono text-blue-600 font-black">{book.total_copies_sold || 0}</span></div>
        <div className="min-w-[90px] hidden sm:block"><span className="text-[9px] uppercase text-gray-400 block font-bold tracking-wider">Total Revenue</span><span className="font-mono text-slate-800 font-black text-xs">₹{book.total_royalty_earned?.toLocaleString('en-IN')}</span></div>
      </div>

      <div className="flex items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-gray-100">
        <div className="hidden xl:block w-24"><RoyaltyBar paid={book.royalty_paid} total={book.total_royalty_earned} compact={true} /></div>
        <BookStatusBadge status={book.status} />

        {/* 🟩 UPGRADED: Darker, Bigger Solid Button for Row View */}
        <button
          onClick={() => onRaiseTicket(book)}
          className="flex items-center gap-2 text-[11px] sm:text-xs font-black uppercase tracking-wider text-white bg-[#1a56db] hover:bg-blue-700 transition-all px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-sm hover:shadow-md shrink-0 ml-1"
          title="Raise Support Ticket"
        >
          <Ticket size={14} /> <span className="hidden sm:inline">Raise Ticket</span>
        </button>
      </div>
    </div>
  )
}

// ─── Main Catalogue Page Controller ────────────────────────
export default function AuthorBooks() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid')

  // 🟩 ADVANCED TICKET MODAL STATE
  const [ticketModal, setTicketModal] = useState(null)
  const [form, setForm] = useState({ subject: '', description: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    booksAPI.myBooks()
      .then(res => setBooks(res.data.data || res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.subject.trim()) return setError('Subject is required before submitting your case thread.')
    if (!form.description.trim()) return setError('A descriptive explanation is required to process AI sorting rules.')

    try {
      setIsSubmitting(true)
      await ticketsAPI.create({
        book_id: ticketModal.id,
        subject: form.subject,
        description: form.description
      })
      alert("Support Ticket Raised Successfully! Check your 'My Tickets' section.")
      closeModal()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to establish a secure database entry link. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const closeModal = () => {
    setTicketModal(null)
    setForm({ subject: '', description: '' })
    setError('')
  }

  const safeBooks = Array.isArray(books) ? books : []
  const totalEarned = safeBooks.reduce((s, b) => s + (b.total_royalty_earned || 0), 0)
  const totalPaid = safeBooks.reduce((s, b) => s + (b.royalty_paid || 0), 0)
  const totalPending = safeBooks.reduce((s, b) => s + (b.royalty_pending || 0), 0)

  if (loading) return <Layout title="Published Books"><div className="h-40 bg-gray-50 rounded-2xl animate-pulse" /></Layout>

  return (
    <Layout title="Published Books">

      {/* Top Summary Ribbon */}
      {safeBooks.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium uppercase tracking-wide">
              Gross Revenue
            </p>
            <p className="text-lg sm:text-2xl font-bold text-slate-700 mt-2 truncate">
              ₹{totalEarned.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium uppercase tracking-wide">
              Disbursed
            </p>
            <p className="text-lg sm:text-2xl font-bold text-emerald-600 mt-2 truncate">
              ₹{totalPaid.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium uppercase tracking-wide">
              Pending Release
            </p>
            <p className="text-lg sm:text-2xl font-bold text-rose-500 mt-2 truncate">
              ₹{totalPending.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      )}

      {/* Layout Control Trays */}
      {safeBooks.length > 0 && (
        <div className="flex justify-between items-center mb-4 px-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Layers size={13} /> <span>Indexed Titles ({safeBooks.length})</span>
          </p>
          <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 border border-gray-200/40">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-[#1a56db] shadow-sm' : 'text-gray-400 hover:text-slate-700'}`}><Grid size={15} /></button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-[#1a56db] shadow-sm' : 'text-gray-400 hover:text-slate-700'}`}><List size={15} /></button>
          </div>
        </div>
      )}

      {/* List Trigger */}
      {safeBooks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">📬</div>
          <h5 className="text-sm font-bold text-gray-800">No catalogue entries detected</h5>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fadeIn">
          {safeBooks.map(book => <BookCard key={book.id} book={book} onRaiseTicket={setTicketModal} />)}
        </div>
      ) : (
        <div className="flex flex-col gap-3 animate-fadeIn">
          {safeBooks.map(book => <BookRow key={book.id} book={book} onRaiseTicket={setTicketModal} />)}
        </div>
      )}

      {/* 🟩 PREMIUM TICKET MODAL OVERLAY (SaaS Grade) */}
      {ticketModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white border border-gray-100 rounded-[24px] shadow-2xl w-full max-w-2xl my-auto transition-all scale-100 relative">

            <button onClick={closeModal} className="absolute top-6 right-6 w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors z-10">
              <X size={16} />
            </button>

            {/* Header Block */}
            <div className="p-6 sm:p-8 border-b border-gray-50 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 rounded-t-[24px]">
              <div className="flex flex-col sm:flex-row items-start gap-4 pr-8">
                <div className="bg-white p-3.5 rounded-xl shadow-sm border border-gray-100 shrink-0">
                  <FileText size={24} className="text-[#1a56db]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">Open Support Ticket</h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed font-medium">
                    Detail your inquiry. Our background classification pipelines will route priorities instantly.
                  </p>
                </div>
              </div>
            </div>

            {/* Core Interaction Form */}
            <div className="p-6 sm:p-8">
              {error && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50/60 px-4 py-3.5 text-red-700 animate-fadeIn">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm font-bold tracking-wide">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Locked Related Book Block */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Target Asset Context</label>
                  <div className="w-full h-auto min-h-[48px] rounded-xl border border-blue-100 bg-blue-50/40 px-4 py-3 text-xs sm:text-sm text-slate-700 flex items-center gap-3">
                    <BookOpen size={16} className="text-[#1a56db] shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800">{ticketModal.title}</span>
                      <span className="text-slate-500 font-mono text-[11px] block mt-0.5">ISBN: {ticketModal.isbn || 'Pending Allocation'}</span>
                    </div>
                  </div>
                </div>

                {/* Subject Text Input */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                    Subject Line <span className="text-red-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <FileText size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      maxLength={150}
                      placeholder="e.g. Discrepancy observed in Q2 royalty distribution ledger sheets"
                      className="w-full h-11 sm:h-12 rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-xs sm:text-sm text-slate-700 outline-none transition-all placeholder:text-gray-400 focus:border-[#1a56db] focus:ring-4 focus:ring-blue-50 font-medium"
                    />
                  </div>
                  <div className="mt-1.5 flex justify-end">
                    <span className="text-[10px] sm:text-xs text-gray-400 font-mono font-bold bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{form.subject.length}/150</span>
                  </div>
                </div>

                {/* Description Textarea */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                    Detailed Explanation <span className="text-red-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <MessageSquareText size={16} className="absolute left-4 top-4 text-slate-400" />
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      rows={5}
                      maxLength={2000}
                      placeholder="Provide granular technical parameters regarding your issues..."
                      className="w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 py-3.5 text-xs sm:text-sm text-slate-700 outline-none resize-none transition-all placeholder:text-gray-400 focus:border-[#1a56db] focus:ring-4 focus:ring-blue-50 font-medium leading-relaxed"
                    />
                  </div>
                  <div className="mt-1.5 flex justify-end">
                    <span className="text-[10px] sm:text-xs text-gray-400 font-mono font-bold bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{form.description.length}/2000</span>
                  </div>
                </div>

                {/* Safety Pre-submission Helper Box */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 flex gap-3 items-start">
                  <HelpCircle size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">AI Processing Notice</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">Our semantic parsers handle high-volume ticket routing automatically. Clear statements ensure precision mappings.</p>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="flex-1 h-11 sm:h-12 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm font-bold text-slate-600 hover:bg-gray-50 transition-all flex items-center justify-center">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="flex-[2] h-11 sm:h-12 rounded-xl bg-[#1a56db] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2">
                    {isSubmitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Processing...</span></> : <><Send size={14} /><span>Submit Request</span></>}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}
    </Layout>
  )
}