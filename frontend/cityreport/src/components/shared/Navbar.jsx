import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, User, LogOut, Sun, Moon, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Button from './Button';
import api from '../../api';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme, isDark } = useTheme();
    const navigate = useNavigate();

    const [notifs, setNotifs]       = useState([]);
    const [open, setOpen]           = useState(false);
    const dropdownRef               = useRef(null);

    const unread = notifs.filter(n => !n.is_read).length;

    // Poll every 30s for citizens
    useEffect(() => {
        if (!user || user.role !== 'citizen') return;
        const fetch = () =>
            api.get('/notifications/').then(({ data }) => setNotifs(data)).catch(() => {});
        fetch();
        const id = setInterval(fetch, 30000);
        return () => clearInterval(id);
    }, [user]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleBellClick = () => {
        setOpen(o => !o);
        if (!open && unread > 0) {
            api.post('/notifications/read-all').then(() =>
                setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
            ).catch(() => {});
        }
    };

    const handleNotifClick = (n) => {
        setOpen(false);
        navigate(`/citizen/report/${n.report_id}`);
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <nav className="navbar">
            <div className="container navbar-container">
                <div className="navbar-brand">
                    <Link to="/" className="flex items-center gap-sm">
                        <div className="navbar-logo-hex">
                            <Shield size={20} />
                        </div>
                        <div className="navbar-brand-text">
                            <span className="navbar-brand-title">Smart Civic</span>
                            <span className="navbar-brand-sub">Infrastructure System</span>
                        </div>
                    </Link>
                </div>

                <div className="navbar-menu hidden md:flex">
                    {user?.role === 'citizen' && (
                        <>
                            <Link to="/citizen/dashboard" className="nav-link">Dashboard</Link>
                            <Link to="/citizen/map" className="nav-link">Map View</Link>
                            <Link to="/citizen/reports" className="nav-link">My Reports</Link>
                        </>
                    )}
                    {user?.role === 'officer' && (
                        <>
                            <Link to="/officer/dashboard" className="nav-link">Dashboard</Link>
                        </>
                    )}
                    {user?.role === 'admin' && (
                        <>
                            <Link to="/admin/dashboard" className="nav-link">Dashboard</Link>
                            <Link to="/admin/reports" className="nav-link">Reports</Link>
                            <Link to="/admin/users" className="nav-link">Officers &amp; Users</Link>
                            <Link to="/admin/analytics" className="nav-link">Analytics</Link>
                        </>
                    )}
                </div>

                <div className="navbar-actions flex items-center gap-md">
                    {/* Theme Toggle Button */}
                    <button
                        className="icon-btn theme-toggle-btn"
                        onClick={toggleTheme}
                        title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
                        aria-label="Toggle theme"
                    >
                        {isDark ? <Sun size={19} className="theme-icon sun" /> : <Moon size={19} className="theme-icon moon" />}
                    </button>

                    {/* Bell — only for citizens */}
                    {user?.role === 'citizen' && (
                        <div className="notif-wrapper" ref={dropdownRef}>
                            <button className="icon-btn notif-bell" onClick={handleBellClick}>
                                <Bell size={20} />
                                {unread > 0 && (
                                    <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>
                                )}
                            </button>

                            {open && (
                                <div className="notif-dropdown">
                                    <div className="notif-header">
                                        <span className="notif-title">Notifications</span>
                                        {unread === 0 && notifs.length > 0 && (
                                            <span className="notif-all-read">All caught up</span>
                                        )}
                                    </div>

                                    {notifs.length === 0 ? (
                                        <p className="notif-empty">No notifications yet.</p>
                                    ) : (
                                        <ul className="notif-list">
                                            {notifs.map(n => (
                                                <li
                                                    key={n.id}
                                                    className={`notif-item ${!n.is_read ? 'unread' : ''}`}
                                                    onClick={() => handleNotifClick(n)}
                                                >
                                                    <span className="notif-dot" />
                                                    <div className="notif-body">
                                                        <p className="notif-msg">{n.message}</p>
                                                        <p className="notif-time">
                                                            {new Date(n.created_at).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="user-menu flex items-center gap-sm">
                        <div className="avatar"><User size={18} /></div>
                        <div className="user-info-text hidden md:flex flex-col">
                            <span className="text-xs font-bold user-name-display">{user?.name || 'User'}</span>
                            <span className={`role-pill-badge role-${user?.role || 'citizen'}`}>
                                {user?.role === 'admin' ? '👑 SUPER ADMIN' : (user?.role === 'officer' ? '👮 OFFICER' : '👤 CITIZEN')}
                            </span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleLogout} className="icon-btn logout-btn" title="Log out">
                            <LogOut size={18} />
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
