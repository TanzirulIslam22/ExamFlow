import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/index.js';
import { connectDB } from './config/db.js';
import { notFound, errorHandler } from './middleware/error.js';
import authRoutes from './routes/auth.js';
import instituteRoutes from './routes/institutes.js';
import studentAdminRoutes from './routes/students.js';
import batchRoutes from './routes/batches.js';
import questionRoutes from './routes/questions.js';
import examRoutes from './routes/exams.js';
import attemptRoutes from './routes/attempts.js';
import analyticsRoutes from './routes/analytics.js';
import announcementRoutes from './routes/announcements.js';
import studentRoutes from './routes/student.js';

export const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
if (config.env === 'development') app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime(), env: config.env }));

app.use('/api/auth', authRoutes);
app.use('/api/institute', instituteRoutes);
app.use('/api/students', studentAdminRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/student', studentRoutes);

app.use(notFound);
app.use(errorHandler);

const isServerless = process.env.VERCEL === '1';

if (!isServerless) {
  const start = async () => {
    try {
      await connectDB();
      app.listen(config.port, () => {
        console.log(`ExamFlow API running on http://localhost:${config.port}`);
      });
    } catch (err) {
      console.error('Failed to start server:', err);
    }
  };
  start();
}

export default app;
