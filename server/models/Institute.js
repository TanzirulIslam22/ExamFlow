import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const instituteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['School', 'College', 'Coaching Center', 'Corporate'],
      required: true,
    },
    ownerName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    logo: { type: String, default: '' },
    passwordHash: { type: String, required: true, select: false },
    plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
    isVerified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

instituteSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.passwordHash);
};

instituteSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

const Institute = mongoose.model('Institute', instituteSchema);
export default Institute;
