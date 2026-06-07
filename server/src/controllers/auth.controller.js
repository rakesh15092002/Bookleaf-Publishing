import authService from '../services/auth.service.js';
import { successResponse } from '../utils/apiResponse.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

/**
 * Handles user authentication.
 * Verifies credentials against the database and returns a JWT token.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate request body to ensure email and password are provided
    if (!email || !password) {
      return next(new AppError('Email and password are required', 400));
    }

    // Call authentication service to verify user and generate a token
    const result = await authService.login(email, password);
    
    // Log the successful login for audit/tracking purposes
    logger.info(`User logged in: ${email}`);

    return successResponse(res, result, 'Login successful');
  } catch (err) {
    // Forward any authentication errors (e.g., invalid credentials) to the error middleware
    next(err);
  }
};

/**
 * Retrieves the profile of the currently authenticated user.
 * Relies on the authMiddleware to populate req.user.
 */
const me = async (req, res, next) => {
  try {
    // Fetch user details using the ID decoded from the JWT token
    const user = await authService.getMe(req.user.id);
    return successResponse(res, user, 'User details fetched');
  } catch (err) {
    next(err);
  }
};

export default { login, me };