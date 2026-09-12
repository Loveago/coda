'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Check, Copy, ExternalLink, KeyRound, Loader2, Plus,
  RefreshCw, Search, Trash2, Users, X
} from 'lucide-react';

type MemberSummary = {
  id: string;
  firstName: string;
  lastName: string;
  memberNumber: string;
  email: string;
  phone: string;
  createdAt: string;
};

type RegistrationCode = {
  id: string;
  code: string;
  description: string | null;
  maxUses: number;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
  createdBy?: { id: string; name: string; email: string } | null;
  members: MemberSummary[];
};

const labelStyle = {
  fontSize: 11.5,
  fontWeight: 700,
  color: 'var(--muted)',
  display: 'block',
  marginBottom: 5,
  letterSpacing: '.4px'
};

const fieldStyle = {
  padding: '10px 12px',
  border: '1px solid var(--line)',
  borderRadius: 8,
  background: '#fff',
  fontSize: 13,
  width: '100%'
};

export default function RegistrationCodesManager() {
  const [codes, setCodes] = useState<RegistrationCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'USED' | 'EXPIRED' | 'DISABLED'>('ALL');
  const [showGenerator, setShowGenerator] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [selectedMembersCode, setSelectedMembersCode] = useState<RegistrationCode | null>(null);

  // Generator form state
  const [mode, setMode] = useState<'generate' | 'custom'>('generate');
  const [prefix, setPrefix] = useState('MTA');
  const [count, setCount] = useState(1);
  const [customCode, setCustomCode] = useState('');
  const [useType, setUseType] = useState<'single' | 'multi' | 'unlimited'>('single');
  const [customMaxUses, setCustomMaxUses] = useState(10);
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [description, setDescription] = useState('');

  async function fetchCodes() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/registration-codes');
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to load registration codes.');
      const data = await response.json();
      setCodes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load codes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCodes();
  }, []);

  async function handleGenerate(event: FormEvent) {
    event.preventDefault();
    setGenerating(true);
    setError('');

    let maxUses = 1;
    if (useType === 'unlimited') maxUses = 0;
    else if (useType === 'multi') maxUses = Number(customMaxUses) || 1;

    const payload = {
      mode,
      prefix: prefix.trim() || 'MTA',
      count: mode === 'generate' ? Number(count) : 1,
      customCode: mode === 'custom' ? customCode.trim() : undefined,
      maxUses,
      expiresAt: hasExpiry && expiryDate ? new Date(expiryDate).toISOString() : null,
      description: description.trim() || undefined
    };

    try {
      const response = await fetch('/api/admin/registration-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate registration code(s).');

      // Reset form
      setShowGenerator(false);
      setCustomCode('');
      setDescription('');
      setCount(1);
      setUseType('single');
      setHasExpiry(false);
      setExpiryDate('');

      // Refresh list
      await fetchCodes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating codes.');
    } finally {
      setGenerating(false);
    }
  }

  async function toggleActive(code: RegistrationCode) {
    setActionBusy(code.id);
    try {
      const response = await fetch('/api/admin/registration-codes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: code.id, active: !code.active })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update code.');
      setCodes((prev) => prev.map((c) => (c.id === code.id ? { ...c, active: !c.active } : c)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setActionBusy(null);
    }
  }

  async function deleteCode(id: string) {
    if (!window.confirm('Are you sure you want to delete this registration code?')) return;
    setActionBusy(id);
    try {
      const response = await fetch('/api/admin/registration-codes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to delete code.');
      setCodes((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setActionBusy(null);
    }
  }

  function copyText(id: string, text: string, type: 'code' | 'link') {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      setCopiedLinkId(id);
      setTimeout(() => setCopiedLinkId(null), 2000);
    }
  }

  // Determine code status
  function getStatus(code: RegistrationCode): { label: string; badgeClass: string } {
    if (!code.active) return { label: 'DISABLED', badgeClass: 'badge-INACTIVE' };
    if (code.expiresAt && new Date(code.expiresAt) < new Date()) {
      return { label: 'EXPIRED', badgeClass: 'badge-ARCHIVED' };
    }
    if (code.maxUses > 0 && code.usedCount >= code.maxUses) {
      return { label: 'USED UP', badgeClass: 'badge-REJECTED' };
    }
    return { label: 'ACTIVE', badgeClass: 'badge-active' };
  }

  // Filtered list
  const filtered = useMemo(() => {
    return codes.filter((item) => {
      const status = getStatus(item);
      if (filter === 'ACTIVE' && status.label !== 'ACTIVE') return false;
      if (filter === 'USED' && status.label !== 'USED UP') return false;
      if (filter === 'EXPIRED' && status.label !== 'EXPIRED') return false;
      if (filter === 'DISABLED' && status.label !== 'DISABLED') return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesCode = item.code.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        const matchesAdmin = item.createdBy?.name.toLowerCase().includes(q);
        const matchesMember = item.members.some((m) =>
          `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) || m.memberNumber.toLowerCase().includes(q)
        );
        return matchesCode || matchesDesc || matchesAdmin || matchesMember;
      }
      return true;
    });
  }, [codes, filter, search]);

  // Statistics
  const stats = useMemo(() => {
    let active = 0;
    let usedUp = 0;
    let totalMembers = 0;
    for (const c of codes) {
      totalMembers += c.members.length;
      const status = getStatus(c);
      if (status.label === 'ACTIVE') active++;
      else if (status.label === 'USED UP') usedUp++;
    }
    return { total: codes.length, active, usedUp, totalMembers };
  }, [codes]);

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* Stats tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div className="admin-panel" style={{ padding: 18 }}>
          <p style={{ margin: 0, fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.5px' }}>TOTAL CODES</p>
          <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 800, fontFamily: 'Barlow Condensed', color: 'var(--navy)' }}>{stats.total}</p>
        </div>
        <div className="admin-panel" style={{ padding: 18 }}>
          <p style={{ margin: 0, fontSize: 11.5, fontWeight: 700, color: '#16a34a', letterSpacing: '.5px' }}>ACTIVE CODES</p>
          <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 800, fontFamily: 'Barlow Condensed', color: '#16a34a' }}>{stats.active}</p>
        </div>
        <div className="admin-panel" style={{ padding: 18 }}>
          <p style={{ margin: 0, fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.5px' }}>USED UP / EXHAUSTED</p>
          <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 800, fontFamily: 'Barlow Condensed', color: 'var(--navy)' }}>{stats.usedUp}</p>
        </div>
        <div className="admin-panel" style={{ padding: 18 }}>
          <p style={{ margin: 0, fontSize: 11.5, fontWeight: 700, color: 'var(--blue)', letterSpacing: '.5px' }}>MEMBERS REGISTERED</p>
          <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 800, fontFamily: 'Barlow Condensed', color: 'var(--blue)' }}>{stats.totalMembers}</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="admin-panel" style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', flex: 1, minWidth: 280 }}>
          <div style={{ position: 'relative', width: 'min(100%, 320px)' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input
              type="search"
              placeholder="Search code, description, member..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...fieldStyle, paddingLeft: 36 }}
            />
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['ALL', 'ACTIVE', 'USED', 'EXPIRED', 'DISABLED'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`admin-action ${filter === tab ? 'active' : ''}`}
                style={{
                  background: filter === tab ? 'var(--blue)' : 'var(--panel-alt)',
                  color: filter === tab ? '#fff' : 'var(--ink)',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 11
                }}
              >
                {tab === 'ALL' ? 'All' : tab === 'USED' ? 'Used Up' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={fetchCodes}
            disabled={loading}
            title="Refresh codes"
            style={{ padding: '8px 12px' }}
          >
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowGenerator(!showGenerator)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            {showGenerator ? <X size={15} /> : <Plus size={15} />}
            {showGenerator ? 'CLOSE GENERATOR' : 'GENERATE CODE'}
          </button>
        </div>
      </div>

      {/* Generator Drawer/Panel */}
      {showGenerator && (
        <form onSubmit={handleGenerate} className="admin-panel" style={{ background: '#F8FAFC', border: '2px dashed #CBD5E1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <KeyRound size={18} color="var(--blue)" />
              Generate Registration Codes
            </h3>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Codes are required for new member sign-up</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {/* Mode selection */}
            <div>
              <label style={labelStyle}>Generation Method</label>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === 'generate'}
                    onChange={() => setMode('generate')}
                  />
                  Auto-generate random
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === 'custom'}
                    onChange={() => setMode('custom')}
                  />
                  Custom code
                </label>
              </div>
            </div>

            {/* Prefix or Custom input */}
            {mode === 'generate' ? (
              <>
                <div>
                  <label style={labelStyle}>Prefix</label>
                  <input
                    style={fieldStyle}
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                    placeholder="MTA"
                    maxLength={10}
                  />
                  <small style={{ fontSize: 11, color: 'var(--muted)' }}>Output format: MTA-XXXXXX</small>
                </div>
                <div>
                  <label style={labelStyle}>Quantity to generate</label>
                  <select
                    style={fieldStyle}
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                  >
                    <option value={1}>1 code</option>
                    <option value={5}>5 codes</option>
                    <option value={10}>10 codes</option>
                    <option value={20}>20 codes</option>
                  </select>
                </div>
              </>
            ) : (
              <div>
                <label style={labelStyle}>Custom Code *</label>
                <input
                  style={{ ...fieldStyle, textTransform: 'uppercase', fontWeight: 600 }}
                  required
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase().replace(/\s+/g, '-'))}
                  placeholder="e.g. MTA-VIP2026"
                  minLength={3}
                  maxLength={32}
                />
              </div>
            )}

            {/* Usage limit */}
            <div>
              <label style={labelStyle}>Usage Limit</label>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="useType"
                    checked={useType === 'single'}
                    onChange={() => setUseType('single')}
                  />
                  Single-use (1)
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="useType"
                    checked={useType === 'multi'}
                    onChange={() => setUseType('multi')}
                  />
                  Multi-use
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="useType"
                    checked={useType === 'unlimited'}
                    onChange={() => setUseType('unlimited')}
                  />
                  Unlimited
                </label>
              </div>
              {useType === 'multi' && (
                <input
                  type="number"
                  min={2}
                  max={10000}
                  style={{ ...fieldStyle, marginTop: 8 }}
                  placeholder="Max uses (e.g. 10)"
                  value={customMaxUses}
                  onChange={(e) => setCustomMaxUses(Number(e.target.value))}
                />
              )}
            </div>

            {/* Expiry */}
            <div>
              <label style={labelStyle}>Expiration (Optional)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <input
                  type="checkbox"
                  id="hasExpiryCheck"
                  checked={hasExpiry}
                  onChange={(e) => setHasExpiry(e.target.checked)}
                />
                <label htmlFor="hasExpiryCheck" style={{ fontSize: 13, cursor: 'pointer' }}>Set expiration date</label>
              </div>
              {hasExpiry && (
                <input
                  type="date"
                  style={{ ...fieldStyle, marginTop: 8 }}
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required={hasExpiry}
                />
              )}
            </div>

            {/* Description / Note */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Description / Recipient Note (Optional)</label>
              <input
                style={fieldStyle}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. For driver recruits in Tema, or Event attendee voucher"
                maxLength={255}
              />
            </div>
          </div>

          <div style={{ marginTop: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
            <button type="submit" className="btn btn-primary" disabled={generating}>
              {generating ? (
                <>
                  <Loader2 size={14} className="spinning" style={{ marginRight: 6 }} />
                  GENERATING...
                </>
              ) : (
                'CREATE CODE(S)'
              )}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setShowGenerator(false)}
              disabled={generating}
            >
              CANCEL
            </button>
          </div>
        </form>
      )}

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #F87171', borderRadius: 8, padding: 14, color: '#991B1B', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Codes Table */}
      <section className="admin-panel" style={{ maxWidth: 'none', overflowX: 'auto', padding: 0 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
            <Loader2 size={24} className="spinning" style={{ display: 'inline-block', marginBottom: 8 }} />
            <p>Loading registration codes...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
            <p style={{ fontSize: 15, fontWeight: 600 }}>No registration codes found.</p>
            <p style={{ fontSize: 13 }}>Click &ldquo;Generate Code&rdquo; above to create invitation codes for new members.</p>
          </div>
        ) : (
          <table className="admin-table card-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Registration Code</th>
                <th>Status</th>
                <th>Usage</th>
                <th>Description / Note</th>
                <th>Expiration</th>
                <th>Created</th>
                <th>Used By</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((code) => {
                const status = getStatus(code);
                const isSingle = code.maxUses === 1;
                const isUnlimited = code.maxUses === 0;
                const isBusy = actionBusy === code.id;
                const publicInviteUrl = typeof window !== 'undefined'
                  ? `${window.location.origin}/membership?code=${code.code}`
                  : `/membership?code=${code.code}`;

                return (
                  <tr key={code.id}>
                    <td data-label="Registration Code">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <code
                          style={{
                            background: '#F1F5F9',
                            padding: '4px 8px',
                            borderRadius: 6,
                            fontFamily: 'monospace',
                            fontSize: 14,
                            fontWeight: 700,
                            letterSpacing: '0.8px',
                            color: 'var(--navy)'
                          }}
                        >
                          {code.code}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyText(code.id, code.code, 'code')}
                          className="admin-action"
                          style={{ padding: '4px 6px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          title="Copy code"
                        >
                          {copiedId === code.id ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                          <span style={{ fontSize: 10 }}>{copiedId === code.id ? 'Copied' : 'Copy'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => copyText(code.id, publicInviteUrl, 'link')}
                          className="admin-action"
                          style={{ padding: '4px 6px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          title="Copy direct invite signup link"
                        >
                          {copiedLinkId === code.id ? <Check size={12} color="#16a34a" /> : <ExternalLink size={12} />}
                          <span style={{ fontSize: 10 }}>{copiedLinkId === code.id ? 'Link copied' : 'Invite Link'}</span>
                        </button>
                      </div>
                    </td>

                    <td data-label="Status">
                      <span className={`badge ${status.badgeClass}`}>{status.label}</span>
                    </td>

                    <td data-label="Usage">
                      <strong>{code.usedCount}</strong>
                      <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                        {' '}/ {isUnlimited ? '∞' : code.maxUses}
                        {isSingle ? ' (Single)' : isUnlimited ? ' (Unlimited)' : ''}
                      </span>
                    </td>

                    <td data-label="Description / Note">
                      {code.description ? (
                        <span style={{ fontSize: 13 }}>{code.description}</span>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>
                      )}
                    </td>

                    <td data-label="Expiration">
                      {code.expiresAt ? (
                        <span style={{ fontSize: 12.5 }}>
                          {new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(code.expiresAt))}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: 12 }}>Never</span>
                      )}
                    </td>

                    <td data-label="Created">
                      <span style={{ fontSize: 12 }}>
                        {new Intl.DateTimeFormat('en-GB', { dateStyle: 'short' }).format(new Date(code.createdAt))}
                      </span>
                      {code.createdBy && (
                        <small style={{ display: 'block', color: 'var(--muted)', fontSize: 11 }}>
                          by {code.createdBy.name}
                        </small>
                      )}
                    </td>

                    <td data-label="Used By">
                      {code.members.length > 0 ? (
                        <button
                          type="button"
                          className="admin-action"
                          onClick={() => setSelectedMembersCode(code)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Users size={12} />
                          {code.members.length} {code.members.length === 1 ? 'member' : 'members'}
                        </button>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: 12 }}>None yet</span>
                      )}
                    </td>

                    <td data-label="Action">
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className={`admin-action ${code.active ? 'danger' : ''}`}
                          disabled={isBusy}
                          onClick={() => toggleActive(code)}
                        >
                          {code.active ? 'DEACTIVATE' : 'ACTIVATE'}
                        </button>
                        <button
                          type="button"
                          className="admin-action danger"
                          disabled={isBusy}
                          onClick={() => deleteCode(code.id)}
                          title="Delete code"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* Modal for viewing members registered with a specific code */}
      {selectedMembersCode && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 9999,
            padding: 16
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="admin-panel"
            style={{
              width: 'min(100%, 640px)',
              maxHeight: '85vh',
              overflowY: 'auto',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18 }}>Members registered with {selectedMembersCode.code}</h3>
                <small style={{ color: 'var(--muted)' }}>
                  Total {selectedMembersCode.members.length} member(s)
                </small>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMembersCode(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {selectedMembersCode.members.map((m) => (
                <div
                  key={m.id}
                  style={{
                    padding: '12px 14px',
                    border: '1px solid var(--line)',
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 14 }}>{m.firstName} {m.lastName}</strong>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                      {m.memberNumber} · {m.email} · {m.phone}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'right' }}>
                    Registered<br />
                    {new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(m.createdAt))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, textAlign: 'right' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setSelectedMembersCode(null)}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
