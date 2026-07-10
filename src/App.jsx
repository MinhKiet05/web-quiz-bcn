import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
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
  admin: '/admin/dashboard',
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

function WithLayout({ user, onLogout, children }) {
  return (
    <AppLayout user={user} onLogout={onLogout}>
      {children}
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
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to={defaultRoute} replace />
          ) : (
            <AppLayout user={user} onLogout={handleLogout}>
              <Login onLogin={handleLogin} loading={loading} error={error} />
            </AppLayout>
          )
        }
      />

      <Route
        path="/"
        element={<Navigate to={defaultRoute} replace />}
      />

      <Route
        path="/quiz-list"
        element={
          <WithLayout user={user} onLogout={handleLogout}>
            <QuizList />
          </WithLayout>
        }
      />

      <Route
        path="/leaderboard"
        element={
          <WithLayout user={user} onLogout={handleLogout}>
            <LeaderBoard />
          </WithLayout>
        }
      />

      <Route
        path="/history"
        element={
          <AuthGate user={user}>
            <AppLayout user={user} onLogout={handleLogout}>
              <History />
            </AppLayout>
          </AuthGate>
        }
      />

      <Route
        path="/quiz-manager"
        element={
          <AuthGate user={user} allowedRoles={[ 'editor', 'admin' ]}>
            <AppLayout user={user} onLogout={handleLogout}>
              <QuizManager />
            </AppLayout>
          </AuthGate>
        }
      />

      <Route
        path="/question-manager"
        element={
          <AuthGate user={user} allowedRoles={[ 'editor', 'admin' ]}>
            <AppLayout user={user} onLogout={handleLogout}>
              <QuestionManager />
            </AppLayout>
          </AuthGate>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <AuthGate user={user} allowedRoles={[ 'admin' ]}>
            <AppLayout user={user} onLogout={handleLogout}>
              <DashBoardAdmin />
            </AppLayout>
          </AuthGate>
        }
      />

      <Route
        path="/user-manager"
        element={
          <AuthGate user={user} allowedRoles={[ 'admin' ]}>
            <AppLayout user={user} onLogout={handleLogout}>
              <UserManager />
            </AppLayout>
          </AuthGate>
        }
      />

      <Route
        path="/user/dashboard"
        element={
          <AuthGate user={user}>
            <AppLayout user={user} onLogout={handleLogout}>
              <DashBoardUser />
            </AppLayout>
          </AuthGate>
        }
      />

      <Route path="*" element={<Navigate to={defaultRoute} replace />} />
    </Routes>
  );
}

export default App;
