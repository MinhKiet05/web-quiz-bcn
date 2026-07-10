import React from 'react';
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

const NAV_SETS = {
  student: [
    { icon: <List size={20} />, label: 'Danh sách Quiz', isActive: true },
    { icon: <Trophy size={20} />, label: 'Bảng xếp hạng' },
    { icon: <History size={20} />, label: 'Lịch sử làm bài' },
  ],
  editorExtra: [
    { icon: <BookOpen size={20} />, label: 'Quản lý Quiz' },
    { icon: <HelpCircle size={20} />, label: 'Quản lý Câu hỏi' },
  ],
  adminExtra: [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard thống kê' },
    { icon: <Users size={20} />, label: 'Quản lý Người dùng' },
  ],
};

export default function LeftNavigationBar({ user, onLogout }) {
  const role = user?.role ?? 'guest';
  const isAuthenticated = role !== 'guest';
  const commonItems = NAV_SETS.student;
  const roleItems = role === 'admin'
    ? [...NAV_SETS.editorExtra, ...NAV_SETS.adminExtra]
    : role === 'editor'
      ? NAV_SETS.editorExtra
      : [];
  const guestItems = [
    { icon: <List size={20} />, label: 'Danh sách Quiz', isActive: true },
    { icon: <Trophy size={20} />, label: 'Bảng xếp hạng' },
    { icon: <History size={20} />, label: 'Lịch sử làm bài' },
    { icon: <LogIn size={20} />, label: 'Đăng nhập' },
  ];
  const menuItems = isAuthenticated ? commonItems : guestItems;

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
            <NavItem key={item.label} icon={item.icon} label={item.label} isActive={item.isActive} />
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
              <NavItem key={item.label} icon={item.icon} label={item.label} isActive={item.isActive} />
            ))}
          </div>
        ) : null}
      </nav>

      {isAuthenticated ? (
        <div className={styles.footerSection}>
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

          <button className={styles.logoutButton} onClick={onLogout} type="button">
            <LogOut size={20} className={styles.logoutIcon} />
            <span className={styles.logoutText}>Đăng xuất</span>
          </button>
        </div>
      ) : null}
    </aside>
  );
}

function NavItem({ icon, label, isActive = false }) {
  return (
    <a href="#" onClick={(event) => event.preventDefault()} className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}>
      <div className={isActive ? styles.itemIconActive : ''}>{icon}</div>
      <span className={styles.itemLabel}>{label}</span>
    </a>
  );
}