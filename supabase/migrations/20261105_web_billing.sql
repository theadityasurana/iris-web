-- Website-only billing. Additive: creates new objects and changes nothing the
-- mobile app uses. The app never reads these tables. NOT applied automatically.
create table if not exists public.web_subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null check (plan in ('starter', 'pro', 'ultra')),
  period text not null check (period in ('monthly', 'quarterly')),
  status text not null check (status in ('active', 'on_hold', 'cancelled', 'expired')),
  credits_remaining integer not null default 0 check (credits_remaining >= 0),
  credits_limit integer not null default 0,
  current_period_end timestamptz,
  dodo_subscription_id text,
  dodo_customer_id text,
  updated_at timestamptz not null default now()
);

create table if not exists public.web_billing_events (
  webhook_id text primary key,
  event_type text not null,
  user_id uuid,
  payload jsonb not null,
  received_at timestamptz not null default now()
);

alter table public.web_subscriptions enable row level security;
alter table public.web_billing_events enable row level security;

-- Users can read their own plan. Only the service role (webhook) can write.
drop policy if exists "read own web subscription" on public.web_subscriptions;
create policy "read own web subscription" on public.web_subscriptions
  for select to authenticated using (auth.uid() = user_id);

-- Atomically spends one website credit for the caller. Returns false if none are available.
create or replace function public.consume_web_credit()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated integer;
begin
  update public.web_subscriptions
     set credits_remaining = credits_remaining - 1, updated_at = now()
   where user_id = auth.uid()
     and status in ('active', 'cancelled')
     and credits_remaining > 0
     and (current_period_end is null or current_period_end > now());
  get diagnostics updated = row_count;
  return updated = 1;
end;
$$;

revoke all on function public.consume_web_credit() from public, anon;
grant execute on function public.consume_web_credit() to authenticated;
