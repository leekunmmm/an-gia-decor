-- An Gia Decor - Initial Supabase Schema & RLS Policies
-- Generated for project an-gia-decor

create extension if not exists pgcrypto;

-- 1. Helper trigger for updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- 2. Admin whitelist table
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'admin' check (role in ('admin', 'super_admin')),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.admin_users enable row level security;

-- 3. Security-definer admin check function
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

drop policy if exists "admin_users_self_read" on public.admin_users;
create policy "admin_users_self_read"
  on public.admin_users
  for select
  to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- 4. Brand & contact site_settings (singleton row id = 1)
create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  name text not null,
  short_name text not null,
  sub_name text not null,
  monogram text not null,
  domain text not null,
  tagline text not null,
  description text not null,
  hotline text not null,
  hotline_raw text not null,
  email text not null,
  zalo_url text not null default '',
  messenger_url text not null default '',
  tiktok_url text not null default '',
  shopee_url text not null default '',
  address text not null,
  hours text not null,
  map_embed_url text not null default '',
  experience_stat text not null default '10+',
  experience_label text not null default 'Năm kinh nghiệm',
  copyright_year text not null default '2026',
  logo_horizontal text not null default '/images/an-gia-decor-logo-ngang.png',
  logo_stacked text not null default '/images/an-gia-decor-logo-full.png',
  logo_mark text not null default '/images/icon.png',
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.site_settings enable row level security;

drop policy if exists "site_settings_public_read" on public.site_settings;
create policy "site_settings_public_read"
  on public.site_settings
  for select
  to anon, authenticated
  using (true);

drop policy if exists "site_settings_admin_write" on public.site_settings;
create policy "site_settings_admin_write"
  on public.site_settings
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop trigger if exists trg_site_settings_updated_at on public.site_settings;
create trigger trg_site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.handle_updated_at();

