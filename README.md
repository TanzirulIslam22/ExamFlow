# ExamFlow

> B2B SaaS online exam & quiz management platform for coaching centers, educational institutes and training organizations. Inspired by Testmoz — built for Bangladesh.

ExamFlow lets institutes register, manage students in batches, build a reusable question bank, publish timed exams, auto-grade MCQ, True/False & Short Answer questions, and dive deep into analytics — all from a clean, premium dashboard. Students sign in with email, Google or a phone-number OTP.

## Features

- **Landing page** with BDT pricing & testimonials
- **Authentication** — email/password, **Google sign-in**, **phone OTP** (Firebase), institute + student roles (JWT)
- **Admin dashboard** — stat cards, exam scores over time chart, students by batch, recent exams, top students
- **Student management** — search, filter, pagination, add/edit/delete, bulk CSV import
- **Batches** — group students, restrict exams to a batch
- **Question bank** — MCQ, True/False, Short Answer with difficulty, subject, topic & marks
- **Exam builder** — two-panel drag-to-add canvas, reordering, per-question marks, settings (duration, schedule, pass mark, attempts, randomization, access control, result display)
- **Full-screen student exam interface** — live timer (red under 5 min), question navigator, bookmarking, auto-saved answers, auto-grading
- **Results page** — pass/fail hero, score breakdown, answer review, downloadable certificate
- **Reports & analytics** — KPIs, score distribution, pass/fail donut, per-question difficulty analysis, ranked student table, CSV export

## Tech Stack

| Layer | Tech |
| --- | --- |
| Frontend | React 18 · Vite 6 · Tailwind CSS · Recharts · React Router |
| Backend | Node.js · Express · Mongoose (MongoDB) |
| Auth | JWT + Firebase Auth (Google, Phone OTP, Email) |
| Deploy | Vercel (client + serverless API) · MongoDB Atlas |

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (Atlas URI, or local via MongoDB Compass)
- Firebase project (for Google & phone login — optional, app works without it)

### 1. Clone & install

```bash
git clone git@github.com:TanzirulIslam22/ExamFlow.git
cd ExamFlow
npm install
```

### 2. Configure environment

**Server** — copy `server/.env.example` to `server/.env` and fill in:

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/examflow
JWT_SECRET=change_this_to_a_long_random_string
PORT=5000
CLIENT_URL=http://localhost:5173
FIREBASE_PROJECT_ID=your-firebase-project-id
```

**Client** — copy `client/.env.example` to `client/.env.local` and fill in your Firebase web app config (Firebase console → Project settings → Your apps → SDK setup):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

> In the Firebase console, enable **Google** and **Phone** sign-in methods under *Authentication → Sign-in method*.

### 3. Seed demo data (optional)

```bash
npm run seed
```

This creates a demo institute with students, batches, questions, a live exam and results:

- **Institute admin:** `admin@prodigy.com` / `admin123`
- **Student:** `ayesha@student.com` / `student123`

### 4. Run locally

```bash
npm run dev
```

- Client → http://localhost:5173
- API → http://localhost:5000/api

## Deployment (Vercel)

1. Push the repo to GitHub.
2. Import the repo in Vercel (framework preset: **Other**).
3. Set the build settings:
   - **Build command:** `npm run build`
   - **Output directory:** `client/dist`
4. Add environment variables (server): `MONGODB_URI`, `JWT_SECRET`, `FIREBASE_PROJECT_ID`.
5. Add environment variables (client): `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`.
6. Deploy. `/api/*` requests are handled by the serverless function; all other routes serve the React app.

## Project Structure

```
ExamFlow/
├── api/                  # Vercel serverless entry (wraps Express app)
├── server/               # Express + Mongoose API
│   ├── config/           # env config, DB connection
│   ├── middleware/       # JWT auth, error handlers
│   ├── models/           # Institute, Student, Batch, Question, Exam, Attempt, Announcement
│   ├── routes/           # REST endpoints
│   ├── utils/            # Firebase token verification, helpers
│   └── seed.js           # demo data
├── client/               # React + Vite + Tailwind
│   └── src/
│       ├── api/          # axios client
│       ├── components/   # UI kit (Badge, Modal, Drawer, Charts…)
│       ├── context/      # Auth + Toast
│       ├── pages/        # Landing, admin pages, student pages
│       ├── firebase.js   # Firebase client init
│       └── utils/        # formatters
└── vercel.json
```

## API Overview

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/institute/register` | Register an institute |
| POST | `/api/auth/institute/login` | Institute login (email) |
| POST | `/api/auth/student/login` | Student login (email) |
| POST | `/api/auth/firebase/google` | Verify Firebase Google ID token |
| POST | `/api/auth/firebase/phone` | Verify Firebase phone ID token |
| GET | `/api/institute/dashboard-stats` | Admin dashboard KPIs |
| GET | `/api/students` | Paginated student list |
| GET/POST | `/api/questions` | Question bank |
| POST | `/api/exams` · `/api/exams/:id/publish` | Create & publish exams |
| POST | `/api/student/exams/:id/attempt` | Submit an attempt (auto-graded) |
| GET | `/api/student/attempts/:id/result` | Attempt result |
| GET | `/api/analytics/*` | Reports, export CSV |

## License

[MIT](./LICENSE) © 2026 Tanzirul Islam
