"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  BarChart3,
  Copy,
  Download,
  Flame,
  Lightbulb,
  MessageCircle,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2
} from "lucide-react";
import { analyzeRecords } from "@/lib/analyze";
import { sanitizeText } from "@/lib/safety";
import { clearRecords, loadRecords, saveRecords } from "@/lib/storage";
import type { ContentRecord, ContentType, GeneratedPack, Platform } from "@/types/social";

const platforms: Platform[] = ["IG", "Threads", "TikTok", "YouTube Shorts"];
const contentTypes: ContentType[] = ["文章", "圖片", "影片", "限動"];

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function newRecord(): ContentRecord {
  return {
    id: createId(),
    platform: "Threads",
    account: "體育情報站",
    publishedAt: new Date().toISOString().slice(0, 16),
    contentType: "文章",
    topic: "免費直播",
    originalCopy: "",
    imageTitle: "",
    videoOpening: "",
    cta: "留言一起聊",
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    dms: 0,
    clicks: 0,
    notes: "",
    createdAt: new Date().toISOString()
  };
}

const demoRecords: ContentRecord[] = [
  {
    ...newRecord(),
    id: "demo-1",
    platform: "Threads",
    contentType: "文章",
    topic: "球迷討論",
    originalCopy: "今晚這場留言區應該會很熱。你覺得關鍵會在球星手感，還是最後兩分鐘的節奏？免費看球入口整理在主頁。",
    imageTitle: "球迷留言區準備開會",
    videoOpening: "今晚這場先看最後兩分鐘。",
    cta: "留言你站哪邊",
    views: 9400,
    likes: 830,
    comments: 188,
    shares: 146,
    saves: 120,
    dms: 58,
    clicks: 230,
    notes: "留言與分享明顯高，適合延伸成限動投票。"
  },
  {
    ...newRecord(),
    id: "demo-2",
    platform: "IG",
    contentType: "圖片",
    topic: "免費直播",
    originalCopy: "賽前重點已整理，想邊看邊聊的球迷，主頁連結見。",
    imageTitle: "免費看球入口已整理",
    videoOpening: "",
    cta: "主頁連結看入口",
    views: 7200,
    likes: 520,
    comments: 64,
    shares: 90,
    saves: 180,
    dms: 34,
    clicks: 410,
    notes: "收藏與點擊高，圖片標題清楚。"
  },
  {
    ...newRecord(),
    id: "demo-3",
    platform: "TikTok",
    contentType: "影片",
    topic: "賽事分析",
    originalCopy: "這場別只看比分，真正的看點在轉換節奏。",
    imageTitle: "這場節奏會很快",
    videoOpening: "這場不要只看比分。",
    cta: "加入官方帳號",
    views: 5100,
    likes: 180,
    comments: 18,
    shares: 21,
    saves: 28,
    dms: 5,
    clicks: 44,
    notes: "互動偏低，開頭可以更直接丟問題。"
  }
];

