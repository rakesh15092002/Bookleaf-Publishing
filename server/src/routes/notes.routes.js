// src/routes/notes.routes.js
import { Router } from 'express'
import notesController from '../controllers/notes.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { roleMiddleware } from '../middleware/role.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import { createNoteValidator } from '../validators/note.validator.js'

const router = Router({ mergeParams: true })

// All routes — Admin only
router.use(authMiddleware)
router.use(roleMiddleware('admin'))

router.get('/',         notesController.getNotes)
router.post('/',        createNoteValidator, validate, notesController.addNote)
router.delete('/:noteId', notesController.deleteNote)

export default router