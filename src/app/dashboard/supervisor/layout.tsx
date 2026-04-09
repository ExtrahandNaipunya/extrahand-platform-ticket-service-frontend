'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SupervisorSidebar from './Sidebar';

export default function SupervisorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        // Basic role check
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            router.push('/login');
            return;
        }

        try {
            const user = JSON.parse(userStr);
            if (user.role !== 'supervisor') {
                // Redirect if not supervisor
                router.push('/dashboard'); // Or unauthorized page
            } else {
                setIsAuthorized(true);
            }
        } catch (e) {
            router.push('/login');
        }
    }, [router]);

    useEffect(() => {
        // Prevent double vertical scrollbars on supervisor dashboard shell.
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, []);

    if (!isAuthorized) {
        return null; // Don't render anything while checking
    }

    return (
        <div className="flex w-full bg-gray-50 overflow-hidden relative" style={{ height: 'calc(100vh - 64px)' }}>
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    style={{ top: '64px' }}
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 fixed inset-y-0 lg:inset-auto lg:relative z-40 w-72 lg:w-auto lg:h-full`}>
                <SupervisorSidebar />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Mobile Header for Sidebar Toggle */}
                <div className="lg:hidden p-4 bg-white border-b border-gray-200 flex items-center justify-between">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                    <span className="font-bold text-gray-800">Supervisor Panel</span>
                </div>

                <div className="flex-1 overflow-y-auto bg-gray-50">
                    {children}
                </div>
            </div>
        </div>
    );
}

