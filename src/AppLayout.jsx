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
        {children}
      </main>
    </div>
  );
}