import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import icons from './Icons';

function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        fetchNotifications();
        // Poll every 1 minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error('Failed to mark notification as read', err);
        }
    };

    const markAllRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error('Failed to mark all as read', err);
        }
    };

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button 
                className={`btn-icon btn-ghost ${unreadCount > 0 ? 'animate-pulse' : ''}`} 
                onClick={() => setShowDropdown(!showDropdown)}
                style={{ 
                    position: 'relative',
                    animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none'
                }}
            >
                {icons.bell}
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: 'var(--primary-400)',
                        color: 'white',
                        fontSize: '0.6rem',
                        fontWeight: 800,
                        padding: '2px 5px',
                        borderRadius: '10px',
                        border: '2px solid var(--bg-card)',
                        minWidth: '18px',
                        pointerEvents: 'none'
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <div className="glass-card animate-slide-up" style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    right: 0,
                    width: '320px',
                    maxHeight: '440px',
                    padding: 0,
                    zIndex: 1000,
                    overflow: 'hidden',
                    background: 'rgba(30,30,42,0.98)',
                    boxShadow: 'var(--shadow-xl)',
                    border: '1px solid rgba(255,255,255,0.08)'
                }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Notifications</h4>
                        {unreadCount > 0 && (
                            <button 
                                onClick={markAllRead}
                                style={{ background: 'none', border: 'none', color: 'var(--accent-sky)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>
                    
                    <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                All caught up! No notifications.
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div 
                                    key={n.id} 
                                    onClick={() => !n.isRead && markAsRead(n.id)}
                                    style={{
                                        padding: '12px 16px',
                                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                                        background: n.isRead ? 'transparent' : 'rgba(59,130,246,0.05)',
                                        cursor: n.isRead ? 'default' : 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: n.isRead ? 'var(--text-secondary)' : 'var(--text-primary)', marginBottom: '2px' }}>
                                        {n.title}
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '6px' }}>
                                        {n.message}
                                    </div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        {new Date(n.createdAt).toLocaleString()}
                                        {!n.isRead && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-sky)' }}></span>}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default NotificationBell;
