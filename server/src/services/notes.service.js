import noteRepository from '../repositories/note.repository.js';
import ticketRepository from '../repositories/ticket.repository.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

const addNote = async (noteData) => {
  const { ticket_id, content, created_by } = noteData;

  const ticket = await ticketRepository.findById(ticket_id);
  if (!ticket) throw new AppError('Ticket not found', 404);

  const note = await noteRepository.create({
    ticket_id,
    admin_id: created_by,
    content,
    created_at: new Date().toISOString()
  });

  logger.info('Internal note created', { ticketId: ticket_id, adminId: created_by });
  return note;
};

const getNotes = async (ticketId) => {
  const ticket = await ticketRepository.findById(ticketId);
  if (!ticket) throw new AppError('Ticket not found', 404);

  const notes = await noteRepository.findByTicketId(ticketId);
  return notes || [];
};

const deleteNote = async (noteId) => {
  await noteRepository.delete(noteId);
  logger.info('Note deleted', { noteId });
};

export default { addNote, getNotes, deleteNote };