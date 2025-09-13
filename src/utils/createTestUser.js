import { createUserWithId } from '../services/authService.js';

/**
 * Tạo user test với thông tin cụ thể
 */
export const createTinhVyUser = async () => {
  try {
    const userId = '24729691';
    const userData = {
      matKhau: '123',
      name: 'Tình Vy',
      roles: ['editor']
    };
    
    const result = await createUserWithId(userId, userData);
    return result;
  } catch (error) {
    console.error('Failed to create user:', error);
    throw error;
  }
};

// Helper function để tạo user từ console hoặc component
window.createTinhVyUser = createTinhVyUser;
