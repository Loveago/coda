import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { createSessionToken, ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE } from '@/lib/auth';
import { syncAdminFromEnv } from '@/lib/credentials';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    await syncAdminFromEnv();
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Enter a valid email and password.' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() }
    });

    const validPassword =
      user &&
      user.active &&
      (await verifyPassword(parsed.data.password, user.passwordHash));

    if (!validPassword) {
      return NextResponse.json(
        { error: 'Invalid administrator credentials.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, createSessionToken(user.id), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: ADMIN_SESSION_MAX_AGE
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: 'Unable to sign in right now.' },
      { status: 500 }
    );
  }
}
