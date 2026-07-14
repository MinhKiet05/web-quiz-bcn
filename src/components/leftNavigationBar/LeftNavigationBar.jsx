import React from 'react';
import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  HelpCircle,
  List,
  Trophy,
  History,
  LogOut,
  CircleUserRound,
  LogIn,
} from 'lucide-react';
import styles from './LeftNavigationBar.module.css';
import bcn from '/bcn.webp';
import ConfirmationModal from '../confirmationModal/ConfirmationLogoutModal';
import { toast } from 'sonner';
const NAV_SETS = {
  student: [
    { icon: <List size={20} />, label: 'Danh sách Quiz', to: '/quiz-list', end: true },
    { icon: <Trophy size={20} />, label: 'Bảng xếp hạng', to: '/leaderboard', end: true },
    { icon: <History size={20} />, label: 'Lịch sử làm bài', to: '/history', end: true },
  ],
  editorExtra: [
    { icon: <BookOpen size={20} />, label: 'Quản lý Quiz', to: '/quiz-manager', end: true },
  ],
  adminExtra: [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard thống kê', to: '/admin/dashboard', end: true },
    { icon: <Users size={20} />, label: 'Quản lý Người dùng', to: '/user-manager', end: true },
  ],
};

export default function LeftNavigationBar({ user, onLogout }) {
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const role = user?.role ?? 'guest';
  const isAuthenticated = role !== 'guest';
  const commonItems = NAV_SETS.student;
  const roleItems = role === 'admin'
    ? [...NAV_SETS.editorExtra, ...NAV_SETS.adminExtra]
    : role === 'editor'
      ? NAV_SETS.editorExtra
      : [];
  const guestItems = [
    { icon: <List size={20} />, label: 'Danh sách Quiz', to: '/quiz-list', end: true },
    { icon: <Trophy size={20} />, label: 'Bảng xếp hạng', to: '/leaderboard', end: true },
  ];
  const menuItems = isAuthenticated ? commonItems : guestItems;

  const handleConfirmLogout = () => {
    
    setIsLogoutOpen(false);
    // Chuyển hướng người dùng về trang login ở đây...
    if (onLogout) {
      onLogout();
      
    }
    toast.info('Đã đăng xuất khỏi hệ thống.', {
    description: 'Hẹn gặp lại bạn lần sau!',
  });
  };
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoSection}>
        <div className={styles.logoIconContainer}>
          <img src={bcn} alt="Logo" width="60" height="60" />
        </div>
        <div className={styles.logoTextContainer}>
          <span className={styles.logoTitle}>BCN Quiz</span>
          <span className={styles.logoSubtitle}>Learning Platform</span>
        </div>
      </div>

      <nav className={styles.navigation}>
        <div className={styles.menuGroup}>
          {menuItems.map((item) => (
            <NavItem key={item.label} icon={item.icon} label={item.label} to={item.to} end={item.end} />
          ))}
        </div>

        {roleItems.length > 0 ? (
          <div className={styles.dividerContainer}>
            <div className={styles.dividerLine}></div>
            <p className={styles.dividerText}>
              {role === 'admin' ? 'Admin View' : role === 'editor' ? 'Editor View' : 'Student View'}
            </p>
          </div>
        ) : null}

        {roleItems.length > 0 ? (
          <div className={styles.menuGroup}>
            {roleItems.map((item) => (
              <NavItem key={item.label} icon={item.icon} label={item.label} to={item.to} end={item.end} />
            ))}
          </div>
        ) : null}
      </nav>

      {isAuthenticated ? (
        <div className={styles.footerSection}>
          <NavLink to="/user/dashboard" className={({ isActive }) => `${styles.userCardLink} ${isActive ? styles.userCardLinkActive : ''}`}>
            <div className={styles.userCard}>
              <div className={styles.userAvatar}>
                <CircleUserRound size={40} />
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user?.full_name ?? 'Người dùng'}</span>
                <span className={styles.userMSSV}>{user?.mssv ?? ''}</span>
                <span className={styles.userRoleBadge}>{(user?.role ?? 'student').toUpperCase()}</span>
              </div>
            </div>
          </NavLink>

          <button 
        className={styles.logoutButton} 
        onClick={() => setIsLogoutOpen(true)}
      >
        <LogOut size={20} className={styles.logoutIcon} />
        <span className={styles.logoutText}>Đăng xuất</span>
      </button>
        </div>
        
      ) : (
        <div className={styles.footerSection}>
          {/* Tái sử dụng trực tiếp component NavItem cho nút Đăng nhập */}
          <NavItem 
            icon={<LogIn size={20} />} 
            label="Đăng nhập" 
            to="/login" 
          />
        </div>
      )}
      {/* Nhúng Modal ở đây */}
      <ConfirmationModal 
        isOpen={isLogoutOpen} 
        onClose={() => setIsLogoutOpen(false)} 
        onConfirm={handleConfirmLogout}
      />
    </aside>
  );
}

function NavItem({ icon, label, to, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
    >
      {({ isActive }) => (
        <>
          <div className={isActive ? styles.itemIconActive : ''}>{icon}</div>
          <span className={styles.itemLabel}>{label}</span>
        </>
      )}
    </NavLink>
  );
}