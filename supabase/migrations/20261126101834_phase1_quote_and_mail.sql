-- =========================================================
-- 1단계 보강: 학급 수 · 견적 · 실제 메일 발송 기록
-- =========================================================

-- 의뢰: 몇 개 학급(반)에 같은 수업을 하는지 (견적 계산에 사용)
alter table public.requests add column class_count int check (class_count between 1 and 60);

-- 제안서: 견적 합계와 항목 (assets/data/pricing.js 기준으로 서버가 계산)
alter table public.proposals add column quote_total int check (quote_total >= 0);
alter table public.proposals add column quote_detail jsonb;

-- 메일: 발송 서비스가 돌려준 번호 (발송 확인용)
alter table public.email_outbox add column provider_id text;
