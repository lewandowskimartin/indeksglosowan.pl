import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export const metadata = { title: `Admin — ${SITE_NAME}`, robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
            ← Serwis
          </Link>
          <span className="text-zinc-200 dark:text-zinc-700">|</span>
          <h1 className="font-bold text-zinc-900 dark:text-zinc-100">
            Kuracja głosowań
            <span className="ml-2 text-xs font-normal bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">
              admin
            </span>
          </h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
