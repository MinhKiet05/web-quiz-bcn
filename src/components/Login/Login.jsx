import React, { useState, useEffect } from 'react';
import { loginUser, registerUser, checkUsernameExists } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';

const Login = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('login'); // 'login' hoặc 'register'
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState({
    mssv: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { login } = useAuth();

  // Clear form khi component mount
  useEffect(() => {
    setLoginData({
      username: '',
      password: ''
    });
    setRegisterData({
      mssv: '',
      password: '',
      confirmPassword: '',
      name: ''
    });
    setError('');
    setSuccess('');
  }, []);

  const handleLoginInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleRegisterInputChange = (e) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    
    if (!loginData.username.trim() || !loginData.password.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userData = await loginUser(loginData.username.trim(), loginData.password);
      
      if (userData) {
        login(userData);
        // Clear form sau khi đăng nhập thành công
        setLoginData({
          username: '',
          password: ''
        });
        if (onClose) onClose();
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không đúng');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    
    const { mssv, password, confirmPassword, name } = registerData;
    
    // Validation
    if (!mssv.trim() || !password.trim() || !confirmPassword.trim() || !name.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin bắt buộc');
      return;
    }
    
    // Validate MSSV format (example: only numbers)
    if (!/^\d+$/.test(mssv.trim())) {
      setError('MSSV chỉ được chứa số');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    
    if (mssv.length < 3) {
      setError('MSSV phải có ít nhất 3 ký tự');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Kiểm tra MSSV đã tồn tại chưa
      const usernameExists = await checkUsernameExists(mssv.trim());
      if (usernameExists) {
        setError('MSSV đã được đăng ký. Vui lòng kiểm tra lại.');
        setLoading(false);
        return;
      }
      
      const userData = await registerUser({
        username: mssv.trim(),
        password: password,
        name: name.trim(),
        role: 'student' // Mặc định role student, admin sẽ cấp quyền sau
      });
      
      if (userData) {
        setSuccess('Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.');
        // Reset form
        setRegisterData({
          mssv: '',
          password: '',
          confirmPassword: '',
          name: ''
        });
        // Chuyển về tab đăng nhập sau 2 giây
        setTimeout(() => {
          setActiveTab('login');
          setSuccess('');
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-overlay" onClick={onClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <div className="login-header">
          <h2>🔐 {activeTab === 'login' ? 'Đăng nhập' : 'Đăng ký'}</h2>
          <button className="login-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('login');
              setError('');
              setSuccess('');
              // Clear forms khi chuyển tab
              setLoginData({ username: '', password: '' });
              setRegisterData({ mssv: '', password: '', confirmPassword: '', name: '' });
            }}
            disabled={loading}
          >
            Đăng nhập
          </button>
          <button 
            className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('register');
              setError('');
              setSuccess('');
              // Clear forms khi chuyển tab
              setLoginData({ username: '', password: '' });
              setRegisterData({ mssv: '', password: '', confirmPassword: '', name: '' });
            }}
            disabled={loading}
          >
            Đăng ký
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="login-error">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="login-success">
            ✅ {success}
          </div>
        )}

        {/* Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="login-username">MSSV:</label>
              <input
                type="text"
                id="login-username"
                name="username"
                value={loginData.username}
                onChange={handleLoginInputChange}
                placeholder="Nhập mã số sinh viên"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Mật khẩu:</label>
              <input
                type="password"
                id="login-password"
                name="password"
                value={loginData.password}
                onChange={handleLoginInputChange}
                placeholder="Nhập mật khẩu"
                required
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className="login-submit-btn"
              disabled={loading}
            >
              {loading ? '🔄 Đang đăng nhập...' : '🚀 Đăng nhập'}
            </button>
          </form>
        )}

        {/* Register Form */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="register-name">Tên hiển thị: <span className="required">*</span></label>
              <input
                type="text"
                id="register-name"
                name="name"
                value={registerData.name}
                onChange={handleRegisterInputChange}
                placeholder="Nhập tên hiển thị của bạn"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-mssv">MSSV: <span className="required">*</span></label>
              <input
                type="text"
                id="register-mssv"
                name="mssv"
                value={registerData.mssv}
                onChange={handleRegisterInputChange}
                placeholder="Nhập mã số sinh viên (chỉ số)"
                required
                disabled={loading}
                pattern="[0-9]*"
                title="MSSV chỉ được chứa số"
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-password">Mật khẩu: <span className="required">*</span></label>
              <input
                type="password"
                id="register-password"
                name="password"
                value={registerData.password}
                onChange={handleRegisterInputChange}
                placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                required
                disabled={loading}
                minLength="6"
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-confirm-password">Xác nhận mật khẩu: <span className="required">*</span></label>
              <input
                type="password"
                id="register-confirm-password"
                name="confirmPassword"
                value={registerData.confirmPassword}
                onChange={handleRegisterInputChange}
                placeholder="Nhập lại mật khẩu"
                required
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className="login-submit-btn register-btn"
              disabled={loading}
            >
              {loading ? '🔄 Đang đăng ký...' : '📝 Đăng ký'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
