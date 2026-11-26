// 의뢰 접수 (누구나 호출 가능)
//  · 화면이 보낸 submit_key 로 중복 제출을 막습니다 (버튼 두 번 → 의뢰 1건)
//  · 같은 곳(IP)에서 1시간에 5건, 같은 이메일로 하루 5건을 넘으면 거절합니다
//  · 숨은 입력칸(website)이 채워져 있으면 자동 프로그램으로 보고 조용히 무시합니다
import { admin, catalog, cors, json, sha256Hex } from "../_shared/common.ts";

const ORG_TYPES = ["school", "university", "public", "company", "other"];
const LEVELS = ["elem", "mid", "high", "univ", "adult"];
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const int = (v: unknown) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : NaN);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, { error: "허용되지 않은 요청입니다" }, 405);

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json(req, { error: "요청 형식이 올바르지 않습니다" }, 400); }

  if (str(b.website, 100)) return json(req, { ok: true }); // 스팸 봇: 저장하지 않고 성공처럼 응답

  const row = {
    org_name: str(b.org_name, 120), org_type: str(b.org_type, 20),
    contact_name: str(b.contact_name, 60), contact_email: str(b.contact_email, 200).toLowerCase(),
    contact_phone: str(b.contact_phone, 30) || null,
    course_id: str(b.course_id, 60), level: str(b.level, 10),
    sessions: int(b.sessions), minutes_per_session: int(b.minutes_per_session),
    headcount: b.headcount === "" || b.headcount == null ? null : int(b.headcount),
    class_count: b.class_count === "" || b.class_count == null ? null : int(b.class_count),
    preferred_dates: str(b.preferred_dates, 300) || null, location: str(b.location, 200) || null,
    notes: str(b.notes, 2000) || null,
    privacy_consent: b.privacy_consent === true,
    submit_key: str(b.submit_key, 80),
  };

  const errors: string[] = [];
  if (!row.org_name) errors.push("기관명을 입력해 주세요");
  if (!ORG_TYPES.includes(row.org_type)) errors.push("기관 유형을 골라 주세요");
  if (!row.contact_name) errors.push("담당자 이름을 입력해 주세요");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(row.contact_email)) errors.push("이메일 주소를 확인해 주세요");
  if (!LEVELS.includes(row.level)) errors.push("대상을 골라 주세요");
  if (!(row.sessions >= 1 && row.sessions <= 40)) errors.push("차시는 1~40 사이로 입력해 주세요");
  if (!(row.minutes_per_session >= 20 && row.minutes_per_session <= 480)) errors.push("1차시 시간은 20~480분 사이로 입력해 주세요");
  if (row.headcount !== null && !(row.headcount >= 1 && row.headcount <= 2000)) errors.push("인원을 확인해 주세요");
  if (row.class_count !== null && !(row.class_count >= 1 && row.class_count <= 60)) errors.push("학급 수는 1~60 사이로 입력해 주세요");
  if (!row.privacy_consent) errors.push("개인정보 수집 · 이용에 동의해 주세요");
  if (row.submit_key.length < 16) errors.push("잘못된 요청입니다. 새로고침 후 다시 시도해 주세요");
  try {
    const cat = await catalog();
    const c = cat.courses.find((x) => x.id === row.course_id && x.cat !== "biz");
    if (!c) errors.push("수업을 골라 주세요");
    else if (!c.levels[row.level]) errors.push("이 수업은 선택한 대상으로 운영하지 않습니다");
  } catch { /* 수업 데이터를 못 불러와도 접수는 받고, 관리자가 확인합니다 */ }
  if (errors.length) return json(req, { error: errors[0], errors }, 400);

  const db = admin();
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const ipHash = ip ? await sha256Hex(`${Deno.env.get("IP_SALT") ?? "beehive"}:${ip}`) : null;
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();

  // 같은 버튼이 두 번 눌린 경우: 이미 저장된 의뢰를 그대로 돌려줌
  const dup = await db.from("requests").select("id").eq("submit_key", row.submit_key).maybeSingle();
  if (dup.data) return json(req, { ok: true, id: dup.data.id, duplicate: true });

  if (ipHash) {
    const { count } = await db.from("requests").select("id", { count: "exact", head: true }).eq("submit_ip_hash", ipHash).gte("created_at", hourAgo);
    if ((count ?? 0) >= 5) return json(req, { error: "짧은 시간에 신청이 많아 잠시 후 다시 시도해 주세요" }, 429);
  }
  const { count: perEmail } = await db.from("requests").select("id", { count: "exact", head: true }).eq("contact_email", row.contact_email).gte("created_at", dayAgo);
  if ((perEmail ?? 0) >= 5) return json(req, { error: "오늘 같은 이메일로 접수된 신청이 많습니다. 전화로 문의해 주세요" }, 429);

  const ins = await db.from("requests").insert({ ...row, submit_ip_hash: ipHash }).select("id").single();
  if (ins.error) {
    if (ins.error.code === "23505") { // 거의 동시에 두 번 눌린 경우
      const again = await db.from("requests").select("id").eq("submit_key", row.submit_key).maybeSingle();
      return json(req, { ok: true, id: again.data?.id, duplicate: true });
    }
    console.error(ins.error);
    return json(req, { error: "접수 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요" }, 500);
  }
  return json(req, { ok: true, id: ins.data.id });
});
