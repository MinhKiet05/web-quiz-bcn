import { createUserWithId } from '../services/authService.js';

/**
 * Tạo user admin mẫu cho testing
 * MSSV: 23696901
 * Password: kiet051005k
 * Name: Minh Kiệt
 * Role: admin
 */
export const createSampleAdmin = async () => {
  try {
    const adminData = {
      name: "Minh Kiệt",
      matKhau: "kiet051005k", 
      roles: ["admin"]
    };
    
    const result = await createUserWithId("23696901", adminData);
    console.log('Sample admin created successfully:', result);
    return result;
  } catch (error) {
    console.error('Error creating sample admin:', error);
    throw error;
  }
};

/**
 * Tạo user editor mẫu cho testing
 * MSSV: 24729691  
 * Password: 123
 * Name: Tình Vy
 * Role: editor
 */
export const createSampleEditor = async () => {
  try {
    const editorData = {
      name: "Tình Vy",
      matKhau: "123",
      roles: ["editor"]
    };
    
    const result = await createUserWithId("24729691", editorData);
    console.log('Sample editor created successfully:', result);
    return result;
  } catch (error) {
    console.error('Error creating sample editor:', error);
    throw error;
  }
};

/**
 * Tạo user thường mẫu cho testing
 * MSSV: 12345678
 * Password: user123
 * Name: Người Dùng Test
 * Role: user
 */
export const createSampleUser = async () => {
  try {
    const userData = {
      name: "Người Dùng Test",
      matKhau: "user123",
      roles: ["user"]
    };
    
    const result = await createUserWithId("12345678", userData);
    console.log('Sample user created successfully:', result);
    return result;
  } catch (error) {
    console.error('Error creating sample user:', error);
    throw error;
  }
};
