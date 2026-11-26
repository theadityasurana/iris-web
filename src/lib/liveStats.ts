/**
 * Live counters shared with the landing page hero (public/index.html):
 * each starts at its base at START and goes up by one every minute, so every
 * visitor sees the same number. Keep START and the bases in sync with the landing page.
 */
import { useEffect, useState } from 'react';

const START = Date.UTC(2026, 10, 26, 13, 2, 0);
export const LIVE_BASE = { interviews: 8001, companies: 14500, jobs: 2006050 } as const;

const minutes = () => Math.max(0, Math.floor((Date.now() - START) / 60000));

export function useLiveCount(key: keyof typeof LIVE_BASE) {
  const [m, setM] = useState(minutes);
  useEffect(() => {
    const t = setInterval(() => setM(minutes()), 5000);
    return () => clearInterval(t);
  }, []);
  return LIVE_BASE[key] + m;
}
