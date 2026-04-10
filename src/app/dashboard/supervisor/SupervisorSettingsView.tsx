'use client';

import { Bell, Shield, Mail } from 'lucide-react';

export default function SupervisorSettingsView() {
    return (
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
}
