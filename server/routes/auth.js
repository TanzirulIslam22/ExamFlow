import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import Institute from '../models/Institute.js';
import Student from '../models/Student.js';
import { signToken } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/error.js';
import { verifyFirebaseToken, normalizePhone } from '../utils/firebase.js';

const router = Router();

function stripInstitute(inst) {
  const { passwordHash, ...rest } = inst.toObject ? inst.toObject({ getters: true }) : inst;
  return rest;
}

async function findStudent(role, query) {
  if (role !== 'student') return null;
  const student = await Student.findOne(query)
    .select('-passwordHash')
    .populate('batch')
    .populate('institute', 'name logo city');
  if (!student) return null;
  if (student.status !== 'active') throw new ApiError(403, 'Your account is inactive. Contact your institute.');
  return student;
}

router.post(
  '/firebase/google',
  asyncHandler(async (req, res) => {
    const { role, idToken } = req.body;
    if (!idToken) throw new ApiError(400, 'Missing Firebase token');

    const decoded = await verifyFirebaseToken(idToken);
    const email = (decoded.email || '').toLowerCase();
    if (!email) throw new ApiError(400, 'No email address on this Google account');

    if (role === 'institute') {
      const institute = await Institute.findOne({ email }).select('-passwordHash');
      if (!institute)
        throw new ApiError(404, 'No institute account found with this email. Please register first.');
      const token = signToken({ id: institute._id, role: 'institute' });
      return res.json({ success: true, token, user: { role: 'institute', ...stripInstitute(institute) } });
    }

    const student = await findStudent(role, { email });
    if (!student)
      throw new ApiError(404, 'No student account found with this email. Ask your institute to add you first.');
    const token = signToken({ id: student._id, role: 'student' });
    res.json({ success: true, token, user: { role: 'student', ...stripInstitute(student) } });
  })
);

router.post(
  '/firebase/phone',
  asyncHandler(async (req, res) => {
    const { role, idToken } = req.body;
    if (!idToken) throw new ApiError(400, 'Missing Firebase token');

    const decoded = await verifyFirebaseToken(idToken);
    if (!decoded.phone_number) throw new ApiError(400, 'No phone number on this Firebase account');
    const phone = normalizePhone(decoded.phone_number);
    if (!phone) throw new ApiError(400, 'Invalid phone number');

    if (role === 'institute') {
      const institute = await Institute.findOne({ phone: { $regex: `${phone.replace(/^0/, '')}$` } }).select('-passwordHash');
      if (!institute) throw new ApiError(404, 'No institute account found with this phone number.');
      const token = signToken({ id: institute._id, role: 'institute' });
      return res.json({ success: true, token, user: { role: 'institute', ...stripInstitute(institute) } });
    }

    const student = await findStudent(role, { phone: { $regex: `${phone.replace(/^0/, '')}$` } });
    if (!student) throw new ApiError(404, 'No student account found with this phone number.');
    const token = signToken({ id: student._id, role: 'student' });
    res.json({ success: true, token, user: { role: 'student', ...stripInstitute(student) } });
  })
);

router.post(
  '/institute/register',
  asyncHandler(async (req, res) => {
    const {
      name, type, ownerName, email, phone, city, password, confirmPassword, logo,
    } = req.body;

    if (!name || !type || !ownerName || !email || !phone || !city || !password)
      throw new ApiError(400, 'All required fields must be filled');
    if (!['School', 'College', 'Coaching Center', 'Corporate'].includes(type))
      throw new ApiError(400, 'Invalid institute type');
    if (password.length < 6) throw new ApiError(400, 'Password must be at least 6 characters');
    if (password !== confirmPassword) throw new ApiError(400, 'Passwords do not match');

    const exists = await Institute.findOne({ email: email.toLowerCase() });
    if (exists) throw new ApiError(400, 'An institute with this email already exists');

    const institute = await Institute.create({
      name, type, ownerName, email: email.toLowerCase(), phone, city,
      logo: logo || '',
      passwordHash: password,
    });

    const token = signToken({ id: institute._id, role: 'institute' });
    const { passwordHash, ...safe } = institute.toObject({ getters: true });
    res.status(201).json({
      success: true,
      token,
      user: { role: 'institute', ...safe },
    });
  })
);

router.post(
  '/institute/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) throw new ApiError(400, 'Email and password are required');

    const institute = await Institute.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!institute || !(await institute.matchPassword(password)))
      throw new ApiError(401, 'Invalid email or password');

    const token = signToken({ id: institute._id, role: 'institute' });
    const { passwordHash, ...safe } = institute.toObject({ getters: true });
    res.json({
      success: true,
      token,
      user: { role: 'institute', ...safe },
    });
  })
);

router.post(
  '/student/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) throw new ApiError(400, 'Email and password are required');

    const student = await Student.findOne({ email: email.toLowerCase() })
      .select('+passwordHash')
      .populate('batch')
      .populate('institute', 'name logo city');
    if (!student) throw new ApiError(401, 'Invalid email or password');
    if (!(await student.matchPassword(password)))
      throw new ApiError(401, 'Invalid email or password');
    if (student.status !== 'active')
      throw new ApiError(403, 'Your account is inactive. Contact your institute.');

    const token = signToken({ id: student._id, role: 'student' });
    const { passwordHash, ...safeStudent } = student.toObject({ getters: true });
    res.json({
      success: true,
      token,
      user: { role: 'student', ...safeStudent },
    });
  })
);

router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const token = (req.headers.authorization || '').startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null;
    if (!token) throw new ApiError(401, 'Not authorized');

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch {
      throw new ApiError(401, 'Not authorized');
    }

    if (decoded.role === 'institute') {
      const institute = await Institute.findById(decoded.id).select('-passwordHash');
      if (!institute) throw new ApiError(401, 'Not authorized');
      return res.json({ success: true, user: { role: 'institute', ...institute.toObject() } });
    }
    if (decoded.role === 'student') {
      const student = await Student.findById(decoded.id).select('-passwordHash')
        .populate('batch').populate('institute', 'name logo city');
      if (!student) throw new ApiError(401, 'Not authorized');
      return res.json({ success: true, user: { role: 'student', ...student.toObject() } });
    }
    throw new ApiError(401, 'Not authorized');
  })
);

export default router;
