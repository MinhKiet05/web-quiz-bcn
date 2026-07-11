import React from 'react';
import LeftNavigationBar from './components/leftNavigationBar/LeftNavigationBar';
import styles from './AppLayout.module.css';

export default function AppLayout({ children, user, onLogout }) {
  return (
    <div className={styles.layoutContainer}>
      <LeftNavigationBar user={user} onLogout={onLogout} />

      <main className={styles.mainContent}>
        {children}
      </main>

      <div className={styles.rightSpace}></div>
    </div>
  );
}