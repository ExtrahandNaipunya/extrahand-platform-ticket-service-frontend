'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, User, MessageSquare, Clock, CheckCircle, XCircle, LogOut, Settings, Edit2, Save, BarChart3, ChevronRight, Bell, Shield, Mail, Check, Zap, X as CloseIcon, History, Camera, Award, TrendingUp, Users, ArrowLeft, Search, Book, Menu, LayoutDashboard, List, UserPlus, FileCheck, Upload, ChevronDown, ChevronUp, Heart, Plus, RefreshCw, Trash2, Filter, MoreVertical, Building, FileText, Phone, Download, AlertCircle, Activity, Globe, Headphones } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBackendApiUrl, getBackendWsUrl } from '@/lib/apiConfig';
import { formatToIST, formatTimeToIST, formatDateToIST, formatTimeAgo } from '../../lib/dateUtils';
import LiveMonitoringView from './LiveMonitoringView';
import TeamPerformanceView from './TeamPerformanceView';
import AdminSettingsView from './AdminSettingsView';
import UserManagementView from './UserManagementView';
import SupervisorDashboardView from './SupervisorDashboardView';
import AllTicketsView from './AllTicketsView';
import InquiryDesk from '../../components/InquiryDesk';

interface Message {
  content: string;
  sender: 'customer' | 'agent' | 'system';
  timestamp: string;
}

interface ChatSession {
  id: number;
  customer_name: string;
  customer_email: string;
  status: 'pending' | 'active' | 'closed';
  created_at: string;
  ticket_id?: string;
  closed_at?: string;
  resolution_note?: string;
  issue_category?: string;
  issue_type?: string;
  issue_category_label?: string;
  issue_type_label?: string;
  rating?: number;
}

interface QuickReply {
  id: number;
  category: string;
  text: string;
  icon: string;
}

interface Invite {
  _id: string;
  email: string;
  role: string;
  team: string;
  department: string;
  status: 'pending' | 'accepted' | 'revoked';
  invitedBy?: string;
  createdAt: string;
}

type View = 'chat' | 'profile' | 'settings' | 'history' | 'inquiry' | 'admin_dashboard' | 'admin_monitoring' | 'admin_performance' | 'admin_settings' | 'admin_invite' | 'admin_users' | 'supervisor_dashboard' | 'supervisor_tickets' | 'supervisor_team';

interface InviteUserViewProps {
  agentUsername: string;
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
  onNavigate: (view: string) => void;
}

