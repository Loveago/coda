import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getPortalMember } from '@/lib/members-auth';
import { formatGhs, getFees } from '@/lib/fees';
import PayDuesButton from '@/components/PayDuesButton';
import ProfileEditor from '@/components/ProfileEditor';

export const dynamic = 'force-dynamic';

export default async function MemberProfile() {
  const portal = await getPortalMember();
  if (!portal) redirect('/login');

  const member = await db.member.findUnique({ where: { id: portal.id } });
  if (!member) redirect('/login');

  const fees = portal.status === 'PENDING' ? await getFees() : null;

  return (
    <main>
      <div className="admin-page-head">
        <div>
          <p className="kicker" style={{ margin: 0 }}>MEMBER PORTAL</p>
          <h1>My Profile</h1>
        </div>
      </div>

      {portal.status === 'PENDING' && (
        <div className="admin-panel" style={{ marginBottom: 22, borderLeft: '4px solid var(--blue, #2563eb)' }}>
          <h2 style={{ marginTop: 0 }}>{member.registrationPayment === 'PENDING' ? 'Finish your application' : 'Application under review'}</h2>
          {member.registrationPayment === 'PENDING' ? (
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>
              Pay the one-time registration fee of <strong>{formatGhs(fees!.registrationFeeAmount)}</strong> to submit your application to the membership committee.
            </p>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>
              Your application has been submitted and is being reviewed. Approved members get full portal access and a digital ID card. <Link href="/membership-status" style={{ color: 'var(--blue)', fontWeight: 700 }}>Check status →</Link>
            </p>
          )}
          {member.registrationPayment === 'PENDING' && <PayDuesButton type="REGISTRATION_FEE" label={`PAY ${formatGhs(fees!.registrationFeeAmount)} & SUBMIT`} />}
        </div>
      )}
      {portal.status === 'REJECTED' && (
        <div className="admin-panel" style={{ marginBottom: 22, borderLeft: '4px solid #c0392b' }}>
          <h2 style={{ marginTop: 0 }}>Application not approved</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Unfortunately your application was not approved at this time. Please <Link href="/contact" style={{ color: 'var(--blue)', fontWeight: 700 }}>contact the Mr Truth team</Link> for details.</p>
        </div>
      )}

      <div className="admin-panel" style={{ marginBottom: 22 }}>
        <h2>Account (locked fields)</h2>
        <div className="form-grid">
          {[['Member ID', member.memberNumber], ['Full name', `${member.firstName} ${member.lastName}`], ['Email', member.email], ['Approval status', member.status], ['Email verified', member.emailVerified ? 'Yes' : 'Pending']].map(([label, value]) => (
            <div key={label}>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>{String(label).toUpperCase()}</label>
              <input value={String(value)} readOnly disabled style={{ padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 10, background: '#f4f7fd', fontSize: 13, width: '100%', color: 'var(--muted)' }} />
            </div>
          ))}
        </div>
      </div>

      <ProfileEditor initial={{
        phone: member.phone,
        location: member.location,
        platform: member.platform,
        vehicleInfo: member.vehicleInfo,
        vehicleRegistration: member.vehicleRegistration,
        emergencyName: member.emergencyName,
        emergencyPhone: member.emergencyPhone,
        emergencyRelationship: member.emergencyRelationship,
        emergency2Name: member.emergency2Name,
        emergency2Phone: member.emergency2Phone,
        emergency2Relationship: member.emergency2Relationship,
        photoUrl: member.photoUrl
      }} />
    </main>
  );
}
