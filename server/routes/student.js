import { Router } from 'express';
import mongoose from 'mongoose';
import Exam from '../models/Exam.js';
import Question from '../models/Question.js';
import Attempt from '../models/Attempt.js';
import Announcement from '../models/Announcement.js';
import { protectStudent } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/error.js';

const router = Router();
router.use(protectStudent);

function isOpen(exam) {
  const now = Date.now();
  if (exam.status !== 'live') return { ok: false, reason: 'not_live' };
  if (exam.startAt && new Date(exam.startAt).getTime() > now)
    return { ok: false, reason: 'not_started', at: exam.startAt };
  if (exam.endAt && new Date(exam.endAt).getTime() < now)
    return { ok: false, reason: 'ended', at: exam.endAt };
  return { ok: true };
}

function accessAllowed(exam, student) {
  if (exam.accessType === 'open') return { ok: true };
  if (exam.accessType === 'batch') {
    const examBatchId = String(exam.batch?._id || exam.batch);
    const studentBatchId = String(student.batch?._id || student.batch || '');
    return studentBatchId && examBatchId === studentBatchId
      ? { ok: true }
      : { ok: false, reason: 'batch_restricted' };
  }
  return { ok: false, reason: 'invite_only' };
}

router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const student = await req.student.populate([
      { path: 'batch', select: 'name description' },
      { path: 'institute', select: 'name logo city' },
    ]);
    res.json({ success: true, student });
  })
);

router.put(
  '/me',
  asyncHandler(async (req, res) => {
    const { phone, password } = req.body;
    const student = req.student;
    if (phone !== undefined) student.phone = phone;
    if (password) student.passwordHash = password;
    await student.save();
    res.json({ success: true, student });
  })
);

router.get(
  '/exams',
  asyncHandler(async (req, res) => {
    const student = req.student;
    const query = { institute: student.institute, status: 'live' };
    if (student.batch && student.batch._id) {
      query.$or = [{ accessType: 'open' }, { accessType: 'batch', batch: student.batch._id }];
    } else {
      query.accessType = 'open';
    }

    const exams = await Exam.find(query).populate('batch', 'name').sort({ startAt: -1 }).lean();
    const attempts = await Attempt.find({ student: student._id }).lean();
    const attemptMap = {};
    const submittedCount = {};
    for (const a of attempts) {
      const key = String(a.exam);
      if (a.status === 'submitted') submittedCount[key] = (submittedCount[key] || 0) + 1;
      const current = attemptMap[key];
      if (!current || (a.status === 'in_progress' && current.status !== 'in_progress')) attemptMap[key] = a;
    }

    const now = new Date();
    const list = exams.map((exam) => {
      const open = isOpen(exam);
      const allowed = accessAllowed(exam, student);
      const attempt = attemptMap[String(exam._id)];
      const used = submittedCount[String(exam._id)] || 0;
      return {
        ...exam,
        open: open.ok,
        notStarted: open.reason === 'not_started',
        ended: open.reason === 'ended',
        allowed: allowed.ok,
        attempt,
        started: Boolean(attempt && attempt.status === 'in_progress'),
        completed: used > 0,
        canStart: open.ok && allowed.ok && !(attempt && attempt.status === 'in_progress') && used < exam.maxAttempts,
        attemptsUsed: used,
        timeUntilStart: open.reason === 'not_started' ? Math.max(0, new Date(open.at).getTime() - now.getTime()) : 0,
      };
    });

    res.json({ success: true, exams: list });
  })
);

