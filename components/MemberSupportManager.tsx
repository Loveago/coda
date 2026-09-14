'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Headphones,
  LifeBuoy,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Wrench
} from 'lucide-react';

interface Ticket {
  id: string;
  ticketNumber: string;
  category: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  adminResponse: string | null;
  respondedAt: string | null;
  createdAt: string;
}

export default function MemberSupportManager({ agreementId }: { agreementId?: string }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [openNew, setOpenNew] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [category, setCategory] = useState('BREAKDOWN');
  const [priority, setPriority] = useState('NORMAL');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    try {
      const res = await fetch('/api/member/work-and-pay/support');
      const data = await res.json();
      if (res.ok && data.tickets) setTickets(data.tickets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/member/work-and-pay/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreementId,
          category,
          priority,
          subject,
          message
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit support ticket.');

      setFeedback({ type: 'ok', text: `Support ticket #${data.ticket.ticketNumber} created successfully.` });
      setSubject('');
      setMessage('');
      setOpenNew(false);
      fetchTickets();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err.message || 'Error submitting ticket.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>Work &amp; Pay Driver Support Desk</h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
            Submit tickets directly to our vehicle operations, accounting, and emergency breakdown teams.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpenNew((v) => !v)}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}
        >
          <Plus size={16} /> {openNew ? 'CANCEL' : 'SUBMIT NEW TICKET'}
        </button>
      </div>

      {feedback && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: feedback.type === 'ok' ? '#ecfdf5' : '#fef2f2',
            color: feedback.type === 'ok' ? '#065f46' : '#991b1b',
            border: `1px solid ${feedback.type === 'ok' ? '#a7f3d0' : '#fecaca'}`
          }}
        >
          {feedback.type === 'ok' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* New Ticket Form Accordion */}
      {openNew && (
        <form onSubmit={handleSubmit} className="panel" style={{ padding: 24, display: 'grid', gap: 16, border: '1px solid var(--blue)' }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Open a Driver Support Request</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="field"
              >
                <option value="BREAKDOWN">Mechanical Breakdown / Roadside Assistance</option>
                <option value="PAYMENT_QUESTION">Payment Remittance Question</option>
                <option value="DOCUMENT_REQUEST">Document Request (DVLA / Insurance Copy)</option>
                <option value="ACCIDENT">Accident / Incident Report</option>
                <option value="GENERAL">General Contract Inquiry</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                Urgency Level *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="field"
              >
                <option value="NORMAL">Normal — Standard response (within 24h)</option>
                <option value="HIGH">High — Priority driver concern</option>
                <option value="URGENT">Urgent — Immediate roadside / breakdown emergency</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
              Subject *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your request or issue..."
              className="field"
            />
          </div>

          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
              Detailed Description *
            </label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide full details, location if breakdown, or specific questions..."
              className="field"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {submitting ? 'SENDING TICKET...' : 'DISPATCH SUPPORT TICKET'}
            </button>
          </div>
        </form>
      )}

      {/* Tickets List */}
      <div className="panel" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>Your Support Tickets History</h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px', color: 'var(--blue)' }} />
            <p style={{ fontSize: 12.5, color: 'var(--muted)' }}>Loading tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
            No support tickets submitted yet. If you need any assistance with your vehicle or payment, open a ticket above.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {tickets.map((t) => (
              <div
                key={t.id}
                style={{
                  padding: 16,
                  background: '#f8fafc',
                  borderRadius: 8,
                  border: '1px solid var(--line)',
                  display: 'grid',
                  gap: 8
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', letterSpacing: '.5px' }}>
                      {t.ticketNumber} · {t.category.replace(/_/g, ' ')}
                    </span>
                    <h4 style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 700 }}>{t.subject}</h4>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span className={`pill ${t.status === 'RESOLVED' ? 'good' : t.status === 'OPEN' ? 'tone-warn' : 'tone-blue'}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                      {t.status}
                    </span>
                    <small style={{ color: 'var(--muted)', fontSize: 11 }}>
                      {new Date(t.createdAt).toLocaleDateString('en-GB')}
                    </small>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.5 }}>{t.message}</p>

                {t.adminResponse && (
                  <div style={{ marginTop: 8, padding: 12, background: '#eff6ff', borderRadius: 6, border: '1px solid #bfdbfe', fontSize: 12.5, color: '#1e3a8a' }}>
                    <strong>Operations Team Response:</strong>
                    <p style={{ margin: '4px 0 0', lineHeight: 1.5 }}>{t.adminResponse}</p>
                    {t.respondedAt && (
                      <small style={{ display: 'block', color: '#60a5fa', marginTop: 4, fontSize: 11 }}>
                        Answered on {new Date(t.respondedAt).toLocaleString('en-GB')}
                      </small>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
