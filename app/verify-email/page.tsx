import Link from 'next/link';
import { Suspense } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import '../globals.css';

function State({ state }: { state: string }) {
  if (state === 'success') {
    return (
      <>
        <CheckCircle2 size={44} color="#0c7a43" />
        <h1>Email verified!</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>Thank you for verifying your email. Your application is now with the GACODA membership team for review.</p>
        <Link href="/" className="btn btn-primary">BACK TO HOMEPAGE</Link>
      </>
    );
  }
  return (
    <>
      <XCircle size={44} color="#c0392b" />
      <h1>Invalid verification link</h1>
      <p style={{ color: 'var(--muted)', fontSize: 13 }}>This link is invalid or has expired. If you have not received a verification email yet, please contact the association.</p>
      <Link href="/" className="btn btn-ghost">BACK TO HOMEPAGE</Link>
    </>
  );
}

export default async function VerifyEmail({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const state = (await searchParams).state || 'invalid';
  return (
    <main className="login-wrap">
      <div className="login-card" style={{ textAlign: 'center', display: 'grid', justifyItems: 'center', gap: 14 }}>
        <Suspense fallback={null}><State state={state} /></Suspense>
      </div>
    </main>
  );
}
