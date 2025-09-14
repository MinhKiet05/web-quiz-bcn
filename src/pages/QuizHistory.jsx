import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserQuizByWeek, getAvailableWeeks, calculateWeekScore } from '../services/userQuizService';
import { getQuizzesByWeek } from '../services/weekQuizService';
import QuizHistoryCard from '../components/QuizHistoryCard';
import './QuizHistory.css';

const QuizHistory = () => {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState('');
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [userQuizData, setUserQuizData] = useState({});
  const [weekQuizzes, setWeekQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weekScore, setWeekScore] = useState({ correct: 0, total: 0, percentage: 0 });

  // Lấy tuần hiện tại dựa trên thời gian
  const getCurrentWeek = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((now - startOfYear) / (24 * 60 * 60 * 1000) + startOfYear.getDay() + 1) / 7);
    return `week${weekNumber}`;
  };

  // Load dữ liệu ban đầu
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user || !user.username) {
        setError('Vui lòng đăng nhập để xem lịch sử quiz');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Lấy danh sách tuần có dữ liệu
        const weeks = await getAvailableWeeks(user.username);
        setAvailableWeeks(weeks);
        
        // Ưu tiên load tuần hiện tại
        const currentWeekKey = getCurrentWeek();
        let initialWeek = currentWeekKey; // Mặc định là tuần hiện tại
        
        // Nếu tuần hiện tại không có dữ liệu, chọn tuần gần nhất
        if (!weeks.includes(currentWeekKey)) {
          initialWeek = weeks[weeks.length - 1] || 'week1';
        }
        
        setCurrentWeek(initialWeek);
        
      } catch (err) {
        console.error('Lỗi khi load dữ liệu ban đầu:', err);
        setError('Có lỗi khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [user]);

  // Load dữ liệu quiz của tuần được chọn
  useEffect(() => {
    const loadWeekData = async () => {
      if (!currentWeek || !user || !user.username) return;

      try {
        setLoading(true);
        
        // Lấy dữ liệu quiz đã làm của user
        const userData = await getUserQuizByWeek(user.username, currentWeek);
        setUserQuizData(userData);
        
        // Lấy dữ liệu quiz gốc từ hệ thống
        const quizzes = await getQuizzesByWeek(currentWeek);
        setWeekQuizzes(quizzes);
        
        // Tính điểm số
        if (quizzes.length > 0) {
          const correctAnswers = {};
          quizzes.forEach(quiz => {
            correctAnswers[`Quiz${quiz.quizNumber}`] = quiz.correctAnswer;
          });
          const score = calculateWeekScore(userData, correctAnswers);
          setWeekScore(score);
        }
        
      } catch (err) {
        console.error('Lỗi khi load dữ liệu tuần:', err);
        setError('Có lỗi khi tải dữ liệu quiz');
      } finally {
        setLoading(false);
      }
    };

    loadWeekData();
  }, [currentWeek, user]);

  // Điều hướng tuần
  const navigateWeek = (direction) => {
    const currentIndex = availableWeeks.indexOf(currentWeek);
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = Math.max(0, currentIndex - 1);
    } else if (direction === 'next') {
      newIndex = Math.min(availableWeeks.length - 1, currentIndex + 1);
    } else if (direction === 'current') {
      const currentWeekKey = getCurrentWeek();
      if (availableWeeks.includes(currentWeekKey)) {
        setCurrentWeek(currentWeekKey);
        return;
      }
    }
    
    if (newIndex !== undefined && availableWeeks[newIndex]) {
      setCurrentWeek(availableWeeks[newIndex]);
    }
  };

  // Kiểm tra xem tuần đã kết thúc chưa
  const isWeekFinished = () => {
    if (weekQuizzes.length === 0) return false;
    const now = new Date();
    // Lấy endTime từ quiz đầu tiên (tất cả quiz trong tuần có cùng endTime)
    const endTime = weekQuizzes[0].endTime;
    if (!endTime) return false;
    const weekEndTime = endTime.toDate ? endTime.toDate() : new Date(endTime);
    return now > weekEndTime;
  };

  const isCurrentWeek = currentWeek === getCurrentWeek();
  const canGoPrev = availableWeeks.indexOf(currentWeek) > 0;
  const canGoNext = availableWeeks.indexOf(currentWeek) < availableWeeks.length - 1;
  const weekFinished = isWeekFinished();

  if (loading) {
    return (
      <div className="quiz-history-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải lịch sử quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-history-error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="quiz-history-container">
      <div className="quiz-history-content">
        
        {/* Header với navigation */}
        <div className="quiz-history-header">
          <h1>Quiz Đã Làm</h1>
          
                  <div className="week-navigation">
                      <div className="current-week-info">
              <span className="week-label">{currentWeek.replace('week', 'Tuần ')}</span>
            </div>
            <div className="navigation-row">
              <button 
                onClick={() => navigateWeek('prev')} 
                disabled={!canGoPrev}
                className="nav-btn prev"
              >
                ←Trước
              </button>
              <button 
                onClick={() => navigateWeek('current')} 
                disabled={isCurrentWeek}
                className="nav-btn current"
              >
                Hiện tại
              </button>
              <button 
                onClick={() => navigateWeek('next')} 
                disabled={!canGoNext}
                className="nav-btn next"
              >
                Sau→
              </button>
            </div>
            
            {/* Hiển thị thời gian Open và Close */}
            {weekQuizzes.length > 0 && (
              <div className="week-time-info">
                <div className="time-item">
                  <span className="time-label">Open:</span>
                  <span className="time-value">
                    {weekQuizzes[0].startTime ? 
                      (weekQuizzes[0].startTime.toDate ? 
                        weekQuizzes[0].startTime.toDate() : 
                        new Date(weekQuizzes[0].startTime)
                      ).toLocaleString('vi-VN', {
                        year: 'numeric',
                        month: '2-digit', 
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Không xác định'
                    }
                  </span>
                </div>
                <div className="time-item">
                  <span className="time-label">Close:</span>
                  <span className="time-value">
                    {weekQuizzes[0].endTime ? 
                      (weekQuizzes[0].endTime.toDate ? 
                        weekQuizzes[0].endTime.toDate() : 
                        new Date(weekQuizzes[0].endTime)
                      ).toLocaleString('vi-VN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit', 
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Không xác định'
                    }
                  </span>
                </div>
              </div>
            )}
            
            {/* Thống kê tổng kết được chuyển lên đây */}
            {weekScore.total > 0 && (
              <div className="week-summary-inline">
                <div className="summary-stats-inline">
                  <div className="stat-item-inline">
                    <span className="stat-label">Đã làm:</span>
                    <span className="stat-value">{weekScore.total}</span>
                  </div>
                  <div className="stat-item-inline">
                    <span className="stat-label">Đúng:</span>
                    <span className="stat-value correct">{weekFinished ? weekScore.correct : '-'}</span>
                  </div>
                  <div className="stat-item-inline">
                    <span className="stat-label">Tỷ lệ:</span>
                    <span className="stat-value percentage">{weekFinished ? `${weekScore.percentage}%` : '-%'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Danh sách quiz */}
        <div className="quiz-history-list">
          {weekQuizzes.length === 0 ? (
            <div className="no-quiz-message">
              <p>Không có quiz nào trong tuần này</p>
            </div>
          ) : (
            weekQuizzes.map((quiz) => {
              const userAnswer = userQuizData[`Quiz${quiz.quizNumber}`];
              const hasParticipated = userAnswer !== undefined;
              
              return (
                <QuizHistoryCard
                  key={quiz.quizNumber}
                  quiz={quiz}
                  userAnswer={userAnswer}
                  hasParticipated={hasParticipated}
                  weekKey={currentWeek}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizHistory;