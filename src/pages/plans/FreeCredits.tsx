import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Gift, Copy, Check, Instagram, Twitter, Linkedin, ExternalLink, Users, Zap, Share2 } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useToast } from '@web/ui/Toast';
import { getReferralStats, createReferralCode, claimSocialFollow, getSocialFollowStatus, type SocialPlatform } from '@/lib/referral';
import { rc } from '@/lib/remote-config';
import { inviteLink } from '@/lib/social-share';

const SOCIAL_ICONS: Record<SocialPlatform, typeof Instagram> = {
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
};

const SOCIAL_COLORS: Record<SocialPlatform, string> = {
  instagram: '#E1306C',
  twitter: '#000000',
  linkedin: '#0A66C2',
};

function QRCodeSVG({ value, size = 120 }: { value: string; size?: number }) {
  // Simple QR placeholder — links to the actual URL
  return (
    <a href={value} target="_blank" rel="noopener" title="Open referral link" style={{ display: 'block' }}>
      <div style={{
        width: size, height: size, background: '#fff', border: '1px solid var(--line)',
        borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 4, cursor: 'pointer',
      }}>
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--ink-3)' }}>
          <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="4" height="4" rx="0.5" />
          <rect x="20" y="14" width="1" height="1" /><rect x="14" y="20" width="1" height="1" /><rect x="20" y="20" width="1" height="1" />
        </svg>
        <span style={{ fontSize: 9, color: 'var(--ink-4)', textAlign: 'center', lineHeight: 1.2 }}>Tap to open link</span>
      </div>
    </a>
  );
}

