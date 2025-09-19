import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase.js';

const USERS_COLLECTION = 'users';
const TAB_SESSION_KEY = 'tabSessionId';

/**
 * Tạo tab session ID duy nhất cho tab hiện tại
 */
export const generateTabSessionId = () => {
  return `tab_${Date.now()}_${Math.random().toString(36).substring(2)}_${Math.random().toString(36).substring(2)}`;
};

/**
 * Lấy tab session ID từ sessionStorage (riêng cho từng tab)
 */
export const getTabSessionId = () => {
  return sessionStorage.getItem(TAB_SESSION_KEY);
};

/**
 * Lưu tab session ID vào sessionStorage
 */
export const setTabSessionId = (tabSessionId) => {
  sessionStorage.setItem(TAB_SESSION_KEY, tabSessionId);
};

/**
 * Xóa tab session ID khỏi sessionStorage
 */
export const clearTabSessionId = () => {
  sessionStorage.removeItem(TAB_SESSION_KEY);
};

/**
 * Khởi tạo tab session - tạo ID mới cho tab này
 */
export const initTabSession = () => {
  let tabSessionId = getTabSessionId();
  
  if (!tabSessionId) {
    tabSessionId = generateTabSessionId();
    setTabSessionId(tabSessionId);
  }
  
  return tabSessionId;
};

/**
 * Đăng ký tab session với server (cập nhật tabSessionId cho user)
 * @param {string} userId - ID người dùng
 * @param {string} tabSessionId - Tab Session ID
 * @param {Object} userData - Dữ liệu user hiện tại
 */
export const registerTabSession = async (userId, tabSessionId, userData) => {
  const updatedUserData = {
    ...userData,
    tabSessionId: tabSessionId,
    tabRegisteredAt: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  };
  
  await setDoc(doc(db, USERS_COLLECTION, userId), updatedUserData);
  return true;
};

/**
 * Xác thực tab session - kiểm tra tab này có phải là tab đang active không
 * @param {string} userId - ID người dùng
 * @param {string} tabSessionId - Tab Session ID cần xác thực
 */
export const validateTabSession = async (userId, tabSessionId) => {
  if (!userId || !tabSessionId) {
    return false;
  }
  
  const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
  
  if (!userDoc.exists()) {
    return false;
  }
  
  const userData = userDoc.data();
  const activeTabSessionId = userData.tabSessionId;
  
  const isValid = activeTabSessionId === tabSessionId;
  
  return isValid;
};

/**
 * Xóa tab session khỏi server (khi tab đóng hoặc logout)
 * @param {string} userId - ID người dùng
 */
export const clearTabSessionFromServer = async (userId) => {
  const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
  
  if (userDoc.exists()) {
    const userData = userDoc.data();
    
    await setDoc(doc(db, USERS_COLLECTION, userId), {
      ...userData,
      tabSessionId: null,
      tabRegisteredAt: null,
      lastActivity: new Date().toISOString()
    });
  }
};

/**
 * Tạo listener để theo dõi thay đổi tab session - không aggressive
 * @param {string} userId - ID người dùng
 * @param {string} currentTabSessionId - Tab Session ID hiện tại
 * @param {Function} onTabInvalidated - Callback khi tab bị invalidate
 */
export const createTabSessionListener = (userId, currentTabSessionId) => {
  if (!userId || !currentTabSessionId) {
    return () => {}; // Empty unsubscribe function
  }
  
  const userDocRef = doc(db, USERS_COLLECTION, userId);
  
  const unsubscribe = onSnapshot(userDocRef, (doc) => {
    if (!doc.exists()) {
      return; // Không force logout
    }
    
    const userData = doc.data();
    const activeTabSessionId = userData.tabSessionId;
    
    // Chỉ log thay đổi, không force logout
    if (activeTabSessionId && activeTabSessionId !== currentTabSessionId) {
      // Tab session changed but allowing multiple tabs for same user
    }
  });
  
  return unsubscribe;
};

/**
 * Kiểm tra có tab nào khác đang active không
 * @param {string} userId - ID người dùng
 */
export const hasActiveTab = async (userId) => {
  const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
  
  if (!userDoc.exists()) {
    return false;
  }
  
  const userData = userDoc.data();
  return !!userData.tabSessionId;
};

/**
 * Lấy thông tin tab session hiện tại
 * @param {string} userId - ID người dùng
 */
export const getTabSessionInfo = async (userId) => {
  const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
  
  if (!userDoc.exists()) {
    return null;
  }
  
  const userData = userDoc.data();
  
  return {
    tabSessionId: userData.tabSessionId,
    tabRegisteredAt: userData.tabRegisteredAt,
    lastActivity: userData.lastActivity
  };
};