import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Pages
import Login from './pages/auth/Login'
import AuthorDashboard from './pages/author/Dashboard'
import AuthorBooks from './pages/author/Books'
import AuthorTickets from './pages/author/Tickets'
import NewTicket from './pages/author/NewTicket'
import AuthorTicketDetail from './pages/author/TicketDetail'
import AdminDashboard from './pages/admin/Dashboard'
import AdminTickets from './pages/admin/Tickets'
import AdminTicketDetail from './pages/admin/TicketDetail'
import AuthorRegistry from './pages/admin/AuthorRegistry'
import AuthorDetail from './pages/admin/AuthorDetail'

// ─── Protected Route ────────────────────────────────────
function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="w-8 h-8 border-4 border-[#1a56db] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== allowedRole) {
    return <Navigate to={`/${user.role}/dashboard`} replace />
  }

  return children
}

// ─── Routes ─────────────────────────────────────────────
function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/" element={
        user
          ? <Navigate to={`/${user.role}/dashboard`} replace />
          : <Navigate to="/login" replace />
      } />

      <Route path="/login" element={
        user
          ? <Navigate to={`/${user.role}/dashboard`} replace />
          : <Login />
      } />

      {/* Author routes */}
      <Route path="/author/dashboard" element={
        <ProtectedRoute allowedRole="author"><AuthorDashboard /></ProtectedRoute>
      } />
      <Route path="/author/books" element={
        <ProtectedRoute allowedRole="author"><AuthorBooks /></ProtectedRoute>
      } />
      <Route path="/author/tickets" element={
        <ProtectedRoute allowedRole="author"><AuthorTickets /></ProtectedRoute>
      } />
      <Route path="/author/tickets/new" element={
        <ProtectedRoute allowedRole="author"><NewTicket /></ProtectedRoute>
      } />
      <Route path="/author/tickets/:id" element={
        <ProtectedRoute allowedRole="author"><AuthorTicketDetail /></ProtectedRoute>
      } />

      {/* Admin routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/admin/tickets" element={
        <ProtectedRoute allowedRole="admin"><AdminTickets /></ProtectedRoute>
      } />
      <Route path="/admin/tickets/:id" element={
        <ProtectedRoute allowedRole="admin"><AdminTicketDetail /></ProtectedRoute>
      } />

      <Route path="/admin/authors" element={
        <ProtectedRoute allowedRole="admin"><AuthorRegistry /></ProtectedRoute>
      } />
      <Route path="/admin/authors/:id" element={
        <ProtectedRoute allowedRole="admin"><AuthorDetail /></ProtectedRoute>
      } />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}