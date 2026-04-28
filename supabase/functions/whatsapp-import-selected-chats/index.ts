import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2.80.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(status: number, data: unknown) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface ChatPayload {
  jid: string;
  phone: string;
  name: string;
  profile_pic?: string;
  last_activity?: string;
  last_message_preview?: string;
}

async function upsertLead(
  admin: SupabaseClient,
  userId: string,
  chat: ChatPayload,
  category: string,
  ownerProfileName: string,
): Promise<"created" | "updated" | "skipped"> {
  const byJid = await admin
    .from("leads")
    .select(
      "id, name, profile_picture_url, last_activity_at, last_message, whatsapp_jid",
    )
    .eq("user_id", userId)
    .eq("whatsapp_jid", chat.jid)
    .maybeSingle();

  const existing = byJid.data
    ? byJid.data
    : (
        await admin
          .from("leads")
          .select(
            "id, name, profile_picture_url, last_activity_at, last_message, whatsapp_jid",
          )
          .eq("user_id", userId)
          .eq("phone", chat.phone)
          .maybeSingle()
      ).data;

  if (existing) {
    const updates: Record<string, unknown> = {};
    const existingName = (existing.name as string | null) ?? "";
    if (
      (!existingName || existingName === chat.phone) &&
      chat.name &&
      (!ownerProfileName || chat.name !== ownerProfileName)
    ) {
      updates.name = chat.name;
    }
    if (chat.profile_pic && !existing.profile_picture_url) {
      updates.profile_picture_url = chat.profile_pic;
      updates.profile_picture_updated_at = new Date().toISOString();
    }
    if (chat.last_activity) {
      const current = existing.last_activity_at as string | null | undefined;
      if (!current || chat.last_activity > current) {
        updates.last_activity_at = chat.last_activity;
      }
    }
    if (!existing.whatsapp_jid && chat.jid) {
      updates.whatsapp_jid = chat.jid;
    }
    updates.category = category;
    if (Object.keys(updates).length === 0) return "skipped";
    await admin.from("leads").update(updates).eq("id", existing.id);
    return "updated";
  }

  const insertPayload: Record<string, unknown> = {
    user_id: userId,
    phone: chat.phone,
    whatsapp_jid: chat.jid,
    name:
      chat.name && (!ownerProfileName || chat.name !== ownerProfileName)
        ? chat.name
        : "",
    last_message: chat.last_message_preview || "",
    message_count: 0,
    unread_count: 0,
    last_activity_at: chat.last_activity || null,
    source: "whatsapp",
    pipeline_stage: "new",
    temperature: "cold",
    category,
    has_more_history: true,
  };
  if (chat.profile_pic) {
    insertPayload.profile_picture_url = chat.profile_pic;
    insertPayload.profile_picture_updated_at = new Date().toISOString();
  }

  const { data: inserted } = await admin
    .from("leads")
    .upsert(insertPayload, { onConflict: "user_id,phone" })
    .select("id")
    .maybeSingle();

  if (inserted?.id) {
    await admin.from("lead_activities").insert({
      user_id: userId,
      lead_id: inserted.id,
      action: "created",
      meta: { source: "whatsapp_import_selected" },
    });
    return "created";
  }
  return "skipped";
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

    const body = (await req.json().catch(() => ({}))) as {
      chats?: ChatPayload[];
      category?: string;
      instance_id?: string;
    };

    if (!body.chats || !Array.isArray(body.chats) || body.chats.length === 0) {
      return json(400, { error: "Nenhum chat selecionado" });
    }

    const category = body.category || "cold";

    const { data: instances } = await admin
      .from("whatsapp_instances")
      .select("id, profile_name, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    const instance = body.instance_id
      ? instances?.find((i) => i.id === body.instance_id)
      : instances?.find((i) => i.status === "connected") || instances?.[0];
    const ownerProfileName =
      (instance?.profile_name as string | null) || "";

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const chat of body.chats) {
      if (!chat.phone || !chat.jid) {
        skipped++;
        continue;
      }
      const result = await upsertLead(
        admin,
        user.id,
        chat,
        category,
        ownerProfileName,
      );
      if (result === "created") created++;
      else if (result === "updated") updated++;
      else skipped++;
    }

    return json(200, {
      ok: true,
      created,
      updated,
      skipped,
      total: created + updated,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("whatsapp-import-selected-chats failed:", message);
    return json(500, { error: message });
  }
});
