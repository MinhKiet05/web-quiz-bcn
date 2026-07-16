import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ChevronDown, Eye, Unlock, ChevronLeft, ChevronRight, Clock, Calendar
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import DetailAttemptModal from '../../components/detailAttemptModal/DetailAttemptModal';
import styles from './AttemptManager.module.css';
import { toast } from 'sonner';
import ConfirmationUnlock from '../../components/confirmationModal/ConfirmationUnlock';
const ITEMS_PER_PAGE = 10;

export default function AttemptManager() {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // States cho Filters & Pagination
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [quizFilter, setQuizFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // States cho Modal Xem chi tiết
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState(null);

  // States cho Modal Mở khóa
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [attemptToUnlock, setAttemptToUnlock] = useState(null);

  // Kiểm tra quyền
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('web-quiz-bcn-auth-user'));
    if (!storedUser || (storedUser.role !== 'admin' && storedUser.role !== 'editor')) {
      toast.error('Truy cập bị từ chối: Bạn không có quyền quản trị!');
      navigate('/quiz-list', { replace: true });
    }
  }, [navigate]);

  // Lấy dữ liệu từ Supabase
  // Lấy dữ liệu từ Supabase
  const fetchAttempts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('attempts')
        .select(`
          id,
          quiz_id, 
          score,
          status,
          started_at,
          submitted_at,
          is_delete, 
          users!inner ( mssv, full_name ),
          quizzes!inner ( 
            title,
            category_id,
            questions ( weight ) 
          )
        `, { count: 'exact' });
      // LƯU Ý: Lấy thêm questions(weight) ở trên để tính toán tổng điểm tối đa động

      if (searchTerm) {
        query = query.or(`mssv.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`, { foreignTable: 'users' });
      }

      // === THÊM LOGIC LỌC THEO DANH MỤC Ở ĐÂY ===
      if (quizFilter === 'cpp') {
        query = query.eq('quizzes.category_id', 1);
      } else if (quizFilter === 'mobile') {
        // Ánh xạ value="mobile" với category_id = 2 (Java)
        query = query.eq('quizzes.category_id', 2);
      } else if (quizFilter === 'web') {
        query = query.eq('quizzes.category_id', 3);
      }
      // =========================================

      if (statusFilter === 'submitted') {
        query = query
          .eq('status', 'submitted')
          .or('is_delete.is.null,is_delete.eq.false');
      }

      if (statusFilter === 'deleted') {
        query = query.eq('is_delete', true);
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      query = query
        .range(from, to)
        .order('started_at', { ascending: false });

      const { data, count, error } = await query;

      if (error) throw error;

      // XỬ LÝ LỌC DỮ LIỆU Ở FRONTEND:
      setAttempts(data || []);

      // Chỉnh sửa lại Total Count cho chuẩn xác với phân trang
      if (count !== null) {
        setTotalCount(count || 0);
      }

    } catch (error) {
      console.error('Lỗi khi tải danh sách lượt làm bài:', error.message);
      toast.error('Không thể tải danh sách lịch sử thi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm, quizFilter, statusFilter]);

  const handleFilterChange = () => setPage(1);

  // --- Handlers Hành động ---
  const handleViewDetail = async (attempt) => {
    const quizId = attempt.quiz_id;

    if (!quizId) {
      toast.error("Không thể xác định bài thi này.");
      return;
    }

    try {
      // 1. Lấy chi tiết câu trả lời của sinh viên 
      const { data: studentAnswers, error: ansError } = await supabase
        .from('attempt_answers')
        .select('*')
        .eq('attempt_id', attempt.id);

      if (ansError) throw ansError;

      // CẢNH BÁO KIỂM TRA RLS BỊ CHẶN
      console.log("Dữ liệu từ attempt_answers:", studentAnswers);
      if (studentAnswers && studentAnswers.length === 0) {
        toast.warning("Dữ liệu câu trả lời trống! Vui lòng kiểm tra lại RLS của bảng attempt_answers trên Supabase.");
      }

      // 2. Kéo toàn bộ câu hỏi & đáp án gốc của bài Quiz này
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select(`
          title,
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
        .eq('id', quizId)
        .single();

      if (quizError) throw quizError;

      // 3. Khớp dữ liệu
      const formattedQuestions = quizData.questions.map((q) => {
        const studentAns = studentAnswers.find(ans => ans.question_id === q.id);

        return {
          id: q.id,
          question_text: q.question_text,
          weight: q.weight,
          question_type: q.question_type,
          code_snippet: q.code_snippet,
          selected_answer_id: studentAns ? studentAns.selected_answer_id : null,
          student_text_answer: studentAns ? studentAns.fill_text_answer : '',
          answers: q.answers
        };
      });

      // Lấy tổng điểm đã tính từ trước
      const totalScore = attempt.quizzes?.questions?.reduce((sum, q) => sum + (q.weight || 0), 0) || 0;

      setSelectedAttempt({
        mssv: attempt.users?.mssv,
        studentName: attempt.users?.full_name,
        quizTitle: quizData.title,
        score: attempt.score || 0,
        totalScore: totalScore,
        timeTaken: formatTime(attempt.started_at, attempt.submitted_at),
        submittedAt: formatDateTime(attempt.submitted_at),
        questions: formattedQuestions
      });

      setIsDetailModalOpen(true);
    } catch (err) {
      console.error('Lỗi lấy chi tiết:', err);
      toast.error('Không thể lấy chi tiết bài làm của sinh viên.');
    }
  };

  const handleUnlockAttempt = async (id) => {
    try {
      const { error } = await supabase
        .from('attempts')
        .update({ is_delete: true })
        .eq('id', id);

      if (error) throw error;

      toast.success(
        'Đã hủy lượt thi thành công! Sinh viên hiện đã có thể làm lại bài.'
      );

      fetchAttempts();
    } catch (err) {
      console.error('Lỗi khi mở khóa lượt thi:', err.message);
      toast.error('Có lỗi xảy ra khi thao tác. Vui lòng thử lại!');
    }
  };

  // --- Tiện ích Format Dữ liệu ---
  const formatTime = (start, end) => {
    if (!start || !end) return '05m 10s';
    const diffMs = new Date(end) - new Date(start);
    if (diffMs <= 0) return '--';
    const m = Math.floor(diffMs / 60000);
    const s = Math.floor((diffMs % 60000) / 1000);
    return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--/--/----';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB');
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '--/--/---- --:--';
    const d = new Date(dateStr);
    return d.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className={styles.container}>
      <div className={styles.topActions}>
        <div className={styles.filterBar}>
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} size={20} />
            <input
              type="text"
              placeholder="Tìm theo MSSV, Họ tên sinh viên..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); handleFilterChange(); }}
            />
          </div>

          <div className={styles.dropdownsContainer}>
            <div className={styles.selectWrapper}>
              <select
                className={styles.selectBox}
                value={quizFilter}
                onChange={(e) => { setQuizFilter(e.target.value); handleFilterChange(); }}
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
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); handleFilterChange(); }}
              >
                <option value="all">Tất cả</option>
                <option value="submitted">Đã nộp</option>
                <option value="deleted">Đã xóa</option>
              </select>
              <ChevronDown className={styles.selectIcon} size={16} />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.loadingState}>Đang tải dữ liệu...</div>
        ) : attempts.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th width="10%">MSSV</th>
                <th width="18%">HỌ VÀ TÊN</th>
                <th width="20%">TÊN BÀI QUIZ</th>
                <th width="12%">ĐIỂM SỐ</th>
                <th width="13%">NGÀY NỘP BÀI</th>
                <th width="10%">TRẠNG THÁI</th>
                <th width="4%" className={styles.textCenter}>HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt) => {
                const isDeleted = attempt.is_delete === true;
                const score = attempt.score ?? '-';

                // TÍNH TOÁN ĐIỂM TỐI ĐA ĐỘNG TỪ MẢNG QUESTIONS
                const totalScore = attempt.quizzes?.questions?.reduce((sum, q) => sum + (q.weight || 0), 0) || 0;

                // Điều kiện Pass/Fail dựa trên > 50% tổng điểm
                const isPassed = score !== '-' && score >= (totalScore / 2);

                return (
                  <tr key={attempt.id}>
                    <td className={styles.mssvCell}>{attempt.users?.mssv}</td>
                    <td className={styles.nameCell}>{attempt.users?.full_name}</td>
                    <td className={styles.quizTitleCell}>{attempt.quizzes?.title}</td>
                    <td>
                      <span className={styles.scoreWrapper}>
                        <strong className={isPassed ? styles.scorePass : styles.scoreFail}>
                          {score}
                        </strong>
                        <span className={styles.scoreTotal}> / {totalScore > 0 ? totalScore : '...'}</span>
                      </span>
                    </td>


                    <td className={styles.dateCell}>
                      <Calendar size={14} className={styles.iconSmall} />
                      {formatDate(attempt.submitted_at)}
                    </td>

                    <td>
                      <span
                        className={
                          isDeleted
                            ? styles.statusDeleted
                            : styles.statusSubmitted
                        }
                      >
                        <span className={styles.dot}></span>
                        {isDeleted ? 'Đã xóa' : 'Đã nộp'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button className={styles.btnAction} onClick={() => handleViewDetail(attempt)} title="Xem chi tiết">
                          <Eye size={18} />
                        </button>

                        <button
  className={styles.btnAction}
  disabled={attempt.is_delete}
  onClick={() => {
    if (attempt.is_delete) return;

    setAttemptToUnlock(attempt);
    setIsUnlockModalOpen(true);
  }}
  title={attempt.is_delete ? "Lượt thi đã được hủy" : "Mở khóa/Cho thi lại"}
>
  <Unlock size={18} />
</button>
                        
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className={styles.emptyState}>Không tìm thấy lượt làm bài nào.</div>
        )}
      </div>

      <div className={styles.bottomSection}>
        <div className={styles.pageInfo}>
          Hiển thị {(page - 1) * ITEMS_PER_PAGE + (totalCount > 0 ? 1 : 0)} to {Math.min(page * ITEMS_PER_PAGE, totalCount)} of {totalCount} entries
        </div>

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

      <DetailAttemptModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        attemptData={selectedAttempt}
      />
      <ConfirmationUnlock
        isOpen={isUnlockModalOpen}
        onClose={() => {
          setIsUnlockModalOpen(false);
          setAttemptToUnlock(null);
        }}
        onConfirm={async () => {
          if (!attemptToUnlock) return;

          setIsUnlockModalOpen(false);

          await handleUnlockAttempt(attemptToUnlock.id);

          setAttemptToUnlock(null);
        }}
      />
    </div>
  );
}