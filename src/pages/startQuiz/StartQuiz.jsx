import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Folder, 
  BarChart2, 
  ListOrdered, 
  Clock, 
  Component, 
  AlertTriangle,
  Play
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import styles from './StartQuiz.module.css';

export default function StartQuiz() {
  const { id } = useParams(); // Lấy ID bài quiz từ URL
  const navigate = useNavigate();
  const [quizDetails, setQuizDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizDetails = async () => {
      try {
        setLoading(true);
        // Truy vấn chi tiết Quiz và JOIN bảng categories
        const { data, error } = await supabase
          .from('quizzes')
          .select('*, categories(name)')
          .eq('id', id)
          .single();

        if (error) throw error;
        setQuizDetails(data);
      } catch (err) {
        console.error('Lỗi tải dữ liệu Quiz:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchQuizDetails();
  }, [id]);

  if (loading) {
    return <div className={styles.container}><div className={styles.loading}>Đang tải dữ liệu...</div></div>;
  }

  if (!quizDetails) {
    return <div className={styles.container}><div className={styles.error}>Không tìm thấy bài Quiz!</div></div>;
  }

  // Ánh xạ dữ liệu hiển thị
  const categoryName = quizDetails.categories?.name || 'Không xác định';
  const isWeekly = quizDetails.quiz_type === 'weekly';
  const displayDifficulty = quizDetails.difficulty === 'hard' ? 'Khó' : quizDetails.difficulty === 'medium' ? 'Trung bình' : 'Dễ';
  
  // Style cho Tag độ khó
  const getDifficultyClass = (level) => {
    if (level === 'hard') return styles.diffHard;
    if (level === 'medium') return styles.diffMedium;
    return styles.diffEasy;
  };

  const handleStart = () => {
    // Chuyển hướng tới trang làm bài thực tế (ví dụ: /quiz/do/:id)
    console.log("Bắt đầu làm bài ID:", id);
    // navigate(`/quiz/do/${id}`);
  };

  return (
    <div className={styles.container}>
      {/* Nút Quay lại */}
      <button className={styles.backButton} onClick={() => navigate('/quiz-list')}>
        <ArrowLeft size={18} />
        <span>Quay lại danh sách</span>
      </button>

      {/* Thẻ nội dung chính */}
      <div className={styles.mainCard}>
        
        {/* Phần Title & Description */}
        <div className={styles.headerSection}>
          <h1 className={styles.title}>{quizDetails.title}</h1>
          <p className={styles.description}>
            {quizDetails.description || 'Bài thi đánh giá kiến thức lập trình. Vui lòng đọc kỹ câu hỏi và trả lời trong thời gian quy định.'}
          </p>
        </div>

        {/* Lưới thông tin Meta (Grid) */}
        <div className={styles.metaGrid}>
          {/* Item 1: Danh mục */}
          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>
              <Folder size={16} /> DANH MỤC
            </div>
            <div className={styles.metaValue}>
              <span className={styles.tagCategory}>{categoryName}</span>
            </div>
          </div>

          {/* Item 2: Độ khó */}
          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>
              <BarChart2 size={16} /> ĐỘ KHÓ
            </div>
            <div className={styles.metaValue}>
              <span className={`${styles.tagBase} ${getDifficultyClass(quizDetails.difficulty)}`}>
                {displayDifficulty}
              </span>
            </div>
          </div>

          {/* Item 3: Số câu hỏi */}
          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>
              <ListOrdered size={16} /> SỐ CÂU HỎI
            </div>
            <div className={styles.metaValueText}>
              {quizDetails.total_questions || 0} câu
            </div>
          </div>

          {/* Item 4: Thời gian */}
          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>
              <Clock size={16} /> THỜI GIAN
            </div>
            <div className={styles.metaValueText}>
              {isWeekly ? 'Không giới hạn' : `${quizDetails.duration} phút`}
            </div>
          </div>

          {/* Item 5: Loại Quiz */}
          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>
              <Component size={16} /> LOẠI QUIZ
            </div>
            <div className={styles.metaValueText}>
              {isWeekly ? 'Weekly Quiz' : 'Normal Quiz'}
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className={styles.footerSection}>
          <button className={styles.btnCancel} onClick={() => navigate('/quiz-list')}>
            Hủy bỏ
          </button>
          <button className={styles.btnStart} onClick={handleStart}>
            BẮT ĐẦU LÀM BÀI <Play size={16} fill="currentColor" />
          </button>
        </div>

      </div>
    </div>
  );
}