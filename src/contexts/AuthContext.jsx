import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import { getUserFromStorage, saveUserToStorage, clearUserStorage, verifyToken, logout } from '../services/authService';
import { createSessionListener } from '../services/sessionService';
import { setupBrowserCleanup } from '../utils/browserCleanup';
import { createTabSessionListener, initTabSession, getTabSessionId } from '../services/tabSessionService';
import { setupTabPrevention } from '../utils/tabPrevention';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const sessionListenerRef = useRef(null);
  const tabSessionListenerRef = useRef(null);
  const browserCleanupRef = useRef(null);
  const tabPreventionRef = useRef(null);

  // Cleanup session listener và browser cleanup
  const cleanupSessionListener = () => {
    if (sessionListenerRef.current) {
      sessionListenerRef.current();
      sessionListenerRef.current = null;
    }
  };

  const cleanupTabSessionListener = () => {
    if (tabSessionListenerRef.current) {
      tabSessionListenerRef.current();
      tabSessionListenerRef.current = null;
    }
  };

  const cleanupBrowserListeners = () => {
    if (browserCleanupRef.current) {
      browserCleanupRef.current();
      browserCleanupRef.current = null;
    }
  };

  const cleanupTabPrevention = () => {
    if (tabPreventionRef.current) {
      tabPreventionRef.current();
      tabPreventionRef.current = null;
    }
  };

  // Handle forced logout when session is invalidated  
  const handleSessionInvalidated = (reason) => {
    alert('Tài khoản này đã được đăng nhập ở thiết bị khác. Bạn sẽ bị đăng xuất.');
    cleanupSessionListener();
    cleanupTabSessionListener();
    cleanupBrowserListeners();
    cleanupTabPrevention();
    setUser(null);
    clearUserStorage();
  };

  // Handle tab session change - but only for different users
  const handleTabSessionInvalidated = () => {
    // Không force logout ngay, chỉ log để debug
    // Tab session change có thể là do cùng user mở tab mới
  };

  // Handle multiple tabs detected - less aggressive
  const handleMultipleTabsDetected = () => {
    // Không force logout aggressive, chỉ thông báo
  };

  // Setup session monitoring for logged-in user
  const setupSessionMonitoring = useCallback((userData) => {
    if (userData.uid && userData.sessionId) {
      cleanupSessionListener(); // Clear any existing listener
      cleanupTabSessionListener(); // Clear any existing tab listener
      cleanupBrowserListeners(); // Clear any existing browser cleanup
      cleanupTabPrevention(); // Clear any existing tab prevention
      
      // Setup session listener (chỉ cho different device/user)
      sessionListenerRef.current = createSessionListener(
        userData.uid,
        userData.sessionId,
        handleSessionInvalidated
      );

      // Setup tab session listener (non-aggressive, chỉ monitoring)
      if (userData.tabSessionId) {
        tabSessionListenerRef.current = createTabSessionListener(
          userData.uid,
          userData.tabSessionId,
          handleTabSessionInvalidated
        );
      }

      // Setup browser cleanup
      browserCleanupRef.current = setupBrowserCleanup(
        userData.uid,
        userData.sessionId
      );

      // Tắt tab prevention để cho phép multiple tabs của cùng user
      // tabPreventionRef.current = setupTabPrevention(handleMultipleTabsDetected);
    }
  }, []);

  useEffect(() => {
    // Cleanup listeners when component unmounts
    return () => {
      cleanupSessionListener();
      cleanupTabSessionListener();
      cleanupBrowserListeners();
      cleanupTabPrevention();
    };
  }, []);

  useEffect(() => {
    // Khởi tạo tab session khi component mount
    const currentTabSessionId = initTabSession();
    
    // Kiểm tra đăng nhập khi app khởi động
    const initAuth = async () => {
      try {
        const savedUser = getUserFromStorage();
        
        if (savedUser) {
          // Đặt user ngay lập tức để tránh logout khi reload
          setUser(savedUser);
          
          // Chỉ xác thực token nếu có token
          if (savedUser.token) {
            try {
              // Với user đã login, không cần kiểm tra tabSessionId nghiêm ngặt
              // Chỉ cần verify token và session
              const verifiedUser = await verifyToken(
                savedUser.token, 
                savedUser.sessionId
                // Bỏ tabSessionId verification để cho phép multiple tabs của cùng user
              );
              
              if (verifiedUser) {
                // Cập nhật user với tab session ID hiện tại nhưng không force logout
                const updatedUser = {
                  ...verifiedUser,
                  tabSessionId: currentTabSessionId
                };
                setUser(updatedUser);
                saveUserToStorage(updatedUser);
                
                // Setup monitoring nhưng không aggressive với tab session
                setupSessionMonitoring(updatedUser);
              } else {
                // Token/session không hợp lệ - logout user
                setUser(null);
                clearUserStorage();
              }
            } catch {
              // Logout user nếu có lỗi xác thực
              setUser(null);
              clearUserStorage();
            }
          }
        }
      } catch {
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
      // Clear session và tab session từ database nếu user đang đăng nhập
      if (user && user.uid) {
        await logout(user.uid);
      }
      
      // Cleanup all listeners
      cleanupSessionListener();
      cleanupTabSessionListener();
      cleanupBrowserListeners();
      cleanupTabPrevention();
      
      setUser(null);
    } catch {
      // Vẫn logout locally ngay cả khi có lỗi
      cleanupSessionListener();
      cleanupTabSessionListener();
      cleanupBrowserListeners();
      cleanupTabPrevention();
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
