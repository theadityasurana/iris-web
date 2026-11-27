-- One-time move of website credits into the shared wallet (profiles.applications_remaining).
-- Only for people whose profile can spend that wallet right now; everyone else is left untouched.
begin;

create table if not exists public.web_credit_migration_log (
  user_id uuid primary key,
  app_before integer not null,
  web_before integer not null,
  app_after integer,
  web_after integer,
  moved_at timestamptz not null default now()
);
alter table public.web_credit_migration_log enable row level security;

with movers as (
  select w.user_id, coalesce(p.applications_remaining, 0) app_before, w.credits_remaining web_before,
         w.dodo_subscription_id, w.current_period_end, w.credits_limit
  from public.web_subscriptions w
  join public.profiles p on p.id = w.user_id
  where w.credits_remaining > 0
    and w.status in ('active', 'cancelled')
    and (w.current_period_end is null or w.current_period_end > now())
    and public.has_paid_access(p.subscription_type, p.subscription_status, p.subscription_end_date)
    and not exists (select 1 from public.web_credit_migration_log l where l.user_id = w.user_id)
),
logged as (
  insert into public.web_credit_migration_log (user_id, app_before, web_before)
  select user_id, app_before, web_before from movers
  returning user_id
),
-- This period was already paid out on the website: mark it granted so a repeat event can't add it again.
marked as (
  insert into public.web_credit_grants (dodo_subscription_id, period_end, user_id, amount)
  select dodo_subscription_id, current_period_end, user_id, greatest(credits_limit, 1) from movers
  where dodo_subscription_id is not null and current_period_end is not null
  on conflict do nothing
  returning user_id
),
added as (
  update public.profiles p set applications_remaining = m.app_before + m.web_before
  from movers m where p.id = m.user_id
  returning p.id
)
update public.web_subscriptions w set credits_remaining = 0, updated_at = now()
from movers m where w.user_id = m.user_id;

update public.web_credit_migration_log l
   set app_after = p.applications_remaining, web_after = w.credits_remaining
  from public.profiles p, public.web_subscriptions w
 where p.id = l.user_id and w.user_id = l.user_id and l.app_after is null;

commit;