-- 5. Categories
create table if not exists public.categories (
  slug text primary key,
  title text not null,
  group_id text not null,
  group_name text not null,
  banner_image text not null default '/images/hero-classic.jpg',
  preview_image text not null default '/images/sofa-nordic.jpg',
  subcategories jsonb not null default '[]'::jsonb,
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_categories_group_sort
  on public.categories (group_id, sort_order);

alter table public.categories enable row level security;

drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read"
  on public.categories
  for select
  to anon, authenticated
  using (true);

drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write"
  on public.categories
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
  before update on public.categories
  for each row execute function public.handle_updated_at();

-- 6. Products
create table if not exists public.products (
  slug text primary key,
  name text not null,
  category_slug text not null,
  category_name text not null,
  group_id text not null,
  group_name text not null,
  is_new boolean not null default false,
  price_label text not null default 'Liên hệ',
  images jsonb not null default '[]'::jsonb,
  application_image text not null default '/images/room-living.jpg',
  description text not null default '',
  highlights jsonb not null default '[]'::jsonb,
  colors jsonb not null default '[]'::jsonb,
  suitable_spaces jsonb not null default '[]'::jsonb,
  dimensions_and_materials text not null default '',
  care_instructions text not null default '',
  related_slugs jsonb not null default '[]'::jsonb,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_products_category_sort
  on public.products (category_slug, sort_order);
create index if not exists idx_products_group_sort
  on public.products (group_id, sort_order);

alter table public.products enable row level security;

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read"
  on public.products
  for select
  to anon, authenticated
  using (is_published = true or (select public.is_admin()));

drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write"
  on public.products
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();

-- 7. Collections
create table if not exists public.collections (
  slug text primary key,
  eyebrow text not null default '',
  title text not null,
  subtitle text not null default '',
  item_count text not null default '',
  image text not null default '/images/hero-leather.jpg',
  hover_image text,
  href text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.collections enable row level security;

drop policy if exists "collections_public_read" on public.collections;
create policy "collections_public_read"
  on public.collections
  for select
  to anon, authenticated
  using (true);

drop policy if exists "collections_admin_write" on public.collections;
create policy "collections_admin_write"
  on public.collections
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop trigger if exists trg_collections_updated_at on public.collections;
create trigger trg_collections_updated_at
  before update on public.collections
  for each row execute function public.handle_updated_at();

-- 8. Projects
create table if not exists public.projects (
  slug text primary key,
  title text not null,
  type text not null check (type in ('nha-pho', 'van-phong', 'cua-hang')),
  type_label text not null,
  location text not null default '',
  year text not null default '2026',
  area text not null default '',
  featured boolean not null default false,
  cover_image text not null default '/images/project-villa.jpg',
  gallery jsonb not null default '[]'::jsonb,
  summary text not null default '',
  scope jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_projects_type_sort
  on public.projects (type, sort_order);

alter table public.projects enable row level security;

drop policy if exists "projects_public_read" on public.projects;
create policy "projects_public_read"
  on public.projects
  for select
  to anon, authenticated
  using (true);

drop policy if exists "projects_admin_write" on public.projects;
create policy "projects_admin_write"
  on public.projects
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.handle_updated_at();

-- 9. Articles (library & news)
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  kind text not null check (kind in ('library', 'news')),
  title text not null,
  category text not null default '',
  date text not null default '',
  read_time text not null default '5 phút đọc',
  excerpt text not null default '',
  cover_image text not null default '/images/craftsmanship-studio.jpg',
  is_hero boolean not null default false,
  key_points jsonb not null default '[]'::jsonb,
  source_label text,
  source_url text,
  sections jsonb not null default '[]'::jsonb,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (kind, slug)
);

create index if not exists idx_articles_kind_sort
  on public.articles (kind, sort_order);

alter table public.articles enable row level security;

drop policy if exists "articles_public_read" on public.articles;
create policy "articles_public_read"
  on public.articles
  for select
  to anon, authenticated
  using (is_published = true or (select public.is_admin()));

drop policy if exists "articles_admin_write" on public.articles;
create policy "articles_admin_write"
  on public.articles
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop trigger if exists trg_articles_updated_at on public.articles;
create trigger trg_articles_updated_at
  before update on public.articles
  for each row execute function public.handle_updated_at();

-- 10. Contact Leads CRM
create table if not exists public.contact_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null default '',
  phone text not null,
  company text not null default '',
  message text not null default '',
  source text not null default 'footer',
  status text not null default 'new' check (status in ('new', 'contacted', 'quoted', 'closed')),
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_contact_leads_status_created
  on public.contact_leads (status, created_at desc);

alter table public.contact_leads enable row level security;

drop policy if exists "contact_leads_public_insert" on public.contact_leads;
create policy "contact_leads_public_insert"
  on public.contact_leads
  for insert
  to anon, authenticated
  with check (
    char_length(trim(name)) >= 2
    and char_length(trim(phone)) >= 6
    and status = 'new'
    and source in ('footer', 'product', 'project', 'contact-page')
  );

drop policy if exists "contact_leads_admin_read" on public.contact_leads;
create policy "contact_leads_admin_read"
  on public.contact_leads
  for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "contact_leads_admin_update" on public.contact_leads;
create policy "contact_leads_admin_update"
  on public.contact_leads
  for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "contact_leads_admin_delete" on public.contact_leads;
create policy "contact_leads_admin_delete"
  on public.contact_leads
  for delete
  to authenticated
  using ((select public.is_admin()));

drop trigger if exists trg_contact_leads_updated_at on public.contact_leads;
create trigger trg_contact_leads_updated_at
  before update on public.contact_leads
  for each row execute function public.handle_updated_at();

-- 11. Public Media Storage Bucket + Policies
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml']
)
on conflict (id) do update
set public = true,
    file_size_limit = 10485760,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'media');

drop policy if exists "media_admin_insert" on storage.objects;
create policy "media_admin_insert"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'media' and (select public.is_admin()));

drop policy if exists "media_admin_update" on storage.objects;
create policy "media_admin_update"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'media' and (select public.is_admin()))
  with check (bucket_id = 'media' and (select public.is_admin()));

drop policy if exists "media_admin_delete" on storage.objects;
create policy "media_admin_delete"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));
