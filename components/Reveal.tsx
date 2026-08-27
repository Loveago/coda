'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';

export default function Reveal({
  children,
  delay = 0,
  as: Tag = 'div',
  className = ''
}: {
  children: ReactNode;
  delay?: number;
  as?: 'div' | 'section' | 'article' | 'li' | 'span';
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const Component = Tag as 'div';

  return (
    <Component
      ref={ref as never}
      className={`reveal${visible ? ' in-view' : ''}${className ? ` ${className}` : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Component>
  );
}
