import { useState, useEffect } from 'react';
import { FileText, Search, Filter, Eye, Edit, User, Clock, Tag, AlertCircle, CheckCircle, XCircle, MoreVertical, Download, ExternalLink, Calendar, MessageSquare, ChevronDown, Trash2, ArrowUpDown, Loader2 } from 'lucide-react';
import { formatToIST, formatTimeAgo } from '../../lib/dateUtils';
import { getBackendApiUrl } from '@/lib/apiConfig';

interface Ticket {
    id: string;
    ticket_id: string;
    customer_name: string;
    customer_email: string;
    agent_email: string | null;
    status: 'pending' | 'active' | 'closed';
    issue_category_label: string;
    issue_type_label: string;
    created_at: string;
    closed_at: string | null;
    rating: number | null;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
}

interface ChatMessage {
    content: string;
    sender: string;
    sender_type: string;
    timestamp: string;
}

interface AllTicketsViewProps {
    onNavigate?: (view: string, data?: any) => void;
    userEmail?: string;
    userName?: string;
}

const AllTicketsView = ({ onNavigate, userEmail, userName }: AllTicketsViewProps) => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'closed'>('all');
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
    const [chatLogs, setChatLogs] = useState<ChatMessage[]>([]);
    const [showLogsModal, setShowLogsModal] = useState(false);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const [isJoiningChat, setIsJoiningChat] = useState(false);
    const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchAllTickets();
        const interval = setInterval(fetchAllTickets, 15000); // 15s refresh
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let filtered = [...tickets];

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(t => t.status === statusFilter);
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(t =>
                t.ticket_id?.toLowerCase().includes(query) ||
                t.customer_name?.toLowerCase().includes(query) ||
                t.customer_email?.toLowerCase().includes(query) ||
                t.issue_category_label?.toLowerCase().includes(query) ||
                (t.agent_email && t.agent_email.toLowerCase().includes(query))
            );
        }

        // Sorting
        filtered.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
        });

        setFilteredTickets(filtered);
    }, [tickets, statusFilter, searchQuery, sortBy]);

    const fetchAllTickets = async () => {
        try {
            const response = await fetch(`${getBackendApiUrl()}/api/supervisor/tickets/all`);
            if (response.ok) {
                const data = await response.json();
                // Add mock priority for production feel
                const enhancedTickets = (data.tickets || []).map((t: any) => ({
                    ...t,
                    priority: t.status === 'pending' ? 'high' : t.status === 'active' ? 'medium' : 'low'
                }));
                setTickets(enhancedTickets);
            }
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchChatLogs = async (ticketId: string) => {
        setIsLoadingLogs(true);
        setChatLogs([]);
        try {
            const response = await fetch(`${getBackendApiUrl()}/api/ticket/history/${ticketId}`);
            if (response.ok) {
                const data = await response.json();
                setChatLogs(data.messages || []);
            } else {
                setChatLogs([]);
            }
        } catch (error) {
            console.error('Failed to fetch chat logs:', error);
            setChatLogs([]);
        } finally {
            setIsLoadingLogs(false);
        }
    };

    const handleJoinChat = async (ticket: Ticket) => {
        if (!userEmail) {
            setActionMessage({ type: 'error', text: 'User session not found. Please re-login.' });
            setTimeout(() => setActionMessage(null), 3000);
            return;
        }

        setIsJoiningChat(true);
        setActionMessage(null);

        try {
            // If ticket is pending, assign it to the current user first
            if (ticket.status === 'pending') {
                const assignResponse = await fetch(`${getBackendApiUrl()}/api/supervisor/tickets/${ticket.id}/assign`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ agent_email: userEmail })
                });

                if (!assignResponse.ok) {
                    throw new Error('Failed to assign ticket');
                }
            }

            // Navigate to the chat view with the session info
            if (onNavigate) {
                onNavigate('chat', {
                    sessionId: ticket.id,
                    ticketId: ticket.ticket_id,
                    customerName: ticket.customer_name,
                    customerEmail: ticket.customer_email
                });
            }

            setSelectedTicket(null);
            setActionMessage({ type: 'success', text: 'Joining chat...' });
        } catch (error) {
            console.error('Failed to join chat:', error);
            setActionMessage({ type: 'error', text: 'Failed to join chat. Please try again.' });
        } finally {
            setIsJoiningChat(false);
            setTimeout(() => setActionMessage(null), 3000);
        }
    };

    const handleViewLogs = async (ticket: Ticket) => {
        setShowLogsModal(true);
        await fetchChatLogs(ticket.ticket_id);
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'active': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'closed': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getPriorityStyles = (priority?: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-500 text-white';
            case 'high': return 'bg-red-100 text-red-700';
            case 'medium': return 'bg-orange-100 text-orange-700';
            case 'low': return 'bg-blue-100 text-blue-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const handleExport = () => {
        if (!tickets || tickets.length === 0) return;

        const headers = ["Ticket ID,Customer,Email,Status,Agent,Created At,Closed At,Rating\n"];
        const csvContent = tickets.map((t) => {
            return `${t.ticket_id},${t.customer_name},${t.customer_email},${t.status},${t.agent_email || 'Unassigned'},${t.created_at},${t.closed_at || ''},${t.rating || ''}`;
        }).join("\n");

        const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `tickets_report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex-1 flex flex-col bg-gray-50/50 overflow-hidden h-full">
            {/* Action Message Toast */}
            {actionMessage && (
                <div className={`fixed top-4 right-4 z-[200] px-6 py-3 rounded-xl shadow-lg font-bold text-sm ${actionMessage.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {actionMessage.text}
                </div>
            )}

            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-5 shadow-sm sticky top-0 z-10">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ticket Repository</h1>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button onClick={handleExport} className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm font-semibold text-sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export Data
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-8 custom-scrollbar">
                {/* Search & Filters Bar */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                    <div className="flex flex-col xl:flex-row gap-6">
                        {/* Search Input */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by Ticket ID, Customer Name, Email, or Agent..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 rounded-xl outline-none transition-all font-medium text-sm border hover:border-gray-200"
                            />
                        </div>

                        {/* Filter Group */}
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                                <button
                                    onClick={() => setStatusFilter('all')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${statusFilter === 'all' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setStatusFilter('pending')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${statusFilter === 'pending' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    Pending
                                </button>
                                <button
                                    onClick={() => setStatusFilter('active')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${statusFilter === 'active' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    Active
                                </button>
                                <button
                                    onClick={() => setStatusFilter('closed')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${statusFilter === 'closed' ? 'bg-green-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    Closed
                                </button>
                            </div>

                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-xs text-gray-600 focus:ring-2 focus:ring-amber-500 transition-all uppercase tracking-wider"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tickets Grid View */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center">
                            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Syncing Tickets...</p>
                        </div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="bg-white rounded-2xl p-20 text-center border-2 border-dashed border-gray-100">
                            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search className="h-10 w-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No tickets found</h3>
                            <p className="text-gray-500 max-w-xs mx-auto">We couldn't find any tickets matching your search criteria. Try a different query or clear your filters.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredTickets.map((ticket) => (
                                <div
                                    key={ticket.id}
                                    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all group flex items-center"
                                >
                                    {/* Status Column */}
                                    <div className="flex flex-col items-center justify-center border-r border-gray-50 pr-8 mr-8 w-32 shrink-0">
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border mb-2 ${getStatusStyles(ticket.status)}`}>
                                            {ticket.status}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{formatTimeAgo(ticket.created_at)}</div>
                                    </div>

                                    {/* Content Column */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <span className="text-sm font-black text-amber-600 transition-colors group-hover:text-amber-700">{ticket.ticket_id}</span>
                                            <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${getPriorityStyles(ticket.priority)}`}>
                                                {ticket.priority || 'Medium'}
                                            </div>
                                            <span className="text-xs font-bold text-gray-300 px-2">•</span>
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest truncate">{ticket.issue_category_label}</span>
                                        </div>
                                        <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-amber-700 transition-colors truncate">
                                            {ticket.customer_name}
                                        </h3>
                                        <p className="text-sm text-gray-500 truncate max-w-xl">{ticket.issue_type_label}</p>
                                    </div>

                                    {/* Assignment Column */}
                                    <div className="px-8 border-l border-gray-50 shrink-0 hidden lg:block">
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Assigned To</div>
                                        {ticket.agent_email ? (
                                            <div className="flex items-center space-x-3">
                                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-black shadow-sm">
                                                    {ticket.agent_email.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-bold text-gray-700">{ticket.agent_email.split('@')[0]}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center text-gray-400 italic text-xs space-x-2">
                                                <AlertCircle className="h-4 w-4 text-amber-400" />
                                                <span className="font-bold">Awaiting Agent</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Column */}
                                    <div className="ml-8 border-l border-gray-50 pl-8 shrink-0">
                                        <button
                                            onClick={() => setSelectedTicket(ticket)}
                                            className="bg-gray-50 hover:bg-amber-500 hover:text-white p-3 rounded-xl transition-all shadow-sm group/btn"
                                            title="View Details"
                                        >
                                            <Eye className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Ticket Detail Modal */}
            {selectedTicket && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 scale-in-center">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0">
                            <div className="flex items-center space-x-6">
                                <div className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] border-2 ${getStatusStyles(selectedTicket.status)}`}>
                                    {selectedTicket.status}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">{selectedTicket.ticket_id}</h2>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                                        Opened {formatTimeAgo(selectedTicket.created_at)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedTicket(null)}
                                className="p-3 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all border border-gray-100 shadow-sm"
                            >
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                {/* Left Side: Details */}
                                <div>
                                    <section className="mb-10">
                                        <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.25em] mb-4">Customer Segment</h4>
                                        <div className="flex items-center space-x-4 bg-gray-50 p-6 rounded-[2rem]">
                                            <div className="h-16 w-16 rounded-[1.25rem] bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-2xl font-black shadow-xl">
                                                {selectedTicket.customer_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-lg font-black text-gray-900">{selectedTicket.customer_name}</div>
                                                <div className="text-sm font-bold text-gray-500">{selectedTicket.customer_email}</div>
                                            </div>
                                        </div>
                                    </section>

                                    <section>
                                        <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.25em] mb-4">Issue Intelligence</h4>
                                        <div className="space-y-6">
                                            <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Category</div>
                                                <div className="text-sm font-black text-gray-900">{selectedTicket.issue_category_label}</div>
                                            </div>
                                            <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Issue Description</div>
                                                <div className="text-sm font-bold text-gray-700 leading-relaxed">{selectedTicket.issue_type_label}</div>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                {/* Right Side: metadata & actions */}
                                <div>
                                    <section className="mb-10">
                                        <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.25em] mb-4">Audit & Log</h4>
                                        <div className="bg-white border border-gray-100 rounded-[2rem] p-8 space-y-6 shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <Calendar className="h-4 w-4 text-amber-500" />
                                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Created At</span>
                                                </div>
                                                <span className="text-xs font-black text-gray-900">{formatToIST(selectedTicket.created_at)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <User className="h-4 w-4 text-amber-500" />
                                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Handle Agent</span>
                                                </div>
                                                <span className="text-xs font-black text-gray-900">{selectedTicket.agent_email ? selectedTicket.agent_email.split('@')[0] : 'UNASSIGNED'}</span>
                                            </div>
                                            {selectedTicket.rating && (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <Tag className="h-4 w-4 text-amber-500" />
                                                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">CSAT Score</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <span className="text-xs font-black text-amber-500">{selectedTicket.rating}</span>
                                                        <span className="text-[10px] text-gray-500 font-bold">/ 5.0</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    <div className="grid grid-cols-1 gap-4">
                                        <button
                                            onClick={() => handleViewLogs(selectedTicket)}
                                            className="flex items-center justify-center p-5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] shadow-lg shadow-amber-200 transition-all active:scale-95 space-x-2"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            <span>Full Logs</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Logs Modal */}
            {showLogsModal && selectedTicket && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-lg font-black text-gray-900">Chat Logs</h3>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{selectedTicket.ticket_id}</p>
                            </div>
                            <button
                                onClick={() => setShowLogsModal(false)}
                                className="p-2 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all border border-gray-100"
                            >
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {isLoadingLogs ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Loading logs...</p>
                                </div>
                            ) : chatLogs.length === 0 ? (
                                <div className="text-center py-12">
                                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 font-bold">No messages found for this ticket</p>
                                </div>
                            ) : (
                                chatLogs.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex ${msg.sender_type === 'customer' ? 'justify-start' : msg.sender_type === 'agent' ? 'justify-end' : 'justify-center'}`}
                                    >
                                        {msg.sender_type === 'system' ? (
                                            <div className="bg-gray-100 text-gray-500 text-xs font-medium px-4 py-2 rounded-full">
                                                {msg.content}
                                            </div>
                                        ) : (
                                            <div className={`max-w-[75%] p-4 rounded-2xl ${msg.sender_type === 'customer'
                                                ? 'bg-gray-100 text-gray-900 rounded-bl-none'
                                                : 'bg-amber-500 text-white rounded-br-none'
                                                }`}>
                                                <div className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">
                                                    {msg.sender_type === 'customer' ? 'Customer' : 'Agent'}
                                                </div>
                                                <p className="text-sm font-medium">{msg.content}</p>
                                                <div className="text-[10px] mt-2 opacity-60">
                                                    {formatToIST(msg.timestamp)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AllTicketsView;
