// src/app.js
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import authRoutes     from './routes/auth.routes.js'
import booksRoutes    from './routes/books.routes.js'
import ticketsRoutes  from './routes/tickets.routes.js'
import messagesRoutes from './routes/messages.routes.js'
import notesRoutes    from './routes/notes.routes.js'
import aiRoutes       from './routes/ai.routes.js'

import { errorMiddleware } from './middleware/error.middleware.js'
import { apiLimiter }      from './middleware/rateLimit.middleware.js'

const app = express()

// Security
app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}))

// Body parser
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Disable caching for API endpoints
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
})

// Logger
app.use(morgan('dev'))

// Rate limit
app.use('/api', apiLimiter)

// Routes
app.use('/api/auth',     authRoutes)
app.use('/api/books',    booksRoutes)
app.use('/api/tickets',  ticketsRoutes)
app.use('/api/tickets/:ticketId/messages', messagesRoutes)  // ✅ fix
app.use('/api/tickets/:ticketId/notes',    notesRoutes)     // ✅ fix
app.use('/api/ai',       aiRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'BookLeaf API is running',
    timestamp: new Date().toISOString()
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.originalUrl} not found` 
  })
})

// Error handler
app.use(errorMiddleware)

export default app