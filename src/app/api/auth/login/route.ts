import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import User from '@/models/User';

// Simple in-memory user storage for development
const users = [
  {
    email: 'agent@gmail.com',
    password: 'Agent123!',
    name: 'Support Agent',
    role: 'agent'
  },
  {
    email: 'testuser@gmail.com',
    password: 'TestPass123!',
    name: 'Test User',
    role: 'agent'
  },
  {
    email: 'vijay@gmail.com',
    password: 'vijay123',
    name: 'Vijay',
    role: 'agent'
  },
  {
    email: 'admin@gmail.com',
    password: 'Admin123!',
    name: 'Admin User',
    role: 'admin'
  },
  {
    email: 'supervisor@gmail.com',
    password: 'Supervisor123!',
    name: 'Supervisor',
    role: 'supervisor'
  }
];

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }



    let user = null;

    // 1. Try Backend API (Source of Truth for Invited Users)
    try {
      const backendResponse = await fetch('http://localhost:8001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        user = {
          email: data.user.email,
          name: data.user.name,
          role: data.user.role || 'agent'
        };
        console.log('Login success via Backend API for:', email);
      } else {
        console.log('Backend login failed:', await backendResponse.text());
      }
    } catch (apiErr) {
      console.warn('Backend API login check failed (might be down):', apiErr);
    }

    // 2. Try Frontend Database (Legacy/Backup)
    if (!user) {
      try {
        await connectDB();
        const dbUser = await User.findOne({ email: email.toLowerCase() });

        if (dbUser) {
          const isMatch = await bcrypt.compare(password, dbUser.passwordHash);
          if (isMatch) {
            user = {
              email: dbUser.email,
              name: dbUser.name,
              role: dbUser.role || 'agent'
            };
          }
        }
      } catch (dbErr) {
        console.error('Frontend Database login check failed:', dbErr);
      }
    }

    // 2. Try Hardcoded (Fallback/Dev)
    if (!user) {
      const hardcodedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (hardcodedUser && hardcodedUser.password === password) {
        user = {
          email: hardcodedUser.email,
          name: hardcodedUser.name,
          role: hardcodedUser.role
        };
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create simple token (just base64 encoded user info for development)
    const token = Buffer.from(JSON.stringify({
      email: user.email,
      name: user.name,
      role: user.role,
      exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    })).toString('base64');

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        email: user.email,
        name: user.name,
        role: user.role
      },
      accessToken: token,
      refreshToken: token
    });

    // Set httpOnly cookie for better security
    response.cookies.set('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login. Please try again.' },
      { status: 500 }
    );
  }
}
