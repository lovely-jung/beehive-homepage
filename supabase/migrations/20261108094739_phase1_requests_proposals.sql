-- =========================================================
-- 비하이브 운영 시스템 1단계
-- 의뢰 접수 → AI 제안서 → 관리자 승인 → 메일 발송 → "교육 진행하기"
--
-- 보안 원칙
--   · 모든 표는 행 단위 보안(RLS)을 켜고, 익명 사용자에게는 아무 권한도 주지 않습니다.
--   · 의뢰 신청, AI 생성, 메일 발송, "교육 진행하기"는 서버 기능(Edge Function)이
--     서비스 권한으로만 처리합니다. (사이트 화면 코드가 표에 직접 쓰지 못함)
--   · 관리자 화면은 로그인한 관리자(profiles.role = 'admin')만 읽고 승인할 수 있습니다.
--
-- 중복 클릭 방지
--   · generation_jobs.idempotency_key 를 고유값으로 두어, 같은 버튼이 두 번 눌려도
--     AI 생성 · 메일 발송이 한 번만 일어납니다.
-- =========================================================

-- ---------- 사용자 역할 (관리자 / 강사) ----------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'instructor' check (role in ('admin', 'instructor')),
  name        text not null default '',
  phone       text,
  created_at  timestamptz not null default now()
);
alter table public.profiles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create policy "본인 프로필 읽기" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());

-- ---------- 교육 의뢰 ----------
create table public.requests (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  -- 진행 상태
  status              text not null default 'submitted' check (status in (
                        'submitted',        -- 접수됨 (관리자 확인 전)
                        'proposal_ready',   -- AI 제안서 초안 준비됨
                        'proposal_sent',    -- 관리자 승인 후 의뢰자에게 발송됨
                        'confirmed',        -- 의뢰자가 "교육 진행하기"를 누름
                        'cancelled')),
  -- 의뢰 기관 · 담당자
  org_name            text not null check (char_length(org_name) between 1 and 120),
  org_type            text not null check (org_type in ('school', 'university', 'public', 'company', 'other')),
  contact_name        text not null check (char_length(contact_name) between 1 and 60),
  contact_email       text not null check (contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  contact_phone       text check (char_length(contact_phone) <= 30),
  -- 교육 조건 (course_id 는 assets/data/courses.js 의 수업 id)
  course_id           text not null check (char_length(course_id) <= 60),
  level               text not null check (level in ('elem', 'mid', 'high', 'univ', 'adult')),
  sessions            int  not null check (sessions between 1 and 40),
  minutes_per_session int  not null check (minutes_per_session between 20 and 480),
  headcount           int  check (headcount between 1 and 2000),
  preferred_dates     text check (char_length(preferred_dates) <= 300),
  location            text check (char_length(location) <= 200),
  notes               text check (char_length(notes) <= 2000),
  -- 개인정보 수집 동의
  privacy_consent     boolean not null check (privacy_consent),
  privacy_consent_at  timestamptz not null default now()
);
alter table public.requests enable row level security;
create index requests_status_idx on public.requests (status, created_at desc);

create policy "관리자 의뢰 읽기" on public.requests
  for select to authenticated using (public.is_admin());
create policy "관리자 의뢰 수정" on public.requests
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- 교육 제안서 (버전 관리) ----------
create table public.proposals (
  id               uuid primary key default gen_random_uuid(),
  request_id       uuid not null references public.requests(id) on delete cascade,
  version          int  not null default 1,
  created_at       timestamptz not null default now(),
  status           text not null default 'draft' check (status in ('draft', 'approved', 'sent', 'superseded')),
  title            text not null default '',
  content_md       text not null default '',          -- 제안서 본문 (관리자가 수정 가능)
  model            text not null default 'mock',      -- 'mock' 또는 실제 Claude 모델 id
  input_tokens     int,
  output_tokens    int,
  approved_by      uuid references public.profiles(id),
  approved_at      timestamptz,
  sent_at          timestamptz,
  -- "교육 진행하기" 버튼용 일회용 토큰 (원문은 메일에만, 여기엔 해시만 저장)
  confirm_token_hash text unique,
  confirmed_at     timestamptz,
  unique (request_id, version)
);
alter table public.proposals enable row level security;

create policy "관리자 제안서 읽기" on public.proposals
  for select to authenticated using (public.is_admin());
create policy "관리자 제안서 수정" on public.proposals
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- AI 생성 · 발송 작업 기록 (중복 실행 방지 + 비용 기록) ----------
create table public.generation_jobs (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  finished_at      timestamptz,
  kind             text not null check (kind in ('proposal', 'send_proposal', 'confirm', 'match', 'lesson_plan', 'redesign')),
  target_id        uuid not null,
  idempotency_key  text not null unique,              -- 같은 키로 두 번 요청하면 두 번째는 무시
  status           text not null default 'running' check (status in ('running', 'done', 'failed')),
  model            text,
  input_tokens     int,
  output_tokens    int,
  error            text,
  requested_by     uuid references public.profiles(id)
);
alter table public.generation_jobs enable row level security;
create policy "관리자 작업 기록 읽기" on public.generation_jobs
  for select to authenticated using (public.is_admin());

-- ---------- 보낼 · 보낸 메일 ----------
create table public.email_outbox (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  request_id       uuid references public.requests(id) on delete set null,
  to_email         text not null,
  subject          text not null,
  body_html        text not null,
  status           text not null default 'preview' check (status in ('preview', 'sent', 'failed')),
  sent_at          timestamptz,
  error            text
);
alter table public.email_outbox enable row level security;
create policy "관리자 메일 읽기" on public.email_outbox
  for select to authenticated using (public.is_admin());

-- ---------- 수정 시각 자동 갱신 ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end; $$;
create trigger requests_touch before update on public.requests
  for each row execute function public.touch_updated_at();

-- 익명 사용자는 어떤 표에도 직접 접근하지 못합니다 (신청은 서버 기능을 통해서만)
revoke all on public.profiles, public.requests, public.proposals, public.generation_jobs, public.email_outbox from anon;
grant select on public.profiles, public.requests, public.proposals, public.generation_jobs, public.email_outbox to authenticated;
grant update on public.requests, public.proposals to authenticated;
