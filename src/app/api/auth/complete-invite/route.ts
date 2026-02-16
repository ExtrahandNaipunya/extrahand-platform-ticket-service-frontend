import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Invite from '@/models/Invite';

export async function POST(request: Request) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json({ error: 'Token and Password required' }, { status: 400 });
        }

        // 1. Validate Invite in Frontend DB
        await connectDB();
        const invite = await Invite.findOne({ token });

        if (!invite) {
            console.warn('[NextAPI] Invite not found in Frontend DB for token:', token);
            // We continue to try backend, as it might exist there even if missing locally (unlikely but safer)
        }

        // 2. Call Backend to Activate User
        try {
            const backendResponse = await fetch('http://localhost:8001/api/auth/accept-invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const backendData = await backendResponse.json();

            if (!backendResponse.ok) {
                return NextResponse.json(
                    { error: backendData.error || 'Backend activation failed' },
                    { status: backendResponse.status }
                );
            }

            // 3. Update Frontend DB Invite Status (Only if backend success)
            if (invite) {
                invite.status = 'accepted';
                invite.acceptedAt = new Date();
                await invite.save();
                console.log('[NextAPI] Frontend Invite status updated to accepted for:', invite.email);
            }

            return NextResponse.json({ success: true, user: backendData.user });

        } catch (bkError) {
            console.error('[NextAPI] Failed to contact backend:', bkError);
            return NextResponse.json({ error: 'Failed to communicate with backend server' }, { status: 502 });
        }

    } catch (error) {
        console.error('[NextAPI] Complete Invite Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
