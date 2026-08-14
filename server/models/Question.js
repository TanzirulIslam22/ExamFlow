import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
    type: { type: String, enum: ['MCQ', 'TF', 'SA'], default: 'MCQ' },
    question: { type: String, required: true, trim: true },
    options: [
      {
        text: { type: String, trim: true },
        isCorrect: { type: Boolean, default: false },
      },
    ],
    correctAnswer: { type: String, default: '' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    subject: { type: String, trim: true },
    topic: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    marks: { type: Number, default: 1, min: 0.5 },
  },
  { timestamps: true }
);

questionSchema.index({ institute: 1, subject: 1 });

const Question = mongoose.model('Question', questionSchema);
export default Question;
