/** Horizontal YES / NO / ABSTAIN / ABSENT bar. Pure CSS, no client JS. */
export default function ResultBar({
  yes,
  no,
  abstain,
  absent,
  height = "h-2",
}: {
  yes: number;
  no: number;
  abstain: number;
  absent: number;
  height?: string;
}) {
  const total = yes + no + abstain + absent || 1;
  const pct = (n: number) => `${(n / total) * 100}%`;
  return (
    <div className={`flex ${height} rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800`}>
      <div style={{ width: pct(yes) }} className="bg-green-500" title={`Za: ${yes}`} />
      <div style={{ width: pct(no) }} className="bg-red-500" title={`Przeciw: ${no}`} />
      <div style={{ width: pct(abstain) }} className="bg-amber-400" title={`Wstrzymało się: ${abstain}`} />
      <div style={{ width: pct(absent) }} className="bg-zinc-300 dark:bg-zinc-700" title={`Nieobecni: ${absent}`} />
    </div>
  );
}
