import React, { useState } from 'react';
import { createTinhVyUser } from '../../utils/createTestUser.js';

const CreateUserButton = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleCreateUser = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    
    try {
      const result = await createTinhVyUser();
      setMessage(`✅ Đã tạo thành công user: ${result.name} (ID: ${result.id})`);
    } catch (err) {
      setError(`❌ Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      margin: '20px auto', 
      maxWidth: '500px',
      padding: '20px',
      background: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #dee2e6'
    }}>
      <h3>🔧 Admin Tools</h3>
      <p>Tạo user test với thông tin:</p>
      <ul style={{ textAlign: 'left', margin: '10px 0' }}>
        <li><strong>ID:</strong> 24729691</li>
        <li><strong>Name:</strong> Tình Vy</li>
        <li><strong>Password:</strong> 123</li>
        <li><strong>Role:</strong> editor</li>
      </ul>
      
      <button
        onClick={handleCreateUser}
        disabled={loading}
        style={{
          background: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '10px'
        }}
      >
        {loading ? '⏳ Đang tạo...' : '👤 Tạo User Tình Vy'}
      </button>
      
      {message && (
        <div style={{ 
          color: '#28a745', 
          background: '#d4edda',
          padding: '10px',
          borderRadius: '4px',
          marginTop: '10px'
        }}>
          {message}
        </div>
      )}
      
      {error && (
        <div style={{ 
          color: '#dc3545', 
          background: '#f8d7da',
          padding: '10px',
          borderRadius: '4px',
          marginTop: '10px'
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default CreateUserButton;
