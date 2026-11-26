// 실제 AI(Claude)로 차시별 교안 만들기
//  - 규칙 기반 교안(buildPlan)을 뼈대로 받아, 차시마다 Claude 에게 '실제 수업에서 쓰는' 내용으로 다시 쓰게 합니다.
//  - 차시들은 동시에 만들어 서버 시간 제한(약 150초) 안에 끝나게 하고, 실패한 차시는 규칙 기반 내용을 그대로 씁니다.
//  - 결과는 같은 PlanData 형식이라 수업 슬라이드 · 교사용 지도안이 그대로 동작합니다.
import Anthropic from "npm:@anthropic-ai/sdk";
import type { PlanData, PlanSession } from "./lesson.ts";

export const AI_MODEL = "claude-opus-5-5";

const SESSION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "hook", "aim", "ask", "flow", "extra", "out"],
  properties: {
    title: { type: "string", description: "차시 제목. 학생에게 보이는 짧고 흥미로운 이름 (20자 이내)" },
    hook: { type: "string", description: "교사용: 이 차시를 여는 장치와 왜 뻔하지 않은지 한두 문장" },
    aim: { type: "string", description: "학생용 오늘의 목표. 관찰 가능한 행동으로, '~한다'로 끝나는 한 문장 (60자 이내)" },
    ask: { type: "string", description: "수업 내내 돌아올 핵심 발문 한 문장 (학생에게 묻는 말투)" },
    flow: {
      type: "array",
      description: "활동 단계 4~7개. minutes 합계가 차시 시간과 정확히 같아야 함. 한 단계는 최대 12분",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["step", "minutes", "screen", "activity"],
        properties: {
          step: { type: "string", description: "단계 이름 (도입, 활동 1, 미션, 공유, 정리 등 6자 이내)" },
          minutes: { type: "integer" },
          screen: { type: "string", description: "슬라이드에 크게 띄울 학생용 안내. 학생에게 말하는 말투, 짧은 문장 1~2개 (45자 이내)" },
          activity: { type: "string", description: "교사용 진행 방법: 무엇을 나눠 주고, 몇 명이 어떻게 하고, 교사는 무엇을 확인하는지 구체적으로 (2~3문장)" },
        },
      },
    },
    extra: { type: "string", description: "시간이 남을 때 바로 할 수 있는 추가 활동 한 문장" },
    out: { type: "string", description: "이 차시가 끝나면 남는 산출물 (짧은 명사구)" },
  },
} as const;

type AiSession = { title: string; hook: string; aim: string; ask: string; extra: string; out: string;
  flow: { step: string; minutes: number; screen: string; activity: string }[] };

const SYSTEM = `당신은 한국 초 · 중 · 고 학교로 찾아가는 외부 강사를 위해 실제 수업에서 바로 쓰는 교안을 쓰는 수업 설계 전문가입니다.
- 강의식 설명보다 학생이 직접 해 보고, 예측하고, 실패를 고쳐 보는 활동을 중심에 둡니다.
- 대상 학년의 수준과 집중 시간에 맞는 말과 활동을 씁니다. 초등은 놀이 · 게임 요소를, 고등은 탐구 · 토론 요소를 더 씁니다.
- 학교 요청 사항과 이전 수업 강사들의 현장 피드백은 반드시 활동에 구체적으로 반영합니다.
- 준비물은 수업 소개에 나온 것 안에서만 씁니다. 학생 개인정보를 AI에 넣는 활동은 만들지 않습니다.
- screen 은 학생이 화면만 보고 무엇을 할지 알 수 있게, activity 는 처음 이 수업을 하는 강사도 그대로 따라 할 수 있게 씁니다.
- 모든 출력은 한국어로 씁니다.`;

