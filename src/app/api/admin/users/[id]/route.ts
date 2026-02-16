import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Invite from '@/models/Invite';

export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const id = params.id;

        // 1. Delete from Frontend DB (Next.js)
        await connectDB();

        // Find by ID and delete. We use findByIdAndDelete.
        // Assuming 'Invite' model uses _id matching the 'id' param.
        const deletedInvite = await Invite.findByIdAndDelete(id);

        // 2. Delete from Backend Server (Express) - User Deletion
        // The Invite ID (Mongo) might not match Backend User ID.
        // We try to find the backend user by email first if we have the invite info.
        try {
            let backendIdToDelete = id; // Default to trying the same ID

            if (deletedInvite && deletedInvite.email) {
                // Fetch all users from backend to find the correct ID
                // Ideally backend should have a delete-by-email or get-by-email endpoint
                const usersResponse = await fetch('http://localhost:8001/api/admin/users');
                if (usersResponse.ok) {
                    const data = await usersResponse.json();
                    const backendUser = data.users.find((u: any) => u.email === deletedInvite.email);
                    if (backendUser) {
                        backendIdToDelete = backendUser._id || backendUser.id;
                        console.log(`[NextAPI] Found backend user for ${deletedInvite.email}: ${backendIdToDelete}`);
                    }
                }
            }

            const response = await fetch(`http://localhost:8001/api/admin/users/${backendIdToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            // We don't return error if backend fails, strictly speaking, to allow UI cleanup
            if (!response.ok) {
                console.warn('Backend user deletion check returned:', response.status);
            } else {
                console.log('[NextAPI] Backend user deleted successfully');
            }
        } catch (backendError) {
            console.warn('Backend connection failed during delete:', backendError);
        }

        if (!deletedInvite) {
            // Even if not found, we return 200 to allow UI to clear it? 
            // Or 404. Let's return 200 with message if it was "already gone".
            return NextResponse.json({ success: true, message: 'Invite deleted (or already gone)' });
        }

        return NextResponse.json({ success: true, message: 'Invite revoked' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
