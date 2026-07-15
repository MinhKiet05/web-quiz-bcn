import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Clock, ChevronDown } from 'lucide-react';
import styles from './LeaderBoard.module.css';

export default function LeaderBoard() {
  const [weeklyQuizzes, setWeeklyQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserMssv, setCurrentUserMssv] = useState('');

  // Lấy MSSV của người đang đăng nhập
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('web-quiz-bcn-auth-user'));
    if (storedUser) {
      setCurrentUserMssv(storedUser.mssv);
    }
  }, []);

  // 1. Lấy danh sách các bài Weekly Quiz để hiển thị vào Dropdown
  useEffect(() => {
    const fetchWeeklyQuizzes = async () => {
      try {
        const { data, error } = await supabase
          .from('quizzes')
          .select('id, title, created_at')
          .eq('quiz_type', 'weekly')
          .order('created_at', { ascending: false }); // Mới nhất lên đầu

        if (error) throw error;

        if (data && data.length > 0) {
          setWeeklyQuizzes(data);
          setSelectedQuizId(data[0].id); // Mặc định chọn tuần mới nhất
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách Quiz tuần:', err.message);
      }
    };

    fetchWeeklyQuizzes();
  }, []);

  // 2. Lấy dữ liệu bảng xếp hạng khi Dropdown thay đổi
  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!selectedQuizId) return;
      setLoading(true);
      try {
        // Truy vấn lấy dữ liệu từ bảng attempts (Bỏ limit để lấy đủ dữ liệu lọc)
        const { data, error } = await supabase
          .from('attempts')
          .select(`
            user_id,
            score,
            completion_time,
            is_delete,
            users ( full_name )
          `)
          .eq('quiz_id', selectedQuizId)
          .eq('status', 'submitted')
          .order('score', { ascending: false }) // Ưu tiên 1: Điểm cao nhất
          .order('completion_time', { ascending: true }); // Ưu tiên 2: Thời gian ngắn nhất

        if (error) throw error;

        // 1. LỌC DỮ LIỆU: Bỏ qua những lượt thi đã bị xóa mềm
        const validAttempts = (data || []).filter(attempt => attempt.is_delete !== true);

        // 2. Xử lý dữ liệu trùng lặp (chỉ lấy lượt làm bài hợp lệ tốt nhất của mỗi người)
        const uniqueRankings = [];
        const seenUsers = new Set();
        
        validAttempts.forEach(attempt => {
          if (!seenUsers.has(attempt.user_id)) {
            seenUsers.add(attempt.user_id);
            uniqueRankings.push({
              mssv: attempt.user_id,
              fullName: attempt.users?.full_name || 'Người dùng ẩn danh',
              score: attempt.score,
              time: attempt.completion_time
            });
          }
        });

        // 3. Cắt lấy đúng Top 50 người cao nhất sau khi đã lọc sạch sẽ
        setLeaderboardData(uniqueRankings.slice(0, 50));
        
      } catch (err) {
        console.error('Lỗi khi tải Bảng xếp hạng:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [selectedQuizId]);

  // Tiện ích Format
  const maskMSSV = (mssv) => {
    if (!mssv || mssv.length < 8) return mssv;
    return mssv.substring(0, 3) + '***' + mssv.substring(6, 8);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '00m 00s';
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}m ${s}s`;
  };

  // Chia dữ liệu thành Top 3 và Phần còn lại
  const top3 = leaderboardData.slice(0, 3);
  const restOfBoard = leaderboardData.slice(3);

  // Gán mặc định null nếu chưa đủ 3 người
  const rank1 = top3[0] || null;
  const rank2 = top3[1] || null;
  const rank3 = top3[2] || null;

  return (
    <div className={styles.container}>
      
      {/* HEADER: Tiêu đề và Dropdown */}
      <div className={styles.header}>
        <p className={styles.description}>
          Xếp hạng dựa trên bài kiểm tra hàng tuần. Tiêu chí: Tổng điểm cao nhất, ưu tiên thời gian hoàn thành ngắn hơn trong trường hợp bằng điểm.
        </p>

        <div className={styles.selectWrapper}>
          <select 
            className={styles.selectBox}
            value={selectedQuizId}
            onChange={(e) => setSelectedQuizId(e.target.value)}
          >
            {weeklyQuizzes.map(q => (
              <option key={q.id} value={q.id}>{q.title}</option>
            ))}
            {weeklyQuizzes.length === 0 && <option value="">Chưa có bài thi tuần nào</option>}
          </select>
          <ChevronDown className={styles.selectIcon} size={16} />
        </div>
      </div>

      <div className={styles.divider}></div>

      {loading ? (
        <div className={styles.loadingState}>Đang tải bảng xếp hạng...</div>
      ) : leaderboardData.length === 0 ? (
        <div className={styles.emptyState}>Tuần này chưa có sinh viên nào nộp bài.</div>
      ) : (
        <>
          {/* PODIUM (Bục vinh quang Top 3) */}
          <div className={styles.podiumContainer}>
            
            {/* Rank 2 */}
            <div className={`${styles.podiumItem} ${styles.rank2}`}>
              <div className={styles.rankBadgeSilver}>#2</div>
              <div className={styles.podiumCardSilver}>
                <h3 className={styles.podiumName}>{rank2?.fullName || '---'}</h3>
                <p className={styles.podiumMssv}>{rank2 ? maskMSSV(rank2.mssv) : '---'}</p>
                <p className={styles.podiumScore}>{rank2 ? `${rank2.score} Điểm` : '-'}</p>
                <div className={styles.podiumTime}>
                  <Clock size={12} /> {rank2 ? formatDuration(rank2.time) : '-'}
                </div>
              </div>
            </div>

            {/* Rank 1 */}
            <div className={`${styles.podiumItem} ${styles.rank1}`}>
              <div className={styles.rankBadgeGold}>#1</div>
              <div className={styles.podiumCardGold}>
                <h3 className={styles.podiumName}>{rank1?.fullName || '---'}</h3>
                <p className={styles.podiumMssvGold}>{rank1 ? maskMSSV(rank1.mssv) : '---'}</p>
                <p className={styles.podiumScoreGold}>{rank1 ? `${rank1.score} Điểm` : '-'}</p>
                <div className={styles.podiumTime}>
                  <Clock size={12} /> {rank1 ? formatDuration(rank1.time) : '-'}
                </div>
              </div>
            </div>

            {/* Rank 3 */}
            <div className={`${styles.podiumItem} ${styles.rank3}`}>
              <div className={styles.rankBadgeBronze}>#3</div>
              <div className={styles.podiumCardBronze}>
                <h3 className={styles.podiumName}>{rank3?.fullName || '---'}</h3>
                <p className={styles.podiumMssv}>{rank3 ? maskMSSV(rank3.mssv) : '---'}</p>
                <p className={styles.podiumScoreBronze}>{rank3 ? `${rank3.score} Điểm` : '-'}</p>
                <div className={styles.podiumTime}>
                  <Clock size={12} /> {rank3 ? formatDuration(rank3.time) : '-'}
                </div>
              </div>
            </div>
            
          </div>

          {/* DANH SÁCH TỪ HẠNG 4 TRỞ ĐI */}
          {restOfBoard.length > 0 && (
            <div className={styles.tableContainer}>
              <table className={styles.leaderboardTable}>
                <thead>
                  <tr>
                    <th>Hạng</th>
                    <th>MSSV</th>
                    <th>Họ tên</th>
                    <th className={styles.textCenter}>Tổng điểm</th>
                    <th className={styles.textRight}>Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {restOfBoard.map((user, index) => {
                    const currentRank = index + 4;
                    const isCurrentUser = user.mssv === currentUserMssv;

                    return (
                      <tr key={user.mssv} className={isCurrentUser ? styles.currentUserRow : ''}>
                        <td className={styles.rankCell}>{currentRank}</td>
                        <td className={styles.mssvCell}>{maskMSSV(user.mssv)}</td>
                        <td className={styles.nameCell}>
                          {user.fullName}
                          {isCurrentUser && <span className={styles.youBadge}>YOU</span>}
                        </td>
                        <td className={styles.scoreCell}>{user.score}</td>
                        <td className={styles.timeCell}>{formatDuration(user.time)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}