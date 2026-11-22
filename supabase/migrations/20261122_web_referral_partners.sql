-- Website-only influencer referral partners. Additive: a new table the mobile
-- app never reads. RLS is on with no policies, so only the service role (the
-- Cloudflare functions) can read or write it.
create table if not exists public.web_referral_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  promo_code text not null unique check (promo_code = upper(promo_code) and length(promo_code) between 2 and 64),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,63}$'),
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.web_referral_partners enable row level security;
