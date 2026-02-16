import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Invite from '@/models/Invite';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const invites = await Invite.find().sort({ createdAt: -1 });
        return NextResponse.json({ invites });
    } catch (error) {
        console.error('Error fetching invites:', error);
        return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { email, role, team, department, invitedBy } = await request.json();

        if (!email || !role) {
            return NextResponse.json(
                { error: 'Email and Role are required' },
                { status: 400 }
            );
        }

        await connectDB();

        // Check if there is already a pending invite for this email
        const existingInvite = await Invite.findOne({
            email: email.toLowerCase(),
            status: 'pending',
        });

        if (existingInvite) {
            return NextResponse.json(
                { error: 'A pending invite already exists for this email.' },
                { status: 409 }
            );
        }

        // Create a new invite
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

        const newInvite = await Invite.create({
            email: email.toLowerCase(),
            role,
            team,
            department,
            invitedBy,
            token,
            expiresAt,
            status: 'pending',
        });

        // Call Backend API to Create User + Send Email
        try {
            const backendUrl = 'http://localhost:8001/api/admin/invite';
            const serviceAuthToken = process.env.SERVICE_AUTH_TOKEN || 'ExtraHand_Secure_Token_2024_MinLength32Chars_ChangeInProduction';

            console.log('[NextAPI] calling backend invite:', backendUrl);

            // We assume backend creates "User" status=pending
            const backendResponse = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-service-auth': serviceAuthToken // Add if needed by backend middleware? Backend doesn't use it on this route though.
                },
                body: JSON.stringify({
                    email: email.toLowerCase(),
                    role,
                    team,
                    department,
                })
            });

            if (!backendResponse.ok) {
                const errorText = await backendResponse.text();
                console.error('[NextAPI] Backend invite failed:', errorText);

                // Rollback: delete the invite we just created so the user can try again
                await Invite.findByIdAndDelete(newInvite._id);

                return NextResponse.json(
                    { error: `Backend failed: ${errorText}` },
                    { status: backendResponse.status }
                );
            } else {
                console.log('[NextAPI] Backend invite success');
            }
        } catch (bkError) {
            console.error('[NextAPI] Failed to call backend:', bkError);
            // Rollback on connection error too
            await Invite.findByIdAndDelete(newInvite._id);
            return NextResponse.json(
                { error: 'Failed to connect to backend service' },
                { status: 502 }
            );
        }

        return NextResponse.json({
            message: 'Invite created successfully',
            invite: newInvite,
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating invite:', error);
        return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
    }
}
