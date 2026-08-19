'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
  "Administracja i samorząd",
  "Wymiar sprawiedliwości i sądy",
  "Polityka społeczna i rodzina",
  "Budżet i finanse publiczne",
  "Gospodarka i przedsiębiorczość",
  "Podatki i system fiskalny",
  "Praca i rynek pracy",
  "Cyfryzacja i nowe technologie",
  "Energetyka i surowce",
  "Środowisko i klimat",
  "Zdrowie i system ochrony zdrowia",
  "Bezpieczeństwo wewnętrzne i policja",
  "Obrona i wojsko",
  "Transport i infrastruktura",
  "Mieszkalnictwo i planowanie przestrzenne",
  "Rolnictwo i obszary wiejskie",
  "Edukacja i nauka",
  "Kultura i media",
  "Prawa obywatelskie i wolności",
  "Prawo wyborcze i system polityczny",
  "Europa i polityka zagraniczna"
];

const TAGS = [
  "Prawa kobiet", "Prawa dziecka", "Prawa pracownicze", "Prawa mniejszości", "LGBT",
  "Rodzina i dzietność", "Kościół i religia", "Wolność słowa i mediów", "Inwigilacja i prywatność",
  "Legalizacja", "Patriotyzm", "Dekomunizacja", "Ulgi i przywileje podatkowe", "Podatki dla firm",
  "Podatki dla obywateli", "Deregulacja", "Państwowe spółki", "Centralizacja", "Samorządność",
  "Imigracja", "Bezpieczeństwo granic", "Unia Europejska", "Zielony Ład", "Fundusze UE",
  "Suwerenność", "Integracja UE", "Ukraina", "Rosja", "NATO", "Transformacja energetyczna",
  "Węgiel i górnictwo", "Energetyka jądrowa", "Ochrona przyrody", "Woda i susza", "Wieś i rolnicy",
  "Bezpieczeństwo żywnościowe", "Mieszkania i czynsze", "Samochody i drogi", "Kolej i transport publiczny",
  "Metropolie i rozwój miast", "Cyfrowe państwo", "Dane osobowe i RODO", "Sztuczna inteligencja",
  "Startupy i innowacje"
];

// Deduplicate Podatki dla obywateli just in case it's declared twice
const UNIQUE_TAGS = Array.from(new Set(TAGS));

interface Voting {
  id: string;
  title: string;
  topic: string | null;
  description: string | null;
  vote_date: string | null;
  druk_number: number | null;
  display_title: string | null;
  published: boolean;
  summary: string | null;
  pros: string[] | null;
  cons: string[] | null;
  categories: string[] | null;
  tags: string[] | null;
}

interface RowState {
  display_title: string;
  summary: string;
  pros: string[];
  cons: string[];
  categories: string[];
  tags: string[];
}

interface Props {
  votings: Voting[];
  total: number;
  filter: string;
  page: number;
  pageSize: number;
}

function parseAIResponse(text: string, votings: Voting[]): Map<string, RowState> {
  const map = new Map<string, RowState>();
  try {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : text;
    const parsed = JSON.parse(jsonStr);
    
    if (parsed.answers && Array.isArray(parsed.answers)) {
      for (const item of parsed.answers) {
         const voting = votings.find(v => v.id.toLowerCase().startsWith(String(item.id).toLowerCase()));
         if (voting) {
            map.set(voting.id, {
               display_title: item.title || '',
               summary: item.summary || '',
               pros: Array.isArray(item.pros) ? item.pros : [],
               cons: Array.isArray(item.cons) ? item.cons : [],
               categories: Array.isArray(item.categories) ? item.categories : [],
               tags: Array.isArray(item.tags) ? item.tags : [],
            });
         }
      }
    }
  } catch (e) {
    console.error("Failed to parse AI response as JSON", e);
  }
  return map;
}

