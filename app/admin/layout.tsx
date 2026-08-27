import { headers } from 'next/headers';
import { getAdminUser } from '@/lib/auth';
import AdminSidebar from '@/components/AdminSidebar';
import '../globals.css';

export default async function AdminLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = (await headers()).get('x-next-pathname') || '';

  if (pathname === '/admin/login') return children;

  const user = await getAdminUser();

  return (
    <div className="admin-shell">
      <AdminSidebar name={user?.name || 'Administrator'} role={user?.role || 'ADMIN'} />
      <section className="admin-content">{children}</section>
    </div>
  );
}
