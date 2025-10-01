// contentScript.js - 選取文字 -> 背景模組搜尋 (精準 / 部分)
(function () {
  let panelEl; let hideTimeout; let styleInjected = false;
  const MIN_LEN = 5; // 最小字數門檻
  const DEBOUNCE_MS = 180; // 節流延遲
  let pendingTimer = null;
  let lastText = '';

  function ensureStyle() {
    if (styleInjected) return;
    try {
      const href = browser.runtime.getURL('panel.css');
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.documentElement.appendChild(link);
      styleInjected = true;
    } catch (e) {
      const style = document.createElement('style');
      style.textContent = '#__selectionBookmarkMatcherPanel{position:absolute;z-index:999999;font:13px system-ui;background:#202028;color:#fff;border:1px solid #444;padding:6px 8px;border-radius:4px;max-width:260px;line-height:1.3;box-shadow:0 4px 10px rgba(0,0,0,.35);opacity:0;transition:.15s ease all}#__selectionBookmarkMatcherPanel.visible{opacity:1}#__selectionBookmarkMatcherPanel ul{margin:4px 0 0;padding:0;list-style:none}#__selectionBookmarkMatcherPanel a{color:#ffd27f;text-decoration:none}';
      document.documentElement.appendChild(style);
      styleInjected = true;
    }
  }

  function ensurePanel() {
    if (panelEl) return panelEl;
    ensureStyle();
    panelEl = document.createElement('div');
    panelEl.id = '__selectionBookmarkMatcherPanel';
    panelEl.innerHTML = '<div class="sbm-inner"><span class="sbm-status">搜尋中...</span><ul class="sbm-list"></ul></div>';
    document.body.appendChild(panelEl);
    return panelEl;
  }

  function positionPanel(x, y) {
    const panel = ensurePanel();
    panel.style.top = `${y + 12}px`;
    panel.style.left = `${x + 12}px`;
  }

  function showPanel() {
    const panel = ensurePanel();
    panel.classList.add('visible');
  }

  function hidePanelLater() {
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      if (panelEl) panelEl.classList.remove('visible');
    }, 2500);
  }

  function updatePanel(matches, selectedText, error) {
    const panel = ensurePanel();
    const statusEl = panel.querySelector('.sbm-status');
    const listEl = panel.querySelector('.sbm-list');
    listEl.innerHTML = '';

    if (error) {
      statusEl.textContent = '錯誤: ' + error;
      return;
    }

    if (!selectedText || !selectedText.trim()) {
      statusEl.textContent = '未選取文字';
      return;
    }

    if (!matches.length) {
      statusEl.textContent = '無相同或部分相符書籤';
    } else {
      const exactCount = matches.filter(m => m._matchType === 'exact').length;
      const partialCount = matches.filter(m => m._matchType === 'partial').length;
      statusEl.textContent = `找到 ${matches.length} 筆 (精準 ${exactCount} / 部分 ${partialCount})`;
      matches.slice(0, 8).forEach(m => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        const tag = m._matchType === 'exact' ? '[=]' : '[~]';
        a.textContent = `${tag} ${m.title || m.url}`;
        a.href = m.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        li.appendChild(a);
        listEl.appendChild(li);
      });
      if (matches.length > 8) {
        const more = document.createElement('li');
        more.textContent = `... 以及另外 ${matches.length - 8} 筆`; 
        listEl.appendChild(more);
      }
    }
  }

  async function handleSelection(ev) {
    const sel = window.getSelection();
    if (!sel) return;
    const text = sel.toString();
    const trimmed = text.trim();
    if (!trimmed) return; // ignore empty
    if (trimmed.length < MIN_LEN) {
      lastText = trimmed;
      // 若已有面板顯示，更新提示
      updatePanel([], trimmed, null);
      const panel = panelEl; if (panel) {
        const statusEl = panel.querySelector('.sbm-status');
        if (statusEl) statusEl.textContent = `少於 ${MIN_LEN} 字，不搜尋`;
        panel.classList.add('visible');
        hidePanelLater();
      }
      return;
    }
    if (trimmed === lastText) {
      // 同樣內容避免重複查
      return;
    }
    lastText = trimmed;

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const x = rect.left + window.scrollX;
    const y = rect.top + window.scrollY;

    positionPanel(x, y);
    showPanel();
    updatePanel([], text); // reset state

    try {
      const resp = await browser.runtime.sendMessage({ type: 'SELECTION_CHANGED', text: trimmed });
      updatePanel(resp.matches || [], trimmed, resp.error);
    } catch (e) {
      updatePanel([], trimmed, e.message);
    }
    hidePanelLater();
  }

  function scheduleSelection(e) {
    clearTimeout(pendingTimer);
    pendingTimer = setTimeout(() => handleSelection(e), DEBOUNCE_MS);
  }

  document.addEventListener('mouseup', (e) => {
    setTimeout(() => scheduleSelection(e), 10);
  });

  document.addEventListener('keyup', (e) => {
    if (e.key === 'Shift' || e.key.startsWith('Arrow')) {
      scheduleSelection(e);
    }
  });
})();
