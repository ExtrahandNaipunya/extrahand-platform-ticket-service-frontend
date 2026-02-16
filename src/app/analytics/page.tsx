'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, TrendingUp, Clock, CheckCircle, Star, MessageSquare, Users, Award, Calendar, Download, TrendingDown, ArrowLeft, Home, Search, Filter, Activity, Shield, Settings, FileText } from 'lucide-react';
import { formatDateTimeToIST } from '../../lib/dateUtils';

interface Stats {
    total_conversations: number;
    resolved_count: number;
    resolution_rate: number;
    closed_count: number;
    active_count: number;
    handled_today: number;
    avg_response_time: string;
    avg_response_seconds: number;
    avg_resolution_time: string;
    avg_rating: number;
    rating_count: number;
    total_hours_month: number;
}

interface WeeklyStat {
    day_name: string;
    date: string;
    total_chats: number;
    resolved_chats: number;
}

interface DailyActivity {
    active_now: number;
    handled_today: number;
    hours_today: number;
}

interface AgentPerformance {
    agent_id: string; // or number
    name: string;
    email: string;
    total_conversations: number;
    resolved_count: number;
    avg_rating: number;
    status: 'online' | 'busy' | 'offline';
    last_active?: string | null;
}

export default function AnalyticsPage() {
    const router = useRouter();
    const [userRole, setUserRole] = useState<string>('user');
    const [agentName, setAgentName] = useState('');

    // Agent View State
    const [stats, setStats] = useState<Stats | null>(null);
    const [weeklyStats, setWeeklyStats] = useState<WeeklyStat[]>([]);
    const [dailyActivity, setDailyActivity] = useState<DailyActivity | null>(null);
    const [previousStats, setPreviousStats] = useState<Stats | null>(null);

    // Team View State
    const [teamAgents, setTeamAgents] = useState<AgentPerformance[]>([]);
    const [systemStats, setSystemStats] = useState<any>(null);
    const [supervisors, setSupervisors] = useState<any[]>([]);
    const [portalLogs, setPortalLogs] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
            router.push('/login');
            return;
        }

        const user = JSON.parse(userStr);
        setUserRole(user.role || 'user');
        setAgentName(user.name || user.email);

        if (user.role === 'admin' || user.role === 'supervisor') {
            fetchTeamAnalytics(user.role);
        } else {
            fetchAgentAnalytics(user.username || user.email);
        }

        // Refresh interval
        const interval = setInterval(() => {
            if (user.role === 'admin' || user.role === 'supervisor') {
                fetchTeamAnalytics(user.role);
            } else {
                fetchAgentAnalytics(user.username || user.email);
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [router]);

    const fetchAgentAnalytics = async (username: string) => {
        try {
            const statsRes = await fetch(`http://localhost:8001/api/agent/stats/${username}`);
            const statsData = await statsRes.json();

            if (stats) setPreviousStats(stats);
            setStats(statsData);

            const weeklyRes = await fetch(`http://localhost:8001/api/agent/weekly-stats/${username}`);
            const weeklyData = await weeklyRes.json();
            setWeeklyStats(weeklyData.weekly_stats || []);

            const dailyRes = await fetch(`http://localhost:8001/api/agent/daily-activity/${username}`);
            const dailyData = await dailyRes.json();
            setDailyActivity(dailyData);

            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch agent analytics:', error);
            setLoading(false);
        }
    };

    const fetchTeamAnalytics = async (role: string) => {
        try {
            const endpoint = 'http://localhost:8001/api/supervisor/team';

            const res = await fetch(endpoint);
            const data = await res.json();

            if (data && Array.isArray(data.team)) {
                const mappedAgents = data.team.map((agent: any) => ({
                    agent_id: agent.email,
                    name: agent.name,
                    email: agent.email,
                    status: agent.status,
                    total_conversations: agent.totalChats || 0,
                    resolved_count: agent.resolvedCount || 0,
                    avg_rating: agent.avgRating || 0,
                    last_active: agent.lastActive || null
                }));
                setTeamAgents(mappedAgents);
            } else if (Array.isArray(data)) {
                setTeamAgents(data);
            }

            // Fetch overview stats
            const statsRes = await fetch('http://localhost:8001/api/supervisor/stats');
            const statsData = await statsRes.json();
            setSystemStats(statsData);

            if (role === 'admin') {
                const logsRes = await fetch('http://localhost:8001/api/admin/portal-logs?limit=10');
                const logsData = await logsRes.json();
                setPortalLogs(logsData.logs || []);

                const supRes = await fetch('http://localhost:8001/api/admin/supervisor-stats');
                const supData = await supRes.json();
                setSupervisors(supData.supervisors || []);
            }

            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch team analytics:', error);
            setLoading(false);
        }
    };

    const exportReport = async () => {
        try {
            const jsPDF = (await import('jspdf')).default;
            const autoTable = (await import('jspdf-autotable')).default;
            const doc = new jsPDF();

            // Brand Header
            doc.setFillColor(245, 158, 11);
            doc.rect(0, 0, doc.internal.pageSize.width, 20, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('ExtraHand', 15, 13);
            doc.setFontSize(10); doc.setFont('helvetica', 'normal');
            doc.text('Performance Audit Report', 160, 13);

            doc.setTextColor(50, 50, 50);
            doc.setFontSize(16); doc.setFont('helvetica', 'bold');
            doc.text(userRole === 'user' ? 'My Performance Metrics' : 'Organization Performance Matrix', 15, 35);
            doc.setFontSize(10); doc.setFont('helvetica', 'normal');
            doc.text(`Generated At: ${new Date().toLocaleString()}`, 150, 35, { align: 'right' });

            if (userRole === 'user' && stats) {
                const metricData = [
                    ['Total Engagement', stats.total_conversations.toString()],
                    ['Resolved Tickets', stats.resolved_count.toString()],
                    ['Resolution Accuracy', `${stats.resolution_rate}%`],
                    ['Satisfaction Score', `${stats.avg_rating.toFixed(1)} / 5.0`],
                    ['Avg Response (SLA)', stats.avg_resolution_time]
                ];
                autoTable(doc, {
                    startY: 45,
                    head: [['Performance Metric', 'Current Value']],
                    body: metricData,
                    theme: 'grid',
                    headStyles: { fillColor: [245, 158, 11] },
                    styles: { fontSize: 10, cellPadding: 5 }
                });
            } else if (teamAgents.length > 0) {
                const headers = [['Agent Identifier', 'Total Volume', 'Successful', 'CSAT', 'Last Activity']];
                const body = teamAgents.map(a => [
                    `${a.name} (${a.email})`,
                    a.total_conversations.toString(),
                    a.resolved_count.toString(),
                    a.avg_rating.toFixed(1),
                    a.last_active ? formatDateTimeToIST(a.last_active) : 'Never'
                ]);
                autoTable(doc, {
                    startY: 45,
                    head: headers,
                    body: body,
                    theme: 'striped',
                    headStyles: { fillColor: [31, 41, 55] },
                    styles: { fontSize: 9 }
                });

                if (supervisors.length > 0 && userRole === 'admin') {
                    // @ts-ignore
                    const yPos = doc.lastAutoTable.finalY + 15;
                    doc.setFontSize(14); doc.text('Supervisor Oversight', 15, yPos);
                    const supBody = supervisors.map(s => [
                        s.name, s.email, s.status.toUpperCase(),
                        s.lastActive ? formatDateTimeToIST(s.lastActive) : 'Never'
                    ]);
                    autoTable(doc, {
                        startY: yPos + 5,
                        head: [['Supervisor', 'Email', 'Presence', 'Last Audit']],
                        body: supBody,
                        theme: 'grid',
                        headStyles: { fillColor: [245, 158, 11] }
                    });
                }
            }

            doc.save(`ExtraHand_Audit_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Export Failure:', error);
            alert('Report generation failed. Please check console for details.');
        }
    };

    const calculateTrend = (current: number, previous: number | undefined) => {
        if (!previous || previous === 0) return { value: 0, direction: 'neutral' as const };
        const change = ((current - previous) / previous) * 100;
        return {
            value: Math.abs(Math.round(change)),
            direction: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'neutral' as const
        };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading analytics...</p>
                </div>
            </div>
        );
    }

    // --- Render Functions ---

    const renderAgentView = () => {
        if (!stats || !dailyActivity) return null;
        const convTrend = calculateTrend(stats.total_conversations, previousStats?.total_conversations);

        return (
            <div className="space-y-5">
                {/* Key Metrics Grid (Compact Theme) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-all hover:shadow-md">
                        <div className="flex items-center space-x-2 text-gray-400 mb-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span className="text-xs font-semibold uppercase tracking-wider">Total Chats</span>
                        </div>
                        <div className="flex items-end justify-between">
                            <div className="text-xl font-black text-gray-900">{stats.total_conversations}</div>
                            {convTrend.direction !== 'neutral' && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${convTrend.direction === 'up' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                                    {convTrend.direction === 'up' ? '↑' : '↓'}{convTrend.value}<span className="text-gray-400 font-bold ml-0.5">%</span>
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-all hover:shadow-md">
                        <div className="flex items-center space-x-2 text-green-500 mb-1">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Resolution</span>
                        </div>
                        <div className="flex items-end justify-between">
                            <div className="text-xl font-black text-gray-900">{stats.resolution_rate}<span className="text-gray-400 font-bold ml-1">%</span></div>
                            <div className="text-[10px] text-gray-500 mb-0.5">
                                <span className="text-green-600 font-bold">{stats.resolved_count}</span>
                                <span className="mx-0.5">/</span>
                                <span>{stats.closed_count}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-all hover:shadow-md">
                        <div className="flex items-center space-x-2 text-blue-500 mb-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Response</span>
                        </div>
                        <div className="flex items-end justify-between">
                            <div className="text-xl font-black text-gray-900">{stats.avg_response_time}</div>
                            {stats.avg_response_seconds < 120 && <span className="text-[9px] font-black text-green-600 bg-green-50 px-1 rounded">FAST</span>}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-all hover:shadow-md">
                        <div className="flex items-center space-x-2 text-amber-500 mb-1">
                            <Star className="h-3.5 w-3.5" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Rating</span>
                        </div>
                        <div className="flex items-end justify-between">
                            <div className="text-xl font-black text-gray-900">{stats.avg_rating.toFixed(1)}</div>
                            <div className="flex items-center space-x-0.5 mb-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`h-2 w-2 ${i < Math.round(stats.avg_rating) ? 'text-amber-400 fill-current' : 'text-gray-200'}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Compact Data View */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-4 py-2.5 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 flex items-center text-xs uppercase tracking-widest">
                                <Calendar className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                Weekly Overview
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-[11px]">
                                <thead>
                                    <tr className="bg-white text-gray-400 font-bold border-b border-gray-50 uppercase tracking-tighter">
                                        <th className="px-4 py-2">Day</th>
                                        <th className="px-4 py-2 text-center">Volume</th>
                                        <th className="px-4 py-2 text-center">Resolved</th>
                                        <th className="px-4 py-2 text-center">Success</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {weeklyStats.map((day, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-2.5 font-bold text-gray-900">{day.day_name} <span className="text-gray-400 font-medium">({day.date})</span></td>
                                            <td className="px-4 py-2.5 text-center text-gray-600 font-black">{day.total_chats}</td>
                                            <td className="px-4 py-2.5 text-center text-green-600 font-black">{day.resolved_chats}</td>
                                            <td className="px-4 py-2.5 text-center">
                                                <span className={`px-1.5 py-0.5 rounded font-black ${day.total_chats > 0 && (day.resolved_chats / day.total_chats) >= 0.8 ? 'text-green-600 bg-green-50' : 'text-gray-500 bg-gray-50'}`}>
                                                    {day.total_chats > 0 ? Math.round((day.resolved_chats / day.total_chats) * 100) : 0}<span className="text-gray-400 font-bold ml-0.5">%</span>
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col justify-between">
                        <div>
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center text-xs uppercase tracking-widest">
                                <Award className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                Efficiency
                            </h3>
                            <div className="space-y-3.5">
                                <div className="flex justify-between items-center text-[11px]">
                                    <span className="text-gray-500 font-medium">Handled Today</span>
                                    <span className="font-black text-gray-900">{dailyActivity?.handled_today || 0}</span>
                                </div>
                                <div className="flex justify-between items-center text-[11px]">
                                    <span className="text-gray-500 font-medium">Active Now</span>
                                    <span className="font-black text-green-600">{dailyActivity?.active_now || 0}</span>
                                </div>
                                <div className="flex justify-between items-center text-[11px]">
                                    <span className="text-gray-500 font-medium">Avg Resolution</span>
                                    <span className="font-black text-gray-900">{stats.avg_resolution_time}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                            <p className="text-[10px] text-indigo-700 font-medium leading-relaxed italic">
                                "You've maintained a <span className="font-black text-indigo-900">{stats.resolution_rate}%</span> success rate today. Excellent progress."
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderTeamView = () => {
        // Aggregate data if systemStats is not full
        const totalConversations = teamAgents.reduce((acc, curr) => acc + (curr.total_conversations || 0), 0);
        const totalResolved = teamAgents.reduce((acc, curr) => acc + (curr.resolved_count || 0), 0);
        const activeAgents = teamAgents.filter(a => a.status !== 'offline').length;

        const dashboardStats = systemStats || {
            total: totalConversations,
            resolved: totalResolved,
            active: activeAgents,
            avgResolutionTime: '0m'
        };

        return (
            <div className="space-y-6">
                {/* Team Overview Cards - Compact */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-all hover:shadow-md">
                        <div className="flex items-center space-x-2 mb-1.5 opacity-60">
                            <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Total Chats</span>
                        </div>
                        <div className="text-xl font-black text-gray-900">{dashboardStats.total}</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-all hover:shadow-md">
                        <div className="flex items-center space-x-2 mb-1.5 opacity-60">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Resolved</span>
                        </div>
                        <div className="text-xl font-black text-gray-900">{dashboardStats.closed || dashboardStats.resolved}</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-all hover:shadow-md">
                        <div className="flex items-center space-x-2 mb-1.5 opacity-60">
                            <Users className="h-3.5 w-3.5 text-blue-500" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Active</span>
                        </div>
                        <div className="text-xl font-black text-gray-900">{activeAgents}</div>
                        <p className="text-[9px] text-green-600 font-bold mt-0.5">{activeAgents} Online Now</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-all hover:shadow-md">
                        <div className="flex items-center space-x-2 mb-1.5 opacity-60">
                            <Clock className="h-3.5 w-3.5 text-amber-500" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Avg SLA</span>
                        </div>
                        <div className="text-xl font-black text-gray-900">{dashboardStats.avgResolutionTime}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Main Content Area */}
                    <div className={`space-y-6 ${userRole === 'admin' ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
                        {/* Agents Performance Table - Compact */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-4 py-2.5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center">
                                    <Shield className="h-3 w-3 mr-2 text-gray-400" />
                                    Agent Performance Matrix
                                </h3>
                                <button
                                    onClick={exportReport}
                                    className="text-[10px] text-amber-500/70 font-bold hover:text-amber-600 transition-colors uppercase tracking-tight"
                                >
                                    Full Report
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-white text-[10px] uppercase text-gray-400 font-black border-b border-gray-50">
                                            <th className="px-4 py-2">Agent Detail</th>
                                            <th className="px-4 py-2 text-center">Status</th>
                                            <th className="px-4 py-2 text-right">Volume</th>
                                            <th className="px-4 py-2 text-right">Success</th>
                                            <th className="px-4 py-2 text-right">Rating</th>
                                            <th className="px-4 py-2 text-right">Last Login</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {teamAgents.length > 0 ? teamAgents.map((agent, index) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors group">
                                                <td className="px-4 py-2.5">
                                                    <div className="flex items-center space-x-2.5">
                                                        <div className="h-7 w-7 rounded-lg bg-amber-50/50 border border-amber-100/50 flex items-center justify-center text-amber-600/60 font-black text-[10px]">
                                                            {(agent.name || 'A').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-900 text-xs">{agent.name || 'Agent'}</div>
                                                            <div className="text-[9px] text-gray-400 font-medium">{agent.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${agent.status === 'online' ? 'bg-green-500 animate-pulse' : agent.status === 'busy' ? 'bg-amber-500' : 'bg-gray-300'} mr-1.5`}></span>
                                                    <span className="text-[10px] font-bold text-gray-600 capitalize">{agent.status}</span>
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-black text-gray-900 text-xs">{agent.total_conversations || 0}</td>
                                                <td className="px-4 py-2.5 text-right text-xs font-bold text-gray-700">{agent.resolved_count || 0}</td>
                                                <td className="px-4 py-2.5 text-right">
                                                    <div className="flex items-center justify-end space-x-1">
                                                        <span className="text-xs font-bold text-gray-800">{agent.avg_rating ? Number(agent.avg_rating).toFixed(1) : '0.0'}</span>
                                                        <Star className="h-2.5 w-2.5 text-gray-400 fill-current" />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5 text-right text-[10px] text-gray-500 font-medium">
                                                    {agent.last_active ? formatDateTimeToIST(agent.last_active) : 'Never'}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={6} className="px-4 py-8 text-center text-[10px] text-gray-400 italic">No agent data available</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Admin Specific: Supervisor Data */}
                        {userRole === 'admin' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-4 py-2.5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center">
                                        <Users className="h-3 w-3 mr-2 text-blue-500" />
                                        Supervisor Insights
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-white text-[10px] uppercase text-gray-400 font-black border-b border-gray-50">
                                                <th className="px-4 py-2">Supervisor</th>
                                                <th className="px-4 py-2">Status</th>
                                                <th className="px-4 py-2 text-right">Last Login</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {supervisors.length > 0 ? supervisors.map((sup, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-2.5">
                                                        <div className="flex items-center space-x-2.5">
                                                            <div className="h-7 w-7 rounded-lg bg-amber-50/50 border border-amber-100/50 flex items-center justify-center text-amber-600/60 font-black text-[10px]">
                                                                {(sup.name || 'S').charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-gray-900 text-xs">{sup.name}</div>
                                                                <div className="text-[9px] text-gray-400 font-medium">{sup.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${sup.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                            {sup.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right text-[10px] text-gray-500 font-medium">
                                                        {sup.lastActive ? formatDateTimeToIST(sup.lastActive) : 'Never'}
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan={3} className="px-4 py-6 text-center text-[10px] text-gray-400 italic">No supervisor records</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Admin Specific Sidebar: Logs and Portal Changes */}
                    {userRole === 'admin' && (
                        <div className="lg:col-span-4 space-y-6">
                            {/* Portal Change Logs */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50 flex items-center">
                                    <Activity className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                    <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">System Activity</h3>
                                </div>
                                <div className="p-3 space-y-2.5 max-h-[400px] overflow-auto custom-scrollbar">
                                    {portalLogs.length > 0 ? portalLogs.map((log, idx) => (
                                        <div key={idx} className="flex space-x-2.5 items-start bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                                            <div className="mt-1">
                                                {log.action === 'SETTINGS_UPDATE' ? (
                                                    <Settings className="h-3 w-3 text-gray-400" />
                                                ) : log.action === 'USER_ROLE_CHANGE' ? (
                                                    <Shield className="h-3 w-3 text-gray-400" />
                                                ) : (
                                                    <FileText className="h-3 w-3 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[10px] font-black text-gray-900 leading-tight mb-0.5 break-words">{log.details}</div>
                                                <div className="flex items-center space-x-2 text-[8px] font-bold text-gray-400 uppercase tracking-tighter">
                                                    <span className="truncate max-w-[80px]">{log.user_email}</span>
                                                    <span>•</span>
                                                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-5 text-[9px] text-gray-400 italic">No recent activity</div>
                                    )}
                                </div>
                            </div>


                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header with Navigation */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="flex items-center text-amber-600 hover:text-amber-700 mb-4 font-medium transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        <span>Back to Dashboard</span>
                    </button>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">
                                {userRole === 'user' || userRole === 'agent' ? 'My Performance' : 'Team Analytics'}
                            </h1>
                            <p className="text-sm text-gray-500">
                                {userRole === 'user' || userRole === 'agent'
                                    ? `Real-time performance metrics and insights for ${agentName}`
                                    : `Overview of ${userRole === 'admin' ? 'all system' : 'team'} performance and agent detailed stats.`
                                }
                            </p>
                        </div>
                        <button
                            onClick={exportReport}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium flex items-center space-x-2 transition-all shadow-md hover:shadow-lg"
                        >
                            <Download className="h-4 w-4" />
                            <span>Export Report</span>
                        </button>
                    </div>
                </div>

                {/* Content based on Role */}
                {(userRole === 'admin' || userRole === 'supervisor') ? renderTeamView() : renderAgentView()}

            </div>
        </div>
    );
}
