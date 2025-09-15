import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleUser, faBars, faTimes, faSignInAlt, faSignOutAlt, faCrown, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import './Header.css';
import logo from '../../../public/logo.png';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Login from '../Login/Login';

const navLinks = [
  { name: 'Quiz tuần', path: '/' },
  { name: 'Quiz đã làm', path: '/my-quizzes' },
  { name: 'Bảng xếp hạng', path: '/leaderboard' },
  { name: 'Thể lệ', path: '/rules' },
  { 
    name: 'Quản lý', 
    path: '#',
    hasDropdown: true,
    dropdownItems: [
      { name: 'Thêm quiz', path: '/upload' },
      { name: 'Các quiz', path: '/quizzes' },
      { name: 'Users', path: '/user-management' }
    ]
  }
];

const Header = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [hoverDropdown, setHoverDropdown] = useState(null);
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleNavLinkClick = () => {
    setSidebarOpen(false);
    setActiveDropdown(null);
    setHoverDropdown(null);
  };

  const handleLogout = () => {
    logout();
    setSidebarOpen(false);
    setActiveDropdown(null);
    setHoverDropdown(null);
  };

  const toggleDropdown = (linkName) => {
    setActiveDropdown(activeDropdown === linkName ? null : linkName);
  };

  const handleMouseEnter = (linkName) => {
    setHoverDropdown(linkName);
  };

  const handleMouseLeave = () => {
    setHoverDropdown(null);
  };

  // Determine if dropdown should be shown (either clicked or hovered)
  const isDropdownOpen = (linkName) => {
    return activeDropdown === linkName || hoverDropdown === linkName;
  };

  // Check if user has access to a specific dropdown item
  const hasAccessToDropdownItem = (item) => {
    if (!user) return false;
    
    if (item.path === '/user-management') {
      // Only admin and super_admin can access Users
      return user.roles?.includes('admin') || user.roles?.includes('super_admin');
    }
    
    if (item.path === '/upload' || item.path === '/quizzes') {
      // Editor, admin, and super_admin can access these
      return user.roles?.includes('editor') || user.roles?.includes('admin') || user.roles?.includes('super_admin');
    }
    
    return true;
  };

  // Filter dropdown items based on user roles
  const getFilteredDropdownItems = (dropdownItems) => {
    if (!user) return [];
    return dropdownItems.filter(item => hasAccessToDropdownItem(item));
  };

  // Filter nav links based on user authentication and roles
  const getFilteredNavLinks = () => {
    if (!user) {
      // Show only basic navigation for non-logged users
      return navLinks.filter(link => !link.hasDropdown);
    }

    return navLinks.filter(link => {
      // For dropdown links, check if user has access to at least one dropdown item
      if (link.hasDropdown) {
        if (user.roles?.includes('user') && !user.roles?.includes('editor') && !user.roles?.includes('admin') && !user.roles?.includes('super_admin')) {
          // Pure user role cannot see "Quản lý" at all
          return false;
        }
        // For other roles, check if they have access to at least one dropdown item
        return getFilteredDropdownItems(link.dropdownItems).length > 0;
      }
      
      // For regular links, show all
      return true;
    });
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
          {getFilteredNavLinks().map(link => {
            if (link.hasDropdown) {
              return (
                <div key={link.name} className="sidebar-dropdown">
                  <button 
                    className="sidebar-dropdown-toggle"
                    onClick={() => toggleDropdown(link.name)}
                  >
                    {link.name}
                    <FontAwesomeIcon 
                      icon={faChevronDown} 
                      className={`dropdown-icon ${activeDropdown === link.name ? 'open' : ''}`}
                    />
                  </button>
                  {activeDropdown === link.name && (
                    <div className="sidebar-dropdown-menu">
                      {getFilteredDropdownItems(link.dropdownItems).map(item => (
                        <Link
                          key={item.name}
                          to={item.path}
                          onClick={handleNavLinkClick}
                          className={`sidebar-dropdown-link ${
                            location.pathname === item.path ? 'active' : ''
                          }`}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            
            return (
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
            );
          })}
          
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
        <div>
          <nav className="header-nav">
          {getFilteredNavLinks().map(link => {
            if (link.hasDropdown) {
              return (
                <div 
                  key={link.name} 
                  className="header-dropdown"
                  onMouseEnter={() => handleMouseEnter(link.name)}
                  onMouseLeave={handleMouseLeave}
                >
                  <button 
                    className="header-dropdown-toggle"
                    onClick={() => toggleDropdown(link.name)}
                  >
                    {link.name}
                    <FontAwesomeIcon 
                      icon={faChevronDown} 
                      className={`dropdown-icon ${isDropdownOpen(link.name) ? 'open' : ''}`}
                    />
                  </button>
                  {isDropdownOpen(link.name) && (
                    <div className="header-dropdown-menu">
                      {getFilteredDropdownItems(link.dropdownItems).map(item => (
                        <Link
                          key={item.name}
                          to={item.path}
                          onClick={() => {
                            setActiveDropdown(null);
                            setHoverDropdown(null);
                          }}
                          className={`header-dropdown-link ${
                            location.pathname === item.path ? 'active' : ''
                          }`}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            
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
        </div>
        

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
