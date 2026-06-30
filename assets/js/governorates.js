/* ==========================================================================
   مُعطى — منصّة استكشاف المحافظات (governorates.html)
   governorates.js — هيرو غنيّ (6 مؤشّرات) + خريطة مهيمنة بقائمة رتب + إحصاءات
   عامّة + محافظة مميّزة (#1) + شبكة موحّدة بحث/فرز/تصفية (?q=&sort=&region=) +
   مقارنة أقاليم. الموثّق الوحيد = GOV[i].v ومجاميعها؛ المشتقّ (derive) موسوم «تقديري».
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
  var CAL = (M3.DATA && M3.DATA.CAL_EVENTS) || {};
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

  /* ===== بطاقة محافظة (الشبكة) ===== */
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

  /* ===== 1) الهيرو — 6 مؤشّرات قياديّة ===== */
  function renderHeroStats() {
    var box = slot('hero-stats'); if (!box) return; clear(box);
    var top = GOV.reduce(function (a, g) { return g.v > a.v ? g : a; }, GOV[0]);
    var bottom = GOV.reduce(function (a, g) { return g.v < a.v ? g : a; }, GOV[0]);
    // آخر تحديث: أحدث مفتاح CAL عبر مقارنة رقميّة (لا فرز نصّيّ يخطئ 10 مقابل 9)
    var last = Object.keys(CAL).reduce(function (best, k) {
      var p = k.split('-').map(Number);
      var b = best ? best.split('-').map(Number) : [0, 0, 0];
      return (p[0] * 10000 + p[1] * 100 + p[2]) > (b[0] * 10000 + b[1] * 100 + b[2]) ? k : best;
    }, '') || '2025-10-2';
    var lastFmt = last.split('-').slice(0, 2).reverse().join('/');
    function numSpan(t) { return h('span', 'num', t); }
    function stat(node, label) {
      var s = h('div', 'hero-stat');
      var val = h('div', 'hero-stat__value'); val.appendChild(node); s.appendChild(val);
      s.appendChild(h('div', 'hero-stat__label', label));
      return s;
    }
    box.appendChild(stat(numSpan(fmt(GOV.length)), 'محافظة'));
    box.appendChild(stat(numSpan(fmt(total)), 'حدثاً موثّقاً'));
    box.appendChild(stat(document.createTextNode(top.n), 'الأكثر توثيقاً · #1'));
    box.appendChild(stat(document.createTextNode(bottom.n), 'الأقلّ توثيقاً · #' + GOV.length));
    box.appendChild(stat(numSpan(fmt(total / (GOV.length || 1))), 'المتوسّط'));
    box.appendChild(stat(numSpan(lastFmt), 'آخر تحديث'));
  }

  /* ===== 2) قائمة رتب الخريطة الجانبيّة ===== */
  function renderRankList() {
    var box = slot('rank-list'); if (!box) return; clear(box);
    GOV.map(function (g, i) { return { i: i, g: g }; }).sort(function (a, b) { return b.g.v - a.g.v; }).forEach(function (o) {
      var li = h('li', 'rank-list__item');
      var a = h('a', 'rank-list__link'); a.href = 'city_town_info.html?gov=' + o.i;
      a.setAttribute('aria-label', o.g.n + ' — المرتبة ' + rankOf[o.i] + ' — ' + fmt(o.g.v) + ' حدثاً — استعراض الملف');
      a.appendChild(h('span', 'rank-list__rank', '#' + rankOf[o.i]));
      a.appendChild(h('span', 'rank-list__name', o.g.n));
      a.appendChild(h('span', 'rank-list__value num', fmt(o.g.v)));
      var track = h('span', 'rank-list__bar');
      var fill = h('span', 'rank-list__bar-fill');
      fill.style.width = (maxV ? o.g.v / maxV * 100 : 0) + '%';
      if (o.g.gaza) fill.style.background = 'var(--red)';
      track.appendChild(fill); a.appendChild(track);
      li.appendChild(a); box.appendChild(li);
    });
  }

  /* ===== 3) الصورة العامّة — 4 بطاقات ===== */
  function renderOverview() {
    var box = slot('overview'); if (!box) return; clear(box);
    var top = GOV.reduce(function (a, g) { return g.v > a.v ? g : a; }, GOV[0]);
    var bottom = GOV.reduce(function (a, g) { return g.v < a.v ? g : a; }, GOV[0]);
    function card(label, val, note) {
      var c = h('div', 'stat-card');
      c.appendChild(h('div', 'stat-card__label', label));
      c.appendChild(h('div', 'stat-card__value num', val));
      c.appendChild(h('div', 'stat-card__note', note));
      return c;
    }
    box.appendChild(card('إجمالي الأحداث', fmt(total), 'مجموع الـ12 محافظة'));
    box.appendChild(card('الأكثر توثيقاً', fmt(top.v), top.n + ' · #1'));
    box.appendChild(card('الأقلّ توثيقاً', fmt(bottom.v), bottom.n + ' · #' + GOV.length));
    box.appendChild(card('المتوسّط', fmt(total / (GOV.length || 1)), 'لكل محافظة'));
  }

  /* ===== 4) المحافظة المميّزة — نابلس (#1) ===== */
  function renderFeatured() {
    var box = slot('featured'); if (!box || !GOV[0]) return; clear(box);
    var g = GOV[0], reg = regionOf(0), share = (g.v / total * 100).toFixed(1);
    var card = h('div', 'featured-gov-card');
    card.appendChild(h('span', 'featured-gov-card__rank', '#1 الأكثر توثيقاً'));
    card.appendChild(h('span', 'featured-gov-card__name', g.n));
    card.appendChild(h('span', 'featured-gov-card__region', reg.label));
    card.appendChild(h('span', 'featured-gov-card__value num', fmt(g.v)));
    card.appendChild(h('span', 'featured-gov-card__label', 'حدثاً موثّقاً'));
    var mini = h('div', 'featured-gov-card__ministats');
    [
      { v: fmt(derive(g.v, 'viol')), l: 'انتهاكات (تقديري)', t: 'violations' },
      { v: fmt(derive(g.v, 'res')), l: 'مقاومة (تقديري)', t: 'resistance' },
      { v: share + '%', l: 'من الإجمالي', t: null },
      { v: '#1', l: 'وطنيّاً', t: null }
    ].forEach(function (m) {
      var s = h('div', 'featured-gov-card__ministat');
      var val = h('span', 'featured-gov-card__ministat-value num', m.v); if (m.t) val.style.setProperty('--tone', 'var(--' + m.t + ')');
      s.appendChild(val);
      s.appendChild(h('span', 'featured-gov-card__ministat-label', m.l));
      mini.appendChild(s);
    });
    card.appendChild(mini);
    var track = h('div', 'bar-track'); track.setAttribute('aria-hidden', 'true');
    var fill = h('div', 'bar-fill bar-fill--tone'); fill.style.setProperty('--w', '100%'); fill.style.setProperty('--tone', 'var(--accent)');
    track.appendChild(fill); card.appendChild(track);
    var cta = h('a', 'btn btn--primary featured-gov-card__cta', 'استعرض الملف الكامل'); cta.href = 'city_town_info.html?gov=0';
    card.appendChild(cta);
    box.appendChild(card);
    var aside = h('div', 'featured-aside');
    aside.appendChild(h('p', 'featured-aside__text', 'تتصدّر نابلس التوثيق الميدانيّ في الضفة الغربية، وتمثّل أعلى كثافة أحداث موثّقة بين المحافظات الاثنتي عشرة.'));
    box.appendChild(aside);
  }

  /* ===== 6) مقارنة الأقاليم ===== */
  function renderRegional() {
    var box = slot('regional'); if (!box) return; clear(box);
    var max = REGIONS.reduce(function (m, r) { var s = r.idx.reduce(function (a, i) { return a + (GOV[i] ? GOV[i].v : 0); }, 0); return Math.max(m, s); }, 0);
    REGIONS.forEach(function (r) {
      var sum = r.idx.reduce(function (a, i) { return a + (GOV[i] ? GOV[i].v : 0); }, 0);
      var share = (sum / total * 100).toFixed(1);
      var c = h('div', 'region-card region-card--' + r.k);
      c.appendChild(h('div', 'region-card__name', r.label));
      c.appendChild(h('div', 'region-card__count', r.idx.length + (r.idx.length > 1 ? ' محافظات' : ' محافظة')));
      c.appendChild(h('div', 'region-card__total num', fmt(sum)));
      c.appendChild(h('div', 'region-card__share', share + '% من الإجمالي'));
      var track = h('div', 'bar-track'); track.setAttribute('aria-hidden', 'true');
      var fill = h('div', 'bar-fill bar-fill--tone');
      fill.style.setProperty('--w', (max ? sum / max * 100 : 0) + '%');
      fill.style.setProperty('--tone', r.k === 'gaza' ? 'var(--red)' : r.k === 'jeru' ? 'color-mix(in srgb, var(--accent) 55%, var(--surface-2))' : 'var(--accent)');
      track.appendChild(fill); c.appendChild(track);
      box.appendChild(c);
    });
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

  /* ===== 5) الشبكة الموحّدة + التصفية ===== */
  function renderAllGovs() {
    var grid = slot('all-govs'); if (!grid) return; clear(grid);
    GOV.map(function (g, i) { return i; }).sort(function (a, b) { return GOV[b].v - GOV[a].v; }).forEach(function (i) { grid.appendChild(buildCard(i)); });
  }

  function renderFlat() {
    var grid = slot('flat'), empty = slot('flat-empty'); if (!grid) return;
    var list = filteredIdx();
    clear(grid);
    if (!list.length) {
      grid.hidden = true;
      if (empty) {
        clear(empty);
        var box = h('div', 'archive-empty');
        var ic = h('div', 'archive-empty__icon fa-solid fa-magnifying-glass'); ic.setAttribute('aria-hidden', 'true'); box.appendChild(ic);
        box.appendChild(h('p', 'archive-empty__title', 'لا توجد محافظة مطابقة'));
        box.appendChild(h('p', 'archive-empty__text', 'جرّب اسماً آخر أو امسح الفلاتر.'));
        var rb = h('button', 'btn btn--primary', 'مسح الفلاتر'); rb.type = 'button'; rb.addEventListener('click', resetFilters);
        box.appendChild(rb); empty.appendChild(box); empty.hidden = false;
      }
      return;
    }
    if (empty) empty.hidden = true;
    grid.hidden = false;
    list.forEach(function (i) { grid.appendChild(buildCard(i)); });
  }

  function render() {
    var all = slot('all-govs'), flat = slot('flat'), empty = slot('flat-empty');
    var featSec = document.querySelector('.section--featured');
    var featBand = featSec ? featSec.closest('.band') : null;
    var filtering = isFiltering();
    if (featBand) featBand.hidden = filtering;
    if (filtering) {
      if (all) all.hidden = true;
      renderFlat();
    } else {
      if (all) { all.hidden = false; renderAllGovs(); }
      if (flat) { clear(flat); flat.hidden = true; }
      if (empty) empty.hidden = true;
    }
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
    renderHeroStats();
    renderRankList();
    renderOverview();
    renderFeatured();
    renderRegional();
    renderRegionFilter();
    bind();
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
