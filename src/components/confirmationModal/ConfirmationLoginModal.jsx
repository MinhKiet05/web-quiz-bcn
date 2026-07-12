import React from 'react';
import { LogIn, X, Lock } from 'lucide-react';
import styles from './ConfirmationLoginModal.module.css';

export default function ConfirmationLoginModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconWrapper}>
              <LogIn size={22} strokeWidth={2.5} />
            </div>
            <h3 className={styles.title}>Yêu cầu đăng nhập</h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Khung thông báo (Warning Box) */}
        <div className={styles.warningBox}>
          <div className={styles.warningIcon}>
            <Lock size={26} strokeWidth={2.5} />
          </div>
          <div className={styles.warningContent}>
            <span className={styles.warningTitle}>Quyền truy cập hạn chế</span>
            <span className={styles.warningText}>
               Bạn cần đăng nhập bằng tài khoản được cấp phát để xem chi tiết và tham gia làm bài Quiz này.
            </span>
          </div>
        </div>

        {/* Nút hành động */}
        <div className={styles.footer}>
          <button className={styles.btnCancel} onClick={onClose}>
            Đóng
          </button>
          <button className={styles.btnConfirm} onClick={onConfirm}>
            Đăng nhập ngay
          </button>
        </div>

      </div>
    </div>
  );
}