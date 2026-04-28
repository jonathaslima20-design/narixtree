import { createClient } from "npm:@supabase/supabase-js@2.80.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PAGE_SIZE = 200;
const MAX_PAGES = 120;
const BUDGET_MS = 90_000;

type RequestShape = "post_where" | "post_limit" | "post_empty" | "get";

function json(status: number, data: unknown) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function onlyDigits(raw: string): string {
  return (raw || "").replace(/\D/g, "");
}

function normalizePhone(raw: string): string {
  const digits = onlyDigits(raw);
  if (!digits) return "";
  if (digits.length < 8) return "";
  if (digits.startsWith("55")) {
    const rest = digits.slice(2);
    if (rest.length === 10) {
      const ddd = rest.slice(0, 2);
      const first = rest.charAt(2);
      const subscriber = rest.slice(2);
      if (/[6-9]/.test(first)) return `55${ddd}9${subscriber}`;
    }
    return digits;
  }
  if (digits.length === 11) {
    const first = digits.charAt(2);
    if (/[6-9]/.test(first)) return `55${digits}`;
  }
  if (digits.length === 10) {
    const ddd = digits.slice(0, 2);
    const first = digits.charAt(2);
    const subscriber = digits.slice(2);
    if (/[6-9]/.test(first)) return `55${ddd}9${subscriber}`;
    return `55${digits}`;
  }
  return digits;
}

function normalizePhoneFromJid(jid: unknown): string {
  if (typeof jid !== "string") return "";
  const clean = jid.split(":")[0];
  const base = clean.includes("@") ? clean.split("@")[0] : clean;
  return normalizePhone(base);
}

function resolveRealPhoneFromNode(e: Record<string, unknown>): string {
  const candidates: unknown[] = [
    e.phoneNumber,
    e.phone,
    e.owner,
    e.jidAlt,
    e.alternate_id,
  ];
  const contact = e.contact as Record<string, unknown> | undefined;
  if (contact) {
    candidates.push(contact.id, contact.remoteJid, contact.phoneNumber);
  }
  for (const c of candidates) {
    if (typeof c !== "string" || !c) continue;
    if (c.endsWith("@s.whatsapp.net") || c.endsWith("@c.us")) {
      const base = c.split("@")[0];
      const norm = normalizePhone(base);
      if (norm && norm.length >= 10 && norm.length <= 15) return norm;
    }
    const norm = normalizePhone(c);
    if (norm && norm.length >= 10 && norm.length <= 15) return norm;
  }
  return "";
}

