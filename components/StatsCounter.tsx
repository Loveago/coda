'use client';

import { useEffect, useRef, useState } from 'react';

function parseValue(value: string) {
  const match = value.match(/^([^0-9]*)([0-9][0-9,.]*)(.*)$/);
  if (!match) return null;
  const number = Number(match[2].replace(/,/g, ''));
  if (!Number.isFinite(number)) return null;
  return { prefix: match[1], number, suffix: match[3], hasComma: match[2].includes(',') };
}

export default function StatsCounter({ value }: { value: string }) {
  const parsed = parseValue(value);
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(parsed ? parsed.prefix + '0' + parsed.suffix : value);

  useEffect(() => {
    if (!parsed) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setDisplay(value);
      return;
    }
    let frame = 0;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      const duration = 1400;
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(parsed.number * eased);
        setDisplay(parsed.prefix + (parsed.hasComma ? current.toLocaleString('en-US') : String(current)) + parsed.suffix);
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [parsed, value]);

  return <strong ref={ref}>{display}</strong>;
}
