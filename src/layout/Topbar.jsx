import React, { useState } from 'react';
import { Search, Bell, User, Trophy, X, Palette } from 'lucide-react';
import { useStreak } from '../hooks/useStreak';
import { useTheme } from '../context/ThemeContext';
import clsx from 'clsx';

const Topbar = () => {
    const { streak } = useStreak();
    const { theme, setTheme } = useTheme();
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: 1, title: "Daily Quiz Ready", message: "Test your knowledge on today's topics!", time: "2m ago", unread: true },
        { id: 2, title: "Goal Progress", message: "You're 80% through your weekly goal.", time: "1h ago", unread: false },
        { id: 3, title: "System Update", message: "New study tools added.", time: "1d ago", unread: false }
    ]);

    const unreadCount = notifications.filter(n => n.unread).length;

    const handleNotificationClick = () => {
        setShowNotifications(!showNotifications);
        // Mark all as read when opening? Or per item. Let's just toggle for now.
        if (!showNotifications) {
            setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
        }
    };

    return (
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-20 text-text transition-colors duration-300">
            <div className="relative w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                    type="text"
                    placeholder="Search courses, assignments..."
                    className="w-full bg-background border border-border rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-start/50 transition-all text-text placeholder-text-muted"
                />
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 px-3 py-1.5 rounded-full border border-orange-500/20">
                    <Trophy className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-bold text-orange-400">{streak} Day Streak</span>
                </div>

                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-2 rounded-full hover:bg-hover transition-colors"
                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    <Palette className={clsx(
                        "w-5 h-5 transition-colors",
                        theme === 'dark' ? "text-text-secondary" : "text-primary-start"
                    )} />
                </button>

                <div className="relative">
                    <button
                        onClick={handleNotificationClick}
                        className="p-2 rounded-full hover:bg-hover transition-colors relative"
                    >
                        <Bell className="w-5 h-5 text-text-secondary" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50">
                            <div className="p-4 border-b border-border flex justify-between items-center">
                                <h3 className="font-semibold text-text">Notifications</h3>
                                <button onClick={() => setShowNotifications(false)} className="text-text-muted hover:text-text">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length > 0 ? (
                                    notifications.map(n => (
                                        <div key={n.id} className={`p-4 border-b border-border last:border-0 hover:bg-hover transition-colors ${n.unread ? 'bg-primary-start/5' : ''}`}>
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="text-sm font-semibold text-text">{n.title}</h4>
                                                <span className="text-xs text-text-muted">{n.time}</span>
                                            </div>
                                            <p className="text-sm text-text-secondary">{n.message}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-text-muted text-sm">No new notifications</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-8 w-[1px] bg-border"></div>

                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-hover flex items-center justify-center border border-border">
                        <User className="w-4 h-4 text-text-secondary" />
                    </div>
                    <div className="hidden md:block text-text">
                        <p className="text-sm font-medium">Student User</p>
                        <p className="text-xs text-text-muted">Class 12-A</p>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Topbar;
