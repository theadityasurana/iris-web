-- Additive: revenue share per influencer and how much has been paid to them (USD cents).
alter table public.web_referral_partners
  add column if not exists commission_percent numeric(5,2) not null default 20 check (commission_percent >= 0 and commission_percent <= 100),
  add column if not exists paid_out_cents integer not null default 0 check (paid_out_cents >= 0);
