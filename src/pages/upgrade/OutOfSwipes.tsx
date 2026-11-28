/**
 * Out-of-swipes page: shown instead of jumping straight to /app/plans when a
 * user has no free swipes or credits left. Sells the outcome (interview
 * emails) as a phone lock screen + an opened email, then hands off to Plans.
 */
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, Clock, Video } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useRegion } from '@web/lib/webBilling';
import '@web/styles/upgrade.css';
import { getPromoCode } from '@web/lib/promo';
import { markPaywallSeen, useExperimentVariant } from '@web/lib/experiment';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_CODE = 'IRIS10'; // 10% off any plan (Dodo discount, no expiry)

function Logos() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <symbol id="oc-gmail" viewBox="0 0 48 48"><path fill="#4caf50" d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z" /><path fill="#1e88e5" d="M3,16.2l3.614,1.71L13,23.7V40H6c-1.657,0-3-1.343-3-3V16.2z" /><polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17" /><path fill="#c62828" d="M3,12.298V16.2l10,7.5V11.2L9.876,8.859C9.132,8.301,8.228,8,7.298,8h0C4.924,8,3,9.924,3,12.298z" /><path fill="#fbc02d" d="M45,12.298V16.2l-10,7.5V11.2l3.124-2.341C38.868,8.301,39.772,8,40.702,8h0C43.076,8,45,9.924,45,12.298z" /></symbol>
      <symbol id="oc-google" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" /><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" /><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" /><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" /></symbol>
      <symbol id="oc-nvidia" viewBox="0 0 48 48"><rect width="48" height="48" fill="#76b900" /><path d="M8 24c5-8 13-12 21-11 6 1 10 5 12 11-2 6-6 10-12 11-8 1-16-3-21-11z" fill="none" stroke="#fff" strokeWidth="3.2" /><path d="M17 24c2-5 7-7 11-6 3 1 5 3 5 6s-2 5-5 6c-4 1-8-1-9-4" fill="none" stroke="#fff" strokeWidth="3" /><circle cx="26" cy="24" r="2.6" fill="#fff" /></symbol>
      <symbol id="oc-msft" viewBox="0 0 48 48"><rect x="9" y="9" width="14" height="14" fill="#f25022" /><rect x="25" y="9" width="14" height="14" fill="#7fba00" /><rect x="9" y="25" width="14" height="14" fill="#00a4ef" /><rect x="25" y="25" width="14" height="14" fill="#ffb900" /></symbol>
      <symbol id="oc-openai" viewBox="0 0 48 48"><rect width="48" height="48" fill="#0d0d0d" /><g fill="none" stroke="#fff" strokeWidth="2.6"><rect x="17" y="10" width="14" height="28" rx="7" /><rect x="17" y="10" width="14" height="28" rx="7" transform="rotate(60 24 24)" /><rect x="17" y="10" width="14" height="28" rx="7" transform="rotate(120 24 24)" /></g></symbol>
      <symbol id="oc-anthropic" viewBox="0 0 48 48"><rect width="48" height="48" fill="#f0eee6" /><path d="M9 35 16.6 13h5.2L29.4 35h-5.3l-1.6-4.8h-7.9L13 35zm7.1-9.3h5L18.6 18zM27.5 13h5.3L40.4 35h-5.3z" fill="#191919" /></symbol>
      <symbol id="oc-spacex" viewBox="0 0 48 48"><rect width="48" height="48" fill="#000" /><path d="M14 14l20 20M34 14 14 34" stroke="#fff" strokeWidth="4.2" strokeLinecap="round" /><path d="M7 31C17 19 29 12 43 9" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" /></symbol>
    </svg>
  );
}

type Note = { logo: string; full: boolean; sender: string; subject: string; preview: string };

