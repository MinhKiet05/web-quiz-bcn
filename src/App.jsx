import { useEffect, useState } from 'react';
import './App.css';
import AppLayout from './AppLayout';
import Login from './pages/login/Login';
import { supabase } from './lib/supabaseClient';

const AUTH_STORAGE_KEY = 'web-quiz-bcn-auth-user';

function readStoredUser() {
  try {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
}

function App() {
  const [user, setUser] = useState(() => readStoredUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

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
  };

  return (
    <AppLayout user={user} onLogout={handleLogout}>
      {!user ? <Login onLogin={handleLogin} loading={loading} error={error} /> : null}
    </AppLayout>
  );
}

export default App;
