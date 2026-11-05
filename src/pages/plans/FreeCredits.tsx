import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, ExternalLink, Gift, Instagram, Linkedin, MessageCircle, Twitter } from 'lucide-react';
import qrcode from 'qrcode-generator';
import { useAuth } from '@web/auth/AuthProvider';
import { useToast } from '@web/ui/Toast';
import { getReferralStats, createReferralCode, claimSocialFollow, getSocialFollowStatus, type SocialPlatform } from '@/lib/referral';
import { rc } from '@/lib/remote-config';

const inviteLink = (code: string) => `https://irisjobs.live/invite/${code}`;

const SOCIAL_ICONS: Record<SocialPlatform, typeof Instagram> = { instagram: Instagram, twitter: Twitter, linkedin: Linkedin };

/** A real, scannable QR code for the invite link. */
function InviteQr({ value }: { value: string }) {
  const svg = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(value);
    qr.make();
    return qr.createSvgTag({ cellSize: 3, margin: 0, scalable: true });
  }, [value]);
  return (
    <figure className="fc-qr">
      <div className="fc-qr-code" role="img" aria-label="QR code for your invite link" dangerouslySetInnerHTML={{ __html: svg }} />
      <figcaption className="t-caption">Scan to open your invite</figcaption>
    </figure>
  );
}

export default function FreeCredits() {
  const { userId, profile } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [claiming, setClaiming] = useState<SocialPlatform | null>(null);

  const { data: referralStats, refetch } = useQuery({
    queryKey: ['referral-stats', userId],
    queryFn: () => getReferralStats(userId!),
    enabled: !!userId,
  });
  const { data: followStatus = { instagram: false, twitter: false, linkedin: false } } = useQuery({
    queryKey: ['social-follow-status', userId],
    queryFn: () => getSocialFollowStatus(userId!),
    enabled: !!userId,
  });

  const social = rc('social');
  const limits = rc('limits');
  const reward = limits.referral_reward_referee;
  const followReward = limits.social_follow_reward;
  const code = referralStats?.referralCode;
  const link = code ? inviteLink(code) : null;

  async function createCode() {
    if (!userId) return;
    setCreating(true);
    try {
      await createReferralCode(userId, profile?.name || 'User');
      await refetch();
    } catch {
      toast('Could not create your code. Please try again.', 'error');
    } finally {
      setCreating(false);
    }
  }

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast('Invite link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Could not copy. Please copy the code by hand.', 'error');
    }
  }

  function claimFollow(platform: SocialPlatform) {
    if (!userId || followStatus[platform]) return;
    const url = social.links[platform];
    if (url) window.open(url, '_blank', 'noopener');
    setClaiming(platform);
    // Gives people a moment on the social page before the reward lands.
    setTimeout(async () => {
      const result = await claimSocialFollow(userId, platform);
      setClaiming(null);
      if (result.success) {
        toast(`+${followReward} credits added`);
        qc.invalidateQueries({ queryKey: ['social-follow-status', userId] });
        refetch();
      } else {
        toast(result.error || 'Could not add this reward', 'error');
      }
    }, 3000);
  }

  const shareText = code ? `I'm using Iris to apply to jobs. Use my code ${code} and we both get ${reward} free credits.` : '';
  const STEPS = [
    { title: 'Share your invite', body: 'Send your link or code to a friend who is looking for a job.' },
    { title: 'They join Iris', body: 'Your friend signs up and enters your code during onboarding.' },
    { title: 'You both get credits', body: `${reward} free application credits land in each account.` },
  ];

  return (
    <div className="page fc">
      <section className="fc-hero">
        <img src="/media/onboarding/resume.webp" alt="" width={880} height={1100} />
        <div className="fc-hero-copy">
          <div className="t-overline">Free credits</div>
          <h1 className="t-display">Bring a friend. <em>You both apply for free.</em></h1>
          <p>Every friend who joins gives you both {reward} application credits.</p>
        </div>
        <dl className="fc-hero-stats">
          <div><dd className="num">{referralStats?.totalReferrals ?? 0}</dd><dt>Friends joined</dt></div>
          <div><dd className="num">{referralStats?.totalSwipesEarned ?? 0}</dd><dt>Credits earned</dt></div>
        </dl>
      </section>

      <section className="fc-section">
        <header className="fc-head">
          <div className="t-overline muted">Your invite</div>
          <h2 className="t-title">Share your code</h2>
        </header>
        <div className="card fc-invite">
          {code && link ? (
            <>
              <div className="fc-invite-main">
                <div className="fc-code num">{code}</div>
                <button className="btn lg block" onClick={copyLink}>{copied ? <Check /> : <Copy />}{copied ? 'Link copied' : 'Copy invite link'}</button>
                <div className="fc-share">
                  <a className="btn outline" target="_blank" rel="noopener" href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${link}`)}`}><MessageCircle />WhatsApp</a>
                  <a className="btn outline" target="_blank" rel="noopener" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText}\n\n${link}`)}`}><Twitter />X</a>
                  <a className="btn outline" target="_blank" rel="noopener" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`}><Linkedin />LinkedIn</a>
                </div>
              </div>
              <InviteQr value={link} />
            </>
          ) : (
            <div className="fc-invite-empty">
              <Gift size={26} />
              <p className="t-heading">Get your personal invite code</p>
              <button className="btn lg" onClick={createCode} disabled={creating}>{creating ? <span className="spinner" /> : 'Create my code'}</button>
            </div>
          )}
        </div>
      </section>

      <section className="fc-section">
        <header className="fc-head">
          <div className="t-overline muted">How it works</div>
          <h2 className="t-title">Three steps, about a minute</h2>
        </header>
        <ol className="fc-steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className="card">
              <span className="fc-step-num">{i + 1}</span>
              <h3 className="t-heading">{s.title}</h3>
              <p className="t-callout soft">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {social.follow_items.length > 0 && (
        <section className="fc-section">
          <header className="fc-head">
            <div className="t-overline muted">More ways to earn</div>
            <h2 className="t-title">Follow Iris, get +{followReward} credits each</h2>
          </header>
          <div className="fc-follows">
            {(social.follow_items as { platform: SocialPlatform; label: string }[]).map(({ platform, label }) => {
              const Icon = SOCIAL_ICONS[platform] ?? ExternalLink;
              const done = followStatus[platform];
              return (
                <article key={platform} className="card fc-follow">
                  <span className="fc-follow-icon"><Icon size={20} /></span>
                  <span className="grow fc-follow-label">{label}</span>
                  {done ? (
                    <span className="badge green"><Check size={12} />+{followReward} earned</span>
                  ) : (
                    <button className="btn sm" disabled={claiming === platform} onClick={() => claimFollow(platform)}>
                      {claiming === platform ? <span className="spinner" /> : <ExternalLink />}
                      {claiming === platform ? 'Adding…' : 'Follow'}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
