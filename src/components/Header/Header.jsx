import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleUser, faBars, faTimes,} from '@fortawesome/free-solid-svg-icons';
import './Header.css';
import logo from '../../assets/logo.png';
import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  { name: 'Trang chủ', path: '/' },
  { name: 'Bảng điều khiển', path: '/dashboard' },
  { name: 'Các quizz tôi tham gia', path: '/my-quizzes' },
  { name: 'Các quizz', path: '/quizz-list' },
  { name: 'Tin tức và thông báo quizz', path: '/news' },
  { name: '📤 Upload', path: '/upload' },
];

const Header = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const handleNavLinkClick = () => setSidebarOpen(false);

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
      <div
        className={`sidebar ${sidebarOpen ? 'open' : ''}`}
      >
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
          {navLinks.map(link => (
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
        </nav>
      </div>

      {/* Header cố định */}
      <header className="header-container">
        {/* Logo */}
        <div className="header-logo">
          <img src={logo} alt="Logo" />
        </div>

        {/* Nav desktop */}
        <nav className="header-nav">
          {navLinks.map(link => (
            <Link
              key={link.name}
              to={link.path}
              className={`header-link ${
                location.pathname === link.path ? 'active' : ''
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="header-actions">
          <button className="login-btn">
            <FontAwesomeIcon icon={faCircleUser} />
          </button>
          <button
            className="header-menu-btn"
            onClick={() => setSidebarOpen(true)}
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
        </div>
      </header>
    </>
  );
};

export default Header;
