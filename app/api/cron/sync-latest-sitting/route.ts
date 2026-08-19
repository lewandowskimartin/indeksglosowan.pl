import { NextResponse } from "next/server";
import { syncMPs } from "@/lib/sejm-api/sync-mps";
import { syncSitting } from "@/lib/sejm-api/sync-votings";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Vercel Cron Job: Syncs the latest Sejm sitting daily.
 * New votings are marked as unpublished (published=false) until admin adds display_title.
 *
 * Scheduled via vercel.json — runs every day at 2 AM UTC.
 */
export async function GET(request: Request) {
  // Verify this is a Vercel cron job request
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // 1. Find the highest sitting number already in DB
    const { data: maxSitting } = await supabase
      .from("votings")
      .select("sitting_number")
      .order("sitting_number", { ascending: false })
      .limit(1)
      .single();

    const lastSittingInDB = maxSitting?.sitting_number ?? 0;
    const nextSitting = lastSittingInDB + 1;

    // 2. Sync MPs (fresh data, idempotent)
    const syncedMPs = await syncMPs();

    // 3. Try to sync the next sitting (markAsPublished=false for cron)
    const { saved: savedVotings } = await syncSitting(nextSitting, false);

    // If nothing new, try checking a few more sittings ahead (in case some were skipped)
    let totalVotings = savedVotings;
    if (savedVotings === 0) {
      for (let i = 1; i <= 3; i++) {
        try {
          const { saved } = await syncSitting(nextSitting + i, false);
          totalVotings += saved;
          if (saved > 0) break; // Found one with new data
        } catch {
          // Continue if sitting doesn't exist
        }
      }
    }

    return NextResponse.json({
      message: "Cron sync completed",
      syncedMPs,
      newVotings: totalVotings,
      nextSittingChecked: nextSitting,
      status: totalVotings > 0 ? "new_data_synced" : "no_new_data",
    });
  } catch (err: unknown) {
    console.error("Cron sync error:", err);
    return NextResponse.json(
      { error: "Internal cron error" },
      { status: 500 }
    );
  }
}
