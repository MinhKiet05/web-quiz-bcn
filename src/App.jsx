import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, Outlet } from 'react-router-dom';
import './App.css';
import AppLayout from './AppLayout';
import Login from './pages/login/Login';
import { supabase } from './lib/supabaseClient';
import QuizList from './pages/quizList/QuizList';
import LeaderBoard from './pages/leaderBoard/LeaderBoard';
import History from './pages/history/History';
import QuizManager from './pages/quizManager/QuizManager';
import QuestionManager from './pages/questionManager/QuestionManager';
import DashBoardAdmin from './pages/dashBoardAdmin/DashBoardAdmin';
import UserManager from './pages/userManager/UserManager';
import DashBoardUser from './pages/dashBoardUser/DashBoardUser';
import StartQuiz from './pages/startQuiz/StartQuiz';
import NotFound from './pages/notFound/NotFound';
import ExamineQuiz from './pages/examineQuiz/ExamineQuiz';
import ResultExamine from './pages/resultExamine/ResultExamine';
import ReviewExamine from './pages/reviewExamine/ReviewExamine';


import { Toaster } from 'sonner';
const AUTH_STORAGE_KEY = 'web-quiz-bcn-auth-user';

function readStoredUser() {
  try {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
}

const routeByRole = {
  admin: '/quiz-list',
  editor: '/quiz-list',
  student: '/quiz-list',
};

function AuthGate({ user, allowedRoles, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={routeByRole[user.role] ?? '/quiz-list'} replace />;
  }

  return children;
}

// Thay thế WithLayout bằng RootLayout sử dụng Outlet để giữ nguyên Sidebar
function RootLayout({ user, onLogout }) {
  return (
    <AppLayout user={user} onLogout={onLogout}>
      <Outlet />
    </AppLayout>
  );
}

function App() {
  const [user, setUser] = useState(() => readStoredUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const defaultRoute = useMemo(() => routeByRole[user?.role] ?? '/quiz-list', [user?.role]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (user && location.pathname === '/login') {
      navigate(defaultRoute, { replace: true });
    }
  }, [defaultRoute, location.pathname, navigate, user]);

  const handleLogin = async ({ mssv, password }) => {
    setLoading(true);
    setError('');

    try {
      const { data, error: rpcError } = await supabase.rpc('login_user', {
        p_mssv: mssv.trim(),
        p_password: password,
      });

      if (rpcError) {
        throw rpcError;
      }

      const profile = Array.isArray(data) ? data[0] : data;

      if (!profile) {
        throw new Error('MSSV hoặc mật khẩu không đúng.');
      }

      const normalizedUser = {
        ...profile,
        role: String(profile.role ?? 'student').toLowerCase(),
      };

      setUser(normalizedUser);
      navigate(routeByRole[normalizedUser.role] ?? '/quiz-list', { replace: true });
      return normalizedUser;
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : 'Đăng nhập thất bại.';
      setError(message);
      throw loginError;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setError('');
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* Cấu hình Toaster gốc nằm ở top-right và bật dark mode */}
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          // Tùy biến CSS inline hoặc gán class trực tiếp cho quả toast
          style: {
            backgroundColor: '#2E3856', // Màu Surface trùng màu Confirm Modal của bạn
            border: '1px solid #1E2541',  // Border tối
            color: '#ffffff',             // Màu chữ trắng chính
            borderRadius: '12px',         // Bo góc đồng bộ
          },
        }}
      />


      <Routes>
        <Route path="/quiz/do/:id" element={
          <AuthGate user={user}>
            <ExamineQuiz />
          </AuthGate>
        } />
        <Route path="/history/review/:id" element={
          <AuthGate user={user}>
            <ReviewExamine />
          </AuthGate>
        } />

        {/* Route cha bọc tất cả các trang, giữ AppLayout (Sidebar) cố định */}
        <Route element={<RootLayout user={user} onLogout={handleLogout} />}>

          <Route
            path="/login"
            element={
              user ? (
                <Navigate to={defaultRoute} replace />
              ) : (
                <Login onLogin={handleLogin} loading={loading} error={error} />
              )
            }
          />

          <Route
            path="/"
            element={<Navigate to={defaultRoute} replace />}
          />

          <Route
            path="/quiz-list"
            element={<QuizList />}
          />

          <Route
            path="/leaderboard"
            element={<LeaderBoard />}
          />
          <Route path="/result/:id" element={<AuthGate user={user}><ResultExamine /></AuthGate>} />
          <Route
            path="/history"
            element={
              <AuthGate user={user}>
                <History />
              </AuthGate>
            }
          />

          <Route
            path="/quiz-manager"
            element={
              <AuthGate user={user} allowedRoles={['editor', 'admin']}>
                <QuizManager />
              </AuthGate>
            }
          />

          <Route
            path="/question-manager"
            element={
              <AuthGate user={user} allowedRoles={['editor', 'admin']}>
                <QuestionManager />
              </AuthGate>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <AuthGate user={user} allowedRoles={['admin']}>
                <DashBoardAdmin />
              </AuthGate>
            }
          />

          <Route
            path="/user-manager"
            element={
              <AuthGate user={user} allowedRoles={['admin']}>
                <UserManager />
              </AuthGate>
            }
          />

          <Route
            path="/user/dashboard"
            element={
              <AuthGate user={user}>
                <DashBoardUser />
              </AuthGate>
            }
          />
          <Route
            path="/quiz/:id"
            element={
              <AuthGate user={user}>
                <StartQuiz />
              </AuthGate>
            }
          />
          <Route path="*" element={<NotFound />} />

        </Route>
      </Routes>
    </>
  );
}

export default App;