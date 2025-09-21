import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleUser, faBars, faTimes, faSignInAlt, faSignOutAlt, faCrown, faChevronDown, faBell } from '@fortawesome/free-solid-svg-icons';
import './Header.css';
import logo from '../../assets/logo.webp';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Login from '../Login/Login';
import { getAllWeeks } from '../../services/weekQuizService';

const navLinks = [
  { name: 'Quiz tuần', path: '/' },
  { name: 'Lịch sử Quiz', path: '/my-quizzes' },
  { name: 'Bảng xếp hạng', path: '/leaderboard' },
  { name: 'Thể lệ', path: '/rules' },
  { 
    name: 'Quản lý', 
    path: '#',
    hasDropdown: true,
    dropdownItems: [
      { name: 'Thêm quiz', path: '/upload' },
      { name: 'Các quiz', path: '/quizzes' },
      { name: 'Users', path: '/user-management' },
      { name: 'Quiz Records', path: '/users-quiz-by-week' }
    ]
  }
];

const Header = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [hoverDropdown, setHoverDropdown] = useState(null);
  const [hasNewResults, setHasNewResults] = useState(false);
  const [availableWeek, setAvailableWeek] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Header scroll visibility control
  useEffect(() => {
    const controlHeaderVisibility = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down & past threshold - hide header
        setIsVisible(false);
      } else {
        // Scrolling up or at top - show header
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', controlHeaderVisibility);
    
    return () => {
      window.removeEventListener('scroll', controlHeaderVisibility);
    };
  }, [lastScrollY]);

  // Check for available quiz results and create notifications for regular users
  useEffect(() => {
    const checkForNotifications = async () => {
      // Only check for regular users (not editors/admins)
      if (!user || user.roles?.includes('editor') || user.roles?.includes('admin') || user.roles?.includes('super_admin')) {
        return;
      }

      try {
        const weeks = await getAllWeeks();
        const now = new Date();
        const allNotifications = [];
        
        weeks.forEach(week => {
          if (!week.startTime || !week.endTime) return;
          
          const startTime = week.startTime.toDate ? week.startTime.toDate() : new Date(week.startTime);
          const endTime = week.endTime.toDate ? week.endTime.toDate() : new Date(week.endTime);
          
          // Check for recently started quizzes (within last 30 days for history)
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (startTime > thirtyDaysAgo && startTime <= now) {
            const seenKey = `quizStarted_${user.uid}_${week.id}`;
            const isRead = !!localStorage.getItem(seenKey);
            
            allNotifications.push({
              id: `start_${week.id}`,
              type: 'started',
              weekId: week.id,
              title: `Tuần ${week.id.replace('week', '')} đã bắt đầu`,
              message: 'Mau tham gia ngay!',
              time: startTime,
              isRead: isRead,
              seenKey: seenKey
            });
          }
          
          // Check for recently ended quizzes (within last 30 days for history)
          if (endTime > thirtyDaysAgo && endTime <= now) {
            const seenKey = `quizEnded_${user.uid}_${week.id}`;
            const isRead = !!localStorage.getItem(seenKey);
            
            allNotifications.push({
              id: `end_${week.id}`,
              type: 'ended',
              weekId: week.id,
              title: `Tuần ${week.id.replace('week', '')} đã kết thúc`,
              message: 'Kiểm tra ngay!',
              time: endTime,
              isRead: isRead,
              seenKey: seenKey
            });
          }
        });

        // Sort by time first (newest first), then by type priority for same time
        allNotifications.sort((a, b) => {
          // First priority: time (newest first)
          const timeDiff = b.time - a.time;
          
          // If times are very close (within same day), prioritize started over ended
          const dayDiff = Math.abs(timeDiff) / (1000 * 60 * 60 * 24);
          if (dayDiff < 1) {
            if (a.type === 'started' && b.type === 'ended') return -1;
            if (a.type === 'ended' && b.type === 'started') return 1;
          }
          
          return timeDiff;
        });
        setNotifications(allNotifications);
        
        // Count unread notifications
        const unreadCount = allNotifications.filter(n => !n.isRead).length;
        setHasNewResults(unreadCount > 0);
        
        // Set the most recent ended week for backward compatibility
        const latestEndedNotification = allNotifications.find(n => n.type === 'ended');
        if (latestEndedNotification) {
          setAvailableWeek({ id: latestEndedNotification.weekId });
        }
        
      } catch (error) {
        console.error('Error checking for notifications:', error);
      }
    };

    if (user) {
      checkForNotifications();
    }
  }, [user]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const notificationContainer = document.querySelector('.notification-container');
      if (notificationContainer && !notificationContainer.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showNotifications]);

  const handleNotificationClick = (notification) => {
    if (!notification || !user) return;
    
    // Mark notification as read
    localStorage.setItem(notification.seenKey, 'true');
    
    // Update notifications state to mark as read instead of removing
    setNotifications(prev => prev.map(n => 
      n.id === notification.id ? { ...n, isRead: true } : n
    ));
    
    // Update unread count
    const unreadCount = notifications.filter(n => !n.isRead && n.id !== notification.id).length;
    setHasNewResults(unreadCount > 0);
    
    // Navigate based on notification type
    if (notification.type === 'started') {
      // Navigate to quiz player for started quiz
      navigate('/');
    } else if (notification.type === 'ended') {
      // Navigate to quiz history for ended quiz and select the specific week
      navigate(`/my-quizzes?week=${notification.weekId}`);
    }
    
    // Close dropdown
    setShowNotifications(false);
  };

  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
  };

  const markAllAsRead = () => {
    // Mark all notifications as read in localStorage
    notifications.forEach(notification => {
      localStorage.setItem(notification.seenKey, 'true');
    });
    
    // Update all notifications to read status
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setHasNewResults(false);
  };

  const formatNotificationTime = (time) => {
    const now = new Date();
    const diff = now - time;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} ngày trước`;
    } else if (hours > 0) {
      return `${hours} giờ trước`;
    } else {
      return 'Vừa xong';
    }
  };

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
    
    if (item.path === '/users-quiz-by-week') {
      // Only admin can access the Users Quiz By Week page
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
      } ${isVisible ? 'header-visible' : 'header-hidden'}`}>
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
            <>
              {/* Notification Bell - Always visible for regular users */}
              {!user.roles?.includes('editor') && !user.roles?.includes('admin') && !user.roles?.includes('super_admin') && (
                <div className="notification-container">
                  <button 
                    className="notification-bell" 
                    onClick={handleBellClick}
                    title="Thông báo"
                  >
                    <FontAwesomeIcon icon={faBell} />
                    {notifications.filter(n => !n.isRead).length > 0 && (
                      <span className="notification-count">{notifications.filter(n => !n.isRead).length}</span>
                    )}
                  </button>
                  
                  {/* Notification Dropdown */}
                  {showNotifications && (
                    <div className="notification-dropdown">
                      <div className="notification-header">
                        <h3>Thông báo</h3>
                        {notifications.filter(n => !n.isRead).length > 0 && (
                          <button className="mark-all-read" onClick={markAllAsRead}>
                            Đánh dấu tất cả đã đọc
                          </button>
                        )}
                      </div>
                      
                      <div className="notification-list">
                        {notifications.length === 0 ? (
                          <div className="no-notifications">
                            <p>Không có thông báo mới</p>
                          </div>
                        ) : (
                          notifications.map(notification => (
                            <div 
                              key={notification.id}
                              className={`notification-item ${!notification.isRead ? 'unread' : 'read'}`}
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <div className="notification-content">
                                <div className="notification-title">
                                  {notification.title}
                                  {!notification.isRead && <span className="unread-dot"></span>}
                                </div>
                                <div className="notification-message">{notification.message}</div>
                                <div className="notification-time">
                                  {formatNotificationTime(notification.time)}
                                </div>
                              </div>
                              <div className="notification-icon">
                                {notification.type === 'started' ? '🚀' : '✅'}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
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
            </>
          ) : (
            <button className="login-btn" onClick={() => setShowLogin(true)}>
              <FontAwesomeIcon icon={faSignInAlt} />
              <span className="login-text">Đăng nhập</span>
            </button>
          )}
        </div>
        
        {/* Mobile Action Group - chỉ hiện trên mobile/tablet */}
        <div className="mobile-action-group">
          {user && !user.roles?.includes('editor') && !user.roles?.includes('admin') && !user.roles?.includes('super_admin') && (
            <div className="notification-container">
              <button 
                className="notification-bell" 
                onClick={handleBellClick}
                title="Thông báo"
              >
                <FontAwesomeIcon icon={faBell} />
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="notification-count">{notifications.filter(n => !n.isRead).length}</span>
                )}
              </button>
              
              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h3>Thông báo</h3>
                    {notifications.filter(n => !n.isRead).length > 0 && (
                      <button className="mark-all-read" onClick={markAllAsRead}>
                        Đánh dấu tất cả đã đọc
                      </button>
                    )}
                  </div>
                  
                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="no-notifications">
                        <p>Không có thông báo mới</p>
                      </div>
                    ) : (
                      notifications.map(notification => (
                        <div 
                          key={notification.id}
                          className={`notification-item ${!notification.isRead ? 'unread' : 'read'}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="notification-content">
                            <div className="notification-title">
                              {notification.title}
                              {!notification.isRead && <span className="unread-dot"></span>}
                            </div>
                            <div className="notification-message">{notification.message}</div>
                            <div className="notification-time">
                              {formatNotificationTime(notification.time)}
                            </div>
                          </div>
                          <div className="notification-icon">
                            {notification.type === 'started' ? '🚀' : '✅'}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
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
