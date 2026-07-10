import React from 'react';
import LeftNavigationBar from './components/leftNavigationBar/LeftNavigationBar';
import styles from './AppLayout.module.css';

export default function AppLayout({ children, user, onLogout }) {
  return (
    <div className={styles.layoutContainer}>
      {/* Sidebar cố định bên trái */}
      <LeftNavigationBar user={user} onLogout={onLogout} />

      {/* Khu vực nội dung chính bên phải */}
      <main className={styles.mainContent}>
        {children ?? (
          <div className={styles.demoCanvas}>
            <div className={styles.demoIconBox}>
              <svg className={styles.demoIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-1 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <h1 className={styles.demoTitle}>Sidebar Showcase</h1>
            <p className={styles.demoDescription}>
              This area represents the main content canvas. The Unified SideNavBar component is anchored to the left edge, providing consistent navigation in its Admin configuration.
            </p>
            <div className={styles.demoBadge}>
              <div className={styles.badgeDot}></div>
              <span className={styles.badgeText}>{user ? `${user.role?.toUpperCase()} Mode Active` : 'Guest Mode Active'}</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}