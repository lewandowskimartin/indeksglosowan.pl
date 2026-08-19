import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { SITE_NAME } from "@/lib/site";

const NAV = [
  { href: "/glosowania", label: "Głosowania" },
  { href: "/poslowie", label: "Posłowie" },
  { href: "/partie", label: "Kluby" },
  { href: "/rankingi", label: "Rankingi" },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-100 dark:border-zinc-900 bg-white/85 dark:bg-zinc-950/85 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
        <Link href="/" className="font-black tracking-tight text-base shrink-0">
          {SITE_NAME.split(" ")[0]}
          <span className="text-blue-600 dark:text-blue-500">
            {SITE_NAME.split(" ").slice(1).join(" ")}
          </span>
        </Link>
        <nav className="flex-1 flex items-center gap-1 overflow-x-auto">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="px-2.5 py-1.5 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 whitespace-nowrap transition-colors"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <ThemeSwitcher />
      </div>
    </header>
  );
}
