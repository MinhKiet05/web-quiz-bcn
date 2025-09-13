import { db } from '../config/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, getDoc, query, orderBy } from 'firebase/firestore';

// Get all users from Firestore
export const getAllUsers = async () => {
  try {
    const usersCollection = collection(db, 'users');
    const usersQuery = query(usersCollection, orderBy('name', 'asc'));
    const snapshot = await getDocs(usersQuery);
    
    const users = [];
    snapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        mssv: doc.id, // Document ID is MSSV
        ...doc.data()
      });
    });
    
    return users;
  } catch (error) {
    throw new Error(error.message || 'Không thể tải danh sách người dùng');
  }
};

// Update user information
export const updateUser = async (mssv, updateData) => {
  try {
    const userDocRef = doc(db, 'users', mssv);
    
    // Remove undefined fields
    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([, value]) => value !== undefined && value !== '')
    );
    
    await updateDoc(userDocRef, {
      ...cleanData,
      lastUpdated: new Date()
    });
    
    return true;
  } catch (error) {
    throw new Error(error.message || 'Không thể cập nhật thông tin người dùng');
  }
};

// Delete user
export const deleteUser = async (mssv) => {
  try {
    const userDocRef = doc(db, 'users', mssv);
    await deleteDoc(userDocRef);
    
    return true;
  } catch (error) {
    throw new Error(error.message || 'Không thể xóa người dùng');
  }
};

// Get user by MSSV
export const getUserByMssv = async (mssv) => {
  try {
    const userDocRef = doc(db, 'users', mssv);
    const snapshot = await getDoc(userDocRef);
    
    if (snapshot.exists()) {
      return {
        id: snapshot.id,
        mssv: snapshot.id,
        ...snapshot.data()
      };
    }
    
    return null;
  } catch (error) {
    throw new Error(error.message || 'Không thể tải thông tin người dùng');
  }
};

// Update user role
export const updateUserRole = async (mssv, newRoles) => {
  try {
    const userDocRef = doc(db, 'users', mssv);
    await updateDoc(userDocRef, {
      roles: newRoles,
      lastUpdated: new Date()
    });
    
    return true;
  } catch (error) {
    throw new Error(error.message || 'Không thể cập nhật quyền người dùng');
  }
};

// Change user password
export const changeUserPassword = async (mssv, newPassword) => {
  try {
    const userDocRef = doc(db, 'users', mssv);
    await updateDoc(userDocRef, {
      matKhau: newPassword,
      lastUpdated: new Date()
    });
    
    return true;
  } catch (error) {
    throw new Error(error.message || 'Không thể thay đổi mật khẩu');
  }
};
