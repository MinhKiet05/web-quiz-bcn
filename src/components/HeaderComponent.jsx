import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleUser, faBars, faTimes, faSignInAlt, faSignOutAlt, faCrown } from '@fortawesome/free-solid-svg-icons';
import './Header/Header.css';
import logo from '../assets/logo.png';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Login from './Login/Login';

const navLinks = [
  { name: 'Trang chủ', path: '/' },
  { name: 'Lịch quiz', path: '/dashboard' },
  { name: 'Quiz đã làm', path: '/my-quizzes' },
  { name: 'Các quiz', path: '/quizzes' },
  { name: '📤Upload', path: '/upload' },
  { name: '👥Users', path: '/user-management', adminOnly: true },
];

const Header = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleNavLinkClick = () => setSidebarOpen(false);

  const handleLogout = () => {
    logout();
    setSidebarOpen(false);
  };

  // Filter nav links based on user authentication and roles
  const getFilteredNavLinks = () => {
    let filteredLinks = navLinks;
    
    // Only show upload and quizzes links for admin and editor users
    if (!user || (!user.roles?.includes('admin') && !user.roles?.includes('editor') && !user.roles?.includes('super admin'))) {
      filteredLinks = filteredLinks.filter(link => 
        link.path !== '/upload' && link.path !== '/quizzes'
      );
    }
    
    // Only show admin-only links for admin users
    if (!user || (!user.roles?.includes('admin') && !user.roles?.includes('super admin'))) {
      filteredLinks = filteredLinks.filter(link => !link.adminOnly);
    }
    
    return filteredLinks;
  };

  return (
    <>
      {/* Overlay khi mở sidebar */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar mobile */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-title">Menu</span>
          <button
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {getFilteredNavLinks().map(link => (
            <Link
              key={link.name}
              to={link.path}
              onClick={handleNavLinkClick}
              className={`sidebar-link ${
                location.pathname === link.path ? 'active' : ''
              }`}
            >
              {link.name}
            </Link>
          ))}
          
          {/* User section in sidebar */}
          {user && (
            <div className="sidebar-user-section">
              <div className="sidebar-user-info">
                <FontAwesomeIcon icon={faCircleUser} className="user-avatar" />
                <div className="user-details">
                  <span className="user-name">{user.name}</span>
                  <span className="user-role">
                    {user.roles?.includes('super admin') && <><FontAwesomeIcon icon={faCrown} /> Super Admin</>}
                    {user.roles?.includes('admin') && !user.roles?.includes('super admin') && <><FontAwesomeIcon icon={faCrown} /> Admin</>}
                    {user.roles?.includes('editor') && !user.roles?.includes('admin') && !user.roles?.includes('super admin') && '✏️ Editor'}
                    {!user.roles?.includes('admin') && !user.roles?.includes('editor') && !user.roles?.includes('super admin') && '🎓 User'}
                  </span>
                </div>
              </div>
              <button className="sidebar-logout-btn" onClick={handleLogout}>
                <FontAwesomeIcon icon={faSignOutAlt} />
                Đăng xuất
              </button>
            </div>
          )}
          
          {!user && (
            <button 
              className="sidebar-login-btn" 
              onClick={() => { setShowLogin(true); setSidebarOpen(false); }}
            >
              <FontAwesomeIcon icon={faSignInAlt} />
              Đăng nhập
            </button>
          )}
        </nav>
      </div>

      {/* Header cố định */}
      <header className={`header-container ${
        user && (user.roles?.includes('admin') || user.roles?.includes('editor') || user.roles?.includes('super admin')) 
          ? 'admin-header' 
          : 'user-header'
      }`}>
        {/* Logo */}
        <div className="header-logo">
          <img src={logo} alt="Logo" />
        </div>

        {/* Nav desktop */}
        <nav className="header-nav">
          {getFilteredNavLinks().map(link => {
            // Xác định layout class dựa trên user role
            const isAdminOrEditor = user && (user.roles?.includes('admin') || user.roles?.includes('editor') || user.roles?.includes('super admin'));
            const layoutClass = isAdminOrEditor ? 'admin-layout' : 'user-layout';
            
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`header-link ${layoutClass} ${
                  location.pathname === link.path ? 'active' : ''
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="header-actions">
          {user ? (
            <div className="user-menu">
              <div className="user-info">
                <FontAwesomeIcon icon={faCircleUser} className="user-icon" />
                <span className="user-name">{user.name}</span>
                {user.roles?.includes('super admin') && <FontAwesomeIcon icon={faCrown} className="super-admin-badge" />}
                {user.roles?.includes('admin') && !user.roles?.includes('super admin') && <FontAwesomeIcon icon={faCrown} className="admin-badge" />}
                {user.roles?.includes('editor') && !user.roles?.includes('admin') && !user.roles?.includes('super admin') && <span className="editor-badge">✏️</span>}
              </div>
              <button className="logout-btn" onClick={handleLogout}>
                <FontAwesomeIcon icon={faSignOutAlt} />
              </button>
            </div>
          ) : (
            <button className="login-btn" onClick={() => setShowLogin(true)}>
              <FontAwesomeIcon icon={faSignInAlt} />
              <span className="login-text">Đăng nhập</span>
            </button>
          )}
          <button
            className="header-menu-btn"
            onClick={() => setSidebarOpen(true)}
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
        </div>
      </header>
      
      {/* Login Modal */}
      {showLogin && (
        <Login onClose={() => setShowLogin(false)} />
      )}
    </>
  );
};

export default Header;
