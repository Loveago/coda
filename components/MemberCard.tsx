'use client';

import { useState } from 'react';
import { Check, Copy, Printer, RefreshCw, Share2 } from 'lucide-react';

export type MemberCardProps = {
  memberNumber: string;
  fullName: string;
  photoUrl: string | null;
  platform: string | null;
  status: 'ACTIVE' | 'DUE' | 'OVERDUE' | 'SUSPENDED';
  validUntil: string;
  memberSince: string;
  qr: boolean[][];
  verifyUrl: string;
};

const statusTone = { ACTIVE: 'good', DUE: 'good', OVERDUE: 'good', SUSPENDED: 'bad' } as const;

export default function MemberCard(props: MemberCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [copied, setCopied] = useState<'link' | 'number' | null>(null);
  const tone = statusTone[props.status];
  const qrSize = props.qr.length;

  async function share() {
    const payload = { title: 'Mr Truth Agency Membership Card', text: `${props.fullName} · ${props.memberNumber}`, url: props.verifyUrl };
    try {
      if (navigator.share) await navigator.share(payload);
      else throw new Error('no-share');
    } catch {
      try {
        await navigator.clipboard.writeText(props.verifyUrl);
        setCopied('link');
        setTimeout(() => setCopied(null), 1800);
      } catch {
        /* clipboard unavailable */
      }
    }
  }

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(props.memberNumber);
      setCopied('number');
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div>
      <div className="idcard-stage">
        <div className={`idcard-flip${flipped ? ' flipped' : ''}`}>
          {/* ===== FRONT ===== */}
          <div className={`idcard-face idcard-front${props.status === 'ACTIVE' ? '' : ' idcard-invalid'}`} onClick={() => setFlipped(true)} role="button" tabIndex={0}
            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setFlipped(true); }}
            aria-label="Membership card front — activate to flip">
            <span className="idcard-band" aria-hidden />
            <div className="idcard-head">
              <img src="/logo-mark.png" alt="" className="idcard-logo" width={34} height={34} />
              <div>
                <strong>MR TRUTH</strong>
                <small>AGENCY MEMBER</small>
              </div>
              <span className="idcard-valid-tag">MEMBER CARD</span>
            </div>
            <div className="idcard-mid">
              {props.photoUrl
                ? <img src={props.photoUrl} alt="" className="idcard-photo" />
                : <div className="idcard-photo">{props.fullName.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div>}
              <div style={{ minWidth: 0 }}>
                <p className="idcard-name">{props.fullName}</p>
                <p className="idcard-number">{props.memberNumber}</p>
                {props.platform && <span className="idcard-platform">◆ {props.platform}</span>}
              </div>
            </div>
            <div className="idcard-bottom">
              <div className="idcard-thru">
                <small>VALID THRU</small>
                <strong>{props.validUntil}</strong>
              </div>
              <span className={`idcard-status-pill ${tone}`}>{props.status}</span>
            </div>
          </div>

          {/* ===== BACK ===== */}
          <div className="idcard-face idcard-back" onClick={() => setFlipped(false)} role="button" tabIndex={0}
            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setFlipped(false); }}
            aria-label="Membership card back — activate to flip">
            <div className="idcard-magstripe" aria-hidden />
            <div className="idcard-back-body">
              <div className="idcard-qr" aria-hidden>
                <svg viewBox={`0 0 ${qrSize} ${qrSize}`} shapeRendering="crispEdges">
                  <rect width={qrSize} height={qrSize} fill="#ffffff" />
                  {props.qr.flatMap((row, y) =>
                    row.map((dark, x) =>
                      dark ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#1A1A1A" /> : null
                    )
                  )}
                </svg>
              </div>
              <div className="idcard-verify-copy">
                <strong>SCAN TO VERIFY</strong>
                <p>{props.verifyUrl}</p>
              </div>
            </div>
            <div className="idcard-back-foot">
              <span>MEMBER SINCE {props.memberSince}</span>
              <span>MR TRUTH · GHANA</span>
            </div>
          </div>
        </div>
      </div>

      <div className="idcard-actions no-print">
        <button type="button" className="idcard-btn primary" onClick={() => setFlipped((value) => !value)}>
          <RefreshCw size={14} /> {flipped ? 'SHOW FRONT' : 'SHOW BACK'}
        </button>
        <button type="button" className="idcard-btn" onClick={() => window.print()}>
          <Printer size={14} /> PRINT
        </button>
        <button type="button" className="idcard-btn" onClick={share}>
          <Share2 size={14} /> {copied === 'link' ? <><Check size={14} /> LINK COPIED</> : 'SHARE'}
        </button>
        <button type="button" className="idcard-btn" onClick={copyNumber}>
          {copied === 'number' ? <><Check size={14} /> COPIED</> : <><Copy size={14} /> MEMBER NO.</>}
        </button>
      </div>
      <p className="idcard-hint no-print"><RefreshCw size={12} /> Tap the card to flip it over.</p>
    </div>
  );
}
