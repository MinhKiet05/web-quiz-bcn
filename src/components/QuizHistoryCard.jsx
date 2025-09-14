import React from 'react';
import { ImageDisplay } from '../utils/imageUtils.jsx';
import './QuizHistoryCard.css';

const QuizHistoryCard = ({ quiz, userAnswer, hasParticipated}) => {
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


  // Lấy label cho đáp án
  const getAnswerLabel = (answer) => {
    const labels = { A: 'A', B: 'B', C: 'C', D: 'D' };
    return labels[answer] || answer;
  };

  // Xác định class CSS cho viền dựa trên trạng thái
  const getCardClass = () => {
    let baseClass = 'history-card-quiz-history-card';
    
    if (!expired) {
      // Chưa qua endTime
      if (hasParticipated) {
        // Đã chọn -> viền xám
        return `${baseClass} history-card-selected`;
      } else {
        // Chưa chọn -> viền vàng
        return `${baseClass} history-card-not-selected`;
      }
    } else {
      // Qua endTime
      if (hasParticipated && isCorrect) {
        // Chọn đúng -> viền xanh
        return `${baseClass} history-card-correct`;
      } else {
        // Chọn sai hoặc không chọn -> viền đỏ
        return `${baseClass} history-card-incorrect`;
      }
    }
  };

  return (
    <div className={getCardClass()}>
      
      {/* Header của card */}
      <div className="history-card-card-header">
        <div className="history-card-quiz-info">
          <h3>Quiz {quiz.quizNumber}</h3>
        </div>
        
        {/* Hiển thị trạng thái */}
        <div className="history-card-participation-status">
          {hasParticipated ? (
            <div className="history-card-status-badge history-card-selected">
              Đã chọn: {getAnswerLabel(userAnswer)}
            </div>
          ) : (
            <div className="history-card-status-badge history-card-not-selected">
              Chưa chọn
            </div>
          )}
        </div>
      </div>

      {/* Nội dung câu hỏi */}
      <div className="history-card-card-content">
        

        {/* Hiển thị hình ảnh nếu có */}
        {(quiz.imageUrl || quiz.question) && (
          <div className="history-card-question-image">
            <img 
              src={quiz.question.includes('/d/') ? 
                `https://lh3.googleusercontent.com/d/${quiz.question.split('/d/')[1].split('/')[0]}` : 
                quiz.question
              }
              alt={`Quiz ${quiz.quizNumber} - Hình ảnh câu hỏi`}
              style={{
                maxWidth: '100%',
                maxHeight: '380px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                display: 'block',
                margin: '10px 0'
              }}
              onLoad={(e) => console.log('✅ Image loaded successfully:', e.target.src)}
              onError={(e) => {
                console.log('❌ Image failed to load:', e.target.src);
                // Fallback to ImageDisplay component
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'block';
              }}
            />
            
            {/* Fallback: ImageDisplay component (hidden by default) */}
            <div style={{display: 'none'}}>
              <ImageDisplay 
                url={quiz.question}
                alt={`Quiz ${quiz.quizNumber} - Hình ảnh câu hỏi`}
                style={{maxHeight: "680px"}}
                silentMode={false}
              />
            </div>
          </div>
        )}

        {/* Chỉ hiển thị thông tin thêm khi đã qua endTime */}
        {expired && (
          <>
            {/* Hiển thị đáp án đúng */}
            <div className="history-card-correct-answer-section">
              <h4>Đáp án đúng: {getAnswerLabel(quiz.correctAnswer)}</h4>
              </div>

            {/* Hiển thị giải thích nếu có */}
            {quiz.explanation && (
              <div className="history-card-explanation-section">
                <h4>Giải thích:</h4>
                <p>{quiz.explanation}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default QuizHistoryCard;