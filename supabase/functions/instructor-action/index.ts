// 강사 작업 (로그인한 강사 본인만, 자기에게 배정된 수업만)
//   generate_lesson_plan : AI 교안 만들기 (기본 수업안 + 의뢰 조건 + 승인된 현장 피드백)
//   submit_report        : 수업 결과 보고서 제출 (교안 평가 · 차시별 개선 의견)
import { admin, catalog, cors, json, whoAmI } from "../_shared/common.ts";
import { buildPlan, planToMd, type RevisionNote } from "../_shared/lesson.ts";

const AI_MODE = Deno.env.get("AI_MODE") ?? "mock";
const txt = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "") || null;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, { error: "허용되지 않은 요청입니다" }, 405);
  const db = admin();
  const me = await whoAmI(req, db);
  if (!me) return json(req, { error: "로그인이 필요합니다" }, 401);

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json(req, { error: "요청 형식이 올바르지 않습니다" }, 400); }
  const action = String(b.action ?? "");
  const key = String(b.key ?? "");

  // 본인 배정 확인 (관리자는 확인용으로 모든 배정에 접근 가능)
  const a = await db.from("assignments").select("*, requests(*)").eq("id", String(b.assignment_id ?? "")).maybeSingle();
  if (!a.data) return json(req, { error: "배정된 수업을 찾을 수 없습니다" }, 404);
  if (a.data.instructor_id !== me.id && me.role !== "admin") return json(req, { error: "본인에게 배정된 수업만 볼 수 있습니다" }, 403);
  const r = a.data.requests;

  try {
    /* ---------- AI 교안 만들기 ---------- */
    if (action === "generate_lesson_plan") {
      if (a.data.status === "cancelled") return json(req, { error: "취소된 배정입니다" }, 409);
      if (key.length < 16) return json(req, { error: "잘못된 요청입니다" }, 400);
      const job = await db.from("generation_jobs").insert({ kind: "lesson_plan", target_id: a.data.id, idempotency_key: key, requested_by: me.id }).select("id").single();
      if (job.error) {
        if (job.error.code === "23505") return json(req, { ok: true, duplicate: true });
        throw job.error;
      }
      const prev = (await db.from("lesson_plans").select("version").eq("assignment_id", a.data.id).order("version", { ascending: false }).limit(1)).data ?? [];
      if (prev.length && (prev[0].version ?? 0) >= 5) {
        await db.from("generation_jobs").update({ status: "failed", error: "limit", finished_at: new Date().toISOString() }).eq("id", job.data.id);
        return json(req, { error: "교안은 수업당 5번까지 만들 수 있습니다. 이전 교안을 내려받아 써 주세요" }, 409);
      }
      try {
        if (AI_MODE !== "mock") throw new Error("실제 AI 연결은 크레딧 충전 후 설정합니다 (현재는 AI_MODE=mock)");
        // 승인된 교안 개선 사항 (같은 수업 · 같은 대상)
        const revs = (await db.from("course_revisions").select("version, notes").eq("course_id", r.course_id).eq("level", r.level).eq("status", "approved").order("version", { ascending: false })).data ?? [];
        const notes = (revs[0]?.notes ?? []) as RevisionNote[];
        const data = buildPlan(r, await catalog(), revs.length, notes);
        const md = planToMd(data);
        const version = (prev[0]?.version ?? 0) + 1;
        const ins = await db.from("lesson_plans").insert({ assignment_id: a.data.id, version, content_md: md, content_json: data, model: "mock", revision_version: revs.length }).select("id").single();
        if (ins.error) throw ins.error;
        if (a.data.status === "assigned") await db.from("assignments").update({ status: "plan_ready" }).eq("id", a.data.id);
        await db.from("generation_jobs").update({ status: "done", model: "mock", finished_at: new Date().toISOString() }).eq("id", job.data.id);
        return json(req, { ok: true, lesson_plan_id: ins.data.id, version });
      } catch (e) {
        await db.from("generation_jobs").update({ status: "failed", error: String((e as Error).message ?? e), finished_at: new Date().toISOString() }).eq("id", job.data.id);
        throw e;
      }
    }

    /* ---------- 결과 보고서 제출 ---------- */
    if (action === "submit_report") {
      if (a.data.instructor_id !== me.id) return json(req, { error: "담당 강사만 보고서를 낼 수 있습니다" }, 403);
      const rep = (b.report ?? {}) as Record<string, unknown>;
      const rating = (v: unknown) => Math.round(Number(v));
      const row = {
        assignment_id: a.data.id, instructor_id: me.id, course_id: r.course_id, level: r.level,
        taught_on: /^\d{4}-\d{2}-\d{2}$/.test(String(rep.taught_on ?? "")) ? String(rep.taught_on) : null,
        students: rep.students === "" || rep.students == null ? null : Math.max(0, Math.min(2000, Math.round(Number(rep.students)) || 0)),
        rating_overall: rating(rep.rating_overall), rating_plan: rating(rep.rating_plan),
        went_well: txt(rep.went_well, 2000), student_reaction: txt(rep.student_reaction, 2000), extra: txt(rep.extra, 2000),
        improvements: (Array.isArray(rep.improvements) ? rep.improvements : []).slice(0, 30).map((x: Record<string, unknown>) => ({
          session: x.session == null || x.session === "" ? null : Math.max(1, Math.min(40, Math.round(Number(x.session)) || 1)),
          issue: String(x.issue ?? "").trim().slice(0, 500), suggestion: String(x.suggestion ?? "").trim().slice(0, 500),
        })).filter((x: { issue: string; suggestion: string }) => x.issue || x.suggestion),
      };
      if (!(row.rating_overall >= 1 && row.rating_overall <= 5) || !(row.rating_plan >= 1 && row.rating_plan <= 5)) return json(req, { error: "수업 만족도와 교안 적합도를 골라 주세요" }, 400);
      if (row.rating_plan <= 3 && !row.improvements.length) return json(req, { error: "교안 적합도가 3점 이하면, 고칠 점을 한 가지 이상 적어 주세요" }, 400);
      // 한 번 제출한 보고서는 수정만 (교안 개선에 이미 반영되기 전까지)
      const old = await db.from("reports").select("id").eq("assignment_id", a.data.id).maybeSingle();
      if (old.data) {
        const usedBy = await db.from("course_revisions").select("id").neq("status", "rejected").contains("source_report_ids", [old.data.id]).limit(1);
        if (usedBy.data?.length) return json(req, { error: "이미 교안 개선에 반영된 보고서라 수정할 수 없습니다" }, 409);
      }
      const up = await db.from("reports").upsert(row, { onConflict: "assignment_id" }).select("id").single();
      if (up.error) throw up.error;
      await db.from("assignments").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", a.data.id);
      await db.from("requests").update({ status: "completed" }).eq("id", r.id);
      const admins = (await db.from("profiles").select("id").eq("role", "admin")).data ?? [];
      if (admins.length) await db.from("notifications").insert(admins.map((x) => ({ user_id: x.id, kind: "report", title: `결과 보고서 도착: ${r.org_name}`, body: `교안 적합도 ${row.rating_plan}점 · 개선 의견 ${row.improvements.length}건` })));
      return json(req, { ok: true, report_id: up.data.id });
    }

    return json(req, { error: "알 수 없는 작업입니다" }, 400);
  } catch (e) {
    console.error(e);
    return json(req, { error: "처리 중 문제가 생겼습니다: " + String((e as Error).message ?? e) }, 500);
  }
});
