-- =====================================================================
-- Previax — Grants estándar de Supabase para los roles del Data API.
--
-- La migración 0001 se aplicó con un rol cuyos default privileges no
-- incluían a anon/authenticated/service_role, así que PostgREST recibía
-- "permission denied". RLS sigue siendo la capa que decide qué filas se
-- pueden leer/escribir; estos grants solo habilitan el acceso a nivel
-- de tabla, como en un proyecto Supabase normal.
-- =====================================================================

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables    in schema public to anon, authenticated, service_role;
grant all on all routines  in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on routines to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
