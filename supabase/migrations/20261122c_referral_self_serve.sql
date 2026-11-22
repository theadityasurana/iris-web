-- Additive: self-serve partner sign-up from the website footer.
alter table public.web_referral_partners
  add column if not exists email text,
  add column if not exists social text,
  add column if not exists source text not null default 'admin' check (source in ('admin', 'self')),
  add column if not exists ip_hash text;

create unique index if not exists web_referral_partners_email_key on public.web_referral_partners (lower(email)) where email is not null;
create index if not exists web_referral_partners_ip_recent on public.web_referral_partners (ip_hash, created_at) where ip_hash is not null;
