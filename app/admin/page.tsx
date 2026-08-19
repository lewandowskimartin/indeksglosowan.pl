import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin, adminSecretMatches, ADMIN_COOKIE } from "@/lib/admin-auth";
import VotingCurationTable from "@/components/admin/VotingCurationTable";

const PAGE_SIZE = 25;

async function login(formData: FormData) {
  "use server";
  const candidate = String(formData.get("secret") ?? "");
  if (!adminSecretMatches(candidate)) redirect("/admin?bad=1");
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, candidate, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  redirect("/admin");
}

function LoginForm({ bad }: { bad?: boolean }) {
  return (
    <form action={login} className="max-w-sm mx-auto mt-20 space-y-3">
      <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Panel kuracji</h2>
      <input
        type="password"
        name="secret"
        placeholder="ADMIN_SECRET"
        autoComplete="off"
        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
      />
      {bad && <p className="text-xs text-red-600">Nieprawidłowy klucz.</p>}
      <button
        type="submit"
        className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 text-sm"
      >
        Wejdź
      </button>
    </form>
  );
}

async function AdminContent({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; page?: string; bad?: string }>;
}) {
  await connection();
  const sp = await searchParams;

  if (!(await isAdmin())) return <LoginForm bad={sp.bad === "1"} />;

  const supabase = await createClient();
  const { filter = "needs", page = "1" } = sp;
  const currentPage = Math.max(1, parseInt(page) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  let query = supabase
    .from("votings")
    .select(
      "id, title, topic, description, vote_date, druk_number, display_title, published, summary, pros, cons, categories, tags",
      { count: "exact" }
    )
    .range(offset, offset + PAGE_SIZE - 1);

  if (filter === "needs") {
    query = query
      .eq("published", false)
      .order("display_title", { ascending: true, nullsFirst: true })
      .order("vote_date", { ascending: false });
  } else {
    query = query.order("vote_date", { ascending: false });
    if (filter === "done") query = query.not("display_title", "is", null);
    if (filter === "published") query = query.eq("published", true);
  }

  const { data: votings, count, error } = await query;

  if (error) {
    return <div className="text-center py-12 text-red-500">Nie udało się wczytać głosowań: {error.message}</div>;
  }

  return (
    <VotingCurationTable
      votings={votings ?? []}
      total={count ?? 0}
      filter={filter}
      page={currentPage}
      pageSize={PAGE_SIZE}
    />
  );
}

export default function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; page?: string; bad?: string }>;
}) {
  return (
    <Suspense fallback={<div className="h-96 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />}>
      <AdminContent searchParams={searchParams} />
    </Suspense>
  );
}
