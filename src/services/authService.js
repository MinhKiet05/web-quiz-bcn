import { doc, getDoc, collection, query, where, getDocs, addDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase.js';

const USERS_COLLECTION = 'users';

/**
 * Tạo token ngẫu nhiên
 */
const generateToken = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

/**
 * Đăng nhập người dùng bằng username/password, tạo và lưu token
 * @param {string} username - Tên đăng nhập hoặc ID
 * @param {string} password - Mật khẩu
 * @returns {Promise<Object|null>} - Thông tin người dùng hoặc null
 */
export const loginUser = async (username, password) => {
  try {
    console.log('Attempting login for:', username);
    
    // Thử đăng nhập bằng document ID trước
    let userDoc = await getDoc(doc(db, USERS_COLLECTION, username));
    
    // Nếu không tìm thấy bằng ID, thử tìm bằng username field
    if (!userDoc.exists()) {
      const q = query(
        collection(db, USERS_COLLECTION), 
        where('username', '==', username)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        userDoc = querySnapshot.docs[0];
      }
    }
    
    if (!userDoc.exists()) {
      console.log('User not found:', username);
      return null;
    }
    
    const userData = userDoc.data();
    
    // Kiểm tra mật khẩu
    if (userData.matKhau !== password) {
      console.log('Invalid password for user:', username);
      return null;
    }
    
    // Tạo token mới
    const newToken = generateToken();
    
    // Cập nhật token vào Firestore
    await setDoc(doc(db, USERS_COLLECTION, userDoc.id), {
      ...userData,
      token: newToken,
      lastLogin: new Date().toISOString()
    });
    
    console.log('Login successful for:', username, 'Token:', newToken);
    return {
      uid: userDoc.id,
      name: userData.name,
      username: userData.username || userDoc.id,
      roles: userData.roles || [], 
      token: newToken,
      ...userData
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Xác thực token để duy trì phiên đăng nhập
 * @param {string} token - Token cần xác thực
 * @returns {Promise<Object|null>} - Thông tin người dùng hoặc null
 */
export const verifyToken = async (token) => {
  try {
    if (!token) {
      console.log('No token provided for verification');
      return null;
    }
    
    console.log('Verifying token...');
    
    // Tìm user có token này
    const q = query(
      collection(db, USERS_COLLECTION), 
      where('token', '==', token)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('Invalid token - no matching user found');
      return null;
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    console.log('Token verified successfully for user:', userData.username || userDoc.id);
    
    // Cập nhật lastActivity
    await setDoc(doc(db, USERS_COLLECTION, userDoc.id), {
      ...userData,
      lastActivity: new Date().toISOString()
    });
    
    return {
      uid: userDoc.id,
      name: userData.name,
      username: userData.username || userDoc.id,
      roles: userData.roles || [],
      token: userData.token
    };
  } catch (error) {
    console.error('Token verification error:', error);
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
    console.error('Error getting user:', error);
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
  try {
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('loginTime', new Date().getTime().toString());
    console.log('User saved to storage:', user.username || user.uid);
  } catch (error) {
    console.error('Error saving user to storage:', error);
  }
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
      console.log('No user data in storage');
      return null;
    }
    
    // Kiểm tra thời gian đăng nhập (30 ngày thay vì 7 ngày)
    const now = new Date().getTime();
    const loginTimestamp = parseInt(loginTime);
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    
    if (now - loginTimestamp > thirtyDays) {
      console.log('Session expired (30 days), clearing storage');
      clearUserStorage();
      return null;
    }
    
    const user = JSON.parse(userData);
    console.log('Retrieved user from storage:', user.username || user.uid, 'Login time:', new Date(loginTimestamp).toLocaleString());
    
    // Cập nhật thời gian truy cập để gia hạn phiên
    localStorage.setItem('loginTime', new Date().getTime().toString());
    
    return user;
  } catch (error) {
    console.error('Error getting user from storage:', error);
    // Không clear storage ngay, có thể chỉ là lỗi parse
    return null;
  }
};

/**
 * Xóa thông tin người dùng khỏi localStorage
 */
export const clearUserStorage = () => {
  try {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('loginTime');
    console.log('User storage cleared');
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};

/**
 * Đăng xuất người dùng (không redirect tự động)
 */
export const logout = () => {
  clearUserStorage();
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
    const { username, password, name, role = 'student' } = userData;
    
    console.log('Attempting registration for:', username);
    
    // Kiểm tra username đã tồn tại chưa
    const existingUserQuery = query(
      collection(db, USERS_COLLECTION), 
      where('username', '==', username)
    );
    const existingUserSnapshot = await getDocs(existingUserQuery);
    
    if (!existingUserSnapshot.empty) {
      throw new Error('MSSV đã được đăng ký');
    }
    
    // Tạo user mới với ID tự động
    const newUserData = {
      username: username,
      matKhau: password, // Sử dụng trường matKhau như trong database hiện tại
      name: name,
      role: role, // Sử dụng role đơn thay vì roles array
      createdAt: new Date().toISOString()
    };
    
    // Tạo document mới với ID tự động
    const docRef = await addDoc(collection(db, USERS_COLLECTION), newUserData);
    
    // Lấy lại document vừa tạo để trả về
    const newUserDoc = await getDoc(docRef);
    const newUser = {
      id: newUserDoc.id,
      ...newUserDoc.data()
    };
    
    console.log('User registered successfully:', newUser.id);
    return newUser;
    
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Kiểm tra username có tồn tại không
 * @param {string} username - Tên đăng nhập cần kiểm tra
 * @returns {Promise<boolean>} - true nếu đã tồn tại, false nếu chưa
 */
export const checkUsernameExists = async (username) => {
  try {
    const q = query(
      collection(db, USERS_COLLECTION), 
      where('username', '==', username)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking username:', error);
    return false;
  }
};

/**
 * Tạo user với ID cụ thể (dành cho admin)
 * @param {string} userId - ID của document
 * @param {Object} userData - Thông tin người dùng
 * @returns {Promise<Object>} - Thông tin người dùng đã tạo
 */
export const createUserWithId = async (userId, userData) => {
  try {
    console.log('Creating user with specific ID:', userId);
    
    // Kiểm tra user đã tồn tại chưa
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    if (userDoc.exists()) {
      throw new Error('User ID đã tồn tại');
    }
    
    // Tạo user data với timestamp
    const newUserData = {
      ...userData,
      createdAt: new Date().toISOString()
    };
    
    // Tạo document với ID cụ thể
    await setDoc(doc(db, USERS_COLLECTION, userId), newUserData);
    
    // Trả về user data với ID
    const result = {
      id: userId,
      ...newUserData
    };
    
    console.log('User created successfully:', result);
    return result;
    
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};
