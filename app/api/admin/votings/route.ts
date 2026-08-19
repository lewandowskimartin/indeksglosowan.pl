import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminRequest } from "@/lib/admin-auth";
import { NextResponse } from "next/server";

interface UpdatePayload {
  id: string;
  display_title?: string;
  published?: boolean;
  summary?: string;
  pros?: string[];
  cons?: string[];
  categories?: string[];
  tags?: string[];
}

export async function PATCH(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  let updates: UpdatePayload[];
  try {
    const body = await request.json();
    updates = body.updates;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const valid = updates.every(u => {
    if (typeof u.id !== "string" || u.id.length !== 36) return false;
    const hasTitle = u.display_title !== undefined
      ? typeof u.display_title === "string" && u.display_title.trim().length > 0 && u.display_title.trim().length <= 300
      : true;
    const hasPublished = u.published !== undefined
      ? typeof u.published === "boolean"
      : true;
    const hasSummary = u.summary !== undefined
      ? typeof u.summary === "string"
      : true;
    const hasPros = u.pros !== undefined
      ? Array.isArray(u.pros) && u.pros.every((p: unknown) => typeof p === "string")
      : true;
    const hasCons = u.cons !== undefined
      ? Array.isArray(u.cons) && u.cons.every((c: unknown) => typeof c === "string")
      : true;
    const hasCategories = u.categories !== undefined
      ? Array.isArray(u.categories) && u.categories.every((c: unknown) => typeof c === "string")
      : true;
    const hasTags = u.tags !== undefined
      ? Array.isArray(u.tags) && u.tags.every((t: unknown) => typeof t === "string")
      : true;
    const hasAnyField = u.display_title !== undefined || u.published !== undefined
      || u.summary !== undefined || u.pros !== undefined || u.cons !== undefined
      || u.categories !== undefined || u.tags !== undefined;
    return hasTitle && hasPublished && hasSummary && hasPros && hasCons && hasCategories && hasTags && hasAnyField;
  });

  if (!valid) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const results = await Promise.all(
    updates.map(({ id, display_title, published, summary, pros, cons, categories, tags }) => {
      const patch: Record<string, unknown> = {};
      if (display_title !== undefined) patch.display_title = display_title.trim();
      if (published !== undefined) patch.published = published;
      if (summary !== undefined) patch.summary = summary.trim() || null;
      if (pros !== undefined) patch.pros = pros.filter(p => p.trim()).map(p => p.trim());
      if (cons !== undefined) patch.cons = cons.filter(c => c.trim()).map(c => c.trim());
      if (categories !== undefined) patch.categories = categories.filter(c => c.trim()).map(c => c.trim());
      if (tags !== undefined) patch.tags = tags.filter(t => t.trim()).map(t => t.trim());
      return supabase.from("votings").update(patch).eq("id", id);
    })
  );

  const failed = results.filter(r => r.error);
  if (failed.length > 0) {
    console.error("Save failures:", failed.map(r => r.error));
    return NextResponse.json({ error: `${failed.length} updates failed` }, { status: 500 });
  }

  return NextResponse.json({ ok: true, updated: updates.length });
}
