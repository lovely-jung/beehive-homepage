// 비하이브 서버 기능 공통: 응답 · CORS · 데이터베이스 · 수업 데이터 · 해시
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.45.4";

export const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://lovely-jung.github.io/beehive-homepage").replace(/\/$/, "");
const ALLOWED = (Deno.env.get("ALLOWED_ORIGINS") ?? "https://lovely-jung.github.io,http://localhost:5178")
  .split(",").map((s) => s.trim()).filter(Boolean);

export function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED.includes(origin) ? origin : ALLOWED[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors(req), "content-type": "application/json; charset=utf-8" } });
}

/** 서비스 권한 클라이언트 (서버 기능 안에서만 사용, 화면에는 절대 노출하지 않음) */
export function admin(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomToken(bytes = 32): string {
  const a = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...a)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/* ---------- 수업 데이터 (공개 사이트의 assets/data/courses.js 를 그대로 사용) ---------- */
export type Level = { goal: string; time: string; steps: string[]; tools: string; output: string; link: string; sampleLevel?: boolean };
export type Course = { id: string; cat: string; sub: string; title: string; summary: string; format: string[]; prep: string; safety?: string[]; levels: Record<string, Level>; sample?: boolean };
export type QuoteLine = { item: string; detail: string; amount: number };
export type Quote = { lines: QuoteLine[]; total: number; classes: number; vatNote: string; travelNote: string; soleContract: boolean };
export type QuoteFn = (course: Course, level: string, sessions: number, minutes: number, classes: number | null, headcount: number | null) => Quote | null;
export type PlanStep = { title: string; min: number; hook: string; aim: string; flow: [string, number, string][]; ask: string; extra: string; out: string };
export type Catalog = { courses: Course[]; levels: Record<string, { label: string }>; cats: { id: string; name: string; full: string }[]; quote: QuoteFn | null;
  plans: Record<string, Record<string, PlanStep[]>> };

let cache: { at: number; data: Catalog } | null = null;
export async function catalog(): Promise<Catalog> {
  if (cache && Date.now() - cache.at < 5 * 60_000) return cache.data;
  const res = await fetch(`${SITE_URL}/assets/data/courses.js?t=${Date.now()}`);
  if (!res.ok) throw new Error(`수업 데이터를 불러오지 못했습니다 (${res.status})`);
  const code = await res.text();
  // courses.js · pricing.js 는 window.BH_* 에 값을 넣는 파일이라, 빈 window 객체를 넘겨 값만 꺼냅니다.
  const win: Record<string, unknown> = {};
  new Function("window", code)(win);
  // 견적 기준 (없거나 못 불러오면 견적 없이 제안서만 만듭니다)
  try {
    const pr = await fetch(`${SITE_URL}/assets/data/pricing.js?t=${Date.now()}`);
    if (pr.ok) new Function("window", await pr.text())(win);
  } catch { /* 견적 생략 */ }
  // 차시별 수업안 (교안 생성에 사용)
  try {
    const pl = await fetch(`${SITE_URL}/assets/data/plans.js?t=${Date.now()}`);
    if (pl.ok) new Function("window", await pl.text())(win);
  } catch { /* 수업안 없이 진행 */ }
  const qf = typeof win.BH_QUOTE === "function" ? (win.BH_QUOTE as QuoteFn).bind(win) : null;
  const data: Catalog = { courses: win.BH_COURSES as Course[], levels: win.BH_LEVELS as Catalog["levels"], cats: win.BH_CATEGORIES as Catalog["cats"], quote: qf,
    plans: (win.BH_PLANS ?? {}) as Catalog["plans"] };
  if (!Array.isArray(data.courses)) throw new Error("수업 데이터 형식이 올바르지 않습니다");
  cache = { at: Date.now(), data };
  return data;
}

export function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]!));
}

