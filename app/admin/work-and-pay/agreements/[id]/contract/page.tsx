import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getAdminUser } from '@/lib/auth';
import LegalAgreementDocument from '@/components/LegalAgreementDocument';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Official Legal Agreement | Work & Pay | Mr Truth Agency Admin'
};

export default async function AdminAgreementContractPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await getAdminUser();
  if (!admin) redirect('/admin/login');

  const { id } = await params;
  const agreement = await (db as any).workPayAgreement.findUnique({
    where: { id },
    include: {
      vehicle: true,
      member: true,
      application: true
    }
  });

  if (!agreement) notFound();

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', padding: '24px 16px' }}>
      <LegalAgreementDocument agreement={agreement} isAdmin={true} />
    </main>
  );
}
