import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './UserManagerModal.module.css';

export default function UserManagerModal({ isOpen, onClose, onSave, initialData = null }) {
  const [userData, setUserData] = useState({
    mssv: '',
    full_name: '',
    email: '',
    password: '',
    role: 'student',
    is_active: true
  });

  // Đồng bộ dữ liệu khi mở Modal
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setUserData({
          ...initialData,
          password: '', // Luôn để trống password khi sửa (chỉ nhập khi muốn đổi)
        });
      } else {
        // Form trống khi Thêm mới
        setUserData({
          mssv: '',
          full_name: '',
          email: '',
          password: '',
          role: 'student',
          is_active: true
        });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  const toggleStatus = () => {
    setUserData(prev => ({ ...prev, is_active: !prev.is_active }));
  };

  const handleSubmit = () => {
    // Trả dữ liệu về cho component cha (UserManager) xử lý gọi API Supabase
    if (onSave) onSave(userData);
  };

  // Tiện ích render badge màu cho Role
  const renderRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className={`${styles.roleBadge} ${styles.badgeAdmin}`}>Admin</span>;
      case 'editor':
        return <span className={`${styles.roleBadge} ${styles.badgeEditor}`}>Editor</span>;
      default:
        return <span className={`${styles.roleBadge} ${styles.badgeStudent}`}>Student</span>;
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className={styles.header}>
          <h2>Thêm/Sửa Người Dùng</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className={styles.body}>
          
          <div className={styles.formGroup}>
            <label>MSSV</label>
            <input 
              type="text" 
              className={styles.inputField} 
              placeholder="Nhập mã số sinh viên..."
              value={userData.mssv}
              onChange={(e) => handleChange('mssv', e.target.value)}
              disabled={!!initialData} // Không cho sửa MSSV nếu đang ở chế độ Edit
            />
          </div>

          <div className={styles.formGroup}>
            <label>Họ và tên</label>
            <input 
              type="text" 
              className={styles.inputField} 
              placeholder="Nhập họ và tên..."
              value={userData.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Email đăng nhập</label>
            <input 
              type="email" 
              className={styles.inputField} 
              placeholder="Nhập địa chỉ email..."
              value={userData.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Mật khẩu</label>
            <input 
              type="password" 
              className={styles.inputField} 
              placeholder={initialData ? "Bỏ trống nếu không muốn đổi mật khẩu" : "Nhập mật khẩu cho tài khoản mới..."}
              value={userData.password}
              onChange={(e) => handleChange('password', e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.labelWithBadge}>
              Vai trò {renderRoleBadge(userData.role)}
            </label>
            <select 
              className={styles.selectField}
              value={userData.role}
              onChange={(e) => handleChange('role', e.target.value)}
            >
              <option value="student">Student</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Trạng thái</label>
            <div className={styles.toggleWrapper} onClick={toggleStatus}>
              <div className={`${styles.toggleTrack} ${userData.is_active ? styles.active : ''}`}>
                <div className={styles.toggleThumb}></div>
              </div>
              <span className={styles.toggleLabel}>
                {userData.is_active ? 'Hoạt động' : 'Khóa chặn'}
              </span>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className={styles.footer}>
          <button className={styles.btnCancel} onClick={onClose}>Hủy bỏ</button>
          <button className={styles.btnSave} onClick={handleSubmit}>Lưu thông tin</button>
        </div>

      </div>
    </div>
  );
}