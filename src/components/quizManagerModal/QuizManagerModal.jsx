import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, CheckCircle2, Circle, Code2 } from 'lucide-react';
import styles from './QuizManagerModal.module.css';

export default function QuizManagerModal({ isOpen, onClose, onSave, initialData = null }) {
  const [quizData, setQuizData] = useState({
    title: '',
    category_id: '1',
    quiz_type: 'normal',
    difficulty: 'medium',
    duration: 60,
    status: 'active',
    questions: []
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setQuizData(initialData);
      } else {
        setQuizData({
          title: '',
          category_id: '1',
          quiz_type: 'normal',
          difficulty: 'medium',
          duration: 60,
          status: 'active',
          questions: [
            {
              id: Date.now(),
              question_text: '',
              question_type: 'mcq', // Mặc định là trắc nghiệm
              code_snippet: '',
              weight: 10,
              answers: [
                { id: Date.now() + 1, answer_text: '', is_correct: true },
                { id: Date.now() + 2, answer_text: '', is_correct: false }
              ]
            }
          ]
        });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleInfoChange = (field, value) => {
    setQuizData(prev => ({ ...prev, [field]: value }));
  };

  const toggleStatus = () => {
    setQuizData(prev => ({ ...prev, status: prev.status === 'active' ? 'draft' : 'active' }));
  };

  // --- QUẢN LÝ CÂU HỎI ---
  const handleAddQuestion = () => {
    setQuizData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: Date.now(),
          question_text: '',
          question_type: 'mcq',
          code_snippet: '',
          weight: 10,
          answers: [
            { id: Date.now() + 1, answer_text: '', is_correct: true },
            { id: Date.now() + 2, answer_text: '', is_correct: false }
          ]
        }
      ]
    }));
  };

  const handleDeleteQuestion = (qIndex) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, idx) => idx !== qIndex)
    }));
  };

  const handleQuestionChange = (qIndex, field, value) => {
    setQuizData(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[qIndex][field] = value;
      
      // Nếu đổi sang Điền khuyết, tự động set tất cả đáp án hiện tại thành True (đáp án được chấp nhận)
      if (field === 'question_type' && value === 'fill_text') {
        newQuestions[qIndex].answers = newQuestions[qIndex].answers.map(ans => ({ ...ans, is_correct: true }));
      }

      return { ...prev, questions: newQuestions };
    });
  };

  // --- QUẢN LÝ ĐÁP ÁN ---
  const handleAddAnswer = (qIndex) => {
    setQuizData(prev => {
      const newQuestions = [...prev.questions];
      const isFillText = newQuestions[qIndex].question_type === 'fill_text';
      
      newQuestions[qIndex].answers.push({
        id: Date.now(),
        answer_text: '', 
        is_correct: isFillText // Nếu là điền khuyết, mặc định add vào là true
      });
      return { ...prev, questions: newQuestions };
    });
  };

  const handleDeleteAnswer = (qIndex, aIndex) => {
    setQuizData(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[qIndex].answers = newQuestions[qIndex].answers.filter((_, idx) => idx !== aIndex);
      return { ...prev, questions: newQuestions };
    });
  };

  const handleAnswerChange = (qIndex, aIndex, value) => {
    setQuizData(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[qIndex].answers[aIndex].answer_text = value; 
      return { ...prev, questions: newQuestions };
    });
  };

  const handleSetCorrectAnswer = (qIndex, aIndex) => {
    setQuizData(prev => {
      const newQuestions = [...prev.questions];
      // Chỉ hoạt động khi là trắc nghiệm (mcq)
      if (newQuestions[qIndex].question_type === 'mcq') {
        newQuestions[qIndex].answers = newQuestions[qIndex].answers.map((ans, idx) => ({
          ...ans,
          is_correct: idx === aIndex
        }));
      }
      return { ...prev, questions: newQuestions };
    });
  };

  const handleSubmit = () => {
    if (onSave) onSave(quizData);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        
        <div className={styles.header}>
          <h2>Thêm/Sửa Quiz</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        <div className={styles.body}>
          {/* CỘT TRÁI: THÔNG TIN CHUNG */}
          <div className={styles.leftColumn}>
            <h3 className={styles.sectionTitle}>A. Thông tin chung</h3>
            
            <div className={styles.formGroup}>
              <label>Tên Quiz</label>
              <input type="text" className={styles.inputField} placeholder="Nhập tên bài quiz..." value={quizData.title} onChange={(e) => handleInfoChange('title', e.target.value)} />
            </div>

            <div className={styles.rowGrid}>
              <div className={styles.formGroup}>
                <label>Danh mục</label>
                <select className={styles.selectField} value={quizData.category_id} onChange={(e) => handleInfoChange('category_id', e.target.value)}>
                  <option value="1">C/C++</option>
                  <option value="2">Mobile Development</option>
                  <option value="3">Web Development</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Loại Quiz</label>
                <select className={styles.selectField} value={quizData.quiz_type} onChange={(e) => handleInfoChange('quiz_type', e.target.value)}>
                  <option value="normal">Normal</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>

            <div className={styles.rowGrid}>
              <div className={styles.formGroup}>
                <label>Độ khó</label>
                <select className={styles.selectField} value={quizData.difficulty} onChange={(e) => handleInfoChange('difficulty', e.target.value)}>
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="hard">Khó</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Thời gian (phút)</label>
                <input type="number" className={styles.inputField} value={quizData.duration} onChange={(e) => handleInfoChange('duration', parseInt(e.target.value) || 0)} />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Trạng thái</label>
              <div className={styles.toggleWrapper} onClick={toggleStatus}>
                <div className={`${styles.toggleTrack} ${quizData.status === 'active' ? styles.active : ''}`}>
                  <div className={styles.toggleThumb}></div>
                </div>
                <span className={styles.toggleLabel}>{quizData.status === 'active' ? 'Active' : 'Draft'}</span>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: QUẢN LÝ CÂU HỎI */}
          <div className={styles.rightColumn}>
            <div className={styles.questionHeader}>
              <h3 className={styles.sectionTitle}>B. Danh sách câu hỏi</h3>
              <button className={styles.btnAddOutline} onClick={handleAddQuestion}><Plus size={16} /> Thêm câu hỏi</button>
            </div>

            <div className={styles.questionsList}>
              {quizData.questions?.map((q, qIndex) => (
                <div key={q.id} className={styles.questionCard}>
                  
                  {/* Cài đặt cấu hình câu hỏi */}
                  <div className={styles.questionConfigRow}>
                    <div className={styles.formGroupInline}>
                      <label>Loại:</label>
                      <select 
                        className={styles.selectFieldSmall} 
                        value={q.question_type || 'mcq'}
                        onChange={(e) => handleQuestionChange(qIndex, 'question_type', e.target.value)}
                      >
                        <option value="mcq">Trắc nghiệm</option>
                        <option value="fill_text">Điền khuyết</option>
                      </select>
                    </div>
                    <div className={styles.formGroupInline}>
                      <label>Điểm:</label>
                      <input 
                        type="number" 
                        className={styles.inputFieldSmall} 
                        value={q.weight || 10}
                        onChange={(e) => handleQuestionChange(qIndex, 'weight', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <button className={styles.btnDeleteQuestion} onClick={() => handleDeleteQuestion(qIndex)} title="Xóa câu hỏi">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Nội dung câu hỏi */}
                  <textarea 
                    className={styles.textareaField} 
                    placeholder="Nhập nội dung câu hỏi..."
                    value={q.question_text}
                    onChange={(e) => handleQuestionChange(qIndex, 'question_text', e.target.value)}
                  />

                  {/* Code Snippet (Tùy chọn) */}
                  <div className={styles.codeSnippetWrapper}>
                    <div className={styles.codeSnippetHeader}>
                      <Code2 size={14} /> <span>Code Snippet đính kèm (Tùy chọn)</span>
                    </div>
                    <textarea 
                      className={styles.codeField} 
                      placeholder="Dán đoạn code vào đây (nếu có)..."
                      value={q.code_snippet || ''}
                      onChange={(e) => handleQuestionChange(qIndex, 'code_snippet', e.target.value)}
                    />
                  </div>

                  {/* Danh sách đáp án */}
                  <div className={styles.answersContainer}>
                    <p className={styles.answerHint}>
                      {q.question_type === 'fill_text' 
                        ? "Nhập các biến thể đáp án đúng được chấp nhận (Vd: malloc, malloc()):" 
                        : "Chọn 1 đáp án đúng:"}
                    </p>
                    
                    {q.answers?.map((ans, aIndex) => (
                      <div key={ans.id} className={styles.answerRow}>
                        
                        {/* Ẩn radio tick nếu là điền khuyết (vì cái nào cũng đúng) */}
                        {q.question_type === 'mcq' ? (
                          <button 
                            className={`${styles.radioBtn} ${ans.is_correct ? styles.radioChecked : ''}`}
                            onClick={() => handleSetCorrectAnswer(qIndex, aIndex)}
                            title="Đánh dấu là đáp án đúng"
                          >
                            {ans.is_correct ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                          </button>
                        ) : (
                          <div className={styles.radioChecked} style={{opacity: 0.5}}><CheckCircle2 size={18} /></div>
                        )}

                        <input 
                          type="text" 
                          className={styles.inputField} 
                          placeholder={q.question_type === 'fill_text' ? "Đáp án được chấp nhận..." : "Nhập đáp án..."}
                          value={ans.answer_text} 
                          onChange={(e) => handleAnswerChange(qIndex, aIndex, e.target.value)}
                        />
                        <button className={styles.btnDeleteAnswer} onClick={() => handleDeleteAnswer(qIndex, aIndex)}><X size={18} /></button>
                      </div>
                    ))}
                  </div>

                  <button className={styles.btnAddText} onClick={() => handleAddAnswer(qIndex)}><Plus size={14} /> Thêm đáp án</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.btnCancel} onClick={onClose}>Hủy bỏ</button>
          <button className={styles.btnSave} onClick={handleSubmit}>Lưu quiz</button>
        </div>

      </div>
    </div>
  );
}