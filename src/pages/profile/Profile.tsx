import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Eye, FileText, Gift, MapPin, Phone, Linkedin, Github, ExternalLink, Pencil } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { useSubscription } from '@web/lib/queries';
import { useToast } from '@web/ui/Toast';
import { Avatar, CompanyLogo, formatDate } from '@web/ui/bits';
import { getReferralStats } from '@/lib/referral';
import { useQuery } from '@tanstack/react-query';

function EditBtn({ to }: { to: string }) {
  return (
    <Link to={to} className="btn ghost sm" style={{ gap: 5 }}>
      <Pencil size={13} />Edit
    </Link>
  );
}

function SectionCard({ title, editTo, children, empty }: { title: string; editTo: string; children?: React.ReactNode; empty?: string }) {
  return (
    <div className="card pad profile-section">
      <div className="row between" style={{ marginBottom: children ? 16 : 0 }}>
        <span className="t-sub">{title}</span>
        <EditBtn to={editTo} />
      </div>
      {children ?? (empty && <p className="t-callout muted">{empty}</p>)}
    </div>
  );
}

export default function Profile() {
  const { profile, profileRow, userId, uploadAvatar } = useAuth();
  const { data: sub } = useSubscription();
  const showToast = useToast();
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

  return (
    <div className="page profile-page">
      <div className="profile-layout">
        {/* ── Left column: identity ── */}
        <aside className="profile-aside">
          {/* Avatar + name */}
          <div className="card pad" style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
              <Avatar src={profile.avatar} name={profile.name} size="xl" />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="avatar-edit-btn"
                aria-label="Change photo"
              >
                {uploading ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <Camera size={13} />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            </div>
            <div className="t-heading" style={{ marginBottom: 4 }}>{profile.name}</div>
            {profile.headline && <div className="t-callout muted" style={{ marginBottom: 6 }}>{profile.headline}</div>}
            {profile.location && (
              <div className="row gap-4" style={{ justifyContent: 'center', color: 'var(--ink-3)' }}>
                <MapPin size={13} /><span className="t-caption">{profile.location}</span>
              </div>
            )}
            <div className="row gap-8" style={{ marginTop: 14, justifyContent: 'center' }}>
              <Link to="/app/profile/preview" className="btn outline sm"><Eye size={13} />Preview</Link>
              <Link to="/app/profile/resumes" className="btn outline sm"><FileText size={13} />Resume</Link>
            </div>
          </div>

          {/* Completion */}
          <div className="card pad">
            <div className="row between" style={{ marginBottom: 8 }}>
              <span className="t-callout" style={{ fontWeight: 600 }}>Profile strength</span>
              <span className="t-callout num" style={{ color: completion >= 80 ? 'var(--brand-ink)' : 'var(--ink-3)' }}>{completion}%</span>
            </div>
            <div className="meter"><span style={{ width: `${completion}%`, background: completion >= 80 ? 'var(--brand)' : 'var(--ink)' }} /></div>
          </div>

          {/* Plan */}
          <Link to="/app/plans" className="card pad" style={{ display: 'block' }}>
            <div className="row between">
              <span className="t-callout muted">Plan</span>
              <span className="t-callout" style={{ fontWeight: 600 }}>
                {profileRow?.subscription_type ? profileRow.subscription_type.charAt(0).toUpperCase() + profileRow.subscription_type.slice(1) : 'Free'}
              </span>
            </div>
            {profileRow?.applications_remaining != null && (
              <div className="row between" style={{ marginTop: 6 }}>
                <span className="t-caption muted">Credits left</span>
                <span className="t-caption num">{profileRow.applications_remaining}</span>
              </div>
            )}
          </Link>

          {/* Contact */}
          <SectionCard title="Contact" editTo="/app/profile/edit/contact">
            <div className="stack gap-8">
              {profile.phone && <div className="row gap-8 t-callout"><Phone size={14} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />{profile.phone}</div>}
              {profile.linkedinUrl && (
                <a href={profile.linkedinUrl} target="_blank" rel="noopener" className="row gap-8 t-callout" style={{ color: 'var(--ink-2)' }}>
                  <Linkedin size={14} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />LinkedIn<ExternalLink size={11} style={{ marginLeft: 'auto', color: 'var(--ink-4)' }} />
                </a>
              )}
              {profile.githubUrl && (
                <a href={profile.githubUrl} target="_blank" rel="noopener" className="row gap-8 t-callout" style={{ color: 'var(--ink-2)' }}>
                  <Github size={14} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />GitHub<ExternalLink size={11} style={{ marginLeft: 'auto', color: 'var(--ink-4)' }} />
                </a>
              )}
              {!profile.phone && !profile.linkedinUrl && !profile.githubUrl && (
                <p className="t-caption muted">No contact info added.</p>
              )}
            </div>
          </SectionCard>

          {/* Preferences */}
          <SectionCard title="Job preferences" editTo="/app/profile/edit/jobtypeprefs">
            <div className="stack gap-6">
              {(profile.jobPreferences?.length ?? 0) > 0 && (
                <div className="chips">{profile.jobPreferences!.map(p => <span key={p} className="chip static">{p}</span>)}</div>
              )}
              {(profile.workModePreferences?.length ?? 0) > 0 && (
                <div className="chips">{profile.workModePreferences!.map(p => <span key={p} className="chip static">{p}</span>)}</div>
              )}
              {(profile.preferredCities?.length ?? 0) > 0 && (
                <div className="chips">{profile.preferredCities!.slice(0, 4).map(c => <span key={c} className="chip static">{c}</span>)}</div>
              )}
              {!profile.jobPreferences?.length && !profile.workModePreferences?.length && (
                <p className="t-caption muted">No preferences set.</p>
              )}
            </div>
          </SectionCard>

          {/* Referral */}
          {referral?.referralCode && (
            <div className="banner green">
              <Gift size={16} />
              <div className="grow">
                <div className="t-caption" style={{ fontWeight: 600 }}>Referral code: {referral.referralCode}</div>
                <div className="t-caption">Share to earn free credits</div>
              </div>
            </div>
          )}
        </aside>

        {/* ── Right column: content ── */}
        <div className="profile-main">
          {/* Bio / headline */}
          <SectionCard title="About" editTo="/app/profile/edit/bio" empty="No bio added yet.">
            {profile.bio ? <p className="prose">{profile.bio}</p> : undefined}
          </SectionCard>

          {/* Skills */}
          <SectionCard title="Skills" editTo="/app/profile/edit/topskills"
            empty="No skills added yet.">
            {(profile.skills?.length ?? 0) > 0 ? (
              <div className="chips">
                {profile.skills!.map(s => (
                  <span key={s} className={`chip static ${profile.topSkills?.includes(s) ? 'top-skill' : ''}`}>{s}</span>
                ))}
              </div>
            ) : undefined}
          </SectionCard>

          {/* Experience */}
          <SectionCard title="Experience" editTo="/app/profile/edit/experience"
            empty="No experience added yet.">
            {(profile.experience?.length ?? 0) > 0 ? (
              <div className="stack gap-16">
                {profile.experience!.map((e, i) => (
                  <div key={e.id ?? i} className={i > 0 ? 'profile-entry' : ''}>
                    <div className="row gap-12" style={{ alignItems: 'flex-start' }}>
                      <CompanyLogo name={e.company} size="sm" />
                      <div className="grow">
                        <div className="t-body" style={{ fontWeight: 600 }}>{e.title}</div>
                        <div className="t-callout muted">{e.company}{e.employmentType ? ` · ${e.employmentType}` : ''}</div>
                        <div className="t-caption muted" style={{ marginTop: 2 }}>
                          {e.startDate} – {e.isCurrent ? 'Present' : (e.endDate ?? '')}
                          {e.jobLocation ? ` · ${e.jobLocation}` : ''}
                        </div>
                        {e.description && <p className="t-callout" style={{ marginTop: 8, color: 'var(--ink-2)' }}>{e.description}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : undefined}
          </SectionCard>

          {/* Education */}
          <SectionCard title="Education" editTo="/app/profile/edit/education"
            empty="No education added yet.">
            {(profile.education?.length ?? 0) > 0 ? (
              <div className="stack gap-16">
                {profile.education!.map((e, i) => (
                  <div key={e.id ?? i} className={i > 0 ? 'profile-entry' : ''}>
                    <div className="t-body" style={{ fontWeight: 600 }}>{e.institution}</div>
                    <div className="t-callout muted">{e.degree}{e.field ? ` · ${e.field}` : ''}</div>
                    {(e.startDate || e.endDate) && (
                      <div className="t-caption muted">{e.startDate} – {e.endDate}</div>
                    )}
                    {e.description && <p className="t-callout" style={{ marginTop: 6, color: 'var(--ink-2)' }}>{e.description}</p>}
                  </div>
                ))}
              </div>
            ) : undefined}
          </SectionCard>

          {/* Achievements */}
          <SectionCard title="Achievements" editTo="/app/profile/edit/achievements"
            empty="No achievements added yet.">
            {(profile.achievements?.length ?? 0) > 0 ? (
              <div className="stack gap-12">
                {profile.achievements!.map((a, i) => (
                  <div key={a.id ?? i} className={i > 0 ? 'profile-entry' : ''}>
                    <div className="t-body" style={{ fontWeight: 600 }}>{a.title}</div>
                    {a.issuer && <div className="t-callout muted">{a.issuer}{a.date ? ` · ${a.date}` : ''}</div>}
                    {a.description && <p className="t-callout" style={{ marginTop: 4, color: 'var(--ink-2)' }}>{a.description}</p>}
                  </div>
                ))}
              </div>
            ) : undefined}
          </SectionCard>

          {/* Certifications */}
          <SectionCard title="Certifications" editTo="/app/profile/edit/certifications"
            empty="No certifications added yet.">
            {(profile.certifications?.length ?? 0) > 0 ? (
              <div className="stack gap-12">
                {profile.certifications!.map((c, i) => (
                  <div key={c.id ?? i} className={i > 0 ? 'profile-entry' : ''}>
                    <div className="row gap-8">
                      <div className="grow">
                        <div className="t-body" style={{ fontWeight: 600 }}>{c.name}</div>
                        <div className="t-callout muted">{c.issuingOrganization}</div>
                      </div>
                      {c.credentialUrl && (
                        <a href={c.credentialUrl} target="_blank" rel="noopener" className="btn ghost sm"><ExternalLink size={13} />View</a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : undefined}
          </SectionCard>

          {/* Projects */}
          <SectionCard title="Projects" editTo="/app/profile/edit/projects"
            empty="No projects added yet.">
            {(profile.projects?.length ?? 0) > 0 ? (
              <div className="stack gap-16">
                {profile.projects!.map((p, i) => (
                  <div key={p.id ?? i} className={i > 0 ? 'profile-entry' : ''}>
                    <div className="row gap-8">
                      <div className="grow">
                        <div className="t-body" style={{ fontWeight: 600 }}>{p.title}</div>
                        {p.organization && <div className="t-callout muted">{p.organization}{p.date ? ` · ${p.date}` : ''}</div>}
                      </div>
                      {p.link && <a href={p.link} target="_blank" rel="noopener" className="btn ghost sm"><ExternalLink size={13} />View</a>}
                    </div>
                    {p.bullets?.length > 0 && (
                      <ul className="bullets" style={{ marginTop: 8 }}>
                        {p.bullets.map((b, j) => <li key={j}>{b}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            ) : undefined}
          </SectionCard>

          {/* Desired roles */}
          <SectionCard title="Desired roles" editTo="/app/profile/edit/desiredroles"
            empty="No desired roles set.">
            {(profile.desiredRoles?.length ?? 0) > 0 ? (
              <div className="chips">{profile.desiredRoles!.map(r => <span key={r} className="chip static">{r}</span>)}</div>
            ) : undefined}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
