import React from 'react';
import { X, CheckCircle2, XCircle, Circle } from 'lucide-react';
import styles from './DetailAttemptModal.module.css';

export default function DetailAttemptModal({ isOpen, onClose, attemptData }) {
  if (!isOpen || !attemptData) return null;

  // Render trạng thái của 1 dòng đáp án trắc nghiệm (MCQ)
  const renderMCQAnswer = (answer, isSelected, index) => {
    // Chuyển index 0, 1, 2, 3 thành A, B, C, D
    const letter = String.fromCharCode(65 + index);
    
    let stateClass = styles.ansDefault;
    let Icon = Circle;

    if (isSelected && answer.is_correct) {
      stateClass = styles.ansCorrectSelected;
      Icon = CheckCircle2;
    } else if (isSelected && !answer.is_correct) {
      stateClass = styles.ansWrongSelected;
      Icon = XCircle;
    } else if (!isSelected && answer.is_correct) {
      // Đáp án đúng nhưng sinh viên không chọn
      stateClass = styles.ansCorrectMissed;
      Icon = Circle; 
    }

    return (
      <div key={answer.id} className={`${styles.answerRow} ${stateClass}`}>
        <span className={styles.answerLetter}>{letter}.</span>
        <span className={styles.answerText}>{answer.answer_text}</span>
        <Icon size={20} className={styles.answerIcon} />
      </div>
    );
  };

  // Render hiển thị cho câu hỏi dạng Điền khuyết (Fill-text)
  const renderFillTextAnswer = (question) => {
    // Kiểm tra xem câu trả lời của sinh viên có nằm trong danh sách đáp án đúng không (không phân biệt hoa thường)
    const studentAns = (question.student_text_answer || '').trim().toLowerCase();
    const isCorrect = question.answers.some(
      (ans) => ans.answer_text.trim().toLowerCase() === studentAns
    );

    return (
      <div className={styles.fillTextContainer}>
        <div className={`${styles.fillTextBox} ${isCorrect ? styles.fillCorrect : styles.fillWrong}`}>
          <span className={styles.fillTextLabel}>Đáp án của sinh viên:</span>
          <div className={styles.fillTextInput}>
            {question.student_text_answer || <span className={styles.emptyAns}>(Bỏ trống)</span>}
            {isCorrect ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
          </div>
        </div>
        <div className={styles.acceptedAnswers}>
          <span className={styles.acceptedLabel}>Các đáp án đúng được chấp nhận:</span>
          <div className={styles.acceptedList}>
            {question.answers.map((ans, idx) => (
              <span key={idx} className={styles.acceptedTag}>{ans.answer_text}</span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        
        {/* --- HEADER --- */}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <h2 className={styles.title}>
              Chi tiết bài làm - {attemptData.studentName} ({attemptData.mssv})
            </h2>
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={24} />
            </button>
          </div>
          <div className={styles.headerSubtext}>
            <span>Bài thi: <strong>{attemptData.quizTitle}</strong></span>
            <span className={styles.divider}>|</span>
            <span>Điểm số: <strong>{attemptData.score}/{attemptData.totalScore}</strong></span>
            <span className={styles.divider}>|</span>
            <span>Thời gian làm: <strong>{attemptData.timeTaken}</strong></span>
            <span className={styles.divider}>|</span>
            <span>Nộp lúc: <strong>{attemptData.submittedAt}</strong></span>
          </div>
        </div>

        {/* --- BODY: DANH SÁCH CÂU HỎI --- */}
        <div className={styles.body}>
          {attemptData.questions?.map((q, qIndex) => (
            <div key={q.id} className={styles.questionCard}>
              
              {/* Tiêu đề câu hỏi & Điểm */}
              <div className={styles.questionHeader}>
                <h3 className={styles.questionText}>
                  Câu {qIndex + 1}: {q.question_text}
                </h3>
                <span className={styles.questionWeight}>{q.weight} điểm</span>
              </div>

              {/* Code Snippet (Nếu có) */}
              {q.code_snippet && (
                <div className={styles.codeSnippet}>
                  <pre><code>{q.code_snippet}</code></pre>
                </div>
              )}

              {/* Khu vực Đáp án */}
              <div className={styles.answersContainer}>
                {q.question_type === 'fill_text' 
                  ? renderFillTextAnswer(q)
                  : q.answers?.map((ans, aIndex) => {
                      // Kiểm tra xem ID đáp án này có nằm trong lựa chọn của sinh viên không
                      const isSelected = q.selected_answer_id === ans.id || 
                                        (Array.isArray(q.selected_answer_id) && q.selected_answer_id.includes(ans.id));
                      return renderMCQAnswer(ans, isSelected, aIndex);
                    })
                }
              </div>

            </div>
          ))}
        </div>

        {/* --- FOOTER --- */}
        <div className={styles.footer}>
          <button className={styles.btnCancel} onClick={onClose}>Đóng</button>
        </div>

      </div>
    </div>
  );
}