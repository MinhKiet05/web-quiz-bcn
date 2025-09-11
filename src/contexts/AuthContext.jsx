import React, { createContext, useState, useEffect, useContext } from 'react';
import { getUserFromStorage, saveUserToStorage, clearUserStorage, verifyToken } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra đăng nhập khi app khởi động
    const initAuth = async () => {
      try {
        console.log('Initializing authentication...');
        const savedUser = getUserFromStorage();
        
        if (savedUser) {
          console.log('Found saved user:', savedUser.username || savedUser.uid);
          
          // Đặt user ngay lập tức để tránh logout khi reload
          setUser(savedUser);
          
          // Chỉ xác thực token nếu có token, nhưng không logout nếu fail
          if (savedUser.token) {
            console.log('Verifying token in background...');
            try {
              const verifiedUser = await verifyToken(savedUser.token);
              if (verifiedUser) {
                console.log('Token verified successfully');
                setUser(verifiedUser);
                saveUserToStorage(verifiedUser);
              } else {
                console.log('Token verification failed, but keeping user logged in locally');
                // Không xóa user, chỉ log warning
                console.warn('Working in offline mode - token verification failed');
              }
            } catch (tokenError) {
              console.warn('Token verification error, keeping user logged in locally:', tokenError);
              // Giữ user đăng nhập local, có thể server offline
            }
          }
        } else {
          console.log('No saved user found');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Không clear storage trong trường hợp lỗi, có thể là lỗi mạng
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);

  const login = (userData) => {
    console.log('Logging in user:', userData.username || userData.uid);
    setUser(userData);
    saveUserToStorage(userData);
  };

  const logoutUser = () => {
    console.log('Logging out user');
    setUser(null);
    clearUserStorage();
  };

  const hasRole = (role) => {
    return user && user.roles && user.roles.includes(role);
  };

  const isAdmin = () => {
    return hasRole('admin') || hasRole('super admin');
  };

  const value = {
    user,
    login,
    logout: logoutUser,
    hasRole,
    isAdmin,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

// Hook để sử dụng AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
