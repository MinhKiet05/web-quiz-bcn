import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import quizService from '../services/quizService';
import { ImageDisplay } from '../utils/imageUtils.jsx';
import './QuizPlayer.css';

const QuizPlayer = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentAnswers, setCurrentAnswers] = useState({});
  const [weekInfo, setWeekInfo] = useState(null);
  const [savingAnswers, setSavingAnswers] = useState({}); // Track saving state for each quiz

  // Initialize current answers with user answers
  useEffect(() => {
    setCurrentAnswers(userAnswers);
  }, [userAnswers]);

  // Lấy quiz và thông tin thời gian từ week1 document
  const fetchQuizzes = useCallback(async () => {
    try {
      console.log('🔍 Fetching quizzes from week1 document...');
      const quizData = await quizService.getQuizzesFromWeekDocument('week1');
      console.log('📝 All quizzes from week1:', quizData);
      
      // Lấy thông tin thời gian từ quiz đầu tiên hoặc document level
      if (quizData.length > 0) {
        const firstQuiz = quizData[0];
        setWeekInfo({
          week: 1,
          startTime: firstQuiz.startTime,
          endTime: firstQuiz.endTime
        });
      }
      
      // Hiển thị tất cả quiz, không filter theo thời gian nữa
      setQuizzes(quizData);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
  }, []);

  const fetchUserAnswers = useCallback(async () => {
    try {
      const answers = await quizService.getUserAnswersByWeek(
        user.studentId || user.uid, 
        1 // Luôn lấy từ week1
      );
      setUserAnswers(answers);
    } catch (error) {
      console.error('Error fetching user answers:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchQuizzes();
      fetchUserAnswers();
    }
  }, [user, fetchQuizzes, fetchUserAnswers]);

  const handleAnswerChange = (quizKey, answer) => {
    setCurrentAnswers({
      ...currentAnswers,
      [quizKey]: answer
    });
  };

  const submitSingleAnswer = async (quizNumber) => {
    try {
      setSavingAnswers(prev => ({ ...prev, [quizNumber]: true }));
      
      const quizKey = `Quiz${quizNumber}`;
      const answer = currentAnswers[quizKey];
      
      if (!answer) {
        alert('Vui lòng chọn đáp án trước khi lưu!');
        return;
      }
      
      const updatedAnswers = await quizService.saveUserAnswer(
        user.studentId || user.uid,
        1, // Luôn lưu vào week1
        quizNumber,
        answer
      );
      
      // Update local state
      setUserAnswers(updatedAnswers);
      
      alert('Đáp án đã được lưu thành công!');
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Có lỗi xảy ra khi lưu đáp án!');
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
        <div className="quiz-player-loading-spinner">🔄</div>
        <p>Đang tải quiz...</p>
      </div>
    );
  }

  return (
    <div className="quiz-player">
      <div className="quiz-player-quiz-player-header">
        <h1>🎯 Quiz Hàng Tuần</h1>

        {weekInfo && (
          <div className="quiz-player-week-info">
            <div className="quiz-player-week-number">Week {weekInfo.week}</div>
            <div className="quiz-player-time-info">
              <div className="quiz-player-time-item">
                <span className="quiz-player-time-label"><b>⏰ Open:</b></span>
                <span className="quiz-player-time-value">{quizService.formatDateTime(weekInfo.startTime)}</span>
              </div>
              <div className="quiz-player-time-item">
                <span className="quiz-player-time-label"><b>⏰ Close:</b></span>
                <span className="quiz-player-time-value">{quizService.formatDateTime(weekInfo.endTime)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="quiz-player-quiz-grid grid">
        {quizzes.length === 0 ? (
          <div className="quiz-player-no-quiz">
            <div className="quiz-player-no-quiz-icon">📋</div>
            <h3>Chưa có quiz cho tuần này</h3>
            <p>Quiz sẽ được cập nhật sớm nhất có thể.</p>
          </div>
        ) : (
          quizzes.map((quiz) => {
            const status = getQuizStatus(quiz);
            const quizNumber = quiz.title?.replace('Quiz', '') || '1';
            const timeStatus = quizService.getQuizTimeStatus(quiz);
            const canTake = canTakeQuiz(quiz);
            
            return (
              <div key={quiz.id} className={`quiz-player-quiz-card ${status}`}>
                <div className="quiz-player-quiz-card-header">
                  <h3>{quiz.title || `Quiz ${quizNumber}`}</h3>
                  <span className="quiz-player-quiz-status">
                    {getStatusIcon(status)} {getStatusText(status)}
                  </span>
                </div>
                
                <div className="quiz-player-quiz-card-content">
                  <div className="quiz-player-quiz-info">
                    <span className="quiz-player-quiz-points">📊 {quizNumber} điểm</span>
                  </div>
                  
                  {status === 'completed' && (
                    <div className="quiz-player-current-answer">
                      <strong>Đáp án đã chọn:</strong> {userAnswers[`Quiz${quizNumber}`]}
                    </div>
                  )}
                  
                  {!canTake && timeStatus === 'not_started' && (
                    <div className="quiz-player-quiz-locked">
                      🔒 Quiz chưa được mở
                    </div>
                  )}
                  
                  {!canTake && timeStatus === 'expired' && (
                    <div className="quiz-player-quiz-expired">
                      ❌ Quiz đã hết hạn
                    </div>
                  )}
                </div>
                
                {/* Quiz Content - Inline Interface */}
                <div className="quiz-player-quiz-content">
                  {quiz.link && (
                    <div className="quiz-player-quiz-image-container">
                      <ImageDisplay 
                        url={quiz.link}
                        alt={`${quiz.title} - Hình ảnh câu hỏi`}
                        className="quiz-player-quiz-inline-image"
                      />
                    </div>
                  )}
                  
                  {canTake && (
                    <div className="quiz-player-quiz-options">
                      <label htmlFor={`quiz-${quiz.title || quizNumber}`}>Chọn đáp án:</label>
                      <select 
                        id={`quiz-${quiz.title || quizNumber}`}
                        value={currentAnswers[quiz.title || `Quiz${quizNumber}`] || ''}
                        onChange={(e) => handleAnswerChange(quiz.title || `Quiz${quizNumber}`, e.target.value)}
                        className="quiz-player-quiz-answer-select"
                      >
                        <option value="">-- Chọn đáp án --</option>
                        
                        {/* Render options based on soDapAn array or individual options */}
                        {quiz.soDapAn && quiz.soDapAn.length > 0 ? (
                          quiz.soDapAn.map((option, optionIndex) => (
                            <option key={optionIndex} value={String.fromCharCode(65 + optionIndex)}>
                              {String.fromCharCode(65 + optionIndex)}
                            </option>
                          ))
                        ) : (
                          ['A', 'B', 'C', 'D', 'E'].map(letter => {
                            const optionKey = `luaChon${letter}`;
                            const option = quiz[optionKey];
                            return option ? (
                              <option key={letter} value={letter}>
                                {letter}
                              </option>
                            ) : null;
                          })
                        )}
                        
                        {/* Fallback if no options available */}
                        {(!quiz.soDapAn || quiz.soDapAn.length === 0) &&
                         !['A', 'B', 'C', 'D', 'E'].some(letter => quiz[`luaChon${letter}`]) && (
                          <>
                            <option value="A"></option>
                            <option value="B"></option>
                            <option value="C"></option>
                            <option value="D"></option>
                          </>
                        )}
                      </select>
                      
                      <button 
                        onClick={() => submitSingleAnswer(quizNumber)}
                        className="quiz-player-quiz-save-answer-btn"
                        disabled={savingAnswers[quizNumber] || !currentAnswers[quiz.title || `Quiz${quizNumber}`]}
                      >
                        {savingAnswers[quizNumber] ? 'Đang lưu...' : 'Lưu đáp án'}
                      </button>
                    </div>
                  )}
                  
                  {/* Show current saved answer */}
                  {userAnswers[quiz.title || `Quiz${quizNumber}`] && (
                    <div className="quiz-player-quiz-saved-answer">
                      Đã lưu: {userAnswers[quiz.title || `Quiz${quizNumber}`]}
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