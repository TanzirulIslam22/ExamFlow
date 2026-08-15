import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from './config/index.js';
import Institute from './models/Institute.js';
import Batch from './models/Batch.js';
import Student from './models/Student.js';
import Question from './models/Question.js';
import Exam from './models/Exam.js';
import Attempt from './models/Attempt.js';
import Announcement from './models/Announcement.js';
import { pickAvatarColor } from './utils/helpers.js';

const instituteData = {
  name: 'Prodigy Coaching Center',
  type: 'Coaching Center',
  ownerName: 'Rafiqul Islam',
  email: 'admin@prodigy.com',
  phone: '01712345678',
  city: 'Dhaka',
  plan: 'pro',
};

const batches = [
  { name: 'Morning Batch (HSC)' },
  { name: 'Evening Batch (HSC)' },
  { name: 'Weekend Batch' },
];

const studentSeeds = [
  ['Ayesha Rahman', 'ST-001', 'ayesha@student.com', 'Morning Batch (HSC)'],
  ['Tanvir Ahmed', 'ST-002', 'tanvir@student.com', 'Morning Batch (HSC)'],
  ['Nusrat Jahan', 'ST-003', 'nusrat@student.com', 'Morning Batch (HSC)'],
  ['Sakib Hasan', 'ST-004', 'sakib@student.com', 'Evening Batch (HSC)'],
  ['Mehjabin Akter', 'ST-005', 'mehjabin@student.com', 'Evening Batch (HSC)'],
  ['Arif Chowdhury', 'ST-006', 'arif@student.com', 'Evening Batch (HSC)'],
  ['Farhana Islam', 'ST-007', 'farhana@student.com', 'Weekend Batch'],
  ['Rakibul Karim', 'ST-008', 'rakibul@student.com', 'Weekend Batch'],
  ['Sumaiya Sultana', 'ST-009', 'sumaiya@student.com', 'Morning Batch (HSC)'],
  ['Imran Hossain', 'ST-010', 'imran@student.com', 'Evening Batch (HSC)'],
];

