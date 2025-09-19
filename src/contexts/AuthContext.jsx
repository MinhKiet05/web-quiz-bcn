import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import { getUserFromStorage, saveUserToStorage, clearUserStorage, verifyToken, logout } from '../services/authService';
import { createSessionListener } from '../services/sessionService';
import { setupBrowserCleanup } from '../utils/browserCleanup';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const sessionListenerRef = useRef(null);
  const browserCleanupRef = useRef(null);

  // Cleanup session listener và browser cleanup
  const cleanupSessionListener = () => {
    if (sessionListenerRef.current) {
      sessionListenerRef.current();
      sessionListenerRef.current = null;
    }
  };

  const cleanupBrowserListeners = () => {
    if (browserCleanupRef.current) {
      browserCleanupRef.current();
      browserCleanupRef.current = null;
    }
  };

  // Handle forced logout when session is invalidated
  const handleSessionInvalidated = (reason) => {
    console.warn('Session invalidated:', reason);
    cleanupSessionListener();
    cleanupBrowserListeners();
    setUser(null);
    clearUserStorage();
  };

  // Setup session monitoring for logged-in user
  const setupSessionMonitoring = useCallback((userData) => {
    if (userData.uid && userData.sessionId) {
      cleanupSessionListener(); // Clear any existing listener
      cleanupBrowserListeners(); // Clear any existing browser cleanup
      
      // Setup session listener
      sessionListenerRef.current = createSessionListener(
        userData.uid,
        userData.sessionId,
        handleSessionInvalidated
      );

      // Setup browser cleanup
      browserCleanupRef.current = setupBrowserCleanup(
        userData.uid,
        userData.sessionId
      );
    }
  }, []);

  useEffect(() => {
    // Cleanup listeners when component unmounts
    return () => {
      cleanupSessionListener();
      cleanupBrowserListeners();
    };
  }, []);

  useEffect(() => {
    // Kiểm tra đăng nhập khi app khởi động
    const initAuth = async () => {
      try {
        const savedUser = getUserFromStorage();
        
        if (savedUser) {
          // Đặt user ngay lập tức để tránh logout khi reload
          setUser(savedUser);
          
          // Chỉ xác thực token nếu có token, nhưng không logout nếu fail
          if (savedUser.token) {
            try {
              const verifiedUser = await verifyToken(savedUser.token, savedUser.sessionId);
              if (verifiedUser) {
                setUser(verifiedUser);
                saveUserToStorage(verifiedUser);
                setupSessionMonitoring(verifiedUser);
              } else {
                // Session không hợp lệ - logout user
                console.warn('Session invalid - logging out user');
                setUser(null);
                clearUserStorage();
              }
            } catch (tokenError) {
              console.warn('Token verification error:', tokenError);
              // Logout user nếu có lỗi xác thực
              setUser(null);
              clearUserStorage();
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
        clearUserStorage();
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, [setupSessionMonitoring]);

  const login = (userData) => {
    setUser(userData);
    saveUserToStorage(userData);
    setupSessionMonitoring(userData);
  };

  const logoutUser = async () => {
    try {
      // Clear session từ database nếu user đang đăng nhập
      if (user && user.uid) {
        await logout(user.uid);
      }
      
      // Cleanup all listeners
      cleanupSessionListener();
      cleanupBrowserListeners();
      
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Vẫn logout locally ngay cả khi có lỗi
      cleanupSessionListener();
      cleanupBrowserListeners();
      setUser(null);
      clearUserStorage();
    }
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
