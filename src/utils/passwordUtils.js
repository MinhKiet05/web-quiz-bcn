import CryptoJS from 'crypto-js';

/**
 * Hash password sử dụng SHA-256
 * @param {string} password - Mật khẩu gốc
 * @returns {string} - Password đã hash
 */
export const hashPassword = (password) => {
  // Sử dụng SHA-256 để hash password
  const hashed = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
  return hashed;
};

/**
 * Verify password với hash đã lưu
 * @param {string} inputPassword - Password người dùng nhập
 * @param {string} storedHash - Hash đã lưu trong database
 * @returns {boolean} - True nếu password đúng
 */
export const verifyPassword = (inputPassword, storedHash) => {
  const inputHash = hashPassword(inputPassword);
  return inputHash === storedHash;
};

/**
 * Check if password is already hashed (basic check)
 * @param {string} password - Password để kiểm tra
 * @returns {boolean} - True nếu đã hash
 */
export const isPasswordHashed = (password) => {
  // SHA-256 hash có độ dài 64 ký tự hex
  return /^[a-f0-9]{64}$/i.test(password);
};

/**
 * Generate hash cho existing users (migration utility)
 * @param {Array} users - Danh sách users với plaintext passwords
 * @returns {Array} - Users với hashed passwords
 */
export const generateHashesForExistingUsers = (users) => {
  const updatedUsers = users.map(user => {
    if (!isPasswordHashed(user.matKhau)) {
      const hashedPassword = hashPassword(user.matKhau);
      return {
        ...user,
        matKhau: hashedPassword
      };
    }
    return user;
  });
  
  return updatedUsers;
};

export default {
  hashPassword,
  verifyPassword,
  isPasswordHashed,
  generateHashesForExistingUsers
};