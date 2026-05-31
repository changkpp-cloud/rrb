import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyHost, msgNewDonation } from "@/lib/notify";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let memorial_id: string, donor_name: string, donor_title: string | null,
        amount: number, message: string | null, slip_url: string | null;

    if (contentType.includes("application/json")) {
      // JSON body — slip already uploaded separately
      const body = await request.json();
      memorial_id = body.memorial_id ?? "";
      donor_name = body.donor_name ?? "";
      donor_title = body.donor_title || null;
      amount = parseFloat(body.amount) || 0;
      message = body.message || null;
      slip_url = body.slip_url || null;
    } else {
      // FormData — legacy path (slip upload + donation in one step)
      const formData = await request.formData();
      memorial_id = formData.get("memorial_id") as string ?? "";
      donor_name = formData.get("donor_name") as string ?? "";
      donor_title = (formData.get("donor_title") as string) || null;
      amount = parseFloat((formData.get("amount") as string) || "0");
      message = (formData.get("message") as string) || null;
      slip_url = null;

      const slipFile = formData.get("slip") as File | null;
      if (slipFile && slipFile.size > 0) {
        const supabase = createAdminClient();
        const ext = slipFile.name.split(".").pop() ?? "jpg";
        const fileName = `slips/${memorial_id}/${Date.now()}.${ext}`;
        const buffer = await slipFile.arrayBuffer();
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("donations")
          .upload(fileName, buffer, { contentType: slipFile.type, upsert: false });
        if (!uploadError) {
          const { data: publicUrl } = supabase.storage.from("donations").getPublicUrl(uploadData.path);
          slip_url = publicUrl.publicUrl;
        }
      }
    }

    if (!memorial_id || !donor_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("donations")
      .insert({
        memorial_id,
        donor_name,
        donor_title: donor_title ?? null,
        amount,
        message: message ?? null,
        slip_url: slip_url ?? null,
        status: "confirmed" as const,
      })
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      // Fallback: retry without donor_title if column doesn't exist yet
      if (error.message.includes("Could not find") && donor_title) {
        const { data: data2, error: error2 } = await supabase
          .from("donations")
          .insert({
            memorial_id,
            donor_name,
            amount,
            message: message ?? null,
            slip_url: slip_url ?? null,
            status: "confirmed" as const,
          })
          .select()
          .single();
        if (error2) {
          return NextResponse.json({ error: "Failed to save donation" }, { status: 500 });
        }
        return NextResponse.json({ success: true, donation: data2 });
      }
      return NextResponse.json({ error: "Failed to save donation" }, { status: 500 });
    }

    // Notify host — best-effort, never blocks response
    notifyHost({
      hostPhone: await getHostPhone(supabase, memorial_id),
      message: msgNewDonation({
        memorialName: await getMemorialName(supabase, memorial_id),
        donorName: donor_name,
        donorTitle: donor_title,
        amount,
        hostId: memorial_id,
      }),
    }).catch(() => {});

    return NextResponse.json({ success: true, donation: data });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const memorial_id = searchParams.get("memorial_id");

  const supabase = createAdminClient();
  let query = supabase.from("donations").select("*").order("created_at", { ascending: false });

  if (memorial_id) {
    query = query.eq("memorial_id", memorial_id);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

// ── helpers for notify ──────────────────────────────────────────────────────
type SupabaseClient = ReturnType<typeof createAdminClient>;

async function getHostPhone(supabase: SupabaseClient, memorialId: string): Promise<string | null> {
  const { data } = await supabase.from("memorials").select("host_phone").eq("id", memorialId).single();
  return (data as { host_phone?: string | null } | null)?.host_phone ?? null;
}

async function getMemorialName(supabase: SupabaseClient, memorialId: string): Promise<string> {
  const { data } = await supabase.from("memorials").select("name").eq("id", memorialId).single();
  return (data as { name?: string } | null)?.name ?? "งานศพ";
}
