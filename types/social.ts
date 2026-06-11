export type Platform = "IG" | "Threads" | "TikTok" | "YouTube Shorts";
export type ContentType = "文章" | "圖片" | "影片" | "限動";
export type ContentLabel = "爆款" | "潛力" | "普通" | "低效";

export interface ContentRecord {
  id: string;
  platform: Platform;
  account: string;
  publishedAt: string;
  contentType: ContentType;
  topic: string;
  originalCopy: string;
  imageTitle: string;
  videoOpening: string;
  cta: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  dms: number;
  clicks: number;
  notes: string;
  createdAt: string;
}

export interface ScoredRecord extends ContentRecord {
  score: number;
  label: ContentLabel;
}

export interface RankingRow {
  name: string;
  score: number;
  count: number;
  avgScore: number;
}

export interface GeneratedPack {
  threadsCopies: string[];
  igStories: string[];
  imageTitles: string[];
  videoOpenings: string[];
  ctas: string[];
}

export interface AnalysisResult {
  totalRecords: number;
  totalViews: number;
  totalEngagements: number;
  totalDms: number;
  totalClicks: number;
  averageScore: number;
  scored: ScoredRecord[];
  highRecords: ScoredRecord[];
  lowRecords: ScoredRecord[];
  platformRanking: RankingRow[];
  accountRanking: RankingRow[];
  topicRanking: RankingRow[];
  typeRanking: RankingRow[];
  ctaRanking: RankingRow[];
  keywordRanking: RankingRow[];
  bestPostHour: RankingRow | null;
  highFeatures: string[];
  lowProblems: string[];
  nextDirections: string[];
  generated: GeneratedPack;
}
