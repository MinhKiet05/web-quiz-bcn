import React, { useState, useEffect } from 'react';
import { getTabSessionId } from '../../services/tabSessionService';

const TabWarning = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [tabSessionId, setTabSessionId] = useState(null);

  useEffect(() => {
    // Lắng nghe sự kiện focus để kiểm tra tab session
    const handleFocus = () => {
      const currentTabSessionId = getTabSessionId();
      
      if (!currentTabSessionId) {
        // Tab mới không có session ID - có thể cần redirect đến login
        console.warn('Tab không có session ID');
        return;
      }
      
      // Cập nhật tab session ID hiện tại
      setTabSessionId(currentTabSessionId);
    };

    // Kiểm tra ngay khi component mount
    handleFocus();

    // Lắng nghe focus event
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Component để hiển thị cảnh báo tab không hợp lệ
  const renderTabInvalidWarning = () => {
    if (!showWarning) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          textAlign: 'center',
          maxWidth: '400px',
          margin: '20px'
        }}>
          <h2 style={{ color: '#dc3545', marginBottom: '20px' }}>
            ⚠️ Tab Không Hợp Lệ
          </h2>
          <p style={{ marginBottom: '20px', lineHeight: '1.5' }}>
            Đã có tab khác đang hoạt động. Chỉ cho phép một tab duy nhất đăng nhập cùng lúc.
          </p>
          <p style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
            Bạn sẽ được chuyển hướng đến trang đăng nhập.
          </p>
          <button
            onClick={() => {
              window.location.reload();
            }}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Làm mới trang
          </button>
        </div>
      </div>
    );
  };

  // Show tab session ID cho debugging
  if (process.env.NODE_ENV === 'development') {
    return (
      <div>
        <div style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          padding: '8px',
          fontSize: '12px',
          zIndex: 1000,
          maxWidth: '300px'
        }}>
          <strong>Debug - Tab Session:</strong><br />
          {tabSessionId ? tabSessionId.substring(0, 20) + '...' : 'Không có'}
        </div>
        {renderTabInvalidWarning()}
      </div>
    );
  }

  return renderTabInvalidWarning();
};

export default TabWarning;