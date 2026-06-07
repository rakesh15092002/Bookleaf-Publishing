import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userRepository from '../repositories/user.repository.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

const login = async (email, password) => {
  const user = await userRepository.findByEmail(email);
  if (!user) throw new AppError('Invalid email or password', 401);

  // ✅ password_hash use karo (DB column naam)
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) throw new AppError('Invalid email or password', 401);

  const token = jwt.sign(
    {
      id:        user.id,          // UUID
      email:     user.email,
      role:      user.role,
      author_id: user.author_id || null,  // AUTH001
      name:      user.name         // ✅ name add karo
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  logger.info('User logged in', { email, role: user.role });

  return {
    token,
    user: {
      id:        user.id,
      name:      user.name,
      email:     user.email,
      role:      user.role,
      author_id: user.author_id
    }
  };
};

const getMe = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  return {
    id:        user.id,
    name:      user.name,
    email:     user.email,
    role:      user.role,
    author_id: user.author_id
  };
};

const register = async (userData) => {
  const { name, email, password, city, phone } = userData;

  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) throw new AppError('Email already registered', 400);

  // ✅ password_hash column mein save karo
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await userRepository.create({
    name,
    email,
    password_hash: hashedPassword,  // ✅ fix
    city:  city  || null,
    phone: phone || null,
    role: 'author'
  });

  logger.info('User registered', { email, name });

  return {
    id:    user.id,
    name:  user.name,
    email: user.email,
    role:  user.role
  };
};

const changePassword = async (passwordData) => {
  const { userId, currentPassword, newPassword } = passwordData;

  const user = await userRepository.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  // ✅ password_hash use karo
  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch) throw new AppError('Current password is incorrect', 401);

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // ✅ password_hash update karo
  await userRepository.update(userId, { password_hash: hashedPassword });

  logger.info('Password changed', { userId });
};

export default { login, getMe, register, changePassword };