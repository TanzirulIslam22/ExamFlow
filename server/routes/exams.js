import { Router } from 'express';
import Exam from '../models/Exam.js';
import Question from '../models/Question.js';
import Attempt from '../models/Attempt.js';
import { protectInstitute } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/error.js';

const router = Router();
router.use(protectInstitute);

function computeStatus(exam) {
  const now = new Date();
  if (exam.status === 'draft') return 'draft';
  if (exam.endAt && exam.endAt < now) return 'completed';
  return 'live';
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status, search } = req.query;
    const query = { institute: req.institute._id };
    if (status) query.status = status;
    if (search) query.title = new RegExp(search, 'i');

    const exams = await Exam.find(query)
      .populate('batch', 'name')
      .sort({ updatedAt: -1 })
      .lean();

    const withMeta = await Promise.all(
      exams.map(async (exam) => {
        const agg = await Attempt.aggregate([
          { $match: { exam: exam._id, status: 'submitted' } },
          { $group: { _id: null, n: { $sum: 1 }, passed: { $sum: { $cond: ['$passed', 1, 0] } } } },
        ]);
        return {
          ...exam,
          computedStatus: computeStatus(exam),
          attempts: agg[0]?.n || 0,
          passCount: agg[0]?.passed || 0,
          questionCount: exam.questions?.length || 0,
        };
      })
    );

    res.json({ success: true, exams: withMeta });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const exam = await Exam.findOne({ _id: req.params.id, institute: req.institute._id })
      .populate('batch', 'name');
    if (!exam) throw new ApiError(404, 'Exam not found');
    res.json({ success: true, exam });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const {
      title, subject, description, duration, startAt, endAt, passMark, maxAttempts,
      randomize, accessType, batch, showResults,
    } = req.body;
    if (!title) throw new ApiError(400, 'Exam title is required');

    const exam = await Exam.create({
      institute: req.institute._id,
      title, subject: subject || '', description: description || '',
      duration: Number(duration) || 30,
      startAt: startAt || null,
      endAt: endAt || null,
      passMark: Number(passMark) || 40,
      maxAttempts: Number(maxAttempts) || 1,
      randomize: Boolean(randomize),
      accessType: accessType || 'open',
      batch: accessType === 'batch' ? batch || null : null,
      showResults: showResults || 'immediate',
      status: 'draft',
      questions: [],
    });
    res.status(201).json({ success: true, exam });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const exam = await Exam.findOne({ _id: req.params.id, institute: req.institute._id });
    if (!exam) throw new ApiError(404, 'Exam not found');
    if (exam.status !== 'draft') throw new ApiError(400, 'Only draft exams can be edited');

    const {
      title, subject, description, duration, startAt, endAt, passMark, maxAttempts,
      randomize, accessType, batch, showResults,
    } = req.body;

    if (title) exam.title = title;
    if (subject !== undefined) exam.subject = subject;
    if (description !== undefined) exam.description = description;
    if (duration) exam.duration = Number(duration);
    if (startAt !== undefined) exam.startAt = startAt || null;
    if (endAt !== undefined) exam.endAt = endAt || null;
    if (passMark !== undefined) exam.passMark = Number(passMark);
    if (maxAttempts) exam.maxAttempts = Number(maxAttempts);
    if (randomize !== undefined) exam.randomize = Boolean(randomize);
    if (accessType) {
      exam.accessType = accessType;
      exam.batch = accessType === 'batch' ? batch || null : null;
    }
    if (showResults) exam.showResults = showResults;

    await exam.save();
    res.json({ success: true, exam });
  })
);

router.post(
  '/:id/questions',
  asyncHandler(async (req, res) => {
    const exam = await Exam.findOne({ _id: req.params.id, institute: req.institute._id });
    if (!exam) throw new ApiError(404, 'Exam not found');
    const { questionIds, marks } = req.body;
    if (!Array.isArray(questionIds) || questionIds.length === 0)
      throw new ApiError(400, 'No questions provided');

    const existing = new Set(exam.questions.map((q) => String(q.questionId)));
    const fresh = questionIds.filter((id) => !existing.has(String(id)));

    const qs = await Question.find({ _id: { $in: fresh }, institute: req.institute._id }).lean();
    const qMap = new Map(qs.map((q) => [String(q._id), q]));
    const defaultMarks = marks ?? null;

    for (const id of fresh) {
      const q = qMap.get(String(id));
      if (!q) continue;
      exam.questions.push({ questionId: q._id, marks: defaultMarks || q.marks || 1 });
    }
    await exam.save();
    res.json({ success: true, exam });
  })
);

router.put(
  '/:id/questions/:qIndex',
  asyncHandler(async (req, res) => {
    const exam = await Exam.findOne({ _id: req.params.id, institute: req.institute._id });
    if (!exam) throw new ApiError(404, 'Exam not found');
    const index = Number(req.params.qIndex);
    if (index < 0 || index >= exam.questions.length) throw new ApiError(404, 'Question index out of range');
    if (req.body.marks !== undefined) exam.questions[index].marks = Number(req.body.marks);
    if (req.body.questionId !== undefined) {
      const dup = exam.questions.find((q, i) => i !== index && String(q.questionId) === String(req.body.questionId));
      if (!dup) exam.questions[index].questionId = req.body.questionId;
    }
    await exam.save();
    res.json({ success: true, exam });
  })
);

router.delete(
  '/:id/questions/:qIndex',
  asyncHandler(async (req, res) => {
    const exam = await Exam.findOne({ _id: req.params.id, institute: req.institute._id });
    if (!exam) throw new ApiError(404, 'Exam not found');
    const index = Number(req.params.qIndex);
    if (index < 0 || index >= exam.questions.length) throw new ApiError(404, 'Question index out of range');
    exam.questions.splice(index, 1);
    await exam.save();
    res.json({ success: true, exam });
  })
);

router.post(
  '/:id/publish',
  asyncHandler(async (req, res) => {
    const exam = await Exam.findOne({ _id: req.params.id, institute: req.institute._id });
    if (!exam) throw new ApiError(404, 'Exam not found');
    if (exam.questions.length === 0) throw new ApiError(400, 'Add at least one question before publishing');
    exam.status = 'live';
    exam.publishedAt = exam.publishedAt || new Date();
    if (!exam.startAt) exam.startAt = new Date();
    if (!exam.endAt) exam.endAt = new Date(Date.now() + exam.duration * 60000);
    await exam.save();
    res.json({ success: true, exam });
  })
);

router.post(
  '/:id/unpublish',
  asyncHandler(async (req, res) => {
    const exam = await Exam.findOne({ _id: req.params.id, institute: req.institute._id });
    if (!exam) throw new ApiError(404, 'Exam not found');
    if (exam.status !== 'live') throw new ApiError(400, 'Exam is not live');
    exam.status = 'draft';
    await exam.save();
    res.json({ success: true, exam });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const exam = await Exam.findOneAndDelete({ _id: req.params.id, institute: req.institute._id });
    if (!exam) throw new ApiError(404, 'Exam not found');
    await Attempt.deleteMany({ exam: exam._id });
    res.json({ success: true, message: 'Exam deleted' });
  })
);

export default router;
