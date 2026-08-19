import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";


export async function GET(request: Request) {
  const secret = request.headers.get("x-admin-secret");
  if (
    !process.env.ADMIN_SECRET ||
    process.env.ADMIN_SECRET.length < 16 ||
    secret !== process.env.ADMIN_SECRET
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  let updated = 0;
  let totalScanned = 0;
  const PAGE_SIZE = 1000;
  let from = 0;

  // Paginate through all votings (Supabase caps at 1000 rows per query)
  while (true) {
    const { data, error } = await supabase
      .from('votings')
      .select('id, title, topic, description')
      .range(from, from + PAGE_SIZE - 1);

    if (error || !data || data.length === 0) break;

    totalScanned += data.length;

    for (const v of data) {
      const text = `${v.title || ''} ${v.topic || ''} ${v.description || ''}`;
      const match = text.match(/druk[ui]?\s+nr\s*(\d+)/i);

      if (match) {
        const druk_number = parseInt(match[1], 10);
        const { error: upErr } = await supabase
          .from('votings')
          .update({ druk_number })
          .eq('id', v.id);
        if (!upErr) updated++;
      }
    }

    if (data.length < PAGE_SIZE) break; // last page
    from += PAGE_SIZE;
  }

  return NextResponse.json({
    message: "Successfully Repaired Missing Druk Numbers",
    repaired_rows: updated,
    scanned_rows: totalScanned,
  });
}
