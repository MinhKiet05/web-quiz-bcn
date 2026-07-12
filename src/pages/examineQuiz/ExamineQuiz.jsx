import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, LayoutGrid, ArrowLeft, ArrowRight, Send } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import styles from './ExamineQuiz.module.css';
import ConfirmationSubmitModal from '../../components/confirmationModal/ConfirmationSubmitModal';

export default function ExamineQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [startTime] = useState(Date.now()); 
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  
  // Lưu đáp án. Nếu là mcq -> UUID, nếu là fill_text -> String
  const [answers, setAnswers] = useState({}); 
  const [currentIndex, setCurrentIndex] = useState(0);

  const [timeSeconds, setTimeSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setLoading(true);
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', id)
          .single();
        if (quizError) throw quizError;
        setQuiz(quizData);

        if (quizData.quiz_type === 'weekly') {
          setTimeSeconds(0);
        } else {
          setTimeSeconds(quizData.duration * 60); 
        }

        const { data: questionsData, error: qError } = await supabase
          .from('questions')
          .select(`
            *,
            answers (*)
          `)
          .eq('quiz_id', id)
          .order('display_order', { ascending: true });

        if (qError) throw qError;

        const formattedQuestions = questionsData.map(q => ({
          ...q,
          answers: q.answers.sort((a, b) => a.display_order - b.display_order)
        }));

        setQuestions(formattedQuestions);

      } catch (err) {
        toast.error('Lỗi tải dữ liệu bài thi!');
        navigate('/quiz-list');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchQuizData();
  }, [id, navigate]);

  useEffect(() => {
    if (loading || !quiz || submitting) return;

    const timer = setInterval(() => {
      setTimeSeconds(prev => {
        if (quiz.quiz_type === 'weekly') {
          return prev + 1; 
        } else {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit(); 
            return 0;
          }
          return prev - 1;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, quiz, submitting]);

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Hàm lưu đáp án MCQ
  const handleSelectAnswer = (questionId, answerId) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
  };

  // Hàm lưu đáp án Fill Text
  const handleInputAnswer = (questionId, text) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: text
    }));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    const toastId = toast.loading('Đang nộp bài...');

    try {
      const storedUser = JSON.parse(localStorage.getItem('web-quiz-bcn-auth-user'));
      if (!storedUser) throw new Error('Không tìm thấy phiên đăng nhập');

      // Tách dữ liệu cho đúng định dạng hàm SQL mới
      const formattedAnswers = questions.map(q => {
        const answerValue = answers[q.id];
        return {
          question_id: q.id,
          selected_answer_id: q.question_type === 'mcq' ? (answerValue || null) : null,
          fill_text_answer: q.question_type === 'fill_text' ? (answerValue || null) : null
        };
      });

      const actualDurationSeconds = Math.floor((Date.now() - startTime) / 1000);

      let completionTime;
      if (quiz.quiz_type === 'weekly') {
        completionTime = actualDurationSeconds; 
      } else {
        const maxDurationSeconds = quiz.duration * 60;
        completionTime = Math.min(actualDurationSeconds, maxDurationSeconds);
      }
      
      const { data, error } = await supabase.rpc('submit_quiz_attempt', {
        p_user_id: storedUser.mssv,
        p_quiz_id: id,
        p_answers: formattedAnswers,
        p_completion_time: completionTime
      });

      if (error) throw error;

      toast.success('Nộp bài thành công!', { id: toastId });
      navigate('/history');

    } catch (err) {
      toast.error('Lỗi khi nộp bài: ' + err.message, { id: toastId });
      setSubmitting(false);
    }
  };

  if (loading) return <div className={styles.loadingScreen}>Đang chuẩn bị bài thi...</div>;
  if (!quiz) return <div className={styles.loadingScreen}>Không tìm thấy thông tin bài thi.</div>;
  if (questions.length === 0) return (
    <div className={styles.loadingScreen}>
      Bài thi này hiện chưa có câu hỏi nào.
      <button onClick={() => navigate('/quiz-list')} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
        Quay lại
      </button>
    </div>
  );

  const currentQ = questions[currentIndex];
  
  // Logic kiểm tra câu nào đã làm (Xử lý cả chuỗi rỗng của fill_text)
  const answeredCount = questions.filter(q => answers[q.id] && String(answers[q.id]).trim() !== '').length;
  const progressPercent = (answeredCount / questions.length) * 100;

  return (
    <div className={styles.wrapper}>
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.quizTitle}>{quiz.title}</h1>
        </div>

        <div className={styles.headerCenter}>
          <span className={styles.progressText}>Câu {answeredCount} / {questions.length}</span>
          <div className={styles.progressBarBg}>
            <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={`${styles.timer} ${timeSeconds < 60 && quiz.quiz_type !== 'weekly' ? styles.timerWarning : ''}`}>
            <Clock size={18} />
            <span>{formatTime(timeSeconds)}</span>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className={styles.mainContent}>

        {/* KHUNG CÂU HỎI */}
        <div className={styles.questionSection}>
          <div className={styles.questionCard}>
            <div className={styles.questionMeta}>
              <div className={styles.questionIcon}>?</div>
              <span>CÂU {currentIndex + 1}</span>
            </div>

            <h2 className={styles.questionText}>{currentQ.question_text}</h2>

            {/* Hiển thị code snippet nếu có */}
            {currentQ.code_snippet && (
              <div className={styles.codeSnippet}>
                <pre><code>{currentQ.code_snippet}</code></pre>
              </div>
            )}

            {/* XUẤT HIỆN LOGIC PHÂN NHÁNH RENDER MCQ / FILL TEXT */}
            {currentQ.question_type === 'mcq' ? (
              <div className={styles.optionsList}>
                {currentQ.answers.map((ans, idx) => {
                  const isSelected = answers[currentQ.id] === ans.id;
                  const charLabel = String.fromCharCode(65 + idx); // A, B, C, D

                  return (
                    <div
                      key={ans.id}
                      className={`${styles.optionItem} ${isSelected ? styles.optionSelected : ''}`}
                      onClick={() => handleSelectAnswer(currentQ.id, ans.id)}
                    >
                      <div className={styles.radioCircle}>
                        {isSelected && <div className={styles.radioDot}></div>}
                      </div>
                      <span className={styles.optionChar}>{charLabel}.</span>
                      <span className={styles.optionText}>{ans.answer_text}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.fillTextContainer}>
                <input
                  type="text"
                  className={styles.fillTextInput}
                  placeholder="Nhập câu trả lời của bạn vào đây..."
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => handleInputAnswer(currentQ.id, e.target.value)}
                />
              </div>
            )}
          </div>

          <div className={styles.navigationButtons}>
            <button
              className={styles.navBtn}
              onClick={() => setCurrentIndex(prev => prev - 1)}
              disabled={currentIndex === 0}
            >
              <ArrowLeft size={18} /> Câu trước
            </button>
            <button
              className={styles.navBtnPrimary}
              onClick={() => setCurrentIndex(prev => prev + 1)}
              disabled={currentIndex === questions.length - 1}
            >
              Câu tiếp theo <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* BẢNG ĐIỀU KHIỂN BÊN PHẢI */}
        <aside className={styles.sidePanel}>
          <div className={styles.panelHeader}>
            <h3>Danh sách câu hỏi</h3>
            <LayoutGrid size={18} className={styles.gridIcon} />
          </div>

          <div className={styles.questionGrid}>
            {questions.map((q, idx) => {
              // Cập nhật điều kiện check đã làm: ko undefined & ko phải chuỗi trống
              const hasAnswered = answers[q.id] && String(answers[q.id]).trim() !== '';
              const isCurrent = idx === currentIndex;

              let btnClass = styles.gridBtn;
              if (hasAnswered) btnClass += ` ${styles.gridBtnAnswered}`;
              if (isCurrent) btnClass += ` ${styles.gridBtnCurrent}`;

              return (
                <button
                  key={q.id}
                  className={btnClass}
                  onClick={() => setCurrentIndex(idx)}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <div className={`${styles.legendDot} ${styles.dotAnswered}`}></div>
              <span>Đã trả lời</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendDot} ${styles.dotCurrent}`}></div>
              <span>Đang làm</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendDot} ${styles.dotUnanswered}`}></div>
              <span>Chưa trả lời</span>
            </div>
          </div>

          <button
            className={styles.submitBtn}
            onClick={() => setIsSubmitModalOpen(true)}
            disabled={submitting}
          >
            <Send size={18} /> {submitting ? 'ĐANG NỘP...' : 'NỘP BÀI'}
          </button>
        </aside>

      </main>
      <ConfirmationSubmitModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirm={() => {
          setIsSubmitModalOpen(false);
          handleSubmit();
        }}
      />
      <footer className={styles.footer}>
        Nếu xảy ra lỗi hãy chụp màn hình và báo với Ban Công Nghệ để được hỗ trợ
      </footer>
    </div>
  );
}