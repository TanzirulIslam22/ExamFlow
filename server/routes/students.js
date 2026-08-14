import { Router } from 'express';
import Student from '../models/Student.js';
import Attempt from '../models/Attempt.js';
import { protectInstitute } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/error.js';
import { pickAvatarColor } from '../utils/helpers.js';

const router = Router();
router.use(protectInstitute);

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((r) => r.trim() !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((r) => r.trim() !== '')) rows.push(row);
  return rows;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { search, batch, status, page = 1, limit = 20 } = req.query;
    const query = { institute: req.institute._id };
    if (batch) query.batch = batch;
    if (status) query.status = status;
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ name: re }, { email: re }, { studentId: re }, { phone: re }];
    }

    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .populate('batch', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    res.json({ success: true, students, total, page: Number(page), limit: Number(limit) });
  })
);

router.get(
  '/all',
  asyncHandler(async (req, res) => {
    const students = await Student.find({ institute: req.institute._id })
      .populate('batch', 'name')
      .sort({ name: 1 })
      .lean();
    res.json({ success: true, students });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, studentId, email, phone, batch, password } = req.body;
    if (!name || !email || !password) throw new ApiError(400, 'Name, email and password are required');

    const exists = await Student.findOne({ institute: req.institute._id, email: email.toLowerCase() });
    if (exists) throw new ApiError(400, 'A student with this email already exists');

    const student = await Student.create({
      institute: req.institute._id,
      name, studentId: studentId || '', email: email.toLowerCase(), phone: phone || '',
      passwordHash: password,
      batch: batch || null,
      avatarColor: pickAvatarColor(email),
    });

    res.status(201).json({ success: true, student: await student.populate('batch', 'name') });
  })
);

router.post(
  '/import',
  asyncHandler(async (req, res) => {
    const { csv } = req.body;
    if (!csv) throw new ApiError(400, 'CSV content required');

    const rows = parseCSV(csv);
    if (rows.length < 2) throw new ApiError(400, 'CSV must include a header row and at least one student');

    const header = rows[0].map((h) => h.trim().toLowerCase());
    const idx = {
      name: header.indexOf('name'),
      email: header.indexOf('email'),
      studentId: header.indexOf('studentid') !== -1 ? header.indexOf('studentid') : header.indexOf('id'),
      phone: header.indexOf('phone'),
      password: header.indexOf('password'),
      batch: header.indexOf('batch'),
    };
    if (idx.name === -1 || idx.email === -1)
      throw new ApiError(400, 'CSV must have at least "name" and "email" columns');

    let created = 0;
    let skipped = 0;
    const errors = [];

    for (const row of rows.slice(1)) {
      const name = (row[idx.name] || '').trim();
      const email = (row[idx.email] || '').trim().toLowerCase();
      if (!name || !email) { skipped++; continue; }
      try {
        const exists = await Student.findOne({ institute: req.institute._id, email });
        if (exists) { skipped++; continue; }
        await Student.create({
          institute: req.institute._id,
          name,
          email,
          phone: idx.phone !== -1 ? (row[idx.phone] || '').trim() : '',
          studentId: idx.studentId !== -1 ? (row[idx.studentId] || '').trim() : '',
          passwordHash: idx.password !== -1 && row[idx.password] ? (row[idx.password] || '').trim() : 'Exam@123',
          batch: null,
          avatarColor: pickAvatarColor(email),
        });
        created++;
      } catch {
        skipped++;
        errors.push(email || 'unknown');
      }
    }

    res.json({ success: true, created, skipped, errors: errors.slice(0, 20) });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const student = await Student.findOne({
      _id: req.params.id,
      institute: req.institute._id,
    }).populate('batch', 'name');
    if (!student) throw new ApiError(404, 'Student not found');
    const attempts = await Attempt.find({ student: student._id, status: 'submitted' })
      .populate('exam', 'title subject')
      .sort({ submittedAt: -1 })
      .lean();
    res.json({ success: true, student, attempts });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { name, studentId, email, phone, batch, password, status } = req.body;
    const student = await Student.findOne({ _id: req.params.id, institute: req.institute._id });
    if (!student) throw new ApiError(404, 'Student not found');

    if (email && email.toLowerCase() !== student.email) {
      const exists = await Student.findOne({ institute: req.institute._id, email: email.toLowerCase() });
      if (exists) throw new ApiError(400, 'A student with this email already exists');
      student.email = email.toLowerCase();
    }
    if (name) student.name = name;
    if (studentId !== undefined) student.studentId = studentId;
    if (phone !== undefined) student.phone = phone;
    if (batch !== undefined) student.batch = batch || null;
    if (status) student.status = status;
    if (password) student.passwordHash = password;

    await student.save();
    res.json({ success: true, student: await student.populate('batch', 'name') });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const student = await Student.findOneAndDelete({
      _id: req.params.id,
      institute: req.institute._id,
    });
    if (!student) throw new ApiError(404, 'Student not found');
    await Attempt.deleteMany({ student: student._id });
    res.json({ success: true, message: 'Student deleted' });
  })
);

router.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) throw new ApiError(400, 'Invalid status');
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, institute: req.institute._id },
      { status },
      { new: true }
    ).populate('batch', 'name');
    if (!student) throw new ApiError(404, 'Student not found');
    res.json({ success: true, student });
  })
);

export default router;
