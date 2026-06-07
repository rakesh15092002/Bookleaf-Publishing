import booksService from '../services/books.service.js'
import { successResponse, forbiddenResponse } from '../utils/apiResponse.js'

const getBooks = async (req, res, next) => {
  try {
    const { role, author_id } = req.user
    const books = role === 'admin'
      ? await booksService.getAllBooks()
      : await booksService.getBooksByAuthor(author_id)
    return successResponse(res, books, 'Books fetched')
  } catch (err) {
    next(err)
  }
}

const getBookById = async (req, res, next) => {
  try {
    const { id } = req.params
    const { role, author_id } = req.user
    const book = await booksService.getBookById(id)

    if (role === 'author' && book.author_id !== author_id) {
      return forbiddenResponse(res, 'Access denied')
    }

    return successResponse(res, book, 'Book fetched')
  } catch (err) {
    next(err)
  }
}

const getRoyaltySummary = async (req, res, next) => {
  try {
    const { id } = req.params
    const { role, author_id } = req.user
    const summary = await booksService.getRoyaltySummary(id)

    if (role === 'author' && summary.author_id !== author_id) {
      return forbiddenResponse(res, 'Access denied')
    }

    return successResponse(res, summary, 'Royalty summary fetched')
  } catch (err) {
    next(err)
  }
}

export default { getBooks, getBookById, getRoyaltySummary }