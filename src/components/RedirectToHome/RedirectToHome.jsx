import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RedirectToHome.css';

const RedirectToHome = ({ message, reason }) => {
  const [countdown, setCountdown] = useState(3);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="redirect-container">
      <div className="redirect-content">
        <div className="redirect-icon">🏠</div>
        <h2 className="redirect-title">{message || 'Chuyển hướng về trang chủ'}</h2>
        <p className="redirect-reason">{reason || 'Đang chuyển hướng...'}</p>
        <div className="countdown-container">
          <div className="countdown-circle">
            <span className="countdown-number">{countdown}</span>
          </div>
          <p className="countdown-text">Chuyển về trang chủ sau {countdown} giây</p>
        </div>
        <button 
          className="redirect-btn" 
          onClick={() => navigate('/')}
        >
          Về trang chủ ngay
        </button>
      </div>
    </div>
  );
};

export default RedirectToHome;