const questionSeeds = [
  {
    type: 'MCQ', question: 'What is the chemical symbol for gold?',
    options: [{ text: 'Go', isCorrect: false }, { text: 'Au', isCorrect: true }, { text: 'Ag', isCorrect: false }, { text: 'Gd', isCorrect: false }],
    difficulty: 'easy', subject: 'Chemistry', topic: 'Periodic Table', marks: 1,
  },
  {
    type: 'MCQ', question: 'The value of (2 + 3) × 4 is:',
    options: [{ text: '14', isCorrect: false }, { text: '20', isCorrect: true }, { text: '24', isCorrect: false }, { text: '11', isCorrect: false }],
    difficulty: 'easy', subject: 'Mathematics', topic: 'Arithmetic', marks: 1,
  },
  {
    type: 'MCQ', question: 'Which planet is known as the Red Planet?',
    options: [{ text: 'Venus', isCorrect: false }, { text: 'Mars', isCorrect: true }, { text: 'Jupiter', isCorrect: false }, { text: 'Saturn', isCorrect: false }],
    difficulty: 'easy', subject: 'Science', topic: 'Astronomy', marks: 1,
  },
  {
    type: 'TF', question: 'The Great Wall of China is visible from space with the naked eye.',
    correctAnswer: 'false', difficulty: 'medium', subject: 'General Knowledge', topic: 'Facts', marks: 1,
  },
  {
    type: 'TF', question: 'Water boils at 100°C at sea level.',
    correctAnswer: 'true', difficulty: 'easy', subject: 'Science', topic: 'Physics', marks: 1,
  },
  {
    type: 'MCQ', question: 'Who wrote the play "Romeo and Juliet"?',
    options: [{ text: 'Charles Dickens', isCorrect: false }, { text: 'William Shakespeare', isCorrect: true }, { text: 'Jane Austen', isCorrect: false }, { text: 'Mark Twain', isCorrect: false }],
    difficulty: 'easy', subject: 'English Literature', topic: 'Drama', marks: 2,
  },
  {
    type: 'MCQ', question: 'If x + 5 = 12, what is the value of x?',
    options: [{ text: '5', isCorrect: false }, { text: '7', isCorrect: true }, { text: '17', isCorrect: false }, { text: '-7', isCorrect: false }],
    difficulty: 'easy', subject: 'Mathematics', topic: 'Algebra', marks: 1,
  },
  {
    type: 'SA', question: 'What is the process by which plants make their own food called?',
    correctAnswer: 'photosynthesis', difficulty: 'medium', subject: 'Biology', topic: 'Plant Science', marks: 2,
  },
  {
    type: 'MCQ', question: 'Which of the following is NOT a primary colour?',
    options: [{ text: 'Red', isCorrect: false }, { text: 'Blue', isCorrect: false }, { text: 'Green', isCorrect: true }, { text: 'Yellow', isCorrect: false }],
    difficulty: 'medium', subject: 'Art', topic: 'Colour Theory', marks: 1,
  },
  {
    type: 'TF', question: 'The capital of Bangladesh is Dhaka.',
    correctAnswer: 'true', difficulty: 'easy', subject: 'Geography', topic: 'Countries', marks: 1,
  },
  {
    type: 'MCQ', question: 'What is the largest organ of the human body?',
    options: [{ text: 'Heart', isCorrect: false }, { text: 'Liver', isCorrect: false }, { text: 'Skin', isCorrect: true }, { text: 'Brain', isCorrect: false }],
    difficulty: 'medium', subject: 'Biology', topic: 'Human Body', marks: 2,
  },
  {
    type: 'MCQ', question: 'Which device is used to measure electric current?',
    options: [{ text: 'Voltmeter', isCorrect: false }, { text: 'Ammeter', isCorrect: true }, { text: 'Barometer', isCorrect: false }, { text: 'Thermometer', isCorrect: false }],
    difficulty: 'medium', subject: 'Physics', topic: 'Electricity', marks: 1,
  },
  {
    type: 'SA', question: 'What gas do humans breathe out after respiration?',
    correctAnswer: 'carbon dioxide', difficulty: 'easy', subject: 'Biology', topic: 'Respiration', marks: 1,
  },
  {
    type: 'MCQ', question: 'The speed of light is approximately:',
    options: [{ text: '300,000 km/s', isCorrect: true }, { text: '150,000 km/s', isCorrect: false }, { text: '30,000 km/s', isCorrect: false }, { text: '3,000 km/s', isCorrect: false }],
    difficulty: 'hard', subject: 'Physics', topic: 'Light', marks: 2,
  },
  {
    type: 'TF', question: 'Mount Everest is the highest mountain above sea level.',
    correctAnswer: 'true', difficulty: 'easy', subject: 'Geography', topic: 'Landmarks', marks: 1,
  },
];

