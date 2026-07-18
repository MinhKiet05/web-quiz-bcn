import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Home,
  Trophy,
  History,
  LogOut,
  CircleUserRound,
  LogIn,
  ClipboardCheck,
  List
} from 'lucide-react';
import styles from './BottomNavigationBar.module.css';
import ConfirmationModal from '../confirmationModal/ConfirmationLogoutModal';
import { toast } from 'sonner';

const NAV_SETS = {
  editorExtra: [
    { icon: <BookOpen size={24} />, label: 'Quản lý Quiz', to: '/quiz-manager', end: true },
  ],
  adminExtra: [
    { icon: <LayoutDashboard size={24} />, label: 'Dashboard thống kê', to: '/admin/dashboard', end: true },
    { icon: <Users size={24} />, label: 'Quản lý Người dùng', to: '/user-manager', end: true },
    { icon: <ClipboardCheck size={24} />, label: 'Quản lý Lịch sử', to: '/attempt-manager', end: true },
  ],
};

export default function BottomNavigationBar({ user, onLogout }) {
  const [activePopup, setActivePopup] = useState(null); // 'list' | 'user' | null
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const navRef = useRef(null);

  const role = user?.role ?? 'guest';
  const isAuthenticated = role !== 'guest';

  // Lấy các quyền cho popup "List"
  const listItems = role === 'admin'
    ? [...NAV_SETS.editorExtra, ...NAV_SETS.adminExtra]
    : role === 'editor'
      ? NAV_SETS.editorExtra
      : [];

  // Click ra ngoài thì đóng popup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setActivePopup(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConfirmLogout = () => {
    setIsLogoutOpen(false);
    setActivePopup(null);
    if (onLogout) onLogout();
    toast.info('Đã đăng xuất khỏi hệ thống.', { description: 'Hẹn gặp lại bạn lần sau!' });
  };

  const togglePopup = (popupName) => {
    setActivePopup(prev => prev === popupName ? null : popupName);
  };

  const closePopup = () => setActivePopup(null);

  return (
    <div className={styles.bottomNavContainer} ref={navRef}>
      {/* POPUP MENU */}
      {activePopup && (
        <div className={styles.popupMenu}>
          
          {/* MENU CHO ADMIN/EDITOR (Nút List) */}
          {activePopup === 'list' && listItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `${styles.popupItem} ${isActive ? styles.popupItemActive : ''}`}
              onClick={closePopup}
            >
              <div className={styles.popupIcon}>{item.icon}</div>
              <span className={styles.popupLabel}>{item.label}</span>
            </NavLink>
          ))}

          {/* MENU HỒ SƠ & ĐĂNG XUẤT (Nút User) */}
          {activePopup === 'user' && isAuthenticated && (
            <>
              <NavLink to="/user/dashboard" className={({ isActive }) => `${styles.popupItem} ${isActive ? styles.popupItemActive : ''}`} onClick={closePopup}>
                <div className={styles.popupIcon}><CircleUserRound size={24} /></div>
                <span className={styles.popupLabel}>Hồ sơ cá nhân</span>
              </NavLink>
              <button className={`${styles.popupItem} ${styles.logoutBtn}`} onClick={() => setIsLogoutOpen(true)}>
                <div className={styles.popupIcon}><LogOut size={24} /></div>
                <span className={styles.popupLabel}>Đăng xuất</span>
              </button>
            </>
          )}

          {/* Nếu là Khách (Guest) */}
          {activePopup === 'user' && !isAuthenticated && (
            <NavLink to="/login" className={styles.popupItem} onClick={closePopup}>
              <div className={styles.popupIcon}><LogIn size={24} /></div>
              <span className={styles.popupLabel}>Đăng nhập</span>
            </NavLink>
          )}
        </div>
      )}

      {/* THANH ĐIỀU HƯỚNG CHÍNH BÊN DƯỚI */}
      <nav className={styles.bottomBar}>
        <NavLink to="/quiz-list" end className={({ isActive }) => `${styles.navIcon} ${isActive ? styles.navIconActive : ''}`} onClick={closePopup}>
          <Home size={28} />
        </NavLink>
        
        <NavLink to="/leaderboard" end className={({ isActive }) => `${styles.navIcon} ${isActive ? styles.navIconActive : ''}`} onClick={closePopup}>
          <Trophy size={28} />
        </NavLink>

        {isAuthenticated && (
          <NavLink to="/history" end className={({ isActive }) => `${styles.navIcon} ${isActive ? styles.navIconActive : ''}`} onClick={closePopup}>
            <History size={28} />
          </NavLink>
        )}

        {/* Nút List chỉ xuất hiện nếu là Admin hoặc Editor */}
        {listItems.length > 0 && (
          <button 
            className={`${styles.navIcon} ${activePopup === 'list' ? styles.navIconActive : ''}`} 
            onClick={() => togglePopup('list')}
          >
            <List size={28} />
          </button>
        )}

        {/* Nút CircleUserRound */}
        <button 
          className={`${styles.navIcon} ${activePopup === 'user' ? styles.navIconActive : ''}`} 
          onClick={() => togglePopup('user')}
        >
          <CircleUserRound size={28} />
        </button>
      </nav>

      {/* Modal đăng xuất */}
      <ConfirmationModal isOpen={isLogoutOpen} onClose={() => setIsLogoutOpen(false)} onConfirm={handleConfirmLogout} />
    </div>
  );
}