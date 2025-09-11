import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createUserWithId } from '../../services/authService';
import './AuthDemo.css';

const AuthDemo = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleCreateTinhVy = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      await createUserWithId('24729691', {
        name: 'Tình Vy',
        username: '24729691',
        password: '123',
        role: 'editor'
      });
      setMessage('User Tình Vy (ID: 24729691) created successfully!');
    } catch (error) {
      setMessage(`Error creating user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-demo">
      <h3>Authentication Demo</h3>
      {user ? (
        <div>
          <div className="user-info">
            <h4>Logged in as:</h4>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Roles:</strong> {user.roles?.join(', ') || 'None'}</p>
            <p><strong>ID:</strong> {user.uid}</p>
          </div>
          
          {user.roles?.includes('admin') && (
            <div className="admin-tools">
              <h4>Admin Tools</h4>
              <button 
                onClick={handleCreateTinhVy} 
                disabled={loading}
                className="create-user-btn"
              >
                {loading ? 'Creating...' : 'Create Test User (Tình Vy)'}
              </button>
              {message && (
                <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
                  {message}
                </div>
              )}
            </div>
          )}
          
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>
      ) : (
        <div>
          <p>Not logged in</p>
        </div>
      )}
    </div>
  );
};

export default AuthDemo;
