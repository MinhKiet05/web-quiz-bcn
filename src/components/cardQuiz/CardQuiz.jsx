import React from 'react';
import { SquareTerminal, Code, Braces, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './CardQuiz.module.css';

export default function CardQuiz({ quiz, onRequireLogin}) {
  const navigate = useNavigate();
  
  const {
    id, // Cần lấy thêm id để chuyển hướng
    title = 'Tên bài Quiz',
    category_name = 'C/C++',
    difficulty = 'easy',
    duration = 15,
    quiz_type = 'normal', 
  } = quiz || {};

  const isWeekly = quiz_type === 'weekly';

  const renderCategoryIcon = () => {
    const cat = category_name.toLowerCase();
    if (cat === 'web' || cat.includes('html')) return <Code size={22} className={styles.topIcon} />;
    if (cat === 'java' || cat.includes('mobile')) return <Braces size={22} className={styles.topIcon} />;
    return <SquareTerminal size={22} className={styles.topIcon} />; 
  };

  const getDifficultyDisplay = (level) => {
    switch (level) {
      case 'easy': return { label: 'Dễ', className: styles.diffEasy };
      case 'medium': return { label: 'Trung bình', className: styles.diffMedium };
      case 'hard': return { label: 'Khó', className: styles.diffHard };
      default: return { label: 'Dễ', className: styles.diffEasy };
    }
  };

  const difficultyData = getDifficultyDisplay(difficulty);

  // Xử lý sự kiện click "Xem chi tiết"
  const handleViewDetail = () => {
    const storedUser = localStorage.getItem('web-quiz-bcn-auth-user');
    
    if (!storedUser) {
      if (onRequireLogin) onRequireLogin();
    } else {
      // Nếu đã đăng nhập -> Chuyển tới trang StartQuiz kèm ID
      navigate(`/quiz/${id}`); 
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.iconContainer}>
          {renderCategoryIcon()}
        </div>
      </div>

      <div className={styles.tagsContainer}>
        {isWeekly && <span className={`${styles.tag} ${styles.tagWeekly}`}>Quiz tuần</span>}
        <span className={`${styles.tag} ${styles.tagCategory}`}>{category_name}</span>
        {!isWeekly && <span className={`${styles.tag} ${difficultyData.className}`}>{difficultyData.label}</span>}
      </div>

      <div className={styles.timeWrapper}>
        {!isWeekly && (
          <div className={styles.timeContainer}>
            <Clock size={16} />
            <span>{duration} phút</span>
          </div>
        )}
      </div>

      <div className={styles.divider}></div>

      {/* Gắn sự kiện onClick vào nút */}
      <button className={styles.actionButton} onClick={handleViewDetail}>
        Xem chi tiết
      </button>
    </div>
  );
}