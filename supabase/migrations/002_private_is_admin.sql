create schema if not exists private;
grant usage on schema private to anon, authenticated;

create or replace function private.is_admin()
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

grant execute on function private.is_admin() to anon, authenticated;

alter policy "probe_admin_only" on public._probe using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "admin_users_self_read" on public.admin_users using (user_id = (select auth.uid()) or (select private.is_admin()));
alter policy "site_settings_admin_write" on public.site_settings using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "categories_admin_write" on public.categories using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "products_public_read" on public.products using (is_published = true or (select private.is_admin()));
alter policy "products_admin_write" on public.products using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "collections_admin_write" on public.collections using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "projects_admin_write" on public.projects using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "articles_public_read" on public.articles using (is_published = true or (select private.is_admin()));
alter policy "articles_admin_write" on public.articles using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "contact_leads_admin_read" on public.contact_leads using ((select private.is_admin()));
alter policy "contact_leads_admin_update" on public.contact_leads using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "contact_leads_admin_delete" on public.contact_leads using ((select private.is_admin()));
alter policy "media_admin_insert" on storage.objects with check (bucket_id = 'media' and (select private.is_admin()));
alter policy "media_admin_update" on storage.objects using (bucket_id = 'media' and (select private.is_admin())) with check (bucket_id = 'media' and (select private.is_admin()));
alter policy "media_admin_delete" on storage.objects using (bucket_id = 'media' and (select private.is_admin()));

revoke execute on function public.is_admin() from public, anon, authenticated;
