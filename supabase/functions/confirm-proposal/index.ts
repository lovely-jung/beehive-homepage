// "교육 진행하기" 버튼 (메일 속 링크, 누구나 호출)
//  · 링크의 일회용 값을 해시로 비교해 해당 제안서를 찾습니다
//  · 이미 확정된 경우 다시 확정하지 않고 "이미 확정됨" 화면으로 보냅니다 (두 번 눌러도 안전)
import { admin, SITE_URL, sha256Hex } from "../_shared/common.ts";

const go = (state: string) => Response.redirect(`${SITE_URL}/confirmed.html?s=${state}`, 302);

Deno.serve(async (req) => {
  const t = new URL(req.url).searchParams.get("t") ?? "";
  if (t.length < 20 || t.length > 100) return go("invalid");
  const db = admin();
  const hash = await sha256Hex(t);
  const p = await db.from("proposals").select("id, request_id, status, confirmed_at").eq("confirm_token_hash", hash).maybeSingle();
  if (!p.data || p.data.status !== "sent") return go("invalid");
  if (p.data.confirmed_at) return go("already");

  const now = new Date().toISOString();
  // confirmed_at 이 비어 있을 때만 기록 → 동시에 두 번 눌러도 한 번만 확정
  const up = await db.from("proposals").update({ confirmed_at: now }).eq("id", p.data.id).is("confirmed_at", null).select("id");
  if (!up.data?.length) return go("already");
  await db.from("requests").update({ status: "confirmed" }).eq("id", p.data.request_id);
  return go("ok");
});
