import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import { adminAPI } from '../../services/api'

const AuthorDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [author, setAuthor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAuthor = async () => {
      try {
        const response = await adminAPI.getAuthorById(id)
        setAuthor(response.data.data)
      } catch (err) {
        console.error('Error loading author detail:', err)
        setError(err.response?.data?.message || 'Unable to load author details')
      } finally {
        setLoading(false)
      }
    }

    fetchAuthor()
  }, [id])

  if (loading) {
    return (
      <Layout title="Author Detail">
        <div className="min-h-[320px] flex items-center justify-center text-sm text-slate-600">Loading author details…</div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Author Detail">
        <div className="min-h-[320px] flex flex-col items-center justify-center gap-3 text-sm text-red-600">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => navigate('/admin/authors')}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-700"
          >
            Back to authors
          </button>
        </div>
      </Layout>
    )
  }

  const books = Array.isArray(author?.books) ? author.books : []
  const publishedCount = books.filter((book) => book.status?.toLowerCase() === 'published').length

  return (
    <Layout title={`Author: ${author.name}`}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{author.name}</h1>
            <p className="mt-2 text-sm text-slate-500">Author profile and published book details for admin review.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/authors')}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Back to author registry
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3">
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Author information</div>
                  <div className="text-xl font-bold text-slate-900">{author.name}</div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs text-slate-500">Email</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900 break-all">{author.email}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs text-slate-500">Role</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{author.role || 'author'}</div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs text-slate-500">Total books</div>
                    <div className="mt-2 text-lg font-bold text-slate-900">{books.length}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs text-slate-500">Published</div>
                    <div className="mt-2 text-lg font-bold text-slate-900">{publishedCount}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs text-slate-500">Joined</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{new Date(author.created_at || author.createdAt || Date.now()).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-slate-900">About this author</div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                This view gives the admin the complete author profile, including the author’s current book list and publication details. Use it to confirm that the author is publishing content and that the books associated with this author are visible.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-slate-900">Quick author summary</div>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex justify-between gap-2">
                  <span>Author ID</span>
                  <span className="font-semibold text-slate-900">{author.id}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Verified status</span>
                  <span className="font-semibold text-slate-900">{author.is_verified ? 'Verified' : 'Not verified'}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Books published</span>
                  <span className="font-semibold text-slate-900">{books.length}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Published titles</span>
                  <span className="font-semibold text-slate-900">{publishedCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-5 bg-slate-50 border-b border-slate-200">
            <div className="text-sm font-semibold text-slate-900">Books published by this author</div>
            <p className="mt-1 text-xs text-slate-500">All important book details are shown below so admin can review the author’s published work.</p>
          </div>

          {books.length === 0 ? (
            <div className="p-6 text-sm text-slate-600">No books published by this author yet.</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {books.map((book) => (
                <div key={book.id} className="px-6 py-5 sm:flex sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-slate-900">{book.title}</div>
                    <div className="mt-1 text-sm text-slate-500">ISBN: {book.isbn || 'Not available'}</div>
                    <div className="mt-1 text-sm text-slate-500">Published: {book.publication_date ? new Date(book.publication_date).toLocaleDateString() : 'Pending'}</div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-0 sm:justify-end">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-slate-600">{book.status || 'unknown'}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-slate-600">{book.genre || 'Genre unknown'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default AuthorDetail