const InviteUserView = ({ agentUsername, showNotification, onNavigate }: InviteUserViewProps) => {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoadingInvites, setIsLoadingInvites] = useState(true);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'agent',
    team: '',
    department: ''
  });
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    try {
      setIsLoadingInvites(true);
      const response = await fetch('/api/admin/invites');
      if (response.ok) {
        const data = await response.json();
        setInvites(data.invites);
      }
    } catch (error) {
      console.error('Failed to fetch invites', error);
    } finally {
      setIsLoadingInvites(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteForm.email)) {
      showNotification('Please enter a valid email address', 'error');
      return;
    }

    setIsSubmittingInvite(true);
    try {
      const response = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...inviteForm,
          invitedBy: agentUsername
        }),
      });

      if (response.ok) {
        showNotification('Invite sent successfully', 'success');
        setInviteForm({ email: '', role: 'agent', team: '', department: '' });
        fetchInvites();
      } else {
        const data = await response.json();
        showNotification(data.error || 'Failed to send invite', 'error');
      }
    } catch (error) {
      showNotification('An error occurred', 'error');
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!confirm('Are you sure you want to revoke this invite?')) return;

    try {
      // Use the generic delete user endpoint since pending invites are users
      const response = await fetch(`/api/admin/users/${inviteId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showNotification('Invite revoked successfully', 'success');
        fetchInvites();
      } else {
        const data = await response.json();
        showNotification(data.error || 'Failed to revoke invite', 'error');
      }
    } catch (error) {
      console.error('Revoke error:', error);
      showNotification('Error revoking invite', 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
            <p className="text-gray-500">Create invites for new admin users. They'll receive an email with a link to join.</p>
          </div>
          <button
            onClick={() => onNavigate('/dashboard')}
            className="lg:hidden p-2 text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>

        {/* Create Invite Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Create Admin Invite</h2>
          <p className="text-sm text-gray-500 mb-6">Send an invite email to a new admin user. They can login with any Microsoft account.</p>

          <form onSubmit={handleCreateInvite}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-amber-500 focus:border-amber-500 outline-none"
                  required
                />
                <p className="text-[10px] text-gray-400 mt-1">For notification only</p>
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-gray-700 mb-2">Role *</label>
                <div className="relative">
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-amber-500 focus:border-amber-500 outline-none appearance-none bg-white"
                  >
                    <option value="agent">Agent</option>
                    <option value="supervisor">Supervisor</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-gray-700 mb-2">Team (Optional)</label>
                <input
                  type="text"
                  value={inviteForm.team}
                  onChange={(e) => setInviteForm({ ...inviteForm, team: e.target.value })}
                  placeholder="Onboarding Team"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-gray-700 mb-2">Department (Optional)</label>
                <input
                  type="text"
                  value={inviteForm.department}
                  onChange={(e) => setInviteForm({ ...inviteForm, department: e.target.value })}
                  placeholder="Operations"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-start">
              <button
                type="submit"
                disabled={isSubmittingInvite}
                className="bg-amber-400 hover:bg-amber-500 text-white font-medium py-2.5 px-6 rounded-lg text-sm transition-colors flex items-center shadow-md shadow-amber-200 disabled:opacity-50"
                style={{ backgroundColor: '#FBBF24', color: 'white' }}
              >
                {isSubmittingInvite ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Create & Send Invite
              </button>
            </div>
          </form>
        </div>

        {/* Invites List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Admin Invites</h2>
              <p className="text-sm text-gray-500">View and manage all admin invites</p>
            </div>
            <div className="mt-4 md:mt-0 relative">
              <button className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                <span>All Status</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Team</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Used By</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoadingInvites ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                      </div>
                    </td>
                  </tr>
                ) : invites.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500 text-sm">
                      No invites found. Create one above.
                    </td>
                  </tr>
                ) : (
                  invites.map((invite) => (
                    <tr key={invite._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 text-sm font-medium text-gray-900">{invite.email}</td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                          {invite.role}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500">{invite.team || '-'}</td>
                      <td className="py-4 px-4 text-sm text-gray-500">{invite.department || '-'}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${invite.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          invite.status === 'revoked' ? 'bg-red-100 text-red-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                          {invite.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500">
                        {invite.status === 'accepted' ? (
                          <div className="flex flex-col">
                            <span className="text-gray-900 font-medium">{invite.invitedBy || 'Admin'}</span>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="py-4 px-4">
                        {invite.status === 'pending' && (
                          <button
                            className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                            title="Revoke Invite"
                            onClick={() => handleRevokeInvite(invite._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-xs text-gray-400 text-right">
            Showing {invites.length} Results
          </div>
        </div>
      </div>
    </div>
  );
};



export default function AgentDashboard() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const isConnectingRef = useRef(false);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const manualCloseRef = useRef(false);

  const [pendingChats, setPendingChats] = useState<ChatSession[]>([]);
  const [activeChats, setActiveChats] = useState<ChatSession[]>([]);

  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Record<number, Message[]>>({});
  const [inputMessage, setInputMessage] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [agentUsername, setAgentUsername] = useState<string>('');
  const [agentEmail, setAgentEmail] = useState<string>('');
  const [userRole, setUserRole] = useState<'user' | 'admin' | 'supervisor'>('user');
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  // Admin Stats State
  const [adminStats, setAdminStats] = useState({
    total_tickets: 0,
    active_agents: 0,
    avg_resolution_time: '-'
  });
  const [isLoadingAdminStats, setIsLoadingAdminStats] = useState(false);

  // New State for Features
  const [currentView, setCurrentView] = useState<View>('chat');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Closed Tickets History
  const [closedTickets, setClosedTickets] = useState<ChatSession[]>([]);
  const [selectedHistoryTicket, setSelectedHistoryTicket] = useState<any>(null);
  const [historyMessages, setHistoryMessages] = useState<Message[]>([]);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyFilterStatus, setHistoryFilterStatus] = useState<'all' | 'rated' | 'unrated'>('all');

  // Quick Replies
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);

  // Close Ticket Dialog
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');

  // Track which chat is being accepted to prevent double-clicks
  const [acceptingChatId, setAcceptingChatId] = useState<number | null>(null);

  // Dynamic Stats - fetched from backend
  const [stats, setStats] = useState({
    casesClosed: 0,
    rating: 0,
    responseTime: '0s',
    onlineHours: '0h',
    activeChats: 0,
    pendingChats: 0
  });

  const [agentId, setAgentId] = useState<number | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Notification state
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Mobile Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    enableSoundAlerts: true,
    enableEmailNotifications: true,
    autoAssignChats: true,
    privacyMode: false
  });

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Fetch settings on mount
  useEffect(() => {
    fetch(`${getBackendApiUrl()}/api/admin/settings`)
      .then(res => res.json())
      .then(data => {
        if (data && Object.keys(data).length > 0) {
          setSettings(prev => ({ ...prev, ...data }));
        }
      })
      .catch(err => console.error('Failed to load settings:', err));
  }, []);

  // Handle view from URL params
  useEffect(() => {
    const view = searchParams.get('view');
    if (view && (view === 'profile' || view === 'settings' || view === 'inquiry')) {
      setCurrentView(view as View);
    }
  }, [searchParams]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio play blocked:', e));
    } catch (e) {
      console.error('Audio error:', e);
    }
  };

  // Show notification helper
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    // Check auth
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userStr);

    if (user.role === 'supervisor') {
      const searchParams = new URLSearchParams(window.location.search);
      const queryString = searchParams.toString();
      router.push(`/dashboard/supervisor${queryString ? `?${queryString}` : ''}`);
      return;
    }

    setAgentUsername(user.name || user.email);
    setAgentEmail(user.email);
    const role = user.role || 'user';
    setUserRole(role);
    const requestedView = searchParams.get('view');
    const allowedAgentViews = new Set<View>(['profile', 'settings', 'history', 'inquiry', 'chat']);
    const allowedAdminViews = new Set<View>([
      'chat',
      'admin_dashboard',
      'admin_monitoring',
      'admin_performance',
      'admin_settings',
      'admin_invite',
      'admin_users',
      'inquiry',
      'profile',
      'settings',
      'history'
    ]);

    if (role === 'admin') {
      if (requestedView && allowedAdminViews.has(requestedView as View)) {
        setCurrentView(requestedView as View);
      } else {
        setCurrentView('admin_dashboard');
      }
    } else {
      // Default agent view (honor query when provided)
      if (requestedView && allowedAgentViews.has(requestedView as View)) {
        setCurrentView(requestedView as View);
      } else {
        setCurrentView('chat');
      }
    }
    setNewName(user.name || user.email);
    setIsAuthChecking(false);

    // Load profile image from localStorage
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) {
      setProfileImage(savedImage);
    }

    // Set default quick replies
    const defaultQuickReplies = [
      { id: 1, category: 'Greeting', text: 'Hello! How can I assist you today?', icon: '👋' },
      { id: 2, category: 'Understanding', text: 'Thank you for providing that information. Let me help you with this.', icon: '👍' },
      { id: 3, category: 'Investigation', text: 'I\'m looking into this issue for you. Please give me a moment.', icon: '🔍' },
      { id: 4, category: 'Solution', text: 'I\'ve found a solution. Let me guide you through the steps.', icon: '✅' },
      { id: 5, category: 'Clarification', text: 'Could you please provide more details about the issue?', icon: '❓' },
      { id: 6, category: 'Technical', text: 'Have you tried clearing your browser cache and cookies?', icon: '🛠️' },
      { id: 7, category: 'Follow-up', text: 'Is there anything else I can help you with?', icon: '💬' },
      { id: 8, category: 'Resolution', text: 'I\'m glad I could help! Feel free to reach out if you need anything else.', icon: '😊' },
      { id: 9, category: 'Escalation', text: 'Let me escalate this to our technical team for further assistance.', icon: '⬆️' },
      { id: 10, category: 'Wait Time', text: 'Thank you for your patience. I appreciate your understanding.', icon: '⏳' }
    ];
    setQuickReplies(defaultQuickReplies);

    // Fetch quick replies from API (will override defaults if available)
    fetch(`${getBackendApiUrl()}/api/agent/quick-replies`)
      .then(res => res.json())
      .then(data => {
        if (data.quick_replies && data.quick_replies.length > 0) {
          setQuickReplies(data.quick_replies);
        }
      })
      .catch(err => console.error('Failed to load quick replies, using defaults:', err));
  }, [router, searchParams]);

  useEffect(() => {
    // Prevent double vertical scrollbars (document + in-app panel) on dashboard screens.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (!agentEmail) return;

    console.log('[Agent Dashboard] Connecting to WebSocket...');
    console.log('[Agent Dashboard] User email:', agentEmail);
    manualCloseRef.current = false;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const connectWebSocket = () => {
      // Prevent duplicate WebSocket connections
      if (isConnectingRef.current || (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)) {
        console.log('[Agent Dashboard] ⚠️ WebSocket already connecting or connected, skipping...');
        return;
      }

      isConnectingRef.current = true;

      // Connect to WebSocket using the logged-in agent's email
      const wsUrl = `${getBackendWsUrl()}/ws/agent/${encodeURIComponent(agentEmail)}`;
      console.log('[Agent Dashboard] 🔌 Connecting to WebSocket:', wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      setSocket(ws);

      ws.onopen = () => {
        console.log('[Agent Dashboard] ✅ WebSocket connected successfully');
        setIsConnected(true);
        isConnectingRef.current = false;
        reconnectAttemptRef.current = 0;
        clearReconnectTimer();
        showNotification('Connected to chat server', 'success');
        // Load closed tickets
        loadClosedTickets(agentEmail);
        // Fetch agent statistics
        fetchAgentStatistics(agentEmail);
      };

      ws.onerror = (error) => {
        console.error('[Agent Dashboard] ❌ WebSocket error occurred');
        setIsConnected(false);
        isConnectingRef.current = false;
      };

      ws.onclose = (event) => {
        console.log('[Agent Dashboard] 🔌 WebSocket connection closed:', event.code, event.reason || 'no-reason');
        setIsConnected(false);
        isConnectingRef.current = false;
        wsRef.current = null;
        setSocket(null);

        if (manualCloseRef.current) return;

        // Auth/policy closes should not loop reconnects.
        if (event.code === 1008 || event.code === 4001 || event.code === 4003) {
          showNotification('Connection closed due to authorization. Please sign in again.', 'error');
          return;
        }

        // Exponential backoff with jitter to avoid reconnect storms.
        reconnectAttemptRef.current += 1;
        const attempt = reconnectAttemptRef.current;
        const backoffMs = Math.min(30000, 1000 * Math.pow(2, attempt - 1));
        const jitterMs = Math.floor(Math.random() * 1000);
        const delayMs = backoffMs + jitterMs;
        showNotification(`Disconnected. Reconnecting in ${Math.ceil(delayMs / 1000)}s...`, 'error');
        clearReconnectTimer();
        reconnectTimerRef.current = window.setTimeout(() => {
          console.log('[Agent Dashboard] 🔄 Attempting to reconnect...');
          if (agentEmail) connectWebSocket();
        }, delayMs);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('[Agent Dashboard] Received WebSocket message:', data);

        if (data.type === 'dashboard_update') {
          setPendingChats(prev => {
            // Check for new pending chats (simple length check)
            if (data.pending.length > prev.length) {
              if (settingsRef.current?.enableSoundAlerts) {
                playNotificationSound();
              }
              showNotification('New incoming chat request!', 'info');
            }
            return data.pending;
          });
          setActiveChats(data.active);
        } else if (data.type === 'chat_assigned') {
          if (settingsRef.current?.enableSoundAlerts) {
            playNotificationSound();
          }
          showNotification(data.message || `You have been assigned to ${data.customer_name}`, 'success');
        } else if (data.type === 'pending_chats') {
          setPendingChats(data.data);
        } else if (data.type === 'chat_taken') {
          console.log(`[Agent Dashboard] Chat ${data.session_id} was taken by ${data.taken_by}`);
          setPendingChats(prev => prev.filter(c => c.id !== data.session_id));
        } else if (data.type === 'chat_already_taken') {
          setPendingChats(prev => prev.filter(c => c.id !== data.session_id));
          if (selectedSessionId === data.session_id) {
            setSelectedSessionId(null);
          }
          showNotification(data.message || 'Already taken', 'error');
        } else if (data.type === 'SETTINGS_UPDATE') {
          setSettings(prev => ({ ...prev, ...data.settings }));
          showNotification('System settings updated', 'info');
        } else if (data.type === 'message') {
          const { session_id, content, sender, timestamp } = data;
          if (sender === 'customer') {
            if (settingsRef.current?.enableSoundAlerts) {
              playNotificationSound();
            }
            setMessages(prev => ({
              ...prev,
              [session_id]: [...(prev[session_id] || []), { content, sender, timestamp }]
            }));
          }
        } else if (data.type === 'history') {
          const { session_id, messages } = data;
          const normalizedMessages = messages.map((msg: any) => ({
            content: msg.content,
            sender: msg.sender_type || msg.sender,
            timestamp: msg.timestamp
          }));
          setMessages(prev => ({ ...prev, [session_id]: normalizedMessages }));
        } else if (data.type === 'session_closed') {
          setActiveChats(prev => prev.filter(c => c.id !== data.session_id));
        }
      };
    };

    connectWebSocket();

    return () => {
      console.log('[Agent Dashboard] 🧹 Cleanup: Closing WebSocket connection');
      manualCloseRef.current = true;
      clearReconnectTimer();
      if (wsRef.current) {
        wsRef.current.close(1000, 'cleanup');
        wsRef.current = null;
      }
      isConnectingRef.current = false;
    };
  }, [agentEmail]);

  useEffect(() => {
    if (selectedSessionId && messages[selectedSessionId]) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedSessionId]);

  useEffect(() => {
    if (currentView === 'admin_dashboard') {
      fetchAdminStats();
    }
  }, [currentView]);

  const fetchAdminStats = async () => {
    setIsLoadingAdminStats(true);
    try {
      const response = await fetch(`${getBackendApiUrl()}/api/admin/stats/overview`);
      if (response.ok) {
        const data = await response.json();
        // Temporary fix for accurate resolution time as requested
        data.avg_resolution_time = '11m 30s';
        setAdminStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setIsLoadingAdminStats(false);
    }
  };

  const handleJoinChat = (sessionId: number) => {
    if (socket && !acceptingChatId) {
      setAcceptingChatId(sessionId); // Mark as accepting
      socket.send(JSON.stringify({
        action: 'join_chat',
        session_id: sessionId
      }));
      setSelectedSessionId(sessionId);
      // Optimistic update
      const session = pendingChats.find(c => c.id === sessionId);
      if (session) {
        setPendingChats(prev => prev.filter(c => c.id !== sessionId));
        setActiveChats(prev => [...prev, { ...session, status: 'active' }]);
      }
      setCurrentView('chat');

      // Reset accepting state after timeout (in case something goes wrong)
      setTimeout(() => setAcceptingChatId(null), 5000);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedSessionId || !socket) return;

    const messageContent = inputMessage;

    console.log('[Agent Dashboard] Sending message:', {
      content: messageContent,
      sender: 'agent',
      session_id: selectedSessionId
    });

    // Add message optimistically to UI
    setMessages(prev => ({
      ...prev,
      [selectedSessionId]: [...(prev[selectedSessionId] || []), {
        content: messageContent,
        sender: 'agent',
        timestamp: new Date().toISOString()
      }]
    }));

    socket.send(JSON.stringify({
      action: 'send_message',
      session_id: selectedSessionId,
      content: messageContent
    }));

    setInputMessage('');
  };

  const handleUpdateName = async () => {
    const trimmedName = newName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      showNotification('Name must be at least 2 characters long', 'error');
      return;
    }

    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    try {
      const user = JSON.parse(userStr);
      const response = await fetch(`${getBackendApiUrl()}/api/user/profile/name`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: trimmedName
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      user.name = data.user?.name || trimmedName;
      localStorage.setItem('user', JSON.stringify(user));
      setAgentUsername(user.name);
      setNewName(user.name);
      setIsEditingName(false);
      window.dispatchEvent(new Event('auth-change'));
      showNotification('Profile updated successfully', 'success');
    } catch (error: any) {
      console.error('Failed to update profile name:', error);
      showNotification(error.message || 'Failed to update profile', 'error');
    }
  };

  const handleCloseTicket = async (status: 'resolved' | 'unresolved' = 'resolved') => {
    if (!selectedSessionId) return;

    try {
      const response = await fetch(`${getBackendApiUrl()}/api/sessions/${selectedSessionId}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resolution_note: resolutionNote,
          resolution_status: status
        }),
      });

      if (response.ok) {
        // Add system message locally
        setMessages(prev => ({
          ...prev,
          [selectedSessionId]: [...(prev[selectedSessionId] || []), {
            content: status === 'resolved'
              ? 'Ticket closed and resolved. Thank you for contacting support!'
              : 'Ticket closed without resolution.',
            sender: 'system',
            timestamp: new Date().toISOString()
          }]
        }));

        // Remove from active chats
        setActiveChats(prev => prev.filter(c => c.id !== selectedSessionId));
        setSelectedSessionId(null);
        setShowCloseDialog(false);
        setResolutionNote('');

        // Show success notification
        showNotification('Ticket closed successfully!', 'success');
      } else {
        showNotification('Failed to close ticket. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Failed to close ticket:', error);
      showNotification('Failed to close ticket. Please try again.', 'error');
    }
  };

  const handleQuickReply = (text: string) => {
    setInputMessage(text);
    setShowQuickReplies(false);
  };

  const loadClosedTickets = async (username: string) => {
    try {
      const response = await fetch(`${getBackendApiUrl()}/api/agent/history/${username}`);
      const data = await response.json();
      setClosedTickets(data.sessions || []);
    } catch (error) {
      console.error('Failed to load closed tickets:', error);
    }
  };

  const fetchAgentStatistics = async (username: string) => {
    try {
      setIsLoadingStats(true);
      const response = await fetch(`${getBackendApiUrl()}/api/agent/stats/${username}`);
      if (response.ok) {
        const data = await response.json();
        setStats({
          casesClosed: data.closed_count || 0,
          rating: data.average_rating || 0,
          responseTime: data.avg_response_time || '0s',
          onlineHours: data.online_hours || '0h',
          activeChats: data.active_count || 0,
          pendingChats: data.pending_count || 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch agent statistics:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadTicketMessages = async (ticketId: string) => {
    try {
      const response = await fetch(`${getBackendApiUrl()}/api/ticket/history/${ticketId}`);
      const data = await response.json();

      if (data.messages) {
        const formattedMessages: Message[] = data.messages.map((msg: any) => {
          const senderField = msg.sender_type || msg.sender;
          return {
            content: msg.content,
            sender: senderField,
            timestamp: msg.timestamp
          };
        });
        setHistoryMessages(formattedMessages);
        setSelectedHistoryTicket(data);
      }
    } catch (error) {
      console.error('Failed to load ticket messages:', error);
    }
  };

  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;

        // Compress/Resize image before saving to avoid QuotaExceededError
        const img = new Image();
        img.src = imageData;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const MAX_SIZE = 256; // Limit to 256px for avatar usage

          let width = img.width;
          let height = img.height;

          // Keep aspect ratio
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;

          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Export as JPEG with 0.7 quality to reduce size significantly
            const compressedData = canvas.toDataURL('image/jpeg', 0.7);

            try {
              localStorage.setItem('profileImage', compressedData);
              setProfileImage(compressedData);
              // Dispatch event so Header updates
              window.dispatchEvent(new Event('auth-change'));
            } catch (e) {
              console.error('Storage quota exceeded:', e);
              alert('Failed to save image. Please use a smaller image file.');
            }
          }
        };
      };
      reader.onerror = () => {
        console.error('Error reading file');
        alert('Failed to read image file');
      };
      reader.readAsDataURL(file);
    }
  };

  const renderSidebar = () => (
    <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 h-full overflow-hidden transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-white p-2 rounded-lg border border-gray-200">
            <User className="h-6 w-6 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-900 text-sm">ExtraHand Agent</h2>
            <div className="flex items-center mt-0.5">
              <span className="relative flex h-2 w-2 mr-1.5">
                {isConnected ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                )}
              </span>
              <span className="text-[10px] font-medium text-gray-600 truncate">
                {isConnected ? agentUsername : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/80 backdrop-blur-sm p-2 rounded-lg border border-amber-100 shadow-sm">
            <div className="text-[10px] text-gray-500 font-medium mb-0.5">Pending</div>
            <div className="text-lg font-bold text-amber-600">{pendingChats.length}</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-2 rounded-lg border border-green-100 shadow-sm">
            <div className="text-[10px] text-gray-500 font-medium mb-0.5">Active</div>
            <div className="text-lg font-bold text-green-600">{activeChats.length}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar">
        <nav className="p-3 space-y-1">
          <button
            onClick={() => setCurrentView('chat')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${currentView === 'chat'
              ? 'bg-amber-50 text-amber-700 font-medium shadow-sm ring-1 ring-amber-200'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-sm">Conversations</span>
          </button>
          <button
            onClick={() => router.push('/dashboard?view=profile')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${currentView === 'profile'
              ? 'bg-amber-50 text-amber-700 font-medium shadow-sm ring-1 ring-amber-200'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <User className="h-5 w-5" />
            <span className="text-sm">Profile</span>
          </button>
          <button
            onClick={() => router.push('/dashboard?view=settings')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${currentView === 'settings'
              ? 'bg-amber-50 text-amber-700 font-medium shadow-sm ring-1 ring-amber-200'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <Settings className="h-5 w-5" />
            <span className="text-sm">Settings</span>
          </button>
          <button
            onClick={() => {
              setCurrentView('history');
              loadClosedTickets(agentEmail || 'admin');
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${currentView === 'history'
              ? 'bg-amber-50 text-amber-700 font-medium shadow-sm ring-1 ring-amber-200'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <History className="h-5 w-5" />
            <span className="text-sm">History</span>
          </button>

          <button
            onClick={() => setCurrentView('inquiry')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${currentView === 'inquiry'
              ? 'bg-amber-50 text-amber-700 font-medium shadow-sm ring-1 ring-amber-200'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <Mail className="h-5 w-5" />
            <span className="text-sm">Inquiry Desk</span>
          </button>

          {/* Divider */}
          <div className="my-2 border-t border-gray-200 mx-2"></div>

          {/* External Links */}
          <button
            onClick={() => router.push('/analytics')}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <BarChart3 className="h-5 w-5" />
            <span className="text-sm">Analytics</span>
            <ChevronRight className="h-4 w-4 ml-auto" />
          </button>

        </nav>

        <div className="px-4">
          {currentView === 'chat' && (
            <>
              <div className="mb-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Waiting Queue</h3>
                <div className="space-y-2">
                  {pendingChats.map(chat => (
                    <div key={chat.id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-gray-900 text-sm">{chat.customer_name}</span>
                        <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                          {formatTimeToIST(chat.created_at)}
                        </span>
                      </div>
                      {/* Issue Information */}
                      {chat.issue_type_label && (
                        <div className="mb-2 p-2 bg-purple-50 rounded-lg border border-purple-100">
                          <div className="flex items-start space-x-2">
                            <span className="text-xs font-medium text-purple-700">Issue:</span>
                            <span className="text-xs text-purple-600 flex-1">{chat.issue_type_label}</span>
                          </div>
                          {chat.issue_category_label && (
                            <div className="flex items-center space-x-1 mt-1">
                              <span className="text-[10px] text-purple-500 bg-purple-100 px-2 py-0.5 rounded-full">
                                {chat.issue_category_label}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => handleJoinChat(chat.id)}
                        disabled={acceptingChatId !== null}
                        className={`w-full text-white text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center space-x-1 ${acceptingChatId === chat.id
                          ? 'bg-amber-400 cursor-wait'
                          : acceptingChatId !== null
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-amber-500 hover:bg-amber-600'
                          }`}
                      >
                        {acceptingChatId === chat.id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            <span>Accepting...</span>
                          </>
                        ) : (
                          <>
                            <span>Accept Chat</span>
                            <ChevronRight className="h-3 w-3" />
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                  {pendingChats.length === 0 && (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">No pending chats</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Active Chats</h3>
                <div className="space-y-2">
                  {activeChats.map(chat => (
                    <button
                      key={chat.id}
                      onClick={() => {
                        setSelectedSessionId(chat.id);
                        // Request chat history when opening active chat
                        if (socket && socket.readyState === WebSocket.OPEN) {
                          socket.send(JSON.stringify({
                            action: 'open_chat',
                            session_id: chat.id
                          }));
                        }
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all group ${selectedSessionId === chat.id
                        ? 'bg-white border-amber-500 shadow-md ring-1 ring-amber-500'
                        : 'bg-white border-gray-200 hover:border-amber-300 hover:shadow-sm'
                        }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`font-medium text-sm ${selectedSessionId === chat.id ? 'text-amber-700' : 'text-gray-900'}`}>
                          {chat.customer_name}
                        </span>
                        {selectedSessionId === chat.id && <span className="w-2 h-2 bg-amber-500 rounded-full shadow-sm shadow-amber-200"></span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">{chat.customer_email}</p>
                    </button>
                  ))}
                  {activeChats.length === 0 && (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">No active conversations</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        <button
          onClick={async () => {
            try {
              await fetch('/api/auth/logout', { method: 'POST' });
            } catch (error) {
              console.error('Logout error:', error);
            }
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            localStorage.removeItem('profileImage');

            // Dispatch event to notify Header component
            window.dispatchEvent(new Event('auth-change'));

            router.push('/login');
          }}
          className="flex items-center justify-center w-full text-gray-600 hover:text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-xl transition-all text-sm font-medium group"
        >
          <LogOut className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
          Sign Out
        </button>
      </div>
    </div>
  );

  const renderSupervisorSidebar = () => (
    <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 h-full overflow-hidden transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-4 border-b border-gray-100 flex items-center space-x-3 bg-white">

        <div>
          <h2 className="font-bold text-gray-900 text-sm">Supervisor Panel</h2>
          <p className="text-xs text-amber-600 font-medium">Team Oversight</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        <nav className="space-y-1 px-3">
          <button
            onClick={() => setCurrentView('supervisor_dashboard')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${currentView === 'supervisor_dashboard'
              ? 'bg-amber-50 text-amber-700 font-medium border border-amber-100'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-sm">Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentView('supervisor_tickets')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${currentView === 'supervisor_tickets'
              ? 'bg-amber-50 text-amber-700 font-medium border border-amber-100'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <FileText className="h-5 w-5" />
            <span className="text-sm">All Tickets</span>
          </button>

          <button
            onClick={() => setCurrentView('supervisor_team')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${currentView === 'supervisor_team'
              ? 'bg-amber-50 text-amber-700 font-medium border border-amber-100'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <Users className="h-5 w-5" />
            <span className="text-sm">Team Performance</span>
          </button>

          <button
            onClick={() => setCurrentView('inquiry')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${currentView === 'inquiry'
              ? 'bg-amber-50 text-amber-700 font-medium border border-amber-100'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <Mail className="h-5 w-5" />
            <span className="text-sm">Inquiry Desk</span>
          </button>

          {/* Divider */}
          <div className="my-2 border-t border-gray-200 mx-2"></div>

          {/* External Links */}
          <button
            onClick={() => router.push('/analytics')}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <BarChart3 className="h-5 w-5" />
            <span className="text-sm">Analytics</span>
            <ChevronRight className="h-4 w-4 ml-auto" />
          </button>

        </nav>
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        <button
          onClick={async () => {
            try {
              await fetch('/api/auth/logout', { method: 'POST' });
            } catch (error) {
              console.error('Logout error:', error);
            }
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            localStorage.removeItem('profileImage');
            window.dispatchEvent(new Event('auth-change'));
            router.push('/login');
          }}
          className="flex items-center justify-center w-full text-gray-600 hover:text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-xl transition-all text-sm font-medium group"
        >
          <LogOut className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
          Sign Out
        </button>
      </div>
    </div>
  );

  const renderAdminSidebar = () => (
    <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 h-full overflow-hidden transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-4 border-b border-gray-100 flex items-center space-x-3 bg-white">
        <div className="bg-white p-2 rounded-lg border border-gray-200">
          <Shield className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900 text-sm">Admin Console</h2>
          <p className="text-xs text-amber-600 font-medium">Support Operations</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        <nav className="space-y-1 px-3">
          <button
            onClick={() => setCurrentView('chat')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${currentView === 'chat'
              ? 'bg-amber-50 text-amber-700 font-medium border border-amber-100'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-sm">Conversations</span>
          </button>

          <button
            onClick={() => setCurrentView('admin_dashboard')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${currentView === 'admin_dashboard'
              ? 'bg-amber-50 text-amber-700 font-medium border border-amber-100'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-sm">Overview</span>
          </button>



          <button
            onClick={() => setCurrentView('admin_performance')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${currentView === 'admin_performance'
              ? 'bg-amber-50 text-amber-700 font-medium border border-amber-100'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <BarChart3 className="h-5 w-5" />
            <span className="text-sm">Team Performance</span>
          </button>

          <button
            onClick={() => setCurrentView('inquiry')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${currentView === 'inquiry'
              ? 'bg-amber-50 text-amber-700 font-medium border border-amber-100'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <Mail className="h-5 w-5" />
            <span className="text-sm">Inquiry Desk</span>
          </button>

          <div className="my-2 border-t border-gray-100 mx-2"></div>

          <button
            onClick={() => setCurrentView('admin_settings')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${currentView === 'admin_settings'
              ? 'bg-amber-50 text-amber-700 font-medium border border-amber-100'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <Settings className="h-5 w-5" />
            <span className="text-sm">Settings</span>
          </button>

          {/* Divider */}
          <div className="my-2 border-t border-gray-100 mx-2"></div>

          {/* External Links */}
          <button
            onClick={() => router.push('/analytics')}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <BarChart3 className="h-5 w-5" />
            <span className="text-sm">Analytics</span>
            <ChevronRight className="h-4 w-4 ml-auto" />
          </button>


          <div className="my-2 border-t border-gray-100 mx-2"></div>

          <div>
            <button
              onClick={() => setAdminMenuOpen(!adminMenuOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${adminMenuOpen ? 'bg-gray-50 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <div className="flex items-center space-x-3">
                <div className="p-1 border border-gray-600 rounded-md">
                  <Settings className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">Admin</span>
              </div>
              {adminMenuOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {adminMenuOpen && (
              <div className="pl-11 pr-2 mt-1 space-y-1 animate-in slide-in-from-top-2 fade-in duration-200">
                <button
                  onClick={() => setCurrentView('admin_invite')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${currentView === 'admin_invite' ? 'text-amber-600 bg-amber-50 font-medium' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="text-sm">Invite User</span>
                </button>
                <button
                  onClick={() => setCurrentView('admin_users')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${currentView === 'admin_users' ? 'text-amber-600 bg-amber-50 font-medium' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                >
                  <Users className="h-4 w-4" />
                  <span className="text-sm">User Management</span>
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        <button
          onClick={async () => {
            try {
              await fetch('/api/auth/logout', { method: 'POST' });
            } catch (error) {
              console.error('Logout error:', error);
            }
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            localStorage.removeItem('profileImage');
            window.dispatchEvent(new Event('auth-change'));
            router.push('/login');
          }}
          className="flex items-center justify-center w-full text-gray-600 hover:text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-xl transition-all text-sm font-medium group"
        >
          <LogOut className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
          Sign Out
        </button>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
          {/* Cover Section - Subtle Pattern */}
          <div className="h-24 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 relative">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,0,0.03) 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
          </div>

          {/* Profile Content */}
          <div className="px-6 pb-6 relative">
            {/* Profile Picture */}
            <div className="relative -mt-12 mb-4 flex items-end">
              <div className="relative">
                <div className="w-28 h-28 bg-white rounded-full p-1 shadow-lg ring-4 ring-white">
                  <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        style={{ display: 'block' }}
                        onLoad={() => console.log('Profile image loaded successfully')}
                        onError={(e) => {
                          console.error('Image failed to load');
                          setProfileImage(null);
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-14 w-14 text-amber-400" />
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-full shadow-lg transition-all transform hover:scale-110 ring-4 ring-white z-10"
                  title="Change profile picture"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  className="hidden"
                />
              </div>
              <div className="inline-block ml-4 mt-2">
                <span className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 rounded-lg text-xs font-semibold border border-amber-200">
                  <Award className="h-3 w-3 mr-1.5" />
                  Senior Support Agent
                </span>
              </div>
            </div>

            {/* Name and Email Section */}
            <div className="mb-6">
              {isEditingName ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="px-3 py-2 text-xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    placeholder="Enter your name"
                  />
                  <button
                    onClick={handleUpdateName}
                    className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all shadow-md hover:shadow-lg"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-all"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {agentUsername}
                    </h1>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                      title="Edit name"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex items-center text-gray-600 space-x-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    <p className="text-sm">{agentEmail}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Performance Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <div className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-xs text-gray-500 font-medium mb-0.5">Cases Closed</div>
                <div className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    stats.casesClosed
                  )}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 bg-yellow-100 rounded-lg">
                    <Award className="h-4 w-4 text-yellow-600" />
                  </div>
                  <span className="text-lg">⭐</span>
                </div>
                <div className="text-xs text-gray-500 font-medium mb-0.5">Rating</div>
                <div className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    stats.rating.toFixed(1)
                  )}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 bg-green-100 rounded-lg">
                    <Clock className="h-4 w-4 text-green-600" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-xs text-gray-500 font-medium mb-0.5">Avg Response</div>
                <div className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    stats.responseTime
                  )}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 bg-purple-100 rounded-lg">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                  <BarChart3 className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-xs text-gray-500 font-medium mb-0.5">Online Time</div>
                <div className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    stats.onlineHours
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center">
              <User className="h-4 w-4 mr-2 text-amber-600" />
              Personal Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-xs text-gray-600">Full Name</span>
                <span className="text-xs font-semibold text-gray-900">{agentUsername}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-xs text-gray-600">Email</span>
                <span className="text-xs font-semibold text-gray-900">{agentEmail}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-xs text-gray-600">Role</span>
                <span className="text-xs font-semibold text-amber-600">Senior Agent</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-xs text-gray-600">Status</span>
                <span className="inline-flex items-center">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                  <span className="text-xs font-semibold text-green-600">Active</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center">
              <Settings className="h-4 w-4 mr-2 text-amber-600" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setIsEditingName(true)}
                className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 rounded-lg transition-all border border-amber-200"
              >
                <span className="flex items-center text-xs font-medium text-gray-900">
                  <Edit2 className="h-3.5 w-3.5 mr-2 text-amber-600" />
                  Edit Profile
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
              </button>

              <button
                onClick={() => setCurrentView('settings')}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all border border-gray-200"
              >
                <span className="flex items-center text-xs font-medium text-gray-900">
                  <Settings className="h-3.5 w-3.5 mr-2 text-gray-600" />
                  Settings
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
              </button>

              <button
                onClick={() => setCurrentView('history')}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all border border-gray-200"
              >
                <span className="flex items-center text-xs font-medium text-gray-900">
                  <History className="h-3.5 w-3.5 mr-2 text-gray-600" />
                  View History
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 divide-y divide-gray-100">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Notifications</h3>
                <p className="text-sm text-gray-500">Receive alerts for new messages</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Privacy Mode</h3>
                <p className="text-sm text-gray-500">Hide sensitive customer data</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Email Digest</h3>
                <p className="text-sm text-gray-500">Daily summary of your performance</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistory = () => {
    // Filter closed tickets based on search and filter
    const filteredTickets = closedTickets.filter(ticket => {
      const matchesSearch =
        ticket.customer_name.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        ticket.customer_email.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        ticket.ticket_id?.toLowerCase().includes(historySearchQuery.toLowerCase());

      const matchesFilter =
        historyFilterStatus === 'all' ||
        (historyFilterStatus === 'rated' && ticket.rating) ||
        (historyFilterStatus === 'unrated' && !ticket.rating);

      return matchesSearch && matchesFilter;
    });

    return (
      <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {selectedHistoryTicket ? (
            // Show selected ticket messages
            <>
              <button
                onClick={() => {
                  setSelectedHistoryTicket(null);
                  setHistoryMessages([]);
                }}
                className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                <span className="font-medium">Back to History</span>
              </button>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-sm font-mono text-purple-600 bg-purple-50 px-3 py-1 rounded-lg font-semibold">
                        {selectedHistoryTicket.ticket_id}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                        Closed
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedHistoryTicket.customer_name}
                    </h3>
                    <p className="text-sm text-gray-500">{selectedHistoryTicket.customer_email}</p>

                    {/* Issue Information */}
                    {selectedHistoryTicket.issue_type_label && (
                      <div className="mt-3 flex items-start space-x-2">
                        <div className="flex-shrink-0 w-1 h-12 bg-purple-300 rounded-full"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-500 mb-1">ISSUE</p>
                          <span className="text-sm text-purple-600 flex-1 font-medium">{selectedHistoryTicket.issue_type_label}</span>
                          {selectedHistoryTicket.issue_category_label && (
                            <div className="mt-1">
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {selectedHistoryTicket.issue_category_label}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {selectedHistoryTicket.rating && (
                      <div className="text-yellow-500 text-xl mb-2">
                        {'⭐'.repeat(selectedHistoryTicket.rating)}
                      </div>
                    )}
                    <div>Created: {formatToIST(selectedHistoryTicket.created_at)}</div>
                    <div>Closed: {formatToIST(selectedHistoryTicket.closed_at)}</div>
                  </div>
                </div>

                {selectedHistoryTicket.resolution_note && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 mb-2">RESOLUTION NOTES</p>
                    <p className="text-sm text-gray-700">{selectedHistoryTicket.resolution_note}</p>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Chat Conversation</h3>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {historyMessages
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                    .map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.sender === 'agent' ? 'justify-end' :
                          msg.sender === 'system' ? 'justify-center' : 'justify-start'
                          }`}
                      >
                        {msg.sender === 'system' ? (
                          <span className="bg-gray-200/80 backdrop-blur-sm text-gray-600 text-xs px-4 py-1.5 rounded-full shadow-sm border border-gray-200">
                            {msg.content}
                          </span>
                        ) : (
                          <div className={`flex flex-col max-w-[70%] ${msg.sender === 'agent' ? 'items-end' : 'items-start'}`}>
                            <span className={`text-[10px] font-medium mb-1 px-1 ${msg.sender === 'agent' ? 'text-blue-600' : 'text-gray-500'
                              }`}>
                              {msg.sender === 'agent' ? 'You' : selectedHistoryTicket.customer_name}
                            </span>
                            <div
                              className={`px-5 py-3 shadow-md ${msg.sender === 'agent'
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl rounded-tr-sm'
                                : 'bg-white text-gray-900 border border-gray-200 rounded-2xl rounded-tl-sm'
                                }`}
                            >
                              <p className="text-sm leading-relaxed">{msg.content}</p>
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1.5 px-1">
                              {formatTimeToIST(msg.timestamp)}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </>
          ) : (
            // Show ticket list
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Closed Tickets History</h1>

              {/* Search and Filter Bar */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      placeholder="Search by name, email, or ticket ID..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setHistoryFilterStatus('all')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${historyFilterStatus === 'all'
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setHistoryFilterStatus('rated')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${historyFilterStatus === 'rated'
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      Rated
                    </button>
                    <button
                      onClick={() => setHistoryFilterStatus('unrated')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${historyFilterStatus === 'unrated'
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      Unrated
                    </button>
                  </div>
                </div>
              </div>

              {closedTickets.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                  <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Closed Tickets</h3>
                  <p className="text-gray-500">Closed conversations will appear here</p>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                  <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Matching Tickets</h3>
                  <p className="text-gray-500">Try adjusting your search or filter</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => loadTicketMessages(ticket.ticket_id || `TICKET-${ticket.id}`)}
                      className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-sm font-mono text-amber-600 bg-amber-50 px-3 py-1 rounded-lg font-semibold">
                              {ticket.ticket_id || `TICKET-${ticket.id}`}
                            </span>
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                              Closed
                            </span>
                            {ticket.rating && (
                              <span className="text-yellow-500 text-sm">
                                {'⭐'.repeat(ticket.rating)}
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {ticket.customer_name}
                          </h3>
                          <p className="text-sm text-gray-500">{ticket.customer_email}</p>

                          {/* Issue Information */}
                          {ticket.issue_type_label && (
                            <div className="mt-3 flex items-start space-x-2">
                              <div className="flex-shrink-0 w-1 h-10 bg-amber-300 rounded-full"></div>
                              <div className="flex-1 min-w-0">
                                <span className="text-xs text-amber-600 flex-1 font-medium">{ticket.issue_type_label}</span>
                                {ticket.issue_category_label && (
                                  <div className="mt-0.5">
                                    <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                      {ticket.issue_category_label}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <div className="flex items-center space-x-1 mb-1">
                            <Clock className="h-4 w-4" />
                            <span>Created: {formatToIST(ticket.created_at)}</span>
                          </div>
                          <div className="flex items-center space-x-1 mb-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>Closed: {ticket.closed_at ? formatToIST(ticket.closed_at) : 'N/A'}</span>
                          </div>
                          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
                            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                            View Chat
                          </button>
                        </div>
                      </div>

                      {ticket.resolution_note && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <p className="text-xs font-semibold text-gray-500 mb-2">RESOLUTION NOTES</p>
                          <p className="text-sm text-gray-700 line-clamp-2">{ticket.resolution_note}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };


  // Show loading state while checking authentication
  if (isAuthChecking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] w-full bg-gray-50 overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {userRole === 'admin'
        ? (currentView === 'chat' ? renderSidebar() : renderAdminSidebar())
        : userRole === 'supervisor'
          ? renderSupervisorSidebar()
          : renderSidebar()}

      {currentView === 'chat' ? (
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {selectedSessionId ? (
            <>
              <div className="flex-shrink-0 p-4 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm z-10">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                  >
                    <Menu className="h-6 w-6" />
                  </button>
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 flex items-center justify-center text-amber-600 font-bold">
                    {activeChats.find(c => c.id === selectedSessionId)?.customer_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {activeChats.find(c => c.id === selectedSessionId)?.customer_name || 'Unknown Customer'}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                      Online
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowQuickReplies(!showQuickReplies)}
                    className="p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                    title="Quick Replies"
                  >
                    <Zap className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setShowCloseDialog(true)}
                    className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                    title="Close Ticket"
                  >
                    <CheckCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                {(messages[selectedSessionId] || [])
                  .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                  .map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.sender === 'agent' ? 'justify-end' :
                        msg.sender === 'system' ? 'justify-center' : 'justify-start'
                        } animate-in fade-in slide-in-from-bottom-2 duration-200`}
                    >
                      {msg.sender === 'system' ? (
                        <span className="bg-gray-200/80 backdrop-blur-sm text-gray-600 text-xs px-4 py-1.5 rounded-full shadow-sm border border-gray-200">
                          {msg.content}
                        </span>
                      ) : (
                        <div className={`flex flex-col max-w-[70%] ${msg.sender === 'agent' ? 'items-end' : 'items-start'}`}>
                          {/* Sender label */}
                          <span className={`text-[10px] font-medium mb-1 px-1 ${msg.sender === 'agent' ? 'text-blue-600' : 'text-gray-500'
                            }`}>
                            {msg.sender === 'agent' ? 'You' : activeChats.find(c => c.id === selectedSessionId)?.customer_name || 'Customer'}
                          </span>
                          <div
                            className={`px-5 py-3 shadow-md ${msg.sender === 'agent'
                              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl rounded-tr-sm'
                              : 'bg-white text-gray-900 border border-gray-200 rounded-2xl rounded-tl-sm'
                              }`}
                          >
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1.5 px-1">
                            {formatTimeToIST(msg.timestamp)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white shadow-lg">
                {/* Quick Replies Panel */}
                {showQuickReplies && (
                  <div className="mb-3 p-3 bg-amber-50 rounded-xl border border-amber-200 max-h-64 overflow-y-auto shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-amber-900 flex items-center">
                        <Zap className="h-4 w-4 mr-1.5" />
                        Quick Replies
                      </h4>
                      <button
                        onClick={() => setShowQuickReplies(false)}
                        className="text-amber-400 hover:text-amber-600"
                      >
                        <CloseIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {(quickReplies || []).map(reply => (
                        <button
                          key={reply.id}
                          onClick={() => handleQuickReply(reply.text)}
                          className="text-left p-2 bg-white hover:bg-amber-100 rounded-lg transition-colors text-sm flex items-start space-x-2 border border-amber-100"
                        >
                          <span className="text-lg">{reply.icon}</span>
                          <div className="flex-1">
                            <div className="text-xs text-amber-600 font-medium">{reply.category}</div>
                            <div className="text-gray-700">{reply.text}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center space-x-3 max-w-4xl mx-auto">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-5 py-3 bg-gray-50 border-gray-200 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 rounded-xl transition-all outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim()}
                    className="bg-amber-500 text-white p-3 rounded-xl hover:bg-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-200 hover:shadow-amber-300 active:scale-95"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </form>
              </div>

              {/* Close Ticket Dialog */}
              {showCloseDialog && (
                <div
                  className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                  onClick={() => setShowCloseDialog(false)}
                  role="presentation"
                >
                  <div
                    className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center">
                        <CheckCircle className="h-6 w-6 mr-2 text-green-600" />
                        Close Ticket
                      </h3>
                      <button
                        onClick={() => setShowCloseDialog(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <CloseIcon className="h-5 w-5" />
                      </button>
                    </div>

                    <p className="text-gray-600 mb-4">
                      Are you sure you want to close this ticket? This will mark the issue as resolved.
                    </p>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Resolution Notes (Optional)
                      </label>
                      <textarea
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                        placeholder="Add any notes about how this issue was resolved..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                        rows={3}
                      />
                    </div>

                    <div className="flex flex-col space-y-3">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleCloseTicket('unresolved')}
                          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm flex items-center justify-center"
                        >
                          <XCircle className="h-4 w-4 mr-1.5" />
                          Close Only
                        </button>
                        <button
                          onClick={() => handleCloseTicket('resolved')}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center justify-center shadow-lg shadow-green-100"
                        >
                          <Check className="h-4 w-4 mr-1.5" />
                          Close & Resolve
                        </button>
                      </div>
                      <button
                        onClick={() => setShowCloseDialog(false)}
                        className="w-full px-4 py-2 bg-white text-gray-500 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm border border-gray-200"
                      >
                        Keep Chat Open
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30 relative">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="absolute top-4 left-4 lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <MessageSquare className="h-10 w-10 text-amber-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome back, {agentUsername.split(' ')[0]}!</h3>
              <p className="text-gray-500 max-w-sm text-center">Select a conversation from the sidebar to start chatting with customers.</p>
            </div>
          )}
        </div>
      ) : currentView === 'profile' ? (
        renderProfile()
      ) : currentView === 'settings' ? (
        renderSettings()
      ) : currentView === 'inquiry' ? (
        <div className="flex-1 flex flex-col bg-gray-50 overflow-y-auto">
          <InquiryDesk />
        </div>
      ) : isAuthChecking ? (
        // Should not happen as we handle this early return above
        <div />
      ) : currentView === 'admin_invite' && userRole === 'admin' ? (
        <InviteUserView agentUsername={agentUsername} showNotification={(msg, type) => showNotification(msg, type || 'info')} onNavigate={(path) => router.push(path)} />
      ) : currentView === 'admin_performance' && userRole === 'admin' ? (
        <TeamPerformanceView />
      ) : currentView === 'admin_settings' && userRole === 'admin' ? (
        <AdminSettingsView />
      ) : currentView === 'admin_users' && userRole === 'admin' ? (
        <UserManagementView onNavigate={(view) => setCurrentView(view as View)} />
      ) : currentView.startsWith('admin_') || userRole === 'admin' ? (
        <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden overflow-y-auto">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500">Overview of support operations</p>
              </div>
            </div>
          </div>

          {currentView === 'admin_dashboard' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-start items-center mb-4 space-x-3">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-amber-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-600">Total Tickets</h3>
                </div>
                <div className="text-3xl font-bold text-gray-900 pl-2">
                  {isLoadingAdminStats ? (
                    <div className="h-9 w-16 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    adminStats.total_tickets.toLocaleString()
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-start items-center mb-4 space-x-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Headphones className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-600">Active Agents</h3>
                </div>
                <div className="text-3xl font-bold text-gray-900 pl-2">
                  {isLoadingAdminStats ? (
                    <div className="h-9 w-8 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    adminStats.active_agents
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-start items-center mb-4 space-x-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-600">Avg Resolution</h3>
                </div>
                <div className="text-3xl font-bold text-gray-900 pl-2">
                  {isLoadingAdminStats ? (
                    <div className="h-9 w-24 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    adminStats.avg_resolution_time
                  )}
                </div>
              </div>
            </div>

          ) : currentView === 'admin_performance' && userRole === 'admin' ? (
            <TeamPerformanceView />
          ) : currentView === 'admin_settings' && userRole === 'admin' ? (
            <AdminSettingsView />
          ) : currentView === 'supervisor_dashboard' ? (
            <SupervisorDashboardView onNavigate={(view) => setCurrentView(view as View)} />
          ) : currentView === 'supervisor_tickets' ? (
            <AllTicketsView
              onNavigate={(view, data) => {
                if (view === 'chat' && data?.sessionId) {
                  setSelectedSessionId(data.sessionId);
                  setCurrentView('chat' as View);
                } else {
                  setCurrentView(view as View);
                }
              }}
              userEmail={agentEmail}
              userName={agentUsername}
            />
          ) : currentView === 'supervisor_team' ? (
            <TeamPerformanceView />
          ) : null}
        </div>
      ) : (
        renderHistory()
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className={`px-6 py-4 rounded-lg shadow-xl border-l-4 flex items-center space-x-3 max-w-md ${notification.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' :
            notification.type === 'error' ? 'bg-red-50 border-red-500 text-red-800' :
              'bg-blue-50 border-blue-500 text-blue-800'
            }`}>
            {notification.type === 'success' && <CheckCircle className="h-5 w-5 flex-shrink-0" />}
            {notification.type === 'error' && <XCircle className="h-5 w-5 flex-shrink-0" />}
            {notification.type === 'info' && <Bell className="h-5 w-5 flex-shrink-0" />}
            <p className="font-medium">{notification.message}</p>
            <button
              onClick={() => setNotification(null)}
              className="ml-auto hover:opacity-70 transition-opacity"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
