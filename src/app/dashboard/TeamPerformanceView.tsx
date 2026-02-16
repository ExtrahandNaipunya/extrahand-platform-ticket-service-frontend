
import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Clock, Award, Star, ArrowUpRight, ArrowDownRight, MessageSquare, Target, Zap, Activity, ShieldCheck, Search, Filter, Download } from 'lucide-react';
import { formatDateTimeToIST } from '../../lib/dateUtils';

interface AgentStats {
    agent_email: string;
    name: string;
    total_chats: number;
    resolved_chats: number;
    resolution_rate: number;
    avg_rating: string;
    avg_duration: string;
    last_active?: string | null;
}

const TeamPerformanceView = () => {
    const [agents, setAgents] = useState<AgentStats[]>([]);
    const [filteredAgents, setFilteredAgents] = useState<AgentStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
    const [searchQuery, setSearchQuery] = useState('');

    const parseDuration = (durationStr: string): number => {
        if (!durationStr) return 0;
        const minutes = durationStr.match(/(\d+)m/)?.[1] || '0';
        const seconds = durationStr.match(/(\d+)s/)?.[1] || '0';
        return parseInt(minutes) * 60 + parseInt(seconds);
    };

    useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('http://localhost:8001/api/admin/stats/agents');
                if (response.ok) {
                    const data = await response.json();
                    if (data.agents && data.agents.length > 0) {
                        // Add name field from email
                        const agentsWithNames = data.agents.map((agent: any) => ({
                            ...agent,
                            name: agent.agent_email.split('@')[0],
                            last_active: agent.last_active || null
                        }));
                        setAgents(agentsWithNames);
                        setFilteredAgents(agentsWithNames);
                    } else {
                        setAgents([]);
                        setFilteredAgents([]);
                    }
                } else {
                    setAgents([]);
                    setFilteredAgents([]);
                }
            } catch (error) {
                console.error('Failed to fetch agent performance', error);
                setAgents([]);
                setFilteredAgents([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, [timeRange]);

    // Filter agents based on search query
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredAgents(agents);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = agents.filter(agent =>
                agent.agent_email.toLowerCase().includes(query) ||
                agent.name.toLowerCase().includes(query)
            );
            setFilteredAgents(filtered);
        }
    }, [searchQuery, agents]);

    const sortedByRating = [...filteredAgents].sort((a, b) => parseFloat(b.avg_rating) - parseFloat(a.avg_rating));

    const handleExport = () => {
        if (!agents || agents.length === 0) return;

        const headers = ["Rank,Agent Email,Total Chats,Average Rating,Average Duration\n"];
        const csvContent = sortedByRating.map((agent, index) => {
            return `${index + 1},${agent.agent_email},${agent.total_chats},${agent.avg_rating},${agent.avg_duration}`;
        }).join("\n");

        const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `team_performance_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex-1 flex flex-col bg-gray-50/50 overflow-hidden h-full">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-5 shadow-sm sticky top-0 z-10">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Team Analytics</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            {(['24h', '7d', '30d'] as const).map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timeRange === range ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {range.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        <button onClick={handleExport} className="p-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm" title="Export Report">
                            <Download className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-8 custom-scrollbar">
                {/* Performance table area */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-10 py-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Agent League Table</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Ranking by overall effectiveness</p>
                        </div>
                        <div className="relative hidden md:block">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search agents..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none w-64 transition-all"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank & Identity</th>
                                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Volume</th>
                                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Success Rate</th>
                                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Satisfaction</th>
                                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Avg Resolution</th>
                                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Last Seen</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                            Loading data...
                                        </td>
                                    </tr>
                                ) : sortedByRating.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                            {searchQuery ? 'No agents found matching your search' : 'No agent performance data available'}
                                        </td>
                                    </tr>
                                ) : (
                                    sortedByRating.map((agent, index) => (
                                        <tr key={agent.agent_email} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0 group">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100 font-bold text-amber-600 text-xs">
                                                        #{index + 1}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 text-sm tracking-tight">{agent.name}</div>
                                                        <div className="text-[10px] text-gray-400 font-medium">{agent.agent_email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="font-bold text-gray-900 text-base">
                                                    {agent.resolved_chats} <span className="text-xs font-medium text-gray-400">/ {agent.total_chats}</span>
                                                </div>
                                                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Resolved / Total</div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className={`font-black text-base ${agent.resolution_rate >= 80 ? 'text-green-600' : agent.resolution_rate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                                    {agent.resolution_rate}<span className="text-gray-400 font-bold ml-0.5">%</span>
                                                </div>
                                                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Success Rate</div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="inline-flex items-center space-x-1">
                                                    <Star className="h-3.5 w-3.5 text-amber-400 fill-current" />
                                                    <span className="font-bold text-gray-900 text-base">{agent.avg_rating}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="font-bold text-gray-900 text-base">{agent.avg_duration}</div>
                                                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Avg Duration</div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="text-[10px] text-gray-500 font-medium">
                                                    {agent.last_active ? formatDateTimeToIST(agent.last_active) : 'Never'}
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
        </div>
    );
};

export default TeamPerformanceView;
