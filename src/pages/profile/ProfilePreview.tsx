import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Mail, Phone, Linkedin, Github, Briefcase, GraduationCap, Award, Star } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { Avatar } from '@web/ui/bits';

export default function ProfilePreview() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  if (!profile) return null;

  return (
    <div className="page narrow">
      <button className="crumb" onClick={() => navigate('/app/profile')}><ChevronLeft size={16} />Profile</button>
      <div className="page-head">
        <h1 className="t-title">Profile Preview</h1>
        <span className="badge">How recruiters see you</span>
      </div>

      {/* Header card */}
      <div className="card pad" style={{ marginBottom: 16 }}>
        <div className="row gap-16" style={{ marginBottom: 16 }}>
          <Avatar src={profile.avatar} name={profile.name} size="xl" />
          <div className="grow">
            <div className="t-title" style={{ fontSize: 22 }}>{profile.name}</div>
            {profile.headline && <div className="t-sub" style={{ color: 'var(--ink-2)', marginTop: 4 }}>{profile.headline}</div>}
            {profile.location && (
              <div className="row gap-6" style={{ marginTop: 6, color: 'var(--ink-3)' }}>
                <MapPin size={14} /><span className="t-callout">{profile.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Contact row */}
        <div className="row gap-16" style={{ flexWrap: 'wrap' }}>
          {profile.email && <a href={`mailto:${profile.email}`} className="row gap-6 t-callout" style={{ color: 'var(--ink-2)' }}><Mail size={14} />{profile.email}</a>}
          {profile.phone && <span className="row gap-6 t-callout" style={{ color: 'var(--ink-2)' }}><Phone size={14} />{profile.phone}</span>}
          {profile.linkedinUrl && <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="row gap-6 t-callout" style={{ color: 'var(--ink-2)' }}><Linkedin size={14} />LinkedIn</a>}
          {profile.githubUrl && <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="row gap-6 t-callout" style={{ color: 'var(--ink-2)' }}><Github size={14} />GitHub</a>}
        </div>

        {profile.bio && <p className="prose" style={{ marginTop: 14 }}>{profile.bio}</p>}
      </div>

      {/* Skills */}
      {profile.skills.length > 0 && (
        <div className="card pad" style={{ marginBottom: 16 }}>
          <div className="row gap-8" style={{ marginBottom: 12 }}><Star size={16} style={{ color: 'var(--ink-3)' }} /><span className="t-sub">Skills</span></div>
          <div className="chips">
            {profile.skills.map(s => (
              <span key={s} className={`chip static ${profile.topSkills?.includes(s) ? 'on' : ''}`}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {profile.experience.length > 0 && (
        <div className="card pad" style={{ marginBottom: 16 }}>
          <div className="row gap-8" style={{ marginBottom: 16 }}><Briefcase size={16} style={{ color: 'var(--ink-3)' }} /><span className="t-sub">Experience</span></div>
          <div className="stack gap-16">
            {profile.experience.map(exp => (
              <div key={exp.id}>
                <div className="t-sub">{exp.title}</div>
                <div className="t-callout" style={{ color: 'var(--ink-2)' }}>{exp.company}</div>
                <div className="t-callout" style={{ color: 'var(--ink-3)' }}>{exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}</div>
                {exp.description && <p className="prose" style={{ marginTop: 6, fontSize: 14 }}>{exp.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {profile.education.length > 0 && (
        <div className="card pad" style={{ marginBottom: 16 }}>
          <div className="row gap-8" style={{ marginBottom: 16 }}><GraduationCap size={16} style={{ color: 'var(--ink-3)' }} /><span className="t-sub">Education</span></div>
          <div className="stack gap-16">
            {profile.education.map(edu => (
              <div key={edu.id}>
                <div className="t-sub">{edu.degree} in {edu.field}</div>
                <div className="t-callout" style={{ color: 'var(--ink-2)' }}>{edu.institution}</div>
                <div className="t-callout" style={{ color: 'var(--ink-3)' }}>{edu.startDate} — {edu.endDate}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {profile.achievements.length > 0 && (
        <div className="card pad" style={{ marginBottom: 16 }}>
          <div className="row gap-8" style={{ marginBottom: 16 }}><Award size={16} style={{ color: 'var(--ink-3)' }} /><span className="t-sub">Achievements</span></div>
          <div className="stack gap-12">
            {profile.achievements.map(a => (
              <div key={a.id}>
                <div className="t-sub">{a.title}</div>
                <div className="t-callout" style={{ color: 'var(--ink-2)' }}>{a.issuer}{a.date ? ` · ${a.date}` : ''}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