function sessionPrompt(d: PlanData, it: PlanSession, idx: number): string {
  const others = d.items.map((x, i) => `${x.no}차시: ${x.title}${i === idx ? " ← 지금 쓸 차시" : ""}`).join("\n");
  const base = { title: it.title, hook: it.hook, aim: it.aim, ask: it.ask, flow: it.flow.map((f) => ({ step: f[0], minutes: f[1], activity: f[2] })), extra: it.extra, out: it.out };
  return [
    `## 수업 정보`,
    `- 수업: ${d.courseTitle} — ${d.summary}`,
    `- 대상: ${d.levelLabel}${d.headcount ? ` ${d.headcount}명` : ""}${d.classes ? ` (${d.classes}학급)` : ""}, 전체 ${d.sessions}차시 × ${d.minutes}분`,
    `- 전체 목표: ${d.goal}`,
    `- 최종 결과물: ${d.output}`,
    `- 사용 도구: ${d.tools}`,
    `- 준비 사항: ${d.prep}`,
    d.safety.length ? `- 안전 수칙: ${d.safety.join(" / ")}` : "",
    d.requestNotes ? `- 학교 요청 사항: ${d.requestNotes}` : "",
    "",
    `## 전체 차시 구성`, others, "",
    `## 지금 쓸 차시: ${it.no}차시 (${it.min}분)`,
    it.generated ? "기본 수업안에 없는 차시입니다. 앞 차시를 이어받아 심화 · 발표 차시로 새로 설계하세요." : "아래 기본 수업안을 바탕으로, 더 구체적이고 생생한 실제 수업안으로 다시 쓰세요.",
    "```json", JSON.stringify(base, null, 1), "```",
    it.feedback.length ? `\n## 이 차시에 반드시 반영할 현장 피드백\n- ${it.feedback.join("\n- ")}` : "",
    d.generalFeedback.length ? `\n## 수업 전체에 반영할 현장 피드백\n- ${d.generalFeedback.join("\n- ")}` : "",
    "", `flow 의 minutes 합계는 정확히 ${it.min} 이어야 합니다.`,
  ].filter((x) => x !== "").join("\n");
}

/** 한 차시를 Claude 로 작성. 실패하면 null */
async function writeSession(client: Anthropic, d: PlanData, idx: number): Promise<AiSession | null> {
  const it = d.items[idx];
  try {
    // deno-lint-ignore no-explicit-any
    const res: any = await client.beta.messages.create({
      model: AI_MODEL,
      max_tokens: 16000,
      system: SYSTEM,
      messages: [{ role: "user", content: sessionPrompt(d, it, idx) }],
      output_config: { effort: "medium", format: { type: "json_schema", schema: SESSION_SCHEMA } },
      // 안전 분류기가 거절하면 서버에서 권장 모델로 다시 시도
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    // deno-lint-ignore no-explicit-any
    } as any, { timeout: 120_000, maxRetries: 1 });
    if (res.stop_reason === "refusal" || res.stop_reason === "max_tokens") return null;
    const text = (res.content ?? []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
    const out = JSON.parse(text) as AiSession;
    if (!out.flow?.length) return null;
    // 시간 합계를 차시 시간에 맞춤 (마지막 단계에서 보정)
    const sum = out.flow.reduce((t, f) => t + (Number(f.minutes) || 0), 0);
    if (sum !== it.min) out.flow[out.flow.length - 1].minutes = Math.max(1, out.flow[out.flow.length - 1].minutes + it.min - sum);
    return out;
  } catch (e) {
    if (e instanceof Anthropic.APIError) console.error(`AI 교안 ${it.no}차시 실패 (${e.status}): ${e.message}`);
    else console.error(`AI 교안 ${it.no}차시 실패:`, e);
    return null;
  }
}

/** 규칙 기반 교안을 AI 교안으로 바꿈. 반환: 새 교안 데이터, AI 로 쓴 차시 수 */
export async function aiPlan(d: PlanData): Promise<{ data: PlanData; written: number; usageNote: string }> {
  const client = new Anthropic(); // ANTHROPIC_API_KEY 비밀값을 읽음
  const results = await Promise.all(d.items.map((_, i) => writeSession(client, d, i)));
  let written = 0;
  const items: PlanSession[] = d.items.map((it, i) => {
    const a = results[i];
    if (!a) return it;
    written++;
    return {
      ...it, title: a.title || it.title, hook: a.hook, aim: a.aim, ask: a.ask, extra: a.extra, out: a.out,
      flow: a.flow.map((f) => [f.step, f.minutes, f.activity] as [string, number, string]),
      screens: a.flow.map((f) => f.screen),
    };
  });
  return { data: { ...d, items, ai: written > 0 }, written, usageNote: `${written}/${d.items.length}차시 AI 작성` };
}
