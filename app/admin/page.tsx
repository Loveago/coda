import Link from 'next/link';
import '../globals.css';
import { db } from '@/lib/db';
import { APPLICATION_FILTER } from '@/lib/membership';
import {
  BarChart3, FileText, Image as ImageIcon, Inbox, Mail,
  Newspaper, Users
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const actionLabels: Record<string, string> = {
  CREATE: 'created',
  UPDATE: 'updated',
  DELETE: 'deleted',
  BULK_PUBLISHED: 'bulk published',
  BULK_DRAFT: 'unpublished',
  BULK_ARCHIVED: 'archived',
  BULK_DELETE: 'bulk deleted'
};

export default async function Admin() {
  const [members, applications, publishedNews, drafts, messages, subscribers, gallery, resources, statistics, activity] =
    await Promise.all([
      db.member.count({ where: { status: 'APPROVED' } }),
      db.member.count({ where: APPLICATION_FILTER }),
      db.newsArticle.count({ where: { status: 'PUBLISHED' } }),
      db.newsArticle.count({ where: { status: 'DRAFT' } }),
      db.contactMessage.count({ where: { read: false, archived: false } }),
      db.newsletterSubscriber.count({ where: { active: true } }),
      db.galleryItem.count(),
      db.resource.count(),
      db.statistic.count({ where: { active: true } }),
      db.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8, include: { user: { select: { name: true } } } })
    ]);

  const cards = [
    ['Members', members.toLocaleString(), 'Approved membership records', Users],
    ['Applications', applications.toLocaleString(), 'Pending review', Users],
    ['Published news', publishedNews.toLocaleString(), `${drafts} draft${drafts === 1 ? '' : 's'}`, Newspaper],
    ['Messages', messages.toLocaleString(), 'Unread enquiries', Inbox],
    ['Subscribers', subscribers.toLocaleString(), 'Newsletter audience', Mail],
    ['Gallery images', gallery.toLocaleString(), 'Photos in the gallery', ImageIcon],
    ['Resources', resources.toLocaleString(), 'Published documents', FileText],
    ['Statistics', statistics.toLocaleString(), 'Active impact metrics', BarChart3]
  ] as const;

  return (
    <main>
      <div className="admin-page-head">
        <div>
          <p className="kicker" style={{ margin: 0 }}>CONTROL CENTER</p>
          <h1>Dashboard</h1>
        </div>
        <Link className="btn btn-primary" href="/admin/news/new">CREATE ARTICLE</Link>
      </div>

      <div className="admin-dashboard-cards">
        {cards.map(([label, value, description, Icon]) => (
          <div className="admin-stat-card" key={label}>
            <span className="admin-stat-icon"><Icon size={19} /></span>
            <strong>{value}</strong>
            <span>{label} · {description}</span>
          </div>
        ))}
      </div>

      <div className="split" style={{ marginTop: 26 }}>
        <div className="admin-panel">
          <h2>Recent activity</h2>
          {activity.length === 0 ? (
            <p className="admin-note">Live activity will appear here as CMS actions are recorded.</p>
          ) : (
            <div className="activity-list">
              {activity.map((entry) => (
                <div className="activity-item" key={entry.id}>
                  <span className="activity-dot" />
                  <span><strong>{entry.user?.name || 'System'}</strong> {actionLabels[entry.action] || entry.action.toLowerCase()} {entry.entity}{entry.entityId ? ` · ${entry.entityId.slice(0, 8)}…` : ''}</span>
                  <time>{new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(entry.createdAt)}</time>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="admin-panel">
          <h2>Quick links</h2>
          <div className="quick-links">
            <Link href="/admin/members">REVIEW APPLICATIONS</Link>
            <Link href="/admin/messages">VIEW MESSAGES</Link>
            <Link href="/admin/news">MANAGE NEWS</Link>
            <Link href="/admin/settings">SITE SETTINGS</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
