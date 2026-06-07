import AppError from '../utils/AppError.js';

const roleMiddleware = (requiredRole) => {
  return (req, res, next) => {
    if (req.user.role !== requiredRole) {
      return next(new AppError(`Access denied — ${requiredRole}s only`, 403));
    }
    next();
  };
};

export { roleMiddleware };