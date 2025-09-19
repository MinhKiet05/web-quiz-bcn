import { doc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { hashPassword, verifyPassword, isPasswordHashed } from '../utils/passwordUtils.js';
import { createNewSession, validateSession, clearSession } from './sessionService.js';
import { registerTabSession, validateTabSession, initTabSession, clearTabSessionFromServer, clearTabSessionId } from './tabSessionService.js';

const USERS_COLLECTION = 'users';

/**
 * Tạo token ngẫu nhiên
 */
const generateToken = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

/**
 * Đăng nhập người dùng bằng MSSV/password, tạo session mới và đăng ký tab session
 * @param {string} username - MSSV
 * @param {string} password - Mật khẩu
 * @returns {Promise<Object|null>} - Thông tin người dùng hoặc null
 */
export const loginUser = async (username, password) => {
  try {
    // Thử đăng nhập bằng document ID (MSSV)
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, username));
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const userData = userDoc.data();
    
    // Kiểm tra mật khẩu - support cả hashed và plaintext (cho migration)
    let passwordMatch = false;
    
    if (isPasswordHashed(userData.matKhau)) {
      // Password đã hash - sử dụng verifyPassword
      passwordMatch = verifyPassword(password, userData.matKhau);
    } else {
      // Password chưa hash - so sánh trực tiếp (legacy)
      passwordMatch = (userData.matKhau === password);
      
      // Cập nhật hash cho user này trong background
      if (passwordMatch) {
        const hashedPass = hashPassword(password);
        // Cập nhật password hash cho lần sau
        await setDoc(doc(db, USERS_COLLECTION, username), {
          ...userData,
          matKhau: hashedPass
        });
        userData.matKhau = hashedPass; // Update local copy
      }
    }
    
    if (!passwordMatch) {
      return null;
    }
    
    // Tạo token mới
    const newToken = generateToken();
    
    // Khởi tạo tab session cho tab này
    const tabSessionId = initTabSession();
    
    // Tạo session mới (sẽ invalidate session cũ nếu có)
    const sessionId = await createNewSession(username, {
      ...userData,
      matKhau: isPasswordHashed(userData.matKhau) ? userData.matKhau : hashPassword(password), // Ensure hash
      token: newToken,
      lastLogin: new Date().toISOString()
    });
    
    // Đăng ký tab session (sẽ invalidate tab khác nếu có)
    await registerTabSession(username, tabSessionId, {
      ...userData,
      matKhau: isPasswordHashed(userData.matKhau) ? userData.matKhau : hashPassword(password),
      token: newToken,
      sessionId: sessionId,
      lastLogin: new Date().toISOString()
    });
    
    return {
      uid: username,
      name: userData.name,
      username: username,
      roles: userData.roles || [],
      token: newToken,
      sessionId: sessionId,
      tabSessionId: tabSessionId
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Xác thực token và session để duy trì phiên đăng nhập (không strict về tab session)
 * @param {string} token - Token cần xác thực
 * @param {string} sessionId - Session ID cần xác thực
 * @param {string} tabSessionId - Tab Session ID cần xác thực (optional)
 * @returns {Promise<Object|null>} - Thông tin người dùng hoặc null
 */
export const verifyToken = async (token, sessionId = null, tabSessionId = null) => {
  try {
    if (!token) {
      return null;
    }
    
    // Tìm user có token này
    const q = query(
      collection(db, USERS_COLLECTION), 
      where('token', '==', token)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;
    
    // Kiểm tra session validity nếu có sessionId
    if (sessionId) {
      const isSessionValid = await validateSession(userId, sessionId);
      if (!isSessionValid) {
        return null;
      }
    }
    
    // Không bắt buộc tab session validation cho user reload/mở tab mới
    // Tab session chỉ để monitoring, không block user
    
    // Cập nhật lastActivity
    await setDoc(doc(db, USERS_COLLECTION, userId), {
      ...userData,
      lastActivity: new Date().toISOString()
    });
    
    return {
      uid: userId,
      name: userData.name,
      username: userData.username || userId,
      roles: userData.roles || [],
      token: userData.token,
      sessionId: userData.sessionId,
      tabSessionId: userData.tabSessionId
    };
  } catch {
    return null;
  }
};

/**
 * Lấy thông tin người dùng theo ID
 * @param {string} userId - ID người dùng
 * @returns {Promise<Object|null>} - Thông tin người dùng
 */
export const getUserById = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    
    if (!userDoc.exists()) {
      return null;
    }
    
    return {
      id: userDoc.id,
      ...userDoc.data()
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Kiểm tra quyền của người dùng
 * @param {Object} user - Thông tin người dùng
 * @param {string} requiredRole - Quyền yêu cầu
 * @returns {boolean} - True nếu có quyền
 */
export const hasRole = (user, requiredRole) => {
  if (!user || !user.roles) return false;
  return user.roles.includes(requiredRole);
};

/**
 * Kiểm tra có phải admin không
 * @param {Object} user - Thông tin người dùng
 * @returns {boolean} - True nếu là admin
 */
export const isAdmin = (user) => {
  return hasRole(user, 'admin');
};

/**
 * Lưu thông tin đăng nhập vào localStorage
 * @param {Object} user - Thông tin người dùng
 */
export const saveUserToStorage = (user) => {
  localStorage.setItem('currentUser', JSON.stringify(user));
  localStorage.setItem('loginTime', new Date().getTime().toString());
};

/**
 * Lấy thông tin người dùng từ localStorage
 * @returns {Object|null} - Thông tin người dùng hoặc null
 */
export const getUserFromStorage = () => {
  try {
    const userData = localStorage.getItem('currentUser');
    const loginTime = localStorage.getItem('loginTime');
    
    if (!userData || !loginTime) {
      return null;
    }
    
    // Kiểm tra thời gian đăng nhập (30 ngày thay vì 7 ngày)
    const now = new Date().getTime();
    const loginTimestamp = parseInt(loginTime);
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    
    if (now - loginTimestamp > thirtyDays) {
      clearUserStorage();
      return null;
    }
    
    const user = JSON.parse(userData);
    // Cập nhật thời gian truy cập để gia hạn phiên
    localStorage.setItem('loginTime', new Date().getTime().toString());
    
    return user;
  } catch {
    // Không clear storage ngay, có thể chỉ là lỗi parse
    return null;
  }
};

/**
 * Xóa thông tin người dùng khỏi localStorage
 */
export const clearUserStorage = () => {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('loginTime');
};

/**
 * Đăng xuất người dùng (không redirect tự động) và xóa cả session và tab session
 * @param {string} userId - ID người dùng (optional, sẽ clear session nếu có)
 */
export const logout = async (userId = null) => {
  try {
    // Clear session và tab session từ database nếu có userId
    if (userId) {
      await clearSession(userId);
      await clearTabSessionFromServer(userId);
    }
    
    // Clear tab session từ sessionStorage
    clearTabSessionId();
    
    // Clear local storage
    clearUserStorage();
  } catch {
    // Vẫn clear local storage ngay cả khi có lỗi
    clearTabSessionId();
    clearUserStorage();
  }
};

/**
 * Đăng ký người dùng mới
 * @param {Object} userData - Thông tin người dùng
 * @param {string} userData.username - Tên đăng nhập
 * @param {string} userData.password - Mật khẩu
 * @param {string} userData.name - Tên hiển thị
 * @param {string} userData.email - Email (tùy chọn)
 * @returns {Promise<Object|null>} - Thông tin người dùng đã tạo hoặc null
 */
export const registerUser = async (userData) => {
  try {
    const { username, password, name, role = 'user' } = userData;
    
    // Kiểm tra MSSV đã tồn tại chưa (document ID)
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, username));
    if (userDoc.exists()) {
      throw new Error('MSSV đã được đăng ký');
    }
    
    // Hash password trước khi lưu
    const hashedPassword = hashPassword(password);
    
    // Tạo user data với cấu trúc mới
    const newUserData = {
      name: name,
      matKhau: hashedPassword, // Lưu password đã hash
      roles: [role], // Sử dụng array roles
      lastLogin: null, // Chưa đăng nhập lần nào
      token: null, // Chưa có token
      createdAt: new Date().toISOString()
    };
    
    // Tạo document với ID là MSSV
    await setDoc(doc(db, USERS_COLLECTION, username), newUserData);
    
    const newUser = {
      uid: username,
      username: username,
      name: name,
      roles: [role]
    };
    
    return newUser;
  } catch (error) {
    throw error;
  }
};

/**
 * Kiểm tra MSSV có tồn tại không
 * @param {string} username - MSSV cần kiểm tra
 * @returns {Promise<boolean>} - true nếu đã tồn tại, false nếu chưa
 */
export const checkUsernameExists = async (username) => {
  // Kiểm tra trực tiếp bằng document ID
  const userDoc = await getDoc(doc(db, USERS_COLLECTION, username));
  return userDoc.exists();
};

/**
 * Tạo user với MSSV cụ thể (dành cho admin)
 * @param {string} userId - MSSV
 * @param {Object} userData - Thông tin người dùng
 * @param {string} userData.name - Tên hiển thị
 * @param {string} userData.matKhau - Mật khẩu
 * @param {string[]} userData.roles - Danh sách vai trò
 * @returns {Promise<Object>} - Thông tin người dùng đã tạo
 */
export const createUserWithId = async (userId, userData) => {
  try {
    
    // Kiểm tra MSSV đã tồn tại chưa
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    if (userDoc.exists()) {
      throw new Error('MSSV đã tồn tại');
    }
    
    // Tạo user data với cấu trúc chuẩn
    const newUserData = {
      name: userData.name,
      matKhau: userData.matKhau,
      roles: userData.roles || ['user'],
      lastLogin: null,
      token: null,
      createdAt: new Date().toISOString()
    };
    
    // Tạo document với MSSV làm ID
    await setDoc(doc(db, USERS_COLLECTION, userId), newUserData);
    
    // Trả về user data với ID
    const result = {
      uid: userId,
      username: userId,
      ...newUserData
    };
    
    return result;
    
  } catch (error) {
    throw error;
  }
};
