import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import ActivateAccount from './pages/ActivateAccount';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBatches from './pages/admin/AdminBatches';
import AdminSubjects from './pages/admin/AdminSubjects';
import AdminTimetable from './pages/admin/AdminTimetable';
import CommonPosts from './components/CommonPosts';
import AdminUsers from './pages/admin/AdminUsers';
import AiTimetableGenerator from './pages/admin/AiTimetableGenerator';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import FacultyAttendance from './pages/faculty/FacultyAttendance';
import FacultyMarks from './pages/faculty/FacultyMarks';
import FacultyTimetable from './pages/faculty/FacultyTimetable';
import FacultyMentorship from './pages/faculty/FacultyMentorship';
import FacultyDisputes from './pages/faculty/FacultyDisputes';

import StudentDashboard from './pages/student/StudentDashboard';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentMarks from './pages/student/StudentMarks';
import StudentTimetable from './pages/student/StudentTimetable';
import StudentDisputes from './pages/student/StudentDisputes';
import icons from './components/Icons';
import './App.css';

// Sidebar nav items per role — using SVG icons
const adminNav = [
  { path: '/admin', icon: icons.dashboard, label: 'Dashboard' },
  { path: '/admin/batches', icon: icons.batch, label: 'Batches' },
  { path: '/admin/subjects', icon: icons.grades, label: 'Subjects' },
  { path: '/admin/users', icon: icons.users, label: 'Users' },
  { path: '/admin/timetable', icon: icons.calendar, label: 'Timetable' },
  { path: '/admin/ai-timetable', icon: icons.sparkles, label: 'AI Generator' },
  { path: '/admin/posts', icon: icons.megaphone, label: 'Posts' },
];

const facultyNav = [
  { path: '/faculty', icon: icons.dashboard, label: 'Dashboard' },
  { path: '/faculty/attendance', icon: icons.check, label: 'Attendance' },
  { path: '/faculty/mentorship', icon: icons.users, label: 'Mentorship' },
  { path: '/faculty/marks', icon: icons.grades, label: 'Marks' },
  { path: '/faculty/disputes', icon: icons.alert, label: 'Disputes' },
  { path: '/faculty/timetable', icon: icons.calendar, label: 'Timetable' },
  { path: '/faculty/posts', icon: icons.megaphone, label: 'Posts' },
];

const studentNav = [
  { path: '/student', icon: icons.dashboard, label: 'Dashboard' },
  { path: '/student/attendance', icon: icons.check, label: 'Attendance' },
  { path: '/student/timetable', icon: icons.calendar, label: 'Timetable' },
  { path: '/student/marks', icon: icons.grades, label: 'Marks' },
  { path: '/student/disputes', icon: icons.alert, label: 'Disputes' },
  { path: '/student/posts', icon: icons.megaphone, label: 'Posts' },
];

// Smart redirect based on stored role
function SmartRedirect() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user) return <Navigate to="/login" replace />;
  switch (user.role) {
    case 'ADMIN': return <Navigate to="/admin" replace />;
    case 'FACULTY': return <Navigate to="/faculty" replace />;
    case 'STUDENT': return <Navigate to="/student" replace />;
    default: return <Navigate to="/login" replace />;
  }
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/activate" element={<ActivateAccount />} />

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <DashboardLayout role="ADMIN" navItems={adminNav} />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="batches" element={<AdminBatches />} />
          <Route path="subjects" element={<AdminSubjects />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="timetable" element={<AdminTimetable />} />
          <Route path="ai-timetable" element={<AiTimetableGenerator />} />
          <Route path="posts" element={<CommonPosts role="ADMIN" />} />
        </Route>

        <Route
          path="/faculty/*"
          element={
            <ProtectedRoute allowedRoles={['FACULTY']}>
              <DashboardLayout role="FACULTY" navItems={facultyNav} />
            </ProtectedRoute>
          }
        >
          <Route index element={<FacultyDashboard />} />
          <Route path="attendance" element={<FacultyAttendance />} />
          <Route path="marks" element={<FacultyMarks />} />
          <Route path="mentorship" element={<FacultyMentorship />} />
          <Route path="disputes" element={<FacultyDisputes />} />
          <Route path="timetable" element={<FacultyTimetable />} />
          <Route path="posts" element={<CommonPosts role="FACULTY" />} />
        </Route>

        <Route
          path="/student/*"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <DashboardLayout role="STUDENT" navItems={studentNav} />
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentDashboard />} />
          <Route path="attendance" element={<StudentAttendance />} />
          <Route path="marks" element={<StudentMarks />} />
          <Route path="disputes" element={<StudentDisputes />} />
          <Route path="timetable" element={<StudentTimetable />} />
          <Route path="posts" element={<CommonPosts role="STUDENT" />} />
        </Route>

        <Route path="*" element={<SmartRedirect />} />
      </Routes>
    </Router>
  );
}

export default App;
