/**
 * Out-of-swipes page: shown instead of jumping straight to /app/plans when a
 * user has no free swipes or credits left. Sells the outcome (interview
 * emails) as a phone lock screen + an opened email, then hands off to Plans.
 */
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useRegion } from '@web/lib/webBilling';
import '@web/styles/upgrade.css';

const DISCOUNT_CODE = 'IRIS10'; // 10% off any plan (Dodo discount, no expiry)

function Logos() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <symbol id="oc-gmail" viewBox="0 0 48 48"><path fill="#4caf50" d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z" /><path fill="#1e88e5" d="M3,16.2l3.614,1.71L13,23.7V40H6c-1.657,0-3-1.343-3-3V16.2z" /><polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17" /><path fill="#c62828" d="M3,12.298V16.2l10,7.5V11.2L9.876,8.859C9.132,8.301,8.228,8,7.298,8h0C4.924,8,3,9.924,3,12.298z" /><path fill="#fbc02d" d="M45,12.298V16.2l-10,7.5V11.2l3.124-2.341C38.868,8.301,39.772,8,40.702,8h0C43.076,8,45,9.924,45,12.298z" /></symbol>
      <symbol id="oc-google" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" /><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" /><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" /><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" /></symbol>
      <symbol id="oc-nvidia" viewBox="0 0 48 48"><rect width="48" height="48" fill="#76b900" /><path d="M8 24c5-8 13-12 21-11 6 1 10 5 12 11-2 6-6 10-12 11-8 1-16-3-21-11z" fill="none" stroke="#fff" strokeWidth="3.2" /><path d="M17 24c2-5 7-7 11-6 3 1 5 3 5 6s-2 5-5 6c-4 1-8-1-9-4" fill="none" stroke="#fff" strokeWidth="3" /><circle cx="26" cy="24" r="2.6" fill="#fff" /></symbol>
      <symbol id="oc-msft" viewBox="0 0 48 48"><rect x="9" y="9" width="14" height="14" fill="#f25022" /><rect x="25" y="9" width="14" height="14" fill="#7fba00" /><rect x="9" y="25" width="14" height="14" fill="#00a4ef" /><rect x="25" y="25" width="14" height="14" fill="#ffb900" /></symbol>
    </svg>
  );
}

function Notifications({ name }: { name: string }) {
  const hi = name ? `Hi ${name}, ` : 'Hi, ';
  const items = [
    { logo: 'google', full: false, sender: 'Google Recruiting', time: 'now', subject: 'Interview invitation: Software Engineer', preview: `${hi}we'd love to schedule a first-round interview with you.` },
    { logo: 'nvidia', full: true, sender: 'NVIDIA Talent Acquisition', time: '6m ago', subject: 'Next steps for your application', preview: 'Your profile stood out to our team. Are you free this week?' },
    { logo: 'msft', full: false, sender: 'Microsoft Careers', time: '24m ago', subject: "Let's schedule your interview", preview: 'Congratulations! The hiring team would like to meet you.' },
  ];
  return (
    <>
      {items.map(n => (
        <div className="oc-n" key={n.sender}>
          <span className={`oc-av${n.full ? ' full' : ''}`}><svg><use href={`#oc-${n.logo}`} /></svg><i><svg><use href="#oc-gmail" /></svg></i></span>
          <div>
            <div className="oc-tr"><b>{n.sender}</b><span>{n.time}</span></div>
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
  const name = ((profile as { first_name?: string } | null)?.first_name || '').trim();
  const price = region === 'IN' ? '₹4' : region === 'AF' ? 'under $0.05' : 'under $0.10';
  const goPlans = () => navigate('/app/plans');
  const tomorrow = new Date(Date.now() + 864e5).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const cta = `Get started for ${price}`;

  const email = (
    <div className="oc-em">
      <div className="oc-subj">Imagine waking up to this tomorrow.</div>
      <div className="oc-from">
        <div className="oc-fav"><img src="/logo.webp" alt="" /></div>
        <div><b>Team Iris</b><span>To: {name || 'you'}</span></div>
        <span className="oc-tm">Just now</span>
      </div>
      <div className="oc-q">“We'd love to schedule an interview with you.”</div>
      <p>Hey {name || 'there'},</p>
      <p>Imagine opening your inbox to those words. That's the moment we built Iris for, and <b>70% of Iris users</b> get interviews from the companies they apply to.</p>
      <div className="oc-live"><span className="oc-blink" />Every minute, someone on Iris lands an interview.</div>
      <div className="oc-stats"><div><b>2M+</b><span>jobs</span></div><div><b>14,000+</b><span>companies</span></div><div><b>70%</b><span>get interviews</span></div></div>
      <p>Your free swipes are over, but your job search doesn't have to be. Use <span className="oc-code">{DISCOUNT_CODE}</span> at checkout for an exclusive discount on any plan.</p>
      <button type="button" className="oc-cta" onClick={goPlans}>{cta}</button>
      <div className="oc-fine">{price} per application · cancel any time</div>
      <p className="oc-sign">We're rooting for you,<br />Team Iris</p>
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
          <p className="oc-lede">Your free swipes are over. Keep applying, and the next notification you wake up to could be the interview you've been waiting for.</p>
          <button type="button" className="oc-btn" onClick={goPlans}>{cta}<ArrowRight size={18} /></button>
          <div className="oc-small">Use code <b>{DISCOUNT_CODE}</b> for an exclusive discount · cancel any time</div>
        </section>

        <div className="oc-phones">
          <div className="oc-phone oc-lock" aria-hidden="true">
            <div className="oc-screen">
              <Status /><div className="oc-island" />
              <div className="oc-date">{tomorrow}</div>
              <div className="oc-clock">7:42</div>
              <div className="oc-stack"><div className="oc-more">3 new interview requests</div><Notifications name={name} /></div>
              <div className="oc-home" />
            </div>
          </div>

          <div className="oc-notifs-m" aria-hidden="true"><Notifications name={name} /></div>

          <div className="oc-phone oc-mail">
            <div className="oc-screen">
              <Status /><div className="oc-island" />
              <div className="oc-nav"><span>‹ Inbox</span><span>Iris</span></div>
              <div className="oc-body">{email}</div>
              <div className="oc-home" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
