import { useState, useEffect } from 'react';
import { Search, MoreVertical, Trash2, Edit2, Eye, CheckCircle, AlertCircle, Plus, ChevronDown, Key, Ban, RefreshCw, UserPlus, Users, UserCheck, UserX, TrendingUp } from 'lucide-react';
import { formatDateToIST, formatDateTimeToIST } from '../../lib/dateUtils';
import { getBackendApiUrl } from '@/lib/apiConfig';

interface User {
    _id: string;
    name: string;
    email: string;
    role: 'user' | 'admin' | 'supervisor';
    status: 'active' | 'inactive' | 'suspended' | 'pending';
    lastActive?: string;
    createdAt: string;
}

interface UserManagementViewProps {
    onNavigate: (view: string) => void;
}

const UserManagementView = ({ onNavigate }: UserManagementViewProps) => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    // Modals state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState<User['role']>('user');
    const [isRoleUpdating, setIsRoleUpdating] = useState(false);

    // Invite Modal State
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('user');
    const [inviteTeam, setInviteTeam] = useState('');
    const [inviteDepartment, setInviteDepartment] = useState('');
    const [isInviting, setIsInviting] = useState(false);

    const handleInvite = async () => {
        if (!inviteEmail) {
            alert('Email is required');
            return;
        }

        setIsInviting(true);
        try {
            const response = await fetch(`${getBackendApiUrl()}/api/admin/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: inviteEmail,
                    role: inviteRole,
                    team: inviteTeam,
                    department: inviteDepartment
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message || 'Invitation sent successfully');
                setShowInviteModal(false);
                setInviteEmail('');
                setInviteRole('user');
                setInviteTeam('');
                setInviteDepartment('');
                fetchUsers(); // Refresh list to see pending user
            } else {
                alert(data.error || 'Failed to send invitation');
            }
        } catch (error) {
            console.error('Invite error:', error);
            alert('Failed to send invitation. Please try again.');
        } finally {
            setIsInviting(false);
        }
    };

    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    // Stats
    const stats = {
        total: users.length,
        active: users.filter(u => u.status === 'active').length,
        suspended: users.filter(u => u.status === 'suspended').length,
        newThisMonth: users.filter(u => {
            const date = new Date(u.createdAt);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }).length
    };

    useEffect(() => {
        fetchUsers();
        const interval = setInterval(fetchUsers, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${getBackendApiUrl()}/api/admin/users`);
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (action: string, user: User) => {
        switch (action) {
            case 'suspend':
            case 'activate':
                if (!confirm(`Are you sure you want to ${action} this user?`)) return;
                try {
                    const response = await fetch(`${getBackendApiUrl()}/api/admin/users/${user._id}/${action === 'suspend' ? 'suspend' : 'activate'}`, {
                        method: 'PUT',
                    });
                    if (response.ok) {
                        fetchUsers();
                    } else {
                        alert('Failed to update status');
                    }
                } catch (e) {
                    console.error(e);
                    alert('Error updating status');
                }
                break;
            case 'delete':
                if (!confirm(`Are you sure you want to DELETE ${user.name}? This cannot be undone.`)) return;
                try {
                    const response = await fetch(`${getBackendApiUrl()}/api/admin/users/${user._id}`, {
                        method: 'DELETE',
                    });
                    if (response.ok) {
                        fetchUsers();
                    } else {
                        alert('Failed to delete user');
                    }
                } catch (e) {
                    console.error(e);
                    alert('Error deleting user');
                }
                break;
            case 'password':
                setSelectedUser(user);
                setShowPasswordModal(true);
                break;
            case 'view':
                setSelectedUser(user);
                setSelectedRole(user.role);
                setShowDetailModal(true);
                break;
        }
        setActiveDropdown(null);
    };

    const handleChangePassword = async () => {
        if (!selectedUser || !newPassword) return;
        if (newPassword.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }

        try {
            const response = await fetch(`${getBackendApiUrl()}/api/admin/users/${selectedUser._id}/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword }),
            });

            if (response.ok) {
                alert('Password updated successfully');
                setShowPasswordModal(false);
                setNewPassword('');
                setSelectedUser(null);
            } else {
                alert('Failed to update password');
            }
        } catch (error) {
            console.error('Failed to change password:', error);
            alert('Error updating password');
        }
    };

    const handleRoleChange = async () => {
        if (!selectedUser || selectedRole === selectedUser.role) return;
        setIsRoleUpdating(true);
        try {
            const response = await fetch(`${getBackendApiUrl()}/api/admin/users/${selectedUser._id}/role`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: selectedRole }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to update role');
            }
            alert(data.message || 'Role updated successfully');
            setSelectedUser((prev) => (prev ? { ...prev, role: selectedRole } : prev));
            setUsers((prev) => prev.map((u) => (u._id === selectedUser._id ? { ...u, role: selectedRole } : u)));
        } catch (error: any) {
            console.error('Failed to update role:', error);
            alert(error.message || 'Error updating role');
        } finally {
            setIsRoleUpdating(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
        return matchesSearch && matchesRole && matchesStatus;
    });

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-700';
            case 'supervisor': return 'bg-amber-100 text-amber-700';
            case 'user': return 'bg-blue-100 text-blue-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'active': return 'text-green-600 bg-green-50';
            case 'suspended': return 'text-red-600 bg-red-50';
            case 'pending': return 'text-amber-600 bg-amber-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100">
                <h1 className="text-xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-500 text-sm">Manage admin users, update roles, and control access</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-xs font-medium text-gray-500">Total Users</p>
                                <h3 className="text-xl font-bold text-gray-900">{stats.total}</h3>
                            </div>
                            <div className="p-1.5 bg-blue-50 rounded-lg">
                                <Users className="h-4 w-4 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-xs font-medium text-gray-500">Active</p>
                                <h3 className="text-xl font-bold text-green-600">{stats.active}</h3>
                            </div>
                            <div className="p-1.5 bg-green-50 rounded-lg">
                                <UserCheck className="h-4 w-4 text-green-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-xs font-medium text-gray-500">Suspended</p>
                                <h3 className="text-xl font-bold text-red-600">{stats.suspended}</h3>
                            </div>
                            <div className="p-1.5 bg-red-50 rounded-lg">
                                <UserX className="h-4 w-4 text-red-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-xs font-medium text-gray-500">New This Month</p>
                                <h3 className="text-xl font-bold text-gray-900">{stats.newThisMonth}</h3>
                            </div>
                            <div className="p-1.5 bg-indigo-50 rounded-lg">
                                <TrendingUp className="h-4 w-4 text-indigo-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters & Actions */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-3 p-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div className="flex-1 flex gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by email or name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                                />
                            </div>
                            <div className="flex gap-2">
                                <select
                                    value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value)}
                                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                                >
                                    <option value="all">All Roles</option>
                                    <option value="admin">Admin</option>
                                    <option value="supervisor">Supervisor</option>
                                    <option value="user">Agent</option>
                                </select>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="suspended">Suspended</option>
                                    <option value="pending">Pending</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={fetchUsers}
                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                                title="Refresh"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setShowInviteModal(true)}
                                className="flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors shadow-sm shadow-amber-200"
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Create Invite
                            </button>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-semibold text-sm text-gray-800">Admin Users</h3>
                        <span className="text-xs text-gray-500">Showing {filteredUsers.length} users</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Active</th>
                                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                                <p className="text-sm text-gray-500">Loading users...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                            No users found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-4 py-2">
                                                <div className="text-sm font-medium text-gray-900">{user.email}</div>
                                            </td>
                                            <td className="px-4 py-2">
                                                <div className="text-sm text-gray-700">{user.name}</div>
                                            </td>
                                            <td className="px-4 py-2">
                                                <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(user.status)}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${user.status === 'active' ? 'bg-green-500' : user.status === 'suspended' ? 'bg-red-500' : 'bg-gray-400'}`}></span>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-xs text-gray-500">
                                                {formatDateToIST(user.createdAt)}
                                            </td>
                                            <td className="px-4 py-2 text-xs text-gray-700 font-medium">
                                                {user.lastActive ? formatDateTimeToIST(user.lastActive) : 'Never'}
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                <div className="flex items-center justify-end gap-2 relative">
                                                    <button
                                                        onClick={() => handleAction('view', user)}
                                                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                                                    >
                                                        View
                                                    </button>
                                                    <div className="relative">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveDropdown(activeDropdown === user._id ? null : user._id);
                                                            }}
                                                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </button>

                                                        {activeDropdown === user._id && (
                                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-50 py-1 text-left">
                                                                <button
                                                                    onClick={() => handleAction(user.status === 'suspended' ? 'activate' : 'suspend', user)}
                                                                    className={`w-full px-4 py-2.5 text-xs font-medium flex items-center hover:bg-gray-50 ${user.status === 'suspended' ? 'text-green-600' : 'text-red-600'}`}
                                                                >
                                                                    {user.status === 'suspended' ? (
                                                                        <><CheckCircle className="h-4 w-4 mr-2" /> Activate User</>
                                                                    ) : (
                                                                        <><Ban className="h-4 w-4 mr-2" /> Suspend User</>
                                                                    )}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleAction('password', user)}
                                                                    className="w-full px-4 py-2.5 text-xs font-medium text-gray-700 flex items-center hover:bg-gray-50"
                                                                >
                                                                    <Key className="h-4 w-4 mr-2 text-gray-400" />
                                                                    Change Password
                                                                </button>
                                                                <div className="h-px bg-gray-100 my-1"></div>
                                                                <button
                                                                    onClick={() => handleAction('delete', user)}
                                                                    className="w-full px-4 py-2.5 text-xs font-medium text-red-600 flex items-center hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    Delete User
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
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
            {/* Invite Modal (New) */}
            {showInviteModal && (
                <div
                    className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setShowInviteModal(false)}
                    role="presentation"
                >
                    <div
                        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl transform transition-all"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Create Admin Invite</h2>
                                    <p className="text-gray-500 text-sm mt-1">Send an invite email to a new admin user. They can login with any Microsoft account.</p>
                                </div>
                                <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <ChevronDown className="h-6 w-6 transform rotate-180" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="space-y-1">
                                    <label className="block text-sm font-semibold text-gray-700">Email *</label>
                                    <input
                                        type="email"
                                        placeholder="user@example.com"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-shadow"
                                    />
                                    <p className="text-xs text-gray-400">For notification only</p>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-sm font-semibold text-gray-700">Role *</label>
                                    <div className="relative">
                                        <select
                                            value={inviteRole}
                                            onChange={(e) => setInviteRole(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-shadow cursor-pointer"
                                        >
                                            <option value="user">Agent</option>
                                            <option value="supervisor">Supervisor</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-sm font-semibold text-gray-700">Team (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="Onboarding Team"
                                        value={inviteTeam}
                                        onChange={(e) => setInviteTeam(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-shadow"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-sm font-semibold text-gray-700">Department (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="Operations"
                                        value={inviteDepartment}
                                        onChange={(e) => setInviteDepartment(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-shadow"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleInvite}
                                disabled={isInviting}
                                className={`w-auto px-6 py-3 bg-amber-400 hover:bg-amber-500 text-white font-semibold rounded-lg shadow-lg shadow-amber-200 transition-all flex items-center justify-center ${isInviting ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isInviting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Sending Invite...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-5 w-5 mr-2" />
                                        Create & Send Invite
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {showPasswordModal && selectedUser && (
                <div
                    className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setShowPasswordModal(false)}
                    role="presentation"
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm transform transition-all scale-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Change Password</h3>
                            <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600">
                                <ChevronDown className="h-5 w-5 transform rotate-180" />
                            </button>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4 flex items-center">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-xs mr-3">
                                {selectedUser.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">{selectedUser.name}</p>
                                <p className="text-xs text-gray-500">{selectedUser.email}</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters long.</p>
                            </div>
                            <button
                                onClick={handleChangePassword}
                                className="w-full bg-amber-600 text-white py-2.5 rounded-lg font-medium hover:bg-amber-700 transition-colors shadow-lg shadow-amber-200"
                            >
                                Update Password
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Details Modal (Read Only / Quick View) */}
            {showDetailModal && selectedUser && (
                <div
                    className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setShowDetailModal(false)}
                    role="presentation"
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 flex items-center">
                                <UserCheck className="h-5 w-5 mr-2 text-gray-500" />
                                User Details
                            </h3>
                            <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600">
                                <ChevronDown className="h-5 w-5 transform rotate-180" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="flex items-start space-x-4 mb-6">
                                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-2xl font-bold border-4 border-white shadow-md">
                                    {selectedUser.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-gray-900">{selectedUser.name}</h2>
                                    <p className="text-gray-500">{selectedUser.email}</p>
                                    <div className="flex gap-2 mt-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getRoleBadgeColor(selectedUser.role)} bg-opacity-10 border-opacity-20`}>
                                            {selectedUser.role.toUpperCase()}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusStyle(selectedUser.status)} bg-opacity-10 border-opacity-20`}>
                                            {selectedUser.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <span className="text-xs text-gray-500 block mb-1">User ID</span>
                                    <span className="font-mono text-gray-700 select-all">{selectedUser._id}</span>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <span className="text-xs text-gray-500 block mb-1">Created At</span>
                                    <span className="font-medium text-gray-900">{formatDateToIST(selectedUser.createdAt)}</span>
                                </div>
                            </div>

                            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <span className="text-xs text-gray-500 block mb-1">Role</span>
                                        <select
                                            value={selectedRole}
                                            onChange={(e) => setSelectedRole(e.target.value as User['role'])}
                                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                                        >
                                            <option value="user">Agent</option>
                                            <option value="supervisor">Supervisor</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={handleRoleChange}
                                        disabled={isRoleUpdating || selectedRole === selectedUser.role}
                                        className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isRoleUpdating ? 'Updating...' : 'Update Role'}
                                    </button>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end space-x-3 border-t border-gray-100 pt-4">
                                <button
                                    onClick={() => {
                                        setShowDetailModal(false);
                                        handleAction('delete', selectedUser);
                                    }}
                                    className="px-4 py-2 rounded-lg text-sm font-medium border border-red-200 text-red-700 hover:bg-red-50"
                                >
                                    Delete User
                                </button>
                                <button
                                    onClick={() => handleAction(selectedUser.status === 'active' ? 'suspend' : 'activate', selectedUser)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border ${selectedUser.status === 'active' ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : 'border-green-200 text-green-700 hover:bg-green-50'}`}
                                >
                                    {selectedUser.status === 'active' ? 'Suspend Access' : 'Activate Access'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDetailModal(false);
                                        setShowPasswordModal(true);
                                    }}
                                    className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600"
                                >
                                    Reset Password
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagementView;
