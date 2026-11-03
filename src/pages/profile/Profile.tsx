import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User, Briefcase, GraduationCap, Award, FileText, Settings,
  Eye, ChevronRight, Camera, ExternalLink, Gift,
} from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useSubscription } from '@web/lib/queries';
import { Avatar, formatDate } from '@web/ui/bits';
import { useToast } from '@web/ui/Toast';
import { getReferralStats } from '@/lib/referral';
import { useQuery } from '@tanstack/react-query';

export default function Profile() {
  const { profile, profileRow, userId, uploadAvatar } = useAuth();
  const { data: sub } = useSubscription();
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: referral } = useQuery({
    queryKey: ['referral-stats', userId],
    queryFn: () => getReferralStats(userId!),
    enabled: !!userId,
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const result = await uploadAvatar(file);
    setUploading(false);
    if (result) showToast('Photo updated');
    else showToast('Upload failed', 'error');
  };

  if (!profile) return null;

  const completion = profile.profileCompletion ?? 0;

  const sections = [
    { label: 'Basic info', desc: 'Name, headline, location, bio', href: '/app/profile/edit/basic-info', icon: User },
    { label: 'Experience', desc: `${profile.experience?.length ?? 0} entries`, href: '/app/profile/edit/experience', icon: Briefcase },
    { label: 'Education', desc: `${profile.education?.length ?? 0} entries`, href: '/app/profile/edit/education', icon: GraduationCap },
    { label: 'Skills', desc: `${profile.skills?.length ?? 0} skills`, href: '/app/profile/edit/basic-info', icon: Award },
    { label: 'Certifications', desc: `${profile.certifications?.length ?? 0} entries`, href: '/app/profile/edit/certifications', icon: Award },
    { label: 'Achievements', desc: `${profile.achievements?.length ?? 0} entries`, href: '/app/profile/edit/achievements', icon: Award },
    { label: 'Projects', desc: `${profile.projects?.length ?? 0} entries`, href: '/app/profile/edit/projects', icon: FileText },
    { label: 'Desired roles', desc: (profile.desiredRoles?.length ?? 0) > 0 ? profile.desiredRoles!.slice(0, 2).join(', ') : 'Not set', href: '/app/profile/edit/desired-roles', icon: Briefcase },
    { label: 'Salary', desc: profile.salaryMaxPref > 0 ? `${profile.salaryCurrency} ${Math.round(profile.salaryMaxPref / 1000)}k/yr` : 'Not set', href: '/app/profile/edit/salary', icon: Award },
    { label: 'Work authorization', desc: profile.workAuthorizationStatus || 'Not set', href: '/app/profile/edit/work-authorization', icon: FileText },
    { label: 'Work preferences', desc: 'In-person, relocation, start date', href: '/app/profile/edit/work-preferences', icon: Settings },
    { label: 'Equal opportunity', desc: 'Confidential — US compliance', href: '/app/profile/edit/equal-opportunity', icon: User },
    { label: 'Additional info', desc: 'Notice period, travel, etc.', href: '/app/profile/edit/additional-info', icon: FileText },
    { label: 'Resume optimization', desc: profile.resumeOptimizationLevel ?? 'honest', href: '/app/profile/edit/resume-optimization', icon: Settings },
  ];

  return (
    <div className="page narrow">
      {/* Header card */}
      <div className="card pad" style={{ marginBottom: 20 }}>
        <div className="row gap-16" style={{ marginBottom: 16 }}>
          <div style={{ position: 'relative' }}>
            <Avatar src={profile.avatar} name={profile.name} size="lg" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{ position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: '50%', background: 'var(--ink)', border: '2px solid var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Camera size={13} color="var(--inverse)" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
          </div>
          <div className="grow stack gap-4">
            <div className="t-title">{profile.name}</div>
            {profile.headline && <div className="t-callout muted">{profile.headline}</div>}
            {profile.location && <div className="t-caption muted">{profile.location}</div>}
          </div>
        </div>

        {/* Completion bar */}
        <div className="row between" style={{ marginBottom: 6 }}>
          <span className="t-caption muted">Profile completion</span>
          <span className="t-caption num">{completion}%</span>
        </div>
        <div className="meter">
          <span style={{ width: `${completion}%`, background: completion >= 80 ? 'var(--brand)' : 'var(--ink)' }} />
        </div>

        {/* Quick stats */}
        <div className="row gap-12" style={{ marginTop: 16 }}>
          <Link to="/app/plans" className="btn secondary sm" style={{ flex: 1 }}>
            {sub?.subscription_type === 'premium' ? `${sub.credits_remaining ?? 0} credits` : 'Free plan'}
          </Link>
          <Link to="/app/profile/resumes" className="btn secondary sm" style={{ flex: 1 }}>
            <FileText size={14} /> Resumes
          </Link>
          <Link to="/app/profile/preview" className="btn secondary sm" style={{ flex: 1 }}>
            <Eye size={14} /> Preview
          </Link>
        </div>
      </div>

      {/* Referral */}
      {referral?.referralCode && (
        <div className="banner green" style={{ marginBottom: 16 }}>
          <Gift size={18} />
          <div className="grow">
            <div className="t-caption" style={{ fontWeight: 600 }}>Your referral code: <strong>{referral.referralCode}</strong></div>
            <div className="t-caption">Share to earn free credits</div>
          </div>
        </div>
      )}

      {/* Sections list */}
      <div className="list card">
        {sections.map(({ label, desc, href, icon: Icon }) => (
          <Link key={href + label} to={href} className="list-row">
            <div className="logo sm"><Icon size={16} /></div>
            <div className="grow stack gap-2">
              <div className="t-body">{label}</div>
              <div className="t-caption muted">{desc}</div>
            </div>
            <ChevronRight size={16} className="chev" />
          </Link>
        ))}
      </div>
    </div>
  );
}
