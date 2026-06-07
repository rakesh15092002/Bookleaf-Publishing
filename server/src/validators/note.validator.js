import { body } from 'express-validator';

const createNoteValidator = [
  body('content')
    .trim()
    .notEmpty().withMessage('Note content is required')
    .isLength({ min: 1, max: 1000 }).withMessage('Note must be between 1 and 1000 characters')
];

export { createNoteValidator };