async function seed() {
  console.log('Clearing existing data…');
  await Promise.all([
    Institute.deleteMany({}),
    Batch.deleteMany({}),
    Student.deleteMany({}),
    Question.deleteMany({}),
    Exam.deleteMany({}),
    Attempt.deleteMany({}),
    Announcement.deleteMany({}),
  ]);

  const institute = await Institute.create({ ...instituteData, passwordHash: 'admin123' });
  console.log(`Institute: ${institute.email} / admin123`);

  const batchDocs = {};
  for (const b of batches) {
    const doc = await Batch.create({ institute: institute._id, name: b.name, description: `${b.name.replace(' Batch', '')} for HSC candidates` });
    batchDocs[b.name] = doc;
  }

  const students = [];
  for (const [name, sid, email, bname] of studentSeeds) {
    const s = await Student.create({
      institute: institute._id,
      name, studentId: sid, email,
      phone: '01800000000',
      passwordHash: 'student123',
      batch: batchDocs[bname]._id,
      avatarColor: pickAvatarColor(email),
    });
    students.push(s);
    console.log(`Student: ${email} / student123`);
  }

  const questions = [];
  for (const q of questionSeeds) {
    const doc = await Question.create({ ...q, institute: institute._id, tags: [q.subject, q.topic] });
    questions.push(doc);
  }
  console.log(`${questions.length} questions created`);

  const exam = await Exam.create({
    institute: institute._id,
    title: 'HSC Physics & Chemistry Weekly Test',
    subject: 'Science',
    description: 'Weekly assessment covering last week\u2019s chapters. Total 10 questions.',
    questions: questions.slice(0, 10).map((q, i) => ({ questionId: q._id, marks: q.marks || 1 })),
    duration: 20,
    startAt: new Date(Date.now() - 1000 * 60 * 5),
    endAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
    passMark: 40,
    maxAttempts: 1,
    randomize: false,
    accessType: 'open',
    showResults: 'immediate',
    status: 'live',
    publishedAt: new Date(),
  });

  const exam2 = await Exam.create({
    institute: institute._id,
    title: 'English Literature Practice',
    subject: 'English Literature',
    description: 'Practice set for the drama chapter.',
    questions: [5, 8].map((i) => ({ questionId: questions[i]._id, marks: questions[i].marks })),
    duration: 15,
    startAt: new Date(Date.now() - 1000 * 60 * 30),
    endAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
    passMark: 50,
    maxAttempts: 2,
    randomize: true,
    accessType: 'batch',
    batch: batchDocs['Evening Batch (HSC)']._id,
    showResults: 'immediate',
    status: 'live',
    publishedAt: new Date(),
  });

  console.log(`Exams created: ${exam.title}, ${exam2.title}`);

  const perAttempts = [9, 8, 6, 7, 5, 10, 8, 7, 4, 9, 8, 6];
  for (let i = 0; i < students.length - 3; i++) {
    const st = students[i];
    const correct = perAttempts[i] ?? 6;
    const total = exam.questions.length;
    const answers = exam.questions.map((q, qi) => {
      const question = questions.find((x) => String(x._id) === String(q.questionId));
      let isCorrect = qi < correct;
      return {
        questionId: q.questionId,
        selectedIndex: question.type === 'MCQ' ? (isCorrect ? question.options.findIndex((o) => o.isCorrect) : 0) : null,
        textAnswer: question.type !== 'MCQ' ? (question.type === 'TF' ? (isCorrect ? String(question.correctAnswer) : isCorrect ? 'true' : 'false') : isCorrect ? question.correctAnswer : 'wrong') : '',
        isCorrect,
        marksAwarded: isCorrect ? q.marks : 0,
        skipped: false,
      };
    });
    const score = answers.reduce((s, a) => s + a.marksAwarded, 0);
    const totalMarks = exam.questions.reduce((s, q) => s + q.marks, 0);
    const submittedAt = new Date(Date.now() - (i + 1) * 3600 * 1000 * 3);
    await Attempt.create({
      exam: exam._id,
      student: st._id,
      institute: institute._id,
      answers,
      score,
      totalMarks,
      correctCount: correct,
      wrongCount: exam.questions.length - correct,
      skippedCount: 0,
      passed: score / totalMarks >= 0.4,
      status: 'submitted',
      startedAt: new Date(submittedAt.getTime() - 1000 * 60 * 15),
      submittedAt,
      timeTakenSec: 12 * 60 + (i * 37) % 240,
    });
  }

  await Announcement.create({
    institute: institute._id,
    title: 'Weekly test schedule updated',
    message: 'The HSC Physics & Chemistry weekly test will now start at 7:00 PM. Please be ready 10 minutes early.',
    audience: 'all',
  });
  await Announcement.create({
    institute: institute._id,
    title: 'Evening batch extra class',
    message: 'There will be an extra revision class this Sunday at 4:00 PM for the Evening Batch.',
    audience: 'batches',
    batches: [batchDocs['Evening Batch (HSC)']._id],
  });

  console.log('\n✓ Seed complete.');
  console.log('Admin login:   admin@prodigy.com  /  admin123');
  console.log('Student login: ayesha@student.com /  student123');
}

mongoose
  .connect(config.mongodbUri)
  .then(async () => {
    try {
      await seed();
    } catch (e) {
      console.error('Seed error:', e);
    } finally {
      await mongoose.disconnect();
      process.exit(0);
    }
  })
  .catch((e) => {
    console.error('DB connection error:', e.message);
    process.exit(1);
  });
