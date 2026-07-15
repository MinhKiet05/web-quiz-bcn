import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Folder, BarChart2, ListOrdered, Clock, Component, AlertTriangle, Play, CheckCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import styles from './StartQuiz.module.css';

export default function StartQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quizDetails, setQuizDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State mới: Kiểm tra người dùng đã làm bài chưa
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    const fetchQuizAndAttempts = async () => {
      try {
        setLoading(true);

        // 1. Lấy thông tin user hiện tại từ LocalStorage
        const storedUser = localStorage.getItem('web-quiz-bcn-auth-user');
        const user = storedUser ? JSON.parse(storedUser) : null;

        // 2. Truy vấn chi tiết Quiz
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*, categories(name)')
          .eq('id', id)
          .single();

        if (quizError) throw quizError;
        setQuizDetails(quizData);

        // 3. Nếu đã đăng nhập, kiểm tra xem đã từng làm bài này chưa
        if (user) {
          const { data: attemptData, error: attemptError } = await supabase
            .from('attempts')
            .select('id, status')
            .eq('quiz_id', id)
            .eq('user_id', user.mssv)
            .eq('is_delete', false);

          if (!attemptError && attemptData && attemptData.length > 0) {
            setHasAttempted(true); // Đã có lịch sử làm bài
          }
        }

      } catch (err) {
        console.error('Lỗi tải dữ liệu Quiz:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchQuizAndAttempts();
  }, [id]);

  if (loading) {
    return <div className={styles.container}><div className={styles.loading}>Đang tải dữ liệu...</div></div>;
  }

  if (!quizDetails) {
    return <div className={styles.container}><div className={styles.error}>Không tìm thấy bài Quiz!</div></div>;
  }

  const categoryName = quizDetails.categories?.name || 'Không xác định';
  const isWeekly = quizDetails.quiz_type === 'weekly';
  const displayDifficulty = quizDetails.difficulty === 'hard' ? 'Khó' : quizDetails.difficulty === 'medium' ? 'Trung bình' : 'Dễ';
  
  const getDifficultyClass = (level) => {
    if (level === 'hard') return styles.diffHard;
    if (level === 'medium') return styles.diffMedium;
    return styles.diffEasy;
  };

  const handleStart = () => {
    navigate(`/quiz/do/${id}`);
  };

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={() => navigate('/quiz-list')}>
        <ArrowLeft size={18} />
        <span>Quay lại danh sách</span>
      </button>

      <div className={styles.mainCard}>
        
        <div className={styles.headerSection}>
          <h1 className={styles.title}>{quizDetails.title}</h1>
          <p className={styles.description}>
            {quizDetails.description || 'Bài thi đánh giá kiến thức lập trình. Vui lòng đọc kỹ câu hỏi và trả lời trong thời gian quy định.'}
          </p>
        </div>

        <div className={styles.metaGrid}>
          {/* ... (Giữ nguyên các Item 1, 2, 3, 4, 5 ở đây) ... */}
           {/* Item 1: Danh mục */}
           <div className={styles.metaItem}>
            <div className={styles.metaLabel}>
              <Folder size={16} /> DANH MỤC
            </div>
            <div className={styles.metaValue}>
              <span className={styles.tagCategory}>{categoryName}</span>
            </div>
          </div>

          {/* Item 2: Độ khó */}
          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>
              <BarChart2 size={16} /> ĐỘ KHÓ
            </div>
            <div className={styles.metaValue}>
              <span className={`${styles.tagBase} ${getDifficultyClass(quizDetails.difficulty)}`}>
                {displayDifficulty}
              </span>
            </div>
          </div>

          {/* Item 3: Số câu hỏi */}
          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>
              <ListOrdered size={16} /> SỐ CÂU HỎI
            </div>
            <div className={styles.metaValueText}>
              {quizDetails.total_questions || 0} câu
            </div>
          </div>

          {/* Item 4: Thời gian */}
          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>
              <Clock size={16} /> THỜI GIAN
            </div>
            <div className={styles.metaValueText}>
              {isWeekly ? 'Không giới hạn' : `${quizDetails.duration} phút`}
            </div>
          </div>

          {/* Item 5: Loại Quiz */}
          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>
              <Component size={16} /> LOẠI QUIZ
            </div>
            <div className={styles.metaValueText}>
              {isWeekly ? 'Weekly Quiz' : 'Normal Quiz'}
            </div>
          </div>
        </div>

        {/* Khung cảnh báo / Thông báo hoàn thành */}
        {isWeekly && hasAttempted ? (
          <div className={styles.successBox}>
            <div className={styles.warningHeader}>
              <CheckCircle size={20} className={styles.successIcon} />
              <h4 className={styles.successTitle}>Bạn đã hoàn thành Quiz tuần này!</h4>
            </div>
            <p className={styles.successText}>
              Mỗi tài khoản chỉ được tham gia Weekly Quiz 1 lần duy nhất. Kết quả của bạn đã được ghi nhận trên bảng xếp hạng. Hẹn gặp lại bạn vào tuần sau nhé!
            </p>
          </div>
        ) : (
          <div>
            
          </div>
        )}

        {/* Footer Buttons */}
        <div className={styles.footerSection}>
          <button className={styles.btnCancel} onClick={() => navigate('/quiz-list')}>
            {hasAttempted ? 'Quay lại' : 'Hủy bỏ'}
          </button>
          
          {/* Logic chặn nút: Ẩn nút làm bài nếu là weekly quiz VÀ đã làm */}
          {(!isWeekly || !hasAttempted) && (
             <button className={styles.btnStart} onClick={handleStart}>
                BẮT ĐẦU LÀM BÀI <Play size={16} fill="currentColor" />
             </button>
          )}
        </div>

      </div>
    </div>
  );
}