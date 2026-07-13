import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, ArrowLeft, ArrowRight, CheckCircle, XCircle, AlertCircle, Info, BookOpen 
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import styles from './ReviewExamine.module.css';

export default function ReviewExamine() {
  const { id } = useParams(); // ID của attempt
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    const fetchReviewData = async () => {
      try {
        setLoading(true);

        // 1. Lấy thông tin lượt làm bài (attempt) và quiz
        const { data: attemptData, error: attemptError } = await supabase
          .from('attempts')
          .select('*, quizzes(*)')
          .eq('id', id)
          .single();

        if (attemptError) throw attemptError;
        setAttempt(attemptData);
        setQuiz(attemptData.quizzes);

        // Kiểm tra logic hiển thị đáp án cho Weekly Quiz
        const isWeekly = attemptData.quizzes.quiz_type === 'weekly';
        if (isWeekly && attemptData.quizzes.weekly_end) {
          const now = new Date();
          const weeklyEnd = new Date(attemptData.quizzes.weekly_end);
          setShowAnswers(now >= weeklyEnd); // Chỉ hiện khi đã qua thời gian kết thúc
        } else {
          setShowAnswers(true); // Normal Quiz luôn hiện đáp án
        }

        // 2. Lấy toàn bộ câu hỏi và đáp án gốc
        const { data: questionsData, error: qError } = await supabase
          .from('questions')
          .select('*, answers(*)')
          .eq('quiz_id', attemptData.quiz_id)
          .order('display_order', { ascending: true });

        if (qError) throw qError;

        // 3. Lấy chi tiết các câu trả lời của sinh viên trong attempt này
        const { data: attemptAnswersData, error: aaError } = await supabase
          .from('attempt_answers')
          .select('*')
          .eq('attempt_id', id);

        if (aaError) throw aaError;

        // 4. Gộp dữ liệu: Trộn câu trả lời của user vào mảng câu hỏi
        const formattedQuestions = questionsData.map(q => {
          const userAns = attemptAnswersData.find(aa => aa.question_id === q.id);
          return {
            ...q,
            answers: q.answers.sort((a, b) => a.display_order - b.display_order),
            user_attempt: userAns || null
          };
        });

        setQuestions(formattedQuestions);

      } catch (err) {
        toast.error('Lỗi tải dữ liệu bài làm!');
        navigate('/history');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchReviewData();
  }, [id, navigate]);

  if (loading) return <div className={styles.loadingScreen}>Đang tải dữ liệu bài làm...</div>;
  if (!quiz || questions.length === 0) return <div className={styles.loadingScreen}>Không tìm thấy dữ liệu.</div>;

  const currentQ = questions[currentIndex];
  const userAttempt = currentQ.user_attempt;

  // Render trạng thái Icon trên thẻ câu hỏi (Đúng / Sai)
  const renderQuestionStatus = () => {
    if (!showAnswers) return <span className={styles.statusPending}>Chờ kết quả</span>;
    if (!userAttempt) return <span className={styles.statusIncorrect}><XCircle size={16}/> Bỏ qua</span>;
    return userAttempt.is_correct 
      ? <span className={styles.statusCorrect}><CheckCircle size={16}/> Chính xác</span>
      : <span className={styles.statusIncorrect}><XCircle size={16}/> Sai</span>;
  };

  return (
    <div className={styles.wrapper}>
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.quizTitle}>{quiz.title}</h1>
        </div>

        <div className={styles.headerCenter}>
          <span className={styles.reviewModeTag}>CHẾ ĐỘ XEM LẠI</span>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.scoreDisplay}>
            Điểm: <strong>{attempt.score}</strong>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className={styles.mainContent}>
        
        {/* KHUNG CÂU HỎI */}
        <div className={styles.questionSection}>
          
          {/* Cảnh báo Weekly Quiz (Nếu chưa tới giờ xem đáp án) */}
          {!showAnswers && (
            <div className={styles.weeklyWarning}>
              <AlertCircle size={20} className={styles.warningIcon} />
              <div>
                <strong>Bảo mật Quiz Tuần:</strong> Đáp án chi tiết và giải thích đang được ẩn. Bạn chỉ có thể xem lại bài hoàn chỉnh sau khi thời gian thi của tuần này kết thúc.
              </div>
            </div>
          )}

          <div className={styles.questionCard}>
            <div className={styles.questionMetaHeader}>
              <div className={styles.questionMeta}>
                <div className={styles.questionIcon}>?</div>
                <span>CÂU {currentIndex + 1}</span>
              </div>
              {renderQuestionStatus()}
            </div>

            <h2 className={styles.questionText}>{currentQ.question_text}</h2>

            {currentQ.code_snippet && (
              <div className={styles.codeSnippet}>
                <pre><code>{currentQ.code_snippet}</code></pre>
              </div>
            )}

            {/* XỬ LÝ RENDER MCQ HOẶC FILL TEXT */}
            {currentQ.question_type === 'mcq' ? (
              <div className={styles.optionsList}>
                {currentQ.answers.map((ans, idx) => {
                  const isUserSelected = userAttempt?.selected_answer_id === ans.id;
                  const isCorrectAnswer = ans.is_correct;
                  const charLabel = String.fromCharCode(65 + idx);

                  // Định hình CSS Class cho từng Option
                  let optionClass = styles.optionItem;
                  let dotClass = styles.radioCircle;

                  if (showAnswers) {
                    if (isCorrectAnswer) {
                      optionClass += ` ${styles.optionCorrect}`;
                      dotClass += ` ${styles.circleCorrect}`;
                    } else if (isUserSelected && !isCorrectAnswer) {
                      optionClass += ` ${styles.optionIncorrect}`;
                      dotClass += ` ${styles.circleIncorrect}`;
                    }
                  } else {
                    if (isUserSelected) {
                      optionClass += ` ${styles.optionSelected}`;
                      dotClass += ` ${styles.circleSelected}`;
                    }
                  }

                  return (
                    <div key={ans.id} className={optionClass}>
                      <div className={dotClass}>
                        {isUserSelected && <div className={styles.radioDot}></div>}
                        {/* Nếu không chọn nhưng đây là đáp án đúng, hiển thị tick nhỏ */}
                        {showAnswers && isCorrectAnswer && !isUserSelected && (
                           <CheckCircle size={14} className={styles.correctCheck} />
                        )}
                      </div>
                      <span className={styles.optionChar}>{charLabel}.</span>
                      <span className={styles.optionText}>{ans.answer_text}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              // XỬ LÝ FILL TEXT
              <div className={styles.fillTextContainer}>
                <label className={styles.fillLabel}>Câu trả lời của bạn:</label>
                <input
                  type="text"
                  className={`${styles.fillTextInput} ${
                    showAnswers 
                      ? (userAttempt?.is_correct ? styles.inputCorrect : styles.inputIncorrect)
                      : ''
                  }`}
                  value={userAttempt?.fill_text_answer || ''}
                  disabled
                  placeholder="Bạn đã bỏ trống câu này."
                />
                
                {/* Nếu sai và showAnswers = true, hiển thị đáp án đúng */}
                {showAnswers && !userAttempt?.is_correct && (
                  <div className={styles.correctFillTextAlert}>
                    <strong>Đáp án đúng:</strong> {currentQ.answers.find(a => a.is_correct)?.answer_text}
                  </div>
                )}
              </div>
            )}

            {/* KHUNG GIẢI THÍCH (EXPLANATION) */}
            {showAnswers && currentQ.explanation && (
              <div className={styles.explanationBox}>
                <div className={styles.explanationHeader}>
                  <BookOpen size={18} /> Giải thích chi tiết:
                </div>
                <div className={styles.explanationContent}>
                  {currentQ.explanation}
                </div>
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
              const uAttempt = q.user_attempt;
              const isCurrent = idx === currentIndex;
              
              let btnClass = styles.gridBtn;

              // Color coding cho Grid
              if (showAnswers) {
                if (!uAttempt) {
                   btnClass += ` ${styles.gridBtnUnanswered}`;
                } else if (uAttempt.is_correct) {
                   btnClass += ` ${styles.gridBtnCorrect}`;
                } else {
                   btnClass += ` ${styles.gridBtnIncorrect}`;
                }
              } else {
                if (uAttempt && (uAttempt.selected_answer_id || uAttempt.fill_text_answer)) {
                   btnClass += ` ${styles.gridBtnAnswered}`;
                }
              }

              if (isCurrent) btnClass += ` ${styles.gridBtnCurrent}`;

              return (
                <button key={q.id} className={btnClass} onClick={() => setCurrentIndex(idx)}>
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* LEGEND (Chú thích) */}
          <div className={styles.legend}>
            {showAnswers ? (
              <>
                <div className={styles.legendItem}>
                  <div className={`${styles.legendDot} ${styles.dotCorrect}`}></div><span>Đúng</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={`${styles.legendDot} ${styles.dotIncorrect}`}></div><span>Sai</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={`${styles.legendDot} ${styles.dotUnanswered}`}></div><span>Bỏ qua</span>
                </div>
              </>
            ) : (
              <>
                <div className={styles.legendItem}>
                  <div className={`${styles.legendDot} ${styles.dotAnswered}`}></div><span>Đã điền</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={`${styles.legendDot} ${styles.dotUnanswered}`}></div><span>Chưa điền</span>
                </div>
              </>
            )}
          </div>

          <button className={styles.backBtn} onClick={() => navigate('/history')}>
            <ArrowLeft size={18} /> QUAY LẠI LỊCH SỬ
          </button>
        </aside>

      </main>
    </div>
  );
}