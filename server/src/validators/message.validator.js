import { body } from 'express-validator';

const createMessageValidator = [
  body('content')
    .trim()
    .notEmpty().withMessage('Message content is required')
    .isLength({ min: 1, max: 2000 }).withMessage('Message must be between 1 and 2000 characters'),

  body('is_internal')
    .optional()
    .isBoolean().withMessage('is_internal must be boolean')
];

export { createMessageValidator };