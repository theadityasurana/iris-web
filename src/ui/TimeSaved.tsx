/**
 * "N applications ≈ X hours you didn't spend filling forms", from the user's
 * real submitted applications, with the assumption stated so it reads as fair.
 */
import { Clock } from 'lucide-react';
import { useApplications } from '@web/lib/queries';

/** The assumption shown next to the number: one application form by hand. */
export const MINUTES_PER_APPLICATION = 15;
const NOT_SUBMITTED = new Set(['pending', 'processing', 'failed']);

export function formatSaved(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
}

export function TimeSaved({ compact = false }: { compact?: boolean }) {
  const apps = useApplications();
  const sent = (apps.data ?? []).filter(a => !NOT_SUBMITTED.has(a.status)).length;
  if (sent === 0) return null;
  const saved = formatSaved(sent * MINUTES_PER_APPLICATION);
  return (
    <div className={`time-saved${compact ? ' compact' : ''}`}>
      <Clock aria-hidden="true" />
      <div>
        <div><b>{sent} {sent === 1 ? 'application' : 'applications'}</b> ≈ <b>{saved}</b> you didn’t spend filling forms</div>
        <div className="t-caption muted">Counting about {MINUTES_PER_APPLICATION} minutes per application by hand.</div>
      </div>
    </div>
  );
}
