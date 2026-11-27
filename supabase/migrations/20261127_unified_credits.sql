-- One wallet: website purchases add their credits to profiles.applications_remaining (the balance the
-- app, the website and Iris auto-apply all spend), exactly once per paid period.

create table if not exists public.web_credit_grants (
  dodo_subscription_id text not null,
  period_end timestamptz not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  amount integer not null check (amount > 0),
  granted_at timestamptz not null default now(),
  primary key (dodo_subscription_id, period_end)
);
alter table public.web_credit_grants enable row level security;

-- Adds p_amount to the user's wallet once for (subscription, period). Returns true if it granted now.
create or replace function public.grant_web_period_credits(p_user_id uuid, p_subscription_id text, p_period_end timestamptz, p_amount integer)
returns boolean
language plpgsql
security definer
set search_path to ''
as $function$
declare
  inserted integer;
begin
  if p_amount is null or p_amount <= 0 then return false; end if;
  insert into public.web_credit_grants (dodo_subscription_id, period_end, user_id, amount)
  values (p_subscription_id, p_period_end, p_user_id, p_amount)
  on conflict do nothing;
  get diagnostics inserted = row_count;
  if inserted = 0 then return false; end if;
  update public.profiles
     set applications_remaining = coalesce(applications_remaining, 0) + p_amount
   where id = p_user_id;
  return true;
end;
$function$;
revoke all on function public.grant_web_period_credits(uuid, text, timestamptz, integer) from public, anon, authenticated;