/** 제안서 본문(마크다운 일부 문법)을 메일용 HTML로 변환: 제목, 문단, 목록, 표, 굵게 */
export function mdToHtml(md: string): string {
  const inline = (t: string) => esc(t).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const lines = md.replace(/\r/g, "").split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (/^#{1,3} /.test(l)) {
      const lv = l.match(/^#+/)![0].length;
      const size = lv === 1 ? 22 : lv === 2 ? 17 : 15;
      out.push(`<h${lv} style="margin:26px 0 10px;font-size:${size}px;color:#1f1d1a">${inline(l.replace(/^#+ /, ""))}</h${lv}>`);
      i++; continue;
    }
    if (/^\|/.test(l)) {
      const rows: string[][] = [];
      while (i < lines.length && /^\|/.test(lines[i])) {
        if (!/^\|\s*-/.test(lines[i])) rows.push(lines[i].replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
        i++;
      }
      out.push('<table style="width:100%;border-collapse:collapse;font-size:14px;margin:8px 0">' + rows.map((r, ri) =>
        "<tr>" + r.map((c) => ri === 0
          ? `<th style="text-align:left;padding:9px 10px;background:#f5f2ec;border:1px solid #e6e1d8">${inline(c)}</th>`
          : `<td style="padding:9px 10px;border:1px solid #e6e1d8;vertical-align:top">${inline(c)}</td>`).join("") + "</tr>").join("") + "</table>");
      continue;
    }
    if (/^[-*] /.test(l)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) { items.push(`<li style="margin:4px 0">${inline(lines[i].slice(2))}</li>`); i++; }
      out.push(`<ul style="margin:6px 0;padding-left:20px">${items.join("")}</ul>`);
      continue;
    }
    if (l.trim() === "") { i++; continue; }
    out.push(`<p style="margin:8px 0;line-height:1.7">${inline(l)}</p>`);
    i++;
  }
  return out.join("\n");
}

/* ---------- 로그인한 사용자 확인 ---------- */
export async function whoAmI(req: Request, db: SupabaseClient): Promise<{ id: string; email: string; role: string } | null> {
  const jwt = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) return null;
  const { data: u } = await db.auth.getUser(jwt);
  if (!u?.user) return null;
  const prof = await db.from("profiles").select("role").eq("id", u.user.id).maybeSingle();
  return { id: u.user.id, email: u.user.email ?? "", role: prof.data?.role ?? "" };
}

/* ---------- 메일 발송 (Resend) ----------
   RESEND_API_KEY 와 MAIL_FROM 이 모두 설정되어 있을 때만 실제로 보내고, 없으면 { error: "preview" } */
export async function sendMail(to: string, subject: string, html: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  const key = Deno.env.get("RESEND_API_KEY") ?? "", from = Deno.env.get("MAIL_FROM") ?? "", replyTo = Deno.env.get("MAIL_REPLY_TO") ?? "";
  if (!key || !from) return { ok: false, error: "preview" };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  const out = await res.json().catch(() => ({}));
  return res.ok ? { ok: true, id: out.id } : { ok: false, error: String(out.message ?? res.status) };
}

/** 메일을 보낼 메일함(email_outbox)에 남기고, 설정이 있으면 실제로 발송 */
export async function queueMail(db: SupabaseClient, requestId: string | null, to: string, subject: string, html: string) {
  const ob = await db.from("email_outbox").insert({ request_id: requestId, to_email: to, subject, body_html: html, status: "preview" }).select("id").single();
  const sent = await sendMail(to, subject, html);
  if (sent.ok) await db.from("email_outbox").update({ status: "sent", sent_at: new Date().toISOString(), provider_id: sent.id }).eq("id", ob.data!.id);
  else if (sent.error !== "preview") await db.from("email_outbox").update({ status: "failed", error: sent.error }).eq("id", ob.data!.id);
  return { outbox_id: ob.data?.id as string | undefined, mail: sent.ok ? "sent" : sent.error === "preview" ? "preview" : "failed", mail_error: sent.ok ? undefined : sent.error };
}

/** 메일 공통 틀 */
export function mailFrame(inner: string): string {
  return `<div style="max-width:640px;margin:0 auto;font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#26241f">
  <p style="font-size:20px;font-weight:800;margin:0 0 18px">beehive<span style="color:#e9822d">.</span></p>${inner}</div>`;
}
