import { NextResponse } from 'next/server';
import { MEMBER_SESSION_COOKIE } from '@/lib/members-auth';

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL('/login', request.url), 303);
  response.cookies.set(MEMBER_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0
  });
  return response;
}
