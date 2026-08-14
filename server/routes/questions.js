import { Router } from 'express';
import Question from '../models/Question.js';
import { protectInstitute } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/error.js';

const router = Router();
router.use(protectInstitute);

function sanitizeBody(body) {
  const { type, question, options, correctAnswer, difficulty, subject, topic, tags, marks } = body;
  return {
    type, question, options, correctAnswer, difficulty, subject, topic, tags, marks,
  };
}

function validate(data) {
  if (!data.question || !data.question.trim()) throw new ApiError(400, 'Question text is required');
  if (!['MCQ', 'TF', 'SA'].includes(data.type)) throw new ApiError(400, 'Invalid question type');

  if (data.type === 'MCQ') {
    if (!Array.isArray(data.options) || data.options.filter((o) => o.text.trim()).length < 2)
      throw new ApiError(400, 'MCQ needs at least 2 options');
    const marked = data.options.filter((o) => o.isCorrect);
    if (marked.length !== 1) throw new ApiError(400, 'Mark exactly one correct option');
  }
  if (data.type === 'TF') {
    if (!['true', 'false'].includes(String(data.correctAnswer).toLowerCase()))
      throw new ApiError(400, 'True/False needs a correct answer');
  }
  if (data.type === 'SA' && !data.correctAnswer?.trim())
    throw new ApiError(400, 'Short answer needs a correct answer');
  if (!['easy', 'medium', 'hard'].includes(data.difficulty))
    throw new ApiError(400, 'Invalid difficulty');
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { search, subject, difficulty, type } = req.query;
    const query = { institute: req.institute._id };
    if (subject) query.subject = subject;
    if (difficulty) query.difficulty = difficulty;
    if (type) query.type = type;
    if (search) {
      query.$or = [{ question: new RegExp(search, 'i') }, { topic: new RegExp(search, 'i') }];
    }
    const questions = await Question.find(query)
      .sort({ updatedAt: -1 })
      .limit(Number(req.query.limit) || 300)
      .lean();
    res.json({ success: true, questions, total: questions.length });
  })
);

router.get(
  '/meta',
  asyncHandler(async (req, res) => {
    const subjects = await Question.distinct('subject', { institute: req.institute._id, subject: { $ne: '' } });
    res.json({ success: true, subjects: subjects.sort() });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = sanitizeBody(req.body);
    validate(data);
    const question = await Question.create({ ...data, institute: req.institute._id });
    res.status(201).json({ success: true, question });
  })
);

router.post(
  '/:id/duplicate',
  asyncHandler(async (req, res) => {
    const src = await Question.findOne({ _id: req.params.id, institute: req.institute._id });
    if (!src) throw new ApiError(404, 'Question not found');
    const copy = await Question.create({
      ...src.toObject(),
      _id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      question: `${src.question} (copy)`,
    });
    res.status(201).json({ success: true, question: copy });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = sanitizeBody(req.body);
    validate(data);
    const question = await Question.findOneAndUpdate(
      { _id: req.params.id, institute: req.institute._id },
      { $set: data },
      { new: true }
    );
    if (!question) throw new ApiError(404, 'Question not found');
    res.json({ success: true, question });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const question = await Question.findOneAndDelete({
      _id: req.params.id,
      institute: req.institute._id,
    });
    if (!question) throw new ApiError(404, 'Question not found');
    res.json({ success: true, message: 'Question deleted' });
  })
);

export default router;
