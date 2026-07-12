import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Compass } from 'lucide-react';
import styles from './NotFound.module.css';

export default function NotFound() {
  const [countdown, setCountdown] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown === 0) {
      navigate('/quiz-list', { replace: true });
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, navigate]);

  return (
    <div className={styles.container}>
      <div className={styles.glowEffect}></div>
      
      <div className={styles.contentCard}>
        <div className={styles.iconWrapper}>
          <Compass size={64} className={styles.compassIcon} />
        </div>
        
        <h1 className={styles.errorCode}>404</h1>
        <h2 className={styles.title}>Không tìm thấy trang</h2>
        <p className={styles.description}>
          Có vẻ như đường dẫn bạn đang truy cập không tồn tại, đã bị gỡ bỏ hoặc bạn không có quyền truy cập.
        </p>

        <div className={styles.actionGroup}>
          <button className={styles.btnBack} onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
            <span>Quay lại</span>
          </button>
          
          <button className={styles.btnHome} onClick={() => navigate('/quiz-list', { replace: true })}>
            <Home size={18} />
            <span>Về trang chủ</span>
          </button>
        </div>

        <p className={styles.countdownText}>
          Tự động chuyển về trang chủ sau <span>{countdown}</span> giây...
        </p>
      </div>
    </div>
  );
}