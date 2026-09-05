import { db } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/password';

/**
 * Environment-driven credentials.
 *
 * ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME
 *   When set, the admin login route ensures a SUPER_ADMIN user with these
 *   credentials exists and its password matches the env value. Changing the
 *   env and restarting (or on the next sign-in attempt) updates the account.
 *
 * DEMO_MEMBER_EMAIL / DEMO_MEMBER_PASSWORD / DEMO_MEMBER_NAME
 *   Same idea for the demo member account used to explore the member portal.
 */

export type AdminEnv = { email: string; password: string; name: string };
export type DemoMemberEnv = { email: string; password: string; firstName: string; lastName: string };

export function adminEnv(): AdminEnv | null {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!email || !password) return null;
  return { email, password, name: process.env.ADMIN_NAME?.trim() || 'Administrator' };
}

export function demoMemberEnv(): DemoMemberEnv | null {
  const email = process.env.DEMO_MEMBER_EMAIL?.trim().toLowerCase();
  const password = process.env.DEMO_MEMBER_PASSWORD?.trim();
  if (!email || !password) return null;
  const parts = (process.env.DEMO_MEMBER_NAME?.trim() || 'Demo Member').split(/\s+/);
  return { email, password, firstName: parts[0], lastName: parts.slice(1).join(' ') || 'Member' };
}

export async function syncAdminFromEnv() {
  const env = adminEnv();
  if (!env) return;
  const user = await db.user.findUnique({ where: { email: env.email } });
  if (!user) {
    await db.user.create({
      data: { email: env.email, name: env.name, passwordHash: await hashPassword(env.password), role: 'SUPER_ADMIN', active: true }
    });
    return;
  }
  const needsPassword = !(await verifyPassword(env.password, user.passwordHash));
  if (needsPassword || user.name !== env.name || !user.active) {
    await db.user.update({
      where: { id: user.id },
      data: {
        ...(needsPassword ? { passwordHash: await hashPassword(env.password) } : {}),
        name: env.name,
        active: true
      }
    });
  }
}

export async function syncDemoMemberFromEnv() {
  const env = demoMemberEnv();
  if (!env) return;
  const member = await db.member.findUnique({ where: { email: env.email } });
  if (!member) {
    await db.member.create({
      data: {
        memberNumber: `MRTA-${Date.now().toString().slice(-6)}`,
        email: env.email,
        passwordHash: await hashPassword(env.password),
        firstName: env.firstName,
        lastName: env.lastName,
        phone: process.env.DEMO_MEMBER_PHONE?.trim() || '+233 24 000 0000',
        status: 'APPROVED',
        emailVerified: true,
        registrationPayment: 'NOT_REQUIRED'
      }
    });
    return;
  }
  if (!(await verifyPassword(env.password, member.passwordHash))) {
    await db.member.update({
      where: { id: member.id },
      data: { passwordHash: await hashPassword(env.password), firstName: env.firstName, lastName: env.lastName }
    });
  }
}
