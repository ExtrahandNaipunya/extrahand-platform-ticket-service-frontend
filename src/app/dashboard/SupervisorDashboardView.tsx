import { useState, useEffect } from 'react';
import { BarChart3, Users, Clock, TrendingUp, AlertCircle, CheckCircle, XCircle, Download, Filter, Calendar, MessageSquare, Activity, Globe, Headphones, ArrowUpRight, Search, Eye, Star, Zap } from 'lucide-react';
import { formatToIST, formatTimeAgo, formatDateTimeToIST } from '../../lib/dateUtils';
import { getBackendApiUrl } from '@/lib/apiConfig';

interface TicketStats {
    total: number;
    pending: number;
    active: number;
    closed: number;
    avgResolutionTime: string;
}

interface TeamMember {
    email: string;
    name: string;
    activeChats: number;
    totalChats: number;
    resolvedCount: number;
    avgRating: number;
    status: 'online' | 'offline' | 'busy';
    lastActive?: string | null;
}

interface RecentTicket {
    id: string;
    customer_name: string;
    issue_type: string;
    status: 'pending' | 'active' | 'closed';
    created_at: string;
    agent_name?: string;
}

interface SupervisorDashboardViewProps {
    onNavigate?: (view: string) => void;
}

const SupervisorDashboardView = ({ onNavigate }: SupervisorDashboardViewProps) => {
    const [stats, setStats] = useState<TicketStats>({
        total: 0,
        pending: 0,
        active: 0,
        closed: 0,
        avgResolutionTime: '0m 0s'
    });
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchSupervisorData();
        const interval = setInterval(fetchSupervisorData, 5000); // 5s for real-time feel
        return () => clearInterval(interval);
    }, []);

    const fetchSupervisorData = async () => {
        try {
            // Fetch stats, team, and activity in parallel
            const [statsRes, teamRes, activityRes] = await Promise.all([
                fetch(`${getBackendApiUrl()}/api/supervisor/stats`),
                fetch(`${getBackendApiUrl()}/api/supervisor/team`),
                fetch(`${getBackendApiUrl()}/api/supervisor/activity`)
            ]);

            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data);
            }

            if (teamRes.ok) {
                const data = await teamRes.json();
                if (data.team && data.team.length > 0) {
                    // Map to ensure proper typing
                    const mappedTeam: TeamMember[] = data.team.map((member: any) => ({
                        email: member.email,
                        name: member.name,
                        activeChats: member.activeChats || 0,
                        totalChats: member.totalChats || 0,
                        resolvedCount: member.resolvedCount || 0,
                        avgRating: member.avgRating || 0,
                        status: member.status as 'online' | 'offline' | 'busy',
                        lastActive: member.lastActive || null
                    }));
                    setTeamMembers(mappedTeam);
                } else {
                    setTeamMembers([]);
                }
            }

            if (activityRes.ok) {
                const data = await activityRes.json();
                if (data.activity && data.activity.length > 0) {
                    setRecentTickets(data.activity);
                } else {
                    setRecentTickets([]);
                }
            }

        } catch (error) {
            console.error('Failed to fetch supervisor data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const exportReport = async () => {
        try {
            // Dynamically import jspdf to avoid server-side issues
            const jsPDF = (await import('jspdf')).default;
            const autoTable = (await import('jspdf-autotable')).default;

            const doc = new jsPDF();

            // === Header branding ===
            doc.setFillColor(255, 170, 0); // Amber/Orange color
            doc.rect(0, 0, doc.internal.pageSize.width, 20, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('ExtraHand', 15, 13);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Support Team Report', 160, 13);

            // === Report Info ===
            doc.setTextColor(50, 50, 50);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('Operations Overview', 15, 35);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 150, 35, { align: 'right' });

            // === High Level Stats Box ===
            let yPos = 45;
            const headers = [['Total Tickets', 'Pending', 'Active Sessions', 'Resolved Today', 'SLA Avg']];
            const data = [[
                stats.total.toString(),
                stats.pending.toString(),
                stats.active.toString(),
                stats.closed.toString(),
                stats.avgResolutionTime
            ]];

            autoTable(doc, {
                startY: yPos,
                head: headers,
                body: data,
                theme: 'grid',
                headStyles: { fillColor: [245, 158, 11] }, // Amber-500
                styles: { fontSize: 10, cellPadding: 4, halign: 'center' },
            });

            // @ts-ignore
            yPos = doc.lastAutoTable.finalY + 15;

            // === Team Performance Table ===
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Team Performance Matrix', 15, yPos);
            yPos += 5;

            const teamHeaders = [['Agent Name', 'Status', 'Active Chats', 'Total / Resolved', 'Avg Rating']];
            const teamData = teamMembers.map(m => [
                m.name,
                m.status.toUpperCase(),
                m.activeChats.toString(),
                `${m.totalChats} / ${m.resolvedCount}`,
                m.avgRating.toFixed(1)
            ]);

            autoTable(doc, {
                startY: yPos,
                head: teamHeaders,
                body: teamData,
                theme: 'striped',
                headStyles: { fillColor: [40, 40, 40] },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                styles: { fontSize: 9, cellPadding: 3 },
                columnStyles: {
                    0: { fontStyle: 'bold' },
                    4: { halign: 'center', textColor: [217, 119, 6] } // Amber for rating
                }
            });

            // === Footer ===
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`Page ${i} of ${pageCount} - ExtraHand Internal Document`, 105, 290, { align: 'center' });
            }

            // Save the PDF
            doc.save(`ExtraHand_Supervisor_Report_${new Date().toISOString().split('T')[0]}.pdf`);

        } catch (error) {
            console.error('Failed to generate PDF:', error);
            alert('Failed to generate PDF report. Please try again.');
        }
    };

    const handleExpandView = () => {
        if (onNavigate) {
            onNavigate('supervisor_team');
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-gray-50/50 overflow-hidden h-full">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-5 shadow-sm sticky top-0 z-10">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center tracking-tight">
                            Operations Overview
                        </h1>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="hidden md:flex flex-col items-end mr-4">
                            <span className="text-xs text-gray-500 font-medium">Last updated</span>
                            <span className="text-xs font-bold text-gray-900">Just now</span>
                        </div>
                        <button
                            onClick={exportReport}
                            className="group flex items-center px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-black transition-all shadow-lg shadow-gray-200 active:scale-95"
                        >
                            <Download className="h-4 w-4 mr-2 group-hover:translate-y-0.5 transition-transform" />
                            <span className="text-sm font-semibold">Generate Report</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-8 custom-scrollbar">
                {/* Stats Grid - Compact Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Pending Card */}
                    <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-center h-20 pl-4">
                        <div>
                            <h3 className="text-2xl font-black text-gray-900">{stats.pending}</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Pending Tickets</p>
                        </div>
                    </div>

                    {/* Active Card */}
                    <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-center h-20 pl-4">
                        <div>
                            <h3 className="text-2xl font-black text-gray-900">{stats.active}</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Active Sessions</p>
                        </div>
                    </div>

                    {/* Resolved Card */}
                    <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-center h-20 pl-4">
                        <div>
                            <h3 className="text-2xl font-black text-gray-900">{stats.closed}</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Resolved Today</p>
                        </div>
                    </div>

                    {/* SLA Card */}
                    <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-center h-20 pl-4">
                        <div>
                            <h3 className="text-2xl font-black text-gray-900">{stats.avgResolutionTime}</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Avg SLA Compliance</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Team Status - 2/3 width */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-amber-50/50 rounded-lg border border-amber-100/50">
                                        <Users className="h-5 w-5 text-amber-500/60" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 tracking-tight">Team Performance Matrix</h3>
                                </div>
                                <button
                                    onClick={handleExpandView}
                                    className="text-xs font-bold text-amber-500/80 hover:text-amber-600 uppercase tracking-wider cursor-pointer transition-colors"
                                >
                                    Expand View
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-white border-b border-gray-50">
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Agent Detail</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Load</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Quality</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Activity</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-medium">
                                                    Loading team data...
                                                </td>
                                            </tr>
                                        ) : teamMembers.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-medium italic">
                                                    No team members found. Add users with 'user' role to see them here.
                                                </td>
                                            </tr>
                                        ) : (
                                            teamMembers.map((member) => (
                                                <tr key={member.email} className="hover:bg-gray-50/80 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <div className="relative">
                                                                <div className="h-10 w-10 rounded-xl bg-amber-50/50 border border-amber-100/50 flex items-center justify-center text-amber-600/60 font-black">
                                                                    {member.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${member.status === 'online' ? 'bg-green-500' : member.status === 'busy' ? 'bg-amber-500' : 'bg-gray-300'}`}></div>
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="font-bold text-gray-900 transition-colors group-hover:text-amber-600">{member.name}</div>
                                                                <div className="flex items-center space-x-2">
                                                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{member.status}</div>
                                                                    {member.status === 'offline' && member.lastActive && (
                                                                        <>
                                                                            <span className="text-[10px] text-gray-300">•</span>
                                                                            <div className="text-[9px] text-gray-400 font-medium">Seen {formatDateTimeToIST(member.lastActive)}</div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="inline-flex flex-col items-center">
                                                            <span className="text-sm font-black text-gray-900">{member.activeChats}</span>
                                                            <span className="text-[10px] text-gray-400 font-bold uppercase">Chats</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col items-center justify-center">
                                                            <div className="flex items-center space-x-1 mb-1">
                                                                <Star className="h-3 w-3 text-gray-400 fill-current" />
                                                                <span className="text-sm font-black text-gray-900">{member.avgRating.toFixed(1)}</span>
                                                            </div>
                                                            <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                                <div className="h-full bg-gray-400" style={{ width: `${(member.avgRating / 5) * 100}%` }}></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex flex-col items-end">
                                                            <div className="flex items-center space-x-1">
                                                                <span className="text-xs font-bold text-gray-900">{member.resolvedCount}</span>
                                                                <span className="text-xs text-gray-400">/</span>
                                                                <span className="text-xs text-gray-500">{member.totalChats}</span>
                                                            </div>
                                                            <span className="text-[10px] text-gray-400 font-medium uppercase">Resolved / Total</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Activity Feed - 1/3 width */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-amber-50 rounded-lg">
                                        <Activity className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 tracking-tight">Live Activity</h3>
                                </div>
                                <span className="flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                </span>
                            </div>

                            <div className="p-4 space-y-4">
                                {recentTickets.length === 0 ? (
                                    <div className="text-center text-gray-400 py-8 text-sm">
                                        No recent activity
                                    </div>
                                ) : (
                                    recentTickets.map((ticket) => (
                                        <div key={ticket.id} className="relative pl-6 pb-4 border-l-2 border-gray-100 last:pb-0">
                                            <div className={`absolute left-[-9px] top-0 h-4 w-4 rounded-full border-2 border-white ${ticket.status === 'pending' ? 'bg-amber-400' : ticket.status === 'active' ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-xs font-black text-gray-900">{ticket.id}</span>
                                                <span className="text-[10px] text-gray-400 font-bold">{formatTimeAgo(ticket.created_at)}</span>
                                            </div>
                                            <div className="text-xs font-bold text-gray-700">{ticket.customer_name}</div>
                                            <div className="text-[10px] text-gray-500 mb-2">{ticket.issue_type}</div>
                                            {ticket.agent_name && (
                                                <div className="flex items-center bg-gray-50 rounded-lg p-2">
                                                    <div className="h-4 w-4 rounded-full bg-amber-100 flex items-center justify-center text-[8px] font-bold text-amber-700 mr-2">
                                                        {ticket.agent_name.charAt(0)}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-gray-600">Assigned: {ticket.agent_name}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupervisorDashboardView;
