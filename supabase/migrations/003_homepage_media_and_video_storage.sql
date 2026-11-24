insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  52428800,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]
)
on conflict (id) do update
set public = true,
    file_size_limit = 52428800,
    allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.homepage_media (
  id integer primary key default 1 check (id = 1),
  hero_slides jsonb not null default '[]'::jsonb,
  video_reels jsonb not null default '[]'::jsonb,
  spotlight_nordic jsonb not null default '{}'::jsonb,
  spotlight_wood jsonb not null default '{}'::jsonb,
  commitment_stage_image text not null default '/images/craftsmanship-studio.jpg',
  commitment_stage_video_url text not null default '',
  commitment_stage_caption text not null default 'CHUẨN MỰC TỪ ĐƯỜNG MAY ĐẾN KẾT CẤU',
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.homepage_media enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'homepage_media' and policyname = 'homepage_media_public_read'
  ) then
    execute 'create policy "homepage_media_public_read" on public.homepage_media for select to anon, authenticated using (true)';
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'homepage_media' and policyname = 'homepage_media_admin_write'
  ) then
    execute 'create policy "homepage_media_admin_write" on public.homepage_media for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))';
  end if;
end $$;

create or replace trigger trg_homepage_media_updated_at
  before update on public.homepage_media
  for each row execute function public.handle_updated_at();