function extractLastActivityIso(node: Record<string, unknown>): string {
  const candidates: unknown[] = [
    node.conversationTimestamp,
    node.updatedAt,
    node.updated_at,
    node.lastMessageTimestamp,
    node.t,
  ];
  const lastMsg = node.lastMessage as Record<string, unknown> | undefined;
  if (lastMsg) {
    candidates.push(lastMsg.messageTimestamp, lastMsg.timestamp, lastMsg.t);
    const lmKey = lastMsg.key as Record<string, unknown> | undefined;
    if (lmKey) candidates.push(lmKey.timestamp);
  }
  for (const c of candidates) {
    if (c == null) continue;
    if (typeof c === "number" && isFinite(c) && c > 0) {
      const ms = c > 1e12 ? c : c * 1000;
      const d = new Date(ms);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
    if (typeof c === "string" && c.trim()) {
      const asNum = Number(c);
      if (!isNaN(asNum) && asNum > 0) {
        const ms = asNum > 1e12 ? asNum : asNum * 1000;
        const d = new Date(ms);
        if (!isNaN(d.getTime())) return d.toISOString();
      }
      const d = new Date(c);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
  }
  return "";
}

function extractLastMessagePreview(node: Record<string, unknown>): string {
  const lastMsg = node.lastMessage as Record<string, unknown> | undefined;
  if (!lastMsg) return "";
  const message = (lastMsg.message ?? {}) as Record<string, unknown>;
  if (typeof message.conversation === "string") return message.conversation;
  const ext = message.extendedTextMessage as Record<string, unknown> | undefined;
  if (ext && typeof ext.text === "string") return ext.text;
  const img = message.imageMessage as Record<string, unknown> | undefined;
  if (img && typeof img.caption === "string") return img.caption || "[imagem]";
  if (img) return "[imagem]";
  const vid = message.videoMessage as Record<string, unknown> | undefined;
  if (vid)
    return typeof vid.caption === "string" && vid.caption
      ? vid.caption
      : "[video]";
  if (message.audioMessage) return "[audio]";
  if (message.documentMessage) return "[documento]";
  if (message.stickerMessage) return "[figurinha]";
  return "";
}

function extractProfilePic(node: Record<string, unknown>): string {
  const direct =
    (node.profilePicUrl as string | undefined) ||
    (node.profilePictureUrl as string | undefined) ||
    (node.picture as string | undefined) ||
    "";
  if (typeof direct === "string" && direct.startsWith("http")) return direct;
  return "";
}

type ExtractCategory = "ok" | "group" | "broadcast" | "invalid_phone" | "no_jid";

interface ChatInfo {
  jid: string;
  phone: string;
  name: string;
  profile_pic: string;
  last_activity: string;
  last_message_preview: string;
}

function extractInfo(
  e: Record<string, unknown>,
): { category: ExtractCategory; info?: ChatInfo } {
  const jid =
    (e.id as string | undefined) ||
    (e.remoteJid as string | undefined) ||
    (e.jid as string | undefined) ||
    "";
  if (!jid) return { category: "no_jid" };
  if (jid.endsWith("@g.us")) return { category: "group" };
  if (jid === "status@broadcast" || jid.endsWith("@broadcast"))
    return { category: "broadcast" };
  if (jid.endsWith("@newsletter")) return { category: "invalid_phone" };

  const isLid = jid.endsWith("@lid");
  const isStandard =
    jid.endsWith("@s.whatsapp.net") || jid.endsWith("@c.us");
  if (!isLid && !isStandard && jid.includes("@")) {
    return { category: "invalid_phone" };
  }

  const altPhone = isLid ? resolveRealPhoneFromNode(e) : "";
  const normalized = normalizePhoneFromJid(jid);

  let phone = "";
  let canonicalJid = jid;
  if (isLid) {
    if (altPhone) {
      phone = altPhone;
      canonicalJid = `${altPhone}@s.whatsapp.net`;
    } else {
      const rawId = jid.split("@")[0];
      if (!rawId) return { category: "invalid_phone" };
      phone = `lid:${rawId}`;
    }
  } else {
    if (!normalized) return { category: "invalid_phone" };
    if (normalized.length < 10 || normalized.length > 15)
      return { category: "invalid_phone" };
    phone = normalized;
  }

  const name =
    (e.pushName as string | undefined) ||
    (e.name as string | undefined) ||
    (e.verifiedName as string | undefined) ||
    (e.subject as string | undefined) ||
    (e.notify as string | undefined) ||
    "";

  return {
    category: "ok",
    info: {
      jid: canonicalJid,
      phone,
      name,
      profile_pic: extractProfilePic(e),
      last_activity: extractLastActivityIso(e),
      last_message_preview: extractLastMessagePreview(e),
    },
  };
}

type FetchResult = { data: unknown; status: number; ok: boolean };

async function fetchJson(url: string, init: RequestInit): Promise<FetchResult> {
  try {
    const res = await fetch(url, init);
    const body = await res.json().catch(() => null);
    return { data: body, status: res.status, ok: res.ok };
  } catch {
    return { data: null, status: 0, ok: false };
  }
}

function toArray(
  data: unknown,
  keys: string[],
): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === "object") {
    for (const k of keys) {
      const arr = (data as Record<string, unknown>)[k];
      if (Array.isArray(arr)) return arr as Record<string, unknown>[];
    }
  }
  return [];
}

function buildRequest(
  shape: RequestShape,
  headers: Record<string, string>,
  page: number,
): RequestInit {
  switch (shape) {
    case "post_where":
      return {
        method: "POST",
        headers,
        body: JSON.stringify({ where: {}, page, offset: PAGE_SIZE }),
      };
    case "post_limit":
      return {
        method: "POST",
        headers,
        body: JSON.stringify({ page, limit: PAGE_SIZE }),
      };
    case "post_empty":
      return { method: "POST", headers, body: JSON.stringify({}) };
    case "get":
      return { method: "GET", headers };
  }
}

