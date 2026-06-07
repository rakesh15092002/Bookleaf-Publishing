import messageRepository from '../repositories/message.repository.js';
import ticketRepository from '../repositories/ticket.repository.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

const sendMessage = async (messageData) => {
  const {
    ticket_id,
    sender_id,    // UUID
    sender_role,
    author_id,    // AUTH001
    content,
    is_internal
  } = messageData;

  const ticket = await ticketRepository.findById(ticket_id);
  if (!ticket) throw new AppError('Ticket not found', 404);

  // Author role data isolation check
  if (sender_role === 'author') {
    if (ticket.author_id !== author_id) {
      throw new AppError('Access denied — This ticket belongs to another account.', 403);
    }
    if (is_internal === true) {
      throw new AppError('Security violation — Authors cannot log internal notes.', 403);
    }
  }

  if (ticket.status === 'closed') {
    throw new AppError('Cannot send message on a closed ticket', 400);
  }

  const message = await messageRepository.create({
    ticket_id,
    sender_id,    // UUID Column
    sender_role,
    content,
    is_internal: is_internal || false,
    created_at: new Date().toISOString()
  });

  if (sender_role === 'admin' && ticket.status === 'open') {
    await ticketRepository.update(ticket_id, { status: 'in_progress' });
  }

  logger.info('Message created and synced successfully', { ticketId: ticket_id, role: sender_role });
  return message;
};

const getMessages = async (ticketId, role, author_id) => {
  const ticket = await ticketRepository.findById(ticketId);
  if (!ticket) throw new AppError('Ticket not found', 404);

  // Cross-tenant data inspection defense gate
  if (role === 'author' && ticket.author_id !== author_id) {
    throw new AppError('Access denied — You do not own this ticket scope.', 403);
  }

  const isAdmin = role === 'admin';
  const messages = await messageRepository.findByTicketId(ticketId, isAdmin);
  return messages || [];
};

export default {
  sendMessage,
  getMessages
};