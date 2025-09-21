import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Login from '../../components/Login/Login';
import './Rules.css';

const Rules = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="rules-container">
      {!user && (
        <div className="rules-warning">
          <p>Hãy đăng nhập để trải nghiệm đầy đủ tính năng!</p>
        </div>
      )}
      
      <div className="rules-content">
        <h2 className="rules-header">
          {user ? `Xin chào ` : '📋 Thể lệ Quiz Hàng Tuần'}
          {user && <span className="gradient-text">{user.name}</span>}
          {user && ' !'}
        </h2>
        
        <div className="rules-intro">
          <p className="rules-intro-text">
            Ngoài những buổi <b>hướng dẫn C/C++</b> do <b>Ban Công Nghệ</b> tổ chức,
            chúng mình sẽ có thêm một hoạt động thú vị giúp các bạn củng cố kiến thức C/C++:
          </p>
          <p className="rules-slogan">
            <span className='shiny-text'>Quiz Hàng Tuần</span>
          </p>
        </div>

        <div className="rules-section">
          <h3>Thể lệ</h3>
          <ul>
            <li>Mỗi tuần có <b>5 câu quiz</b> (từ dễ → khó).</li>
            <li>Câu 1 → 5 đều là <b>Trắc nghiệm</b>.</li>
          </ul>
        </div>

        <div className="rules-section">
          <h3>Cách tính điểm</h3>
          <ul>
            <li>Mỗi câu đúng sẽ được điểm tương ứng
              (VD: Quiz 1 = 1 điểm, Quiz 5 = 5 điểm).</li>
            <li><b>Tổng điểm</b> các câu = điểm tuần của bạn.</li>
            <li><b>Sau khi quiz kết thúc</b>: Công bố đáp án + Bảng xếp hạng.</li>
          </ul>
        </div>

        <div className="rewards-section">
          <h3>Phần thưởng</h3>
          <p>Ban Công Nghệ sẽ tuyên dương <b>Top 3 bạn cao điểm nhất tuần</b>:</p>
          <ul>
            <li>🥇 Top 1: <b>10 Coins</b></li>
            <li>🥈 Top 2: <b>6 Coins</b></li>
            <li>🥉 Top 3: <b>3 Coins</b></li>
          </ul>
        </div>

        <div className="notes-section">
          <h3>Lưu ý</h3>
          <ul>
            <li>Mỗi tuần chỉ có duy nhất <b>1 Top 1, 1 Top 2, 1 Top 3</b>.</li>
            <li>Nếu có nhiều bạn bằng điểm → <b>xét theo thời gian nộp</b>: ai nộp sớm hơn sẽ được xếp hạng cao hơn.</li>
          </ul>
        </div>

        <div className="contact-note">
          <p>
            Khi vào Top, các bạn nhắn <b>Tường Vân (khóa bạc)</b> để nhận thưởng nha
          </p>
        </div>

        {user && (
          <div className="start-quiz-section">
            <button 
              className="start-quiz-btn" 
              onClick={() => navigate('/')}
            >
              Bắt đầu Quiz
            </button>
            <p style={{ fontSize: '14px', opacity: 0.8, marginTop: '10px' }}>
              Chúc bạn đạt điểm cao!
            </p>
          </div>
        )}

        {!user && (
          <div className="login-prompt">
            <button 
              className="login-btn-rules"
              onClick={() => setShowLogin(true)}
            >
              Đăng nhập ngay
            </button>
            <p style={{ fontSize: '17px', marginBottom: '8px' }}>
              Đăng nhập để tham gia các quiz và hoạt động thú vị!
            </p>
            <p style={{ fontSize: '15px', opacity: 0.8 }}>
              Bạn sẽ có thể tham gia quiz hàng tuần và nhận coins thưởng
            </p>
          </div>
        )}
      </div>
      
      {/* Login Modal */}
      {showLogin && (
        <Login onClose={() => setShowLogin(false)} />
      )}
    </div>
  );
};

export default Rules;