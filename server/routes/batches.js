import { Router } from 'express';
import Batch from '../models/Batch.js';
import Student from '../models/Student.js';
import Exam from '../models/Exam.js';
import { protectInstitute } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/error.js';

const router = Router();
router.use(protectInstitute);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const batches = await Batch.find({ institute: req.institute._id }).sort({ createdAt: -1 }).lean();
    const withCounts = await Promise.all(
      batches.map(async (b) => ({
        ...b,
        students: await Student.countDocuments({ institute: req.institute._id, batch: b._id }),
        exams: await Exam.countDocuments({ institute: req.institute._id, batch: b._id, status: 'live' }),
      }))
    );
    res.json({ success: true, batches: withCounts });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    if (!name) throw new ApiError(400, 'Batch name is required');
    const batch = await Batch.create({
      institute: req.institute._id,
      name,
      description: description || '',
    });
    res.status(201).json({ success: true, batch: { ...batch.toObject(), students: 0, exams: 0 } });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const batch = await Batch.findOneAndUpdate(
      { _id: req.params.id, institute: req.institute._id },
      { name, description },
      { new: true }
    );
    if (!batch) throw new ApiError(404, 'Batch not found');
    res.json({ success: true, batch });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const batch = await Batch.findOneAndDelete({ _id: req.params.id, institute: req.institute._id });
    if (!batch) throw new ApiError(404, 'Batch not found');
    await Student.updateMany({ batch: batch._id }, { batch: null });
    await Exam.updateMany({ batch: batch._id }, { batch: null, accessType: 'open' });
    res.json({ success: true, message: 'Batch deleted' });
  })
);

export default router;
