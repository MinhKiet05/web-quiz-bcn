import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import quizService from '../../services/quizService.js';
import { ImageDisplay } from '../../utils/imageUtils.jsx';
import { showToast } from '../../utils/toastUtils.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import './QuizPlayer.css';

const QuizPlayer = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentAnswers, setCurrentAnswers] = useState({});
  const [weekInfo, setWeekInfo] = useState(null);
  const [savingAnswers, setSavingAnswers] = useState({}); // Track saving state for each quiz
  const [activeQuizNumber, setActiveQuizNumber] = useState('1'); // Track currently active quiz
  const [navCollapsed, setNavCollapsed] = useState(false); // For mobile/tablet responsive
  const [windowWidth, setWindowWidth] = useState(window.innerWidth); // Track window width for responsive
  const [timeRemaining, setTimeRemaining] = useState(''); // Countdown timer for week end

  // Function to scroll to specific quiz
  const scrollToQuiz = (quizNumber) => {
    const quizElement = document.getElementById(`quiz-${quizNumber}`);
    if (quizElement) {
      quizElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  };

  // Initialize current answers with user answers
  useEffect(() => {
    setCurrentAnswers(userAnswers);
  }, [userAnswers]);

  const [currentWeek, setCurrentWeek] = useState(1);

  // Tự động tìm tuần hiện tại dựa trên thời gian
  const findCurrentWeek = useCallback(async () => {
    try {
      const now = new Date();
      
      // Thử từ week1 đến week10 để tìm tuần hiện tại
      for (let week = 1; week <= 10; week++) {
        try {
          const quizData = await quizService.getQuizzesFromWeekDocument(`week${week}`);
          if (quizData.length > 0) {
            const firstQuiz = quizData[0];
            if (firstQuiz.startTime && firstQuiz.endTime) {
              const startTime = firstQuiz.startTime.toDate ? firstQuiz.startTime.toDate() : new Date(firstQuiz.startTime);
              const endTime = firstQuiz.endTime.toDate ? firstQuiz.endTime.toDate() : new Date(firstQuiz.endTime);
              
              // Kiểm tra nếu tuần này đang active hoặc sắp tới
              if (now >= startTime && now <= endTime) {
                return week;
              } else if (now < startTime) {
                return week;
              }
            }
          }
        } catch {
          // Week not found, continuing...
        }
      }
      
      // Nếu không tìm thấy tuần nào, quay lại tuần cuối cùng có data
      for (let week = 10; week >= 1; week--) {
        try {
          const quizData = await quizService.getQuizzesFromWeekDocument(`week${week}`);
          if (quizData.length > 0) {
            return week;
          }
        } catch {
          continue;
        }
      }
      
      return 1;
    } catch (error) {
      console.error('Error finding current week:', error);
      return 1;
    }
  }, []);

  // Function to calculate time remaining until week ends
  const calculateTimeRemaining = useCallback(() => {
    if (!weekInfo || !weekInfo.endTime) return '';
    
    try {
      const now = new Date();
      let endTime;
      
      // Try different date parsing methods
      if (weekInfo.endTime instanceof Date) {
        endTime = weekInfo.endTime;
      } else if (typeof weekInfo.endTime === 'string') {
        endTime = new Date(weekInfo.endTime);
      } else if (weekInfo.endTime.seconds) {
        // Firestore Timestamp format
        endTime = new Date(weekInfo.endTime.seconds * 1000);
      } else {
        endTime = new Date(weekInfo.endTime);
      }
      
      // Check if endTime is valid
      if (isNaN(endTime.getTime())) {
        console.log('Invalid endTime:', weekInfo.endTime);
        return '';
      }
      
      const timeDiff = endTime.getTime() - now.getTime();
      
      if (timeDiff <= 0) {
        return 'Đã hết thời gian';
      }
      
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
      
      if (days > 0) {
        return `Còn lại: ${days} ngày ${hours} giờ`;
      } else if (hours > 0) {
        return `Còn lại: ${hours} giờ ${minutes} phút`;
      } else if (minutes > 0) {
        return `Còn lại: ${minutes} phút ${seconds} giây`;
      } else {
        return `Còn lại: ${seconds} giây`;
      }
    } catch (error) {
      console.log('Error calculating time remaining:', error, weekInfo.endTime);
      return '';
    }
  }, [weekInfo]);

  // Update countdown timer every second
  useEffect(() => {
    if (!weekInfo) return;
    
    const updateTimer = () => {
      setTimeRemaining(calculateTimeRemaining());
    };
    
    // Update immediately
    updateTimer();
    
    // Set up interval to update every second
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [weekInfo, calculateTimeRemaining]);

  // Lấy quiz và thông tin thời gian từ tuần hiện tại
  const fetchQuizzes = useCallback(async () => {
    try {
      const week = await findCurrentWeek();
      setCurrentWeek(week);
      
      const quizData = await quizService.getQuizzesFromWeekDocument(`week${week}`);
      
      // Lấy thông tin thời gian từ quiz đầu tiên hoặc document level
      if (quizData.length > 0) {
        const firstQuiz = quizData[0];
        setWeekInfo({
          week: week,
          startTime: firstQuiz.startTime,
          endTime: firstQuiz.endTime
        });
      }
      
      // Hiển thị tất cả quiz
      setQuizzes(quizData);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setQuizzes([]);
    }
  }, [findCurrentWeek]);

  const fetchUserAnswers = useCallback(async () => {
    try {
      const answers = await quizService.getUserAnswersByWeek(
        user.studentId || user.uid, 
        currentWeek
      );
      setUserAnswers(answers);
    } catch (error) {
      console.error('Error fetching user answers:', error);
    }
  }, [user, currentWeek]);

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        setLoading(true);
        try {
          await fetchQuizzes();
          await fetchUserAnswers();
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          setLoading(false);
        }
      };
      
      loadData();
    }
  }, [user, fetchQuizzes, fetchUserAnswers]);

  // Intersection Observer to track active quiz
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -20% 0px', // More sensitive detection
      threshold: 0.3 // Quiz needs to be 30% visible to be considered active
    };

    const observer = new IntersectionObserver((entries) => {
      // Find the quiz that's most visible in viewport
      let mostVisibleQuiz = null;
      let maxIntersectionRatio = 0;

      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > maxIntersectionRatio) {
          maxIntersectionRatio = entry.intersectionRatio;
          mostVisibleQuiz = entry.target;
        }
      });

      if (mostVisibleQuiz) {
        const quizId = mostVisibleQuiz.id;
        const quizNumber = quizId.replace('quiz-', '');
        setActiveQuizNumber(quizNumber);
      }
    }, observerOptions);

    // Observe all quiz cards
    const quizElements = document.querySelectorAll('[id^="quiz-"]');
    quizElements.forEach((element) => observer.observe(element));

    return () => {
      quizElements.forEach((element) => observer.unobserve(element));
    };
  }, [quizzes]); // Re-run when quizzes change

  // Auto-collapse navigation on mobile/tablet
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth <= 1024) {
        setNavCollapsed(true);
      } else {
        setNavCollapsed(false);
      }
    };

    // Set initial state
    handleResize();

    // Listen for resize events
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Click outside to close navigation on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (windowWidth <= 1024 && !navCollapsed) {
        const sidebar = document.querySelector('.quiz-navigation-sidebar');
        const target = event.target;
        
        // Check if click is outside sidebar and not on a quiz card or other interactive elements
        if (sidebar && !sidebar.contains(target)) {
          // Only close if clicking on background/white areas
          const isWhiteArea = target.classList.contains('quiz-player') || 
                             target.classList.contains('quiz-player-quiz-card') ||
                             target.tagName === 'BODY' ||
                             target.tagName === 'HTML' ||
                             getComputedStyle(target).backgroundColor === 'rgb(255, 255, 255)' ||
                             getComputedStyle(target).backgroundColor === 'rgba(0, 0, 0, 0)';
          
          if (isWhiteArea) {
            setNavCollapsed(true);
          }
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [navCollapsed, windowWidth]);

  const handleAnswerChange = async (quizKey, answer) => {
    // Update current answers immediately
    setCurrentAnswers({
      ...currentAnswers,
      [quizKey]: answer
    });

    // Auto-save the answer
    const quizNumber = quizKey.replace('Quiz', '');
    try {
      setSavingAnswers(prev => ({ ...prev, [quizNumber]: true }));
      
      const updatedAnswers = await quizService.saveUserAnswer(
        user.studentId || user.uid,
        currentWeek,
        quizNumber,
        answer
      );
      
      // Update local state
      setUserAnswers(updatedAnswers);
      
      // Format thời gian để hiển thị trong toast
      const now = new Date();
      const timeString = now.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      
      showToast(`Đáp án đã được lưu tự động! Thời gian: ${timeString}`, 'success');
    } catch (error) {
      console.error('Error auto-saving answer:', error);
      showToast('Có lỗi xảy ra khi lưu đáp án!', 'error');
    } finally {
      setSavingAnswers(prev => ({ ...prev, [quizNumber]: false }));
    }
  };

  const getQuizStatus = (quiz) => {
    const quizNumber = quiz.title?.replace('Quiz', '') || '1';
    const hasAnswer = userAnswers[`Quiz${quizNumber}`];
    
    // Kiểm tra trạng thái thời gian
    const timeStatus = quizService.getQuizTimeStatus(quiz);
    
    if (timeStatus === 'not_started') {
      return 'not_started';
    } else if (timeStatus === 'expired') {
      return 'expired';
    } else if (hasAnswer) {
      return 'completed';
    } else {
      return 'pending';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'pending':
        return '⏳';
      case 'not_started':
        return '🔒';
      case 'expired':
        return '❌';
      default:
        return '📝';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Đã làm';
      case 'pending':
        return 'Chưa làm';
      case 'not_started':
        return 'Chưa mở';
      case 'expired':
        return 'Đã hết hạn';
      default:
        return 'Mới';
    }
  };

  const canTakeQuiz = (quiz) => {
    const timeStatus = quizService.getQuizTimeStatus(quiz);
    return timeStatus === 'available';
  };

  if (loading) {
    return (
      <div className="quiz-player-quiz-player-loading">
        <div className="quiz-player-loading-spinner"><FontAwesomeIcon icon={faSpinner} spin /></div>
        <p>Đang tải quiz...</p>
      </div>
    );
  }

  return (
    <div className="quiz-player">
      {/* Quiz Navigation Sidebar */}
      <div 
        className={`quiz-navigation-sidebar ${navCollapsed ? 'collapsed' : ''}`}
        style={{ 
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '25px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          padding: '8px'
        }}
      >
        {/* Mobile/Tablet collapsed view */}
        <div 
          className="quiz-nav-mobile-toggle" 
          onClick={() => setNavCollapsed(!navCollapsed)}
          style={{ 
            cursor: 'pointer',
            backgroundColor: navCollapsed ? '#007bff' : '#28a745',
            color: 'white',
            padding: '0',
            borderRadius: '50%',
            fontSize: windowWidth <= 768 ? '8px' : '9px',
            fontWeight: '600',
            marginBottom: navCollapsed ? '0' : '10px',
            textAlign: 'center',
            width: windowWidth <= 768 ? '30px' : '35px',
            height: windowWidth <= 768 ? '30px' : '35px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden'
          }}
        >
          <div className="quiz-nav-progress">
            {Math.min(Object.keys(userAnswers).length, quizzes.length)}/{quizzes.length}
          </div>
        </div>
        
        {/* Full navigation */}
        <div className="quiz-nav-content">
          <div className="quiz-nav-title">Quiz</div>
          {quizzes.map((quiz, index) => {
            const quizNumber = quiz.title?.replace(/Quiz\s*/g, '') || (index + 1).toString();
            const hasAnswer = userAnswers[`Quiz${quizNumber}`];
            const status = getQuizStatus(quiz);
            const isActive = activeQuizNumber === quizNumber;
            
            return (
              <div 
                key={quiz.id || index}
                className={`quiz-nav-item ${hasAnswer ? 'completed' : 'pending'} ${status} ${isActive ? 'active' : ''}`}
                onClick={() => {
                  scrollToQuiz(quizNumber);
                  setNavCollapsed(false); // Close mobile nav after selection
                }}
                title={`Quiz ${quizNumber} - ${hasAnswer ? 'Đã làm' : 'Chưa làm'}`}
              >
                {quizNumber}
              </div>
            );
          })}
        </div>
      </div>

      <div className="quiz-player-quiz-player-header">
        <h1>Quiz Hàng Tuần</h1>
        {weekInfo && (
          <div className="quiz-player-week-info">
            <div className="quiz-player-week-number">Week {weekInfo.week}</div>
            <div className="quiz-player-time-info">
              <div className="quiz-player-time-item">
                <span className="quiz-player-time-label"><b>Open:</b></span>
                <span className="quiz-player-time-value">{quizService.formatDateTime(weekInfo.startTime)}</span>
              </div>
              <div className="quiz-player-time-item">
                <span className="quiz-player-time-label"><b>Close:</b></span>
                <span className="quiz-player-time-value">{quizService.formatDateTime(weekInfo.endTime)}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Countdown Timer */}
        {weekInfo && timeRemaining && (
          <div className="quiz-player-countdown-timer">
            {timeRemaining}
          </div>
        )}
      </div>

      <div className="quiz-player-quiz-grid grid">
        {loading ? (
          <div className="quiz-player-loading">
            <FontAwesomeIcon icon={faSpinner} spin />
            <p>Đang tải quiz...</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="quiz-player-no-quiz">
            <div className="quiz-player-no-quiz-icon"></div>
            <h3>Chưa có quiz cho tuần này</h3>
            <p>Quiz sẽ được cập nhật sớm nhất có thể.</p>
          </div>
        ) : (
          quizzes.map((quiz) => {
            const status = getQuizStatus(quiz);
            const quizNumber = quiz.title?.replace(/Quiz\s*/g, '') || '1';
            const timeStatus = quizService.getQuizTimeStatus(quiz);
            const canTake = canTakeQuiz(quiz);
            
            return (
              <div key={quiz.id} id={`quiz-${quizNumber}`} className={`quiz-player-quiz-card ${status}`}>
                <div className="quiz-player-quiz-card-header">
                  <h3>Quiz {quizNumber}</h3>
                  <span className="quiz-player-quiz-status">
                    {getStatusIcon(status)} {getStatusText(status)}
                  </span>
                </div>
                
                <div className="quiz-player-quiz-card-content">
                  <div className="quiz-player-quiz-info">
                    <span className="quiz-player-quiz-points">{quizNumber} điểm</span>
                  </div>
                  
                  {status === 'completed' && (
                    <div className="quiz-player-current-answer">
                      <strong>Đáp án đã chọn:</strong> {userAnswers[`Quiz${quizNumber}`]}
                    </div>
                  )}
                  
                  {!canTake && timeStatus === 'not_started' && (
                    <div className="quiz-player-quiz-locked">
                      Quiz chưa được mở
                    </div>
                  )}
                  
                  {!canTake && timeStatus === 'expired' && (
                    <div className="quiz-player-quiz-expired">
                      Quiz đã hết hạn
                    </div>
                  )}
                </div>
                
                {/* Quiz Content - Inline Interface */}
                <div className="quiz-player-quiz-content">
                  {canTake && (
                    <div className="quiz-player-quiz-interface">
                      {/* Quiz Image */}
                      {quiz.link && (
                        <div className="quiz-player-quiz-image-container">
                          <ImageDisplay 
                            url={quiz.link}
                            alt={`${quiz.title} - Hình ảnh câu hỏi`}
                            className="quiz-player-quiz-inline-image"
                          />
                        </div>
                      )}
                      
                      {/* Quiz Options */}
                      <div className="quiz-player-quiz-options-container">
                        <div className="quiz-player-quiz-options">
                          <h4>Chọn đáp án:</h4>
                          
                          {/* Radio buttons for answers */}
                          <div className="quiz-player-radio-options">
                            {/* Render options based on soDapAn array or individual options */}
                            {quiz.soDapAn && quiz.soDapAn.length > 0 ? (
                              quiz.soDapAn.map((option, optionIndex) => {
                                const letter = String.fromCharCode(65 + optionIndex);
                                const isSelected = currentAnswers[quiz.title || `Quiz${quizNumber}`] === letter;
                                const isSaving = savingAnswers[quizNumber] && isSelected;
                                
                                return (
                                  <label key={optionIndex} className={`quiz-player-radio-option ${isSelected ? 'selected' : ''}`}>
                                    <input
                                      type="radio"
                                      name={`quiz-${quiz.title || quizNumber}`}
                                      value={letter}
                                      checked={isSelected}
                                      onChange={(e) => handleAnswerChange(quiz.title || `Quiz${quizNumber}`, e.target.value)}
                                      disabled={isSaving}
                                    />
                                    <span className="quiz-player-radio-custom"></span>
                                    <span className="quiz-player-option-text">
                                      {letter}
                                      {isSaving && <FontAwesomeIcon icon={faSpinner} spin className="quiz-player-saving-icon" />}
                                    </span>
                                  </label>
                                );
                              })
                            ) : (
                              ['A', 'B', 'C', 'D', 'E'].map(letter => {
                                const optionKey = `luaChon${letter}`;
                                const option = quiz[optionKey];
                                
                                if (!option) return null;
                                
                                const isSelected = currentAnswers[quiz.title || `Quiz${quizNumber}`] === letter;
                                const isSaving = savingAnswers[quizNumber] && isSelected;
                                
                                return (
                                  <label key={letter} className={`quiz-player-radio-option ${isSelected ? 'selected' : ''}`}>
                                    <input
                                      type="radio"
                                      name={`quiz-${quiz.title || quizNumber}`}
                                      value={letter}
                                      checked={isSelected}
                                      onChange={(e) => handleAnswerChange(quiz.title || `Quiz${quizNumber}`, e.target.value)}
                                      disabled={isSaving}
                                    />
                                    <span className="quiz-player-radio-custom"></span>
                                    <span className="quiz-player-option-text">
                                      {letter}
                                      {isSaving && <FontAwesomeIcon icon={faSpinner} spin className="quiz-player-saving-icon" />}
                                    </span>
                                  </label>
                                );
                              })
                            )}
                            
                            {/* Fallback if no options available */}
                            {(!quiz.soDapAn || quiz.soDapAn.length === 0) &&
                             !['A', 'B', 'C', 'D', 'E'].some(letter => quiz[`luaChon${letter}`]) && (
                              ['A', 'B', 'C', 'D'].map(letter => {
                                const isSelected = currentAnswers[quiz.title || `Quiz${quizNumber}`] === letter;
                                const isSaving = savingAnswers[quizNumber] && isSelected;
                                
                                return (
                                  <label key={letter} className={`quiz-player-radio-option ${isSelected ? 'selected' : ''}`}>
                                    <input
                                      type="radio"
                                      name={`quiz-${quiz.title || quizNumber}`}
                                      value={letter}
                                      checked={isSelected}
                                      onChange={(e) => handleAnswerChange(quiz.title || `Quiz${quizNumber}`, e.target.value)}
                                      disabled={isSaving}
                                    />
                                    <span className="quiz-player-radio-custom"></span>
                                    <span className="quiz-player-option-text">
                                      {letter}
                                      {isSaving && <FontAwesomeIcon icon={faSpinner} spin className="quiz-player-saving-icon" />}
                                    </span>
                                  </label>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Non-interactive quiz image for non-available quizzes */}
                  {!canTake && quiz.link && (
                    <div className="quiz-player-quiz-image-container">
                      <ImageDisplay 
                        url={quiz.link}
                        alt={`${quiz.title} - Hình ảnh câu hỏi`}
                        className="quiz-player-quiz-inline-image"
                      />
                    </div>
                  )}
                
                  
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default QuizPlayer;