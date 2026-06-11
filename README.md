# 半自動社群內容迭代系統

這是一個本地手動輸入版的社群內容迭代工具。

流程：

```text
手動輸入數據
  -> App 自動計分
  -> 找出高效內容
  -> 分析高分共同特徵與低分問題
  -> 產出下一輪文案 / 圖片主標 / 影片前三秒 / CTA
```

資料先存在 `localStorage`，不需要登入，不需要串 API。

## 啟動方式

```bash
npm install
npm run dev
```

開啟：

```text
http://localhost:3000
```

## 專案檔案結構

```text
social-iteration-dashboard/
  app/
    api/
      analyze/route.ts
      generate-next/route.ts
      import/
        google-sheet/route.ts
        meta/route.ts
        tiktok/route.ts
        youtube/route.ts
    globals.css
    layout.tsx
    page.tsx
  lib/
    analyze.ts
    generate.ts
    safety.ts
    scoring.ts
    storage.ts
  types/
    social.ts
  package.json
  tailwind.config.ts
  tsconfig.json
```

## 資料欄位

### content_records

| 欄位 | 說明 |
| --- | --- |
| id | 內容 ID |
| platform | 平台 |
| account | 帳號 |
| publishedAt | 發文日期 |
| contentType | 文章 / 圖片 / 影片 / 限動 |
| topic | 主題 |
| originalCopy | 原始文案 |
| imageTitle | 圖片標題 |
| videoOpening | 影片開頭 |
| cta | CTA |
| views | 瀏覽數 |
| likes | 點讚數 |
| comments | 留言數 |
| shares | 分享數 |
| saves | 收藏數 |
| dms | 私訊數 |
| clicks | 點擊數 |
| notes | 備註 |
| createdAt | 建立時間 |

## 分數公式

```text
內容分數 =
瀏覽數 * 0.2
+ 點讚數 * 1
+ 留言數 * 2
+ 分享數 * 3
+ 收藏數 * 3
+ 私訊數 * 5
+ 點擊數 * 4
```

分類規則：

- 1500 以上：爆款
- 650-1499：潛力
- 220-649：普通
- 219 以下：低效

## 系統功能

- 手動新增內容數據
- 自動計算內容分數
- 自動分類：爆款 / 潛力 / 普通 / 低效
- 分析高分內容共同特徵
- 分析低分內容問題
- 產出下一輪 Threads 文案
- 產出下一輪 IG 限動文案
- 產出下一輪圖片主標
- 產出下一輪影片前三秒開頭
- 產出下一輪 CTA
- 匯出 CSV
- 複製下一輪文案
- localStorage 本地保存

## 敏感詞替換

系統會將高風險字眼替換成安全說法，例如：

- 娛樂城 -> 體育平台
- 下注 -> 預測
- 賭博 -> 賽事討論
- 博弈 -> 觀賽互動
- 儲值 -> 加入
- 返水 -> 活動資訊
- 彩金 -> 活動名額
- 獎金 -> 活動名額
- 輸贏 -> 賽事結果
- 投注 -> 預測
- 盤口 -> 賽事資訊
- 賠率 -> 數據觀察

## 預留 API

目前先保留接口，不實際串接：

- `POST /api/import/google-sheet`
- `POST /api/import/meta`
- `POST /api/import/youtube`
- `POST /api/import/tiktok`
- `POST /api/analyze`
- `POST /api/generate-next`

`/api/analyze` 與 `/api/generate-next` 可接收：

```json
{
  "records": []
}
```

## 未來串接 n8n / Google Sheet / API

### n8n

1. 用 Cron 每天固定時間觸發。
2. 從 Google Sheet 或平台 API 抓取手動整理後的數據。
3. 整理成 `ContentRecord[]` 格式。
4. 呼叫 `/api/analyze` 取得分析結果。
5. 呼叫 `/api/generate-next` 取得下一輪素材。
6. 將結果寫回 Google Sheet 或推送到 LINE 通知。

### Google Sheets

建議建立一張表，每列對應一篇內容，欄位與 `content_records` 一致。

未來可用：

- n8n Google Sheets node
- Google Apps Script
- CSV 匯入

### 平台 API

未來可逐步串：

- Meta API：IG 貼文、Reels、Threads 成效
- YouTube API：Shorts 觀看、留言、互動
- TikTok API：短影音觀看、按讚、留言、分享、收藏

第一階段先用本地手動輸入，等欄位與分析邏輯穩定後再接 API。
