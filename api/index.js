import { app } from '../server/index.js';
import { connectDB } from '../server/config/db.js';
import { isDBConnected } from '../server/config/db.js';

// Ensure MongoDB is connected on serverless cold starts (cached after first connect).
export default async function handler(req, res) {
  try {
    if (!isDBConnected()) await connectDB();
  } catch (err) {
    console.error('Serverless DB connect failed:', err.message);
  }
  return app(req, res);
}
