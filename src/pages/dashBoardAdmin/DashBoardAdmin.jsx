import React, { useState, useEffect } from 'react';
import { 
  Users, HelpCircle, TrendingUp, MoreHorizontal, Flame, AlertTriangle 
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import styles from './DashBoardAdmin.module.css';

export default function DashBoardAdmin() {
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalQuizzes: 0,
    totalAttempts: 0
  });

  const [categoryStats, setCategoryStats] = useState([]);
  const [highlights, setHighlights] = useState({
    mostTaken: null,
    lowestAvg: null
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // 1 & 2 & 3. Fetch đếm số lượng tổng (Giữ nguyên như cũ)
        const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const { count: quizzesCount } = await supabase.from('quizzes').select('*', { count: 'exact', head: true });
        const { count: attemptsCount } = await supabase.from('attempts').select('*', { count: 'exact', head: true });

        setStats({
          totalUsers: usersCount || 0,
          totalQuizzes: quizzesCount || 0,
          totalAttempts: attemptsCount || 0
        });

        // ==========================================
        // 4. LẤY & TÍNH TOÁN THỐNG KÊ CATEGORY THỰC TẾ
        // ==========================================
        const { data: quizzesData, error: catError } = await supabase
          .from('quizzes')
          .select(`
            id,
            categories (name)
          `);

        if (!catError && quizzesData && quizzesData.length > 0) {
          const totalQuizzesForCalc = quizzesData.length;
          
          // Dùng reduce để đếm số lượng quiz theo từng tên danh mục
          const categoryCounts = quizzesData.reduce((acc, quiz) => {
            const catName = quiz.categories?.name || 'Khác';
            acc[catName] = (acc[catName] || 0) + 1;
            return acc;
          }, {});

          // Bảng màu tự động gán cho các category
          const colors = ['#4255FF', '#6366F1', '#A78BFA', '#F4A28C', '#10B981'];

          // Chuyển object thành mảng, tính phần trăm và sắp xếp giảm dần
          const calculatedStats = Object.keys(categoryCounts).map((catName, index) => {
            const count = categoryCounts[catName];
            const percent = Math.round((count / totalQuizzesForCalc) * 100);
            return {
              name: catName,
              percent: percent,
              color: colors[index % colors.length] // Xoay vòng màu nếu có nhiều hơn 5 category
            };
          }).sort((a, b) => b.percent - a.percent); // Sắp xếp phần trăm từ cao xuống thấp

          setCategoryStats(calculatedStats);
        }

        // 5. Điểm nhấn hệ thống (Mock tạm, bạn có thể viết query RPC sau)
        setHighlights({
          mostTaken: { title: 'Vòng lặp C++ cơ bản' },
          lowestAvg: { title: 'Con trỏ nâng cao C++', avgScore: '18.5/50' }
        });

      } catch (error) {
        console.error('Lỗi khi tải dữ liệu Dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className={styles.loadingContainer}>Đang tải dữ liệu Dashboard...</div>;
  }

  return (
    <div className={styles.container}>
      
      {/* --- TOP ROW (Giữ nguyên) --- */}
      <div className={styles.topRow}>
        <div className={styles.statCard}>
          <div className={styles.iconWrapper}><Users size={24} className={styles.iconUsers} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Tổng số User</span>
            <div className={styles.statValueWrapper}>
              <span className={styles.statValue}>{stats.totalUsers.toLocaleString()}</span>
              <span className={styles.statUnit}>người</span>
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.iconWrapper}><HelpCircle size={24} className={styles.iconQuiz} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Tổng số Quiz</span>
            <div className={styles.statValueWrapper}>
              <span className={styles.statValue}>{stats.totalQuizzes.toLocaleString()}</span>
              <span className={styles.statUnit}>bài</span>
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.iconWrapper}><TrendingUp size={24} className={styles.iconTrending} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Tổng số lượt làm Quiz</span>
            <div className={styles.statValueWrapper}>
              <span className={styles.statValue}>{stats.totalAttempts.toLocaleString()}</span>
              <span className={styles.statUnit}>lượt</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- BOTTOM ROW --- */}
      <div className={styles.bottomRow}>
        
        {/* CỘT TRÁI: THỐNG KÊ CATEGORY */}
        <div className={`${styles.cardSection} ${styles.chartSection}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Thống kê số Quiz theo từng Category</h3>
            <button className={styles.btnMore}></button>
          </div>

          <div className={styles.chartList}>
            {categoryStats.map((item, index) => (
              <div key={index} className={styles.chartItem}>
                <div className={styles.chartItemHeader}>
                  <div className={styles.chartItemLabel}>
                    <span className={styles.dot} style={{ backgroundColor: item.color }}></span>
                    {item.name}
                  </div>
                  <span className={styles.chartItemPercent}>{item.percent}%</span>
                </div>
                <div className={styles.progressTrack}>
                  {/* Sử dụng biến CSS --target-width để truyền % xuống cho animation */}
                  <div 
                    className={styles.progressBar} 
                    style={{ 
                      '--target-width': `${item.percent}%`, 
                      backgroundColor: item.color 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CỘT PHẢI (Giữ nguyên) */}
        <div className={`${styles.cardSection} ${styles.highlightSection}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Điểm nhấn Hệ thống</h3>
          </div>

          <div className={styles.highlightList}>
            <div className={styles.highlightCard}>
              <div className={`${styles.highlightIconWrapper} ${styles.iconBgFlame}`}>
                <Flame size={20} className={styles.iconFlame} />
              </div>
              <div className={styles.highlightInfo}>
                <span className={styles.highlightLabel}>Quiz được làm nhiều nhất</span>
                <span className={styles.highlightValue}>{highlights.mostTaken?.title}</span>
              </div>
            </div>

            <div className={styles.highlightCard}>
              <div className={`${styles.highlightIconWrapper} ${styles.iconBgAlert}`}>
                <AlertTriangle size={20} className={styles.iconAlert} />
              </div>
              <div className={styles.highlightInfo}>
                <span className={styles.highlightLabel}>Quiz có điểm TB thấp nhất</span>
                <span className={styles.highlightValue}>{highlights.lowestAvg?.title}</span>
                {highlights.lowestAvg?.avgScore && (
                  <div className={styles.badgeAvg}>
                    Avg: <strong>{highlights.lowestAvg.avgScore}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}