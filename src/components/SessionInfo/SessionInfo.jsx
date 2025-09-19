import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getSessionInfo } from '../../services/sessionService';

const SessionInfo = () => {
  const { user } = useAuth();
  const [sessionData, setSessionData] = useState(null);
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
      const info = await getSessionInfo(user.uid);
      setSessionData(info);
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

  if (!user) {
    return (
      <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', margin: '20px' }}>
        <h3>Session Info</h3>
        <p>Chưa đăng nhập</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', margin: '20px' }}>
      <h3>Session Management Info</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>User:</strong> {user.name} ({user.uid})
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>Current Session ID:</strong> {user.sessionId || 'Không có'}
      </div>

      {loading ? (
        <p>Đang tải thông tin session...</p>
      ) : sessionData ? (
        <div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Session Created:</strong> {formatDate(sessionData.sessionCreatedAt)}
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <strong>Last Activity:</strong> {formatDate(sessionData.lastActivity)}
          </div>
          
          {sessionData.deviceInfo && (
            <div style={{ marginBottom: '10px' }}>
              <strong>Device Info:</strong>
              <ul style={{ marginLeft: '20px' }}>
                <li>Browser: {sessionData.deviceInfo.browserName}</li>
                <li>Platform: {sessionData.deviceInfo.platform}</li>
                <li>Login Time: {formatDate(sessionData.deviceInfo.timestamp)}</li>
              </ul>
            </div>
          )}
        </div>
      ) : (
        <p>Không có thông tin session</p>
      )}

      <button 
        onClick={loadSessionInfo}
        style={{ 
          padding: '8px 16px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Refresh Session Info
      </button>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p><strong>Cách test Single Session Login:</strong></p>
        <ol>
          <li>Đăng nhập ở tab này</li>
          <li>Mở tab mới và truy cập cùng website</li>
          <li>Đăng nhập bằng cùng tài khoản ở tab mới</li>
          <li>Tab cũ sẽ tự động logout</li>
        </ol>
      </div>
    </div>
  );
};

export default SessionInfo;