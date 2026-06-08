import { Router } from 'express';
import authorController from '../controllers/author.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { roleMiddleware } from '../middleware/role.middleware.js';

const router = Router();

// Apply authentication to all routes in this file
router.use(authMiddleware);

// Only administrators are permitted to view the Author Registry
router.use(roleMiddleware('admin'));

// Route to get a list of all registered authors
router.get('/', authorController.getAllAuthors);

// Route to get details of a specific author by their ID
router.get('/:id', authorController.getAuthorById);

export default router;