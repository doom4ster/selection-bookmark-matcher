// background.js (MV3 service worker)
// 負責接收 content script 傳來的選取文字，搜尋書籤並回傳結果

function normalize(str) {
  return (str || '')
    .trim()
    .replace(/\s+/g, ' ') // 壓縮多餘空白
    .toLowerCase();
}

async function searchBookmarksFuzzy(text) {
  if (!text || !text.trim()) return [];
  const normQuery = normalize(text);

  // 使用 query 可同時找標題/URL 部分相符
  const raw = await browser.bookmarks.search({ query: text.trim() });

  const results = [];
  const seenUrls = new Set();
  for (const b of raw) {
    if (!b.url || !b.title) continue; // 排除資料夾 / 無 URL
    const normTitle = normalize(b.title);
    let matchType = null;
    if (normTitle === normQuery) matchType = 'exact';
    else if (normTitle.includes(normQuery)) matchType = 'partial';
    if (matchType) {
      if (!seenUrls.has(b.url)) {
        seenUrls.add(b.url);
        results.push({ ...b, _matchType: matchType });
      }
    }
  }

  // 精準的放前面，部分相符在後，並各自依標題字母排序
  results.sort((a, b) => {
    if (a._matchType !== b._matchType) {
      return a._matchType === 'exact' ? -1 : 1;
    }
    return a.title.localeCompare(b.title, 'zh-Hant');
  });

  return results;
}

browser.runtime.onMessage.addListener(async (msg, sender) => {
  if (msg && msg.type === 'SELECTION_CHANGED') {
    try {
  const matches = await searchBookmarksFuzzy(msg.text);
      return { matches };
    } catch (e) {
      console.error('Bookmark search error:', e);
      return { matches: [], error: e.message };
    }
  }
});
