'use client';

import { useState, useRef, useEffect } from 'react';
import { User, Award, Camera, Edit2, Save, XCircle, Mail } from 'lucide-react';

interface SupervisorProfileViewProps {
    user: any;
    onUpdateUser: () => void;
}

export default function SupervisorProfileView({ user, onUpdateUser }: SupervisorProfileViewProps) {
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(user.name || '');
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const storedImage = localStorage.getItem('profileImage');
        if (storedImage) {
            setProfileImage(storedImage);
        }
    }, []);

    const handleUpdateName = () => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const userData = JSON.parse(userStr);
            userData.name = newName;
            localStorage.setItem('user', JSON.stringify(userData));
            setIsEditingName(false);
            onUpdateUser(); // Trigger parent update if needed
            window.dispatchEvent(new Event('auth-change'));
        }
    };

    const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert('Image size should be less than 5MB');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const imageData = reader.result as string;
                const img = new Image();
                img.src = imageData;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const MAX_SIZE = 256;
                    let width = img.width;
                    let height = img.height;

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
                        const compressedData = canvas.toDataURL('image/jpeg', 0.7);
                        try {
                            localStorage.setItem('profileImage', compressedData);
                            setProfileImage(compressedData);
                            window.dispatchEvent(new Event('auth-change'));
                        } catch (e) {
                            console.error('Storage quota exceeded:', e);
                            alert('Failed to save image. Please use a smaller image file.');
                        }
                    }
                };
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-5">
                <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                    <div className="h-24 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 relative">
                        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,0,0.03) 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
                    </div>
                    <div className="px-6 pb-6 relative">
                        <div className="relative -mt-12 mb-4 flex items-end">
                            <div className="relative">
                                <div className="w-28 h-28 bg-white rounded-full p-1 shadow-lg ring-4 ring-white">
                                    <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100">
                                        {profileImage ? (
                                            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
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
                                <span className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 rounded-lg text-xs font-semibold border border-amber-200">
                                    <Award className="h-3 w-3 mr-1.5" />
                                    Supervisor
                                </span>
                            </div>
                        </div>

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
                                    <button onClick={handleUpdateName} className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all shadow-md hover:shadow-lg">
                                        <Save className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => setIsEditingName(false)} className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-all">
                                        <XCircle className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center space-x-2 mb-1">
                                        <h1 className="text-2xl font-bold text-gray-900">{user.name || user.email.split('@')[0]}</h1>
                                        <button onClick={() => setIsEditingName(true)} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Edit name">
                                            <Edit2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <div className="flex items-center text-gray-600 space-x-1.5">
                                        <Mail className="h-3.5 w-3.5" />
                                        <p className="text-sm">{user.email}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