function sequence(name: string, role: string): Note[] {
  const hi = name ? `Hi ${name}, ` : 'Hi, ';
  return [
    { logo: 'google', full: false, sender: 'Google Recruiting', subject: `Interview invitation: ${role}`, preview: `${hi}we'd love to schedule a first-round interview with you.` },
    { logo: 'nvidia', full: true, sender: 'NVIDIA Talent Acquisition', subject: 'Next steps for your application', preview: 'Your profile stood out to our team. Are you free this week?' },
    { logo: 'openai', full: true, sender: 'OpenAI Recruiting', subject: "Let's chat about the role", preview: 'Your background is a great fit. Free for a 30-minute call?' },
    { logo: 'msft', full: false, sender: 'Microsoft Careers', subject: "Let's schedule your interview", preview: 'Congratulations! The hiring team would like to meet you.' },
    { logo: 'spacex', full: true, sender: 'SpaceX Talent', subject: 'Final round invitation', preview: "You've cleared the technical rounds. Can you come in Friday?" },
    { logo: 'anthropic', full: true, sender: 'Anthropic People Team', subject: 'Your offer letter \u{1F389}', preview: "We're thrilled to offer you the role. Details inside." },
  ];
}
const AGO = ['now', '1m ago', '3m ago', '6m ago', '11m ago', '18m ago'];
const START_MS = 650;
const STEP_MS = 760;

/** How many notifications have arrived: 0 → 6 over ~4.5s, then it stays. */
function useArrivals(total: number) {
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [n, setN] = useState(reduce ? total : 0);
  useEffect(() => {
    if (reduce) return;
    const timers = Array.from({ length: total }, (_, i) => setTimeout(() => setN(i + 1), START_MS + i * STEP_MS));
    return () => timers.forEach(clearTimeout);
  }, [reduce, total]);
  return n;
}

/** Recruiter notifications arriving from the bottom and pushing the older ones up. */
function LiveNotifications({ notes, arrived, max }: { notes: Note[]; arrived: number; max: number }) {
  const shown = notes.slice(0, arrived).map((n, i) => ({ ...n, i })).slice(-max);
  const nodes = useRef(new Map<string, HTMLDivElement>());
  const tops = useRef(new Map<string, number>());
  useLayoutEffect(() => {
    const next = new Map<string, number>();
    nodes.current.forEach((el, key) => {
      const top = el.getBoundingClientRect().top;
      next.set(key, top);
      const before = tops.current.get(key);
      if (before === undefined || before === top) return;
      // FLIP: start where it was, then glide to its new place.
      el.style.transition = 'none';
      el.style.transform = `translateY(${before - top}px)`;
      void el.offsetHeight;
      el.style.transition = 'transform .5s cubic-bezier(.2,.85,.25,1)';
      el.style.transform = '';
    });
    tops.current = next;
  }, [arrived]);
  return (
    <>
      {shown.map(n => (
        <div
          className={`oc-n${n.i === arrived - 1 ? ' oc-in' : ''}`}
          key={n.sender}
          ref={el => { if (el) nodes.current.set(n.sender, el); else nodes.current.delete(n.sender); }}
        >
          <span className={`oc-av${n.full ? ' full' : ''}`}><svg><use href={`#oc-${n.logo}`} /></svg><i><svg><use href="#oc-gmail" /></svg></i></span>
          <div>
            <div className="oc-tr"><b>{n.sender}</b><span>{AGO[arrived - 1 - n.i] ?? ''}</span></div>
            <div className="oc-sj">{n.subject}</div>
            <p>{n.preview}</p>
          </div>
        </div>
      ))}
    </>
  );
}

function Status() {
  return <div className="oc-status"><span>7:42</span><span className="oc-ic"><i className="sig" /><i className="wifi" /><i className="bat" /></span></div>;
}

