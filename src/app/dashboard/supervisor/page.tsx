'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import SupervisorDashboardView from '../SupervisorDashboardView';
import SupervisorProfileView from './SupervisorProfileView';
import SupervisorSettingsView from './SupervisorSettingsView';

export default function SupervisorDashboardPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const view = searchParams.get('view');
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setUser(JSON.parse(userStr));
        }
    }, []);

    const handleNavigate = (view: string) => {
        switch (view) {
            case 'supervisor_team':
                router.push('/dashboard/supervisor/team');
                break;
            case 'supervisor_tickets':
                router.push('/dashboard/supervisor/tickets');
                break;
            default:
                console.log('Navigation to view:', view);
        }
    };

    const handleUpdateUser = () => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setUser(JSON.parse(userStr));
        }
    };

    if (view === 'profile' && user) {
        return <SupervisorProfileView user={user} onUpdateUser={handleUpdateUser} />;
    }

    if (view === 'settings') {
        return <SupervisorSettingsView />;
    }

    return <SupervisorDashboardView onNavigate={handleNavigate} />;
}
