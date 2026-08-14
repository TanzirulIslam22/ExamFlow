import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import Institute from '../models/Institute.js';
import Student from '../models/Student.js';
import { ApiError } from './error.js';

export const signToken = (payload) =>
  jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

export const protectInstitute = async (req, res, next) => {
  const token = (req.headers.authorization || '').startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
  if (!token) return next(new ApiError(401, 'Not authorized, no token'));

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (decoded.role !== 'institute') throw new ApiError(401, 'Institute token required');
    const institute = await Institute.findById(decoded.id).select('-passwordHash');
    if (!institute) throw new ApiError(401, 'Institute not found');
    req.institute = institute;
    next();
  } catch (e) {
    next(new ApiError(401, e.name === 'TokenExpiredError' ? 'Session expired, please login' : 'Not authorized'));
  }
};

export const protectStudent = async (req, res, next) => {
  const token = (req.headers.authorization || '').startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
  if (!token) return next(new ApiError(401, 'Not authorized, no token'));

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (decoded.role !== 'student') throw new ApiError(401, 'Student token required');
    const student = await Student.findById(decoded.id).select('-passwordHash').populate('batch');
    if (!student) throw new ApiError(401, 'Student not found');
    req.student = student;
    next();
  } catch (e) {
    next(new ApiError(401, e.name === 'TokenExpiredError' ? 'Session expired, please login' : 'Not authorized'));
  }
};
