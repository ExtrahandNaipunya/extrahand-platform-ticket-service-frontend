import { useState, useEffect } from 'react';
import { Activity, Clock, User, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react';
import { formatTimeAgo } from '../../lib/dateUtils';
import { getBackendApiUrl } from '@/lib/apiConfig';

interface ActiveSession {
    id: number;
    customer_name: string;
    customer_email: string;
    agent_email: string;
    status: string;
    joined_at: string;
    last_message: string;
    last_sender: string;
}

const LiveMonitoringView = () => {
    const [sessions, setSessions] = useState<ActiveSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchActiveSessions = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${getBackendApiUrl()}/api/admin/monitoring/active-sessions`);
            if (response.ok) {
                const data = await response.json();
                setSessions(data.sessions || []);
            }
        } catch (error) {
            console.error('Failed to fetch monitoring sessions', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchActiveSessions();
        // Poll every 10 seconds
        const interval = setInterval(fetchActiveSessions, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden h-full">
            <div className="bg-white border-b border-gray-200 px-8 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                            <Activity className="h-6 w-6 text-amber-600 mr-2" />
                            Live Monitoring
                        </h1>
                        <p className="text-gray-500 mt-1">Real-time overview of active support sessions</p>
                    </div>
                    <button
                        onClick={fetchActiveSessions}
                        className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                        <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-8">
                {sessions.length === 0 && !isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                        <div className="p-4 bg-green-50 rounded-full mb-4">
                            <Activity className="h-8 w-8 text-green-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">All Quiet</h3>
                        <p className="text-gray-500 text-sm mt-1">There are no active chat sessions at the moment.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sessions.map(session => (
                            <div key={session.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                    <div className="flex items-center space-x-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                                        <span className="font-medium text-gray-700 text-sm">Session #{session.id}</span>
                                    </div>
                                    <span className="text-xs text-gray-500 flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {formatTimeAgo(session.joined_at)}
                                    </span>
                                </div>

                                <div className="p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                {session.customer_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{session.customer_name}</p>
                                                <p className="text-xs text-gray-500 truncate max-w-[120px]">{session.customer_email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-xs">
                                                {session.agent_email ? session.agent_email.charAt(0).toUpperCase() : '?'}
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-700">Agent</p>
                                                <p className="text-xs text-gray-500 truncate max-w-[120px]">
                                                    {session.agent_email}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 bg-gray-50 rounded-lg p-3 border border-gray-100">
                                        <p className="text-xs text-gray-500 mb-1 flex items-center">
                                            <MessageSquare className="h-3 w-3 mr-1" />
                                            Last Message ({session.last_sender})
                                        </p>
                                        <p className="text-sm text-gray-800 line-clamp-2 italic">
                                            "{session.last_message || 'No messages yet'}"
                                        </p>
                                    </div>
                                </div>

                                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                                    <button className="text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors">
                                        View Details
                                    </button>
                                    {/* Could add 'Join' or 'Spy' button here in future */}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveMonitoringView;
