-- Grants for semantic search RPC (Fase 4)
grant execute on function public.match_communities(vector, int, float)
  to anon, authenticated, service_role;
