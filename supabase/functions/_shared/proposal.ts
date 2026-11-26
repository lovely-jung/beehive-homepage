// 교육 제안서 생성
//  - AI_MODE=mock (기본): 수업 데이터만으로 실제와 같은 형식의 제안서를 만듭니다. 비용 0원.
//  - AI_MODE=claude    : (크레딧 충전 후 연결 예정) Claude Sonnet 5.5 로 맞춤 제안서를 작성합니다.
import type { Catalog, Course, Level, Quote } from "./common.ts";

export type RequestRow = {
  org_name: string; org_type: string; contact_name: string; course_id: string; level: string;
  sessions: number; minutes_per_session: number; headcount: number | null; class_count: number | null;
  preferred_dates: string | null; location: string | null; notes: string | null;
};

const ORG = { school: "학교", university: "대학", public: "공공기관", company: "기업", other: "기관" } as Record<string, string>;

/** 수업 흐름을 의뢰한 차시 수에 맞게 나눕니다 (차시가 많으면 활동을 나눠 담고, 적으면 묶습니다) */
function planSessions(steps: string[], n: number): string[][] {
  const plan: string[][] = Array.from({ length: n }, () => []);
  if (n >= steps.length) {
    // 활동 수보다 차시가 많으면: 앞쪽 활동은 한 차시씩, 남는 차시는 실습 · 프로젝트 · 발표로 채움
    steps.forEach((s, i) => plan[i].push(s));
    for (let i = steps.length; i < n; i++) {
      plan[i].push(i === n - 1 ? "결과물 발표와 돌아보기" : "심화 실습 · 프로젝트 진행 (앞 차시 활동 확장)");
    }
  } else {
    steps.forEach((s, i) => plan[Math.floor((i * n) / steps.length)].push(s));
  }
  return plan;
}

const won = (n: number) => n.toLocaleString("ko-KR") + "원";

/** 견적 표 (마크다운) */
export function quoteMd(q: Quote | null, no: number): string[] {
  if (!q) return [];
  return [
    "", `## ${no}. 견적`,
    "| 항목 | 산출 | 금액 |", "| --- | --- | --- |",
    ...q.lines.map((l) => `| ${l.item} | ${l.detail} | ${won(l.amount)} |`),
    `| **합계** | ${q.vatNote} | **${won(q.total)}** |`,
    `- ${q.travelNote}입니다.`,
    ...(q.soleContract ? ["- 2천만 원 이하로 **1인 견적 수의계약**이 가능한 금액입니다. 견적서 · 사업자등록증 등 계약 서류는 요청 시 바로 보내드립니다."] : []),
    "- 최종 금액은 일정 · 장소 확인 후 확정되며, 조건이 바뀌면 다시 안내드립니다.",
  ];
}

export function mockProposal(r: RequestRow, cat: Catalog): { title: string; md: string; quote: Quote | null } {
  const course: Course | undefined = cat.courses.find((c) => c.id === r.course_id);
  if (!course) throw new Error("선택한 수업을 찾을 수 없습니다");
  const L: Level | undefined = course.levels[r.level] ?? Object.values(course.levels)[0];
  const lvLabel = cat.levels[r.level]?.label ?? r.level;
  const title = `${r.org_name} ${course.title} 교육 제안서`;
  const sessions = planSessions(L.steps ?? [], r.sessions);
  let quote: Quote | null = null;
  try { quote = cat.quote ? cat.quote(course, r.level, r.sessions, r.minutes_per_session, r.class_count, r.headcount) : null; } catch { quote = null; }
  const md = [
    `# ${title}`,
    `${r.contact_name}님, 비하이브에 교육을 의뢰해 주셔서 감사합니다. 요청하신 조건에 맞춰 아래와 같이 교육을 제안드립니다.`,
    "",
    "## 1. 교육 개요",
    "| 항목 | 내용 |",
    "| --- | --- |",
    `| 기관 | ${r.org_name} (${ORG[r.org_type] ?? "기관"}) |`,
    `| 과정 | ${course.title} |`,
    `| 대상 | ${lvLabel}${r.class_count ? ` · ${r.class_count}학급` : ""}${r.headcount ? ` · ${r.headcount}명` : ""} |`,
    `| 구성 | ${r.sessions}차시 × ${r.minutes_per_session}분 |`,
    `| 희망 일정 | ${r.preferred_dates || "협의"} |`,
    `| 장소 | ${r.location || "협의"} |`,
    "",
    "## 2. 교육 목표",
    `- ${L.goal}`,
    `- ${course.summary}`,
    "",
    "## 3. 차시별 구성",
    "| 차시 | 활동 |",
    "| --- | --- |",
    ...sessions.map((acts, i) => `| ${i + 1}차시 (${r.minutes_per_session}분) | ${acts.join(" / ") || "실습"} |`),
    "",
    "## 4. 사용 도구와 준비 사항",
    `- 사용 도구: ${L.tools}`,
    `- 준비 사항: ${course.prep || "사전 협의"}`,
    ...(course.safety?.length ? ["- 안전 안내: 수업 시작 전 안전 수칙을 함께 확인합니다."] : []),
    "",
    "## 5. 기대 결과물",
    `- ${L.output}`,
    `- 교과 · 생기부 연계: ${L.link}`,
    "",
    "## 6. 운영 방식",
    "- 비하이브 강사가 기관으로 찾아가 수업을 진행합니다.",
    "- 수업 자료와 실습 준비물을 준비해 가며, 수업 후 활동 사진과 결과 보고 자료를 드립니다.",
    ...(r.notes ? ["", "## 7. 요청 사항 반영", `- 요청하신 내용: ${r.notes}`, "- 위 요청은 담당 강사와 확인해 세부 활동에 반영하겠습니다."] : []),
    ...quoteMd(quote, r.notes ? 8 : 7),
    "",
    `## ${(r.notes ? 8 : 7) + (quote ? 1 : 0)}. 다음 단계`,
    "- 제안 내용이 괜찮으시면 메일의 **교육 진행하기** 버튼을 눌러 주세요.",
    "- 버튼을 누르시면 담당 강사를 배정해 일정과 세부 사항을 다시 안내드립니다.",
  ].join("\n");
  return { title, md, quote };
}
