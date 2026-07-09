-- =====================================================================
-- Previax — Hardening según get_advisors (security):
--   - search_path fijo en funciones (lint 0011).
--   - handle_new_user no ejecutable vía RPC por anon/authenticated;
--     solo la dispara el trigger de auth.users (lint 0028/0029).
--
-- Nota: is_admin() y current_role_name() siguen ejecutables porque las
-- evalúan las policies RLS con el rol del request. Las advertencias por
-- las policies "phase1: public write" son intencionales y desaparecen
-- en la Fase 2 (ver ROLLBACK en 0002).
-- =====================================================================

alter function public.set_updated_at() set search_path = public;
alter function public.match_communities(vector, int, float) set search_path = public;

revoke execute on function public.handle_new_user() from anon, authenticated, public;
