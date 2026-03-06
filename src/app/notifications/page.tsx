'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCircle, Clock, Search, Filter, Trash2, ArrowLeft, MoreHorizontal, Check, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { getBackendApiUrl } from '@/lib/apiConfig';


interface Notification {
    id: string;
    type: 'chat_request' | 'feedback' | 'system' | 'assignment';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    data?: any;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        // Auth check
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            router.push('/login');
            return;
        }
        try {
            setUser(JSON.parse(userStr));
        } catch (e) {
            router.push('/login');
        }
    }, [router]);

    useEffect(() => {
        if (user?.email) {
            fetchNotifications();
        }
    }, [user]);

    const fetchNotifications = async () => {
        if (!user?.email) return;

        setIsLoading(true);
        try {
            const response = await fetch(`${getBackendApiUrl()}/api/agent/notifications/${encodeURIComponent(user.email)}`);
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await fetch(`${getBackendApiUrl()}/api/agent/notifications/${id}/read`, {
                method: 'PUT'
            });
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, read: true } : n
            ));
            // Trigger storage event to update header
            window.dispatchEvent(new Event('storage'));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        if (!user?.email) return;
        try {
            await fetch(`${getBackendApiUrl()}/api/agent/notifications/mark-all-read`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email })
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            window.dispatchEvent(new Event('storage'));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'chat_request': return 'bg-blue-100 text-blue-600 border-blue-200';
            case 'feedback': return 'bg-amber-100 text-amber-600 border-amber-200';
            case 'assignment': return 'bg-green-100 text-green-600 border-green-200';
            case 'system': return 'bg-purple-100 text-purple-600 border-purple-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    const formatTimeAgo = (timestamp: string) => {
        const now = new Date();
        const date = new Date(timestamp);
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} mins ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        return `${diffDays} days ago`;
    };

    const filteredNotifications = notifications
        .filter(n => {
            if (filter === 'unread') return !n.read;
            if (filter === 'read') return n.read;
            return true;
        })
        .filter(n =>
            n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.message.toLowerCase().includes(searchTerm.toLowerCase())
        );

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                            <button onClick={() => router.back()} className="hover:text-amber-600 flex items-center transition-colors">
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                Back
                            </button>
                            <span>/</span>
                            <span className="text-gray-900 font-medium">Notifications</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Your Notifications</h1>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={fetchNotifications}
                            className="p-2 text-gray-500 hover:text-amber-600 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-all"
                            title="Refresh"
                        >
                            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={markAllAsRead}
                            className="bg-white text-gray-700 hover:text-amber-600 hover:border-amber-200 border border-gray-200 px-4 py-2 rounded-lg font-medium text-sm flex items-center transition-all shadow-sm"
                        >
                            <Check className="h-4 w-4 mr-2" />
                            Mark all as read
                        </button>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filter === 'all'
                                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                                }`}
                        >
                            All Notifications
                            <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                                {notifications.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filter === 'unread'
                                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                                }`}
                        >
                            Unread
                            <span className="ml-2 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs">
                                {notifications.filter(n => !n.read).length}
                            </span>
                        </button>
                    </div>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search notifications..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all text-sm"
                        />
                    </div>
                </div>

                {/* Notifications List */}
                <div className="space-y-4">
                    {isLoading ? (
                        // Loading Skeletons
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm animate-pulse">
                                <div className="flex items-start space-x-4">
                                    <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                                    <div className="flex-1 space-y-3">
                                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : filteredNotifications.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 border-dashed">
                            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-gray-900">No notifications found</h3>
                            <p className="text-gray-500 text-sm mt-1">
                                {filter === 'unread' ? "You're all caught up!" : "You don't have any notifications yet."}
                            </p>
                            {filter !== 'all' && (
                                <button
                                    onClick={() => setFilter('all')}
                                    className="mt-4 text-amber-600 hover:text-amber-700 font-medium text-sm"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => !notification.read && markAsRead(notification.id)}
                                className={`group bg-white rounded-xl p-5 shadow-sm border transition-all cursor-pointer relative overflow-hidden ${!notification.read
                                    ? 'border-amber-200 shadow-amber-50 ring-1 ring-amber-50'
                                    : 'border-gray-100 hover:border-gray-300 hover:shadow-md'
                                    }`}
                            >
                                {/* Left accent bar for unread */}
                                {!notification.read && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
                                )}

                                <div className="flex items-start gap-5">
                                    {/* Icon Box */}
                                    <div className={`p-3 rounded-xl border ${getNotificationColor(notification.type)} shrink-0`}>
                                        <Bell className="h-5 w-5" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <h3 className={`text-base font-semibold truncate pr-4 ${!notification.read ? 'text-gray-900' : 'text-gray-700'
                                                }`}>
                                                {notification.title}
                                            </h3>
                                            <span className="flex items-center text-xs font-medium text-gray-400 whitespace-nowrap bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {formatTimeAgo(notification.timestamp)}
                                            </span>
                                        </div>

                                        <p className={`text-sm leading-relaxed mb-3 ${!notification.read ? 'text-gray-700 font-medium' : 'text-gray-500'
                                            }`}>
                                            {notification.message}
                                        </p>

                                        {/* Activity Footer */}
                                        <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-50">
                                            <span className="text-xs text-gray-400 flex items-center capitalize">
                                                <span className={`w-1.5 h-1.5 rounded-full mr-2 ${!notification.read ? 'bg-amber-500' : 'bg-green-500'
                                                    }`}></span>
                                                {notification.type.replace('_', ' ')}
                                            </span>

                                            {!notification.read && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsRead(notification.id);
                                                    }}
                                                    className="text-xs font-semibold text-amber-600 hover:text-amber-700 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-amber-50 px-3 py-1.5 rounded-full"
                                                >
                                                    <Check className="h-3 w-3 mr-1" />
                                                    Mark as read
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
