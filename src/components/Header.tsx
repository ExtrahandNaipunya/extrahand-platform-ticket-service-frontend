'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import {
    User,
    LogOut,
    Settings,
    ChevronDown,
    Bell,
    Menu,
    X
} from 'lucide-react';

interface UserData {
    name: string;
    email: string;
    role: string;
}

export default function Header() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState<UserData | null>(null);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const pathname = usePathname();

    // Check if we're on the login page
    const isLoginPage = pathname === '/login';

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('accessToken');
            const userStr = localStorage.getItem('user');
            const storedImage = localStorage.getItem('profileImage');

            if (token && userStr) {
                try {
                    const userData = JSON.parse(userStr);
                    setUser(userData);
                    setProfileImage(storedImage); // Load profile image
                    setIsLoggedIn(true);
                } catch (e) {
                    setIsLoggedIn(false);
                    setUser(null);
                    setProfileImage(null);
                }
            } else {
                setIsLoggedIn(false);
                setUser(null);
                setProfileImage(null);
            }
        };

        checkAuth();

        // Listen for auth changes
        window.addEventListener('auth-change', checkAuth);
        window.addEventListener('storage', checkAuth);

        return () => {
            window.removeEventListener('auth-change', checkAuth);
            window.removeEventListener('storage', checkAuth);
        };
    }, []);

    // ... (existing code)

    // Render logic updates below
    // ...

    // Get user initials for avatar
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // ...



    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        }

        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        localStorage.removeItem('profileImage');

        window.dispatchEvent(new Event('auth-change'));
        setShowDropdown(false);
        router.push('/login');
    };

    // Get role display name
    const getRoleDisplayName = (role: string) => {
        switch (role) {
            case 'admin':
                return 'Administrator';
            case 'supervisor':
                return 'Supervisor';
            case 'agent':
            case 'user':
                return 'Support Agent';
            default:
                return role;
        }
    };



    // Don't render header on login page
    if (isLoginPage) {
        return null;
    }

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-3 group">
                        <Image
                            src="/images/logo.png"
                            alt="ExtraHand Logo"
                            width={40}
                            height={40}
                            className="rounded-xl shadow-lg shadow-amber-200/50 group-hover:shadow-amber-300/60 transition-all"
                        />
                        <div className="hidden sm:block">
                            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                ExtraHand
                            </h1>
                            <p className="text-[10px] text-amber-600 font-medium -mt-1">
                                Ticket Management Portal
                            </p>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}


                    {/* Right Side - User Menu */}
                    <div className="flex items-center space-x-3">
                        {isLoggedIn && user ? (
                            <>
                                {/* Notifications Button */}
                                <Link
                                    href="/notifications"
                                    className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                                >
                                    <Bell className="h-5 w-5" />
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                </Link>

                                {/* User Dropdown */}
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setShowDropdown(!showDropdown)}
                                        className="flex items-center space-x-2 p-1.5 pr-3 rounded-xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shadow-sm overflow-hidden">
                                            {profileImage ? (
                                                <img
                                                    src={profileImage}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                getInitials(user.name || user.email)
                                            )}
                                        </div>
                                        <div className="hidden sm:block text-left">
                                            <p className="text-sm font-medium text-gray-900 leading-tight">
                                                {user.name || user.email.split('@')[0]}
                                            </p>
                                            <p className="text-[10px] text-gray-500 leading-tight">
                                                {getRoleDisplayName(user.role)}
                                            </p>
                                        </div>
                                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {showDropdown && (
                                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 animate-slideDown">
                                            <div className="px-4 py-3 border-b border-gray-100">
                                                <p className="text-sm font-semibold text-gray-900">{user.name || user.email}</p>
                                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                                <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded-full">
                                                    {getRoleDisplayName(user.role)}
                                                </span>
                                            </div>

                                            <div className="py-1">
                                                <Link
                                                    href="/dashboard?view=profile"
                                                    onClick={() => setShowDropdown(false)}
                                                    className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                >
                                                    <User className="h-4 w-4 text-gray-400" />
                                                    <span>Profile</span>
                                                </Link>
                                                <Link
                                                    href="/dashboard?view=settings"
                                                    onClick={() => setShowDropdown(false)}
                                                    className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                >
                                                    <Settings className="h-4 w-4 text-gray-400" />
                                                    <span>Settings</span>
                                                </Link>
                                            </div>

                                            <div className="border-t border-gray-100 pt-1">
                                                <button
                                                    onClick={handleLogout}
                                                    className="flex items-center space-x-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    <LogOut className="h-4 w-4" />
                                                    <span>Sign Out</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <Link
                                href="/login"
                                className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 font-medium text-sm rounded-lg hover:from-yellow-500 hover:to-amber-600 transition-all shadow-sm"
                            >
                                Sign In
                            </Link>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                        >
                            {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}

            </div>
        </header>
    );
}
