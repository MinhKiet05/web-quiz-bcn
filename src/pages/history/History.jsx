import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, Calendar, Clock, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import styles from './History.module.css';

const ITEMS_PER_PAGE = 4;

export default function History() {
  const navigate = useNavigate();
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);

  // States bộ lọc & phân trang
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const storedUser = JSON.parse(localStorage.getItem('web-quiz-bcn-auth-user'));
        if (!storedUser) return;

        // Lấy lịch sử nộp bài kết hợp với Quiz, Category và lấy thêm 'weight' từ Questions
        const { data, error } = await supabase
          .from('attempts')
          .select(`
            id,
            quiz_id,
            score,
            total_questions,
            completion_time,
            submitted_at,
            quizzes (
              title,
              quiz_type,
              difficulty,
              weekly_end,
              categories (id, name),
              questions (weight)
            )
          `)
          .eq('user_id', storedUser.mssv)
          .eq('status', 'submitted')
          .order('submitted_at', { ascending: false });

        if (error) throw error;

        // Lọc lấy "Lượt làm bài gần đây nhất của từng Quiz"
        const uniqueAttempts = [];
        const seenQuizIds = new Set();

        data.forEach(attempt => {
          if (!seenQuizIds.has(attempt.quiz_id) && attempt.quizzes) {
            seenQuizIds.add(attempt.quiz_id);
            uniqueAttempts.push(attempt);
          }
        });

        setHistoryList(uniqueAttempts);
      } catch (error) {
        console.error('Lỗi khi tải lịch sử:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Xử lý Lọc dữ liệu (Filter) trên Client
  const filteredList = historyList.filter(attempt => {
    const quiz = attempt.quizzes;
    
    if (searchTerm && !quiz.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (difficulty !== 'all' && quiz.difficulty !== difficulty) return false;
    
    const catId = quiz.categories?.id;
    if (category === 'cpp' && catId !== 1) return false;
    if (category === 'mobile' && catId !== 2) return false;
    if (category === 'web' && catId !== 3) return false;

    return true;
  });

  // Tính toán phân trang
  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const paginatedList = filteredList.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset trang về 1 khi bộ lọc thay đổi
  useEffect(() => {
    setPage(1);
  }, [searchTerm, category, difficulty]);

  // HÀM TIỆN ÍCH
  const formatDateTime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${hh}:${min} - ${dd}/${mm}/${yyyy}`;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '00m 00s';
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}m ${s}s`;
  };

  const isWeeklyLocked = (quiz) => {
    if (quiz.quiz_type !== 'weekly' || !quiz.weekly_end) return false;
    return new Date() < new Date(quiz.weekly_end);
  };

  const getDifficultyText = (diff) => {
    switch(diff) {
      case 'easy': return 'Dễ';
      case 'medium': return 'Trung bình';
      case 'hard': return 'Khó';
      default: return 'Không xác định';
    }
  };

  const getDifficultyClass = (diff) => {
    switch(diff) {
      case 'easy': return styles.diffEasy;
      case 'medium': return styles.diffMedium;
      case 'hard': return styles.diffHard;
      default: return styles.tagNormal;
    }
  };

  return (
    <div className={styles.container}>
      
      {/* 1. Thanh công cụ tìm kiếm và lọc */}
      <div className={styles.filterBar}>
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} size={20} />
          <input
            type="text"
            placeholder="Tên bài Quiz..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.dropdownsContainer}>
          <div className={styles.selectWrapper}>
            <select 
              className={styles.selectBox}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">Danh mục: Tất cả</option>
              <option value="cpp">C/C++</option>
              <option value="mobile">Java / Mobile</option>
              <option value="web">Web</option>
            </select>
            <ChevronDown className={styles.selectIcon} size={16} />
          </div>

          <div className={styles.selectWrapper}>
            <select 
              className={styles.selectBox}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="all">Độ khó: Tất cả</option>
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
            <ChevronDown className={styles.selectIcon} size={16} />
          </div>
        </div>
      </div>

      <p className={styles.subText}>Hệ thống hiển thị lượt làm bài gần đây nhất của từng Quiz.</p>

      {/* 2. Danh sách lịch sử làm bài */}
      {loading ? (
        <div className={styles.loadingState}>Đang tải lịch sử...</div>
      ) : paginatedList.length > 0 ? (
        <div className={styles.historyList}>
          {paginatedList.map(attempt => {
            const quiz = attempt.quizzes;
            
            // LOGIC TÍNH TỔNG ĐIỂM (WEIGHT) TỪ DATABASE
            const maxScore = quiz.questions?.reduce((sum, q) => {
              return sum + (q.weight || 10); 
            }, 0) || 0;

            const isLocked = isWeeklyLocked(quiz);
            const isLowScore = attempt.score < (maxScore / 2);

            return (
              <div key={attempt.id} className={styles.historyCard}>
                
                {/* Cột trái: Thông tin cơ bản */}
                <div className={styles.cardInfo}>
                  <h3 className={styles.quizTitle}>{quiz.title}</h3>
                  <div className={styles.dateTime}>
                    <Calendar size={14} />
                    <span>{formatDateTime(attempt.submitted_at)}</span>
                  </div>
                  <div className={styles.tagGroup}>

                    {quiz.quiz_type === 'weekly' ? (
                      <span className={styles.tagWeekly}>Quiz Tuần</span>
                    ) : (
                      <></>
                    )}

                    <span className={styles.tagCategory}>{quiz.categories?.name || 'Chung'}</span>
                    
                    {quiz.quiz_type === 'weekly' ? (
                      <></>
                    ) : (
                      <span className={getDifficultyClass(quiz.difficulty)}>
                        {getDifficultyText(quiz.difficulty)}
                      </span>
                    )}

                  </div>
                </div>

                {/* Cột giữa: Điểm và Thời gian */}
                <div className={styles.cardStats}>
                  <div className={styles.scoreContainer}>
                    <span className={`${styles.scoreNumber} ${isLowScore ? styles.scoreLow : ''}`}>
                      {attempt.score}
                    </span>
                    <span className={styles.scoreMax}>/ {maxScore}</span>
                  </div>
                  <div className={styles.timeContainer}>
                    <Clock size={14} />
                    <span>{formatDuration(attempt.completion_time)}</span>
                  </div>
                </div>

                {/* Cột phải: Các nút hành động */}
                <div className={styles.cardActions}>
                  <button 
                    className={`${styles.btnReview} ${isLocked ? styles.btnLocked : ''}`}
                    onClick={() => !isLocked && navigate(`/history/review/${attempt.id}`)}
                    disabled={isLocked}
                  >
                    {isLocked && <Lock size={14} />} Xem lại bài
                  </button>
                  
                  <button 
                    className={styles.btnRetry}
                    onClick={() => !isLocked && navigate(`/quiz/${attempt.quiz_id}`)}
                    disabled={isLocked}
                  >
                    {isLocked && <Lock size={14} />} Làm lại
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyState}>Bạn chưa hoàn thành bài Quiz nào.</div>
      )}

      {/* 3. Phân trang */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button 
            className={styles.pageBtn} 
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft size={18} />
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
            <button
              key={pageNum}
              className={`${styles.pageNumber} ${page === pageNum ? styles.pageActive : ''}`}
              onClick={() => setPage(pageNum)}
            >
              {pageNum}
            </button>
          ))}

          <button 
            className={styles.pageBtn} 
            disabled={page === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

    </div>
  );
}