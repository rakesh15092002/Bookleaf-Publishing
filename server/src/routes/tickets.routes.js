// src/routes/tickets.routes.js

import { Router } from 'express';
import ticketsController from '../controllers/tickets.controller.js';
import messagesRoutes from './messages.routes.js';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { roleMiddleware } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createTicketValidator } from '../validators/ticket.validator.js';

const router = Router();

// All routes protected
router.use(authMiddleware);

// Nested routes
router.use('/:ticketId/messages', messagesRoutes);

// Author + Admin
router.get('/', ticketsController.getTickets);
router.get('/:id', ticketsController.getTicketById);
router.post(
  '/',
  createTicketValidator,
  validate,
  ticketsController.createTicket
);

// Admin only
router.patch(
  '/:id/status',
  roleMiddleware('admin'),
  ticketsController.updateStatus
);

router.patch(
  '/:id/assign',
  roleMiddleware('admin'),
  ticketsController.assignTicket
);

router.patch(
  '/:id/category',
  roleMiddleware('admin'),
  ticketsController.updateCategory
);

router.patch(
  '/:id/priority',
  roleMiddleware('admin'),
  ticketsController.updatePriority
);

export default router;