function buildAIPrompt(targets: Voting[]): string {
  const lines = targets.map(v => {
    const parts = [];
    parts.push(`Tytuł oryg.: "${v.title}"`);
    if (v.topic) parts.push(`Temat: "${v.topic}"`);
    if (v.description && v.description !== v.title)
      parts.push(`Opis: "${v.description.slice(0, 200)}"`);
    if (v.druk_number)
      parts.push(`Druk: https://www.sejm.gov.pl/Sejm10.nsf/druk.xsp?nr=${v.druk_number}`);
    const content = parts.join('\n  ');
    return `[${v.id.slice(0, 8)}]\n  ${content}`;
  });

  return `Przeanalizuj poniższe głosowania sejmowe i dla każdego wygeneruj:
1. Tytuł: KRÓTKI, NEUTRALNY tytuł (18-24 słów). Ma być zrozumiały dla zwykłego obywatela (bez żargonu i skrótów). Tytuł musi obiektywnie wyjaśniać czego dotyczy głosowanie.
2. Streszczenie: Neutralne podsumowanie głosowania (ok. 60 słów).
3. Za: 2-3 krótkie argumenty (bullet points) przemawiające ZA ustawą/uchwałą (najlepiej cytowane merytoryczne powody).
4. Przeciw: 2-3 krótkie argumenty (bullet points) przemawiające PRZECIW.
5. Kategorie: Wybierz 2 do 3 kategorii z listy ZAMKNIĘTEJ:
   ${CATEGORIES.join(", ")}
6. Tagi: Wybierz 3 do 7 tagów z listy ZAMKNIĘTEJ:
   ${UNIQUE_TAGS.join(", ")}

WAŻNE: Zwróć wynik TYLKO jako poprawny obiekt JSON. Nie dopisuj żadnego dodatkowego tekstu, wyjaśnień ani źródeł (np. "[businessinsider.com](...)"). Wybieraj KATEGORIE i TAGI DOKŁADNIE TAK JAK NA LIŚCIE ZAMKNIĘTEJ, bez literówek.

Format:
{
  "answers": [
    {
      "id": "1f324c73",
      "title": "...",
      "summary": "...",
      "pros": ["...", "..."],
      "cons": ["...", "..."],
      "categories": ["...", "..."],
      "tags": ["...", "..."]
    }
  ]
}

Oto głosowania do analizy:
${lines.join('\n\n')}`;
}

function adminUrl(filter: string, page: number): string {
  return `/admin?${new URLSearchParams({ filter, page: String(page) }).toString()}`;
}

function getInitialRowState(v: Voting): RowState {
  return {
    display_title: v.display_title || '',
    summary: v.summary || '',
    pros: v.pros?.length ? v.pros : [''],
    cons: v.cons?.length ? v.cons : [''],
    categories: v.categories?.length ? v.categories : [],
    tags: v.tags?.length ? v.tags : []
  };
}

