-- 서버 기능(Edge Function)은 service_role 로 표를 읽고 씁니다. 화면(anon)에는 여전히 권한이 없습니다.
grant select, insert, update, delete on public.profiles, public.requests, public.proposals, public.generation_jobs, public.email_outbox to service_role;