async function fetchPage(
  evoUrl: string,
  apiKey: string,
  instance: string,
  page: number,
  shapeRef: { shape: RequestShape | null },
): Promise<{ entries: Record<string, unknown>[]; lastStatus: number }> {
  const headers = { "Content-Type": "application/json", apikey: apiKey };
  const endpoint = `${evoUrl}/chat/findChats/${encodeURIComponent(instance)}`;

  if (shapeRef.shape) {
    const init = buildRequest(shapeRef.shape, headers, page);
    const res = await fetchJson(endpoint, init);
    const arr = toArray(res.data, ["chats", "data", "records", "result"]);
    return { entries: arr, lastStatus: res.status };
  }

  const shapes: RequestShape[] = [
    "post_where",
    "post_limit",
    "post_empty",
    "get",
  ];
  let lastStatus = 0;
  for (const shape of shapes) {
    const init = buildRequest(shape, headers, page);
    const res = await fetchJson(endpoint, init);
    lastStatus = res.status;
    const arr = toArray(res.data, ["chats", "data", "records", "result"]);
    if (arr.length > 0) {
      shapeRef.shape = shape;
      return { entries: arr, lastStatus };
    }
  }
  return { entries: [], lastStatus };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return json(401, { error: "Missing authorization token" });

    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
    });
    if (!userRes.ok) return json(401, { error: "Invalid authentication" });
    const user = (await userRes.json()) as { id?: string };
    if (!user?.id) return json(401, { error: "Invalid authentication" });

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: instance } = await admin
      .from("whatsapp_instances")
      .select(
        "id, instance_name, phone_number, profile_name, status, evolution_api_key",
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (!instance)
      return json(400, {
        error: "Nenhuma instancia do WhatsApp encontrada",
      });
    if (instance.status !== "connected")
      return json(400, {
        error: "Conecte o WhatsApp antes de buscar os chats",
      });

    const { data: settings } = await admin
      .from("admin_settings")
      .select("key, value")
      .in("key", ["EVOLUTION_API_URL", "EVOLUTION_GLOBAL_KEY"]);
    const evoUrl = settings
      ?.find((s) => s.key === "EVOLUTION_API_URL")
      ?.value?.replace(/\/+$/, "");
    const globalKey = settings?.find(
      (s) => s.key === "EVOLUTION_GLOBAL_KEY",
    )?.value;
    const apiKey =
      (instance.evolution_api_key as string | null | undefined)?.trim() ||
      globalKey ||
      "";
    if (!evoUrl || !apiKey)
      return json(400, { error: "Evolution API nao configurada" });

    const ownerPhone = (instance.phone_number as string | null) || "";
    const instanceName = instance.instance_name as string;
    const startedAt = Date.now();

    const shapeRef: { shape: RequestShape | null } = { shape: null };
    const seenJids = new Set<string>();
    const chats: ChatInfo[] = [];

    for (let page = 1; page <= MAX_PAGES; page++) {
      if (Date.now() - startedAt > BUDGET_MS) break;

      const { entries } = await fetchPage(
        evoUrl,
        apiKey,
        instanceName,
        page,
        shapeRef,
      );
      if (entries.length === 0) break;

      const seenBefore = seenJids.size;

      for (const e of entries) {
        const { category, info } = extractInfo(e);
        if (category !== "ok" || !info) continue;
        if (ownerPhone && info.phone === ownerPhone) continue;
        if (seenJids.has(info.jid)) continue;
        seenJids.add(info.jid);
        chats.push(info);
      }

      const newUniques = seenJids.size - seenBefore;
      if (page > 1 && newUniques === 0) break;
      if (entries.length < PAGE_SIZE) break;
    }

    // Check which phones already exist as leads
    const phonesArr = chats.map((c) => c.phone);
    const existingPhones = new Set<string>();
    const chunkSize = 200;
    for (let i = 0; i < phonesArr.length; i += chunkSize) {
      const chunk = phonesArr.slice(i, i + chunkSize);
      const { data } = await admin
        .from("leads")
        .select("phone")
        .eq("user_id", user.id)
        .in("phone", chunk);
      if (data) {
        for (const row of data) existingPhones.add(row.phone);
      }
    }

    // Also check by JID for lid: contacts
    const jidsArr = chats
      .filter((c) => c.phone.startsWith("lid:"))
      .map((c) => c.jid);
    if (jidsArr.length > 0) {
      for (let i = 0; i < jidsArr.length; i += chunkSize) {
        const chunk = jidsArr.slice(i, i + chunkSize);
        const { data } = await admin
          .from("leads")
          .select("phone, whatsapp_jid")
          .eq("user_id", user.id)
          .in("whatsapp_jid", chunk);
        if (data) {
          for (const row of data) existingPhones.add(row.phone);
        }
      }
    }

    const result = chats.map((c) => ({
      ...c,
      already_imported: existingPhones.has(c.phone),
    }));

    result.sort((a, b) => {
      if (a.last_activity && b.last_activity)
        return b.last_activity.localeCompare(a.last_activity);
      if (a.last_activity) return -1;
      if (b.last_activity) return 1;
      return 0;
    });

    return json(200, {
      ok: true,
      total: result.length,
      already_imported_count: result.filter((c) => c.already_imported).length,
      chats: result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("whatsapp-list-chats failed:", message);
    return json(500, { error: message });
  }
});
