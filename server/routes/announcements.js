import { Router } from 'express';
import Announcement from '../models/Announcement.js';
import { protectInstitute } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/error.js';

const router = Router();
router.use(protectInstitute);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const announcements = await Announcement.find({ institute: req.institute._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, announcements });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { title, message, audience, batches } = req.body;
    if (!title || !message) throw new ApiError(400, 'Title and message are required');
    const announcement = await Announcement.create({
      institute: req.institute._id,
      title,
      message,
      audience: audience || 'all',
      batches: audience === 'batches' ? batches || [] : [],
    });
    res.status(201).json({ success: true, announcement });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const announcement = await Announcement.findOneAndDelete({
      _id: req.params.id,
      institute: req.institute._id,
    });
    if (!announcement) throw new ApiError(404, 'Announcement not found');
    res.json({ success: true, message: 'Announcement deleted' });
  })
);

export default router;
