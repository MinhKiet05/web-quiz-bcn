import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ChevronDown, Eye, Unlock, ChevronLeft, ChevronRight, Clock, Calendar
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import DetailAttemptModal from '../../components/detailAttemptModal/DetailAttemptModal';
import styles from './AttemptManager.module.css';
import { toast } from 'sonner';

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

  // Kiểm tra quyền
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('web-quiz-bcn-auth-user'));
    if (!storedUser || (storedUser.role !== 'admin' && storedUser.role !== 'editor')) {
      toast.error('Truy cập bị từ chối: Bạn không có quyền quản trị!');
      navigate('/quiz-list', { replace: true });
    }
  }, [navigate]);

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
   users!inner ( mssv, full_name ),
   quizzes!inner ( title )
`);

      // Lọc theo tìm kiếm (Tên hoặc MSSV)
      // Lưu ý: Tùy thuộc vào cấu hình Supabase, bạn có thể cần dùng RPC hoặc View cho việc tìm kiếm text phức tạp qua bảng JOIN.
      if (searchTerm) {
        query = query.or(`mssv.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`, { foreignTable: 'users' });
      }

      // Lọc theo trạng thái
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Phân trang
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      query = query
        .range(from, to)
        .order('started_at', { ascending: false });

      const { data, count, error } = await query;

      if (error) throw error;

      setAttempts(data || []);
      if (count !== null) setTotalCount(count);

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
    // 1. Kiểm tra ID bài quiz trước khi gọi Supabase để tránh lỗi undefined
    const quizId = attempt.quiz_id || attempt.quizzes?.id;

    if (!quizId) {
      console.error("Lỗi: Không tìm thấy ID bài Quiz!", attempt);
      toast.error("Không thể xác định bài thi này.");
      return;
    }

    try {
      // 2. Lấy chi tiết câu trả lời của sinh viên (Sử dụng cột fill_text_answer đúng như bạn đã chỉ ra)
      const { data: studentAnswers, error: ansError } = await supabase
        .from('attempt_answers')
        .select('*')
        .eq('attempt_id', attempt.id);

      if (ansError) throw ansError;

      // 3. Kéo toàn bộ câu hỏi & đáp án gốc của bài Quiz này
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
        .eq('id', attempt.quiz_id) // Dùng đúng cột quiz_id
        .single();

      if (quizError) throw quizError;

      // 4. Khớp dữ liệu
      const formattedQuestions = quizData.questions.map((q) => {
        const studentAns = studentAnswers.find(ans => ans.question_id === q.id);

        return {
          id: q.id,
          question_text: q.question_text,
          weight: q.weight,
          question_type: q.question_type,
          code_snippet: q.code_snippet,
          selected_answer_id: studentAns ? studentAns.selected_answer_id : null,
          // Đã khớp với cột fill_text_answer trong DB của bạn
          student_text_answer: studentAns ? studentAns.fill_text_answer : '',
          answers: q.answers
        };
      });

      setSelectedAttempt({
        mssv: attempt.users?.mssv,
        studentName: attempt.users?.full_name,
        quizTitle: quizData.title,
        score: attempt.score || 0,
        totalScore: quizData.questions.reduce((sum, q) => sum + (q.weight || 0), 0),
        // Sử dụng started_at và submitted_at đã khớp với dữ liệu bạn vừa gửi
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

  // --- Tiện ích Format Dữ liệu ---
  const formatTime = (start, end) => {
    if (!start || !end) return '05m 10s'; // Mock cho lúc đang làm (status = in_progress)
    const diffMs = new Date(end) - new Date(start);
    if (diffMs <= 0) return '--';
    const m = Math.floor(diffMs / 60000);
    const s = Math.floor((diffMs % 60000) / 1000);
    return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--/--/----';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB'); // Format DD/MM/YYYY
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '--/--/---- --:--';
    const d = new Date(dateStr);
    return d.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className={styles.container}>

      {/* 1. FILTER BAR (Đồng bộ QuizManager) */}
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
                <option value="all">Lọc theo Bài Quiz</option>
                <option value="cpp">C/C++ Cơ bản</option>
                <option value="web">Web Development</option>
                <option value="algo">Algorithms</option>
              </select>
              <ChevronDown className={styles.selectIcon} size={16} />
            </div>

            <div className={styles.selectWrapper}>
              <select
                className={styles.selectBox}
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); handleFilterChange(); }}
              >
                <option value="all">Lọc theo Trạng thái</option>
                <option value="submitted">Đã nộp</option>
                <option value="in_progress">Đang làm</option>
              </select>
              <ChevronDown className={styles.selectIcon} size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. BẢNG QUẢN LÝ LƯỢT LÀM BÀI */}
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
                const isSubmitted = attempt.status === 'submitted';
                const score = attempt.score ?? '-';
                const totalScore = 100;
                const isPassed = score !== '-' && score >= 50;

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
                        <span className={styles.scoreTotal}> / {totalScore}</span>
                      </span>
                    </td>


                    {/* CỘT NGÀY NỘP BÀI (Tách riêng biệt) */}
                    <td className={styles.dateCell}>
                      <Calendar size={14} className={styles.iconSmall} />
                      {formatDate(attempt.submitted_at)}
                    </td>

                    <td>
                      <span className={isSubmitted ? styles.statusSubmitted : styles.statusInProgress}>
                        <span className={styles.dot}></span>
                        {isSubmitted ? 'Đã nộp' : 'Đang làm'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button className={styles.btnAction} onClick={() => handleViewDetail(attempt)} title="Xem chi tiết">
                          <Eye size={18} />
                        </button>
                        <button className={styles.btnAction} onClick={() => handleUnlockAttempt(attempt.id)} title="Mở khóa/Cho thi lại">
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

      {/* 3. PHÂN TRANG (Đồng bộ thiết kế cũ) */}
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

      {/* MODAL XEM CHI TIẾT */}
      <DetailAttemptModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        attemptData={selectedAttempt}
      />

    </div>
  );
}