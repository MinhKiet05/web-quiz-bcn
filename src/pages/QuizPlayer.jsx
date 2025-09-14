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
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [currentAnswers, setCurrentAnswers] = useState({});
  const [weekInfo, setWeekInfo] = useState(null);

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

  const openQuiz = (quiz) => {
    console.log('Opening quiz:', quiz); // Debug log
    setSelectedQuiz(quiz);
    const quizNumber = quiz.title?.replace('Quiz', '') || '1';
    const savedAnswer = userAnswers[`Quiz${quizNumber}`];
    setCurrentAnswers(savedAnswer ? { [`Quiz${quizNumber}`]: savedAnswer } : {});
    setShowQuizModal(true);
  };

  const handleAnswerChange = (quizKey, answer) => {
    setCurrentAnswers({
      ...currentAnswers,
      [quizKey]: answer
    });
  };

  const submitAnswer = async () => {
    try {
      const quizKey = Object.keys(currentAnswers)[0]; // e.g., "Quiz1"
      const answer = currentAnswers[quizKey];
      const quizNumber = quizKey.replace('Quiz', '');
      
      const updatedAnswers = await quizService.saveUserAnswer(
        user.studentId || user.uid,
        1, // Luôn lưu vào week1
        quizNumber,
        answer
      );
      
      // Update local state
      setUserAnswers(updatedAnswers);
      setShowQuizModal(false);
      setSelectedQuiz(null);
      
      alert('Đáp án đã được lưu thành công!');
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Có lỗi xảy ra khi lưu đáp án!');
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
                  {/* Hiển thị hình ảnh */}
                  {quiz.link && (
                    <div className="quiz-player-quiz-image">
                      <ImageDisplay
                        url={quiz.link}
                        alt={`Quiz ${quizNumber} - Câu hỏi`}
                        className="quiz-player-quiz-image-display"
                      />
                    </div>
                  )}
                  
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
                
                <button 
                  className="quiz-player-quiz-action-btn"
                  onClick={() => openQuiz(quiz)}
                  disabled={!canTake}
                >
                  {!canTake && timeStatus === 'not_started' ? '🔒 Chưa mở' :
                   !canTake && timeStatus === 'expired' ? '❌ Đã hết hạn' :
                   status === 'completed' ? '✏️ Sửa đáp án' : '▶️ Bắt đầu'}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Quiz Modal */}
      {showQuizModal && selectedQuiz && (
        <div className="quiz-player-quiz-modal-overlay" onClick={() => setShowQuizModal(false)}>
          <div className="quiz-player-quiz-modal" onClick={(e) => e.stopPropagation()}>
            <div className="quiz-player-quiz-modal-header">
              <h2>{selectedQuiz.title}</h2>
              <button 
                className="quiz-player-quiz-modal-close"
                onClick={() => setShowQuizModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="quiz-player-quiz-modal-content">
              {/* Hiển thị hình ảnh câu hỏi từ link */}
              {selectedQuiz.link && (
                <div className="quiz-player-question-image">
                  <ImageDisplay
                    url={selectedQuiz.link}
                    alt={`${selectedQuiz.title} - Hình ảnh câu hỏi`}
                    className="quiz-player-question-image-display"
                  />
                </div>
              )}

              
              
              <div className="quiz-player-quiz-options">
                <h3>Lựa chọn:</h3>
                {/* Kiểm tra nếu có soDapAn array */}
                {selectedQuiz.soDapAn && selectedQuiz.soDapAn.length > 0 ? (
                  selectedQuiz.soDapAn.map((option, index) => {
                    const optionLetter = String.fromCharCode(65 + index); // A, B, C, D...
                    const quizKey = selectedQuiz.title?.replace('Quiz', '') || '1';
                    const isSelected = currentAnswers[`Quiz${quizKey}`] === optionLetter;
                    
                    return (
                      <label key={index} className={`quiz-player-quiz-option ${isSelected ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="quizAnswer"
                          value={optionLetter}
                          checked={isSelected}
                          onChange={(e) => handleAnswerChange(`Quiz${quizKey}`, e.target.value)}
                        />
                        <span className="quiz-player-option-letter">{optionLetter}</span>
                        <span className="quiz-player-option-text">{option}</span>
                      </label>
                    );
                  })
                ) : (
                  /* Fallback: Kiểm tra các field luaChonA, luaChonB, etc */
                  ['A', 'B', 'C', 'D', 'E'].map((letter) => {
                    const optionKey = `luaChon${letter}`;
                    const option = selectedQuiz[optionKey];
                    
                    if (!option) return null;
                    
                    const quizKey = selectedQuiz.title?.replace('Quiz', '') || '1';
                    const isSelected = currentAnswers[`Quiz${quizKey}`] === letter;
                    
                    return (
                      <label key={letter} className={`quiz-player-quiz-option ${isSelected ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="quizAnswer"
                          value={letter}
                          checked={isSelected}
                          onChange={(e) => handleAnswerChange(`Quiz${quizKey}`, e.target.value)}
                        />
                        <span className="quiz-player-option-letter">{letter}</span>
                        <span className="quiz-player-option-text">{option}</span>
                      </label>
                    );
                  }).filter(Boolean)
                )}
                
                {(!selectedQuiz.soDapAn || selectedQuiz.soDapAn.length === 0) && 
                 !['A', 'B', 'C', 'D', 'E'].some(letter => selectedQuiz[`luaChon${letter}`]) && (
                  <p style={{ color: '#e74c3c', textAlign: 'center' }}>Chưa có lựa chọn nào được tạo</p>
                )}
              </div>
            </div>
            
            <div className="quiz-player-quiz-modal-footer">
              <button 
                className="quiz-player-quiz-cancel-btn"
                onClick={() => setShowQuizModal(false)}
              >
                Hủy
              </button>
              <button 
                className="quiz-player-quiz-submit-btn"
                onClick={submitAnswer}
                disabled={!Object.keys(currentAnswers).length}
              >
                💾 Lưu đáp án
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizPlayer;