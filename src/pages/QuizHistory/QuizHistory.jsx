import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserQuizByWeek, getAllAvailableWeeks, calculateWeekScore } from '../../services/userQuizService';
import { getQuizzesByWeek } from '../../services/weekQuizService';
import QuizHistoryCard from '../../components/QuizHistoryCard/QuizHistoryCard';
import './QuizHistory.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useSearchParams } from 'react-router-dom';
const QuizHistory = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [currentWeek, setCurrentWeek] = useState('');
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [userQuizData, setUserQuizData] = useState({});
  const [weekQuizzes, setWeekQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekDataLoading, setWeekDataLoading] = useState(false);
  const [error, setError] = useState('');
  const [weekScore, setWeekScore] = useState({ correct: 0, total: 0, percentage: 0 });
  const [weeksLoaded, setWeeksLoaded] = useState(false); // Cache flag cho weeks

  // Load dữ liệu ban đầu
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user || !user.username) {
        setError('Vui lòng đăng nhập để xem lịch sử quiz');
        setLoading(false);
        return;
      }

      // Chỉ load weeks nếu chưa load
      if (weeksLoaded) return;

      try {
        setLoading(true);
        
        // Lấy danh sách tuần có dữ liệu
        const weeks = await getAllAvailableWeeks();
        setAvailableWeeks(weeks);
        setWeeksLoaded(true);
        
        // Check if there's a week parameter in URL
        const weekParam = searchParams.get('week');
        let initialWeek = 'week1'; // Default fallback
        
        if (weekParam && weeks.includes(weekParam)) {
          // Use week from URL if it exists and is valid
          initialWeek = weekParam;
        } else if (weeks.length > 0) {
          // Otherwise, show the latest week (last in the list)
          initialWeek = weeks[weeks.length - 1];
        }
        
        setCurrentWeek(initialWeek);
        
      } catch {
        setError('Có lỗi khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [user, weeksLoaded, searchParams]);

  // Load dữ liệu quiz của tuần được chọn
  useEffect(() => {
    const loadWeekData = async () => {
      if (!currentWeek || !user || !user.username) return;

      try {
        setWeekDataLoading(true);
        
        // Load song song user data và quiz data
        const [userData, quizzes] = await Promise.all([
          getUserQuizByWeek(user.username, currentWeek),
          getQuizzesByWeek(currentWeek)
        ]);
        
        setUserQuizData(userData);
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
        
      } catch {
        setError('Có lỗi khi tải dữ liệu quiz');
      } finally {
        setWeekDataLoading(false);
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

  // Kiểm tra xem tuần đã kết thúc chưa (cache với useMemo)
  const isWeekFinished = useMemo(() => {
    if (weekQuizzes.length === 0) return false;
    const now = new Date();
    // Lấy endTime từ quiz đầu tiên (tất cả quiz trong tuần có cùng endTime)
    const endTime = weekQuizzes[0].endTime;
    if (!endTime) return false;
    const weekEndTime = endTime.toDate ? endTime.toDate() : new Date(endTime);
    return now > weekEndTime;
  }, [weekQuizzes]);

  const canGoPrev = availableWeeks.indexOf(currentWeek) > 0;
  const canGoNext = availableWeeks.indexOf(currentWeek) < availableWeeks.length - 1;
    const weekFinished = isWeekFinished;  if (loading) {
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
          <h1>Lịch sử Quiz</h1>
          
          <div className="week-navigation">
            <div className="current-week-info">
              <label htmlFor="week-select" className="week-select-label">Chọn tuần:</label>
              <select 
                id="week-select"
                value={currentWeek}
                onChange={(e) => setCurrentWeek(e.target.value)}
                style={(() => {
                  // Force inline style với !important không work, dùng cách khác
                  const userWeekData = userQuizData || {};
                  const hasUserAnswers = Object.keys(userWeekData).length > 0;
                  
                  // Check if this is an old week that user hasn't participated
                  if (weekQuizzes.length > 0 && weekQuizzes[0].endTime) {
                    const now = new Date();
                    const endTime = weekQuizzes[0].endTime.toDate ? weekQuizzes[0].endTime.toDate() : new Date(weekQuizzes[0].endTime);
                    
                    if (now > endTime && !hasUserAnswers) {
                      return {
                        backgroundColor: '#e2e3e5',
                        color: '#6c757d',
                        borderColor: '#ced4da',
                        borderWidth: '2px',
                        borderStyle: 'solid'
                      };
                    }
                  }
                  return {};
                })()}
                className={`week-select ${(() => {
                  // Xác định class cho select dựa trên tuần hiện tại  
                  const userWeekData = userQuizData || {};
                  const hasUserAnswers = Object.keys(userWeekData).length > 0;
                  
                  if (weekQuizzes.length > 0 && weekQuizzes[0].startTime && weekQuizzes[0].endTime) {
                    const now = new Date();
                    const startTime = weekQuizzes[0].startTime.toDate ? weekQuizzes[0].startTime.toDate() : new Date(weekQuizzes[0].startTime);
                    const endTime = weekQuizzes[0].endTime.toDate ? weekQuizzes[0].endTime.toDate() : new Date(weekQuizzes[0].endTime);
                    
                    let resultClass = '';
                    
                    if (now > endTime) {
                      // Tuần đã kết thúc
                      if (hasUserAnswers) {
                        // Đã làm quiz - tính điểm để xác định đúng/sai
                        const correctAnswers = {};
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
                        resultClass = percentage >= 50 ? 'week-finished-correct' : 'week-finished-incorrect';
                      } else {
                        // Chưa làm quiz nhưng tuần đã kết thúc - dùng class đặc biệt với high specificity
                        resultClass = 'week-finished-not-participated';
                      }
                    } else if (now >= startTime && now <= endTime) {
                      resultClass = hasUserAnswers ? 'week-in-progress-done' : 'week-in-progress-not-done';
                    } else {
                      resultClass = 'week-not-started';
                    }
                    
                    return resultClass;
                  }
                  return 'week-not-started';
                })()}`}
              >
                {availableWeeks.map(weekId => (
                  <option key={weekId} value={weekId}>
                    {weekId.replace('week', 'Tuần ')}
                  </option>
                ))}
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
                      {(userQuizData.thoiGian.toDate ? 
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
          <div>
            <p className='quiz-history-note' style={{ fontStyle: 'italic', color: '#888' }}>Lưu ý: quiz chỉ hiện đáp án và giải thích khi quiz đó đã kết thúc</p>
          </div>
        </div>

        {/* Danh sách quiz */}
        <div className="quiz-history-list">
          {weekDataLoading ? (
            <div className="loading-message">
              <FontAwesomeIcon icon={faSpinner} spin className="loading-icon" />
              <p>Đang tải dữ liệu quiz...</p>
            </div>
          ) : weekQuizzes.length === 0 ? (
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