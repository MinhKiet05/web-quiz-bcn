import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserQuizByWeek, getAllAvailableWeeks, calculateWeekScore } from '../../services/userQuizService';
import { getQuizzesByWeek } from '../../services/weekQuizService';
import QuizHistoryCard from '../../components/QuizHistoryCard';
import './QuizHistory.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
const QuizHistory = () => {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState('');
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [userQuizData, setUserQuizData] = useState({});
  const [weekQuizzes, setWeekQuizzes] = useState([]);
  const [allWeekQuizzes, setAllWeekQuizzes] = useState([]); // Thêm state để lưu tất cả quiz data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weekScore, setWeekScore] = useState({ correct: 0, total: 0, percentage: 0 });

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
        const weeks = await getAllAvailableWeeks();
        setAvailableWeeks(weeks);
        
        // Load quiz data cho tất cả các tuần để có thể filter
        const allQuizzes = [];
        for (const weekId of weeks) {
          try {
            const weekData = await getQuizzesByWeek(weekId);
            allQuizzes.push(...weekData);
          } catch (error) {
            console.error(`Error loading quiz data for ${weekId}:`, error);
          }
        }
        setAllWeekQuizzes(allQuizzes);
        
        // Hiển thị tuần lớn nhất có sẵn khi load trang
        let initialWeek = 'week1'; // Default fallback
        
        if (weeks.length > 0) {
          // Luôn hiển thị tuần lớn nhất (tuần cuối cùng trong danh sách)
          initialWeek = weeks[weeks.length - 1];
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
          
          // Tính tổng điểm dựa trên quiz number (Quiz1=1 điểm, Quiz5=5 điểm)
          let totalPoints = 0;
          let earnedPoints = 0;
          
          for (const [quizKey, userAnswer] of Object.entries(userData)) {
            const quizNumber = parseInt(quizKey.replace('Quiz', ''));
            if (!isNaN(quizNumber) && correctAnswers[quizKey] !== undefined) {
              totalPoints += quizNumber; // Điểm tối đa của quiz = số quiz
              if (userAnswer === correctAnswers[quizKey]) {
                earnedPoints += quizNumber; // Điểm đạt được nếu đúng
              }
            }
          }
          
          setWeekScore({
            ...score,
            totalPoints, // Tổng điểm tối đa có thể đạt
            earnedPoints // Tổng điểm thực tế đạt được
          });
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

  const canGoPrev = availableWeeks.indexOf(currentWeek) > 0;
  const canGoNext = availableWeeks.indexOf(currentWeek) < availableWeeks.length - 1;
  const weekFinished = isWeekFinished();

  if (loading) {
    return (
      <div className="quiz-history-loading">
        <div className="loading-spinner"><FontAwesomeIcon icon={faSpinner} spin /></div>
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
              <label htmlFor="week-select" className="week-select-label">Chọn tuần:</label>
              <select 
                id="week-select"
                value={currentWeek}
                onChange={(e) => setCurrentWeek(e.target.value)}
                className={`week-select ${(() => {
                  // Xác định class cho select dựa trên tuần hiện tại
                  const weekQuizData = allWeekQuizzes.find(quiz => quiz.weekId === currentWeek);
                  const userWeekData = userQuizData[currentWeek] || {};
                  const hasUserAnswers = Object.keys(userWeekData).length > 0;
                  
                  if (weekQuizData && weekQuizData.startTime && weekQuizData.endTime) {
                    const now = new Date();
                    const startTime = weekQuizData.startTime.toDate ? weekQuizData.startTime.toDate() : new Date(weekQuizData.startTime);
                    const endTime = weekQuizData.endTime.toDate ? weekQuizData.endTime.toDate() : new Date(weekQuizData.endTime);
                    
                    if (now > endTime) {
                      if (hasUserAnswers) {
                        // Tính điểm để xác định đúng/sai với logic mới
                        const correctAnswers = {};
                        const weekQuizzes = allWeekQuizzes.filter(q => q.weekId === currentWeek);
                        weekQuizzes.forEach(quiz => {
                          correctAnswers[`Quiz${quiz.quizNumber}`] = quiz.correctAnswer;
                        });
                        
                        let earnedPoints = 0;
                        let totalPoints = 0;
                        for (const [quizKey, userAnswer] of Object.entries(userWeekData)) {
                          const quizNumber = parseInt(quizKey.replace('Quiz', ''));
                          if (!isNaN(quizNumber) && correctAnswers[quizKey] !== undefined) {
                            totalPoints += quizNumber;
                            if (userAnswer === correctAnswers[quizKey]) {
                              earnedPoints += quizNumber;
                            }
                          }
                        }
                        
                        const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
                        return percentage >= 50 ? 'week-finished-correct' : 'week-finished-incorrect';
                      } else {
                        return 'week-finished-incorrect';
                      }
                    } else if (now >= startTime && now <= endTime) {
                      return hasUserAnswers ? 'week-in-progress-done' : 'week-in-progress-not-done';
                    } else {
                      return 'week-not-started';
                    }
                  }
                  return 'week-not-started';
                })()}`}
              >
                {(() => {
                  // Nếu allWeekQuizzes chưa load xong, hiển thị tất cả tuần có sẵn
                  if (allWeekQuizzes.length === 0) {
                    return availableWeeks.map(weekId => (
                      <option key={weekId} value={weekId}>
                        {weekId.replace('week', 'Tuần ')}
                      </option>
                    ));
                  }
                  
                  const filteredWeeks = availableWeeks.filter(weekId => {
                    // Lọc các tuần có startTime <= hiện tại
                    // Thử nhiều cách để tìm quiz của tuần này
                    const weekNumber = weekId.replace('week', ''); // 'week1' -> '1'
                    
                    const weekQuizzes = allWeekQuizzes.filter(quiz => {
                      // Thử các cách match khác nhau
                      const matchWeekId = quiz.weekId === weekId;
                      const matchWeek = quiz.week === weekId || quiz.week === weekNumber;
                      const matchTitle = quiz.title && quiz.title.includes(weekNumber);
                      const matchQuizNumber = quiz.quizNumber && quiz.quizNumber.toString().startsWith(weekNumber);
                      const matchId = quiz.id && quiz.id.includes(weekId);
                      
                      return matchWeekId || matchWeek || matchTitle || matchQuizNumber || matchId;
                    });
                    
                    if (weekQuizzes.length === 0) {
                      return false;
                    }
                    
                    const firstQuiz = weekQuizzes[0];
                    if (!firstQuiz.startTime) {
                      return false;
                    }
                    
                    const now = new Date();
                    const startTime = firstQuiz.startTime.toDate ? firstQuiz.startTime.toDate() : new Date(firstQuiz.startTime);
                    return startTime <= now;
                  });
                  
                  // Fallback: nếu không có tuần nào được filter, hiển thị tuần đầu tiên
                  const weeksToShow = filteredWeeks.length > 0 ? filteredWeeks : availableWeeks.slice(0, 1);
                  
                  return weeksToShow.map(weekId => (
                    <option key={weekId} value={weekId}>
                      {weekId.replace('week', 'Tuần ')}
                    </option>
                  ));
                })()}
              </select>
            </div>
            <div className="navigation-row">
              <button 
                onClick={() => navigateWeek('prev')} 
                disabled={!canGoPrev}
                className="nav-btn prev"
              >
                ← Trước
              </button>
              <button 
                onClick={() => navigateWeek('next')} 
                disabled={!canGoNext}
                className="nav-btn next"
              >
                Sau →
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
                    <span className="stat-label">% Đúng:</span>
                    <span className="stat-value percentage">
                      {weekFinished ? `${Math.round(weekScore.correct / weekScore.total * 100) || 0}%` : '-'}
                    </span>
                  </div>
                  <div className="stat-item-inline">
                    <span className="stat-label">Tổng:</span>
                    <span className="stat-value percentage">
                      {weekFinished ? `${weekScore.earnedPoints || 0}đ` : '-'}
                    </span>
                  </div>
                </div>
                
                {/* Thời gian nộp bài ở dòng riêng */}
                {userQuizData.thoiGian && (
                  <div className="submission-time-row">
                    <span className="stat-label">Nộp bài:</span>
                    <span className="stat-value time">
                      ⏰ {(userQuizData.thoiGian.toDate ? 
                        userQuizData.thoiGian.toDate() : 
                        new Date(userQuizData.thoiGian)
                      ).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric', 
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </span>
                  </div>
                )}
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