import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, Plus, CheckCircle2, Circle, Code2 } from 'lucide-react';
import { toast } from 'sonner';
import styles from './QuizManagerModal.module.css';

const formatDateTimeForInput = (dateStr) => {
  if (!dateStr) return '';
  return dateStr.replace(' ', 'T').substring(0, 16);
};

export default function QuizManagerModal({ isOpen, onClose, onSave, initialData = null }) {
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    category_id: '1',
    quiz_type: 'normal',
    difficulty: 'medium',
    duration: 60,
    status: 'active',
    weekly_start: '',
    weekly_end: '',
    questions: []
  });

  // State lưu trữ lỗi (Thêm weights để báo lỗi điểm số)
  const [errors, setErrors] = useState({ questions: {}, answers: {}, weights: {} });

  // Refs để focus vào ô nhập lỗi
  const titleRef = useRef(null);
  const durationRef = useRef(null);
  const weeklyStartRef = useRef(null);
  const weeklyEndRef = useRef(null);
  const qRefs = useRef({});
  const aRefs = useRef({});
  const wRefs = useRef({}); // Thêm ref cho ô nhập điểm

  useEffect(() => {
    if (isOpen) {
      setErrors({ questions: {}, answers: {}, weights: {} }); // Xóa lỗi cũ khi mở modal
      
      if (initialData) {
        const loadedQuestions = initialData.questions && initialData.questions.length > 0 
          ? initialData.questions 
          : [
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
            ];

        setQuizData({
          ...initialData,
          description: initialData.description || '',
          weekly_start: formatDateTimeForInput(initialData.weekly_start),
          weekly_end: formatDateTimeForInput(initialData.weekly_end),
          questions: loadedQuestions
        });
      } else {
        setQuizData({
          title: '',
          description: '',
          category_id: '1',
          quiz_type: 'normal',
          difficulty: 'medium',
          duration: 60,
          status: 'active',
          weekly_start: '',
          weekly_end: '',
          questions: [
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
        });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleInfoChange = (field, value) => {
    setQuizData(prev => ({ ...prev, [field]: value }));
    // Tự động xóa lỗi khi người dùng sửa
    setErrors(prev => ({ ...prev, [field]: false })); 
  };

  const toggleStatus = () => {
    setQuizData(prev => ({ ...prev, status: prev.status === 'active' ? 'draft' : 'active' }));
  };

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
    // Báo toast vị trí phía dưới
    toast.success('Đã thêm 1 câu hỏi mới', { position: 'bottom-center' });
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
      
      if (field === 'question_type' && value === 'fill_text') {
        newQuestions[qIndex].answers = newQuestions[qIndex].answers.map(ans => ({ ...ans, is_correct: true }));
      }
      return { ...prev, questions: newQuestions };
    });
    // Xóa lỗi câu hỏi & điểm số khi user nhập lại
    setErrors(prev => ({ 
      ...prev, 
      questions: { ...prev.questions, [qIndex]: false },
      weights: { ...prev.weights, [qIndex]: false }
    }));
  };

  const handleAddAnswer = (qIndex) => {
    setQuizData(prev => {
      const newQuestions = [...prev.questions];
      const isFillText = newQuestions[qIndex].question_type === 'fill_text';
      
      newQuestions[qIndex].answers.push({
        id: Date.now(),
        answer_text: '', 
        is_correct: isFillText 
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
    // Xóa lỗi đáp án khi user nhập lại
    setErrors(prev => ({ ...prev, answers: { ...prev.answers, [`${qIndex}-${aIndex}`]: false } }));
  };

  const handleSetCorrectAnswer = (qIndex, aIndex) => {
    setQuizData(prev => {
      const newQuestions = [...prev.questions];
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
    let newErrors = { questions: {}, answers: {}, weights: {} };
    let firstErrorRef = null;

    // 1. Kiểm tra Tên Quiz
    if (!quizData.title.trim()) {
      newErrors.title = true;
      toast.error('Tên bài Quiz không được để trống!');
      if (!firstErrorRef) firstErrorRef = titleRef.current;
    }

    // 2. Kiểm tra Logic Thời gian & Quiz Type
    if (quizData.quiz_type === 'normal') {
      if (!quizData.duration || quizData.duration < 1) {
        newErrors.duration = true;
        if (!firstErrorRef) {
          toast.error('Thời gian làm bài cho Quiz bình thường phải từ 1 phút trở lên!');
          firstErrorRef = durationRef.current;
        }
      }
    } else if (quizData.quiz_type === 'weekly') {
      if (!quizData.weekly_start) {
        newErrors.weekly_start = true;
        if (!firstErrorRef) {
          toast.error('Vui lòng chọn thời gian bắt đầu cho Weekly Quiz!');
          firstErrorRef = weeklyStartRef.current;
        }
      } else if (!quizData.weekly_end) {
        newErrors.weekly_end = true;
        if (!firstErrorRef) {
          toast.error('Vui lòng chọn thời gian kết thúc cho Weekly Quiz!');
          firstErrorRef = weeklyEndRef.current;
        }
      } else {
        const start = new Date(quizData.weekly_start).getTime();
        const end = new Date(quizData.weekly_end).getTime();
        if (end <= start) {
          newErrors.weekly_end = true;
          if (!firstErrorRef) {
            toast.error('Thời gian kết thúc không được bằng hoặc trước thời gian bắt đầu!');
            firstErrorRef = weeklyEndRef.current;
          }
        }
      }
    }

    // 3. Kiểm tra Câu hỏi & Đáp án
    quizData.questions.forEach((q, qIndex) => {
      
      // Kiểm tra điểm số (từ 1 đến 100)
      if (q.weight === '' || q.weight < 1 || q.weight > 100 || isNaN(q.weight)) {
        newErrors.weights[qIndex] = true;
        if (!firstErrorRef) {
          toast.error(`Điểm của câu hỏi số ${qIndex + 1} không hợp lệ (Phải từ 1 - 100)!`);
          firstErrorRef = wRefs.current[qIndex];
        }
      }

      // Nội dung câu hỏi trống
      if (!q.question_text.trim()) {
        newErrors.questions[qIndex] = true;
        if (!firstErrorRef) {
          toast.error(`Câu hỏi số ${qIndex + 1} không được bỏ trống nội dung!`);
          firstErrorRef = qRefs.current[qIndex];
        }
      }

      // Đáp án trùng lặp (Chỉ xét các đáp án có nhập chữ, khoảng trắng/rỗng sẽ bị bỏ qua và lọc sau)
      const seen = new Set();
      q.answers.forEach((ans, aIndex) => {
        const text = ans.answer_text.trim().toLowerCase();
        
        if (text !== '') {
          if (seen.has(text)) {
            newErrors.answers[`${qIndex}-${aIndex}`] = true;
            if (!firstErrorRef) {
              toast.error(`Đáp án trong câu hỏi số ${qIndex + 1} bị trùng lặp!`);
              firstErrorRef = aRefs.current[`${qIndex}-${aIndex}`];
            }
          }
          seen.add(text);
        }
      });
    });

    // Nếu có lỗi, Focus vào phần tử bị lỗi đầu tiên và dừng lưu
    if (firstErrorRef) {
      setErrors(newErrors);
      firstErrorRef.focus();
      firstErrorRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Tự động XÓA CÁC ĐÁP ÁN BỎ TRỐNG trước khi đưa vào payload
    const finalQuestions = quizData.questions.map(q => ({
      ...q,
      answers: q.answers.filter(ans => ans.answer_text.trim() !== '')
    }));

    // Tiến hành lưu nếu hợp lệ
    const payload = {
      ...quizData,
      description: quizData.description.trim() === '' ? null : quizData.description,
      weekly_start: quizData.weekly_start === '' ? null : quizData.weekly_start,
      weekly_end: quizData.weekly_end === '' ? null : quizData.weekly_end,
      questions: finalQuestions // Sử dụng danh sách câu hỏi đã được làm sạch
    };
    
    if (payload.quiz_type !== 'weekly') {
      payload.weekly_start = null;
      payload.weekly_end = null;
    } else {
      payload.duration = 0;
    }

    if (onSave) onSave(payload);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        
        <div className={styles.header}>
          <h2>{initialData ? 'Sửa Quiz' : 'Thêm Quiz'}</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        <div className={styles.body}>
          <div className={styles.leftColumn}>
            <h3 className={styles.sectionTitle}>A. Thông tin chung</h3>
            
            <div className={styles.formGroup}>
              <label>Tên Quiz</label>
              <input 
                ref={titleRef}
                type="text" 
                className={`${styles.inputField} ${errors.title ? styles.inputError : ''}`} 
                placeholder="Nhập tên bài quiz..." 
                value={quizData.title} 
                onChange={(e) => handleInfoChange('title', e.target.value)} 
              />
            </div>

            <div className={styles.formGroup}>
              <label>Mô tả (Description)</label>
              <textarea 
                className={`${styles.textareaField} ${styles.descField}`} 
                placeholder="Nhập mô tả bài quiz..." 
                value={quizData.description} 
                onChange={(e) => handleInfoChange('description', e.target.value)} 
              />
            </div>

            <div className={styles.rowGrid}>
              <div className={styles.formGroup}>
                <label>Danh mục</label>
                <select className={styles.selectField} value={quizData.category_id} onChange={(e) => handleInfoChange('category_id', e.target.value)}>
                  <option value="1">C/C++</option>
                  <option value="2">Java</option>
                  <option value="3">Web</option>
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

            {quizData.quiz_type === 'weekly' && (
              <>
                <div className={styles.formGroup}>
                  <label>Weekly Start (Từ lúc)</label>
                  <input 
                    ref={weeklyStartRef}
                    type="datetime-local" 
                    className={`${styles.inputField} ${errors.weekly_start ? styles.inputError : ''}`} 
                    value={quizData.weekly_start} 
                    onChange={(e) => handleInfoChange('weekly_start', e.target.value)} 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Weekly End (Đến lúc)</label>
                  <input 
                    ref={weeklyEndRef}
                    type="datetime-local" 
                    className={`${styles.inputField} ${errors.weekly_end ? styles.inputError : ''}`} 
                    value={quizData.weekly_end} 
                    onChange={(e) => handleInfoChange('weekly_end', e.target.value)} 
                  />
                </div>
              </>
            )}

            <div className={quizData.quiz_type !== 'weekly' ? styles.rowGrid : ''}>
              <div className={styles.formGroup}>
                <label>Độ khó</label>
                <select className={styles.selectField} value={quizData.difficulty} onChange={(e) => handleInfoChange('difficulty', e.target.value)}>
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="hard">Khó</option>
                </select>
              </div>
              
              {quizData.quiz_type !== 'weekly' && (
                <div className={styles.formGroup}>
                  <label>Thời gian (phút)</label>
                  <input 
                    ref={durationRef}
                    type="number" 
                    className={`${styles.inputField} ${errors.duration ? styles.inputError : ''}`} 
                    value={quizData.duration || ''} 
                    onChange={(e) => handleInfoChange('duration', parseInt(e.target.value) || 0)} 
                  />
                </div>
              )}
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

          <div className={styles.rightColumn}>
            <div className={styles.questionHeader}>
              <h3 className={styles.sectionTitle}>B. Danh sách câu hỏi</h3>
              <button className={styles.btnAddOutline} onClick={handleAddQuestion}><Plus size={16} /> Thêm câu hỏi</button>
            </div>

            <div className={styles.questionsList}>
              {quizData.questions?.map((q, qIndex) => (
                <div key={q.id} className={styles.questionCard}>
                  
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
                        ref={el => wRefs.current[qIndex] = el}
                        type="number" 
                        className={`${styles.inputFieldSmall} ${errors.weights?.[qIndex] ? styles.inputError : ''}`} 
                        value={q.weight !== undefined ? q.weight : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleQuestionChange(qIndex, 'weight', val === '' ? '' : parseInt(val));
                        }}
                      />
                    </div>
                    <button className={styles.btnDeleteQuestion} onClick={() => handleDeleteQuestion(qIndex)} title="Xóa câu hỏi">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <textarea 
                    ref={el => qRefs.current[qIndex] = el}
                    className={`${styles.textareaField} ${errors.questions[qIndex] ? styles.inputError : ''}`} 
                    placeholder="Nhập nội dung câu hỏi..."
                    value={q.question_text}
                    onChange={(e) => handleQuestionChange(qIndex, 'question_text', e.target.value)}
                  />

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

                  <div className={styles.answersContainer}>
                    <p className={styles.answerHint}>
                      {q.question_type === 'fill_text' 
                        ? "Nhập các biến thể đáp án đúng được chấp nhận (Vd: malloc, malloc()):" 
                        : "Chọn 1 đáp án đúng (Bỏ trống sẽ tự động xóa):"}
                    </p>
                    
                    {q.answers?.map((ans, aIndex) => (
                      <div key={ans.id} className={styles.answerRow}>
                        
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
                          ref={el => aRefs.current[`${qIndex}-${aIndex}`] = el}
                          type="text" 
                          className={`${styles.inputField} ${errors.answers[`${qIndex}-${aIndex}`] ? styles.inputError : ''}`} 
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