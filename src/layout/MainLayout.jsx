import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const MainLayout = () => {
    return (
        <div className="flex bg-background min-h-screen font-sans text-white">
            <Sidebar />
            <div className="flex-1 flex flex-col ml-64">
                <Topbar />
                <main className="flex-1 overflow-y-auto bg-background/50 relative">
                    <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
