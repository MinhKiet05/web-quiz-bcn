import React from 'react';
import { SquareTerminal, Code, Braces, Clock } from 'lucide-react';
import styles from './CardQuiz.module.css';

export default function CardQuiz({ quiz }) {
  const {
    title = 'Tên bài Quiz',
    category_name = 'C/C++',
    difficulty = 'easy',
    duration = 15,
    quiz_type = 'normal', 
  } = quiz || {};

  const isWeekly = quiz_type === 'weekly';

  // Ánh xạ Icon góc trên bên phải dựa theo Category
  const renderCategoryIcon = () => {
    const cat = category_name.toLowerCase();
    
    // Đổi logic kiểm tra thành 'web' và 'java'
    if (cat === 'web' || cat.includes('html')) {
      return <Code size={22} className={styles.topIcon} />;
    }
    if (cat === 'java' || cat.includes('mobile')) {
      return <Braces size={22} className={styles.topIcon} />;
    }
    // Mặc định C/C++
    return <SquareTerminal size={22} className={styles.topIcon} />; 
  };

  // Ánh xạ độ khó sang Tiếng Việt & CSS Class
  const getDifficultyDisplay = (level) => {
    switch (level) {
      case 'easy':
        return { label: 'Dễ', className: styles.diffEasy };
      case 'medium':
        return { label: 'Trung bình', className: styles.diffMedium };
      case 'hard':
        return { label: 'Khó', className: styles.diffHard };
      default:
        return { label: 'Dễ', className: styles.diffEasy };
    }
  };

  const difficultyData = getDifficultyDisplay(difficulty);

  return (
    <div className={styles.card}>
      
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.iconContainer}>
          {renderCategoryIcon()}
        </div>
      </div>

      {/* Tags */}
      <div className={styles.tagsContainer}>
        {isWeekly && (
          <span className={`${styles.tag} ${styles.tagWeekly}`}>
            Quiz tuần
          </span>
        )}
        
        <span className={`${styles.tag} ${styles.tagCategory}`}>
          {category_name}
        </span>
        
        {/* Bỏ tag độ khó nếu là Quiz tuần */}
        {!isWeekly && (
          <span className={`${styles.tag} ${difficultyData.className}`}>
            {difficultyData.label}
          </span>
        )}
      </div>

      {/* Thời gian (Bỏ hiển thị nếu là Quiz tuần) */}
      <div className={styles.timeWrapper}>
        {!isWeekly && (
          <div className={styles.timeContainer}>
            <Clock size={16} />
            <span>{duration} phút</span>
          </div>
        )}
      </div>

      <div className={styles.divider}></div>

      <button className={styles.actionButton}>
        Xem chi tiết
      </button>

    </div>
  );
}