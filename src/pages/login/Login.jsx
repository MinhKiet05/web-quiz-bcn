import React, { useState } from 'react';
import { Contact, Lock, EyeOff, Eye, LogIn } from 'lucide-react';
import styles from './Login.module.css';
import { toast } from 'sonner';

export default function Login({ onLogin, loading = false, error = '' }) {
  const [showPassword, setShowPassword] = useState(false);
  const [mssv, setMssv] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!onLogin) {
      return;
    }

    try {
      // Nhận dữ liệu user trả về từ hàm onLogin của component cha
      const userData = await onLogin({ mssv, password });
      
      // Trích xuất tên (giả sử dữ liệu trả về có trường full_name hoặc name)
      // Nếu không có, fallback về chữ "bạn"
      const userName = userData?.full_name || userData?.name || 'bạn';

      toast.success('Đăng nhập thành công!', {
        // Sử dụng backtick để chèn biến userName vào chuỗi
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
        {/* Header */}
        <h2 className={styles.title}>Đăng nhập</h2>
        <p className={styles.subtitle}>
          Vui lòng sử dụng tài khoản được Ban Công Nghệ cấp phát.
        </p>

        {error ? <p className={styles.errorMessage}>{error}</p> : null}

        {/* Form đăng nhập */}
        <form onSubmit={handleLogin} className={styles.form}>
          
          {/* Input MSSV */}
          <div className={styles.formGroup}>
            <label htmlFor="mssv" className={styles.label}>Mã số sinh viên (MSSV)</label>
            <div className={styles.inputWrapper}>
              <Contact className={styles.inputIcon} size={20} />
              <input
                id="mssv"
                type="text"
                placeholder="Nhập MSSV của bạn..."
                className={styles.input}
                value={mssv}
                onChange={(e) => setMssv(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
          </div>

          {/* Input Mật khẩu */}
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

          {/* Nút Submit */}
          <button type="submit" className={styles.submitButton} disabled={loading}>
            <span>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
            <LogIn size={20} />
          </button>

        </form>

        {/* Footer Note */}
        <div className={styles.divider}></div>
        <p className={styles.footerNote}>
          Lưu ý: Hệ thống không mở đăng ký tự do. Nếu quên hoặc chưa được cấp tài khoản, vui lòng liên hệ Ban Công Nghệ để được hỗ trợ.
        </p>
      </div>
    </div>
  );
}