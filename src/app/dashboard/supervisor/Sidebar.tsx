'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Users, LogOut, BarChart3 } from 'lucide-react';

export default function SupervisorSidebar() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        return pathname === path || pathname?.startsWith(`${path}/`);
    };

    const handleSignOut = () => {
        try {
            if (document.cookie.includes('accessToken')) {
                document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        localStorage.removeItem('profileImage');
        window.location.href = '/login';
    };

    return (
        <div className="bg-white shadow-xl w-72 flex flex-col h-full border-r border-amber-100 justify-between">
            {/* Header */}
            <div className="h-16 flex items-center px-6 border-b border-amber-100 bg-amber-50/50">
                <div className="flex items-center space-x-3">

                    <div>
                        <h1 className="text-sm font-bold text-gray-900">Supervisor Panel</h1>
                        <p className="text-xs text-amber-600 font-medium">Team Oversight</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">


                <Link
                    href="/dashboard/supervisor"
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${pathname === '/dashboard/supervisor'
                        ? 'bg-amber-50 text-amber-700 shadow-sm border border-amber-100'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                >
                    <LayoutDashboard className={`h-5 w-5 mr-3 transition-transform group-hover:scale-110 ${pathname === '/dashboard/supervisor' ? 'text-amber-600' : 'text-gray-400 group-hover:text-amber-600'
                        }`} />
                    Dashboard
                </Link>

                <Link
                    href="/dashboard/supervisor/tickets"
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${isActive('/dashboard/supervisor/tickets')
                        ? 'bg-amber-50 text-amber-700 shadow-sm border border-amber-100'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                >
                    <FileText className={`h-5 w-5 mr-3 transition-transform group-hover:scale-110 ${isActive('/dashboard/supervisor/tickets') ? 'text-amber-600' : 'text-gray-400 group-hover:text-amber-600'
                        }`} />
                    All Tickets
                </Link>

                <Link
                    href="/dashboard/supervisor/team"
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${isActive('/dashboard/supervisor/team')
                        ? 'bg-amber-50 text-amber-700 shadow-sm border border-amber-100'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                >
                    <Users className={`h-5 w-5 mr-3 transition-transform group-hover:scale-110 ${isActive('/dashboard/supervisor/team') ? 'text-amber-600' : 'text-gray-400 group-hover:text-amber-600'
                        }`} />
                    Team Performance
                </Link>

                <div className="my-2 border-t border-gray-100 mx-2"></div>

                <Link
                    href="/analytics"
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${pathname === '/analytics'
                        ? 'bg-amber-50 text-amber-700 shadow-sm border border-amber-100'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                >
                    <BarChart3 className={`h-5 w-5 mr-3 transition-transform group-hover:scale-110 ${pathname === '/analytics' ? 'text-amber-600' : 'text-gray-400 group-hover:text-amber-600'
                        }`} />
                    Analytics
                </Link>

                <Link
                    href="/knowledge-base"
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${pathname === '/knowledge-base'
                        ? 'bg-amber-50 text-amber-700 shadow-sm border border-amber-100'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                >
                    <FileText className={`h-5 w-5 mr-3 transition-transform group-hover:scale-110 ${pathname === '/knowledge-base' ? 'text-amber-600' : 'text-gray-400 group-hover:text-amber-600'
                        }`} />
                    Knowledge Base
                </Link>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-amber-100 bg-amber-50/30">
                <button
                    onClick={handleSignOut}
                    className="flex items-center justify-center w-full text-gray-600 hover:text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-xl transition-all text-sm font-medium group"
                >
                    <LogOut className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
