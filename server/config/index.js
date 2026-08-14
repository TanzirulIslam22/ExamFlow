import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(dirname, '../.env') });
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/examflow',
  jwtSecret: process.env.JWT_SECRET || 'examflow_dev_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',
};
