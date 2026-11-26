-- Server-side twin of consume_web_credit(): spends one website credit for a given user.
-- Used by the iris-auto-apply edge function (service role) for people who pay on the website.
create or replace function public.consume_web_credit_for(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path to ''
as $function$
declare
  updated integer;
begin
  update public.web_subscriptions
     set credits_remaining = credits_remaining - 1, updated_at = now()
   where user_id = p_user_id
     and status in ('active', 'cancelled')
     and credits_remaining > 0
     and (current_period_end is null or current_period_end > now());
  get diagnostics updated = row_count;
  return updated = 1;
end;
$function$;
revoke all on function public.consume_web_credit_for(uuid) from public, anon, authenticated;
