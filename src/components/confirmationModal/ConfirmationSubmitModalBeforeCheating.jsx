import React from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import styles from './ConfirmationSubmitModalBeforeCheating.module.css';

export default function ConfirmationSubmitModalBeforeCheating({ isOpen, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconWrapper}>
              <ShieldAlert size={22} strokeWidth={2.5} />
            </div>
            <h3 className={styles.title}>Phát hiện vi phạm quy chế!</h3>
          </div>
          {/* CỐ TÌNH ẨN NÚT ĐÓNG (X) ĐỂ ÉP BUỘC NỘP BÀI */}
        </div>

        {/* Khung thông báo */}
        <div className={styles.warningBox}>
          <div className={styles.warningIcon}>
            <AlertTriangle size={26} strokeWidth={2.5} />
          </div>
          <div className={styles.warningContent}>
            <span className={styles.warningTitle}>Bắt buộc nộp bài</span>
            <span className={styles.warningText}>
               Hệ thống phát hiện bạn đã chuyển tab, rời khỏi màn hình thi hoặc cố tình can thiệp vào trình duyệt. Theo quy chế, bài thi của bạn sẽ bị buộc phải nộp ngay lập tức.
            </span>
          </div>
        </div>

        {/* Nút hành động duy nhất */}
        <div className={styles.footer}>
          <button className={styles.btnConfirm} onClick={onConfirm}>
            Xác nhận nộp bài
          </button>
        </div>

      </div>
    </div>
  );
}