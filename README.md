# ExamFlow

> B2B SaaS online exam & quiz management platform for coaching centers, educational institutes and training organizations. Inspired by Testmoz — built for Bangladesh.

ExamFlow lets institutes register, manage students in batches, build a reusable question bank, publish timed exams, auto-grade MCQ & True/False questions, and dive deep into analytics — all from a clean, premium dashboard.

## Tech Stack

| Layer | Tech |
| --- | --- |
| Frontend | React 18 · Vite 6 · Tailwind CSS · Recharts · React Router |
| Backend | Node.js · Express · Mongoose (MongoDB) |
| Auth | JWT with institute / student roles |
| Deploy | Vercel (client + serverless API) · MongoDB Atlas |

## Features

- **Landing page** with pricing (BDT) & testimonials
- **Institute registration** & login (JWT)
- **Student login** portal
- **Admin dashboard** — stat cards, exam scores over time chart, students by batch, recent exams, top students
- **Student management** — search, filter, pagination, add/edit/delete, bulk CSV import
- **Batches** — group students, restrict exams to a batch
- **Question bank** — MCQ, True/False, Short Answer with difficulty, subject, topic & marks
- **Exam builder** — two-panel drag-to-add canvas, reordering, per-question marks, settings (duration, schedule, pass mark, attempts, randomization, access control, result display)
- **Full-screen student exam interface** — live timer (red under 5 min), question navigator, bookmarking, auto-saved answers, auto-grading
- **Results page** — pass/fail hero, score breakdown, answer review, downloadable certificate
- **Reports & analytics** — KPIs, score distribution, pass/fail donut, per-question difficulty analysis, ranked student table, CSV export

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (Atlas URI, or local via MongoDB Compass)

### 1. Clone & install

```bash
git clone git@github.com:TanzirulIslam22/ExamFlow.git
cd ExamFlow
npm install
```

### 2. Configure environment

Copy `server/.env.example` to `server/.env` and fill in your MongoDB connection string:

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/examflow
JWT_SECRET=change_this_to_a_long_random_string
PORT=5000
CLIENT_URL=http://localhost:5173
```

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
4. Add environment variables: `MONGODB_URI`, `JWT_SECRET`.
5. Deploy. `/api/*` requests are handled by the serverless function; all other routes serve the React app.

## Project Structure

```
ExamFlow/
├── api/                  # Vercel serverless entry (wraps Express app)
├── server/               # Express + Mongoose API
│   ├── config/           # env config, DB connection
│   ├── middleware/       # JWT auth, error handlers
│   ├── models/           # Institute, Student, Batch, Question, Exam, Attempt, Announcement
│   ├── routes/           # REST endpoints
│   └── seed.js           # demo data
├── client/               # React + Vite + Tailwind
│   └── src/
│       ├── components/   # UI kit (Badge, Modal, Drawer, Charts…)
│       ├── context/      # Auth + Toast
│       ├── pages/        # Landing, admin pages, student pages
│       └── utils/        # formatters
└── vercel.json
```

## License

[MIT](./LICENSE) © 2026 Tanzirul Islam
