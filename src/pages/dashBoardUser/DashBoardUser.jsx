import React, { useState, useEffect } from 'react';
import { 
  CircleUserRound, 
  Contact2, 
  Mail, 
  BookOpen, 
  Trophy, 
  TrendingUp 
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import styles from './DashBoardUser.module.css';

export default function DashBoardUser() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    recentCount: 0,
    highestScore: 0,
    maxPossibleOfHighest: 0,
    highestQuizTitle: 'Chưa có dữ liệu',
    averageAccuracy: 0
  });
  
  // State phục vụ hiệu ứng Animation của biểu đồ
  const [animatedAcc, setAnimatedAcc] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('web-quiz-bcn-auth-user'));
        if (!storedUser) return;
        setUser(storedUser);

        // Lấy tất cả bài thi đã nộp của sinh viên này
        const { data: rawAttempts, error } = await supabase
          .from('attempts')
          .select(`
            score,
            total_correct,
            total_questions,
            submitted_at,
            quiz_id,
            is_delete,
            quizzes ( title, questions(weight) )
          `)
          .eq('user_id', storedUser.mssv)
          .eq('status', 'submitted');

        if (error) throw error;

        // ==========================================
        // CHỈ TÍNH NHỮNG ATTEMPT HỢP LỆ (is_delete KHÁC true)
        // Dùng filter để an toàn với cả những record cũ có is_delete là null
        // ==========================================
        const attempts = (rawAttempts || []).filter(a => a.is_delete !== true);

        if (attempts && attempts.length > 0) {
          const totalAttemptsCount = attempts.length; // Tổng số lượt thi hợp lệ
          
          // Tính số lượt thi thực tế diễn ra trong vòng 7 ngày qua
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          const recentCount = attempts.filter(a => new Date(a.submitted_at) >= oneWeekAgo).length;

          // Tìm bài có điểm cao nhất
          let maxScore = -1;
          let maxAttempt = null;
          let sumCorrect = 0;
          let sumQuestions = 0;

          attempts.forEach(a => {
            sumCorrect += (a.total_correct || 0);
            sumQuestions += (a.total_questions || 0);

            if (a.score > maxScore) {
              maxScore = a.score;
              maxAttempt = a;
            }
          });

          const maxPossible = maxAttempt?.quizzes?.questions?.reduce((sum, q) => sum + (q.weight || 10), 0) || (maxAttempt?.total_questions * 10);
          const accuracy = sumQuestions > 0 ? Math.round((sumCorrect / sumQuestions) * 100) : 0;

          setStats({
            totalQuizzes: totalAttemptsCount, 
            recentCount,
            highestScore: maxScore,
            maxPossibleOfHighest: maxPossible,
            highestQuizTitle: maxAttempt?.quizzes?.title || 'Không xác định',
            averageAccuracy: accuracy
          });
        } else {
          // Xử lý trường hợp có attempts bị xóa sạch, không còn lượt nào hợp lệ
          setStats({
            totalQuizzes: 0,
            recentCount: 0,
            highestScore: 0,
            maxPossibleOfHighest: 0,
            highestQuizTitle: 'Chưa có dữ liệu',
            averageAccuracy: 0
          });
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu Dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Kích hoạt Animation cho biểu đồ sau khi data đã load xong
  useEffect(() => {
    if (!loading && stats.averageAccuracy > 0) {
      // Delay nhỏ để CSS Transition kịp nhận dạng thay đổi
      const timeout = setTimeout(() => {
        setAnimatedAcc(stats.averageAccuracy);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [loading, stats.averageAccuracy]);

  // Thông số vẽ SVG Circle (Biểu đồ vòng tròn)
  const circleRadius = 45;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference - (animatedAcc / 100) * circleCircumference;

  if (loading) return <div className={styles.loading}>Đang tải dữ liệu...</div>;
  if (!user) return <div className={styles.loading}>Vui lòng đăng nhập.</div>;

  return (
    <div className={styles.container}>
      
      {/* 1. THẺ THÔNG TIN CÁ NHÂN */}
      <div className={styles.profileCard}>
        <div className={styles.avatarWrapper}>
          <CircleUserRound size={64} className={styles.avatarIcon} strokeWidth={1.5} />
        </div>
        
        <div className={styles.profileInfo}>
          <div className={styles.nameSection}>
            <h1 className={styles.userName}>{user.full_name}</h1>
            <span className={styles.roleBadge}>
              {user.role === 'admin' ? 'Admin' : 'Student'}
            </span>
          </div>

          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <div className={styles.detailIcon}><Contact2 size={16}/></div>
              <div>
                <p className={styles.detailLabel}>MSSV</p>
                <p className={styles.detailValue}>{user.mssv}</p>
              </div>
            </div>
            
            <div className={styles.detailItem}>
              <div className={styles.detailIcon}><Mail size={16}/></div>
              <div>
                <p className={styles.detailLabel}>EMAIL</p>
                <p className={styles.detailValue}>{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BIỂU TƯỢNG TRANG TRÍ MỜ */}
      <div className={styles.decorativeIcon}>
        <TrendingUp size={24} />  <p>Tiến độ & Thống kê học tập</p>
      </div>

      {/* 2. LƯỚI THỐNG KÊ (3 CỘT) */}
      <div className={styles.statsGrid}>
        
        {/* Box 1: Tổng số Quiz */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <p className={styles.statTitle}>Tổng số lượt thi</p>
            <div className={styles.iconBox}><BookOpen size={18} /></div>
          </div>
          <div className={styles.statBody}>
            <h2 className={styles.statMainNumber}>{stats.totalQuizzes}</h2>
            <p className={styles.statSubText}>
              <TrendingUp size={14} className={styles.trendIcon} />
              <span className={styles.trendHighlight}>+{stats.recentCount}</span> tuần này
            </p>
          </div>
        </div>

        {/* Box 2: Điểm cao nhất */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <p className={styles.statTitle}>Điểm cao nhất</p>
            <div className={styles.iconBoxOrange}><Trophy size={18} /></div>
          </div>
          <div className={styles.statBody}>
            <div className={styles.scoreWrapper}>
              <h2 className={styles.statMainNumber}>{stats.highestScore}</h2>
              <span className={styles.scoreDivider}>/{stats.maxPossibleOfHighest}</span>
            </div>
            <p className={styles.statSubTextLight}>{stats.highestQuizTitle}</p>
          </div>
        </div>

        {/* Box 3: Biểu đồ Tỷ lệ */}
        <div className={styles.statCardChart}>
          <div className={styles.chartInfo}>
            <p className={styles.statTitle}>Tỷ lệ đúng trung bình</p>
            <p className={styles.statSubTextLight}>Hiệu suất ổn định</p>
          </div>
          
          {/* Biểu đồ SVG */}
          <div className={styles.chartWrapper}>
            <svg width="110" height="110" viewBox="0 0 110 110" className={styles.svgCircle}>
              {/* Vòng tròn nền */}
              <circle 
                cx="55" cy="55" r={circleRadius} 
                className={styles.circleBg} 
              />
              {/* Vòng tròn chạy (Màu xanh) */}
              <circle 
                cx="55" cy="55" r={circleRadius} 
                className={styles.circleProgress}
                style={{
                  strokeDasharray: circleCircumference,
                  strokeDashoffset: strokeDashoffset,
                }}
              />
            </svg>
            <div className={styles.chartPercentage}>
              {Math.round(animatedAcc)}%
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}