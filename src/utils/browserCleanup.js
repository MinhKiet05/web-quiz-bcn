/**
 * Utility để xử lý cleanup session khi user đóng browser/tab
 */

import { clearSession } from '../services/sessionService.js';

/**
 * Setup cleanup listener cho browser events
 * @param {string} userId - ID người dùng
 * @param {string} sessionId - Session ID
 */
export const setupBrowserCleanup = (userId, sessionId) => {
  if (!userId || !sessionId) return;

  // Cleanup khi user đóng tab/browser
  const handleBeforeUnload = async () => {
    try {
      // Sử dụng navigator.sendBeacon để gửi request cleanup ngay cả khi browser đóng
      const cleanupUrl = `${window.location.origin}/api/cleanup-session`;
      const data = JSON.stringify({ userId, sessionId });
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon(cleanupUrl, data);
      } else {
        // Fallback cho browser không support sendBeacon
        await clearSession(userId);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  // Cleanup khi page unload
  const handleUnload = () => {
    handleBeforeUnload();
  };

  // Cleanup khi user idle quá lâu
  let idleTimer = null;
  const IDLE_TIME = 30 * 60 * 1000; // 30 phút

  const resetIdleTimer = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      console.warn('User idle too long, cleaning up session');
      handleBeforeUnload();
    }, IDLE_TIME);
  };

  // Events cho idle detection
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

  // Setup event listeners
  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('unload', handleUnload);
  
  events.forEach(event => {
    document.addEventListener(event, resetIdleTimer, true);
  });

  // Start idle timer
  resetIdleTimer();

  // Return cleanup function
  return () => {
    clearTimeout(idleTimer);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('unload', handleUnload);
    
    events.forEach(event => {
      document.removeEventListener(event, resetIdleTimer, true);
    });
  };
};

/**
 * Setup visibility change listener để detect tab switching
 * @param {Function} onTabHidden - Callback khi tab bị ẩn
 * @param {Function} onTabVisible - Callback khi tab hiển thị lại
 */
export const setupVisibilityListener = (onTabHidden, onTabVisible) => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      onTabHidden();
    } else {
      onTabVisible();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};