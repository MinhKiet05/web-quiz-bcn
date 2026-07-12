import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './QuizList.module.css';
import CardQuiz from '../../components/cardQuiz/CardQuiz'; 
import { supabase } from '../../lib/supabaseClient'; 

const ITEMS_PER_PAGE = 6;

export default function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  // States cho Filters & Pagination
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState('all');

  // Lấy dữ liệu từ Supabase
  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      // Bắt đầu build query: Lấy quiz kèm tên category
      let query = supabase
        .from('quizzes')
        .select(`
          *,
          categories (name)
        `, { count: 'exact' })
        .eq('status', 'active'); // Chỉ hiển thị quiz đang active

      // Áp dụng bộ lọc tìm kiếm
      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }
      
      // Áp dụng bộ lọc độ khó (nếu không phải 'all')
      if (difficulty !== 'all') {
        query = query.eq('difficulty', difficulty);
      }

      // Áp dụng bộ lọc category (nếu không phải 'all')
      // Vì Supabase filter qua bảng join hơi phức tạp nên ở đây ta filter bằng category_id nếu có
      if (category === 'cpp') query = query.eq('category_id', 1);
      if (category === 'mobile') query = query.eq('category_id', 2);
      if (category === 'web') query = query.eq('category_id', 3);

      // Phân trang & Sắp xếp ưu tiên
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      query = query
        .range(from, to)
        .order('quiz_type', { ascending: false }) // Ưu tiên 1: Đẩy 'weekly' lên đầu, 'normal' xuống dưới
        .order('created_at', { ascending: false }); // Ưu tiên 2: Cùng loại thì bài nào mới tạo xếp trước

      const { data, count, error } = await query;

      if (error) throw error;

      // Map dự phòng để đảm bảo 100% ra tên môn học dù Supabase chặn JOIN
      const categoryMap = {
        1: 'C/C++',
        2: 'Mobile (Java)',
        3: 'Web (HTML/CSS/JavaScript)'
      };

      // Chuẩn hóa dữ liệu để truyền vào CardQuiz
      const formattedQuizzes = data.map((q) => {
        // Lấy tên category từ data JOIN, nếu null thì dùng map dự phòng
        const catName = q.categories?.name || categoryMap[q.category_id] || 'Không xác định';
        
        return {
          id: q.id,
          title: q.title,
          category_name: catName,
          difficulty: q.difficulty, // easy, medium, hard
          duration: q.duration,
          quiz_type: q.quiz_type,   // normal, weekly
        };
      });

      setQuizzes(formattedQuizzes);
      if (count !== null) setTotalCount(count);

    } catch (error) {
      console.error('Lỗi khi tải danh sách Quiz:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch khi thay đổi filter hoặc page
  useEffect(() => {
    fetchQuizzes();
  }, [page, searchTerm, category, difficulty]);

  // Reset về trang 1 khi đổi bộ lọc
  const handleFilterChange = () => {
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

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
            onChange={(e) => {
              setSearchTerm(e.target.value);
              handleFilterChange();
            }}
          />
        </div>

        <div className={styles.dropdownsContainer}>
          <div className={styles.selectWrapper}>
            <select 
              className={styles.selectBox}
              value={category}
              onChange={(e) => { setCategory(e.target.value); handleFilterChange(); }}
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
              onChange={(e) => { setDifficulty(e.target.value); handleFilterChange(); }}
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
      ) : quizzes.length > 0 ? (
        <div className={styles.quizGrid}>
          {quizzes.map((quiz) => (
            <CardQuiz key={quiz.id} quiz={quiz} />
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
    </div>
  );
}