import notesService from '../services/notes.service.js'
import { successResponse, createdResponse } from '../utils/apiResponse.js'

const getNotes = async (req, res, next) => {
  try {
    const { ticketId } = req.params
    const notes = await notesService.getNotes(ticketId)
    return successResponse(res, notes, 'Notes fetched')
  } catch (err) {
    next(err)
  }
}

const addNote = async (req, res, next) => {
  try {
    const { ticketId } = req.params
    const { content } = req.body
    const { id: created_by } = req.user
    const note = await notesService.addNote({
      ticket_id: ticketId,
      content,
      created_by
    })
    return createdResponse(res, note, 'Note added')
  } catch (err) {
    next(err)
  }
}

const deleteNote = async (req, res, next) => {
  try {
    const { noteId } = req.params
    await notesService.deleteNote(noteId)
    return successResponse(res, null, 'Note deleted')
  } catch (err) {
    next(err)
  }
}

export default { getNotes, addNote, deleteNote }