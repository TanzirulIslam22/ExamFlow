import { Router } from 'express';
import Exam from '../models/Exam.js';
import Attempt from '../models/Attempt.js';
import Student from '../models/Student.js';
import Question from '../models/Question.js';
import Batch from '../models/Batch.js';
import { protectInstitute } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/error.js';

const router = Router();
router.use(protectInstitute);

router.get(
  '/overview',
  asyncHandler(async (req, res) => {
    const instId = req.institute._id;
    const { examId, batchId } = req.query;

    const examMatch = { institute: instId, status: 'submitted' };
    if (examId) examMatch.exam = examId;
    if (batchId) {
      const students = await Student.find({ institute: instId, batch: batchId }).distinct('_id');
      examMatch.student = { $in: students };
    }

    const agg = await Attempt.aggregate([
      { $match: examMatch },
      {
        $group: {
          _id: null,
          attempts: { $sum: 1 },
          scoreSum: { $sum: '$score' },
          totalSum: { $sum: '$totalMarks' },
          passed: { $sum: { $cond: ['$passed', 1, 0] } },
          maxScore: { $max: '$score' },
          maxTotal: { $max: '$totalMarks' },
          timeSum: { $sum: '$timeTakenSec' },
        },
      },
    ]);

    const a = agg[0];
    const avgPct = a && a.totalSum ? Math.round((a.scoreSum / a.totalSum) * 1000) / 10 : 0;
    const highestPct = a && a.maxTotal ? Math.round((a.maxScore / a.maxTotal) * 1000) / 10 : 0;
    const avgTimeSec = a && a.attempts ? Math.round(a.timeSum / a.attempts) : 0;

    const attempts = await Attempt.find(examMatch).lean();
    const buckets = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (const t of attempts) {
      const pct = t.totalMarks ? (t.score / t.totalMarks) * 100 : 0;
      const idx = Math.min(9, Math.floor(pct / 10));
      buckets[idx]++;
    }

    res.json({
      success: true,
      kpis: {
        totalAttempts: a?.attempts || 0,
        avgScore: avgPct,
        passRate: a && a.attempts ? Math.round((a.passed / a.attempts) * 100) : 0,
        highestScore: highestPct,
        avgTimeSec,
      },
      distribution: buckets.map((count, i) => ({ range: `${i * 10}-${i * 10 + 9}`, count })),
      passFail: {
        passed: a?.passed || 0,
        failed: (a?.attempts || 0) - (a?.passed || 0),
      },
    });
  })
);

router.get(
  '/exam/:id',
  asyncHandler(async (req, res) => {
    const exam = await Exam.findOne({ _id: req.params.id, institute: req.institute._id });
    if (!exam) throw new ApiError(404, 'Exam not found');

    const attempts = await Attempt.find({ exam: exam._id, status: 'submitted' })
      .populate({ path: 'student', select: 'name studentId email batch avatarColor', populate: { path: 'batch', select: 'name' } })
      .sort({ score: -1, timeTakenSec: 1 })
      .lean();

    const qIds = exam.questions.map((q) => q.questionId);
    const questions = await Question.find({ _id: { $in: qIds } }).lean();
    const qMap = new Map(questions.map((q) => [String(q._id), q]));

    const perQuestion = exam.questions.map(({ questionId, marks }, i) => {
      const q = qMap.get(String(questionId));
      const aq = attempts
        .map((at) => at.answers.find((x) => String(x.questionId) === String(questionId)))
        .filter(Boolean);
      const correct = aq.filter((x) => x.isCorrect).length;
      const answered = aq.filter((x) => !x.skipped).length;
      return {
        index: i + 1,
        questionId,
        preview: q ? (q.question.length > 80 ? `${q.question.slice(0, 80)}…` : q.question) : 'Deleted question',
        type: q?.type || 'MCQ',
        difficulty: q?.difficulty || 'medium',
        marks: marks ?? q?.marks ?? 1,
        correctPct: aq.length ? Math.round((correct / aq.length) * 100) : 0,
        wrongPct: aq.length ? Math.round(((answered - correct) / aq.length) * 100) : 0,
        skippedPct: aq.length ? Math.round(((aq.length - answered) / aq.length) * 100) : 0,
        attempts: aq.length,
      };
    }).sort((a, b) => a.correctPct - b.correctPct);

    const ranking = attempts.map((at, i) => ({
      rank: i + 1,
      student: at.student?.name || 'Unknown',
      studentId: at.student?.studentId || '',
      batch: at.student?.batch?.name || '',
      avatarColor: at.student?.avatarColor || '#1A56DB',
      score: at.score,
      totalMarks: at.totalMarks,
      pct: at.totalMarks ? Math.round((at.score / at.totalMarks) * 100) : 0,
      timeTakenSec: at.timeTakenSec,
      passed: at.passed,
    }));

    res.json({ success: true, exam: { _id: exam._id, title: exam.title, subject: exam.subject }, perQuestion, ranking });
  })
);

router.get(
  '/exams',
  asyncHandler(async (req, res) => {
    const exams = await Exam.find({ institute: req.institute._id }).sort({ updatedAt: -1 }).lean();
    const withData = await Promise.all(
      exams.map(async (e) => {
        const agg = await Attempt.aggregate([
          { $match: { exam: e._id, status: 'submitted' } },
          { $group: { _id: null, n: { $sum: 1 }, passed: { $sum: { $cond: ['$passed', 1, 0] } } } },
        ]);
        return {
          _id: e._id,
          title: e.title,
          subject: e.subject,
          attempts: agg[0]?.n || 0,
          passed: agg[0]?.passed || 0,
          status: e.status,
        };
      })
    );
    res.json({ success: true, exams: withData });
  })
);

router.get(
  '/export',
  asyncHandler(async (req, res) => {
    const { examId } = req.query;
    const match = { institute: req.institute._id, status: 'submitted' };
    if (examId) match.exam = examId;

    const attempts = await Attempt.find(match)
      .populate('student', 'name studentId email batch')
      .populate('exam', 'title')
      .sort({ score: -1 })
      .lean();

    const rows = [
      ['Student Name', 'Student ID', 'Email', 'Batch', 'Exam', 'Score', 'Total', 'Percentage', 'Result', 'Time (sec)', 'Submitted At'],
      ...attempts.map((a) => [
        a.student?.name || '', a.student?.studentId || '', a.student?.email || '',
        a.student?.batch?.name || '', a.exam?.title || '', a.score, a.totalMarks,
        a.totalMarks ? `${Math.round((a.score / a.totalMarks) * 100)}%` : '0%',
        a.passed ? 'PASSED' : 'FAILED', a.timeTakenSec, new Date(a.submittedAt).toISOString(),
      ]),
    ];

    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="examflow-results-${Date.now()}.csv"`);
    res.send(`\uFEFF${csv}`);
  })
);

router.get(
  '/batches',
  asyncHandler(async (req, res) => {
    const batches = await Batch.find({ institute: req.institute._id }).lean();
    res.json({ success: true, batches });
  })
);

export default router;
