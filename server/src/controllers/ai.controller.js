import classifyService from '../services/ai/classify.service.js'
import priorityService from '../services/ai/priority.service.js'
import draftService from '../services/ai/draft.service.js'
import ticketsService from '../services/tickets.service.js'
import booksService from '../services/books.service.js'
import { successResponse } from '../utils/apiResponse.js'

const classify = async (req, res, next) => {
  try {
    const { ticketId } = req.params
    const ticket = await ticketsService.getTicketById(ticketId)
    const result = await classifyService.classify({
      subject:     ticket.subject,
      description: ticket.description
    })
    await ticketsService.updateAIFields(ticketId, { ai_category: result.category })
    return successResponse(res, result, 'Ticket classified')
  } catch (err) {
    next(err)
  }
}

const priority = async (req, res, next) => {
  try {
    const { ticketId } = req.params
    const ticket = await ticketsService.getTicketById(ticketId)
    const result = await priorityService.score({
      subject:     ticket.subject,
      description: ticket.description
    })
    await ticketsService.updateAIFields(ticketId, { ai_priority: result.priority })
    return successResponse(res, result, 'Priority scored')
  } catch (err) {
    next(err)
  }
}

const draft = async (req, res, next) => {
  try {
    const { ticketId } = req.params
    const ticket = await ticketsService.getTicketById(ticketId)

    let bookData = null
    if (ticket.book_id) {
      bookData = await booksService.getBookById(ticket.book_id)
    }

    const result = await draftService.generate({
      subject:     ticket.subject,
      description: ticket.description,
      category:    ticket.admin_category || ticket.ai_category,
      bookData
    })

    await ticketsService.updateAIFields(ticketId, {
      ai_draft:  result.draft,
      ai_source: result.source
    })

    return successResponse(res, result, 'Draft generated')
  } catch (err) {
    next(err)
  }
}

const processTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params
    const ticket = await ticketsService.getTicketById(ticketId)

    let bookData = null
    if (ticket.book_id) {
      bookData = await booksService.getBookById(ticket.book_id)
    }

    const [classifyResult, priorityResult] = await Promise.allSettled([
      classifyService.classify({
        subject:     ticket.subject,
        description: ticket.description
      }),
      priorityService.score({
        subject:     ticket.subject,
        description: ticket.description
      })
    ])

    const category = classifyResult.status === 'fulfilled'
      ? classifyResult.value.category : 'General Inquiry'

    const priorityLevel = priorityResult.status === 'fulfilled'
      ? priorityResult.value.priority : 'medium'

    const draftResult = await draftService.generate({
      subject:     ticket.subject,
      description: ticket.description,
      category,
      bookData
    })

    await ticketsService.updateAIFields(ticketId, {
      ai_category: category,
      ai_priority: priorityLevel,
      ai_draft:    draftResult.draft,
      ai_source:   draftResult.source
    })

    return successResponse(res, {
      category,
      priority: priorityLevel,
      draft:    draftResult.draft,
      source:   draftResult.source
    }, 'Ticket processed by AI')

  } catch (err) {
    next(err)
  }
}

export default { classify, priority, draft, processTicket }