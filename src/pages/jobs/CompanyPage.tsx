import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Building2, ExternalLink, Users, MapPin, Briefcase } from 'lucide-react';
import { CompanyLogo, Empty, SkeletonRows } from '@web/ui/bits';
import { fetchCompanyFromSupabase, fetchJobsByCompany } from '@/lib/jobs';

export default function CompanyPage() {
  const { name = '' } = useParams();
  const company = decodeURIComponent(name);
  const navigate = useNavigate();
  const { data: info } = useQuery({ queryKey: ['company', company], queryFn: () => fetchCompanyFromSupabase(company) });
  const { data: jobs = [], isLoading } = useQuery({ queryKey: ['company-jobs', company], queryFn: () => fetchJobsByCompany(company) });
  const website = info?.website ? (info.website.startsWith('http') ? info.website : `https://${info.website}`) : null;

  return (
    <div className="page narrow">
      <button className="crumb" onClick={() => navigate(-1)}><ArrowLeft />Back</button>
      <header className="row gap-16" style={{ alignItems: 'center' }}>
        <CompanyLogo name={company} url={info?.logo_url} website={info?.website} size="lg" />
        <div className="grow">
          <h1 className="t-title">{info?.name || company}</h1>
          {info?.one_liner && <p className="t-body muted" style={{ marginTop: 4 }}>{info.one_liner}</p>}
        </div>
      </header>
      <div className="facts" style={{ marginTop: 16 }}>
        {info?.industry && <span><Building2 />{info.industry}</span>}
        {info?.size && <span><Users />{info.size}</span>}
        {info?.headquarters && <span><MapPin />{info.headquarters}</span>}
        {website && <a href={website} target="_blank" rel="noreferrer"><ExternalLink />Website</a>}
      </div>
      {info?.description && <p className="t-body soft" style={{ marginTop: 18 }}>{info.description}</p>}

      <div className="section">
        <div className="section-head"><h2 className="t-heading">Open roles</h2><span className="t-callout muted num">{jobs.length}</span></div>
        {isLoading ? <SkeletonRows n={3} /> : jobs.length === 0 ? (
          <Empty icon={Briefcase} title="No open roles right now" />
        ) : (
          <div className="list lined card">
            {jobs.map(j => (
              <Link key={j.id} to={`/app/jobs/${j.id}`} className="list-row">
                <div className="grow">
                  <div className="t-sub ellipsis">{j.jobTitle}</div>
                  <div className="t-callout muted ellipsis">{j.location} · {j.employmentType} · {j.postedDate}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