export default function VotingCurationTable({ votings, total, filter, page, pageSize }: Props) {
  const router = useRouter();

  const [edits, setEdits] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(votings.map(v => [v.id, getInitialRowState(v)]))
  );
  
  const [committedData, setCommittedData] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(votings.map(v => [v.id, getInitialRowState(v)]))
  );
  
  const [publishedState, setPublishedState] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(votings.map(v => [v.id, v.published]))
  );

  useEffect(() => {
    setEdits(prev => {
      const next = { ...prev };
      votings.forEach(v => {
        if (!next[v.id]) next[v.id] = getInitialRowState(v);
        if (v.display_title && !next[v.id].display_title) next[v.id].display_title = v.display_title;
        if (v.summary && !next[v.id].summary) next[v.id].summary = v.summary;
      });
      return next;
    });
    setCommittedData(prev => {
      const next = { ...prev };
      votings.forEach(v => { next[v.id] = getInitialRowState(v); });
      return next;
    });
    setPublishedState(prev => {
      const next = { ...prev };
      votings.forEach(v => { next[v.id] = v.published; });
      return next;
    });
  }, [votings]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [savedRows, setSavedRows] = useState<Set<string>>(new Set());
  const [togglingPublish, setTogglingPublish] = useState<Set<string>>(new Set());

  const [showImport, setShowImport] = useState(false);
  const [pasteValue, setPasteValue] = useState('');
  const [parsedData, setParsedData] = useState<Map<string, RowState>>(new Map());

  const [copied, setCopied] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [publishingSelected, setPublishingSelected] = useState(false);

  const allSelected = selected.size === votings.length && votings.length > 0;
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(votings.map(v => v.id)));
  const toggleOne = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const copyForAI = async () => {
    const targets = selected.size > 0
      ? votings.filter(v => selected.has(v.id))
      : votings;
    await navigator.clipboard.writeText(buildAIPrompt(targets));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePasteChange = (text: string) => {
    setPasteValue(text);
    setParsedData(text.trim() ? parseAIResponse(text, votings) : new Map());
  };

  const applyParsed = () => {
    setEdits(prev => {
      const next = { ...prev };
      parsedData.forEach((data, id) => {
        next[id] = {
           display_title: data.display_title || next[id]?.display_title || '',
           summary: data.summary || next[id]?.summary || '',
           pros: data.pros?.length ? data.pros : (next[id]?.pros || ['']),
           cons: data.cons?.length ? data.cons : (next[id]?.cons || ['']),
           categories: data.categories?.length ? data.categories : (next[id]?.categories || []),
           tags: data.tags?.length ? data.tags : (next[id]?.tags || [])
        };
      });
      return next;
    });
    setPasteValue('');
    setParsedData(new Map());
    setShowImport(false);
  };

  const flashSaved = (ids: string[]) => {
    setSavedRows(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      return next;
    });
    setTimeout(() => setSavedRows(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    }), 2000);
  };

  const apiPatch = async (updates: Array<{
     id: string; display_title?: string; summary?: string; pros?: string[]; cons?: string[]; categories?: string[]; tags?: string[]; published?: boolean; 
  }>) => {
    const res = await fetch('/api/admin/votings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    });
    return res.ok;
  };

  const isRowChanged = (id: string) => {
    const edit = edits[id];
    const committed = committedData[id];
    if (!edit || !committed) return false;
    
    return edit.display_title !== committed.display_title ||
           edit.summary !== committed.summary ||
           JSON.stringify(edit.pros) !== JSON.stringify(committed.pros) ||
           JSON.stringify(edit.cons) !== JSON.stringify(committed.cons) ||
           JSON.stringify(edit.categories) !== JSON.stringify(committed.categories) ||
           JSON.stringify(edit.tags) !== JSON.stringify(committed.tags);
  };

  const saveRow = async (id: string) => {
    const edit = edits[id];
    if (!edit) return;
    
    setSaving(prev => new Set(prev).add(id));
    try {
      const payload = {
         id,
         display_title: edit.display_title,
         summary: edit.summary,
         pros: edit.pros,
         cons: edit.cons,
         categories: edit.categories,
         tags: edit.tags
      };
      
      const ok = await apiPatch([payload]);
      if (ok) {
        flashSaved([id]);
        setCommittedData(prev => ({ ...prev, [id]: { ...edit } }));
      }
    } finally {
      setSaving(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const saveAll = async () => {
    const updates = votings
      .filter(v => isRowChanged(v.id) && edits[v.id]?.display_title.trim())
      .map(v => ({
         id: v.id,
         display_title: edits[v.id].display_title.trim(),
         summary: edits[v.id].summary.trim(),
         pros: edits[v.id].pros,
         cons: edits[v.id].cons,
         categories: edits[v.id].categories,
         tags: edits[v.id].tags
      }));
      
    if (!updates.length) return;
    setSavingAll(true);
    try {
      const ok = await apiPatch(updates);
      if (ok) {
        flashSaved(updates.map(u => u.id));
        setCommittedData(prev => {
          const next = { ...prev };
          updates.forEach(u => { next[u.id] = { ...edits[u.id] }; });
          return next;
        });
        router.refresh();
      }
    } finally {
      setSavingAll(false);
    }
  };

  const togglePublish = async (id: string) => {
    const current = publishedState[id];
    const next = !current;
    setPublishedState(prev => ({ ...prev, [id]: next }));
    setTogglingPublish(prev => new Set(prev).add(id));
    try {
      const ok = await apiPatch([{ id, published: next }]);
      if (!ok) {
        setPublishedState(prev => ({ ...prev, [id]: current }));
      } else {
        router.refresh();
      }
    } finally {
      setTogglingPublish(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const publishSelected = async (publish: boolean) => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    setPublishingSelected(true);
    setPublishedState(prev => {
      const next = { ...prev };
      ids.forEach(id => { next[id] = publish; });
      return next;
    });
    try {
      await apiPatch(ids.map(id => ({ id, published: publish })));
      router.push(adminUrl(filter, 1));
    } finally {
      setPublishingSelected(false);
      setSelected(new Set());
    }
  };

  const editedCount = votings.filter(v => isRowChanged(v.id)).length;
  const totalPages = Math.ceil(total / pageSize);
  const targetLabel = selected.size > 0 ? `(${selected.size})` : `(${votings.length})`;

  return (
    <div className="space-y-5">
      {/* Filter tabs + count */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1">
          {[
            { key: 'needs',     label: '⏳ Unpublished' },
            { key: 'done',      label: '✅ Has title' },
            { key: 'published', label: '🟢 Published' },
            { key: 'all',       label: 'All' },
          ].map(tab => (
            <a
              key={tab.key}
              href={adminUrl(tab.key, 1)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </a>
          ))}
        </div>
        <span className="text-sm text-zinc-400">{total} votings</span>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={copyForAI}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {copied ? '✓ Copied!' : `📋 Copy for AI ${targetLabel}`}
        </button>

        <button
          onClick={() => setShowImport(v => !v)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
            showImport
              ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
              : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
          }`}
        >
          ⬇ Paste AI JSON
        </button>

        {selected.size > 0 && (
          <>
            <button
              onClick={() => publishSelected(true)}
              disabled={publishingSelected}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              🟢 Publish ({selected.size})
            </button>
            <button
              onClick={() => publishSelected(false)}
              disabled={publishingSelected}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 text-sm font-semibold rounded-xl transition-colors"
            >
              ⚫ Unpublish ({selected.size})
            </button>
          </>
        )}

        {editedCount > 0 && (
          <button
            onClick={saveAll}
            disabled={savingAll}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors ml-auto"
          >
            {savingAll ? 'Saving...' : `Save all (${editedCount})`}
          </button>
        )}
      </div>

      {/* Import panel */}
      {showImport && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Paste AI JSON response</h3>
            <p className="text-xs text-zinc-500">
              Paste the full JSON object generated by the AI prompt.
            </p>
          </div>

          <textarea
            value={pasteValue}
            onChange={e => handlePasteChange(e.target.value)}
            placeholder={'{\n  "answers": [\n    {\n      "id": "1f324c73",\n      "title": "Tytuł...",\n      "summary": "Streszczenie...",\n      "pros": ["Zapobiega X", "Zwiększa Y"],\n      "cons": ["Kosztowne Z"]\n    }\n  ]\n}'}
            rows={10}
            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-mono text-zinc-900 dark:text-zinc-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {parsedData.size > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                ✓ {parsedData.size} record{parsedData.size > 1 ? 's' : ''} parsed from JSON
              </p>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {Array.from(parsedData.entries()).map(([id, data]) => {
                  const voting = votings.find(v => v.id === id);
                  return (
                    <div key={id} className="flex gap-2 items-start text-xs border-b border-zinc-100 dark:border-zinc-800 pb-1">
                      <span className="font-mono text-zinc-400 shrink-0">{id.slice(0, 8)}</span>
                      <div className="flex flex-col gap-0.5 w-full overflow-hidden">
                         <span className="text-zinc-400 truncate w-full hidden sm:block">Orig: {voting?.title}</span>
                         <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate w-full">New: {data.display_title || '(no title)'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={applyParsed}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Apply {parsedData.size} updates → review &amp; save
              </button>
            </div>
          )}

          {pasteValue.trim() && parsedData.size === 0 && (
            <p className="text-xs text-red-500">
              No matching records found or JSON is invalid. Ensure the AI returned correctly formatted JSON.
            </p>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden overflow-x-auto">
        <div className="min-w-[1200px]">
          {/* Column headers */}
          <div className="grid grid-cols-[32px_minmax(180px,1fr)_minmax(200px,1.2fr)_minmax(200px,1.2fr)_minmax(200px,1.5fr)_100px] gap-4 px-5 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="mt-0.5 accent-blue-600"
            />
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Raw Sejm data</span>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Display title</span>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Streszczenie</span>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Za / Przeciw</span>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider text-center">Save/Publish</span>
          </div>

          {votings.length === 0 && (
            <div className="px-5 py-16 text-center text-zinc-400 text-sm">
              {filter === 'needs' ? '🎉 All votings are published!' : 'No votings found.'}
            </div>
          )}

          {votings.map(v => {
            const edit        = edits[v.id] || getInitialRowState(v);
            const isSaving    = saving.has(v.id);
            const isSaved     = savedRows.has(v.id);
            const isToggling  = togglingPublish.has(v.id);
            const isPublished = publishedState[v.id] ?? v.published;
            const hasEdit     = edit.display_title.trim().length > 0;
            const isChanged   = isRowChanged(v.id);
            const wordCount   = edit.summary.trim().split(/\s+/).filter(Boolean).length;

            return (
              <div key={v.id} className={`flex flex-col border-b border-zinc-100 dark:border-zinc-800 transition-colors ${
                  selected.has(v.id) ? 'bg-blue-50/40 dark:bg-blue-950/20' : 'hover:bg-zinc-50/60 dark:hover:bg-zinc-800/20'
                }`}>
                
                {/* Top standard row columns */}
                <div className="grid grid-cols-[32px_minmax(180px,1fr)_minmax(200px,1.2fr)_minmax(200px,1.2fr)_minmax(200px,1.5fr)_100px] gap-4 px-5 pt-6 pb-4 items-start">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selected.has(v.id)}
                    onChange={() => toggleOne(v.id)}
                    className="mt-1 accent-blue-600"
                  />

                  {/* Raw data */}
                  <div className="space-y-1.5 min-w-0 pr-2">
                    <div>
                      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-0.5">Title</p>
                      <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-3" title={v.title}>
                        {v.title}
                      </p>
                    </div>
                    {v.topic && (
                      <div>
                        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-0.5">Topic</p>
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-2" title={v.topic}>
                          {v.topic}
                        </p>
                      </div>
                    )}
                    {v.description && v.description !== v.title && (
                      <div>
                        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-0.5">Description</p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-500 leading-relaxed line-clamp-3" title={v.description}>
                          {v.description}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                      {v.vote_date && (
                        <span className="text-[10px] text-zinc-400 font-medium">
                          {new Date(v.vote_date).toLocaleDateString('pl-PL')}
                        </span>
                      )}
                      {v.druk_number && (
                        <a
                          href={`https://www.sejm.gov.pl/Sejm10.nsf/druk.xsp?nr=${v.druk_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-blue-500 hover:underline font-medium"
                        >
                          Druk {v.druk_number} ↗
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Display Title */}
                  <div className="flex flex-col h-full w-full">
                    <textarea
                      value={edit.display_title}
                      onChange={e => setEdits(prev => ({ ...prev, [v.id]: { ...prev[v.id], display_title: e.target.value } }))}
                      placeholder="Short, clear title..."
                      maxLength={300}
                      className={`w-full h-full min-h-[140px] bg-white dark:bg-zinc-800 border rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none ${
                        isChanged ? 'border-blue-300 dark:border-blue-700' : 'border-zinc-200 dark:border-zinc-700'
                      }`}
                    />
                  </div>

                  {/* Streszczenie */}
                  <div className="flex flex-col h-full w-full">
                    <div className="w-full h-full relative">
                      <textarea
                        value={edit.summary}
                        onChange={e => setEdits(prev => ({ ...prev, [v.id]: { ...prev[v.id], summary: e.target.value } }))}
                        placeholder="Neutralne streszczenie (~60 słów)..."
                        className={`w-full h-full min-h-[140px] bg-white dark:bg-zinc-800 border rounded-xl px-3 py-2 pb-6 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors resize-none ${
                          isChanged ? 'border-purple-300 dark:border-purple-700' : 'border-zinc-200 dark:border-zinc-700'
                        }`}
                      />
                      <div className={`absolute bottom-2 right-2 text-[10px] font-medium px-1 bg-white dark:bg-zinc-800 ${
                        wordCount > 80 ? 'text-red-500' : wordCount > 50 ? 'text-orange-500' : 'text-zinc-400'
                      }`}>
                        {wordCount}/60 word
                      </div>
                    </div>
                  </div>

                  {/* Za / Przeciw */}
                  <div className="flex flex-col gap-3 h-full overflow-hidden w-full">
                    {/* Za */}
                    <div className="flex-1 min-h-[60px] flex flex-col">
                      <label className="text-[10px] font-semibold text-green-600 dark:text-green-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                        <span>👍 Za</span>
                        <button onClick={() => setEdits(prev => ({ ...prev, [v.id]: { ...prev[v.id], pros: [...prev[v.id].pros, ''] } }))} className="text-[16px] leading-none hover:text-green-700">+</button>
                      </label>
                      <div className="overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                        {edit.pros.map((p, i) => (
                          <div key={i} className="flex gap-1 items-start">
                            <input
                              type="text"
                              value={p}
                              onChange={e => setEdits(prev => {
                                const arr = [...prev[v.id].pros];
                                arr[i] = e.target.value;
                                return { ...prev, [v.id]: { ...prev[v.id], pros: arr }};
                              })}
                              placeholder="Argument za..."
                              className="flex-1 min-w-0 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                            {edit.pros.length > 1 && (
                              <button
                                onClick={() => setEdits(prev => {
                                  const arr = prev[v.id].pros.filter((_, idx) => idx !== i);
                                  return { ...prev, [v.id]: { ...prev[v.id], pros: arr }};
                                })}
                                className="text-zinc-400 hover:text-red-500 text-xs shrink-0 px-1 py-1"
                              >✕</button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Przeciw */}
                    <div className="flex-1 min-h-[60px] flex flex-col border-t border-zinc-100 dark:border-zinc-800 pt-2">
                      <label className="text-[10px] font-semibold text-red-600 dark:text-red-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                        <span>👎 Przeciw</span>
                        <button onClick={() => setEdits(prev => ({ ...prev, [v.id]: { ...prev[v.id], cons: [...prev[v.id].cons, ''] } }))} className="text-[16px] leading-none hover:text-red-700">+</button>
                      </label>
                      <div className="overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                        {edit.cons.map((c, i) => (
                          <div key={i} className="flex gap-1 items-start">
                            <input
                              type="text"
                              value={c}
                              onChange={e => setEdits(prev => {
                                const arr = [...prev[v.id].cons];
                                arr[i] = e.target.value;
                                return { ...prev, [v.id]: { ...prev[v.id], cons: arr }};
                              })}
                              placeholder="Argument przeciw..."
                              className="flex-1 min-w-0 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-red-500"
                            />
                            {edit.cons.length > 1 && (
                              <button
                                onClick={() => setEdits(prev => {
                                  const arr = prev[v.id].cons.filter((_, idx) => idx !== i);
                                  return { ...prev, [v.id]: { ...prev[v.id], cons: arr }};
                                })}
                                className="text-zinc-400 hover:text-red-500 text-xs shrink-0 px-1 py-1"
                              >✕</button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Save and Publish buttons */}
                  <div className="flex flex-col gap-2 h-full justify-start">
                    <button
                      onClick={() => saveRow(v.id)}
                      disabled={!hasEdit || isSaving || !isChanged}
                      className={`w-full px-3 py-2 rounded-xl text-sm font-semibold transition-all flex justify-center items-center h-10 ${
                        isSaved
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : hasEdit && isChanged
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
                      }`}
                    >
                      {isSaving ? <span className="animate-pulse">···</span> : isSaved ? '✓ Saved' : '💾 Save'}
                    </button>

                    <button
                      onClick={() => togglePublish(v.id)}
                      disabled={isToggling}
                      className={`w-full px-3 py-2 rounded-xl text-sm font-semibold transition-all flex justify-center items-center h-10 ${
                        isToggling
                          ? 'opacity-50 cursor-wait bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                          : isPublished
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600'
                      }`}
                    >
                      {isToggling ? <span className="animate-pulse">···</span> : isPublished ? '🟢 Published' : '⚫ Publish'}
                    </button>
                  </div>
                </div>
                
                {/* Bottom Full Width Category / Tags Section */}
                <div className="pl-14 pr-32 pb-6 flex flex-col gap-4 bg-zinc-50/30 dark:bg-zinc-800/20">
                  <div className="border-t border-dashed border-zinc-200 dark:border-zinc-700 pt-4 grid grid-cols-2 gap-8">
                     
                     {/* Kategorie */}
                     <div>
                       <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block text-blue-600 dark:text-blue-400">
                         Kategorie ({edit.categories.length})
                       </label>
                       <div className="flex flex-wrap gap-1.5 mb-2">
                         {edit.categories.map(c => (
                            <span key={c} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 shadow-sm">
                              {c}
                              <button 
                                onClick={() => setEdits(prev => ({ ...prev, [v.id]: { ...prev[v.id], categories: prev[v.id].categories.filter(x => x !== c) } }))}
                                className="hover:text-red-500 ml-0.5"
                                title="Remove category"
                              >✕</button>
                            </span>
                         ))}
                       </div>
                       <select
                         value=""
                         onChange={(e) => {
                           const val = e.target.value;
                           if (val && !edit.categories.includes(val)) {
                             setEdits(prev => ({ ...prev, [v.id]: { ...prev[v.id], categories: [...prev[v.id].categories, val] } }));
                           }
                         }}
                         className="text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 w-full max-w-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-600 dark:text-zinc-300 shadow-sm cursor-pointer"
                       >
                         <option value="" disabled>+ Dodaj kategorię...</option>
                         {CATEGORIES.filter(c => !edit.categories.includes(c)).map(c => (
                           <option key={c} value={c}>{c}</option>
                         ))}
                       </select>
                     </div>

                     {/* Tagi */}
                     <div>
                       <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 block text-purple-600 dark:text-purple-400">
                         Tagi ({edit.tags.length})
                       </label>
                       <div className="flex flex-wrap gap-1.5 mb-2">
                         {edit.tags.map(t => (
                            <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 shadow-sm">
                              {t}
                              <button 
                                onClick={() => setEdits(prev => ({ ...prev, [v.id]: { ...prev[v.id], tags: prev[v.id].tags.filter(x => x !== t) } }))}
                                className="hover:text-red-500 ml-0.5"
                                title="Remove tag"
                              >✕</button>
                            </span>
                         ))}
                       </div>
                       <select
                         value=""
                         onChange={(e) => {
                           const val = e.target.value;
                           if (val && !edit.tags.includes(val)) {
                             setEdits(prev => ({ ...prev, [v.id]: { ...prev[v.id], tags: [...prev[v.id].tags, val] } }));
                           }
                         }}
                         className="text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 w-full max-w-xs focus:outline-none focus:ring-1 focus:ring-purple-500 text-zinc-600 dark:text-zinc-300 shadow-sm cursor-pointer"
                       >
                         <option value="" disabled>+ Dodaj tag...</option>
                         {UNIQUE_TAGS.filter(t => !edit.tags.includes(t)).map(t => (
                           <option key={t} value={t}>{t}</option>
                         ))}
                       </select>
                     </div>

                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          {page > 1 && (
            <a
              href={adminUrl(filter, page - 1)}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-sm text-zinc-600 dark:text-zinc-400 transition-colors"
            >
              ← Prev
            </a>
          )}
          <span className="text-sm text-zinc-500">
            Page {page} of {totalPages} &nbsp;·&nbsp; {total} total
          </span>
          {page < totalPages && (
            <a
              href={adminUrl(filter, page + 1)}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-sm text-zinc-600 dark:text-zinc-400 transition-colors"
            >
              Next →
            </a>
          )}
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; }
      `}} />
    </div>
  );
}
