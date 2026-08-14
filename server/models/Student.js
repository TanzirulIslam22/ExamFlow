import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const studentSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
    name: { type: String, required: true, trim: true },
    studentId: { type: String, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    avatarColor: { type: String, default: '#1A56DB' },
  },
  { timestamps: true }
);

studentSchema.index({ institute: 1, email: 1 }, { unique: true });

studentSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.passwordHash);
};

studentSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

const Student = mongoose.model('Student', studentSchema);
export default Student;
