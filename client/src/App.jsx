import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import Students from './pages/admin/Students.jsx';
import Batches from './pages/admin/Batches.jsx';
import QuestionBank from './pages/admin/QuestionBank.jsx';
import Exams from './pages/admin/Exams.jsx';
import ExamBuilder from './pages/admin/ExamBuilder.jsx';
import Reports from './pages/admin/Reports.jsx';
import Announcements from './pages/admin/Announcements.jsx';
import Settings from './pages/admin/Settings.jsx';
import StudentLayout from './pages/student/StudentLayout.jsx';
import StudentHome from './pages/student/StudentHome.jsx';
import StudentResults from './pages/student/StudentResults.jsx';
import StudentExam from './pages/student/StudentExam.jsx';
import StudentResultView from './pages/student/StudentResult.jsx';
import { useAuth } from './context/AuthContext.jsx';

function RequireRole({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={user.role === 'institute' ? '/admin' : '/student'} replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={user ? <Navigate to={user.role === 'institute' ? '/admin' : '/student'} replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/admin" replace /> : <Register />} />

      <Route
        path="/admin"
        element={
          <RequireRole role="institute">
            <AdminLayout />
          </RequireRole>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="batches" element={<Batches />} />
        <Route path="questions" element={<QuestionBank />} />
        <Route path="exams" element={<Exams />} />
        <Route path="exams/new" element={<ExamBuilder />} />
        <Route path="exams/:id/edit" element={<ExamBuilder />} />
        <Route path="reports" element={<Reports />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route
        path="/student"
        element={
          <RequireRole role="student">
            <StudentLayout />
          </RequireRole>
        }
      >
        <Route index element={<StudentHome />} />
        <Route path="results" element={<StudentResults />} />
      </Route>

      <Route
        path="/exam/:id"
        element={
          <RequireRole role="student">
            <StudentExam />
          </RequireRole>
        }
      />
      <Route
        path="/result/:attemptId"
        element={
          <RequireRole role="student">
            <StudentResultView />
          </RequireRole>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
