/**
 * Multi-tab prevention utility using localStorage as lock mechanism
 */

const TAB_LOCK_KEY = 'activeTabLock';
const TAB_CHECK_INTERVAL = 1000; // Check every 1 second
const TAB_LOCK_TIMEOUT = 5000; // Lock expires after 5 seconds if tab crashes

/**
 * Tạo lock để đánh dấu tab này là active
 */
export const acquireTabLock = () => {
  const lockData = {
    timestamp: Date.now(),
    tabId: sessionStorage.getItem('tabSessionId') || 'unknown'
  };
  
  localStorage.setItem(TAB_LOCK_KEY, JSON.stringify(lockData));
  console.log('Tab lock acquired:', lockData.tabId);
};

/**
 * Kiểm tra tab này có phải là active tab không
 */
export const isActiveTab = () => {
  try {
    const lockDataStr = localStorage.getItem(TAB_LOCK_KEY);
    if (!lockDataStr) return false;
    
    const lockData = JSON.parse(lockDataStr);
    const currentTabId = sessionStorage.getItem('tabSessionId');
    
    // Kiểm tra lock có hết hạn không
    const now = Date.now();
    if (now - lockData.timestamp > TAB_LOCK_TIMEOUT) {
      // Lock hết hạn, có thể tab trước đó crash
      console.warn('Tab lock expired, acquiring new lock');
      acquireTabLock();
      return true;
    }
    
    return lockData.tabId === currentTabId;
  } catch (error) {
    console.error('Error checking active tab:', error);
    return false;
  }
};

/**
 * Xóa lock khi tab đóng
 */
export const releaseTabLock = () => {
  const currentTabId = sessionStorage.getItem('tabSessionId');
  
  try {
    const lockDataStr = localStorage.getItem(TAB_LOCK_KEY);
    if (lockDataStr) {
      const lockData = JSON.parse(lockDataStr);
      
      // Chỉ xóa lock nếu đúng tab này đang giữ
      if (lockData.tabId === currentTabId) {
        localStorage.removeItem(TAB_LOCK_KEY);
        console.log('Tab lock released:', currentTabId);
      }
    }
  } catch (error) {
    console.error('Error releasing tab lock:', error);
  }
};

/**
 * Setup tab monitoring để prevent multiple tabs
 * @param {Function} onMultipleTabsDetected - Callback khi detect multiple tabs
 */
export const setupTabPrevention = (onMultipleTabsDetected) => {
  // Acquire lock ngay lập tức
  acquireTabLock();
  
  // Định kỳ renew lock và check
  const interval = setInterval(() => {
    if (isActiveTab()) {
      // Renew lock nếu tab này đang active
      acquireTabLock();
    } else {
      // Tab khác đang active
      console.warn('Multiple tabs detected - this tab will be disabled');
      onMultipleTabsDetected();
    }
  }, TAB_CHECK_INTERVAL);
  
  // Cleanup khi beforeunload
  const handleBeforeUnload = () => {
    releaseTabLock();
    clearInterval(interval);
  };
  
  // Cleanup khi tab hidden (mobile browsers)
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Tab ẩn, có thể là switch tab
      setTimeout(() => {
        if (document.hidden && !isActiveTab()) {
          console.warn('Tab switched - this tab is no longer active');
          onMultipleTabsDetected();
        }
      }, 500);
    } else {
      // Tab visible again, try to acquire lock
      if (!isActiveTab()) {
        acquireTabLock();
      }
    }
  };
  
  // Event listeners
  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Return cleanup function
  return () => {
    clearInterval(interval);
    releaseTabLock();
    window.removeEventListener('beforeunload', handleBeforeUnload);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};

/**
 * Kiểm tra có tab nào khác đang mở không (không cần auth)
 */
export const hasOtherActiveTabs = () => {
  try {
    const lockDataStr = localStorage.getItem(TAB_LOCK_KEY);
    if (!lockDataStr) return false;
    
    const lockData = JSON.parse(lockDataStr);
    const currentTabId = sessionStorage.getItem('tabSessionId');
    
    // Kiểm tra lock có hết hạn không
    const now = Date.now();
    if (now - lockData.timestamp > TAB_LOCK_TIMEOUT) {
      return false; // Lock hết hạn, coi như không có tab nào
    }
    
    return lockData.tabId !== currentTabId;
  } catch (error) {
    console.error('Error checking other tabs:', error);
    return false;
  }
};