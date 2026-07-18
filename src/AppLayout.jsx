import React from 'react';
import LeftNavigationBar from './components/leftNavigationBar/LeftNavigationBar';
import BottomNavigationBar from './components/bottomNavigationBar/BottomNavigationBar';
import styles from './AppLayout.module.css';

export default function AppLayout({ children, user, onLogout }) {
  return (
    <div className={styles.layoutContainer}>
      {/* Sidebar trên PC */}
      <LeftNavigationBar user={user} onLogout={onLogout} />

      <main className={styles.mainContent}>
        {children}
      </main>

      {/* Thanh điều hướng dưới cùng trên Mobile */}
      <BottomNavigationBar user={user} onLogout={onLogout} />
    </div>
  );
}