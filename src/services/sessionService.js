import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase.js';

const USERS_COLLECTION = 'users';

/**
 * Tạo session ID duy nhất
 */
export const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
};

/**
 * Lấy thông tin thiết bị/browser
 */
export const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform || 'unknown';
  const browserName = getBrowserName(userAgent);
  
  return {
    userAgent: userAgent.substring(0, 200), // Giới hạn độ dài
    platform,
    browserName,
    timestamp: new Date().toISOString()
  };
};

/**
 * Xác định tên browser
 */
const getBrowserName = (userAgent) => {
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edg')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Unknown';
};

/**
 * Tạo session mới cho user và invalidate sessions cũ
 * @param {string} userId - ID người dùng
 * @param {Object} userData - Dữ liệu user hiện tại
 * @returns {Promise<string>} - Session ID mới
 */
export const createNewSession = async (userId, userData) => {
  try {
    const newSessionId = generateSessionId();
    const deviceInfo = getDeviceInfo();
    
    // Cập nhật user với session mới
    const updatedUserData = {
      ...userData,
      sessionId: newSessionId,
      sessionCreatedAt: new Date().toISOString(),
      deviceInfo: deviceInfo,
      lastActivity: new Date().toISOString()
    };
    
    await setDoc(doc(db, USERS_COLLECTION, userId), updatedUserData);
    
    return newSessionId;
  } catch (error) {
    console.error('Error creating new session:', error);
    throw error;
  }
};

/**
 * Xác thực session hiện tại
 * @param {string} userId - ID người dùng
 * @param {string} sessionId - Session ID cần xác thực
 * @returns {Promise<boolean>} - true nếu session hợp lệ
 */
export const validateSession = async (userId, sessionId) => {
  try {
    if (!userId || !sessionId) {
      return false;
    }
    
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    
    if (!userDoc.exists()) {
      return false;
    }
    
    const userData = userDoc.data();
    
    // Kiểm tra session ID có khớp không
    if (userData.sessionId !== sessionId) {
      return false;
    }
    
    // Kiểm tra session có quá hạn không (7 ngày)
    const sessionCreatedAt = new Date(userData.sessionCreatedAt);
    const now = new Date();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    
    if (now - sessionCreatedAt > sevenDays) {
      return false;
    }
    
    // Cập nhật lastActivity
    await setDoc(doc(db, USERS_COLLECTION, userId), {
      ...userData,
      lastActivity: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error validating session:', error);
    return false;
  }
};

/**
 * Xóa session hiện tại
 * @param {string} userId - ID người dùng
 */
export const clearSession = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      await setDoc(doc(db, USERS_COLLECTION, userId), {
        ...userData,
        sessionId: null,
        sessionCreatedAt: null,
        deviceInfo: null,
        lastActivity: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};

/**
 * Tạo listener để theo dõi thay đổi session
 * @param {string} userId - ID người dùng
 * @param {string} currentSessionId - Session ID hiện tại
 * @param {Function} onSessionInvalidated - Callback khi session bị invalidate
 * @returns {Function} - Unsubscribe function
 */
export const createSessionListener = (userId, currentSessionId, onSessionInvalidated) => {
  if (!userId || !currentSessionId) {
    return () => {}; // Empty unsubscribe function
  }
  
  const userDocRef = doc(db, USERS_COLLECTION, userId);
  
  const unsubscribe = onSnapshot(userDocRef, (doc) => {
    if (!doc.exists()) {
      onSessionInvalidated('User not found');
      return;
    }
    
    const userData = doc.data();
    
    // Kiểm tra session ID có còn khớp không
    if (userData.sessionId !== currentSessionId) {
      onSessionInvalidated('Session invalidated by new login');
    }
  }, (error) => {
    console.error('Session listener error:', error);
  });
  
  return unsubscribe;
};

/**
 * Lấy thông tin session hiện tại của user
 * @param {string} userId - ID người dùng
 * @returns {Promise<Object|null>} - Thông tin session
 */
export const getSessionInfo = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const userData = userDoc.data();
    
    return {
      sessionId: userData.sessionId,
      sessionCreatedAt: userData.sessionCreatedAt,
      deviceInfo: userData.deviceInfo,
      lastActivity: userData.lastActivity
    };
  } catch (error) {
    console.error('Error getting session info:', error);
    return null;
  }
};