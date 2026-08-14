import { Router } from 'express';
import Attempt from '../models/Attempt.js';
import { protectInstitute } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/error.js';

const router = Router();
router.use(protectInstitute);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { examId } = req.query;
    const match = { institute: req.institute._id, status: 'submitted' };
    if (examId) match.exam = examId;
    const attempts = await Attempt.find(match)
      .populate('student', 'name studentId email avatarColor')
      .populate('exam', 'title')
      .sort({ submittedAt: -1 })
      .limit(Number(req.query.limit) || 200)
      .lean();
    res.json({ success: true, attempts });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const attempt = await Attempt.findOneAndDelete({
      _id: req.params.id,
      institute: req.institute._id,
    });
    if (!attempt) throw new ApiError(404, 'Attempt not found');
    res.json({ success: true, message: 'Attempt deleted' });
  })
);

export default router;