router.get(
  '/exams/:id',
  asyncHandler(async (req, res) => {
    const exam = await Exam.findOne({ _id: req.params.id, institute: req.student.institute, status: 'live' });
    if (!exam) throw new ApiError(404, 'Exam not found');

    const open = isOpen(exam);
    if (!open.ok) throw new ApiError(403, open.reason === 'not_started' ? 'Exam has not started yet' : 'Exam has ended');
    if (!accessAllowed(exam, req.student).ok) throw new ApiError(403, 'This exam is restricted to specific batches');

    const submittedCount = await Attempt.countDocuments({
      exam: exam._id,
      student: req.student._id,
      status: 'submitted',
    });
    if (submittedCount >= exam.maxAttempts)
      throw new ApiError(403, 'You have used all allowed attempts for this exam');

    const existing = await Attempt.findOne({ exam: exam._id, student: req.student._id, status: 'in_progress' });
    const attempt = existing || (await Attempt.create({
      exam: exam._id,
      student: req.student._id,
      institute: exam.institute,
      answers: [],
      status: 'in_progress',
    }));

    const qIds = exam.questions.map((q) => q.questionId);
    const questions = await Question.find({ _id: { $in: qIds }, institute: exam.institute }).lean();
    const marksMap = new Map(exam.questions.map((q) => [String(q.questionId), q.marks]));
    const order = questions
      .map((q) => ({ q, order: exam.randomize ? Math.random() : String(q._id) }))
      .sort((a, b) => (typeof a.order === 'string' ? a.order.localeCompare(b.order) : a.order - b.order))
      .map((x) => x.q)
      .map((q) => ({
        _id: q._id,
        question: q.question,
        type: q.type,
        options: q.options,
        marks: marksMap.get(String(q._id)) || q.marks || 1,
      }));

    res.json({ success: true, exam: { _id: exam._id, title: exam.title, subject: exam.subject, duration: exam.duration, description: exam.description }, attempt, questions: order, resumed: Boolean(existing) });
  })
);

router.post(
  '/exams/:id/attempt',
  asyncHandler(async (req, res) => {
    const exam = await Exam.findOne({ _id: req.params.id, institute: req.student.institute, status: 'live' });
    if (!exam) throw new ApiError(404, 'Exam not found');

    const attempt = await Attempt.findOne({
      exam: exam._id,
      student: req.student._id,
      status: 'in_progress',
    });
    if (!attempt) throw new ApiError(400, 'No active attempt found. Start the exam first.');

    const submittedCount = await Attempt.countDocuments({
      exam: exam._id,
      student: req.student._id,
      status: 'submitted',
    });
    if (submittedCount >= exam.maxAttempts)
      throw new ApiError(403, 'You have used all allowed attempts for this exam');

    const { answers, questionOrder } = req.body;
    const qIds = exam.questions.map((q) => q.questionId);
    const questions = await Question.find({ _id: { $in: qIds }, institute: exam.institute }).lean();
    const qMap = new Map(questions.map((q) => [String(q._id), q]));
    const marksMap = new Map(exam.questions.map((q) => [String(q.questionId), q.marks]));

    let order = exam.questions.map((q) => String(q.questionId));
    if (exam.randomize && Array.isArray(questionOrder) && questionOrder.length === order.length) {
      order = questionOrder.map(String);
    }

    const filled = [];
    for (const qid of order) {
      const question = qMap.get(qid);
      if (!question) continue;
      const ans = (answers || []).find((a) => String(a.questionId) === qid);
      const marks = marksMap.get(qid) || question.marks || 1;

      let isCorrect = false;
      let marksAwarded = 0;
      let skipped = false;
      let selectedIndex = null;
      let textAnswer = '';

      if (!ans || (question.type === 'MCQ' && (ans.selectedIndex === undefined || ans.selectedIndex === null) && !ans.textAnswer)) {
        skipped = true;
      } else if (question.type === 'MCQ') {
        selectedIndex = ans.selectedIndex;
        const correctIdx = question.options.findIndex((o) => o.isCorrect);
        isCorrect = selectedIndex === correctIdx;
        marksAwarded = isCorrect ? marks : 0;
      } else if (question.type === 'TF') {
        textAnswer = String(ans.textAnswer ?? '').toLowerCase();
        selectedIndex = textAnswer === 'true' ? 0 : textAnswer === 'false' ? 1 : null;
        isCorrect = textAnswer === String(question.correctAnswer).toLowerCase();
        marksAwarded = isCorrect ? marks : 0;
      } else {
        textAnswer = String(ans.textAnswer ?? '').trim().toLowerCase();
        skipped = !textAnswer;
        const correct = String(question.correctAnswer || '').trim().toLowerCase();
        isCorrect = !skipped && textAnswer === correct;
        marksAwarded = isCorrect ? marks : 0;
      }

      filled.push({
        questionId: qid,
        selectedIndex,
        textAnswer: question.type !== 'MCQ' ? textAnswer : '',
        isCorrect,
        marksAwarded,
        skipped,
      });
    }

    const correctCount = filled.filter((a) => a.isCorrect).length;
    const skippedCount = filled.filter((a) => a.skipped).length;
    const score = filled.reduce((s, a) => s + a.marksAwarded, 0);
    const totalMarks = filled.reduce((s, a) => s + (marksMap.get(String(a.questionId)) || 1), 0);
    const passMarkScore = (exam.passMark / 100) * totalMarks;

    attempt.answers = filled;
    attempt.score = score;
    attempt.totalMarks = totalMarks;
    attempt.correctCount = correctCount;
    attempt.wrongCount = filled.length - correctCount - skippedCount;
    attempt.skippedCount = skippedCount;
    attempt.passed = score >= passMarkScore;
    attempt.status = 'submitted';
    attempt.submittedAt = new Date();
    if (attempt.startedAt) {
      attempt.timeTakenSec = Math.max(0, Math.round((Date.now() - new Date(attempt.startedAt).getTime()) / 1000));
    }

    await attempt.save();
    res.json({ success: true, attemptId: attempt._id });
  })
);

