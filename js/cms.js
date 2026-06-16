/**
 * cms.js — ミッカサイト Micro CMS ロジック
 *
 * 【スタッフ向け運用ガイド】
 * ─────────────────────────────────────────────
 * ■ お知らせを追加・編集する場合
 *   → data/news.json を編集してください。
 *
 *   形式（1件分）:
 *   {
 *     "id": 数字（連番）,
 *     "date": "YYYY-MM-DD",
 *     "category": "カテゴリ名",
 *     "title": "記事タイトル",
 *     "summary": "一覧に表示される要約文",
 *     "body": [ ... ブロック配列 ... ]
 *   }
 *
 *   body ブロックの種類:
 *   { "type": "lead",    "text": "リード文" }
 *   { "type": "heading", "text": "見出し" }
 *   { "type": "text",    "text": "本文テキスト（\nで改行）" }
 *   { "type": "info",    "text": "補足情報（青ボックス）" }
 *   { "type": "warning", "text": "注意情報（オレンジボックス）" }
 *   { "type": "list",    "items": ["箇条書き1", "箇条書き2"] }
 *   { "type": "checklist", "items": ["チェック項目1"] }
 *   { "type": "steps",   "items": [{ "title": "ステップ名", "text": "説明" }] }
 *   { "type": "stat",    "value": "53%", "text": "説明文" }
 *   { "type": "table",   "headers": ["列1","列2"], "rows": [["値1","値2"]] }
 *   { "type": "faq",     "items": [{ "q": "質問", "a": "回答" }] }
 *
 * ■ 制作実績を追加・編集する場合
 *   → data/works.json を編集してください。
 *   形式:
 *   [
 *     {
 *       "id": 1,
 *       "client": "クライアント名",
 *       "url": "https://...",
 *       "image": "images/ファイル名.jpg",
 *       "description": "説明文",
 *       "tags": ["タグ1", "タグ2"]
 *     },
 *     ...
 *   ]
 *   ※ 画像は images/ フォルダに置いてください。
 *   ※ URLがない場合は "#" を指定してください。
 * ─────────────────────────────────────────────
 */

