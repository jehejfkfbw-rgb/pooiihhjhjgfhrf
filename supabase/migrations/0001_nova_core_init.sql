-- ============================================================
-- NOVA DIGITAL — Supabase Migration الكاملة
-- شغّل الملف ده كله في: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ---------- جداول الشركة ----------
create table if not exists public.projects (
  id serial primary key,
  title text not null,
  client text not null default '',
  type text not null default 'website',
  description text not null default '',
  tech text not null default '',
  status text not null default 'ongoing',
  progress integer not null default 0,
  budget integer not null default 0,
  year text not null default '2025',
  created_at timestamp not null default now()
);

create table if not exists public.ai_devs (
  id serial primary key,
  code text not null,
  name text not null,
  role text not null,
  stack text not null default '',
  avatar text not null default '/img/dev-1.png',
  level integer not null default 10,
  xp integer not null default 50,
  projects_done integer not null default 0,
  status text not null default 'online',
  mission text not null default ''
);

create table if not exists public.knowledge (
  id serial primary key,
  category text not null default 'عام',
  patterns jsonb not null default '[]'::jsonb,
  answer text not null,
  active boolean not null default true,
  priority integer not null default 1,
  hits integer not null default 0,
  created_at timestamp not null default now()
);

create table if not exists public.settings (
  key text primary key,
  value text not null
);

create table if not exists public.leads (
  id serial primary key,
  name text not null,
  phone text not null default '',
  service text not null default '',
  message text not null default '',
  status text not null default 'new',
  created_at timestamp not null default now()
);

create table if not exists public.chat_logs (
  id serial primary key,
  session_id text not null default '',
  question text not null,
  answer text not null,
  matched boolean not null default false,
  in_hours boolean not null default true,
  created_at timestamp not null default now()
);

create table if not exists public.services (
  id serial primary key,
  name text not null,
  category text not null default 'web',
  description text not null default '',
  price integer not null default 0,
  delivery_days integer not null default 7,
  features jsonb not null default '[]'::jsonb,
  popular boolean not null default false,
  active boolean not null default true
);

-- ---------- نظام الحسابات: ملفات المستخدمين ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now()
);

-- ---------- الطلبات (بعمود ربط المستخدم) ----------
create table if not exists public.orders (
  id serial primary key,
  code text not null,
  name text not null,
  phone text not null,
  user_id text not null default '',
  service_id integer not null default 0,
  service_name text not null default '',
  details text not null default '',
  price integer not null default 0,
  delivery_days integer not null default 7,
  status text not null default 'new',
  progress integer not null default 0,
  assignee text not null default '',
  agent_id integer not null default 0,
  deadline timestamp,
  deliverable text not null default '',
  deliverable_name text not null default '',
  events jsonb not null default '[]'::jsonb,
  created_at timestamp not null default now()
);

create table if not exists public.staff (
  id serial primary key,
  name text not null,
  role text not null default '',
  dept text not null default '',
  online boolean not null default true
);

-- ---------- فهارس الأداء ----------
create index if not exists orders_code_idx on public.orders (code);
create index if not exists orders_user_idx on public.orders (user_id);
create unique index if not exists orders_code_unique on public.orders (code);
create index if not exists chat_logs_session_idx on public.chat_logs (session_id);

-- ---------- أوتوماتيك إنشاء بروفايل لكل مستخدم جديد ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- RLS — سياسات الحماية لكل جدول
-- ============================================================

alter table public.projects enable row level security;
alter table public.ai_devs enable row level security;
alter table public.knowledge enable row level security;
alter table public.settings enable row level security;
alter table public.leads enable row level security;
alter table public.chat_logs enable row level security;
alter table public.services enable row level security;
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.staff enable row level security;
alter table public.security_agents enable row level security;
alter table public.security_events enable row level security;
alter table public.security_reports enable row level security;

-- الكتالوج: قراءة عامة للجميع (الموقع بيعرضه)
drop policy if exists services_public_read on public.services;
create policy services_public_read on public.services for select using (true);

-- البروفايلات: كل مستخدم يقرا ويعدّل بروفايله بس
drop policy if exists profiles_read_own on public.profiles;
create policy profiles_read_own on public.profiles for select using (auth.uid() = id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update using (auth.uid() = id);
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert with check (auth.uid() = id);

-- الطلبات: المستخدم يشوف طلباته بس، ويسجّل طلب بحسابه
drop policy if exists orders_read_own on public.orders;
create policy orders_read_own on public.orders for select using (auth.uid()::text = user_id);
drop policy if exists orders_insert_own on public.orders;
create policy orders_insert_own on public.orders for insert with check (auth.uid()::text = user_id);

-- باقي الجداول (knowledge, settings, leads, chat_logs, projects, ai_devs, staff):
-- مفيش سياسات قراءة عامة — الوصول ليها من سيرفر Next.js فقط (Connection مباشر)
-- وده اللي بيحافظ على خصوصية قاعدة المعرفة والمحادثات والإعدادات بالكامل.
