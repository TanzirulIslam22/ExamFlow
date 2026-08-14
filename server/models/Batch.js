import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

batchSchema.index({ institute: 1, name: 1 }, { unique: true });

const Batch = mongoose.model('Batch', batchSchema);
export default Batch;
