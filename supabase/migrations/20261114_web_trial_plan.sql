-- Website-only: allow the 14-day Trial plan in web_subscriptions.
-- Touches only the website's own table; nothing the mobile app reads. NOT applied automatically.
alter table public.web_subscriptions drop constraint if exists web_subscriptions_plan_check;
alter table public.web_subscriptions add constraint web_subscriptions_plan_check
  check (plan in ('starter', 'pro', 'ultra', 'trial'));
alter table public.web_subscriptions drop constraint if exists web_subscriptions_period_check;
alter table public.web_subscriptions add constraint web_subscriptions_period_check
  check (period in ('monthly', 'quarterly', 'biweekly'));
