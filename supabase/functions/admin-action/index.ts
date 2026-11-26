// 관리자 작업 (로그인한 관리자만)
//   generate_proposal : AI 제안서 초안 만들기
//   save_proposal     : 제안서 제목 · 본문 수정 저장
//   approve_send      : 승인하고 의뢰자에게 보낼 메일 만들기 ("교육 진행하기" 버튼 포함)
//
// 중복 클릭 방지: 화면이 버튼마다 고유 키(key)를 보내고, generation_jobs.idempotency_key 가
// 고유값이라 같은 키로 두 번 와도 두 번째는 실행되지 않습니다.
import { admin, catalog, cors, json, mdToHtml, esc, randomToken, sha256Hex, sendMail, queueMail, mailFrame, SITE_URL } from "../_shared/common.ts";
import { matchInstructors, redesign } from "../_shared/lesson.ts";
import { mockProposal } from "../_shared/proposal.ts";

const FN_URL = `${Deno.env.get("SUPABASE_URL")}/functions/v1`;
const AI_MODE = Deno.env.get("AI_MODE") ?? "mock";
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, { error: "허용되지 않은 요청입니다" }, 405);
  const db = admin();

  // ---- 관리자 확인 ----
  const jwt = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: u } = await db.auth.getUser(jwt);
  if (!u?.user) return json(req, { error: "로그인이 필요합니다" }, 401);
  const prof = await db.from("profiles").select("role").eq("id", u.user.id).maybeSingle();
  if (prof.data?.role !== "admin") return json(req, { error: "관리자만 사용할 수 있습니다" }, 403);
  const me = u.user.id;

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json(req, { error: "요청 형식이 올바르지 않습니다" }, 400); }
  const action = String(b.action ?? "");
  const key = String(b.key ?? "");

  // ---- 중복 실행 잠금 ----
  async function claim(kind: string, target: string) {
    if (key.length < 16) return { error: "잘못된 요청입니다" };
    const ins = await db.from("generation_jobs").insert({ kind, target_id: target, idempotency_key: key, requested_by: me }).select("id").single();
    if (!ins.error) return { jobId: ins.data.id as string };
    if (ins.error.code === "23505") {
      const ex = await db.from("generation_jobs").select("status").eq("idempotency_key", key).single();
      return { duplicate: ex.data?.status ?? "running" };
    }
    return { error: ins.error.message };
  }
  const finish = (id: string, patch: Record<string, unknown>) =>
    db.from("generation_jobs").update({ ...patch, finished_at: new Date().toISOString() }).eq("id", id);

  try {
    /* ---------- 제안서 초안 만들기 ---------- */
    if (action === "generate_proposal") {
      const requestId = String(b.request_id ?? "");
      const r = await db.from("requests").select("*").eq("id", requestId).single();
      if (r.error) return json(req, { error: "의뢰를 찾을 수 없습니다" }, 404);
      if (!["submitted", "proposal_ready"].includes(r.data.status)) return json(req, { error: "이미 발송된 의뢰는 새 제안서를 만들 수 없습니다" }, 409);

      // 재생성은 의뢰당 3번까지 (비용 관리)
      const prev = await db.from("proposals").select("version").eq("request_id", requestId).order("version", { ascending: false });
      if ((prev.data?.length ?? 0) >= 3) return json(req, { error: "제안서는 의뢰당 3번까지 만들 수 있습니다. 기존 제안서를 수정해 주세요" }, 409);

      const c = await claim("proposal", requestId);
      if (c.error) return json(req, { error: c.error }, 400);
      if (c.duplicate) return json(req, { ok: true, duplicate: c.duplicate });

      try {
        if (AI_MODE !== "mock") throw new Error("실제 AI 연결은 크레딧 충전 후 설정합니다 (현재는 AI_MODE=mock)");
        const p = mockProposal(r.data, await catalog());
        const version = (prev.data?.[0]?.version ?? 0) + 1;
        await db.from("proposals").update({ status: "superseded" }).eq("request_id", requestId).eq("status", "draft");
        const ins = await db.from("proposals").insert({
          request_id: requestId, version, title: p.title, content_md: p.md, model: "mock",
          quote_total: p.quote?.total ?? null, quote_detail: p.quote ?? null,
        }).select("id").single();
        if (ins.error) throw ins.error;
        await db.from("requests").update({ status: "proposal_ready" }).eq("id", requestId);
        await finish(c.jobId!, { status: "done", model: "mock" });
        return json(req, { ok: true, proposal_id: ins.data.id });
      } catch (e) {
        await finish(c.jobId!, { status: "failed", error: String((e as Error).message ?? e) });
        throw e;
      }
    }

    /* ---------- 제안서 수정 저장 ---------- */
    if (action === "save_proposal") {
      const id = String(b.proposal_id ?? "");
      const title = String(b.title ?? "").slice(0, 200);
      const content = String(b.content_md ?? "").slice(0, 50_000);
      const up = await db.from("proposals").update({ title, content_md: content }).eq("id", id).eq("status", "draft").select("id");
      if (up.error) throw up.error;
      if (!up.data?.length) return json(req, { error: "초안 상태의 제안서만 수정할 수 있습니다" }, 409);
      return json(req, { ok: true });
    }

    /* ---------- 승인하고 메일 만들기 ---------- */
    if (action === "approve_send") {
      const id = String(b.proposal_id ?? "");
      const p = await db.from("proposals").select("*, requests(*)").eq("id", id).single();
      if (p.error) return json(req, { error: "제안서를 찾을 수 없습니다" }, 404);
      if (p.data.status !== "draft") return json(req, { error: "이미 처리된 제안서입니다" }, 409);

      const c = await claim("send_proposal", id);
      if (c.error) return json(req, { error: c.error }, 400);
      if (c.duplicate) return json(req, { ok: true, duplicate: c.duplicate });

      const token = randomToken();
      const now = new Date().toISOString();
      // 상태가 아직 draft 일 때만 바꿈 → 동시에 두 번 승인돼도 한 번만 성공
      const up = await db.from("proposals").update({
        status: "sent", approved_by: me, approved_at: now, sent_at: now, confirm_token_hash: await sha256Hex(token),
      }).eq("id", id).eq("status", "draft").select("id");
      if (!up.data?.length) { await finish(c.jobId!, { status: "failed", error: "already processed" }); return json(req, { error: "이미 처리된 제안서입니다" }, 409); }

      const r = p.data.requests;
      const confirmUrl = `${FN_URL}/confirm-proposal?t=${encodeURIComponent(token)}`;
      const html = `<div style="max-width:640px;margin:0 auto;font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#26241f">
  <p style="font-size:20px;font-weight:800;margin:0 0 18px">beehive<span style="color:#e9822d">.</span></p>
  <p style="line-height:1.7">${esc(r.contact_name)}님, 안녕하세요. 비하이브입니다.<br>요청하신 교육에 대한 제안서를 보내드립니다.</p>
  <div style="margin:22px 0;padding:22px 24px;border:1px solid #ece7de;border-radius:14px">${mdToHtml(p.data.content_md)}</div>
  <p style="text-align:center;margin:30px 0">
    <a href="${confirmUrl}" style="display:inline-block;padding:15px 28px;border-radius:999px;background:#e9822d;color:#fff;font-weight:700;text-decoration:none">교육 진행하기</a>
  </p>
  <p style="font-size:13px;color:#77736d;line-height:1.7">버튼을 누르시면 교육이 확정되고, 담당 강사 배정 후 일정을 다시 안내드립니다.<br>수정이 필요하시면 이 메일에 답장해 주세요.</p>
</div>`;
      const subject = `[비하이브] ${p.data.title}`;
      const ob = await db.from("email_outbox").insert({
        request_id: r.id, to_email: r.contact_email, subject, body_html: html, status: "preview",
      }).select("id").single();
      await db.from("requests").update({ status: "proposal_sent" }).eq("id", r.id);

      // 실제 발송 (설정이 없으면 미리보기로 남기고, 관리자가 직접 보낸 뒤 "보냄"으로 표시)
      const sent = await sendMail(r.contact_email, subject, html);
      if (sent.ok) await db.from("email_outbox").update({ status: "sent", sent_at: new Date().toISOString(), provider_id: sent.id }).eq("id", ob.data!.id);
      else if (sent.error !== "preview") await db.from("email_outbox").update({ status: "failed", error: sent.error }).eq("id", ob.data!.id);
      await finish(c.jobId!, { status: "done" });
      return json(req, { ok: true, outbox_id: ob.data?.id, mail: sent.ok ? "sent" : sent.error === "preview" ? "preview" : "failed", mail_error: sent.ok ? undefined : sent.error });
    }

    /* ---------- 미리보기 메일을 관리자가 직접 보냈다고 표시 / 실패한 메일 다시 보내기 ---------- */
    if (action === "mark_mail_sent" || action === "resend_mail") {
      const id = String(b.outbox_id ?? "");
      const m = await db.from("email_outbox").select("*").eq("id", id).single();
      if (m.error) return json(req, { error: "메일을 찾을 수 없습니다" }, 404);
      if (m.data.status === "sent") return json(req, { ok: true, duplicate: "sent" });
      if (action === "mark_mail_sent") {
        await db.from("email_outbox").update({ status: "sent", sent_at: new Date().toISOString(), error: "관리자가 직접 발송" }).eq("id", id);
        return json(req, { ok: true, mail: "sent" });
      }
      const c = await claim("send_proposal", id);
      if (c.error) return json(req, { error: c.error }, 400);
      if (c.duplicate) return json(req, { ok: true, duplicate: c.duplicate });
      const sent = await sendMail(m.data.to_email, m.data.subject, m.data.body_html);
      if (sent.ok) await db.from("email_outbox").update({ status: "sent", sent_at: new Date().toISOString(), provider_id: sent.id, error: null }).eq("id", id);
      else await db.from("email_outbox").update({ status: sent.error === "preview" ? "preview" : "failed", error: sent.error }).eq("id", id);
      await finish(c.jobId!, { status: sent.ok ? "done" : "failed", error: sent.ok ? null : sent.error });
      return json(req, { ok: sent.ok, mail: sent.ok ? "sent" : sent.error === "preview" ? "preview" : "failed", error: sent.ok ? undefined : (sent.error === "preview" ? "메일 발송 설정(RESEND_API_KEY, MAIL_FROM)이 아직 없습니다" : "발송 실패: " + sent.error) }, sent.ok ? 200 : 400);
    }

    /* =====================================================
       2단계: 강사 등록 · AI 강사 추천 · 배정 · 교안 개선
       ===================================================== */
    const LEVELS = ["elem", "mid", "high", "univ", "adult"], CATS = ["ai", "sw", "career", "conv", "teacher", "biz"];
    const arr = (v: unknown, allow?: string[]) => (Array.isArray(v) ? v : String(v ?? "").split(","))
      .map((x) => String(x).trim()).filter((x) => x && (!allow || allow.includes(x))).slice(0, 20);

    /* ---------- 강사 등록 · 수정 (새 강사는 초대 링크 생성) ---------- */
    if (action === "save_instructor") {
      const i = (b.instructor ?? {}) as Record<string, unknown>;
      const row = {
        name: String(i.name ?? "").trim().slice(0, 60), phone: String(i.phone ?? "").trim().slice(0, 30) || null,
        specialties: arr(i.specialties, CATS), levels: arr(i.levels, LEVELS), regions: arr(i.regions),
        career_years: Math.max(0, Math.min(60, Math.round(Number(i.career_years) || 0))),
        bio: String(i.bio ?? "").slice(0, 1000) || null, active: i.active !== false,
      };
      if (!row.name) return json(req, { error: "강사 이름을 입력해 주세요" }, 400);
      if (i.id) {
        const up = await db.from("instructors").update(row).eq("id", String(i.id)).select("id");
        if (up.error) throw up.error;
        await db.from("profiles").update({ name: row.name, phone: row.phone }).eq("id", String(i.id));
        return json(req, { ok: true });
      }
      const email = String(i.email ?? "").trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json(req, { error: "강사 이메일을 확인해 주세요" }, 400);
      const exists = await db.from("instructors").select("id").eq("email", email).maybeSingle();
      if (exists.data) return json(req, { error: "이미 등록된 강사 이메일입니다" }, 409);
      const link = await db.auth.admin.generateLink({ type: "invite", email, options: { redirectTo: `${SITE_URL}/instructor.html`, data: { name: row.name } } });
      if (link.error) return json(req, { error: "초대 링크를 만들지 못했습니다: " + link.error.message }, 400);
      const uid = link.data.user!.id;
      await db.from("profiles").upsert({ id: uid, role: "instructor", name: row.name, phone: row.phone });
      const ins = await db.from("instructors").insert({ id: uid, email, ...row });
      if (ins.error) throw ins.error;
      const url = link.data.properties!.action_link;
      const m = await queueMail(db, null, email, "[비하이브] 강사 계정 초대", mailFrame(
        `<p style="line-height:1.7">${esc(row.name)} 강사님, 안녕하세요. 비하이브 강사로 등록되었습니다.<br>아래 버튼을 눌러 비밀번호를 정하시면 배정된 수업 확인, AI 교안 생성, 결과 보고를 하실 수 있습니다.</p>
  <p style="text-align:center;margin:28px 0"><a href="${url}" style="display:inline-block;padding:14px 26px;border-radius:999px;background:#e9822d;color:#fff;font-weight:700;text-decoration:none">강사 계정 만들기</a></p>
  <p style="font-size:13px;color:#77736d">링크는 한 번만 쓸 수 있고 일정 시간이 지나면 만료됩니다. 만료되면 비하이브에 새 링크를 요청해 주세요.</p>`));
      return json(req, { ok: true, invite_link: url, ...m });
    }

    /* ---------- 강사 로그인 링크 다시 만들기 (초대 만료 · 비밀번호 분실) ---------- */
    if (action === "instructor_link") {
      const i = await db.from("instructors").select("id, email, name").eq("id", String(b.instructor_id ?? "")).single();
      if (i.error) return json(req, { error: "강사를 찾을 수 없습니다" }, 404);
      const u = await db.auth.admin.getUserById(i.data.id);
      const type = u.data.user?.last_sign_in_at ? "recovery" : "invite";
      const link = await db.auth.admin.generateLink({ type, email: i.data.email, options: { redirectTo: `${SITE_URL}/instructor.html` } } as never);
      if (link.error) return json(req, { error: "링크를 만들지 못했습니다: " + link.error.message }, 400);
      return json(req, { ok: true, invite_link: (link.data as { properties: { action_link: string } }).properties.action_link });
    }

    /* ---------- AI 강사 추천 ---------- */
    if (action === "match_instructors") {
      const requestId = String(b.request_id ?? "");
      const r = await db.from("requests").select("*").eq("id", requestId).single();
      if (r.error) return json(req, { error: "의뢰를 찾을 수 없습니다" }, 404);
      if (!["confirmed", "assigned"].includes(r.data.status)) return json(req, { error: "학교가 확정(교육 진행하기)한 의뢰만 강사를 추천할 수 있습니다" }, 409);
      const c = await claim("match", requestId);
      if (c.error) return json(req, { error: c.error }, 400);
      if (c.duplicate) return json(req, { ok: true, duplicate: c.duplicate });
      try {
        const cat = await catalog();
        const course = cat.courses.find((x) => x.id === r.data.course_id);
        const list = (await db.from("instructors").select("*").eq("active", true)).data ?? [];
        const asg = (await db.from("assignments").select("id, instructor_id, status, request_id, requests(course_id)")).data ?? [];
        const reps = (await db.from("reports").select("instructor_id, rating_overall, rating_plan")).data ?? [];
        const stats: Record<string, { avgRating: number | null; reportCount: number; activeCount: number; sameCourseCount: number }> = {};
        for (const i of list) {
          const mine = reps.filter((x) => x.instructor_id === i.id);
          stats[i.id] = {
            reportCount: mine.length,
            avgRating: mine.length ? mine.reduce((t, x) => t + (x.rating_overall + x.rating_plan) / 2, 0) / mine.length : null,
            activeCount: asg.filter((a) => a.instructor_id === i.id && ["assigned", "plan_ready"].includes(a.status) && a.request_id !== requestId).length,
            // deno-lint-ignore no-explicit-any
            sameCourseCount: asg.filter((a: any) => a.instructor_id === i.id && a.status === "completed" && a.requests?.course_id === r.data.course_id).length,
          };
        }
        const top = matchInstructors(r.data, course, list, stats);
        await db.from("match_candidates").delete().eq("request_id", requestId);
        if (top.length) {
          const ins = await db.from("match_candidates").insert(top.map((t, k) => ({ request_id: requestId, rank: k + 1, ...t })));
          if (ins.error) throw ins.error;
        }
        await finish(c.jobId!, { status: "done", model: "rules" });
        return json(req, { ok: true, count: top.length });
      } catch (e) { await finish(c.jobId!, { status: "failed", error: String((e as Error).message ?? e) }); throw e; }
    }

    /* ---------- 강사 최종 배정 (알림 + 메일) ---------- */
    if (action === "assign_instructor") {
      const requestId = String(b.request_id ?? ""), instructorId = String(b.instructor_id ?? "");
      const r = await db.from("requests").select("*").eq("id", requestId).single();
      if (r.error) return json(req, { error: "의뢰를 찾을 수 없습니다" }, 404);
      if (!["confirmed", "assigned"].includes(r.data.status)) return json(req, { error: "확정된 의뢰만 배정할 수 있습니다" }, 409);
      const i = await db.from("instructors").select("*").eq("id", instructorId).single();
      if (i.error) return json(req, { error: "강사를 찾을 수 없습니다" }, 404);
      const prev = await db.from("assignments").select("*").eq("request_id", requestId).maybeSingle();
      if (prev.data?.status === "completed") return json(req, { error: "이미 수업이 끝난 의뢰입니다" }, 409);
      if (prev.data?.instructor_id === instructorId) return json(req, { ok: true, duplicate: "assigned" });
      const up = prev.data
        ? await db.from("assignments").update({ instructor_id: instructorId, status: "assigned", assigned_by: me, assigned_at: new Date().toISOString() }).eq("id", prev.data.id).select("id").single()
        : await db.from("assignments").insert({ request_id: requestId, instructor_id: instructorId, assigned_by: me }).select("id").single();
      if (up.error) throw up.error;
      await db.from("requests").update({ status: "assigned" }).eq("id", requestId);
      if (prev.data) await db.from("notifications").insert({ user_id: prev.data.instructor_id, kind: "unassigned", title: `${r.data.org_name} 수업 배정이 변경되었습니다`, body: "다른 강사로 배정이 바뀌었습니다." });
      const cat = await catalog();
      const title = cat.courses.find((x) => x.id === r.data.course_id)?.title ?? r.data.course_id;
      const link = `${SITE_URL}/instructor.html#a=${up.data.id}`;
      await db.from("notifications").insert({ user_id: instructorId, kind: "assigned", title: `새 수업 배정: ${r.data.org_name}`, body: `${title} · ${r.data.sessions}차시 · ${r.data.preferred_dates ?? "일정 협의"}`, link });
      const m = await queueMail(db, requestId, i.data.email, `[비하이브] 새 수업 배정: ${r.data.org_name}`, mailFrame(
        `<p style="line-height:1.7">${esc(i.data.name)} 강사님, 새 수업에 배정되었습니다.</p>
  <table style="width:100%;border-collapse:collapse;font-size:14px;margin:12px 0">
    <tr><th style="text-align:left;padding:8px 10px;background:#f5f2ec;border:1px solid #e6e1d8;width:90px">학교</th><td style="padding:8px 10px;border:1px solid #e6e1d8">${esc(r.data.org_name)}</td></tr>
    <tr><th style="text-align:left;padding:8px 10px;background:#f5f2ec;border:1px solid #e6e1d8">수업</th><td style="padding:8px 10px;border:1px solid #e6e1d8">${esc(title)} · ${r.data.sessions}차시 × ${r.data.minutes_per_session}분</td></tr>
    <tr><th style="text-align:left;padding:8px 10px;background:#f5f2ec;border:1px solid #e6e1d8">일정</th><td style="padding:8px 10px;border:1px solid #e6e1d8">${esc(r.data.preferred_dates ?? "협의")}</td></tr>
  </table>
  <p style="text-align:center;margin:26px 0"><a href="${link}" style="display:inline-block;padding:14px 26px;border-radius:999px;background:#e9822d;color:#fff;font-weight:700;text-decoration:none">수업 확인 · AI 교안 만들기</a></p>`));
      return json(req, { ok: true, assignment_id: up.data.id, ...m });
    }

    /* ---------- 교안 개선안 만들기 (결과 보고서 → 차시별 개선 사항) ---------- */
    if (action === "redesign_course") {
      const courseId = String(b.course_id ?? ""), level = String(b.level ?? "");
      const revs = (await db.from("course_revisions").select("*").eq("course_id", courseId).eq("level", level).order("version", { ascending: false })).data ?? [];
      const used = new Set(revs.filter((x) => x.status !== "rejected").flatMap((x) => x.source_report_ids as string[]));
      const reps = ((await db.from("reports").select("*").eq("course_id", courseId).eq("level", level)).data ?? []).filter((x) => !used.has(x.id));
      if (!reps.length) return json(req, { error: "아직 개선안에 반영하지 않은 결과 보고서가 없습니다" }, 409);
      const c = await claim("redesign", reps[0].id);
      if (c.error) return json(req, { error: c.error }, 400);
      if (c.duplicate) return json(req, { ok: true, duplicate: c.duplicate });
      try {
        const lastApproved = revs.find((x) => x.status === "approved");
        const out = redesign(reps, (lastApproved?.notes ?? []) as never);
        await db.from("course_revisions").delete().eq("course_id", courseId).eq("level", level).eq("status", "draft");
        const version = (revs.filter((x) => x.status !== "draft")[0]?.version ?? 0) + 1;
        const ins = await db.from("course_revisions").insert({ course_id: courseId, level, version, summary: out.summary, notes: out.notes, source_report_ids: reps.map((x) => x.id), model: "rules" }).select("id").single();
        if (ins.error) throw ins.error;
        await finish(c.jobId!, { status: "done", model: "rules" });
        return json(req, { ok: true, revision_id: ins.data.id });
      } catch (e) { await finish(c.jobId!, { status: "failed", error: String((e as Error).message ?? e) }); throw e; }
    }

    /* ---------- 개선안 수정 · 승인 · 반려 ---------- */
    if (action === "save_revision" || action === "approve_revision" || action === "reject_revision") {
      const id = String(b.revision_id ?? "");
      const patch: Record<string, unknown> = {};
      if (Array.isArray(b.notes)) patch.notes = (b.notes as Record<string, unknown>[]).slice(0, 100).map((n) => ({
        session: n.session == null || n.session === "" ? null : Math.round(Number(n.session)) || null,
        text: String(n.text ?? "").slice(0, 500), count: Math.max(1, Math.round(Number(n.count) || 1)),
      })).filter((n) => n.text);
      if (typeof b.summary === "string") patch.summary = b.summary.slice(0, 1000);
      if (action === "approve_revision") Object.assign(patch, { status: "approved", approved_by: me, approved_at: new Date().toISOString() });
      if (action === "reject_revision") patch.status = "rejected";
      const up = await db.from("course_revisions").update(patch).eq("id", id).eq("status", "draft").select("id");
      if (up.error) throw up.error;
      if (!up.data?.length) return json(req, { error: "검토 중(초안)인 개선안만 바꿀 수 있습니다" }, 409);
      return json(req, { ok: true });
    }

    return json(req, { error: "알 수 없는 작업입니다" }, 400);
  } catch (e) {
    console.error(e);
    return json(req, { error: "처리 중 문제가 생겼습니다: " + String((e as Error).message ?? e) }, 500);
  }
});