export default function OutOfSwipes() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: region = 'INTL' } = useRegion();
  const p = profile as { first_name?: string; name?: string; desiredRoles?: string[] } | null;
  const name = (p?.first_name || (p?.name || '').split(' ')[0] || '').trim();
  const role = (p?.desiredRoles?.[0] || 'Software Engineer').trim();
  const price = region === 'IN' ? '₹4' : '$0.02';
  const goPlans = () => navigate('/app/plans');
  const tomorrow = new Date(Date.now() + 864e5).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const cta = `Get started for ${price}`;
  const notes = sequence(name, role);
  const arrived = useArrivals(notes.length);
  const [narrow] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1040);
  const { data: variant } = useExperimentVariant();
  // This page lives outside AppShell (which resets scroll on navigation), so the
  // jobs page's scroll position would carry over and open it at the bottom on phones.
  useLayoutEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => { markPaywallSeen(); }, []);
  const outTitle = variant === 'paywall' ? "You've used your free application" : "You've used all your free swipes";
  const waitingRoles = useMemo(() => Math.floor(Math.random() * 401) + 800, []);
  // A partner code (from /?code=…) is applied for them at checkout; otherwise suggest IRIS10.
  const saved = getPromoCode();
  const codeNote = saved ? <>Your code <b>{saved}</b> is applied automatically</> : <>Use code <b>{DEFAULT_CODE}</b> for an exclusive discount</>;

  // What they could wake up to: a recruiter's interview email, addressed to them.
  const email = (
    <div className="oc-em">
      <div className="oc-subj">Interview invitation: {role} at Google</div>
      <div className="oc-from">
        <div className="oc-fav"><svg width="24" height="24"><use href="#oc-google" /></svg></div>
        <div><b>Priya Raman</b><span>Google Recruiting · to {name || 'you'}</span></div>
        <span className="oc-tm">7:41 AM</span>
      </div>
      <p>Hi {name || 'there'},</p>
      <p>I'm Priya, a recruiter on the hiring team at Google. We came across your application for the <b>{role}</b> role and really liked your profile. Your experience stood out to the team.</p>
      <p>We'd love to schedule a quick 30-minute intro call to learn more about you and walk you through the next steps.</p>
      <p>Could you pick a time that works for you this week?</p>
      <div className="oc-cal">
        <div className="oc-cal-h"><CalendarDays size={16} /><b>Intro call with Google</b></div>
        <div className="oc-cal-m"><span><Clock size={13} />30 min</span><span><Video size={13} />Google Meet</span></div>
        <div className="oc-cal-link">calendly.com/priya-raman-google/intro-call</div>
        <div className="oc-cal-btn">Book a time →</div>
      </div>
      <p>Looking forward to speaking with you!</p>
      <p className="oc-sign">Best,<br /><b>Priya Raman</b><br /><span className="oc-sig2">Technical Recruiter, Google</span></p>
    </div>
  );

  return (
    <div className="oc">
      <Logos />
      <div className="oc-bg" aria-hidden="true" />
      <button type="button" className="oc-back" onClick={() => navigate('/app/jobs')}><ArrowLeft size={16} />Back to jobs</button>

      <div className="oc-grid">
        <section className="oc-pitch">
          <div className="oc-pill"><span className="oc-blink" />Every minute, someone on Iris lands an interview</div>
          <h1>Tomorrow morning, this could be <em>your phone.</em></h1>
          <p className="oc-lede">{variant === 'paywall' ? 'Your free application is done.' : 'Your free swipes are over.'} Keep applying, and the next notification you wake up to could be the interview you've been waiting for.</p>
          <p className="oc-waiting"><b>{waitingRoles.toLocaleString()} more roles</b> are waiting for you</p>
          <button type="button" className="oc-btn" onClick={goPlans}>{cta}<ArrowRight size={18} /></button>
          <div className="oc-small">{codeNote} · cancel any time</div>
        </section>

        <div className="oc-phones">
          <div className="oc-phone oc-lock" aria-hidden="true">
            <div className="oc-screen">
              <Status /><div className="oc-island" />
              <div className="oc-date">{tomorrow}</div>
              <div className="oc-clock">7:42</div>
              <div className="oc-stack"><div className="oc-more">{arrived ? `${arrived} new ${arrived === 1 ? 'message from a recruiter' : 'messages from recruiters'}` : '\u00a0'}</div><LiveNotifications notes={notes} arrived={arrived} max={narrow ? 3 : 4} /></div>
              <div className="oc-home" />
            </div>
          </div>

          <div className="oc-out-m" role="status">
            <span className="oc-out-ic">0</span>
            <div><b>{outTitle}</b><span>Keep applying and this could be your phone tomorrow morning.</span></div>
          </div>

          <div className="oc-notifs-m" aria-hidden="true"><LiveNotifications notes={notes} arrived={arrived} max={3} /></div>

          <div className="oc-phone oc-mail">
            <div className="oc-screen">
              <Status /><div className="oc-island" />
              <div className="oc-nav"><span>‹ Inbox</span><span className="oc-nav-ic">⌃ ⌄</span></div>
              <div className="oc-body">{email}</div>
              <div className="oc-home" />
            </div>
          </div>
        </div>
      </div>

      <div className="oc-sticky">
        <div><b>This could be your inbox.</b><span>{codeNote}</span></div>
        <button type="button" onClick={goPlans}>{cta}</button>
      </div>
    </div>
  );
}
