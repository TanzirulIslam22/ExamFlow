import { Router } from 'express';
import Institute from '../models/Institute.js';
import Student from '../models/Student.js';
import Exam from '../models/Exam.js';
import Attempt from '../models/Attempt.js';
import Batch from '../models/Batch.js';
import Question from '../models/Question.js';
import { protectInstitute } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/error.js';

const router = Router();
router.use(protectInstitute);

router.get(
  '/me',
  asyncHandler(async (req, res) => {
    res.json({ success: true, institute: req.institute });
  })
);

router.put(
  '/me',
  asyncHandler(async (req, res) => {
    const { name, type, phone, city, logo } = req.body;
    const institute = req.institute;
    if (name) institute.name = name;
    if (type) institute.type = type;
    if (phone !== undefined) institute.phone = phone;
    if (city !== undefined) institute.city = city;
    if (logo !== undefined) institute.logo = logo;
    await institute.save();
    res.json({ success: true, institute });
  })
);

router.get(
  '/dashboard-stats',
  asyncHandler(async (req, res) => {
    const instId = req.institute._id;

    const [totalStudents, totalExams, batches, attempts] = await Promise.all([
      Student.countDocuments({ institute: instId }),
      Exam.countDocuments({ institute: instId }),
      Batch.countDocuments({ institute: instId }),
      Attempt.aggregate([
        { $match: { institute: instId, status: 'submitted' } },
        {
          $group: {
            _id: null,
            attempts: { $sum: 1 },
            scoreSum: { $sum: '$score' },
            totalSum: { $sum: '$totalMarks' },
            passed: { $sum: { $cond: ['$passed', 1, 0] } },
          },
        },
      ]),
    ]);

    const agg = attempts[0];
    const avgScore = agg && agg.totalSum ? Math.round((agg.scoreSum / agg.totalSum) * 1000) / 10 : 0;
    const passRate = agg && agg.attempts ? Math.round((agg.passed / agg.attempts) * 100) : 0;

    const now = new Date();
    const liveExams = await Exam.countDocuments({
      institute: instId,
      status: 'live',
      startAt: { $lte: now },
      endAt: { $gte: now },
    });

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalExams,
        batches,
        attempts: agg ? agg.attempts : 0,
        avgScore,
        passRate,
        liveExams,
        newStudentsThisMonth: await Student.countDocuments({
          institute: instId,
          createdAt: { $gte: new Date(new Date().setDate(1)) },
        }),
      },
    });
  })
);

router.get(
  '/chart-data',
  asyncHandler(async (req, res) => {
    const instId = req.institute._id;

    const sixMonths = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return { label: d.toLocaleString('en-US', { month: 'short' }), start: new Date(d.getFullYear(), d.getMonth(), 1), end: new Date(d.getFullYear(), d.getMonth() + 1, 0) };
    });

    const scoresOverTime = await Promise.all(
      sixMonths.map(async ({ label, start, end }) => {
        const agg = await Attempt.aggregate([
          { $match: { institute: instId, status: 'submitted', submittedAt: { $gte: start, $lte: end } } },
          { $group: { _id: null, s: { $sum: '$score' }, t: { $sum: '$totalMarks' } } },
        ]);
        const pct = agg[0] && agg[0].t ? Math.round((agg[0].s / agg[0].t) * 100) : 0;
        return { name: label, score: pct };
      })
    );

    const byBatch = await Student.aggregate([
      { $match: { institute: instId } },
      { $group: { _id: '$batch', count: { $sum: 1 } } },
    ]);
    const batchNames = await Batch.find({ institute: instId }).lean();
    const studentsByBatch = byBatch.map((b) => ({
      name: batchNames.find((x) => String(x._id) === String(b._id))?.name || 'Unassigned',
      students: b.count,
    }));

    const recentExams = await Exam.find({ institute: instId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();

    const recentExamsData = await Promise.all(
      recentExams.map(async (exam) => {
        const agg = await Attempt.aggregate([
          { $match: { exam: exam._id, status: 'submitted' } },
          { $group: { _id: null, attempts: { $sum: 1 }, s: { $sum: '$score' }, t: { $sum: '$totalMarks' } } },
        ]);
        const now = new Date();
        const computedStatus = exam.status === 'draft' ? 'draft' : exam.endAt && new Date(exam.endAt) < now ? 'completed' : 'live';
        return {
          ...exam,
          computedStatus,
          attempts: agg[0]?.attempts || 0,
          avgScore: agg[0] && agg[0].t ? Math.round((agg[0].s / agg[0].t) * 100) : null,
        };
      })
    );

    const topStudents = await Attempt.aggregate([
      { $match: { institute: instId, status: 'submitted' } },
      { $sort: { score: -1, timeTakenSec: 1 } },
      { $group: { _id: '$student', best: { $first: '$$ROOT' } } },
      { $limit: 5 },
    ]);
    const studentIds = topStudents.map((t) => t.best.student);
    const students = await Student.find({ _id: { $in: studentIds } }).populate('batch', 'name').lean();
    const topPerforming = topStudents.map((t) => {
      const st = students.find((x) => String(x._id) === String(t.best.student));
      const pct = t.best.totalMarks ? Math.round((t.best.score / t.best.totalMarks) * 100) : 0;
      return { student: st, score: t.best.score, total: t.best.totalMarks, pct };
    });

    res.json({
      success: true,
      data: { scoresOverTime, studentsByBatch, recentExams: recentExamsData, topPerforming },
    });
  })
);

export default router;
