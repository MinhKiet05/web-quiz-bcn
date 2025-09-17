import React, { useState, useEffect } from 'react';
import { getAllUsers, updateUser, deleteUser } from '../../services/userService.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { showToast } from '../../utils/toastUtils.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import './UserManagement.css';

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Load all users
  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.mssv.includes(searchTerm)
      );
      setFilteredUsers(filtered);
    }
  }, [users, searchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await getAllUsers();
      
      // Sort users by role priority: super admin > admin > editor > user
      const sortedUsers = usersData.sort((a, b) => {
        const getRolePriority = (roles) => {
          if (roles?.includes('super admin')) return 4;
          if (roles?.includes('admin')) return 3;
          if (roles?.includes('editor')) return 2;
          return 1;
        };
        
        return getRolePriority(b.roles) - getRolePriority(a.roles);
      });
      
      setUsers(sortedUsers);
    } catch (err) {
      console.error('Error loading users:', err);
      showToast('Không thể tải danh sách người dùng', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (userData) => {
    // Check if current user can edit this user
    if (!canEditUser(userData)) {
      showToast('Bạn không có quyền chỉnh sửa thông tin người dùng này', 'error');
      return;
    }

    setEditingUser({
      ...userData,
      newPassword: '' // Field for changing password
    });
    setShowEditModal(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      setLoading(true);
      
      // Validate MSSV format
      if (!/^\d{8}$/.test(editingUser.mssv)) {
        showToast('MSSV phải là đúng 8 số', 'error');
        return;
      }

      // Check if MSSV is duplicated (except for current user)
      const existingUser = users.find(u => u.mssv === editingUser.mssv && u.id !== editingUser.id);
      if (existingUser) {
        showToast('MSSV đã tồn tại trong hệ thống', 'error');
        return;
      }

      // Prepare update data
      const updateData = {
        name: editingUser.name.trim(),
        roles: editingUser.roles,
        ...(editingUser.newPassword && { matKhau: editingUser.newPassword })
      };

      await updateUser(editingUser.mssv, updateData);
      
      showToast('Cập nhật thông tin người dùng thành công!', 'success');
      setShowEditModal(false);
      setEditingUser(null);
      await loadUsers(); // Reload users list
    } catch (err) {
      console.error('Error updating user:', err);
      showToast('Không thể cập nhật thông tin người dùng', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userMssv) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      return;
    }

    try {
      setLoading(true);
      await deleteUser(userMssv);
      showToast('Xóa người dùng thành công!', 'success');
      await loadUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      showToast('Không thể xóa người dùng', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplay = (roles) => {
    if (!roles || roles.length === 0) return 'User';
    
    if (roles.includes('super admin')) return 'Super Admin';
    if (roles.includes('admin')) return 'Admin';
    if (roles.includes('editor')) return 'Editor';
    return 'User';
  };

  const getRoleBadgeClass = (roles) => {
    if (!roles || roles.length === 0) return 'role-user';
    
    if (roles.includes('super admin')) return 'role-super-admin';
    if (roles.includes('admin')) return 'role-admin';
    if (roles.includes('editor')) return 'role-editor';
    return 'role-user';
  };

  // Helper function to check if current user can edit target user
  const canEditUser = (targetUser) => {
    if (!user) return false;
    
    // Cannot edit yourself
    if (targetUser.mssv === user.mssv) return false;
    
    // Helper function to get role level
    const getRoleLevel = (roles) => {
      if (roles?.includes('super admin')) return 4;
      if (roles?.includes('admin')) return 3;
      if (roles?.includes('editor')) return 2;
      return 1; // user
    };
    
    const currentUserLevel = getRoleLevel(user.roles);
    const targetUserLevel = getRoleLevel(targetUser.roles);
    
    // Can only edit users with lower role level
    return currentUserLevel > targetUserLevel;
  };

  // Helper function to get available roles for current user to assign
  const getAvailableRoles = () => {
    // Helper function to get role level
    const getRoleLevel = (roles) => {
      if (roles?.includes('super admin')) return 4;
      if (roles?.includes('admin')) return 3;
      if (roles?.includes('editor')) return 2;
      return 1; // user
    };
    
    const currentUserLevel = getRoleLevel(user?.roles);
    const allRoles = ['user', 'editor', 'admin', 'super admin'];
    
    // Can only assign roles with level strictly less than current user's level
    return allRoles.filter((_, index) => (index + 1) < currentUserLevel);
  };

  if (loading && users.length === 0) {
    return (
      <div className="user-management-loading">
        <div className="loading-spinner"><FontAwesomeIcon icon={faSpinner} spin /></div>
        <p>Đang tải danh sách người dùng...</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h1 style={{ fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif', fontSize: '2.2em' }}>Quản lý người dùng</h1>
        <p style={{ fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif', fontSize: '1.1em' }}>Quản lý thông tin và quyền hạn của tất cả người dùng trong hệ thống</p>
      </div>

      {/* Search bar */}
      <div className="search-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc MSSV..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        <div className="search-results">
          Tìm thấy {filteredUsers.length} người dùng
        </div>
      </div>

      {/* Users table */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>MSSV</th>
              <th>Tên hiển thị</th>
              <th>Mật khẩu</th>
              <th className="center">Vai trò</th>
              <th className="center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((userData) => (
              <tr key={userData.id} className={userData.mssv === user?.mssv ? 'current-user' : ''}>
                <td className="mssv-cell">{userData.mssv}</td>
                <td className="name-cell">{userData.name}</td>
                <td className="password-cell">
                  <span className="password-hidden">•••••••••</span>
                </td>
                <td className="role-cell">
                  <span className={`role-badge ${getRoleBadgeClass(userData.roles)}`}>
                    {getRoleDisplay(userData.roles)}
                  </span>
                </td>
                <td className="actions-cell">
                  {canEditUser(userData) && (
                    <>
                      <button
                        onClick={() => handleEditUser(userData)}
                        className="btn btn-edit"
                        disabled={loading}
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteUser(userData.mssv)}
                        className="btn btn-delete"
                        disabled={loading}
                      >
                        Xóa
                      </button>
                    </>
                  )}
                  {!canEditUser(userData) && (
                    <span className="no-permission">Không có quyền</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="no-users">
            <p>Không tìm thấy người dùng nào</p>
          </div>
        )}
      </div>

      {/* Mobile card layout */}
      <div className="users-mobile-container">
        {filteredUsers.map((userData) => (
          <div key={userData.id} className={`user-card ${userData.mssv === user?.mssv ? 'current-user' : ''}`}>
            <div className="user-card-header">
              <div>
                <div className="user-card-name">{userData.name}</div>
                <div className="user-card-mssv">MSSV: {userData.mssv}</div>
              </div>
              <div className="user-card-field">
                <div className="user-card-value">Vai trò: <span className={`role-badge ${getRoleBadgeClass(userData.roles)}`}>
                {getRoleDisplay(userData.roles)}
              </span></div>
              </div>
            </div>
            
            <div className="user-card-info">
              <div className="user-card-field">
                <div className="user-card-label">Mật khẩu</div>
                <div className="user-card-value password-hidden">•••••••••</div>
              </div>
              
            </div>
            
            <div className="user-card-actions">
              {canEditUser(userData) && (
                <>
                  <button
                    onClick={() => handleEditUser(userData)}
                    className="btn btn-edit"
                    disabled={loading}
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDeleteUser(userData.mssv)}
                    className="btn btn-delete"
                    disabled={loading}
                  >
                    Xóa
                  </button>
                </>
              )}
              {!canEditUser(userData) && (
                <div className="no-permission">Không có quyền</div>
              )}
            </div>
          </div>
        ))}
        
        {filteredUsers.length === 0 && (
          <div className="no-users">
            <p>📭 Không tìm thấy người dùng nào</p>
          </div>
        )}
      </div>

      {/* Edit user modal */}
      {showEditModal && editingUser && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Chỉnh sửa thông tin người dùng</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>MSSV:</label>
                <input
                  type="text"
                  value={editingUser.mssv}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    mssv: e.target.value.replace(/\D/g, '').slice(0, 8)
                  })}
                  placeholder="Nhập đúng 8 số"
                  maxLength="8"
                  pattern="[0-9]{8}"
                />
              </div>

              <div className="form-group">
                <label>Tên hiển thị:</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    name: e.target.value
                  })}
                  placeholder="Nhập tên hiển thị"
                />
              </div>

              <div className="form-group">
                <label>Mật khẩu mới (để trống nếu không đổi):</label>
                <input
                  type="password"
                  value={editingUser.newPassword || ''}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    newPassword: e.target.value
                  })}
                  placeholder="Nhập mật khẩu mới"
                />
              </div>

              <div className="form-group">
                <label>Vai trò:</label>
                {editingUser.mssv === user?.mssv ? (
                  <input
                    type="text"
                    value={getRoleDisplay(editingUser.roles)}
                    disabled
                    style={{ 
                      background: '#f5f5f5', 
                      color: '#666',
                      cursor: 'not-allowed'
                    }}
                  />
                ) : (
                  <select
                    value={getRoleDisplay(editingUser.roles).toLowerCase().replace(' ', '-')}
                    onChange={(e) => {
                      let newRoles = [];
                      switch (e.target.value) {
                        case 'super-admin':
                          newRoles = ['super admin', 'admin', 'editor', 'user'];
                          break;
                        case 'admin':
                          newRoles = ['admin', 'editor', 'user'];
                          break;
                        case 'editor':
                          newRoles = ['editor', 'user'];
                          break;
                        default:
                          newRoles = ['user'];
                      }
                      setEditingUser({
                        ...editingUser,
                        roles: newRoles
                      });
                    }}
                  >
                    {getAvailableRoles().map(role => {
                      const roleValue = role.replace(' ', '-');
                      const roleLabel = role.split(' ').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ');
                      return (
                        <option key={roleValue} value={roleValue}>
                          {roleLabel}
                        </option>
                      );
                    })}
                  </select>
                )}
                {editingUser.mssv === user?.mssv && (
                  <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                    Bạn không thể thay đổi vai trò của chính mình
                  </small>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={handleSaveUser}
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="btn btn-secondary"
                disabled={loading}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