router.get(
  '/attempts/:id/result',
  asyncHandler(async (req, res) => {
    const attempt = await Attempt.findOne({ _id: req.params.id, student: req.student._id })
      .populate('exam')
      .populate('institute', 'name logo');
    if (!attempt) throw new ApiError(404, 'Attempt not found');

    const exam = attempt.exam;
    const hideAnswers = exam.showResults === 'manual';
    const reviewMode = exam.showResults === 'review';

    const qIds = exam.questions.map((q) => q.questionId);
    const questions = await Question.find({ _id: { $in: qIds } }).lean();
    const qMap = new Map(questions.map((q) => [String(q._id), q]));
    const marksMap = new Map(exam.questions.map((q) => [String(q.questionId), q.marks]));

    const review = attempt.answers.map((a) => {
      const q = qMap.get(String(a.questionId));
      if (!q) return null;
      return {
        question: q.question,
        type: q.type,
        difficulty: q.difficulty,
        marks: marksMap.get(String(a.questionId)) || q.marks,
        selectedIndex: a.selectedIndex,
        textAnswer: a.textAnswer,
        correctAnswer: q.type === 'MCQ' ? q.options.find((o) => o.isCorrect) : q.correctAnswer,
        isCorrect: a.isCorrect,
        skipped: a.skipped,
        options: q.options,
        explanation: q.explanation || '',
      };
    }).filter(Boolean);

    res.json({
      success: true,
      result: {
        attempt,
        studentName: req.student.name,
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        correctCount: attempt.correctCount,
        wrongCount: attempt.wrongCount,
        skippedCount: attempt.skippedCount,
        passed: attempt.passed,
        passMark: exam.passMark,
        timeTakenSec: attempt.timeTakenSec,
        examTitle: exam.title,
        subject: exam.subject,
        showAnswers: !hideAnswers,
        reviewMode,
        review,
      },
    });
  })
);

router.get(
  '/results',
  asyncHandler(async (req, res) => {
    const attempts = await Attempt.find({ student: req.student._id, status: 'submitted' })
      .populate('exam', 'title subject passMark')
      .sort({ submittedAt: -1 })
      .lean();
    res.json({
      success: true,
      results: attempts.map((a) => ({
        _id: a._id,
        exam: a.exam,
        score: a.score,
        totalMarks: a.totalMarks,
        pct: a.totalMarks ? Math.round((a.score / a.totalMarks) * 100) : 0,
        passed: a.passed,
        timeTakenSec: a.timeTakenSec,
        submittedAt: a.submittedAt,
        correctCount: a.correctCount,
        wrongCount: a.wrongCount,
        skippedCount: a.skippedCount,
      })),
    });
  })
);

router.get(
  '/announcements',
  asyncHandler(async (req, res) => {
    const student = req.student;
    const query = { institute: student.institute };
    if (student.batch && student.batch._id) {
      query.$or = [{ audience: 'all' }, { audience: 'batches', batches: student.batch._id }];
    } else {
      query.audience = 'all';
    }
    const announcements = await Announcement.find(query).sort({ createdAt: -1 }).limit(20).lean();
    res.json({ success: true, announcements });
  })
);

router.get(
  '/institute',
  asyncHandler(async (req, res) => {
    const Institute = (await import('../models/Institute.js')).default;
    const inst = await Institute.findById(req.student.institute).select('name logo city type');
    res.json({ success: true, institute: inst });
  })
);

export default router;
