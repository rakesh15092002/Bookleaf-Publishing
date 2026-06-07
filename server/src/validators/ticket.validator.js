import { body } from 'express-validator';

const createTicketValidator = [
  body('subject')
    .trim()
    .notEmpty().withMessage('Subject is required')
    .isLength({ max: 200 }).withMessage('Subject max 200 characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),

  body('book_id')
    .optional()
    .isString().withMessage('Book ID must be a string')
];

const updateTicketValidator = [
  body('status')
    .optional()
    .isIn(['open', 'in_progress', 'resolved', 'closed'])
    .withMessage('Invalid status value'),

  body('admin_category')
    .optional()
    .isIn([
      'Royalty & Payments',
      'ISBN & Metadata Issues',
      'Printing & Quality',
      'Distribution & Availability',
      'Book Status & Production Updates',
      'General Inquiry'
    ]).withMessage('Invalid category'),

  body('admin_priority')
    .optional()
    .isIn(['critical', 'high', 'medium', 'low'])
    .withMessage('Invalid priority value')
];

export { createTicketValidator, updateTicketValidator };