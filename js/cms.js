/**
 * cms.js — ミッカサイト Micro CMS ロジック
 *
 * 【スタッフ向け運用ガイド】
 * ─────────────────────────────────────────────
 * ■ お知らせを追加・編集する場合
 *   → data/news.json を編集してください。
 *   形式:
 *   [
 *     { "date": "YYYY-MM-DD", "content": "お知らせ本文" },
 *     ...
 *   ]
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

  /* ── ユーティリティ ── */
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

  /* ── お知らせ (news.json) ── */
  function renderNews(items) {
    const list = document.getElementById('newsList');
    if (!list) return;

    if (!items || items.length === 0) {
      list.innerHTML = '<li class="news-item"><span class="news-content">現在お知らせはありません。</span></li>';
      return;
    }

    const html = items.map((item, i) => `
      <li class="news-item" style="animation-delay: ${i * 0.08}s">
        <time class="news-date" datetime="${escapeHtml(item.date)}">${formatDate(item.date)}</time>
        <span class="news-content">${escapeHtml(item.content)}</span>
      </li>
    `).join('');

    list.innerHTML = html;
  }

  /* ── 制作実績 (works.json) ── */
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

  /* ── JSON フェッチ共通関数 ── */
  function fetchJson(path) {
    return fetch(path)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + path);
        return res.json();
      });
  }

  /* ── 初期化 ── */
  function init() {
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
