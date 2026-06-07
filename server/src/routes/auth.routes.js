// src/routes/auth.routes.js
import { Router } from 'express'
import authController from '../controllers/auth.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import { 
  loginValidator, 
  registerValidator,
  changePasswordValidator 
} from '../validators/auth.validator.js'

const router = Router()

// Public routes
// router.post('/register', registerValidator, validate, authController.register)
router.post('/login',    loginValidator,    validate, authController.login)

// Protected routes
router.get('/me',              authMiddleware, authController.me)
// router.post('/change-password', authMiddleware, changePasswordValidator, validate, authController.changePassword)

export default router