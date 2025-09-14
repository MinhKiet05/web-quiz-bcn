import React, { useState } from 'react';
import { ImageDisplay } from '../utils/imageUtils.jsx';
import './QuizHistoryCard.css';

const QuizHistoryCard = ({ quiz, userAnswer, hasParticipated, weekKey }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  if (!quiz) return null;

  // Kiểm tra xem quiz đã hết hạn chưa
  const isExpired = () => {
    if (!quiz.endTime) return false;
    const now = new Date();
    const endTime = quiz.endTime.toDate ? quiz.endTime.toDate() : new Date(quiz.endTime);
    return now > endTime;
  };

  // Kiểm tra đáp án đúng/sai
  const isCorrect = hasParticipated && userAnswer === quiz.correctAnswer;
  const expired = isExpired();

  // Format thời gian
  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'Không xác định';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Lấy label cho đáp án
  const getAnswerLabel = (answer) => {
    const labels = { A: 'A', B: 'B', C: 'C', D: 'D' };
    return labels[answer] || answer;
  };

  // Xác định class CSS cho viền dựa trên trạng thái
  const getCardClass = () => {
    let baseClass = 'quiz-history-card';
    
    if (!hasParticipated) {
      // Chưa làm -> viền đỏ
      return `${baseClass} not-participated`;
    }
    
    if (!expired) {
      // Đã làm nhưng chưa hết hạn -> viền vàng
      return `${baseClass} participated`;
    }
    
    // Đã hết hạn
    if (isCorrect) {
      // Đúng -> viền xanh
      return `${baseClass} correct-answer`;
    } else {
      // Sai -> viền đỏ
      return `${baseClass} wrong-answer`;
    }
  };

  return (
    <div className={getCardClass()}>
      
      {/* Header của card */}
      <div className="card-header">
        <div className="quiz-info">
          <h3>Quiz {quiz.quizNumber}</h3>
          <div className="time-info">
            <span className="time-label">Kết thúc:</span>
            <span className="time-value">{formatDateTime(quiz.endTime)}</span>
          </div>
        </div>
        
        <div className="participation-status">
          {hasParticipated ? (
            <div className={`status-badge ${expired ? (isCorrect ? 'correct' : 'incorrect') : 'submitted'}`}>
              {expired ? (
                <>
                  <span className="answer-result">{isCorrect ? '✓ Đúng' : '✗ Sai'}</span>
                  <span className="user-answer">Bạn chọn: {getAnswerLabel(userAnswer)}</span>
                </>
              ) : (
                <span className="submitted">Đã làm: {getAnswerLabel(userAnswer)}</span>
              )}
            </div>
          ) : (
            <div className="status-badge not-done">
              Chưa làm
            </div>
          )}
        </div>
      </div>

      {/* Nội dung câu hỏi */}
      <div className="card-content">
        <div className="question-text">
          <p>{quiz.question}</p>
        </div>

        {/* Hiển thị hình ảnh nếu có */}
        {quiz.imageUrl && (
          <div className="question-image">
            <ImageDisplay 
              imageUrl={quiz.imageUrl} 
              alt={`Hình ảnh Quiz ${quiz.quizNumber}`}
              maxHeight="300px"
            />
          </div>
        )}

        {/* Hiển thị các đáp án */}
        <div className="answers-section">
          {['A', 'B', 'C', 'D'].map(option => {
            if (!quiz[`option${option}`]) return null;
            
            let optionClass = 'answer-option';
            
            // Nếu quiz đã hết hạn, highlight đáp án
            if (expired) {
              if (option === quiz.correctAnswer) {
                optionClass += ' correct-answer';
              }
              if (hasParticipated && option === userAnswer && option !== quiz.correctAnswer) {
                optionClass += ' user-wrong-answer';
              }
            }
            // Nếu chưa hết hạn nhưng user đã làm, chỉ highlight đáp án user chọn
            else if (hasParticipated && option === userAnswer) {
              optionClass += ' user-selected';
            }

            return (
              <div key={option} className={optionClass}>
                <span className="option-label">{option}.</span>
                <span className="option-text">{quiz[`option${option}`]}</span>
              </div>
            );
          })}
        </div>

        {/* Hiển thị giải thích nếu quiz đã hết hạn */}
        {expired && quiz.explanation && (
          <div className="explanation-section">
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="explanation-toggle"
            >
              {showDetails ? 'Ẩn giải thích' : 'Xem giải thích'}
            </button>
            
            {showDetails && (
              <div className="explanation-content">
                <h4>Giải thích:</h4>
                <p>{quiz.explanation}</p>
                <div className="correct-answer-info">
                  <strong>Đáp án đúng: {getAnswerLabel(quiz.correctAnswer)}</strong>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer với thông tin bổ sung */}
      <div className="card-footer">
        <div className="quiz-meta">
          <span className="week-info">Tuần {weekKey.replace('week', '')}</span>
          {expired && (
            <span className="expired-label">Đã hết hạn</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizHistoryCard;