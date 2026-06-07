import ticketsService from '../services/tickets.service.js'
import { successResponse, createdResponse, forbiddenResponse } from '../utils/apiResponse.js'

const getTickets = async (req, res, next) => {
  try {
    const { role, author_id } = req.user
    const filters = {
      status:   req.query.status,
      priority: req.query.priority,
      category: req.query.category,
      page:     parseInt(req.query.page)  || 1,
      limit:    parseInt(req.query.limit) || 10
    }
    const result = role === 'admin'
      ? await ticketsService.getAllTickets(filters)
      : await ticketsService.getTicketsByAuthor(author_id, filters)
    return successResponse(res, result, 'Tickets fetched')
  } catch (err) {
    next(err)
  }
}

const getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params
    const { role, author_id } = req.user
    const ticket = await ticketsService.getTicketById(id)

    if (role === 'author' && ticket.author_id !== author_id) {
      return forbiddenResponse(res, 'Access denied')
    }

    return successResponse(res, ticket, 'Ticket fetched')
  } catch (err) {
    next(err)
  }
}

const createTicket = async (req, res, next) => {
  try {
    const { subject, description, book_id } = req.body
    const { author_id } = req.user
    const ticket = await ticketsService.createTicket({
      author_id,
      subject,
      description,
      book_id: book_id || null
    })
    return createdResponse(res, ticket, 'Ticket created successfully')
  } catch (err) {
    next(err)
  }
}

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const ticket = await ticketsService.updateStatus(id, status)
    return successResponse(res, ticket, 'Status updated')
  } catch (err) {
    next(err)
  }
}

const assignTicket = async (req, res, next) => {
  try {
    const { id } = req.params
    const adminId = req.user.id
    const ticket = await ticketsService.assignTicket(id, adminId)
    return successResponse(res, ticket, 'Ticket assigned')
  } catch (err) {
    next(err)
  }
}

const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params
    const { category } = req.body
    const ticket = await ticketsService.updateCategory(id, category)
    return successResponse(res, ticket, 'Category updated')
  } catch (err) {
    next(err)
  }
}

const updatePriority = async (req, res, next) => {
  try {
    const { id } = req.params
    const { priority } = req.body
    const ticket = await ticketsService.updatePriority(id, priority)
    return successResponse(res, ticket, 'Priority updated')
  } catch (err) {
    next(err)
  }
}

export default { getTickets, getTicketById, createTicket, updateStatus, assignTicket, updateCategory, updatePriority }