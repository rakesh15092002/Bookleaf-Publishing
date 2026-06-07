import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  FileText,
  MessageSquareText,
  AlertCircle,
  Send,
  ArrowLeft,
  HelpCircle
} from 'lucide-react'

import Layout from '../../components/Layout'
import { ticketsAPI, booksAPI } from '../../services/api'

export default function NewTicket() {
  const navigate = useNavigate()

  const [books, setBooks] = useState([])
  const [form, setForm] = useState({
    book_id: '',
    subject: '',
    description: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [booksLoading, setBooksLoading] = useState(true)

  useEffect(() => {
    booksAPI
      .myBooks()
      .then((res) => setBooks(res.data.data || []))
      .catch(console.error)
      .finally(() => setBooksLoading(false))
  }, [])

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.subject.trim()) {
      setError('Subject is required before submitting your case thread.')
      return
    }

    if (!form.description.trim()) {
      setError('A descriptive explanation is required to process AI sorting rules.')
      return
    }

    try {
      setLoading(true)
      const res = await ticketsAPI.create(form)
      const ticketId = res.data.data?.id
      navigate(`/author/tickets/${ticketId}`)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to establish a secure database entry link. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="New Ticket Thread">
      <div className="max-w-3xl mx-auto px-1 sm:px-4 py-2">
        <div className="bg-white border border-gray-100 rounded-2xl md:rounded-[24px] shadow-sm overflow-hidden transition-all duration-300">
          
          {/* Header Block — Aligned gradients for premium feel */}
          <div className="p-5 sm:p-8 border-b border-gray-50 bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="bg-white p-3.5 rounded-xl shadow-sm border border-gray-100 shrink-0">
                <FileText size={24} className="text-[#1a56db]" />
              </div>

              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
                  Open Support Ticket
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed font-medium">
                  Detail your inquiry or system anomalies. Our background classification pipelines will route priorities instantly.
                </p>
              </div>
            </div>
          </div>

          {/* Core Interaction Form Content Area */}
          <div className="p-5 sm:p-8">
            
            {/* Error Message Layout Banner */}
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50/60 px-4 py-3.5 text-red-700 animate-fadeIn">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm font-bold tracking-wide">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Related Book Dropdown Module */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Related Catalogue Title
                  <span className="text-slate-400 font-semibold normal-case ml-1.5">(Optional)</span>
                </label>

                {booksLoading ? (
                  <div className="h-11 sm:h-12 rounded-xl bg-slate-50 border border-slate-100 animate-pulse" />
                ) : (
                  <div className="relative">
                    <BookOpen size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <select
                      name="book_id"
                      value={form.book_id}
                      onChange={handleChange}
                      className="w-full h-11 sm:h-12 rounded-xl border border-gray-200 bg-white pl-11 pr-10 text-xs sm:text-sm text-slate-700 outline-none cursor-pointer transition-all appearance-none focus:border-[#1a56db] focus:ring-4 focus:ring-blue-50 font-medium"
                    >
                      <option value="" className="text-gray-400">General Platform or Account-level Query</option>
                      {books.map((book) => (
                        <option key={book.id} value={book.id} className="text-slate-800">
                          {book.title} {book.isbn ? `(${book.isbn})` : ''}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-400 w-0 h-0" />
                  </div>
                )}
              </div>

              {/* Subject Text Input Layout */}
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
                  <span className="text-[10px] sm:text-xs text-gray-400 font-mono font-bold bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                    {form.subject.length}/150
                  </span>
                </div>
              </div>

              {/* Description Core Textarea Block */}
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
                    rows={6}
                    maxLength={2000}
                    placeholder="Provide granular technical parameters regarding your issues. Explicit explanations trigger faster automated policy responses across our integrated AI layers."
                    className="w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 py-3.5 text-xs sm:text-sm text-slate-700 outline-none resize-none transition-all placeholder:text-gray-400 focus:border-[#1a56db] focus:ring-4 focus:ring-blue-50 font-medium leading-relaxed"
                  />
                </div>
                <div className="mt-1.5 flex justify-end">
                  <span className="text-[10px] sm:text-xs text-gray-400 font-mono font-bold bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                    {form.description.length}/2000
                  </span>
                </div>
              </div>

              {/* Safety Pre-submission Helper Box */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 flex gap-3 items-start">
                <HelpCircle size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">AI Processing Notice</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                    Our semantic parsers handle high-volume ticket routing automatically. Clear statements regarding transactional nodes or payouts ensure precision mappings.
                  </p>
                </div>
              </div>

              {/* Responsive Trigger Buttons Grid Desk Layout */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/author/tickets')}
                  className="flex-1 h-11 sm:h-12 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm font-bold text-slate-600 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={14} />
                  <span>Cancel</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-11 sm:h-12 rounded-xl bg-[#1a56db] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Orchestrating Model Agents...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Submit Request</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </Layout>
  )
}