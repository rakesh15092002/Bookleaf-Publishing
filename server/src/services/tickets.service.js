import ticketRepository from '../repositories/ticket.repository.js';
import bookRepository from '../repositories/book.repository.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';
import classifyService from './ai/classify.service.js';
import priorityService from './ai/priority.service.js';
import draftService from './ai/draft.service.js';

const createTicket = async (ticketData) => {
  const { author_id, author_name, author_city, subject, description, book_id } = ticketData;

  // 1. Book Access Validation
  // Ensure the book exists and actually belongs to the requesting author
  if (book_id) {
    const book = await bookRepository.findById(book_id);
    if (!book) throw new AppError('Book not found', 404);
    if (book.author_id !== author_id) {
      throw new AppError('Access denied — this book does not belong to you', 403);
    }
  }

  
  const ticket = await ticketRepository.create({
    author_id,
    book_id: book_id || null,
    subject,
    description,
    status: 'open',
    ai_category: 'General Inquiry', // Change from 'Processing...'
    ai_priority: 'medium',          // MUST be one of: 'critical', 'high', 'medium', 'low'
    ai_draft: null,
    ai_source: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  logger.info(`Ticket created, starting background AI processing`, { ticketId: ticket.id });

  // 3. Background AI Processing (Asynchronous)
  // This self-invoking function runs independently, preventing UI freezes
  (async () => {
    try {
      // Execute classification and priority scoring in parallel to save time
      const [aiCategory, aiPriority] = await Promise.allSettled([
        classifyService.classify({ subject, description }),
        priorityService.score({ subject, description })
      ]);

      // Handle individual AI service failures gracefully
      const category = aiCategory.status === 'fulfilled' ? aiCategory.value.category : 'General Inquiry';
      const priority = aiPriority.status === 'fulfilled' ? aiPriority.value.priority : 'medium';

      // Fetch specific book data to provide context to the AI draft generator
      const bookData = book_id ? await bookRepository.findById(book_id) : null;

      // Generate the response draft
      const draftResult = await draftService.generate({
        subject,
        description,
        category,
        bookData,
        author_name,  // Passed to ensure personalized greeting (e.g., "Dear Priya,")
        author_city
      });

      // Update the previously created ticket with the final AI results
      await ticketRepository.update(ticket.id, {
        ai_category: category,
        ai_priority: priority,
        ai_draft: draftResult.draft,
        ai_source: draftResult.source,
        updated_at: new Date().toISOString()
      });

      logger.info('Background AI processing completed', { ticketId: ticket.id, category, priority });
    } catch (aiError) {
      // Graceful degradation: Log error but do not crash. 
      // The ticket remains in the 'open' status for the manual admin queue.
      logger.error(`AI Processing failed for ticket ${ticket.id}`, aiError.message);
      await ticketRepository.update(ticket.id, {
        ai_category: 'General Inquiry',
        ai_priority: 'medium',
        ai_source: 'manual',
        updated_at: new Date().toISOString()
      });
    }
  })();

  // Return the newly created ticket instantly to the frontend client
  return ticket;
};

const getTicketsByAuthor = async (authorId, filters = {}) => {
  return await ticketRepository.findByAuthorId(authorId, filters);
};

const getTicketById = async (ticketId) => {
  const ticket = await ticketRepository.findById(ticketId);
  if (!ticket) throw new AppError('Ticket not found', 404);
  return ticket;
};

const getAllTickets = async (filters = {}) => {
  return await ticketRepository.findAll(filters);
};

// --- Admin & Audit Trail Methods ---

const updateStatus = async (ticketId, status) => {
  const ticket = await ticketRepository.findById(ticketId);
  if (!ticket) throw new AppError('Ticket not found', 404);

  const updated = await ticketRepository.update(ticketId, { status, updated_at: new Date().toISOString() });
  logger.info(`Ticket ${ticketId} status updated to ${status}`);
  return updated;
};

const assignTicket = async (ticketId, adminId) => {
  const ticket = await ticketRepository.findById(ticketId);
  if (!ticket) throw new AppError('Ticket not found', 404);

  const updated = await ticketRepository.update(ticketId, { assigned_to: adminId, updated_at: new Date().toISOString() });
  logger.info(`Ticket ${ticketId} assigned to Admin ${adminId}`);
  return updated;
};

const updateCategory = async (ticketId, category) => {
  const ticket = await ticketRepository.findById(ticketId);
  if (!ticket) throw new AppError('Ticket not found', 404);

  const updated = await ticketRepository.update(ticketId, { admin_category: category, updated_at: new Date().toISOString() });
  logger.info(`Ticket ${ticketId} category overridden to ${category}`);
  return updated;
};

const updatePriority = async (ticketId, priority) => {
  const ticket = await ticketRepository.findById(ticketId);
  if (!ticket) throw new AppError('Ticket not found', 404);

  const updated = await ticketRepository.update(ticketId, { admin_priority: priority, updated_at: new Date().toISOString() });
  logger.info(`Ticket ${ticketId} priority overridden to ${priority}`);
  return updated;
};

const updateAIFields = async (ticketId, aiData) => {
  const ticket = await ticketRepository.findById(ticketId);
  if (!ticket) throw new AppError('Ticket not found', 404);

  const updatedData = { ...aiData, updated_at: new Date().toISOString() };
  return await ticketRepository.update(ticketId, updatedData);
};

export default {
  createTicket,
  getTicketsByAuthor,
  getTicketById,
  getAllTickets,
  updateStatus,
  assignTicket,
  updateCategory,
  updatePriority,
  updateAIFields
};