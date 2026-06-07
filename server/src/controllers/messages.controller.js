import messagesService from '../services/messages.service.js'
import { successResponse, createdResponse } from '../utils/apiResponse.js'

const getMessages = async (req, res, next) => {
  try {
    const { ticketId } = req.params
    // Extracting role and author_id from the authenticated user object
    const { role, author_id } = req.user 
    
    // Passing all three required arguments to the service
    const messages = await messagesService.getMessages(ticketId, role, author_id)
    return successResponse(res, messages, 'Messages fetched')
  } catch (err) {
    next(err)
  }
}

const sendMessage = async (req, res, next) => {
  try {
    const { ticketId } = req.params
    const { content, is_internal } = req.body
    const { id: sender_id, role: sender_role, author_id } = req.user

    const message = await messagesService.sendMessage({
      ticket_id: ticketId,
      content,
      sender_id,
      sender_role,
      author_id,
      is_internal: is_internal || false
    });

    return createdResponse(res, message, 'Message sent');
  } catch (err) {
    next(err);
  }
};

export default { getMessages, sendMessage }