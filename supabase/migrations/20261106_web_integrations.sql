-- Website-only integrations. Additive: creates new objects and changes nothing the
-- mobile app uses. The app never reads these tables. NOT applied automatically.
create table if not exists public.web_integrations (
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (char_length(provider) <= 40),
  status text not null check (status in ('off', 'requested', 'linked')),
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, provider)
);
alter table public.web_integrations enable row level security;

drop policy if exists "manage own web integrations" on public.web_integrations;
create policy "manage own web integrations" on public.web_integrations
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- WhatsApp: written only by the server. The number comes from the person's own
-- inbound message, so nobody can subscribe someone else's phone.
create table if not exists public.web_whatsapp_links (
  user_id uuid primary key references auth.users (id) on delete cascade,
  link_code text unique,
  code_expires_at timestamptz,
  wa_phone text unique,
  status text not null default 'pending' check (status in ('pending', 'connected', 'stopped')),
  connected_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.web_whatsapp_links enable row level security;

drop policy if exists "read own whatsapp link" on public.web_whatsapp_links;
create policy "read own whatsapp link" on public.web_whatsapp_links
  for select to authenticated using (auth.uid() = user_id);
