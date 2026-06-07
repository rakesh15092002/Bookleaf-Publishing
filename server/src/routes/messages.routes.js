// src/routes/messages.routes.js
import { Router } from 'express'
import messagesController from '../controllers/messages.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import { createMessageValidator } from '../validators/message.validator.js'

const router = Router({ mergeParams: true })

// All routes protected
router.use(authMiddleware)

router.get('/',   messagesController.getMessages)
router.post('/',  createMessageValidator, validate, messagesController.sendMessage)

export default router