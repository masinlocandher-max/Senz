-- SENZ AI Platform only. Apply to a DEDICATED Supabase project, not the legacy marketing/inquiry database.
-- All tables are backend-only. The public browser must never receive a secret/service-role key.
begin;
create table if not exists public.senz_organizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  brand_color text not null default '#2451D9',
  white_label_name text,
  created_at timestamptz not null default now()
);
create table if not exists public.senz_memberships (
  org_id uuid not null references public.senz_organizations(id) on delete cascade,
  user_id uuid not null,
  role text not null check(role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  primary key(org_id,user_id)
);
create index if not exists senz_memberships_user_idx on public.senz_memberships(user_id);
create table if not exists public.senz_entitlements (
  org_id uuid primary key references public.senz_organizations(id) on delete cascade,
  products text[] not null default '{}',
  seats integer not null default 1 check(seats between 1 and 10000),
  white_label boolean not null default false,
  status text not null default 'inactive' check(status in ('inactive','active','suspended')),
  active_until timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.senz_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.senz_organizations(id),
  user_id uuid not null,
  plan text not null,
  products text[] not null,
  seats integer not null,
  duration_days integer not null,
  white_label boolean not null default false,
  amount_centavos integer not null check(amount_centavos > 0),
  checkout_session_id text unique,
  payment_id text,
  paid_event_id text,
  livemode boolean not null,
  status text not null default 'pending' check(status in ('pending','paid','canceled')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists senz_orders_user_idx on public.senz_orders(user_id,created_at desc);
create table if not exists public.senz_entries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.senz_organizations(id) on delete cascade,
  product text not null check(product in ('frontdesk','sales','knowledge','workspace','content','workflow')),
  title text not null,
  body text not null default '',
  status text not null default 'draft',
  meta jsonb not null default '{}'::jsonb,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists senz_entries_org_product_idx on public.senz_entries(org_id,product,created_at desc);
create table if not exists public.senz_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.senz_organizations(id) on delete cascade,
  email text not null,
  token_hash text not null unique,
  role text not null default 'member' check(role in ('member','admin')),
  created_by uuid not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_by uuid
);
create index if not exists senz_invites_org_idx on public.senz_invites(org_id,created_at desc);
create table if not exists public.senz_ai_usage (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.senz_organizations(id) on delete cascade,
  user_id uuid not null,
  product text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists senz_usage_period_idx on public.senz_ai_usage(org_id,user_id,created_at desc);

do $$
declare t text;
begin
  foreach t in array array['senz_organizations','senz_memberships','senz_entitlements','senz_orders','senz_entries','senz_invites','senz_ai_usage']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;

-- Atomic idempotent fulfillment. Only the server's service role can invoke this RPC.
create or replace function public.senz_fulfill_paid_order(
  p_order_id uuid, p_session_id text, p_payment_id text, p_event_id text, p_live boolean
) returns boolean
language plpgsql security definer set search_path = public, pg_temp
as $$
declare o public.senz_orders%rowtype;
begin
  select * into o from public.senz_orders where id=p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if o.checkout_session_id is distinct from p_session_id or o.livemode is distinct from p_live then
    raise exception 'Session or payment mode mismatch';
  end if;
  if o.status='paid' then return false; end if;
  if o.status <> 'pending' then raise exception 'Order is not pending'; end if;
  update public.senz_orders
  set status='paid', paid_at=now(), payment_id=p_payment_id, paid_event_id=p_event_id
  where id=o.id;
  insert into public.senz_entitlements(org_id,products,seats,white_label,status,active_until)
  values(o.org_id,o.products,o.seats,o.white_label,'active',now()+make_interval(days=>o.duration_days))
  on conflict(org_id) do update set
    products=(select array_agg(distinct v) from unnest(public.senz_entitlements.products || excluded.products) as v),
    seats=greatest(public.senz_entitlements.seats,excluded.seats),
    white_label=public.senz_entitlements.white_label or excluded.white_label,
    status='active',
    active_until=greatest(public.senz_entitlements.active_until,now())+make_interval(days=>o.duration_days),
    updated_at=now();
  return true;
end $$;
revoke all on function public.senz_fulfill_paid_order(uuid,text,text,text,boolean) from public, anon, authenticated;
grant execute on function public.senz_fulfill_paid_order(uuid,text,text,text,boolean) to service_role;
commit;
