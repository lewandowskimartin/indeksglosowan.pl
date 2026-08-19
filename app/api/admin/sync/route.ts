import { NextResponse } from "next/server";
import { syncMPs } from "@/lib/sejm-api/sync-mps";
import { syncSitting } from "@/lib/sejm-api/sync-votings";

export async function GET(request: Request) {
  // ── Auth: require ADMIN_SECRET header ──────────────────────────────────────
  const secret = request.headers.get("x-admin-secret");
  if (
    !process.env.ADMIN_SECRET ||
    process.env.ADMIN_SECRET.length < 16 ||
    secret !== process.env.ADMIN_SECRET
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const sitting = searchParams.get("sitting");

  try {
    // Sync only MPs
    if (type === "mps") {
      const count = await syncMPs();
      return NextResponse.json({ message: "Success", syncedMPs: count });
    }

    // Sync a specific sitting — validate it's a positive integer
    if (sitting) {
      const sittingNum = parseInt(sitting, 10);
      if (isNaN(sittingNum) || sittingNum <= 0 || sittingNum > 9999) {
        return NextResponse.json(
          { error: "sitting must be a positive integer (1–9999)" },
          { status: 400 }
        );
      }

      const mps = await syncMPs();
      const { saved } = await syncSitting(sittingNum);

      return NextResponse.json({
        message: "Success",
        sitting: sittingNum,
        syncedMPs: mps,
        newVotingsSaved: saved,
      });
    }

    return NextResponse.json(
      { error: "Please provide ?type=mps or ?sitting=[number] to trigger a sync." },
      { status: 400 }
    );
  } catch (err: unknown) {
    console.error("Sync Error:", err);
    return NextResponse.json({ error: "Internal sync error" }, { status: 500 });
  }
}
