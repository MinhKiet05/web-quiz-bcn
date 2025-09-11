import React, { useState, useEffect } from 'react';
import { getAllQuizzes, parseQuizQuestions } from '../services/quizzService';
import { ImageDisplay } from '../utils/imageUtils.jsx';
import './QuizzList.css';

const QuizzList = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [expandedQuiz, setExpandedQuiz] = useState(null);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const data = await getAllQuizzes();
      setQuizzes(data);
    } catch (err) {
      setError('Lỗi khi tải danh sách quiz: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (quiz) => {
    const questions = parseQuizQuestions(quiz);
    setSelectedQuiz({ ...quiz, questions });
  };

  const toggleExpand = (quizId) => {
    setExpandedQuiz(expandedQuiz === quizId ? null : quizId);
  };

  if (loading) {
    return (
      <div className="quizz-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Đang tải danh sách quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quizz-container">
        <div className="error">
          <h2>❌ Có lỗi xảy ra</h2>
          <p>{error}</p>
          <button onClick={fetchQuizzes} className="retry-btn">
            🔄 Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quizz-container">
      <header className="quizz-header">
        <h1>📚 Danh sách Quiz</h1>
        <p>Tổng cộng: <strong>{quizzes.length}</strong> quiz</p>
        <button onClick={fetchQuizzes} className="refresh-btn">
          🔄 Làm mới
        </button>
      </header>

      <div className="quizz-grid">
        {quizzes.map((quiz) => {
          const questions = parseQuizQuestions(quiz);
          const isExpanded = expandedQuiz === quiz.id;
          
          return (
            <div key={quiz.id} className="quiz-card">
              <div className="quiz-header">
                <h3>📝 Quiz: {quiz.id}</h3>
                <span className="question-count">{questions.length} câu hỏi</span>
              </div>
              
              <div className="quiz-info">
                <p><strong>Document ID:</strong> {quiz.id}</p>
                <p><strong>Số câu hỏi:</strong> {questions.length}</p>
                {quiz.soDapAn && Array.isArray(quiz.soDapAn) && <p><strong>Số đáp án:</strong> {quiz.soDapAn.length}</p>}
                {quiz.soDapAn && typeof quiz.soDapAn === 'number' && <p><strong>Số đáp án:</strong> {quiz.soDapAn}</p>}
                {quiz['Đáp án đúng'] && <p><strong>Đáp án đúng:</strong> <span className="correct-answer">{quiz['Đáp án đúng']}</span></p>}
                {quiz.dapAnDung && <p><strong>Đáp án đúng:</strong> <span className="correct-answer">{quiz.dapAnDung}</span></p>}
                <p><strong>Cấu trúc:</strong> {Object.keys(quiz).filter(key => key !== 'id').join(', ')}</p>
              </div>

              <div className="quiz-actions">
                <button 
                  onClick={() => toggleExpand(quiz.id)}
                  className="expand-btn"
                >
                  {isExpanded ? '🔼 Thu gọn' : '🔽 Xem chi tiết'}
                </button>
                <button 
                  onClick={() => handleViewDetails(quiz)}
                  className="view-btn"
                >
                  👁️ Xem trong Modal
                </button>
              </div>

              {isExpanded && (
                <div className="quiz-details">
                  <h4>📋 Chi tiết câu hỏi:</h4>
                  
                  {/* Hiển thị thông tin chung của quiz */}
                  <div className="quiz-general-info">
                    {quiz.soDapAn && <p><strong>Số đáp án:</strong> {quiz.soDapAn}</p>}
                    {quiz['Đáp án đúng'] && <p><strong>Đáp án đúng chung:</strong> <span className="correct-answer">{quiz['Đáp án đúng']}</span></p>}
                    {quiz['Đường dẫn'] && (
                      <div className="quiz-image-section">
                        <p><strong>Đường dẫn hình ảnh:</strong></p>
                        <ImageDisplay 
                          url={quiz['Đường dẫn']} 
                          alt={`Quiz ${quiz.id} image`}
                          className="quiz-main-image"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="questions-list">
                    {questions.length > 0 ? (
                      questions.map((question) => (
                        <div key={question.id} className="question-item">
                          <div className="question-header">
                            <strong>
                              {question.isMainQuiz 
                                ? '📋 Thông tin chính' 
                                : question.isNestedQuiz
                                  ? `📚 ${question.questionNumber}`
                                  : question.questionNumber.toUpperCase()
                              }
                            </strong>
                            {question.answerCount && (
                              <span className="answer-count">({question.answerCount} đáp án)</span>
                            )}
                            {question.answers && Array.isArray(question.answers) && (
                              <span className="answer-count">({question.answers.length} đáp án)</span>
                            )}
                          </div>
                          <div className="question-details">
                            <p><strong>Đáp án đúng:</strong> <span className="correct-answer">{question.correctAnswer}</span></p>
                            
                            {/* Hiển thị các lựa chọn đáp án */}
                            {question.answers && Array.isArray(question.answers) && question.answers.length > 0 && (
                              <div className="answer-choices">
                                <p><strong>Các lựa chọn:</strong></p>
                                <div className="choices-grid">
                                  {question.answers.map((answer, index) => (
                                    <span 
                                      key={index} 
                                      className={`choice-item ${answer === question.correctAnswer ? 'correct' : ''}`}
                                    >
                                      {answer}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Hiển thị giải thích */}
                            {question.explanation && (
                              <div className="explanation-section">
                                <p><strong>Giải thích:</strong></p>
                                <div className="explanation-text">{question.explanation}</div>
                              </div>
                            )}
                            
                            {question.url && (
                              <div className="question-image-section">
                                <p><strong>Hình ảnh câu hỏi:</strong></p>
                                <ImageDisplay 
                                  url={question.url} 
                                  alt={`${question.questionNumber} image`}
                                  className="question-image"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-questions">
                        <p>📝 Không có thông tin câu hỏi chi tiết</p>
                        <p>Document chỉ chứa thông tin tổng quát</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {quizzes.length === 0 && (
        <div className="empty-state">
          <h2>📭 Chưa có quiz nào</h2>
          <p>Collection "quizz" hiện tại không có document nào.</p>
        </div>
      )}

      {/* Modal chi tiết */}
      {selectedQuiz && (
        <div className="modal-overlay" onClick={() => setSelectedQuiz(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📚 Chi tiết Quiz: {selectedQuiz.id}</h2>
              <button 
                onClick={() => setSelectedQuiz(null)}
                className="close-btn"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="quiz-summary">
                <p><strong>Tổng số câu:</strong> {selectedQuiz.questions.length}</p>
                <p><strong>Document ID:</strong> {selectedQuiz.id}</p>
                {selectedQuiz.soDapAn && <p><strong>Số đáp án:</strong> {selectedQuiz.soDapAn}</p>}
                {selectedQuiz['Đáp án đúng'] && <p><strong>Đáp án đúng chung:</strong> <span className="correct-answer">{selectedQuiz['Đáp án đúng']}</span></p>}
              </div>
              
              {selectedQuiz['Đường dẫn'] && (
                <div className="modal-main-image">
                  <h4>🖼️ Hình ảnh chính:</h4>
                  <ImageDisplay 
                    url={selectedQuiz['Đường dẫn']} 
                    alt={`Quiz ${selectedQuiz.id} main image`}
                    className="modal-quiz-image"
                  />
                </div>
              )}
              
              <div className="questions-grid">
                {selectedQuiz.questions.length > 0 ? (
                  selectedQuiz.questions.map((question) => (
                    <div key={question.id} className="modal-question">
                      <h4>
                        {question.isMainQuiz 
                          ? '📋 Thông tin chính' 
                          : question.isNestedQuiz
                            ? `📚 ${question.questionNumber}`
                            : question.questionNumber.toUpperCase()
                        }
                        {question.answerCount && (
                          <span className="answer-count"> ({question.answerCount} đáp án)</span>
                        )}
                        {question.answers && Array.isArray(question.answers) && (
                          <span className="answer-count"> ({question.answers.length} đáp án)</span>
                        )}
                      </h4>
                      <div className="modal-question-details">
                        <p><strong>Đáp án:</strong> <span className="answer-badge">{question.correctAnswer}</span></p>
                        
                        {/* Hiển thị các lựa chọn đáp án */}
                        {question.answers && Array.isArray(question.answers) && question.answers.length > 0 && (
                          <div className="modal-answer-choices">
                            <strong>Các lựa chọn:</strong>
                            <div className="modal-choices-grid">
                              {question.answers.map((answer, index) => (
                                <span 
                                  key={index} 
                                  className={`modal-choice-item ${answer === question.correctAnswer ? 'correct' : ''}`}
                                >
                                  {answer}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Hiển thị giải thích */}
                        {question.explanation && (
                          <div className="modal-explanation">
                            <strong>Giải thích:</strong>
                            <div className="modal-explanation-text">{question.explanation}</div>
                          </div>
                        )}
                        
                        {question.url && (
                          <div className="modal-question-image">
                            <strong>Hình ảnh:</strong>
                            <ImageDisplay 
                              url={question.url} 
                              alt={`${question.questionNumber} image`}
                              className="modal-question-img"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-questions-modal">
                    <p>📝 Không có câu hỏi chi tiết</p>
                    <p>Document chỉ chứa thông tin tổng quát</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizzList;
