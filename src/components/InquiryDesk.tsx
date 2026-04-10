'use client';

import React, { useState, useEffect } from 'react';
import { getBackendApiUrl } from '@/lib/apiConfig';
import {
    Mail,
    Clock,
    CheckCircle,
    AlertCircle,
    User,
    MessageSquare,
    Search,
    ChevronRight,
    Filter,
    Inbox,
    RefreshCw
} from 'lucide-react';

interface Inquiry {
    id: string;
    _id: string;
    full_name: string;
    email: string;
    subject: string;
    message: string;
    status: 'pending' | 'in_progress' | 'resolved' | 'closed';
    assigned_agent: string | null;
    assigned_agent_id?: string | null;
    agent_notes: string | null;
    resolution_note: string | null;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    created_at: string;
    updated_at: string;
    resolved_at: string | null;
}

interface InquiryStats {
    total: number;
    pending: number;
    in_progress: number;
    resolved: number;
    closed: number;
    by_priority: {
        low: number;
        medium: number;
        high: number;
        urgent: number;
    };
}

export default function InquiryDesk() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [filteredInquiries, setFilteredInquiries] = useState<Inquiry[]>([]);
    const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
    const [stats, setStats] = useState<InquiryStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterPriority, setFilterPriority] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [agentNotes, setAgentNotes] = useState('');
    const [resolutionNote, setResolutionNote] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userId, setUserId] = useState('');
    const [userRole, setUserRole] = useState('user');

    const getUserContext = () => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return { id: '', email: '', role: 'user' };
            const user = JSON.parse(userStr);
            return {
                id: String(user.id || user._id || '').trim(),
                email: String(user.email || '').toLowerCase(),
                role: String(user.role || 'user').toLowerCase()
            };
        } catch {
            return { id: '', email: '', role: 'user' };
        }
    };

    useEffect(() => {
        const context = getUserContext();
        setUserId(context.id);
        setUserEmail(context.email);
        setUserRole(context.role);

        loadInquiries();
        loadStats();

        const interval = setInterval(() => {
            loadInquiries();
            loadStats();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        applyFilters();
    }, [inquiries, filterStatus, filterPriority, searchQuery, userRole, userId, userEmail, selectedInquiry]);

    const loadInquiries = async () => {
        try {
            const context = getUserContext();
            const scope = context.role === 'admin' || context.role === 'supervisor' ? 'all' : 'mine';
            const response = await fetch(`${getBackendApiUrl()}/api/inquiries?scope=${scope}`, {
                headers: {
                    'x-user-id': context.id,
                    'x-user-email': context.email,
                    'x-user-role': context.role
                }
            });
            const data = await response.json();
            if (data.success) {
                setInquiries(data.inquiries);
            }
        } catch (error) {
            console.error('Failed to load inquiries:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const context = getUserContext();
            const scope = context.role === 'admin' || context.role === 'supervisor' ? 'all' : 'mine';
            const response = await fetch(`${getBackendApiUrl()}/api/inquiries/stats/summary?scope=${scope}`, {
                headers: {
                    'x-user-id': context.id,
                    'x-user-email': context.email,
                    'x-user-role': context.role
                }
            });
            const data = await response.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    const applyFilters = () => {
        let filtered = [...inquiries];
        const isPrivileged = userRole === 'admin' || userRole === 'supervisor';
        const isOwnedByCurrentUser = (inquiry: Inquiry) => {
            const assignedId = String(inquiry.assigned_agent_id || '').trim();
            const assignedEmail = String(inquiry.assigned_agent || '').toLowerCase();
            return (userId && assignedId === userId) || (!!userEmail && assignedEmail === userEmail.toLowerCase());
        };

        // Strict non-privileged visibility: only own inquiries.
        if (!isPrivileged) {
            filtered = filtered.filter(isOwnedByCurrentUser);
        }

        if (filterStatus !== 'all') filtered = filtered.filter(i => i.status === filterStatus);
        if (filterPriority !== 'all') filtered = filtered.filter(i => i.priority === filterPriority);
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(i =>
                i.full_name.toLowerCase().includes(query) ||
                i.email.toLowerCase().includes(query) ||
                i.subject.toLowerCase().includes(query) ||
                i.message.toLowerCase().includes(query)
            );
        }
        setFilteredInquiries(filtered);

        // Auto-clear selection if current record no longer belongs to this user in strict mode.
        if (!isPrivileged && selectedInquiry && !isOwnedByCurrentUser(selectedInquiry)) {
            setSelectedInquiry(null);
        }
    };

    const handleAssignToMe = async (inquiryId: string) => {
        try {
            const context = getUserContext();
            const response = await fetch(`${getBackendApiUrl()}/api/inquiries/${inquiryId}/assign`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agent_id: context.id || undefined,
                    agent_email: context.email
                })
            });

            const data = await response.json();
            if (data.success) {
                loadInquiries();
                if (selectedInquiry?.id === inquiryId) {
                    setSelectedInquiry(data.inquiry);
                }
            }
        } catch (error) {
            console.error('Failed to assign inquiry:', error);
        }
    };

    const handleUpdateStatus = async (inquiryId: string, status: string) => {
        try {
            const response = await fetch(`${getBackendApiUrl()}/api/inquiries/${inquiryId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status,
                    resolution_note: status === 'resolved' || status === 'closed' ? resolutionNote : null
                })
            });

            const data = await response.json();
            if (data.success) {
                loadInquiries();
                loadStats();
                if (selectedInquiry?.id === inquiryId) {
                    setSelectedInquiry(data.inquiry);
                }
                setResolutionNote('');
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleAddNotes = async (inquiryId: string) => {
        if (!agentNotes.trim()) return;
        try {
            const response = await fetch(`${getBackendApiUrl()}/api/inquiries/${inquiryId}/notes`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes: agentNotes })
            });
            const data = await response.json();
            if (data.success) {
                loadInquiries();
                if (selectedInquiry?.id === inquiryId) setSelectedInquiry(data.inquiry);
                setAgentNotes('');
            }
        } catch (error) {
            console.error('Failed to add notes:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'resolved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'closed': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'text-red-600 bg-red-50 border-red-100';
            case 'high': return 'text-yellow-600 bg-yellow-50 border-yellow-100';
            case 'medium': return 'text-amber-600 bg-amber-50 border-amber-100';
            case 'low': return 'text-green-600 bg-green-50 border-green-100';
            default: return 'text-gray-600 bg-gray-50 border-gray-100';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mb-4"></div>
                    <p className="text-gray-500 text-sm font-medium">Loading Inquiry Desk...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 overflow-hidden">
            {/* Top Bar: Integrated Header & Stats */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 rounded-lg">
                        <Inbox className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 leading-tight">Inquiry Desk</h1>
                        <p className="text-xs text-gray-500 font-medium">Support Ticket Management</p>
                    </div>
                </div>

                {stats && (
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100 min-w-max">
                            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                            <span className="text-xs text-gray-600 font-medium">Total:</span>
                            <span className="text-xs font-bold text-gray-900">{stats.total}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-100 min-w-max">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                            <span className="text-xs text-amber-700 font-medium">Pending:</span>
                            <span className="text-xs font-bold text-amber-900">{stats.pending}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-100 min-w-max">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <span className="text-xs text-blue-700 font-medium">In Progress:</span>
                            <span className="text-xs font-bold text-blue-900">{stats.in_progress}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100 min-w-max">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span className="text-xs text-emerald-700 font-medium">Resolved:</span>
                            <span className="text-xs font-bold text-emerald-900">{stats.resolved}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 min-w-max">
                            <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                            <span className="text-xs text-slate-700 font-medium">Closed:</span>
                            <span className="text-xs font-bold text-slate-900">{stats.closed}</span>
                        </div>
                        <button onClick={() => { loadInquiries(); loadStats(); }} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors ml-2">
                            <RefreshCw className="h-4 w-4 text-gray-400" />
                        </button>
                    </div>
                )}
            </div>

            {/* Main Workspace */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel: List View */}
                <div className="w-full md:w-1/3 lg:w-[350px] bg-white border-r border-gray-200 flex flex-col z-0">
                    {/* Search & Filter Bar */}
                    <div className="p-3 border-b border-gray-100 flex flex-col gap-2 bg-gray-50/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="flex-1 px-2 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-600 focus:border-amber-500 outline-none"
                            >
                                <option value="all">Status: All</option>
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                            </select>
                            <select
                                value={filterPriority}
                                onChange={(e) => setFilterPriority(e.target.value)}
                                className="flex-1 px-2 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-600 focus:border-amber-500 outline-none"
                            >
                                <option value="all">Priority: All</option>
                                <option value="urgent">Urgent</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                            </select>
                        </div>
                    </div>

                    {/* Scrollable List */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredInquiries.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                                <Filter className="h-10 w-10 mb-2 opacity-20" />
                                <p className="text-xs">No inquiries found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {filteredInquiries.map((inquiry) => (
                                    <div
                                        key={inquiry.id}
                                        onClick={() => setSelectedInquiry(inquiry)}
                                        className={`p-4 cursor-pointer transition-all hover:bg-gray-50 group relative ${selectedInquiry?.id === inquiry.id ? 'bg-amber-50/60' : ''}`}
                                    >
                                        {selectedInquiry?.id === inquiry.id && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
                                        )}
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={`text-sm font-semibold truncate pr-2 ${selectedInquiry?.id === inquiry.id ? 'text-amber-900' : 'text-gray-900'}`}>
                                                {inquiry.subject}
                                            </h3>
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap">{formatDate(inquiry.created_at)}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getPriorityColor(inquiry.priority)} capitalize`}>
                                                {inquiry.priority}
                                            </span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getStatusColor(inquiry.status)} capitalize`}>
                                                {inquiry.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-gray-500 truncate">{inquiry.full_name}</p>
                                            <ChevronRight className={`h-4 w-4 text-gray-300 transition-transform ${selectedInquiry?.id === inquiry.id ? 'translate-x-1 text-amber-500' : 'group-hover:translate-x-1'}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Detail View */}
                <div className="hidden md:flex flex-1 flex-col bg-gray-50 overflow-hidden relative">
                    {selectedInquiry ? (
                        <div className="flex flex-col h-full bg-white m-4 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Detail Header */}
                            <div className="px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10 flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-1">{selectedInquiry.subject}</h2>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <div className="flex items-center gap-1.5">
                                            <User className="h-4 w-4" />
                                            <span className="font-medium text-gray-700">{selectedInquiry.full_name}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Mail className="h-4 w-4" />
                                            <span>{selectedInquiry.email}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(selectedInquiry.status)} capitalize flex items-center gap-1.5`}>
                                        {selectedInquiry.status === 'resolved' && <CheckCircle className="h-3 w-3" />}
                                        {selectedInquiry.status.replace('_', ' ')}
                                    </div>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Customer Message Bubble */}
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-bold border border-gray-200">
                                            {selectedInquiry.full_name.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-none p-5 shadow-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                                            {selectedInquiry.message}
                                        </div>
                                        <p className="mt-1.5 text-xs text-gray-400 ml-1">Received on {formatDate(selectedInquiry.created_at)}</p>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="relative flex py-2 items-center">
                                    <div className="flex-grow border-t border-gray-100"></div>
                                    <span className="flex-shrink-0 mx-4 text-xs text-gray-400 uppercase tracking-widest font-bold">Timeline</span>
                                    <div className="flex-grow border-t border-gray-100"></div>
                                </div>

                                {/* Agent Notes */}
                                {selectedInquiry.agent_notes && (
                                    <div className="ml-14 bg-amber-50/50 border border-amber-100 rounded-xl p-4 text-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <User className="h-3 w-3 text-amber-600" />
                                            <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Internal Note</span>
                                        </div>
                                        <p className="text-gray-700">{selectedInquiry.agent_notes}</p>
                                    </div>
                                )}

                                {/* Resolution Note */}
                                {selectedInquiry.resolution_note && (
                                    <div className="ml-14 bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 text-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle className="h-3 w-3 text-emerald-600" />
                                            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Resolution</span>
                                        </div>
                                        <p className="text-gray-700">{selectedInquiry.resolution_note}</p>
                                        <p className="mt-2 text-[10px] text-emerald-600 text-right italic">
                                            Resolved on {selectedInquiry.resolved_at ? formatDate(selectedInquiry.resolved_at) : 'recently'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Action Bar (Sticky Bottom) */}
                            <div className="p-4 bg-gray-50 border-t border-gray-200">
                                {!selectedInquiry.assigned_agent ? (
                                    <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Unassigned Inquiry</p>
                                            <p className="text-xs text-gray-500">Take ownership to start working on this ticket.</p>
                                        </div>
                                        <button
                                            onClick={() => handleAssignToMe(selectedInquiry.id)}
                                            className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-transform active:scale-95 shadow-lg shadow-gray-200"
                                        >
                                            Assign to Me
                                        </button>
                                    </div>
                                ) : (
                                    ((userRole === 'admin' || userRole === 'supervisor') ||
                                        (userId && String(selectedInquiry.assigned_agent_id || '').trim() === userId) ||
                                        String(selectedInquiry.assigned_agent || '').toLowerCase() === userEmail.toLowerCase()
                                    ) ? (
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <textarea
                                                value={agentNotes}
                                                onChange={(e) => setAgentNotes(e.target.value)}
                                                placeholder="Add internal note..."
                                                rows={1}
                                                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm resize-none"
                                            />
                                            <button
                                                onClick={() => handleAddNotes(selectedInquiry.id)}
                                                disabled={!agentNotes.trim()}
                                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                                            >
                                                Note
                                            </button>
                                        </div>

                                        {selectedInquiry.status !== 'resolved' && (
                                            <div className="flex gap-2 items-center bg-white p-2 rounded-lg border border-gray-200">
                                                <input
                                                    type="text"
                                                    value={resolutionNote}
                                                    onChange={(e) => setResolutionNote(e.target.value)}
                                                    placeholder="Resolution details..."
                                                    className="flex-1 px-3 py-1.5 text-sm outline-none bg-transparent"
                                                />
                                                <div className="h-6 w-px bg-gray-200"></div>
                                                <button
                                                    onClick={() => handleUpdateStatus(selectedInquiry.id, 'resolved')}
                                                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 px-3 py-1.5 hover:bg-emerald-50 rounded transition-colors"
                                                >
                                                    Resolve
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    ) : (
                                    <div className="w-full py-2 px-4 bg-amber-50 border border-amber-100 rounded-lg text-center">
                                        <p className="text-xs text-amber-800 font-medium">
                                            Locked: Assigned to <span className="font-bold">another agent</span>
                                        </p>
                                    </div>
                                    )
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-50">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                <MessageSquare className="h-10 w-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No Inquiry Selected</h3>
                            <p className="text-gray-500 max-w-xs mx-auto">Select a ticket from the list on the left to view details and take action.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
