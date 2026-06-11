export interface FanSignalResult {
  tags: string[];
  angle: string;
  taiwanHook: string;
}

const playerSignals = [
  "Shohei Ohtani",
  "Ohtani",
  "大谷翔平",
  "LeBron",
  "LeBron James",
  "James",
  "Stephen Curry",
  "Curry",
  "Kevin Durant",
  "Durant",
  "Luka Doncic",
  "Doncic",
  "Nikola Jokic",
  "Jokic",
  "Giannis",
  "Messi",
  "Ronaldo",
  "Mbappe",
  "Neymar",
  "Yamamoto",
  "Yoshinobu Yamamoto",
  "Sasaki",
  "Roki Sasaki",
  "Aaron Judge",
  "Judge"
];

const teamSignals = [
  "Lakers",
  "Warriors",
  "Dodgers",
  "Yankees",
  "Red Sox",
  "Celtics",
  "Knicks",
  "Mavericks",
  "Manchester United",
  "Real Madrid",
  "Barcelona",
  "Inter Miami",
  "中華隊",
  "兄弟",
  "統一",
  "樂天",
  "富邦",
  "味全",
  "台鋼"
];

const memeSignals = [
  "controversy",
  "controversial",
  "referee",
  "ejected",
  "ejection",
  "fight",
  "reaction",
  "fans react",
  "meme",
  "viral",
  "troll",
  "collapse",
  "comeback",
  "clutch",
  "choke",
  "injury",
  "trade",
  "rumor",
  "free agency"
];

const translation: Record<string, string> = {
  "Shohei Ohtani": "大谷翔平",
  "Ohtani": "大谷翔平",
  "LeBron James": "詹皇",
  "LeBron": "詹皇",
  "Stephen Curry": "柯瑞",
  "Curry": "柯瑞",
  "Kevin Durant": "KD",
  "Durant": "KD",
  "Luka Doncic": "Doncic",
  "Doncic": "Doncic",
  "Nikola Jokic": "Jokic",
  "Jokic": "Jokic",
  "Giannis": "字母哥",
  "Messi": "梅西",
  "Ronaldo": "C 羅",
  "Mbappe": "姆巴佩",
  "Neymar": "內馬爾",
  "Yoshinobu Yamamoto": "山本由伸",
  "Yamamoto": "山本由伸",
  "Roki Sasaki": "佐佐木朗希",
  "Sasaki": "佐佐木朗希",
  "Aaron Judge": "Judge",
  "Judge": "Judge",
  "Lakers": "湖人",
  "Warriors": "勇士",
  "Dodgers": "道奇",
  "Yankees": "洋基",
  "Red Sox": "紅襪",
  "Celtics": "塞爾提克",
  "Knicks": "尼克",
  "Mavericks": "獨行俠",
  "Real Madrid": "皇馬",
  "Barcelona": "巴薩",
  "Inter Miami": "邁阿密國際",
  "Manchester United": "曼聯"
};

export function analyzeFanSignals(text: string): FanSignalResult {
  const source = text.toLowerCase();
  const tags = new Set<string>();

  for (const signal of playerSignals) {
    if (source.includes(signal.toLowerCase())) tags.add(translation[signal] ?? signal);
  }
  for (const signal of teamSignals) {
    if (source.includes(signal.toLowerCase())) tags.add(translation[signal] ?? signal);
  }
  for (const signal of memeSignals) {
    if (source.includes(signal.toLowerCase())) tags.add(toMemeTag(signal));
  }

  if (!tags.size) {
    tags.add("國際體育熱點");
    tags.add("球迷討論");
  }

  const tagList = Array.from(tags).slice(0, 6);
  return {
    tags: tagList,
    angle: buildAngle(tagList),
    taiwanHook: buildTaiwanHook(tagList)
  };
}

export function enrichCopyForTaiwanFans(base: string, title: string, summary: string) {
  const signal = analyzeFanSignals(`${title} ${summary}`);
  return [
    base,
    "",
    `台灣球迷看點：${signal.taiwanHook}`,
    `可操作標籤：${signal.tags.join("、")}`,
    "",
    "適合延伸成：迷因梗圖、賽前討論、限動投票、短影音前三秒開頭。"
  ].join("\n");
}

export function toChineseSportsTerms(text: string) {
  return Object.entries(translation).reduce((next, [english, chinese]) => {
    return next.replace(new RegExp(escapeRegExp(english), "gi"), chinese);
  }, text);
}

function toMemeTag(signal: string) {
  const map: Record<string, string> = {
    controversy: "爭議話題",
    controversial: "爭議話題",
    referee: "裁判爭議",
    ejected: "驅逐出場",
    ejection: "驅逐出場",
    fight: "衝突場面",
    reaction: "球迷反應",
    "fans react": "球迷反應",
    meme: "迷因梗",
    viral: "爆紅話題",
    troll: "球迷互嘴",
    collapse: "崩盤梗",
    comeback: "逆轉梗",
    clutch: "關鍵時刻",
    choke: "失常梗",
    injury: "傷病消息",
    trade: "交易傳聞",
    rumor: "傳聞話題",
    "free agency": "自由市場"
  };
  return map[signal] ?? signal;
}

function buildAngle(tags: string[]) {
  if (tags.some((tag) => tag.includes("裁判") || tag.includes("爭議"))) return "裁判爭議與球迷留言區反應";
  if (tags.some((tag) => tag.includes("迷因") || tag.includes("梗"))) return "迷因梗圖與球迷互嘴";
  if (tags.some((tag) => tag.includes("大谷") || tag.includes("山本") || tag.includes("佐佐木"))) return "台灣棒球迷高度關注的日職/MLB 話題";
  if (tags.some((tag) => tag.includes("詹皇") || tag.includes("柯瑞") || tag.includes("湖人") || tag.includes("勇士"))) return "台灣 NBA 球迷高討論度話題";
  if (tags.some((tag) => tag.includes("梅西") || tag.includes("C 羅") || tag.includes("姆巴佩"))) return "國際足球巨星流量話題";
  return "國際體育熱點與球迷討論";
}

function buildTaiwanHook(tags: string[]) {
  const primary = tags.slice(0, 3).join("、");
  return `${primary} 這類話題在台灣社群適合用「你站哪邊」或「留言區開會」角度操作。`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