(function () {
  'use strict';

  /* ═══════════════════════════════════════════
     ユーティリティ
  ═══════════════════════════════════════════ */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return escapeHtml(dateStr);
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /* ═══════════════════════════════════════════
     記事本文レンダラー
  ═══════════════════════════════════════════ */
  function renderBodyBlock(block) {
    switch (block.type) {

      case 'lead':
        return `<p class="news-body-lead">${escapeHtml(block.text)}</p>`;

      case 'heading':
        return `<h3 class="news-body-heading">${escapeHtml(block.text)}</h3>`;

      case 'text':
        return `<p class="news-body-text">${escapeHtml(block.text)}</p>`;

      case 'info':
        return `<div class="news-body-info">${escapeHtml(block.text)}</div>`;

      case 'warning':
        return `<div class="news-body-warning">${escapeHtml(block.text)}</div>`;

      case 'list':
        return `<ul class="news-body-list">${
          (block.items || []).map(item =>
            `<li>${escapeHtml(item)}</li>`
          ).join('')
        }</ul>`;

      case 'checklist':
        return `<ul class="news-body-checklist">${
          (block.items || []).map(item =>
            `<li>${escapeHtml(item)}</li>`
          ).join('')
        }</ul>`;

      case 'steps':
        return `<ol class="news-body-steps">${
          (block.items || []).map(step => `
            <li>
              <div>
                <div class="step-title">${escapeHtml(step.title)}</div>
                <div class="step-text">${escapeHtml(step.text)}</div>
              </div>
            </li>
          `).join('')
        }</ol>`;

      case 'stat':
        return `<div class="news-body-stat">
          <div class="news-body-stat-value">${escapeHtml(block.value)}</div>
          <div class="news-body-stat-text">${escapeHtml(block.text)}</div>
        </div>`;

      case 'table':
        return `<div style="overflow-x:auto;margin-bottom:18px;">
          <table class="news-body-table">
            <thead><tr>${
              (block.headers || []).map(h => `<th>${escapeHtml(h)}</th>`).join('')
            }</tr></thead>
            <tbody>${
              (block.rows || []).map(row =>
                `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`
              ).join('')
            }</tbody>
          </table>
        </div>`;

      case 'faq':
        return `<div class="news-body-faq">${
          (block.items || []).map(item => `
            <div class="news-body-faq-item">
              <div class="news-body-faq-q">${escapeHtml(item.q)}</div>
              <div class="news-body-faq-a">${escapeHtml(item.a)}</div>
            </div>
          `).join('')
        }</div>`;

      default:
        return '';
    }
  }

  function renderFullBody(bodyBlocks) {
    if (!Array.isArray(bodyBlocks)) return '';
    return bodyBlocks.map(renderBodyBlock).join('');
  }

  /* ═══════════════════════════════════════════
     お知らせ一覧レンダリング
  ═══════════════════════════════════════════ */
  function renderNews(items) {
    const list = document.getElementById('newsList');
    if (!list) return;

    if (!items || items.length === 0) {
      list.innerHTML = '<li class="news-item"><span class="news-content">現在お知らせはありません。</span></li>';
      return;
    }

    const html = items.map((item, i) => `
      <li class="news-item" data-news-id="${escapeHtml(String(item.id))}" style="animation-delay: ${i * 0.08}s" tabindex="0" role="button" aria-label="${escapeHtml(item.title)}を開く">
        <time class="news-date" datetime="${escapeHtml(item.date)}">${formatDate(item.date)}</time>
        <span class="news-content">${escapeHtml(item.title || item.content || '')}</span>
        <span class="news-read-more">詳細を見る ›</span>
      </li>
    `).join('');

    list.innerHTML = html;

    /* クリック・キーボードイベントを登録 */
    list.querySelectorAll('.news-item[data-news-id]').forEach(el => {
      el.addEventListener('click', () => {
        const id = parseInt(el.dataset.newsId, 10);
        openModal(items, id);
      });
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const id = parseInt(el.dataset.newsId, 10);
          openModal(items, id);
        }
      });
    });
  }

  /* ═══════════════════════════════════════════
     モーダル制御
  ═══════════════════════════════════════════ */
  let _allItems = [];
  let _currentIndex = 0;
  let _previouslyFocused = null;

  function openModal(items, id) {
    _allItems = items;
    const idx = items.findIndex(item => item.id === id);
    if (idx === -1) return;
    _currentIndex = idx;
    _previouslyFocused = document.activeElement;
    renderModal();
    const overlay = document.getElementById('newsModalOverlay');
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    /* フォーカスを閉じるボタンへ */
    setTimeout(() => {
      const closeBtn = document.getElementById('newsModalClose');
      if (closeBtn) closeBtn.focus();
    }, 50);
  }

  function closeModal() {
    const overlay = document.getElementById('newsModalOverlay');
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    if (_previouslyFocused) _previouslyFocused.focus();
  }

  function renderModal() {
    const item = _allItems[_currentIndex];
    if (!item) return;

    document.getElementById('newsModalCategory').textContent = item.category || 'お知らせ';
    document.getElementById('newsModalDate').textContent = formatDate(item.date);
    document.getElementById('newsModalDate').setAttribute('datetime', item.date);
    document.getElementById('newsModalTitle').textContent = item.title || '';
    document.getElementById('newsModalBody').innerHTML = renderFullBody(item.body);

    /* カウント表示 */
    document.getElementById('newsNavCount').textContent =
      `${_currentIndex + 1} / ${_allItems.length}`;

    /* 前後ボタン */
    const prevBtn = document.getElementById('newsNavPrev');
    const nextBtn = document.getElementById('newsNavNext');
    prevBtn.disabled = (_currentIndex <= 0);
    nextBtn.disabled = (_currentIndex >= _allItems.length - 1);

    /* モーダルを先頭にスクロール */
    const modal = document.querySelector('.news-modal');
    if (modal) modal.scrollTop = 0;
    const overlay = document.getElementById('newsModalOverlay');
    if (overlay) overlay.scrollTop = 0;
  }

  function bindModalEvents() {
    const overlay = document.getElementById('newsModalOverlay');
    const closeBtn = document.getElementById('newsModalClose');
    const prevBtn  = document.getElementById('newsNavPrev');
    const nextBtn  = document.getElementById('newsNavNext');
    const modal    = document.querySelector('.news-modal');

    if (!overlay) return;

    /* 閉じる */
    closeBtn.addEventListener('click', closeModal);

    /* オーバーレイ背景クリックで閉じる */
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal();
    });

    /* Escape キーで閉じる */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
        closeModal();
      }
    });

    /* 前の記事 */
    prevBtn.addEventListener('click', () => {
      if (_currentIndex > 0) {
        _currentIndex--;
        renderModal();
      }
    });

    /* 次の記事 */
    nextBtn.addEventListener('click', () => {
      if (_currentIndex < _allItems.length - 1) {
        _currentIndex++;
        renderModal();
      }
    });

    /* モーダル内クリックが背景に伝播しないようにする */
    if (modal) {
      modal.addEventListener('click', e => e.stopPropagation());
    }
  }

  /* ═══════════════════════════════════════════
     制作実績 (works.json)
  ═══════════════════════════════════════════ */
  function renderWorks(items) {
    const grid = document.getElementById('worksGrid');
    if (!grid) return;

    if (!items || items.length === 0) {
      grid.innerHTML = '<p style="text-align:center;color:#888;">現在掲載できる実績はありません。</p>';
      return;
    }

    const html = items.map((item, i) => {
      const imgHtml = item.image
        ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.client)}" class="work-card-img" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><div class="work-card-img-placeholder" style="display:none">画像準備中</div>`
        : `<div class="work-card-img-placeholder">画像準備中</div>`;

      const tagsHtml = (item.tags || []).map(tag =>
        `<span class="work-tag">${escapeHtml(tag)}</span>`
      ).join('');

      const isLink = item.url && item.url !== '#';
      const cardTag = isLink ? `a href="${escapeHtml(item.url)}" target="_blank" rel="noopener"` : 'div';
      const cardClose = isLink ? 'a' : 'div';

      return `
        <${cardTag} class="work-card" style="animation-delay: ${i * 0.1}s">
          <div class="work-card-img-wrap">${imgHtml}</div>
          <div class="work-card-body">
            <p class="work-card-client">${escapeHtml(item.client)}</p>
            <p class="work-card-desc">${escapeHtml(item.description)}</p>
            <div class="work-card-tags">${tagsHtml}</div>
          </div>
        </${cardClose}>
      `;
    }).join('');

    grid.innerHTML = html;
  }

  /* ═══════════════════════════════════════════
     JSON フェッチ共通関数
  ═══════════════════════════════════════════ */
  function fetchJson(path) {
    return fetch(path)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + path);
        return res.json();
      });
  }

  /* ═══════════════════════════════════════════
     初期化
  ═══════════════════════════════════════════ */
  function init() {
    /* モーダルのイベント登録（DOM構築後に一度だけ） */
    bindModalEvents();

    fetchJson('data/news.json')
      .then(renderNews)
      .catch(function (err) {
        console.warn('[CMS] news.json の読み込みに失敗しました:', err);
        const list = document.getElementById('newsList');
        if (list) list.innerHTML = '<li class="news-item"><span class="news-content">お知らせの読み込みに失敗しました。</span></li>';
      });

    fetchJson('data/works.json')
      .then(renderWorks)
      .catch(function (err) {
        console.warn('[CMS] works.json の読み込みに失敗しました:', err);
        const grid = document.getElementById('worksGrid');
        if (grid) grid.innerHTML = '<p style="text-align:center;color:#888;">実績の読み込みに失敗しました。</p>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
