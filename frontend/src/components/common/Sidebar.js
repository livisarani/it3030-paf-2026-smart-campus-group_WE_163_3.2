import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiCalendar, FiFileText, FiSettings, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
	const { logout, isAdmin } = useAuth();
	const navigate = useNavigate();

	const handleLogout = () => {
		logout();
		navigate('/login');
	};

	return (
		<aside className="sidebar">
			<div className="sidebar-top">
				<nav className="sidebar-nav" aria-label="Sidebar">
					{!isAdmin && (
						<NavLink to="/bookings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
							<FiCalendar />
							<span>Bookings</span>
						</NavLink>
					)}

					{isAdmin && (
						<NavLink to="/admin/bookings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
							<FiFileText />
							<span>Requests</span>
						</NavLink>
					)}

				</nav>
			</div>

			<div className="sidebar-bottom">
				<div className="sidebar-status">
					<p className="sidebar-status-title">Campus Status</p>
					<div className="sidebar-status-row">
						<span className="sidebar-status-dot" aria-hidden="true" />
						<span>All systems optimal</span>
					</div>
				</div>

				<div className="sidebar-footer">
					<button type="button" className="sidebar-footer-link">
						<FiSettings />
						<span>Settings</span>
					</button>

					<button type="button" className="sidebar-footer-link" onClick={handleLogout}>
						<FiLogOut />
						<span>Logout</span>
					</button>
				</div>
			</div>
		</aside>
	);
};

export default Sidebar;