export default function Home() {
  const [records, setRecords] = useState<ContentRecord[]>([]);
  const [draft, setDraft] = useState<ContentRecord>(newRecord());
  const [copied, setCopied] = useState("");

  useEffect(() => {
    setRecords(loadRecords());
  }, []);

  useEffect(() => {
    saveRecords(records);
  }, [records]);

  const analysis = useMemo(() => analyzeRecords(records), [records]);

  function addRecord() {
    const clean = sanitizeRecord(draft);
    setRecords((items) => [clean, ...items]);
    setDraft(newRecord());
  }

  function deleteRecord(id: string) {
    setRecords((items) => items.filter((item) => item.id !== id));
  }

  function clearAll() {
    clearRecords();
    setRecords([]);
    setDraft(newRecord());
  }

  function loadDemo() {
    setRecords(demoRecords);
  }

  function exportCsv() {
    const rows = [
      ["平台", "帳號", "發文日期", "內容類型", "主題", "原始文案", "圖片標題", "影片開頭", "CTA", "瀏覽數", "點讚數", "留言數", "分享數", "收藏數", "私訊數", "點擊數", "分數", "分類", "備註"],
      ...analysis.scored.map((item) => [
        item.platform,
        item.account,
        item.publishedAt,
        item.contentType,
        item.topic,
        item.originalCopy,
        item.imageTitle,
        item.videoOpening,
        item.cta,
        item.views,
        item.likes,
        item.comments,
        item.shares,
        item.saves,
        item.dms,
        item.clicks,
        item.score,
        item.label,
        item.notes
      ])
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll("\"", "\"\"")}"`).join(",")).join("\n");
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `social-iteration-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function copyGenerated() {
    const text = packToText(analysis.generated);
    await navigator.clipboard.writeText(text);
    setCopied("已複製下一輪文案");
    setTimeout(() => setCopied(""), 1600);
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <header className="rounded-lg border border-gold/25 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-5 shadow-gold">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-gold px-3 py-1 text-sm font-bold text-black">
                <ShieldCheck size={16} />
                半自動本地版｜敏感詞自動替換
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-4xl">社群內容迭代系統</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                手動輸入每篇內容數據，系統自動計分、分類、分析高低效原因，並產出下一輪 Threads、IG 限動、圖片主標、影片前三秒與 CTA。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={loadDemo} icon={<RefreshCw size={18} />}>載入範例</Button>
              <Button onClick={exportCsv} icon={<Download size={18} />}>匯出 CSV</Button>
              <Button onClick={copyGenerated} icon={<Copy size={18} />} primary>複製下一輪文案</Button>
              <Button onClick={clearAll} icon={<Trash2 size={18} />}>清空</Button>
            </div>
          </div>
          {copied && <p className="mt-3 text-sm font-bold text-gold">{copied}</p>}
        </header>

        <section className="grid gap-3 md:grid-cols-5">
          <Metric title="內容筆數" value={analysis.totalRecords} />
          <Metric title="總瀏覽數" value={analysis.totalViews} />
          <Metric title="總互動數" value={analysis.totalEngagements} />
          <Metric title="總私訊數" value={analysis.totalDms} />
          <Metric title="平均分數" value={analysis.averageScore} />
        </section>

        <div className="grid gap-5 xl:grid-cols-[440px_1fr]">
          <Panel title="手動新增內容數據" icon={<Plus size={19} />}>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Select label="平台" value={draft.platform} options={platforms} onChange={(value) => setDraft({ ...draft, platform: value as Platform })} />
                <Input label="帳號" value={draft.account} onChange={(value) => setDraft({ ...draft, account: value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="發文日期" type="datetime-local" value={draft.publishedAt} onChange={(value) => setDraft({ ...draft, publishedAt: value })} />
                <Select label="內容類型" value={draft.contentType} options={contentTypes} onChange={(value) => setDraft({ ...draft, contentType: value as ContentType })} />
              </div>
              <Input label="主題" value={draft.topic} onChange={(value) => setDraft({ ...draft, topic: value })} placeholder="免費直播 / 賽事分析 / 球迷討論" />
              <Textarea label="原始文案" value={draft.originalCopy} onChange={(value) => setDraft({ ...draft, originalCopy: value })} />
              <Input label="圖片標題" value={draft.imageTitle} onChange={(value) => setDraft({ ...draft, imageTitle: value })} />
              <Input label="影片開頭" value={draft.videoOpening} onChange={(value) => setDraft({ ...draft, videoOpening: value })} />
              <Input label="CTA" value={draft.cta} onChange={(value) => setDraft({ ...draft, cta: value })} />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <NumberInput label="瀏覽數" value={draft.views} onChange={(value) => setDraft({ ...draft, views: value })} />
                <NumberInput label="點讚數" value={draft.likes} onChange={(value) => setDraft({ ...draft, likes: value })} />
                <NumberInput label="留言數" value={draft.comments} onChange={(value) => setDraft({ ...draft, comments: value })} />
                <NumberInput label="分享數" value={draft.shares} onChange={(value) => setDraft({ ...draft, shares: value })} />
                <NumberInput label="收藏數" value={draft.saves} onChange={(value) => setDraft({ ...draft, saves: value })} />
                <NumberInput label="私訊數" value={draft.dms} onChange={(value) => setDraft({ ...draft, dms: value })} />
                <NumberInput label="點擊數" value={draft.clicks} onChange={(value) => setDraft({ ...draft, clicks: value })} />
              </div>
              <Textarea label="備註" value={draft.notes} onChange={(value) => setDraft({ ...draft, notes: value })} />
              <Button onClick={addRecord} icon={<Plus size={18} />} primary>新增並計分</Button>
            </div>
          </Panel>

          <section className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <RankPanel title="平台成效" rows={analysis.platformRanking} />
              <RankPanel title="主題成效" rows={analysis.topicRanking} />
              <RankPanel title="內容類型成效" rows={analysis.typeRanking} />
              <RankPanel title="CTA 成效" rows={analysis.ctaRanking} />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Panel title="高分內容共同特徵" icon={<Flame size={19} />}>
                <BulletList items={analysis.highFeatures} />
              </Panel>
              <Panel title="低分內容問題" icon={<Lightbulb size={19} />}>
                <BulletList items={analysis.lowProblems} />
              </Panel>
            </div>

            <Panel title="下一輪內容方向" icon={<Sparkles size={19} />}>
              <BulletList items={analysis.nextDirections} />
            </Panel>

            <Panel title="下一輪素材產出" icon={<MessageCircle size={19} />}>
              <div className="mb-4 flex flex-wrap gap-2">
                <Button onClick={copyGenerated} icon={<Copy size={18} />} primary>全部複製</Button>
              </div>
              <GeneratedSection title="Threads 文案" items={analysis.generated.threadsCopies} />
              <GeneratedSection title="IG 限動文案" items={analysis.generated.igStories} />
              <GeneratedSection title="圖片主標" items={analysis.generated.imageTitles} />
              <GeneratedSection title="影片前三秒開頭" items={analysis.generated.videoOpenings} />
              <GeneratedSection title="CTA" items={analysis.generated.ctas} />
            </Panel>

            <Panel title="內容資料表" icon={<BarChart3 size={19} />}>
              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full text-left text-sm">
                  <thead className="text-xs uppercase text-muted">
                    <tr>
                      <th className="py-2 pr-3">分類</th>
                      <th className="py-2 pr-3">分數</th>
                      <th className="py-2 pr-3">平台</th>
                      <th className="py-2 pr-3">帳號</th>
                      <th className="py-2 pr-3">主題</th>
                      <th className="py-2 pr-3">類型</th>
                      <th className="py-2 pr-3">CTA</th>
                      <th className="py-2 pr-3">瀏覽</th>
                      <th className="py-2 pr-3">互動</th>
                      <th className="py-2 pr-3">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.scored.map((record) => (
                      <tr key={record.id} className="border-t border-white/10">
                        <td className="py-3 pr-3"><Badge label={record.label} /></td>
                        <td className="py-3 pr-3 font-bold text-gold">{record.score}</td>
                        <td className="py-3 pr-3">{record.platform}</td>
                        <td className="py-3 pr-3">{record.account}</td>
                        <td className="py-3 pr-3">{record.topic}</td>
                        <td className="py-3 pr-3">{record.contentType}</td>
                        <td className="py-3 pr-3">{record.cta}</td>
                        <td className="py-3 pr-3">{record.views.toLocaleString()}</td>
                        <td className="py-3 pr-3">{(record.likes + record.comments + record.shares + record.saves).toLocaleString()}</td>
                        <td className="py-3 pr-3">
                          <button className="text-muted hover:text-white" onClick={() => deleteRecord(record.id)} aria-label="刪除">
                            <Trash2 size={17} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {analysis.scored.length === 0 && <p className="py-6 text-center text-sm text-muted">尚無資料，請先手動新增內容數據。</p>}
              </div>
            </Panel>
          </section>
        </div>
      </div>
    </main>
  );
}

function sanitizeRecord(record: ContentRecord): ContentRecord {
  return {
    ...record,
    account: sanitizeText(record.account),
    topic: sanitizeText(record.topic),
    originalCopy: sanitizeText(record.originalCopy),
    imageTitle: sanitizeText(record.imageTitle),
    videoOpening: sanitizeText(record.videoOpening),
    cta: sanitizeText(record.cta),
    notes: sanitizeText(record.notes)
  };
}

function Metric({ title, value }: { title: string; value: number }) {
  return (
    <div className="metric-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      <p className="mt-2 text-3xl font-black text-white">{value.toLocaleString()}</p>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="section p-4">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-gold">{icon}</span>
        <h2 className="text-lg font-black text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Button({ children, onClick, icon, primary = false }: { children: ReactNode; onClick: () => void; icon?: ReactNode; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition ${
        primary ? "bg-gold text-black hover:bg-yellow-300" : "border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function Input({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return (
    <label>
      <span className="label">{label}</span>
      <input className="field" type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label>
      <span className="label">{label}</span>
      <input className="field" type="number" min="0" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="label">{label}</span>
      <textarea className="field min-h-24 resize-y" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="label">{label}</span>
      <select className="field" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function RankPanel({ title, rows }: { title: string; rows: { name: string; avgScore: number; count: number }[] }) {
  return (
    <Panel title={title} icon={<BarChart3 size={19} />}>
      <div className="space-y-3">
        {rows.length === 0 && <p className="text-sm text-muted">尚無資料</p>}
        {rows.slice(0, 6).map((row) => (
          <div key={row.name}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="font-bold text-white">{row.name}</span>
              <span className="text-gold">{row.avgScore.toLocaleString()} / 篇</span>
            </div>
            <div className="h-2 rounded-full bg-white/10">
              <div className="h-2 rounded-full bg-gold" style={{ width: `${Math.min(100, row.avgScore / 20)}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted">{row.count} 筆內容</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div key={item} className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-slate-200">
          <span>{item}</span>
          <CopyButton value={item} />
        </div>
      ))}
    </div>
  );
}

function GeneratedSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mb-5">
      <h3 className="mb-2 text-base font-black text-gold">{title}</h3>
      <div className="grid gap-2">
        {items.map((item, index) => (
          <div key={`${title}-${index}`} className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-200">{item}</p>
            <CopyButton value={item} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  const styles: Record<string, string> = {
    "爆款": "bg-gold text-black",
    "潛力": "bg-emerald-400 text-black",
    "普通": "bg-white/10 text-white",
    "低效": "bg-red-500/20 text-red-200"
  };
  return <span className={`rounded-full px-2 py-1 text-xs font-bold ${styles[label] ?? styles["普通"]}`}>{label}</span>;
}

function CopyButton({ value }: { value: string }) {
  return (
    <button onClick={() => navigator.clipboard.writeText(value)} className="rounded-lg border border-white/10 bg-white/[0.06] p-2 text-gold hover:bg-white/[0.12]" aria-label="複製">
      <Copy size={16} />
    </button>
  );
}

function packToText(pack: GeneratedPack) {
  const labels: Record<keyof GeneratedPack, string> = {
    threadsCopies: "Threads 文案",
    igStories: "IG 限動文案",
    imageTitles: "圖片主標",
    videoOpenings: "影片前三秒開頭",
    ctas: "CTA"
  };
  return Object.entries(pack)
    .map(([key, items]) => `## ${labels[key as keyof GeneratedPack]}\n${items.map((item, index) => `${index + 1}. ${item}`).join("\n\n")}`)
    .join("\n\n");
}
