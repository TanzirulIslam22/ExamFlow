import mongoose from 'mongoose';

const attemptSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
    answers: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
        selectedIndex: { type: Number, default: null },
        textAnswer: { type: String, default: '' },
        isCorrect: { type: Boolean, default: false },
        marksAwarded: { type: Number, default: 0 },
        skipped: { type: Boolean, default: false },
      },
    ],
    score: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    wrongCount: { type: Number, default: 0 },
    skippedCount: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    status: { type: String, enum: ['in_progress', 'submitted'], default: 'in_progress' },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null },
    timeTakenSec: { type: Number, default: 0 },
  },
  { timestamps: true }
);

attemptSchema.index({ exam: 1, student: 1 });

const Attempt = mongoose.model('Attempt', attemptSchema);
export default Attempt;
