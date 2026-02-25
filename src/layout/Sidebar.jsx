import React from 'react';
import { LayoutDashboard, BookOpen, Calendar, Settings, LogOut, GraduationCap, Target, BrainCircuit, FileText, Copy, PenTool, Gamepad2 } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { signOut } = useAuth();
    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Target, label: 'Goals', path: '/goals' },
        { icon: BrainCircuit, label: 'Daily Quiz', path: '/quiz' },
        { icon: FileText, label: 'Documents', path: '/documents' },
        { icon: PenTool, label: 'Smart Notes', path: '/notes' },
        { icon: Copy, label: 'Flashcards', path: '/flashcards' },
        { icon: BookOpen, label: 'Courses', path: '/courses' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <aside className="w-64 h-screen bg-card border-r border-sidebar-border flex flex-col fixed left-0 top-0 transition-colors duration-300">
            <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-start to-primary-end flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--theme-text)] to-[var(--theme-text-muted)]">
                    StudyBuddy
                </h1>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            clsx(
                                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                                isActive
                                    ? 'bg-primary-start/10 text-primary-start'
                                    : 'text-text-secondary hover:bg-hover hover:text-text'
                            )
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-sidebar-border">
                <button
                    onClick={signOut}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-text-secondary hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
