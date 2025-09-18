import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageDisplay } from '../../utils/imageUtils.jsx';
import './QuizHistoryCard.css';

const QuizHistoryCard = ({ quiz, userAnswer, hasParticipated}) => {
  const navigate = useNavigate();
  
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
              onLoad={() => {}}
              onError={(e) => {
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

        {/* Hiển thị đáp án đã chọn với độ rộng to (luôn hiển thị) */}
        <div className="history-card-answers-section">
          {hasParticipated ? (
            <div className={`history-card-user-answer ${expired && isCorrect ? 'history-card-correct-user-answer' : expired ? 'history-card-incorrect-user-answer' : 'history-card-selected-user-answer'}`}>
              <h4>Bạn đã chọn: {getAnswerLabel(userAnswer)}</h4>
            </div>
          ) : (
            <div className="history-card-user-answer history-card-not-answered-user-answer">
              <h4>Chưa chọn đáp án</h4>
            </div>
          )}
        </div>

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

        {/* Nút Làm ngay - chỉ hiển thị với quiz chưa làm và chưa hết hạn */}
        {!hasParticipated && !expired && (
          <div className="history-card-action-section">
            <button 
              className="history-card-do-quiz-btn"
              onClick={() => navigate('/')}
              title="Quay về trang Quiz tuần"
            >
              Làm ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizHistoryCard;