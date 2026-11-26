// 2단계 핵심 규칙: 강사 추천 · AI 교안 · 교안 개선
//  - 지금은 AI_MODE=mock: 규칙 기반으로 동작해 비용이 들지 않습니다.
//  - 실제 Claude 연결 시에도 입력(의뢰 · 수업안 · 피드백)과 출력 형식은 그대로 두고 생성 부분만 바꿉니다.
import type { Catalog, Course, PlanStep } from "./common.ts";

/* =========================================================
   1. 강사 추천 점수
   ========================================================= */
export type Instructor = { id: string; name: string; specialties: string[]; levels: string[]; regions: string[]; career_years: number; active: boolean };
export type InstructorStats = { avgRating: number | null; reportCount: number; activeCount: number; sameCourseCount: number };
export type MatchResult = { instructor_id: string; score: number; reasons: string[] };

export function matchInstructors(
  req: { course_id: string; level: string; location: string | null },
  course: Course | undefined,
  list: Instructor[],
  stats: Record<string, InstructorStats>,
): MatchResult[] {
  const loc = (req.location ?? "").replace(/\s/g, "");
  return list.filter((i) => i.active).map((i) => {
    const st = stats[i.id] ?? { avgRating: null, reportCount: 0, activeCount: 0, sameCourseCount: 0 };
    let score = 0;
    const reasons: string[] = [];
    if (course && i.specialties.includes(course.cat)) { score += 40; reasons.push("담당 분야 일치"); }
    else reasons.push("담당 분야 아님");
    if (i.levels.includes(req.level)) { score += 20; reasons.push("대상 학년 경험"); }
    const region = i.regions.find((r) => r && loc.includes(r.replace(/\s/g, "")));
    if (region) { score += 15; reasons.push(`활동 지역(${region})`); }
    if (st.sameCourseCount > 0) { score += Math.min(10, st.sameCourseCount * 5); reasons.push(`같은 수업 ${st.sameCourseCount}회 진행`); }
    if (st.avgRating != null) { score += Math.round(st.avgRating * 3); reasons.push(`평균 평가 ${st.avgRating.toFixed(1)}점 (${st.reportCount}건)`); }
    score += Math.min(10, i.career_years);
    if (i.career_years) reasons.push(`경력 ${i.career_years}년`);
    if (st.activeCount > 0) { score -= Math.min(15, st.activeCount * 5); reasons.push(`진행 중 수업 ${st.activeCount}건`); }
    return { instructor_id: i.id, score, reasons };
  }).sort((a, b) => b.score - a.score).slice(0, 5);
}

/* =========================================================
   2. AI 교안
   ========================================================= */
export type RevisionNote = { session: number | null; text: string; count?: number };
export type ReqForPlan = {
  org_name: string; course_id: string; level: string; sessions: number; minutes_per_session: number;
  class_count: number | null; headcount: number | null; preferred_dates: string | null; location: string | null; notes: string | null;
};

/** 기본 수업안을 의뢰 차시 수에 맞춥니다: 같으면 그대로, 적으면 앞에서부터 묶고, 많으면 심화 · 발표 차시를 덧붙임 */
function fitSessions(base: PlanStep[], n: number): { steps: PlanStep[][]; note: string } {
  if (!base.length) return { steps: [], note: "" };
  if (base.length === n) return { steps: base.map((s) => [s]), note: "" };
  if (base.length > n) {
    const out: PlanStep[][] = Array.from({ length: n }, () => []);
    base.forEach((s, i) => out[Math.floor((i * n) / base.length)].push(s));
    return { steps: out, note: `기본 수업안은 ${base.length}차시입니다. 요청하신 ${n}차시에 맞춰 일부 차시를 묶었으니, 묶인 차시는 활동 시간을 줄여 핵심 활동 위주로 진행해 주세요.` };
  }
  const out: PlanStep[][] = base.map((s) => [s]);
  for (let i = base.length; i < n; i++) out.push([]);
  return { steps: out, note: `기본 수업안은 ${base.length}차시입니다. 남는 ${n - base.length}차시는 앞 활동을 확장한 심화 실습과 결과 발표로 구성했습니다.` };
}

const lv = (cat: Catalog, k: string) => cat.levels[k]?.label ?? k;

export function lessonPlanMd(r: ReqForPlan, cat: Catalog, revisionVersion: number, notes: RevisionNote[]): string {
  const course = cat.courses.find((c) => c.id === r.course_id);
  if (!course) throw new Error("수업을 찾을 수 없습니다");
  const L = course.levels[r.level] ?? Object.values(course.levels)[0];
  const base = cat.plans[r.course_id]?.[r.level] ?? [];
  const { steps, note } = fitSessions(base, r.sessions);
  const general = notes.filter((n) => !n.session);
  const bySession = (k: number) => notes.filter((n) => n.session === k);
  const lines: string[] = [
    `# ${course.title} 교안`,
    `${r.org_name} · ${lv(cat, r.level)}${r.class_count ? ` ${r.class_count}학급` : ""}${r.headcount ? ` · ${r.headcount}명` : ""} · ${r.sessions}차시 × ${r.minutes_per_session}분`,
    "",
    `> 교안 버전 v${revisionVersion + 1}${revisionVersion ? ` · 현장 피드백 ${revisionVersion}회 반영` : " · 기본 수업안"}`,
    "",
    "## 수업 개요",
    "| 항목 | 내용 |", "| --- | --- |",
    `| 학습 목표 | ${L.goal} |`,
    `| 사용 도구 | ${L.tools} |`,
    `| 준비 사항 | ${course.prep || "사전 협의"} |`,
    `| 최종 결과물 | ${L.output} |`,
    `| 교과 연계 | ${L.link} |`,
    `| 일정 · 장소 | ${r.preferred_dates || "협의"} · ${r.location || "협의"} |`,
  ];
  if (r.notes) lines.push("", "## 학교 요청 사항", `- ${r.notes}`, "- 위 요청을 수업 전 담당 선생님과 한 번 더 확인하고 활동에 반영해 주세요.");
  if (course.safety?.length) lines.push("", "## 안전 수칙", ...course.safety.map((s) => `- ${s}`));
  if (general.length) lines.push("", "## 이전 수업 현장 피드백 (전체)", ...general.map((n) => `- ${n.text}${n.count && n.count > 1 ? ` (강사 ${n.count}명 의견)` : ""}`));
  if (note) lines.push("", "## 차시 구성 안내", `- ${note}`);

  lines.push("", "## 차시별 수업안");
  if (!steps.length) {
    // 차시별 수업안 데이터가 없는 수업: 수업 흐름(steps)을 차시에 나눠 담음
    const flow = L.steps ?? [];
    for (let i = 0; i < r.sessions; i++) {
      const acts = flow.filter((_, j) => Math.floor((j * r.sessions) / Math.max(flow.length, 1)) === i);
      lines.push("", `### ${i + 1}차시 (${r.minutes_per_session}분)`, ...(acts.length ? acts : ["앞 차시 활동 심화 실습 · 결과 발표"]).map((a) => `- ${a}`));
      bySession(i + 1).forEach((n) => lines.push(`- **현장 피드백 반영:** ${n.text}`));
    }
  } else {
    steps.forEach((group, i) => {
      const k = i + 1;
      if (!group.length) {
        lines.push("", `### ${k}차시 심화 실습 · 결과 발표 (${r.minutes_per_session}분)`,
          "| 단계 | 시간 | 활동 |", "| --- | --- | --- |",
          `| 도입 | 5분 | 지난 차시 결과물을 다시 열어 보완할 점 한 가지씩 정하기 |`,
          `| 심화 실습 | ${Math.max(10, r.minutes_per_session - 20)}분 | 앞 차시 활동을 조건을 바꿔 확장 (난이도 · 주제 · 협업 범위) |`,
          `| 발표 | 10분 | 모둠별 결과물 발표와 질문 한 가지씩 |`, `| 정리 | 5분 | 배운 점과 다음에 해 보고 싶은 것 기록 |`);
      } else {
        group.forEach((s, j) => {
          const scale = r.minutes_per_session / (group.reduce((t, x) => t + x.min, 0) || r.minutes_per_session);
          lines.push("", `### ${k}차시${group.length > 1 ? `-${j + 1}` : ""} ${s.title.replace(/^\d+(~\d+)?차시\s*/, "")} (${Math.round(s.min * scale)}분)`,
            `- **여는 장치:** ${s.hook}`, `- **차시 목표:** ${s.aim}`, "",
            "| 단계 | 시간 | 활동 |", "| --- | --- | --- |",
            ...s.flow.map((f) => `| ${f[0]} | ${Math.max(1, Math.round(f[1] * scale))}분 | ${f[2]} |`),
            "", `- **핵심 발문:** ${s.ask}`, `- **시간이 남으면:** ${s.extra}`, `- **차시 산출물:** ${s.out}`);
        });
      }
      bySession(k).forEach((n) => lines.push(`- **현장 피드백 반영:** ${n.text}${n.count && n.count > 1 ? ` (강사 ${n.count}명 의견)` : ""}`));
    });
  }
  lines.push("", "## 수업 후", "- 수업이 끝나면 강사 화면의 **결과 보고서**에 교안이 현장에 맞았는지, 어느 차시를 어떻게 고치면 좋을지 남겨 주세요.",
    "- 보내 주신 의견은 검토 후 다음 교안에 반영됩니다.");
  return lines.join("\n");
}

/* =========================================================
   3. 교안 개선안 (결과 보고서 → 차시별 개선 사항)
   ========================================================= */
export type ReportRow = { id: string; rating_overall: number; rating_plan: number; went_well: string | null; student_reaction: string | null;
  improvements: { session: number | null; issue: string; suggestion: string }[]; extra: string | null };

export function redesign(reports: ReportRow[], prevNotes: RevisionNote[]): { summary: string; notes: RevisionNote[] } {
  const n = reports.length;
  const avg = (k: "rating_overall" | "rating_plan") => (reports.reduce((t, r) => t + r[k], 0) / n).toFixed(1);
  // 같은 차시 · 비슷한 제안을 묶음 (앞 20자 기준)
  const groups = new Map<string, RevisionNote>();
  for (const r of reports) for (const im of r.improvements ?? []) {
    const text = [im.issue && `문제: ${im.issue}`, im.suggestion && `개선: ${im.suggestion}`].filter(Boolean).join(" → ");
    if (!text) continue;
    const key = `${im.session ?? 0}|${(im.suggestion || im.issue).replace(/\s/g, "").slice(0, 20)}`;
    const g = groups.get(key);
    if (g) g.count = (g.count ?? 1) + 1; else groups.set(key, { session: im.session ?? null, text, count: 1 });
  }
  const fresh = [...groups.values()].sort((a, b) => (a.session ?? 99) - (b.session ?? 99) || (b.count ?? 1) - (a.count ?? 1));
  // 이전 승인 사항은 유지하고 새 사항을 덧붙임 (같은 문장은 횟수만 합침)
  const notes: RevisionNote[] = prevNotes.map((x) => ({ ...x }));
  for (const f of fresh) {
    const same = notes.find((x) => x.session === f.session && x.text === f.text);
    if (same) same.count = (same.count ?? 1) + (f.count ?? 1); else notes.push(f);
  }
  const summary = `결과 보고서 ${n}건 분석 · 수업 만족 평균 ${avg("rating_overall")}점 · 교안 적합도 평균 ${avg("rating_plan")}점 · 새 개선 사항 ${fresh.length}건` +
    (prevNotes.length ? ` (이전 반영 ${prevNotes.length}건 유지)` : "");
  return { summary, notes };
}
