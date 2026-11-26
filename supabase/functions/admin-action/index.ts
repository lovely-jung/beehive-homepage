// 관리자 작업 (로그인한 관리자만)
//   generate_proposal : AI 제안서 초안 만들기
//   save_proposal     : 제안서 제목 · 본문 수정 저장
//   approve_send      : 승인하고 의뢰자에게 보낼 메일 만들기 ("교육 진행하기" 버튼 포함)
//
// 중복 클릭 방지: 화면이 버튼마다 고유 키(key)를 보내고, generation_jobs.idempotency_key 가
// 고유값이라 같은 키로 두 번 와도 두 번째는 실행되지 않습니다.
import { admin, catalog, cors, json, mdToHtml, esc, randomToken, sha256Hex } from "../_shared/common.ts";
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
        const ins = await db.from("proposals").insert({ request_id: requestId, version, title: p.title, content_md: p.md, model: "mock" }).select("id").single();
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
      const ob = await db.from("email_outbox").insert({
        request_id: r.id, to_email: r.contact_email, subject: `[비하이브] ${p.data.title}`, body_html: html, status: "preview",
      }).select("id").single();
      await db.from("requests").update({ status: "proposal_sent" }).eq("id", r.id);
      await finish(c.jobId!, { status: "done" });
      return json(req, { ok: true, outbox_id: ob.data?.id });
    }

    return json(req, { error: "알 수 없는 작업입니다" }, 400);
  } catch (e) {
    console.error(e);
    return json(req, { error: "처리 중 문제가 생겼습니다: " + String((e as Error).message ?? e) }, 500);
  }
});
