const replacements: Record<string, string> = {
  "娛樂城": "體育平台",
  "下注": "預測",
  "賭博": "賽事討論",
  "博弈": "觀賽互動",
  "儲值": "加入",
  "返水": "活動資訊",
  "彩金": "活動名額",
  "獎金": "活動名額",
  "輸贏": "賽事結果",
  "投注": "預測",
  "盤口": "賽事資訊",
  "賠率": "數據觀察",
  "優惠金": "活動資訊",
  "優惠": "活動資訊"
};

export const sensitiveWords = Object.keys(replacements);

export function sanitizeText(value: string): string {
  return sensitiveWords.reduce((text, word) => {
    return text.replaceAll(word, replacements[word]);
  }, value);
}
