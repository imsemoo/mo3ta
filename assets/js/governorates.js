/* ==========================================================================
   مُعطى — فهرس المحافظات (governorates.html)
   governorates.js — ملخّص + شبكة بطاقات أغنى (مؤشّرات مصغّرة مشتقّة «تقديري» + لون
   إقليم) + بحث/فرز/تصفية بحالة قابلة للمشاركة (?q=&sort=&region=). الرقم الموثّق
   الوحيد = GOV[i].v؛ المؤشّرات المصغّرة مشتقّة بصيغة الموقع وتُوسَم «تقديري».
   يقرأ window.M3 للقراءة فقط.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var slot = function (n) { return $('[data-render="' + n + '"]'); };
  function h(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function clear(e) { if (e) while (e.firstChild) e.removeChild(e.firstChild); }

  var M3 = window.M3 || {};
  var GOV = (M3.DATA && M3.DATA.GOV) || [];
  var fmt = M3.fmt || function (n) { return Math.round(n).toLocaleString('en-US'); };
  var coll = new Intl.Collator('ar');

  var REGIONS = [
    { k: 'wb', label: 'الضفة الغربية', idx: [0, 1, 2, 3, 4, 6, 7, 8, 9, 10] },
    { k: 'jeru', label: 'القدس', idx: [5] },
    { k: 'gaza', label: 'قطاع غزة', idx: [11] }
  ];
  function regionOf(i) { for (var r = 0; r < REGIONS.length; r++) if (REGIONS[r].idx.indexOf(i) >= 0) return REGIONS[r]; return REGIONS[0]; }

  var maxV = GOV.reduce(function (m, g) { return Math.max(m, g.v); }, 0);
  var total = GOV.reduce(function (s, g) { return s + g.v; }, 0);
  var rankOf = {};
  GOV.map(function (g, i) { return { i: i, v: g.v }; }).sort(function (a, b) { return b.v - a.v; })
    .forEach(function (o, pos) { rankOf[o.i] = pos + 1; });

  // مؤشّرات مصغّرة مشتقّة (نسبة الموقع: انتهاكات 0.8533، مقاومة شعبية+نوعية 0.1467)
  function derive(v, kind) { return Math.round(v * (kind === 'viol' ? 0.8533 : 0.1467)); }

  var state = { q: '', sort: 'rank', region: 'all' };

  function buildCard(i) {
    var g = GOV[i], reg = regionOf(i);
    var card = h('a', 'govx-card govx-card--' + reg.k + (g.gaza ? ' govx-card--gaza' : ''));
    card.href = 'city_town_info.html?gov=' + i;
    card.setAttribute('data-st', '');
    card.setAttribute('aria-label', g.n + ' — المرتبة ' + rankOf[i] + ' وطنياً — ' + fmt(g.v) + ' حدثاً موثّقاً — استعراض الملف');
    card.appendChild(h('span', 'govx-card__rank', '#' + rankOf[i]));
    card.appendChild(h('span', 'govx-card__name', g.n));
    card.appendChild(h('span', 'govx-card__region', reg.label));
    card.appendChild(h('span', 'govx-card__value num', fmt(g.v)));
    card.appendChild(h('span', 'govx-card__metric-label', 'حدثاً موثّقاً'));

    var mini = h('div', 'govx-card__ministats');
    [{ v: derive(g.v, 'viol'), label: 'انتهاكات', tone: 'violations' }, { v: derive(g.v, 'res'), label: 'مقاومة', tone: 'resistance' }].forEach(function (m) {
      var s = h('div', 'govx-card__ministat');
      var val = h('span', 'govx-card__ministat-value num', fmt(m.v)); val.style.setProperty('--tone', 'var(--' + m.tone + ')');
      s.appendChild(val);
      s.appendChild(h('span', 'govx-card__ministat-label', m.label + ' (تقديري)'));
      mini.appendChild(s);
    });
    card.appendChild(mini);

    var track = h('div', 'bar-track'); track.setAttribute('aria-hidden', 'true');
    var fill = h('div', 'bar-fill bar-fill--tone');
    fill.style.setProperty('--w', (maxV ? g.v / maxV * 100 : 0) + '%');
    fill.style.setProperty('--tone', g.gaza ? 'var(--red)' : 'var(--accent)');
    track.appendChild(fill); card.appendChild(track);

    var cta = h('span', 'govx-card__cta');
    cta.appendChild(document.createTextNode('استعراض الملف'));
    var arrow = h('span', 'govx-card__arrow fa-solid fa-chevron-left'); arrow.setAttribute('aria-hidden', 'true');
    cta.appendChild(arrow); card.appendChild(cta);
    return card;
  }

  /* ===== الملخّص ===== */
  function renderSummary() {
    var box = slot('summary'); if (!box) return; clear(box);
    var top = GOV.reduce(function (a, g) { return g.v > a.v ? g : a; }, GOV[0] || { v: 0, n: '—' });
    function item(value, label) { var it = h('div', 'trust__item'); it.appendChild(h('div', 'trust__value', value)); it.appendChild(h('div', 'trust__label', label)); return it; }
    box.appendChild(item('12', 'محافظة'));
    box.appendChild(h('div', 'trust__sep'));
    box.appendChild(item(fmt(total), 'حدث موثّق إجمالاً'));
    box.appendChild(h('div', 'trust__sep'));
    box.appendChild(item(top.n, 'الأكثر توثيقاً'));
    box.appendChild(h('div', 'trust__sep'));
    box.appendChild(item(fmt(total / (GOV.length || 1)), 'متوسّط لكل محافظة'));
  }

  /* ===== الفلاتر ===== */
  function renderRegionFilter() {
    var box = slot('region-filter'); if (!box) return; clear(box);
    [{ k: 'all', label: 'الكل' }].concat(REGIONS.map(function (r) { return { k: r.k, label: r.label }; })).forEach(function (o) {
      var b = h('button', 'chip chip--sm' + (o.k === state.region ? ' is-active' : ''), o.label); b.type = 'button';
      b.setAttribute('aria-pressed', String(o.k === state.region));
      b.addEventListener('click', function () { state.region = o.k; sync(); render(); });
      box.appendChild(b);
    });
  }

  function isFiltering() { return state.q !== '' || state.region !== 'all' || state.sort !== 'rank'; }

  function filteredIdx() {
    var list = GOV.map(function (g, i) { return i; });
    if (state.region !== 'all') list = list.filter(function (i) { return regionOf(i).k === state.region; });
    if (state.q) { var q = state.q.trim(); list = list.filter(function (i) { return (GOV[i].n + ' ' + regionOf(i).label).indexOf(q) >= 0; }); }
    list.sort(function (a, b) {
      if (state.sort === 'alpha') return coll.compare(GOV[a].n, GOV[b].n);
      if (state.sort === 'region') return (regionOf(a).k.localeCompare(regionOf(b).k)) || (GOV[b].v - GOV[a].v);
      return GOV[b].v - GOV[a].v;
    });
    return list;
  }

  function setRegionSectionsHidden(hidden) {
    ['region-wb', 'region-jeru', 'region-gaza'].forEach(function (id) { var s = document.getElementById(id); if (s) s.hidden = hidden; });
  }

  function renderRegionSections() {
    REGIONS.forEach(function (r) {
      var grid = slot('region-' + r.k);
      if (grid) { clear(grid); r.idx.forEach(function (i) { grid.appendChild(buildCard(i)); }); }
      var totalEl = slot('region-total-' + r.k);
      if (totalEl) { var sum = r.idx.reduce(function (s, i) { return s + (GOV[i] ? GOV[i].v : 0); }, 0); clear(totalEl); totalEl.appendChild(h('span', 'num', fmt(sum))); totalEl.appendChild(document.createTextNode(' حدثاً موثّقاً')); }
    });
  }

  function renderFlat() {
    var wrap = slot('flat-wrap'), grid = slot('flat'), countEl = slot('flat-count');
    if (!grid) return;
    var list = filteredIdx();
    if (countEl) { clear(countEl); countEl.appendChild(h('span', 'num', String(list.length))); countEl.appendChild(document.createTextNode(' محافظة')); }
    clear(grid);
    if (!list.length) {
      var empty = h('div', 'archive-empty');
      var ic = h('div', 'archive-empty__icon fa-solid fa-magnifying-glass'); ic.setAttribute('aria-hidden', 'true'); empty.appendChild(ic);
      empty.appendChild(h('p', 'archive-empty__title', 'لا توجد محافظة مطابقة'));
      empty.appendChild(h('p', 'archive-empty__text', 'جرّب اسماً آخر أو امسح الفلاتر.'));
      var rb = h('button', 'btn btn--primary', 'مسح الفلاتر'); rb.type = 'button'; rb.addEventListener('click', resetFilters);
      empty.appendChild(rb); grid.appendChild(empty);
    } else {
      list.forEach(function (i) { grid.appendChild(buildCard(i)); });
    }
    if (wrap) wrap.hidden = false;
  }

  function render() {
    if (isFiltering()) { setRegionSectionsHidden(true); renderFlat(); }
    else { var wrap = slot('flat-wrap'); if (wrap) wrap.hidden = true; setRegionSectionsHidden(false); renderRegionSections(); }
  }

  function resetFilters() {
    state = { q: '', sort: 'rank', region: 'all' };
    var s = $('[data-search]'); if (s) s.value = '';
    var so = $('[data-sort]'); if (so) so.value = 'rank';
    sync(); render();
  }

  function sync() {
    renderRegionFilter();
    var so = $('[data-sort]'); if (so) so.value = state.sort;
    try {
      var qs = [];
      if (state.q) qs.push('q=' + encodeURIComponent(state.q));
      if (state.sort !== 'rank') qs.push('sort=' + state.sort);
      if (state.region !== 'all') qs.push('region=' + state.region);
      history.replaceState(null, '', qs.length ? ('?' + qs.join('&')) : location.pathname);
    } catch (e) {}
  }

  function readUrl() {
    try {
      var p = new URLSearchParams(location.search);
      if (p.get('q')) state.q = p.get('q');
      if (p.get('sort')) state.sort = p.get('sort');
      if (p.get('region')) state.region = p.get('region');
    } catch (e) {}
  }

  function bind() {
    var search = $('[data-search]');
    if (search) { search.value = state.q; var t = null; search.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { state.q = search.value.trim(); sync(); render(); }, 200); }); }
    var so = $('[data-sort]'); if (so) so.addEventListener('change', function () { state.sort = so.value; sync(); render(); });
  }

  function init() {
    if (!GOV.length) return;
    readUrl();
    renderSummary();
    renderRegionFilter();
    bind();
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
