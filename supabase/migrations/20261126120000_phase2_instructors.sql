-- =========================================================
-- 비하이브 운영 시스템 2단계: 강사 추천 · 배정 · AI 교안 · 결과 보고 · 교안 개선
--
-- 흐름
--   교육 확정(confirmed) → AI 강사 후보(match_candidates) → 관리자 최종 선택(assignments)
--   → 강사 알림(notifications) → 강사가 AI 교안 생성(lesson_plans)
--   → 수업 후 결과 보고(reports) → 관리자가 수업별 개선안 생성 · 승인(course_revisions)
--   → 다음 교안부터 승인된 개선 사항이 해당 차시에 반영 (교안 버전 상승)
--
-- 보안: 모든 쓰기는 서버 기능(service_role)만. 화면은 RLS 범위 안에서 읽기만.
--       예외: 강사는 자기 알림의 읽음 표시(read_at)만 직접 바꿀 수 있음.
-- =========================================================

-- 의뢰 상태에 '강사 배정' · '수업 완료' 추가
alter table public.requests drop constraint requests_status_check;
alter table public.requests add constraint requests_status_check check (status in (
  'submitted', 'proposal_ready', 'proposal_sent', 'confirmed', 'assigned', 'completed', 'cancelled'));

-- ---------- 강사 정보 ----------
create table public.instructors (
  id            uuid primary key references public.profiles(id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 60),
  email         text not null,
  phone         text,
  specialties   text[] not null default '{}',   -- 분야: ai, sw, career, conv, teacher, biz
  levels        text[] not null default '{}',   -- 대상: elem, mid, high, univ, adult
  regions       text[] not null default '{}',   -- 활동 지역: 서울, 경기 남부 ...
  career_years  int not null default 0 check (career_years between 0 and 60),
  bio           text check (char_length(bio) <= 1000),
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);
alter table public.instructors enable row level security;
create policy "강사 정보 읽기" on public.instructors
  for select to authenticated using (id = auth.uid() or public.is_admin());

-- ---------- AI 강사 후보 (의뢰별 추천 결과) ----------
create table public.match_candidates (
  id             uuid primary key default gen_random_uuid(),
  request_id     uuid not null references public.requests(id) on delete cascade,
  instructor_id  uuid not null references public.instructors(id) on delete cascade,
  rank           int not null,
  score          int not null,
  reasons        text[] not null default '{}',
  created_at     timestamptz not null default now(),
  unique (request_id, instructor_id)
);
alter table public.match_candidates enable row level security;
create policy "관리자 후보 읽기" on public.match_candidates
  for select to authenticated using (public.is_admin());

-- ---------- 강사 배정 ----------
create table public.assignments (
  id             uuid primary key default gen_random_uuid(),
  request_id     uuid not null unique references public.requests(id) on delete cascade,
  instructor_id  uuid not null references public.instructors(id),
  status         text not null default 'assigned' check (status in ('assigned', 'plan_ready', 'completed', 'cancelled')),
  assigned_by    uuid references public.profiles(id),
  assigned_at    timestamptz not null default now(),
  completed_at   timestamptz
);
alter table public.assignments enable row level security;
create index assignments_instructor_idx on public.assignments (instructor_id, assigned_at desc);
create policy "배정 읽기" on public.assignments
  for select to authenticated using (instructor_id = auth.uid() or public.is_admin());

-- 강사는 자기에게 배정된 의뢰와 발송된 제안서를 읽을 수 있음
create policy "배정 강사 의뢰 읽기" on public.requests
  for select to authenticated using (exists (
    select 1 from public.assignments a where a.request_id = requests.id and a.instructor_id = auth.uid()));
create policy "배정 강사 제안서 읽기" on public.proposals
  for select to authenticated using (status = 'sent' and exists (
    select 1 from public.assignments a where a.request_id = proposals.request_id and a.instructor_id = auth.uid()));

-- ---------- 알림 ----------
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  kind        text not null,
  title       text not null,
  body        text,
  link        text,
  created_at  timestamptz not null default now(),
  read_at     timestamptz
);
alter table public.notifications enable row level security;
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create policy "내 알림 읽기" on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy "내 알림 읽음 표시" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- AI 교안 ----------
create table public.lesson_plans (
  id                uuid primary key default gen_random_uuid(),
  assignment_id     uuid not null references public.assignments(id) on delete cascade,
  version           int not null default 1,
  content_md        text not null,
  model             text not null default 'mock',
  revision_version  int not null default 0,   -- 반영된 교안 개선 버전 (0 = 기본 수업안)
  created_at        timestamptz not null default now(),
  unique (assignment_id, version)
);
alter table public.lesson_plans enable row level security;
create policy "교안 읽기" on public.lesson_plans
  for select to authenticated using (public.is_admin() or exists (
    select 1 from public.assignments a where a.id = lesson_plans.assignment_id and a.instructor_id = auth.uid()));

-- ---------- 결과 보고서 ----------
create table public.reports (
  id               uuid primary key default gen_random_uuid(),
  assignment_id    uuid not null unique references public.assignments(id) on delete cascade,
  instructor_id    uuid not null references public.instructors(id),
  course_id        text not null,
  level            text not null,
  submitted_at     timestamptz not null default now(),
  taught_on        date,
  students         int check (students between 0 and 2000),
  rating_overall   int not null check (rating_overall between 1 and 5),   -- 수업 전체 만족
  rating_plan      int not null check (rating_plan between 1 and 5),      -- 교안이 현장에 맞았는가
  went_well        text check (char_length(went_well) <= 2000),
  student_reaction text check (char_length(student_reaction) <= 2000),
  improvements     jsonb not null default '[]',   -- [{ session: 2 | null, issue: '...', suggestion: '...' }]
  extra            text check (char_length(extra) <= 2000)
);
alter table public.reports enable row level security;
create index reports_course_idx on public.reports (course_id, level, submitted_at desc);
create policy "보고서 읽기" on public.reports
  for select to authenticated using (instructor_id = auth.uid() or public.is_admin());

-- ---------- 교안 개선 (수업 · 대상별 버전) ----------
create table public.course_revisions (
  id                 uuid primary key default gen_random_uuid(),
  course_id          text not null,
  level              text not null,
  version            int not null,
  status             text not null default 'draft' check (status in ('draft', 'approved', 'rejected')),
  summary            text not null default '',
  notes              jsonb not null default '[]',   -- [{ session: 2 | null, text: '...', count: 3 }]
  source_report_ids  uuid[] not null default '{}',
  model              text not null default 'mock',
  created_at         timestamptz not null default now(),
  approved_by        uuid references public.profiles(id),
  approved_at        timestamptz,
  unique (course_id, level, version)
);
alter table public.course_revisions enable row level security;
create policy "관리자 개선안 읽기" on public.course_revisions
  for select to authenticated using (public.is_admin());

-- ---------- 권한 ----------
revoke all on public.instructors, public.match_candidates, public.assignments, public.notifications,
  public.lesson_plans, public.reports, public.course_revisions from anon;
grant select on public.instructors, public.match_candidates, public.assignments, public.notifications,
  public.lesson_plans, public.reports, public.course_revisions to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant select, insert, update, delete on public.instructors, public.match_candidates, public.assignments,
  public.notifications, public.lesson_plans, public.reports, public.course_revisions to service_role;
