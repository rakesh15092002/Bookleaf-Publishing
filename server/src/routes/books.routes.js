// src/routes/books.routes.js
import { Router } from 'express'
import booksController from '../controllers/books.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const router = Router()

// All routes protected
router.use(authMiddleware)

router.get('/',              booksController.getBooks)
router.get('/my-books',      booksController.getBooks)
router.get('/:id',           booksController.getBookById)
router.get('/:id/royalty',   booksController.getRoyaltySummary)

export default router