import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, ChevronDown, Plus, Edit2, Trash2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import QuizManagerModal from '../../components/quizManagerModal/QuizManagerModal';
import ConfirmationDelete from '../../components/confirmationModal/ConfirmationDelete';
import styles from './QuizManager.module.css';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 10;

export default function QuizManager() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  // States cho Filters & Pagination
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState('all');

  // States cho Modal Thêm/Sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  // States cho Modal Xóa (Confirmation)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // KIỂM TRA QUYỀN TRUY CẬP (Chỉ Admin/Editor mới được vào)
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('web-quiz-bcn-auth-user'));
    if (!storedUser || (storedUser.role !== 'admin' && storedUser.role !== 'editor')) {
      toast.error('Truy cập bị từ chối: Bạn không có quyền quản trị!');
      navigate('/quiz-list', { replace: true });
    }
  }, [navigate]);

  // Lấy dữ liệu từ Supabase
  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('quizzes')
        .select(`
          *,
          categories (name)
        `, { count: 'exact' });

      // Lọc theo tìm kiếm
      if (searchTerm) query = query.ilike('title', `%${searchTerm}%`);
      
      // Lọc theo danh mục & độ khó
      if (category === 'cpp') query = query.eq('category_id', 1);
      if (category === 'mobile') query = query.eq('category_id', 2);
      if (category === 'web') query = query.eq('category_id', 3);
      if (difficulty !== 'all') query = query.eq('difficulty', difficulty);

      // Phân trang
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      query = query
        .range(from, to)
        .order('created_at', { ascending: false });

      const { data, count, error } = await query;

      if (error) throw error;

      setQuizzes(data || []);
      if (count !== null) setTotalCount(count);

    } catch (error) {
      console.error('Lỗi khi tải danh sách Quiz:', error.message);
      toast.error('Không thể tải danh sách bài thi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm, category, difficulty]);

  const handleFilterChange = () => setPage(1);

  // --- Handlers cho Modal Thêm/Sửa ---
  const handleAddClick = () => {
    setSelectedQuiz(null); // Truyền null để modal hiểu là Thêm mới
    setIsModalOpen(true);
  };

  const handleEditClick = async (quiz) => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          questions (
            id, 
            question_text, 
            weight, 
            question_type, 
            code_snippet,
            answers (
              id, 
              answer_text, 
              is_correct
            )
          )
        `)
        .eq('id', quiz.id)
        .single();

      if (error) throw error;
      
      setSelectedQuiz(data);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Lỗi lấy chi tiết quiz:', err);
      toast.error('Không thể lấy chi tiết bài thi để sửa.');
    }
  };

  const handleModalSave = async (savedQuizData) => {
    console.log("Dữ liệu cần lưu:", savedQuizData);
    setIsModalOpen(false);
    toast.success('Đã ghi nhận lưu bài thi (Chờ tích hợp API)!');
    fetchQuizzes();
  };

  // --- Handlers cho Modal Xóa Mềm ---
  const handleDeleteClick = (id) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true); // Chỉ mở Modal chứ chưa xóa ngay
  };

  const executeDeleteAction = async () => {
    if (!itemToDelete) return;
    try {
      // Xóa mềm: Chuyển trạng thái sang 'inactive'
      const { error } = await supabase
        .from('quizzes')
        .update({ status: 'inactive' })
        .eq('id', itemToDelete);

      if (error) throw error;
      
      toast.success('Đã chuyển bài thi về trạng thái vô hiệu hóa (Xóa mềm)!');
      setIsDeleteModalOpen(false); 
      setItemToDelete(null);
      fetchQuizzes(); 
    } catch (err) {
      console.error('Lỗi xóa mềm quiz:', err);
      toast.error('Lỗi khi thao tác xóa bài thi.');
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // --- Tiện ích Render ---
  const renderDifficulty = (diff) => {
    switch(diff) {
      case 'easy': return <span className={styles.diffEasy}>Dễ</span>;
      case 'medium': return <span className={styles.diffMedium}>Trung bình</span>;
      case 'hard': return <span className={styles.diffHard}>Khó</span>;
      default: return <span className={styles.diffMedium}>{diff}</span>;
    }
  };

  return (
    <div className={styles.container}>
      
      {/* 1. FILTER BAR & ADD BUTTON */}
      <div className={styles.topActions}>
        <div className={styles.filterBar}>
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} size={20} />
            <input
              type="text"
              placeholder="Tên bài Quiz..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); handleFilterChange(); }}
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
                <option value="mobile">Mobile</option>
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

        <button className={styles.btnAdd} onClick={handleAddClick}>
          <Plus size={18} /> Thêm Quiz
        </button>
      </div>

      {/* 2. BẢNG QUẢN LÝ (TABLE) */}
      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.loadingState}>Đang tải dữ liệu...</div>
        ) : quizzes.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th width="5%"></th>
                <th width="25%">TÊN QUIZ</th>
                <th width="12%">DANH MỤC</th>
                <th width="12%">LOẠI QUIZ</th>
                <th width="12%">ĐỘ KHÓ</th>
                <th width="10%">THỜI GIAN</th>
                <th width="12%">TRẠNG THÁI</th>
                <th width="12%" className={styles.textCenter}>HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((quiz, index) => {
                const rowIndex = (page - 1) * ITEMS_PER_PAGE + index + 1;
                return (
                  <tr key={quiz.id}>
                    <td className={styles.indexCell}>{rowIndex}</td>
                    <td className={styles.titleCell}>{quiz.title}</td>
                    <td>
                      <span className={styles.badgeCategory}>
                        {quiz.categories?.name || 'Không xác định'}
                      </span>
                    </td>
                    <td>
                      {quiz.quiz_type === 'weekly' ? (
                        <span className={styles.badgeWeekly}>Weekly</span>
                      ) : (
                        <span className={styles.badgeNormal}>Normal</span>
                      )}
                    </td>
                    <td>{renderDifficulty(quiz.difficulty)}</td>
                    <td className={styles.timeCell}>{quiz.duration} phút</td>
                    <td>
                      {/* Bổ sung hiển thị cho trạng thái Inactive */}
                      <span className={
                        quiz.status === 'active' ? styles.statusActive : 
                        (quiz.status === 'draft' ? styles.statusDraft : styles.statusInactive)
                      }>
                        <span className={styles.dot}></span>
                        {quiz.status === 'active' ? 'Active' : (quiz.status === 'draft' ? 'Draft' : 'Inactive')}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button className={styles.btnAction} onClick={() => handleEditClick(quiz)} title="Sửa bài thi">
                          <Edit2 size={16} />
                        </button>
                        <button className={styles.btnActionDelete} onClick={() => handleDeleteClick(quiz.id)} title="Xóa bài thi">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className={styles.emptyState}>Không tìm thấy bài Quiz nào.</div>
        )}
      </div>

      {/* 3. PHÂN TRANG */}
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

      {/* MODAL THÊM / SỬA */}
      <QuizManagerModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={selectedQuiz}
        onSave={handleModalSave}
      />
      
      {/* MODAL CẢNH BÁO XÓA */}
      <ConfirmationDelete 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={executeDeleteAction}
        title="Vô hiệu hóa bài thi?" 
        message="Bạn có chắc chắn muốn vô hiệu hóa bài thi này? Bài thi sẽ chuyển sang trạng thái Inactive và sinh viên không thể truy cập."
      />
    </div>
  );
}