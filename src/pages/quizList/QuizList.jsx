import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './QuizList.module.css';
import CardQuiz from '../../components/cardQuiz/CardQuiz'; 
import { supabase } from '../../lib/supabaseClient'; 
import { useNavigate } from 'react-router-dom';
import ConfirmationLoginModal from '../../components/confirmationModal/ConfirmationLoginModal';

const ITEMS_PER_PAGE = 6;

export default function QuizList() {
  const navigate = useNavigate();
  // State chứa TOÀN BỘ dữ liệu đã được sắp xếp để hỗ trợ phân trang nội bộ
  const [allQuizzes, setAllQuizzes] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  // States cho Filters & Pagination
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Lấy dữ liệu từ Supabase
  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      // 1. Lấy thông tin user đăng nhập từ localStorage
      const storedUser = JSON.parse(localStorage.getItem('web-quiz-bcn-auth-user'));

      // 2. Lấy TOÀN BỘ quiz active khớp với bộ lọc (Bỏ .range để tự phân trang)
      let query = supabase
        .from('quizzes')
        .select(`*, categories (name)`)
        .eq('status', 'active');

      if (searchTerm) query = query.ilike('title', `%${searchTerm}%`);
      if (difficulty !== 'all') query = query.eq('difficulty', difficulty);
      if (category === 'cpp') query = query.eq('category_id', 1);
      if (category === 'mobile') query = query.eq('category_id', 2);
      if (category === 'web') query = query.eq('category_id', 3);

      const { data: quizData, error } = await query;
      if (error) throw error;

      // 3. Lấy danh sách ID các bài Quiz mà User đã NỘP (nếu có đăng nhập)
      let completedQuizIds = [];
      if (storedUser && storedUser.mssv) {
        const { data: attemptsData, error: attemptError } = await supabase
          .from('attempts')
          .select('quiz_id')
          .eq('user_id', storedUser.mssv)
          .eq('status', 'submitted');
        
        if (!attemptError && attemptsData) {
          completedQuizIds = attemptsData.map(a => a.quiz_id);
        }
      }

      const categoryMap = { 1: 'C/C++', 2: 'Mobile (Java)', 3: 'Web' };

      // 4. Chuẩn hóa dữ liệu & Gắn cờ is_completed
      let formattedQuizzes = quizData.map((q) => {
        const catName = q.categories?.name || categoryMap[q.category_id] || 'Không xác định';
        return {
          id: q.id,
          title: q.title,
          category_name: catName,
          difficulty: q.difficulty,
          duration: q.duration,
          quiz_type: q.quiz_type,
          created_at: q.created_at,
          is_completed: completedQuizIds.includes(q.id) // <--- Cờ xác định Đã làm
        };
      });

      // 5. THUẬT TOÁN SẮP XẾP YÊU CẦU
      formattedQuizzes.sort((a, b) => {
        // Ưu tiên 1: Quiz tuần luôn nằm trên cùng (bất kể làm hay chưa)
        if (a.quiz_type === 'weekly' && b.quiz_type !== 'weekly') return -1;
        if (a.quiz_type !== 'weekly' && b.quiz_type === 'weekly') return 1;

        // Ưu tiên 2: Cùng là Quiz thường -> Quiz nào Đã làm thì bị đẩy xuống dưới cùng
        if (a.quiz_type !== 'weekly' && b.quiz_type !== 'weekly') {
          if (a.is_completed && !b.is_completed) return 1;
          if (!a.is_completed && b.is_completed) return -1;
        }

        // Ưu tiên 3: Cùng hạng thì sắp xếp theo thời gian mới nhất tạo trước
        return new Date(b.created_at) - new Date(a.created_at);
      });

      setAllQuizzes(formattedQuizzes);
      setTotalCount(formattedQuizzes.length);

    } catch (error) {
      console.error('Lỗi khi tải danh sách Quiz:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Chỉ gọi fetchQuizzes khi các bộ lọc thay đổi, không gọi khi chuyển trang (để tối ưu server)
  useEffect(() => {
    fetchQuizzes();
    setPage(1); // Luôn về trang 1 khi đổi bộ lọc
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, category, difficulty]);

  // CẮT DỮ LIỆU CHO TRANG HIỆN TẠI (Local Pagination)
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const currentQuizzes = allQuizzes.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className={styles.container}>
      {/* 2. Filter Bar */}
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
              <option value="mobile">Java</option>
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

      {/* 3. Quiz Grid */}
      {loading ? (
        <div className={styles.loadingState}>Đang tải danh sách Quiz...</div>
      ) : currentQuizzes.length > 0 ? (
        <div className={styles.quizGrid}>
          {currentQuizzes.map((quiz) => (
            <CardQuiz key={quiz.id} quiz={quiz} onRequireLogin={() => setIsLoginModalOpen(true)}/>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>Không tìm thấy bài Quiz nào phù hợp.</div>
      )}

      {/* 4. Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button 
            className={styles.pageBtn} 
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft size={20} />
          </button>
          
          <span className={styles.pageInfo}>
            Trang {page} / {totalPages}
          </span>

          <button 
            className={styles.pageBtn} 
            disabled={page === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
      
      <ConfirmationLoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onConfirm={() => {
          setIsLoginModalOpen(false); 
          navigate('/login');         
        }}
      />
    </div>
  );
}