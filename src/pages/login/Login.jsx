import React, { useState } from 'react';
import { Contact, Lock, EyeOff, Eye, LogIn } from 'lucide-react';
import styles from './Login.module.css';
import { toast } from 'sonner';

export default function Login({ onLogin, loading = false, error = '' }) {
  const [showPassword, setShowPassword] = useState(false);
  // 1. Đổi state mssv thành email
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!onLogin) {
      return;
    }

    try {
      // 2. Truyền email thay vì mssv
      const userData = await onLogin({ email, password });
      
      const userName = userData?.full_name || userData?.name || 'bạn';

      toast.success('Đăng nhập thành công!', {
        description: `Chào mừng ${userName} quay trở lại hệ thống.`,
      });
    } catch {
      // The parent component already stores and renders the error message.
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.glowEffect}></div>
      
      <div className={styles.loginCard}>
        <h2 className={styles.title}>Đăng nhập</h2>
        <p className={styles.subtitle}>
          Vui lòng sử dụng tài khoản được Ban Công Nghệ cấp phát.
        </p>

        {error ? <p className={styles.errorMessage}>{error}</p> : null}

        <form onSubmit={handleLogin} className={styles.form}>
          
          {/* 3. Đổi input MSSV thành input Email */}
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Địa chỉ Email</label>
            <div className={styles.inputWrapper}>
              <Contact className={styles.inputIcon} size={20} />
              <input
                id="email"
                type="email"
                placeholder="Nhập email của bạn..."
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Input Mật khẩu giữ nguyên */}
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>Mật khẩu</label>
            <div className={styles.inputWrapper}>
              <Lock className={styles.inputIcon} size={20} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu..."
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button 
                type="button" 
                className={styles.eyeButton}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" className={styles.submitButton} disabled={loading}>
            <span>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
            <LogIn size={20} />
          </button>

        </form>

        <div className={styles.divider}></div>
        <p className={styles.footerNote}>
          Lưu ý: Hệ thống không mở đăng ký tự do. Nếu quên hoặc chưa được cấp tài khoản, vui lòng liên hệ Ban Công Nghệ để được hỗ trợ.
        </p>
      </div>
    </div>
  );
}