export default function FreeCredits() {
  const { userId, profile } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
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
  const referralReward = limits.referral_reward_referee;
  const followReward = limits.social_follow_reward;

  const referralLink = referralStats?.referralCode
    ? inviteLink(referralStats.referralCode)
    : null;

  async function ensureCode() {
    if (!userId || referralStats?.referralCode) return referralStats?.referralCode;
    const code = await createReferralCode(userId, profile?.name || 'User');
    await refetch();
    return code;
  }

  async function handleCopy() {
    const code = await ensureCode();
    if (!code) return;
    const link = inviteLink(code);
    await navigator.clipboard.writeText(link).catch(() => navigator.clipboard.writeText(code));
    setCopied(true);
    toast('Referral link copied');
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSocialClaim(platform: SocialPlatform) {
    if (!userId || followStatus[platform]) return;
    const url = social.links[platform];
    if (url) window.open(url, '_blank', 'noopener');
    setClaiming(platform);
    // Give them 3s to follow then claim
    setTimeout(async () => {
      const result = await claimSocialFollow(userId, platform);
      setClaiming(null);
      if (result.success) {
        toast(`+${followReward} credits earned!`);
        qc.invalidateQueries({ queryKey: ['social-follow-status', userId] });
        qc.invalidateQueries({ queryKey: ['referral-stats', userId] });
        refetch();
      } else {
        toast(result.error || 'Could not claim reward', 'error');
      }
    }, 3000);
  }

  const code = referralStats?.referralCode;
  const totalReferrals = referralStats?.totalReferrals ?? 0;
  const totalEarned = referralStats?.totalSwipesEarned ?? 0;

  return (
    <div className="page narrow">
      <div className="page-head">
        <div>
          <h1 className="t-title">Free credits</h1>
          <p className="t-callout muted" style={{ marginTop: 4 }}>Refer friends and follow us to earn bonus application credits.</p>
        </div>
      </div>

      {/* Referral code card */}
      <div className="card pad" style={{ marginBottom: 16 }}>
        <div className="row gap-10" style={{ marginBottom: 16 }}>
          <Gift size={20} style={{ color: 'var(--brand-ink)', flexShrink: 0 }} />
          <div className="grow">
            <div className="t-callout" style={{ fontWeight: 700 }}>Invite a friend</div>
            <div className="t-caption muted">You both get {referralReward} free credits when they sign up</div>
          </div>
        </div>

        <div className="row gap-12" style={{ alignItems: 'flex-start' }}>
          <div className="grow stack gap-10">
            {code ? (
              <>
                <div style={{
                  padding: '12px 16px', borderRadius: 'var(--r-3)', background: 'var(--surface-2)',
                  fontWeight: 800, fontSize: 22, letterSpacing: '0.12em', textAlign: 'center',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {code}
                </div>
                <button className="btn block" onClick={handleCopy}>
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? 'Copied!' : 'Copy referral link'}
                </button>
              </>
            ) : (
              <button className="btn block" onClick={ensureCode}>
                <Gift size={15} />Get my referral code
              </button>
            )}
          </div>
          {referralLink && (
            <div style={{ flexShrink: 0 }}>
              <QRCodeSVG value={referralLink} size={110} />
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="stats" style={{ gridTemplateColumns: 'repeat(2,1fr)', marginTop: 16 }}>
          <div className="stat">
            <div className="v num">{totalReferrals}</div>
            <div className="k">Friends referred</div>
          </div>
          <div className="stat">
            <div className="v num">{totalEarned}</div>
            <div className="k">Credits earned</div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="card pad" style={{ marginBottom: 16 }}>
        <div className="t-callout" style={{ fontWeight: 700, marginBottom: 12 }}>How it works</div>
        <div className="stack gap-10">
          {[
            'Share your referral code or link with a friend',
            'They sign up using your code',
            `You both get ${referralReward} free application credits`,
          ].map((step, i) => (
            <div key={i} className="row gap-10">
              <div style={{
                width: 22, height: 22, borderRadius: '50%', background: 'var(--ink)', color: 'var(--inverse)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}>{i + 1}</div>
              <span className="t-callout">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Social follows */}
      {social.follow_items.length > 0 && (
        <div className="card pad" style={{ marginBottom: 16 }}>
          <div className="row gap-10" style={{ marginBottom: 12 }}>
            <Zap size={18} style={{ color: 'var(--brand-ink)', flexShrink: 0 }} />
            <div className="grow">
              <div className="t-callout" style={{ fontWeight: 700 }}>Follow us for free credits</div>
              <div className="t-caption muted">Get +{followReward} credits for each follow</div>
            </div>
          </div>
          <div className="stack gap-8">
            {social.follow_items.map(({ platform, label }: { platform: SocialPlatform; label: string }) => {
              const Icon = SOCIAL_ICONS[platform] ?? ExternalLink;
              const color = SOCIAL_COLORS[platform] ?? 'var(--ink)';
              const done = followStatus[platform];
              const url = social.links[platform];
              return (
                <div key={platform} className="row gap-12" style={{
                  padding: '12px 14px', borderRadius: 'var(--r-3)', background: 'var(--surface-2)',
                }}>
                  <Icon size={18} style={{ color, flexShrink: 0 }} />
                  <span className="t-callout grow">{label}</span>
                  {done ? (
                    <span className="badge green"><Check size={11} />+{followReward} earned</span>
                  ) : (
                    <button
                      className="btn sm"
                      disabled={claiming === platform}
                      onClick={() => handleSocialClaim(platform)}
                    >
                      {claiming === platform ? <span className="spinner" /> : <ExternalLink size={13} />}
                      {claiming === platform ? 'Verifying…' : 'Follow'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Share buttons */}
      {code && (
        <div className="card pad">
          <div className="t-callout" style={{ fontWeight: 700, marginBottom: 12 }}>Share your code</div>
          <div className="row gap-8 wrap">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I'm using Iris: swipe right on a job and AI applies for you. Use my code ${code} and we both get ${referralReward} free credits.\n\n${inviteLink(code)}`)}`}
              target="_blank" rel="noopener"
              className="btn outline sm"
            >
              <Twitter size={14} />Share on X
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(inviteLink(code))}`}
              target="_blank" rel="noopener"
              className="btn outline sm"
            >
              <Linkedin size={14} />Share on LinkedIn
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Hey! I've been using Iris to apply to jobs. You just swipe right and AI handles the application. Use my code *${code}* and we both get ${referralReward} free credits: ${inviteLink(code)}`)}`}
              target="_blank" rel="noopener"
              className="btn outline sm"
            >
              <Share2 size={14} />WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
