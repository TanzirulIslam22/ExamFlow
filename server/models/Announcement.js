import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    audience: { type: String, enum: ['all', 'batches'], default: 'all' },
    batches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute' },
  },
  { timestamps: true }
);

const Announcement = mongoose.model('Announcement', announcementSchema);
export default Announcement;
