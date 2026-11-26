-- =========================================================
-- 1단계 보강: 중복 제출 방지 · 스팸 제한 · 새 사용자 프로필 자동 생성
-- =========================================================

-- 의뢰 신청 버튼이 두 번 눌려도 의뢰는 하나만 저장 (화면이 만든 고유 키)
alter table public.requests add column submit_key text unique;
-- 같은 곳에서 짧은 시간에 반복 신청하는 것을 막기 위한 값 (IP 원문이 아니라 해시만 저장)
alter table public.requests add column submit_ip_hash text;
create index requests_ip_recent_idx on public.requests (submit_ip_hash, created_at desc);
create index requests_email_recent_idx on public.requests (contact_email, created_at desc);

-- 새 로그인 계정이 생기면 프로필을 '강사'로 자동 생성 (관리자는 따로 지정)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 이미 만들어져 있는 계정에도 프로필 채우기
insert into public.profiles (id, name)
select u.id, split_part(u.email, '@', 1) from auth.users u
on conflict (id) do nothing;
