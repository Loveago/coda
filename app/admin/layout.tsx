import Link from 'next/link';
import { headers } from 'next/headers';
import { Bell, Search } from 'lucide-react';
import { getAdminUser } from '@/lib/auth';
import AdminSidebar from '@/components/AdminSidebar';
import '../globals.css';

export default async function AdminLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = (await headers()).get('x-next-pathname') || '';

  if (pathname === '/admin/login') return children;

  const user = await getAdminUser();
  const name = user?.name || 'Administrator';
  const initials = name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="admin-shell">
      <AdminSidebar name={name} role={user?.role || 'ADMIN'} />
      <header className="admin-topbar-d">
        <form className="asearch" action="/admin/messages" method="get" role="search">
          <Search size={15} />
          <input type="search" name="q" placeholder="Search..." aria-label="Search administration" />
        </form>
        <div className="admin-topbar-user">
          <Link href="/admin/messages" className="mdashbar-bell" aria-label="Notifications">
            <Bell size={17} />
            <i>5</i>
          </Link>
          <span className="admin-avatar">{initials || 'MT'}</span>
          <div>
            <strong>{name}</strong>
            <small>{(user?.role || 'ADMIN').toLowerCase().replace('_', ' ')}</small>
          </div>
        </div>
      </header>
      <section className="admin-content">{children}</section>
    </div>
  );
}
