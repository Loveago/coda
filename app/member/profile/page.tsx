import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getPortalMember } from '@/lib/members-auth';
import ProfileEditor from '@/components/ProfileEditor';

export const dynamic = 'force-dynamic';

export default async function MemberProfile() {
  const portal = await getPortalMember();
  if (!portal) redirect('/login');

  const member = await db.member.findUnique({ where: { id: portal.id } });
  if (!member) redirect('/login');

  return (
    <main>
      <div className="admin-page-head">
        <div>
          <p className="kicker" style={{ margin: 0 }}>MEMBER PORTAL</p>
          <h1>My Profile</h1>
        </div>
      </div>

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
        photoUrl: member.photoUrl
      }} />
    </main>
  );
}
