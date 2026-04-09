
import { useState, useEffect } from 'react';
import { Settings, Save, Bell, Shield } from 'lucide-react';

const AdminSettingsView = () => {
    const [settings, setSettings] = useState({
        enableEmailNotifications: true,
        enableSoundAlerts: true,
        autoAssignChats: true,
        privacyMode: false,
        maintenanceMode: false
    });

    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/admin/settings');
                if (response.ok) {
                    const data = await response.json();
                    if (Object.keys(data).length > 0) {
                        setSettings(prev => ({ ...prev, ...data }));
                    }
                }
            } catch (error) {
                console.error('Failed to fetch settings:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
        setSettings(prev => ({ ...prev, [e.target.name]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings),
            });

            if (response.ok) {
                // Determine save success via notification or simple alert for now
                // Ideally use a toast notification if available in context, reverting to alert for simplicity in this component
                alert('Settings saved successfully!');
            } else {
                alert('Failed to save settings.');
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('An error occurred while saving.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center h-full bg-gray-50">
                <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-medium">Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden h-full">
            <div className="bg-white border-b border-gray-200 px-8 py-6 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Settings className="h-6 w-6 text-amber-600 mr-2" />
                        Platform Settings
                    </h1>
                    <p className="text-gray-500 mt-1">Configure general preferences and system behaviors</p>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-8">
                <div className="max-w-4xl mx-auto space-y-6">



                    {/* Notification & System */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center">
                            <Bell className="h-5 w-5 text-gray-500 mr-2" />
                            <h3 className="font-semibold text-gray-800">Notifications & System</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                                    <p className="text-xs text-gray-500">Receive emails for new tickets</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="enableEmailNotifications" checked={settings.enableEmailNotifications} onChange={handleChange} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">Sound Alerts</h4>
                                    <p className="text-xs text-gray-500">Play sound when new message arrives</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="enableSoundAlerts" checked={settings.enableSoundAlerts} onChange={handleChange} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between py-2">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">Auto-Assign Chats</h4>
                                    <p className="text-xs text-gray-500">Automatically assign new chats to available agents</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="autoAssignChats" checked={settings.autoAssignChats} onChange={handleChange} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between py-2 border-t border-gray-50">
                                <div className="flex items-start">
                                    <Shield className="h-4 w-4 text-gray-500 mt-0.5 mr-2" />
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900">Privacy Mode</h4>
                                        <p className="text-xs text-gray-500">Mask customer name and email in ticket/inquiry views</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="privacyMode" checked={settings.privacyMode} onChange={handleChange} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-6 py-2.5 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 focus:ring-4 focus:ring-amber-200 transition-all shadow-lg shadow-amber-200 flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                            ) : (
                                <Save className="h-5 w-5 mr-2" />
                            )}
                            Save Changes
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AdminSettingsView;
