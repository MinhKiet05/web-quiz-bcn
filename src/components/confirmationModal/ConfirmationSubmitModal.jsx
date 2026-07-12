import React from 'react';
import { Send, X, AlertCircle } from 'lucide-react';
import styles from './ConfirmationSubmitModal.module.css';

export default function ConfirmationSubmitModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconWrapper}>
              <Send size={22} strokeWidth={2.5} />
            </div>
            <h3 className={styles.title}>Xác nhận nộp bài</h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Khung thông báo */}
        <div className={styles.warningBox}>
          <div className={styles.warningIcon}>
            <AlertCircle size={26} strokeWidth={2.5} />
          </div>
          <div className={styles.warningContent}>
            <span className={styles.warningTitle}>Lưu ý trước khi nộp</span>
            <span className={styles.warningText}>
               Bạn có chắc chắn muốn kết thúc và nộp bài thi này? Sau khi nộp, hệ thống sẽ tự động chấm điểm và bạn không thể thay đổi đáp án.
            </span>
          </div>
        </div>

        {/* Nút hành động */}
        <div className={styles.footer}>
          <button className={styles.btnCancel} onClick={onClose}>
            Tiếp tục làm bài
          </button>
          <button className={styles.btnConfirm} onClick={onConfirm}>
            Xác nhận nộp
          </button>
        </div>

      </div>
    </div>
  );
}