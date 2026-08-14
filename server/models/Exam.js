import mongoose from 'mongoose';

const examSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
    title: { type: String, required: true, trim: true },
    subject: { type: String, trim: true },
    description: { type: String, default: '' },
    questions: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
        marks: { type: Number, default: 1, min: 0.5 },
      },
    ],
    duration: { type: Number, default: 30, min: 1 },
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
    passMark: { type: Number, default: 40, min: 0, max: 100 },
    maxAttempts: { type: Number, default: 1, min: 1 },
    randomize: { type: Boolean, default: false },
    accessType: { type: String, enum: ['open', 'invite', 'batch'], default: 'open' },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null },
    showResults: { type: String, enum: ['immediate', 'review', 'manual'], default: 'immediate' },
    status: { type: String, enum: ['draft', 'live', 'completed'], default: 'draft' },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

examSchema.index({ institute: 1, status: 1 });

const Exam = mongoose.model('Exam', examSchema);
export default Exam;
