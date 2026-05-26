import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

function getSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const memorial_id = formData.get("memorial_id") as string;
    const donor_name = formData.get("donor_name") as string;
    const amount = parseFloat((formData.get("amount") as string) || "0");
    const message = (formData.get("message") as string) || null;
    const slipFile = formData.get("slip") as File | null;

    if (!memorial_id || !donor_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = getSupabase();
    let slip_url: string | null = null;

    if (slipFile && slipFile.size > 0) {
      const ext = slipFile.name.split(".").pop() ?? "jpg";
      const fileName = `slips/${memorial_id}/${Date.now()}.${ext}`;
      const buffer = await slipFile.arrayBuffer();

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("donations")
        .upload(fileName, buffer, {
          contentType: slipFile.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
      } else {
        const { data: publicUrl } = supabase.storage
          .from("donations")
          .getPublicUrl(uploadData.path);
        slip_url = publicUrl.publicUrl;
      }
    }

    const { data, error } = await supabase
      .from("donations")
      .insert({
        memorial_id,
        donor_name,
        amount,
        message: message || null,
        slip_url,
        status: "pending" as const,
      })
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ error: "Failed to save donation" }, { status: 500 });
    }

    return NextResponse.json({ success: true, donation: data });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const memorial_id = searchParams.get("memorial_id");

  const supabase = getSupabase();
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
