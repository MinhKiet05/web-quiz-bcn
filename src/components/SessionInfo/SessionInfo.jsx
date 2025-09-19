import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getSessionInfo } from '../../services/sessionService';
import { getTabSessionInfo, getTabSessionId } from '../../services/tabSessionService';

const SessionInfo = () => {
  const { user } = useAuth();
  const [sessionData, setSessionData] = useState(null);
  const [tabSessionData, setTabSessionData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadSessionInfo();
    }
  }, [user]);

  const loadSessionInfo = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const [sessionInfo, tabSessionInfo] = await Promise.all([
        getSessionInfo(user.uid),
        getTabSessionInfo(user.uid)
      ]);
      
      setSessionData(sessionInfo);
      setTabSessionData(tabSessionInfo);
    } catch (error) {
      console.error('Error loading session info:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Không có';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const currentTabSessionId = getTabSessionId();

  if (!user) {
    return (
      <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', margin: '20px' }}>
        <h3>Tab Session Info</h3>
        <p>Chưa đăng nhập</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', margin: '20px' }}>
      <h3>Single Tab Session Management</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>User:</strong> {user.name} ({user.uid})
      </div>
      
      <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h4>Tab Session Info:</h4>
        <div><strong>Current Tab Session ID:</strong> {currentTabSessionId || 'Không có'}</div>
        <div><strong>User Tab Session ID:</strong> {user.tabSessionId || 'Không có'}</div>
        <div style={{ color: currentTabSessionId === user.tabSessionId ? 'green' : 'red' }}>
          <strong>Status:</strong> {currentTabSessionId === user.tabSessionId ? '✅ Tab này đang active' : '❌ Tab này bị vô hiệu'}
        </div>
      </div>

      <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#e8f4fd', borderRadius: '4px' }}>
        <h4>Session Info:</h4>
        <div><strong>Session ID:</strong> {user.sessionId || 'Không có'}</div>
      </div>

      {loading ? (
        <p>Đang tải thông tin session...</p>
      ) : (
        <div>
          {tabSessionData && (
            <div style={{ marginBottom: '15px' }}>
              <h4>Tab Session Details:</h4>
              <div style={{ marginLeft: '20px' }}>
                <div><strong>Tab Registered:</strong> {formatDate(tabSessionData.tabRegisteredAt)}</div>
                <div><strong>Last Activity:</strong> {formatDate(tabSessionData.lastActivity)}</div>
              </div>
            </div>
          )}

          {sessionData && sessionData.deviceInfo && (
            <div style={{ marginBottom: '15px' }}>
              <h4>Device Info:</h4>
              <div style={{ marginLeft: '20px' }}>
                <div><strong>Browser:</strong> {sessionData.deviceInfo.browserName}</div>
                <div><strong>Platform:</strong> {sessionData.deviceInfo.platform}</div>
                <div><strong>Login Time:</strong> {formatDate(sessionData.deviceInfo.timestamp)}</div>
              </div>
            </div>
          )}
        </div>
      )}

      <button 
        onClick={loadSessionInfo}
        style={{ 
          padding: '8px 16px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer',
          marginRight: '10px'
        }}
      >
        Refresh Session Info
      </button>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p><strong>Cách test Single Tab Session:</strong></p>
        <ol>
          <li>Đăng nhập ở tab này</li>
          <li>Mở tab mới trong cùng trình duyệt</li>
          <li>Truy cập cùng website ở tab mới</li>
          <li>Tab cũ sẽ hiển thị thông báo và tự động logout</li>
          <li>Chỉ tab cuối cùng được giữ đăng nhập</li>
        </ol>
        
        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
          <strong>Lưu ý:</strong> Tab session được lưu trong sessionStorage, khác nhau cho mỗi tab ngay cả trong cùng trình duyệt.
        </div>
      </div>
    </div>
  );
};

export default SessionInfo;