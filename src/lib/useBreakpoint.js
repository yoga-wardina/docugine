import { useEffect, useState } from 'react';

const QUERIES = [
  { name: 'mobile', max: 639 },
  { name: 'tablet', min: 640, max: 1023 },
  { name: 'desktop', min: 1024, max: 1279 },
  { name: 'wide', min: 1280 },
];

function queryString({ min, max }) {
  if (min != null && max != null) {
    return `(min-width: ${min}px) and (max-width: ${max}px)`;
  }
  if (min != null) return `(min-width: ${min}px)`;
  if (max != null) return `(max-width: ${max}px)`;
  return 'all';
}

function detect() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'desktop';
  for (const q of QUERIES) {
    if (window.matchMedia(queryString(q)).matches) return q.name;
  }
  return 'desktop';
}

export function useBreakpoint() {
  const [bp, setBp] = useState(detect);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mqs = QUERIES.map((q) => window.matchMedia(queryString(q)));
    function update() {
      setBp(detect());
    }
    for (const mq of mqs) {
      if (mq.addEventListener) mq.addEventListener('change', update);
      else mq.addListener(update);
    }
    update();
    return () => {
      for (const mq of mqs) {
        if (mq.removeEventListener) mq.removeEventListener('change', update);
        else mq.removeListener(update);
      }
    };
  }, []);

  return bp;
}

export const BREAKPOINTS = {
  mobile: { max: 639 },
  tablet: { min: 640, max: 1023 },
  desktop: { min: 1024, max: 1279 },
  wide: { min: 1280 },
};
