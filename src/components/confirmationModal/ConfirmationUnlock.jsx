import React from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import styles from './ConfirmationUnlock.module.css';

export default function ConfirmationUnlock({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Xác nhận cho thi lại", 
  message = "Bạn có chắc chắn muốn cho thí sinh thi lại không? Dữ liệu sẽ được ẩn đi." 
}) {
  // Nếu state isOpen là false thì không render gì cả
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      {/* Ngăn sự kiện click lan ra ngoài overlay làm đóng modal */}
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconWrapper}>
              <Trash2 size={22} strokeWidth={2.5} />
            </div>
            <h3 className={styles.title}>{title}</h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Khung cảnh báo (Warning Box) */}
        <div className={styles.warningBox}>
          <div className={styles.warningIcon}>
            <AlertTriangle size={26} strokeWidth={2.5} />
          </div>
          <div className={styles.warningContent}>
            <span className={styles.warningTitle}>Cảnh báo hệ thống</span>
            <span className={styles.warningText}>
               {message}
            </span>
          </div>
        </div>

        {/* Nút hành động */}
        <div className={styles.footer}>
          <button className={styles.btnCancel} onClick={onClose}>
            Hủy bỏ
          </button>
          <button className={styles.btnConfirm} onClick={onConfirm}>
            Xác nhận
          </button>
        </div>

      </div>
    </div>
  );
}