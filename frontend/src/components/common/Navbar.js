import React from 'react';
import { Link } from 'react-router-dom';
import { FiBell, FiSearch, FiSettings, FiUser } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { isAdmin } = useAuth();
  const dashboardPath = isAdmin ? '/admin/dashboard' : '/bookings';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <Link to={dashboardPath} className="topbar-brand">
          <span className="topbar-brand-mark" aria-hidden="true">
            S
          </span>
          <span className="topbar-brand-text">
            <span className="topbar-brand-title">Smart Campus</span>
            <span className="topbar-brand-subtitle">SMART CAMPUS MANAGEMENT</span>
          </span>
        </Link>
      </div>

      <div className="topbar-search" role="search">
        <FiSearch aria-hidden="true" />
        <input type="search" placeholder="Search resources..." aria-label="Search resources" />
      </div>

      <div className="topbar-right">
        <button type="button" className="icon-btn" aria-label="Notifications">
          <FiBell />
        </button>
        <button type="button" className="icon-btn" aria-label="Settings">
          <FiSettings />
        </button>
        <button type="button" className="icon-btn" aria-label="Account">
          <FiUser />
        </button>
      </div>
    </header>
  );
};

export default Navbar;