import React, { useState, useEffect, useRef } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
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

  // State quản lý lỗi và ẩn/hiện mật khẩu
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Khởi tạo useRef để đưa con trỏ vào ô nhập sai
  const mssvRef = useRef(null);
  const fullNameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  // Đồng bộ dữ liệu khi mở Modal
  useEffect(() => {
    if (isOpen) {
      setErrors({}); // Xóa lỗi cũ khi mở lại modal
      setShowPassword(false);
      
      if (initialData) {
        setUserData({
          ...initialData,
          password: '', // Luôn để trống password khi sửa
        });
      } else {
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
    // Tự động xóa viền đỏ khi người dùng bắt đầu gõ lại vào ô đó
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  const toggleStatus = () => {
    setUserData(prev => ({ ...prev, is_active: !prev.is_active }));
  };

  const handleSubmit = () => {
    let newErrors = {};
    let firstErrorRef = null;

    // 1. Validate MSSV: Bắt buộc 8 chữ số, không chứa chữ (chỉ kiểm tra khi tạo mới)
    const mssvRegex = /^\d{8}$/;
    if (!mssvRegex.test(userData.mssv)) {
      newErrors.mssv = true;
      toast.error("MSSV không hợp lệ: Phải bao gồm đúng 8 chữ số.");
      if (!firstErrorRef) firstErrorRef = mssvRef;
    }

    // 2. Validate Họ và tên: Không được chứa số và không được để trống
    const nameRegex = /\d/;
    if (!userData.full_name.trim() || nameRegex.test(userData.full_name)) {
      newErrors.full_name = true;
      toast.error("Họ tên không hợp lệ: Không được để trống và không chứa chữ số.");
      if (!firstErrorRef) firstErrorRef = fullNameRef;
    }

    // 3. Validate Email: Phải có đuôi @gmail.com
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(userData.email)) {
      newErrors.email = true;
      toast.error("Email không hợp lệ: Vui lòng sử dụng địa chỉ @gmail.com.");
      if (!firstErrorRef) firstErrorRef = emailRef;
    }

    // 4. Validate Mật khẩu: Ít nhất 6 ký tự
    const isUpdate = !!initialData;
    if (!isUpdate || (isUpdate && userData.password)) {
      if (userData.password.length < 6) {
        newErrors.password = true;
        toast.error("Mật khẩu quá ngắn: Phải có ít nhất 6 ký tự.");
        if (!firstErrorRef) firstErrorRef = passwordRef;
      }
    }

    // Nếu có lỗi -> Lưu danh sách lỗi để hiện viền đỏ & focus ô đầu tiên
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      firstErrorRef.current.focus();
      return;
    }

    // Nếu dữ liệu hợp lệ, trả về cho cha xử lý
    if (onSave) onSave(userData);
  };

  const renderRoleBadge = (role) => {
    switch (role) {
      case 'admin': return <span className={`${styles.roleBadge} ${styles.badgeAdmin}`}>Admin</span>;
      case 'editor': return <span className={`${styles.roleBadge} ${styles.badgeEditor}`}>Editor</span>;
      default: return <span className={`${styles.roleBadge} ${styles.badgeStudent}`}>Student</span>;
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        
        <div className={styles.header}>
          <h2>{initialData ? 'Sửa Người Dùng' : 'Thêm Người Dùng'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          
          <div className={styles.formGroup}>
            <label>MSSV</label>
            <input 
              ref={mssvRef}
              type="text" 
              className={`${styles.inputField} ${errors.mssv ? styles.inputError : ''}`} 
              placeholder="Nhập mã số sinh viên..."
              value={userData.mssv}
              onChange={(e) => handleChange('mssv', e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Họ và tên</label>
            <input 
              ref={fullNameRef}
              type="text" 
              className={`${styles.inputField} ${errors.full_name ? styles.inputError : ''}`} 
              placeholder="Nhập họ và tên..."
              value={userData.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Email đăng nhập</label>
            <input 
              ref={emailRef}
              type="email" 
              className={`${styles.inputField} ${errors.email ? styles.inputError : ''}`} 
              placeholder="Ví dụ: example@gmail.com"
              value={userData.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Mật khẩu</label>
            <div className={styles.inputWrapper}>
              <input 
                ref={passwordRef}
                type={showPassword ? "text" : "password"} 
                className={`${styles.inputField} ${errors.password ? styles.inputError : ''}`} 
                placeholder={initialData ? "Bỏ trống nếu không muốn đổi..." : "Nhập ít nhất 6 ký tự..."}
                value={userData.password}
                onChange={(e) => handleChange('password', e.target.value)}
              />
              <button 
                type="button" 
                className={styles.eyeButton}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1" // Tránh focus nhầm vào nút mắt khi nhấn Tab
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
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

        <div className={styles.footer}>
          <button className={styles.btnCancel} onClick={onClose}>Hủy bỏ</button>
          <button className={styles.btnSave} onClick={handleSubmit}>Lưu thông tin</button>
        </div>

      </div>
    </div>
  );
}