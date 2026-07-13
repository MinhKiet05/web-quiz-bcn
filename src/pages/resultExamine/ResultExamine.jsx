import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Trophy, CheckCircle, XCircle, Clock, Info, ArrowLeft, BarChart2, Eye
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner'; // Nhớ import toast để hiện thông báo lỗi bảo mật
import styles from './ResultExamine.module.css';

export default function ResultExamine() {
  const { id } = useParams(); // id của attempt (lượt làm bài)
  const navigate = useNavigate();
  const [resultData, setResultData] = useState(null);
  const [maxScore, setMaxScore] = useState(0); // State lưu tổng điểm tuyệt đối
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        // Lấy thông tin lượt làm bài kết hợp với Quiz, Category và lấy cả cột 'weight' của Câu hỏi
        const { data, error } = await supabase
          .from('attempts')
          .select(`
            *,
            quizzes (
              title,
              quiz_type,
              categories (name),
              questions (weight)
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;

        // ==========================================
        // BẢO MẬT: CHẶN XEM KẾT QUẢ NGƯỜI KHÁC
        // ==========================================
        const storedUser = JSON.parse(localStorage.getItem('web-quiz-bcn-auth-user'));
        if (storedUser && data.user_id !== storedUser.mssv) {
          toast.error('Cảnh báo: Bạn không có quyền xem kết quả của người khác!');
          navigate('/quiz-list', { replace: true });
          return;
        }

        // ==========================================
        // LOGIC TÍNH TỔNG ĐIỂM TỐI ĐA TỪ DATABASE
        // ==========================================
        const calculatedMaxScore = data.quizzes?.questions?.reduce((sum, q) => {
          // Lấy weight, nếu câu nào null thì mặc định 10 điểm (Khớp với SQL COALESCE)
          return sum + (q.weight || 10); 
        }, 0) || 0;

        setMaxScore(calculatedMaxScore);
        setResultData(data);
      } catch (err) {
        console.error('Lỗi khi tải kết quả:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchResult();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingText}>Đang tải kết quả...</div>
      </div>
    );
  }

  if (!resultData) {
    return (
      <div className={styles.container}>
        <div className={styles.errorText}>Không tìm thấy dữ liệu kết quả bài thi.</div>
      </div>
    );
  }

  // Bóc tách dữ liệu
  const { 
    score, 
    total_correct, 
    total_questions, 
    completion_time, 
    is_weekly_attempt,
    quizzes 
  } = resultData;

  const title = quizzes?.title || 'Bài thi lập trình';
  const categoryName = quizzes?.categories?.name || 'Không xác định';
  const incorrectCount = total_questions - total_correct;

  // Format thời gian từ giây sang Xm Ys
  const formatTime = (seconds) => {
    if (!seconds) return '0m 0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.resultCard}>
        
        {/* Hào quang nền phía trên thẻ */}
        <div className={styles.glowTop}></div>

        {/* Tiêu đề & Thông tin Quiz */}
        <h1 className={styles.mainTitle}>Chúc mừng bạn đã hoàn thành bài thi!</h1>
        <div className={styles.subtitleWrapper}>
          <span className={styles.tagCategory}>{categoryName}</span>
          <span className={styles.quizTitle}>{title}</span>
        </div>

        {/* Điểm số tổng quan */}
        <div className={styles.scoreSection}>
          <p className={styles.scoreLabel}>ĐIỂM SỐ CỦA BẠN</p>
          <div className={styles.scoreValue}>
            <span className={styles.highlightScore}>{score}</span>
            <span className={styles.maxScore}> / {maxScore}</span>
          </div>
        </div>

        {/* Thống kê chi tiết (3 Box) */}
        <div className={styles.statsGrid}>
          <div className={styles.statBox}>
            <CheckCircle size={22} className={styles.iconCorrect} />
            <p className={styles.statLabel}>Số câu đúng</p>
            <p className={styles.statValue}>{total_correct}</p>
          </div>
          
          <div className={styles.statBox}>
            <XCircle size={22} className={styles.iconIncorrect} />
            <p className={styles.statLabel}>Số câu sai</p>
            <p className={styles.statValue}>{incorrectCount}</p>
          </div>

          <div className={styles.statBox}>
            <Clock size={22} className={styles.iconTime} />
            <p className={styles.statLabel}>Thời gian hoàn thành</p>
            <p className={styles.statValue}>{formatTime(completion_time)}</p>
          </div>
        </div>

        {/* Cảnh báo dành riêng cho Weekly Quiz */}
        {is_weekly_attempt && (
          <div className={styles.warningBox}>
            <Info size={20} className={styles.warningIcon} />
            <p className={styles.warningText}>
              Đây là bài thi tuần (Weekly Quiz). Đáp án chi tiết hiện đang được ẩn cho đến khi thời gian thi kết thúc. Điểm số của bạn đã được ghi nhận vào Bảng xếp hạng tuần!
            </p>
          </div>
        )}

        {/* Khu vực Buttons */}
        <div className={styles.actionButtons}>
          <button 
            className={styles.btnSecondary} 
            onClick={() => navigate('/quiz-list')}
          >
            <ArrowLeft size={18} /> Quay lại Danh sách Quiz
          </button>

          {is_weekly_attempt ? (
            <button 
              className={styles.btnPrimaryWeekly} 
              onClick={() => navigate('/leaderboard')}
            >
              <BarChart2 size={18} /> Xem Bảng xếp hạng
            </button>
          ) : (
            <button 
              className={styles.btnPrimaryNormal} 
              onClick={() => navigate(`/history/review/${id}`)} 
            >
              <Eye size={18} /> Xem lại bài làm
            </button>
          )}
        </div>

      </div>
    </div>
  );
}