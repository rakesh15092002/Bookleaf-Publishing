// src/routes/ai.routes.js
import { Router } from 'express'
import aiController from '../controllers/ai.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { roleMiddleware } from '../middleware/role.middleware.js'

const router = Router()

// All routes — Admin only
router.use(authMiddleware)
router.use(roleMiddleware('admin'))

router.post('/classify/:ticketId',  aiController.classify)
router.post('/priority/:ticketId',  aiController.priority)
router.post('/draft/:ticketId',     aiController.draft)
router.post('/process/:ticketId',   aiController.processTicket)

export default router