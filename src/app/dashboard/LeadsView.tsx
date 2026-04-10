
import { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Plus, FileText, Phone, Mail, Building, User, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { formatToIST } from '../../lib/dateUtils';

interface Lead {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status: string;
    companyName: string;
    assignedTo?: {
        _id: string;
        name: string;
        email: string;
    };
    createdAt: string;
}

interface LeadsViewProps {
    viewType: 'all' | 'my';
    initialStatus?: string;
    agentEmail: string;
    onNavigate: (view: string) => void;
}

const LeadsView = ({ viewType, initialStatus = 'All', agentEmail, onNavigate }: LeadsViewProps) => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(initialStatus);

    useEffect(() => {
        fetchLeads();
    }, [viewType, statusFilter]); // Refetch when view type or status changes

    const fetchLeads = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (viewType === 'my') {
                params.append('assignedTo', agentEmail);
            }
            if (statusFilter !== 'All') {
                params.append('status', statusFilter);
            }

            const response = await fetch(`/api/admin/leads?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setLeads(data.leads || []);
            }
        } catch (error) {
            console.error('Failed to fetch leads', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Client-side search filtering (or can be moved to API if preferred)
    const filteredLeads = leads.filter(lead => {
        const searchLower = searchTerm.toLowerCase();
        return (
            lead.firstName.toLowerCase().includes(searchLower) ||
            lead.lastName.toLowerCase().includes(searchLower) ||
            lead.email.toLowerCase().includes(searchLower) ||
            (lead.companyName && lead.companyName.toLowerCase().includes(searchLower))
        );
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'New': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'Contacted': return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'Queued': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'Verifying': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
            case 'Active': return 'bg-green-50 text-green-700 border-green-200';
            case 'Rejected': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden h-full">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {viewType === 'my' ? 'My Leads' : 'All Leads'}
                        </h1>
                        <p className="text-gray-500 mt-1">
                            {viewType === 'my' ? 'Manage your assigned partner prospects.' : 'Overview of all partner onboarding leads.'}
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors">
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                        </button>
                        <button
                            onClick={() => onNavigate('admin_add_lead')}
                            className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium text-sm transition-colors shadow-sm shadow-amber-200"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Lead
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="mt-6 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search leads by name, email, or company..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center space-x-3 w-full md:w-auto">
                        <div className="relative min-w-[180px]">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <select
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="All">All Status</option>
                                <option value="New">New</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Queued">Queued</option>
                                <option value="Verifying">Verifying</option>
                                <option value="Active">Active</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {isLoading ? (
                        <div className="p-12 flex justify-center items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                        </div>
                    ) : filteredLeads.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <User className="h-8 w-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No leads found</h3>
                            <p className="text-gray-500 text-sm">Try adjusting your filters or add a new lead.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">
                                            <input type="checkbox" className="rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                                        </th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name & Company</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned To</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredLeads.map((lead) => (
                                        <tr key={lead._id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <input type="checkbox" className="rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center text-amber-700 font-bold mr-3">
                                                        {lead.firstName.charAt(0)}{lead.lastName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{lead.firstName} {lead.lastName}</div>
                                                        {lead.companyName && (
                                                            <div className="text-xs text-gray-500 flex items-center mt-0.5">
                                                                <Building className="h-3 w-3 mr-1" />
                                                                {lead.companyName}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Mail className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                                        {lead.email}
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Phone className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                                        {lead.phone}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(lead.status)}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${lead.status === 'Active' ? 'bg-green-500' : 'bg-current'}`}></span>
                                                    {lead.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {lead.assignedTo ? (
                                                    <div className="flex items-center">
                                                        <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] mr-2">
                                                            {lead.assignedTo.name.charAt(0)}
                                                        </div>
                                                        <span className="text-sm text-gray-600">{lead.assignedTo.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400 italic">Unassigned</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {formatToIST(lead.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                                    <MoreVertical className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination (Static for now) */}
                    {filteredLeads.length > 0 && (
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredLeads.length}</span> of <span className="font-medium">{filteredLeads.length}</span> results
                            </div>
                            <div className="flex space-x-2">
                                <button className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50" disabled>
                                    <ChevronLeft className="h-4 w-4 text-gray-500" />
                                </button>
                                <button className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50" disabled>
                                    <ChevronRight className="h-4 w-4 text-gray-500" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LeadsView;
