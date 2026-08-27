'use client';

import { useEffect, useState } from 'react';

export default function ValidityRing({
  percent,
  caption,
  sub,
  tone
}: {
  percent: number;
  caption: string;
  sub: string;
  tone: 'good' | 'warn' | 'bad';
}) {
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const offset = drawn ? circumference * (1 - clamped / 100) : circumference;

  return (
    <div className={`vring vring-${tone}`} role="img" aria-label={`${caption} ${sub}`}>
      <svg viewBox="0 0 150 150" aria-hidden="true">
        <circle className="vring-track" cx="75" cy="75" r={radius} />
        <circle
          className="vring-bar"
          cx="75"
          cy="75"
          r={radius}
          style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
        />
      </svg>
      <div className="vring-center" aria-hidden="true">
        <strong>{caption}</strong>
        <span>{sub}</span>
      </div>
    </div>
  );
}
