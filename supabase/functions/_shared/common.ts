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
export type Catalog = { courses: Course[]; levels: Record<string, { label: string }>; cats: { id: string; name: string; full: string }[] };

let cache: { at: number; data: Catalog } | null = null;
export async function catalog(): Promise<Catalog> {
  if (cache && Date.now() - cache.at < 5 * 60_000) return cache.data;
  const res = await fetch(`${SITE_URL}/assets/data/courses.js?t=${Date.now()}`);
  if (!res.ok) throw new Error(`수업 데이터를 불러오지 못했습니다 (${res.status})`);
  const code = await res.text();
  // courses.js 는 window.BH_* 에 값을 넣는 파일이라, 빈 window 객체를 넘겨 값만 꺼냅니다.
  const win: Record<string, unknown> = {};
  new Function("window", code)(win);
  const data: Catalog = { courses: win.BH_COURSES as Course[], levels: win.BH_LEVELS as Catalog["levels"], cats: win.BH_CATEGORIES as Catalog["cats"] };
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
