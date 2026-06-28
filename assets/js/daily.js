/* ==========================================================================
   مُعطى — صفحة «منذ 7 أكتوبر» (الرصد اليومي)
   daily.js — عدّاد الأيام + مستكشف الأحداث (جدول/بطاقات + فرز/بحث/تفاصيل/تصدير) + التفصيلات
   (الـ KPIs وعدّها التصاعدي + الـ sparklines يتكفّل بها main.js عبر [data-count]/[data-spark-seed])
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var slot = function (n) { return $('[data-render="' + n + '"]'); };
  function h(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function clear(e) { if (e) while (e.firstChild) e.removeChild(e.firstChild); }
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }

  var AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  function fmtDate(d) { return d.getDate() + ' ' + AR_MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }

  // --- عدّاد الأيام منذ 7 أكتوبر 2023 ---
  function daysSinceOct7() {
    var start = new Date(2023, 9, 7), now = new Date();
    return Math.max(1, Math.floor((now - start) / 86400000) + 1);
  }

  // --- تصنيفات الأحداث ---
  var CATS = {
    violations: { label: 'انتهاك', tone: 'violations' },
    qualitative: { label: 'مقاومة نوعية', tone: 'resistance' },
    popular: { label: 'مقاومة شعبية', tone: 'accent' }
  };
  var REGIONS = [
    { k: 'all', label: 'الكل', govs: null },
    { k: 'wb', label: 'الضفة', govs: ['نابلس', 'جنين', 'طولكرم', 'الخليل', 'رام الله والبيرة', 'بيت لحم', 'قلقيلية', 'طوباس', 'سلفيت', 'أريحا والأغوار'] },
    { k: 'jeru', label: 'القدس', govs: ['القدس'] },
    { k: 'gaza', label: 'غزة', govs: ['قطاع غزة'] }
  ];
  var TYPE_FILTERS = [
    { k: 'all', label: 'كل الأنواع' },
    { k: 'violations', label: 'انتهاكات' },
    { k: 'qualitative', label: 'مقاومة نوعية' },
    { k: 'popular', label: 'مقاومة شعبية' }
  ];

  var GOVS = ['نابلس', 'جنين', 'طولكرم', 'الخليل', 'رام الله والبيرة', 'القدس', 'بيت لحم', 'قلقيلية', 'طوباس', 'سلفيت', 'أريحا والأغوار', 'قطاع غزة'];
  var TPL = {
    violations: [
      { t: 'اقتحام', d: 'اقتحمت قوات الاحتلال {g} وداهمت عدداً من المنازل وفتّشتها وعاثت فيها فساداً.' },
      { t: 'اعتقال', d: 'اعتقلت قوات الاحتلال {n} مواطنين من {g} بعد مداهمة منازلهم والعبث بمحتوياتها.' },
      { t: 'تضييقات الحواجز', d: 'شدّدت قوات الاحتلال إجراءاتها على حواجز {g} وأعاقت حركة المواطنين لساعات.' },
      { t: 'هدم', d: 'هدمت جرافات الاحتلال منشأةً سكنيةً في {g} بحجّة عدم الترخيص.' },
      { t: 'اعتداء مستوطنين', d: 'اعتدى مستوطنون على ممتلكات الفلسطينيين وأراضيهم في {g} تحت حماية الاحتلال.' },
      { t: 'إصابة', d: 'أُصيب {n} مواطنين بالرصاص والاختناق خلال مواجهات اندلعت في {g}.' }
    ],
    qualitative: [
      { t: 'إطلاق نار', d: 'نُفّذت عملية إطلاق نار تجاه قوات الاحتلال قرب {g}.' },
      { t: 'عبوة ناسفة', d: 'استُهدفت آلية للاحتلال بعبوة ناسفة أثناء اقتحامها {g}.' }
    ],
    popular: [
      { t: 'مواجهات', d: 'اندلعت مواجهات عنيفة مع قوات الاحتلال خلال اقتحامها {g}.' },
      { t: 'صدّ مستوطنين', d: 'تصدّى الأهالي لاقتحام مستوطنين لأراضيهم في {g}.' },
      { t: 'تظاهرة', d: 'خرجت تظاهرة مندّدة بانتهاكات الاحتلال في {g}.' }
    ]
  };
  var SOURCES = ['وكالة وفا', 'شبكة قدس', 'مراسلون ميدانيون', 'مصادر محلية', 'الهلال الأحمر'];

  function buildIncidents() {
    var out = [], seq = ['violations', 'violations', 'violations', 'popular', 'qualitative', 'violations', 'popular', 'violations'];
    var today = new Date();
    for (var i = 0; i < 34; i++) {
      var cat = seq[i % seq.length];
      var pool = TPL[cat], ty = pool[i % pool.length];
      var gov = GOVS[i % GOVS.length];
      var date = new Date(today.getTime() - Math.round(i * 0.62) * 86400000);
      var n = 2 + (i % 6);
      out.push({
        id: i + 1, ts: date.getTime(), date: fmtDate(date),
        gov: gov, type: ty.t, cat: cat,
        desc: ty.d.replace('{g}', gov).replace('{n}', String(n)),
        source: SOURCES[i % SOURCES.length]
      });
    }
    return out;
  }
  var INCIDENTS = buildIncidents();

  var BREAKDOWN = {
    qualitative: { total: 8217, items: [{ n: 'إطلاق نار', v: 4580, icon: 'fa-solid fa-crosshairs' }, { n: 'عبوات ناسفة', v: 2127, icon: 'fa-solid fa-bomb' }, { n: 'عمليات طعن', v: 266, icon: 'fa-solid fa-burst' }, { n: 'عمليات دهس', v: 139, icon: 'fa-solid fa-car-burst' }] },
    popular: { total: 55516, items: [{ n: 'مواجهات', v: 42068 }, { n: 'صدّ مستوطنين', v: 6558 }, { n: 'تظاهرات', v: 4196 }, { n: 'زجاجات حارقة', v: 2171 }] }
  };

  // ===== الحالة =====
  var state = { region: 'all', type: 'all', range: 'all', q: '', sort: 'date', dir: 'desc', view: 'table', shown: 10 };
  var PER = 10;
  var coll = new Intl.Collator('ar');

  function rangeFloor() {
    if (state.range === 'all') return -Infinity;
    var days = state.range === '7' ? 7 : 30;
    return Date.now() - days * 86400000;
  }
  function regionGovs() { for (var i = 0; i < REGIONS.length; i++) if (REGIONS[i].k === state.region) return REGIONS[i].govs; return null; }

  function filtered() {
    var govs = regionGovs(), floor = rangeFloor();
    var list = INCIDENTS.filter(function (r) {
      if (govs && govs.indexOf(r.gov) < 0) return false;
      if (state.type !== 'all' && r.cat !== state.type) return false;
      if (r.ts < floor) return false;
      if (state.q && (r.desc + ' ' + r.gov + ' ' + r.type).indexOf(state.q) < 0) return false;
      return true;
    });
    var key = state.sort, mul = state.dir === 'asc' ? 1 : -1;
    list.sort(function (a, b) {
      if (key === 'date') return (a.ts - b.ts) * mul;
      var av = key === 'gov' ? a.gov : a.type;
      var bv = key === 'gov' ? b.gov : b.type;
      return coll.compare(av, bv) * mul;
    });
    return list;
  }

  function typeTag(r) {
    var c = CATS[r.cat];
    var tag = h('span', 'dtype', r.type);
    tag.style.setProperty('--tone', 'var(--' + c.tone + ')');
    return tag;
  }

  // ===== شريط التحكّم =====
  function renderControls() {
    var rbox = slot('regions');
    if (rbox) {
      clear(rbox);
      REGIONS.forEach(function (rg) {
        var b = h('button', 'chip chip--sm' + (rg.k === state.region ? ' is-active' : ''), rg.label); b.type = 'button';
        b.setAttribute('aria-pressed', String(rg.k === state.region));
        b.addEventListener('click', function () { state.region = rg.k; state.shown = PER; renderControls(); renderAll(); });
        rbox.appendChild(b);
      });
    }
    var tbox = slot('typefilters');
    if (tbox) {
      clear(tbox);
      TYPE_FILTERS.forEach(function (tf) {
        var b = h('button', 'chip chip--sm' + (tf.k === state.type ? ' is-active' : ''), tf.label); b.type = 'button';
        b.setAttribute('aria-pressed', String(tf.k === state.type));
        b.addEventListener('click', function () { state.type = tf.k; state.shown = PER; renderControls(); renderAll(); });
        tbox.appendChild(b);
      });
    }
    // رقائق الفلاتر الفعّالة
    var chips = slot('activefilters');
    if (chips) {
      clear(chips);
      var active = [];
      if (state.region !== 'all') active.push({ label: 'المنطقة: ' + labelOf(REGIONS, state.region), clear: function () { state.region = 'all'; } });
      if (state.type !== 'all') active.push({ label: labelOf(TYPE_FILTERS, state.type), clear: function () { state.type = 'all'; } });
      if (state.range !== 'all') active.push({ label: state.range === '7' ? 'آخر 7 أيام' : 'آخر 30 يوماً', clear: function () { state.range = 'all'; } });
      if (state.q) active.push({ label: 'بحث: ' + state.q, clear: function () { state.q = ''; var s = $('[data-search]'); if (s) s.value = ''; } });
      active.forEach(function (a) {
        var tok = h('button', 'filter-token', a.label); tok.type = 'button';
        var x = h('span', 'filter-token__x fa-solid fa-xmark'); x.setAttribute('aria-hidden', 'true'); tok.appendChild(x);
        tok.setAttribute('aria-label', 'إزالة الفلتر: ' + a.label);
        tok.addEventListener('click', function () { a.clear(); state.shown = PER; renderControls(); renderAll(); });
        chips.appendChild(tok);
      });
      var resetWrap = $('[data-reset]');
      if (resetWrap) resetWrap.hidden = !active.length;
    }
  }
  function labelOf(arr, k) { for (var i = 0; i < arr.length; i++) if (arr[i].k === k) return arr[i].label; return k; }

  // ===== عدّادات الفئات =====
  function renderCounters() {
    var box = slot('counters'); if (!box) return;
    var govs = regionGovs(), floor = rangeFloor();
    var base = INCIDENTS.filter(function (r) { return (!govs || govs.indexOf(r.gov) >= 0) && r.ts >= floor; });
    var defs = [
      { label: 'إجمالي الأحداث', n: base.length, tone: 'accent' },
      { label: 'انتهاكات الاحتلال', n: base.filter(function (r) { return r.cat === 'violations'; }).length, tone: 'violations' },
      { label: 'مقاومة شعبية', n: base.filter(function (r) { return r.cat === 'popular'; }).length, tone: 'resistance' },
      { label: 'مقاومة نوعية', n: base.filter(function (r) { return r.cat === 'qualitative'; }).length, tone: 'resistance' }
    ];
    clear(box);
    defs.forEach(function (d) {
      var c = h('div', 'counter');
      var v = h('div', 'counter__value num', String(d.n)); v.style.setProperty('--tone', 'var(--' + d.tone + ')');
      c.appendChild(v);
      c.appendChild(h('div', 'counter__label', d.label));
      box.appendChild(c);
    });
  }

  // ===== مستكشف الأحداث =====
  var _expanded = {};
  function renderExplorer() {
    var list = filtered();
    var countEl = slot('exp-count');
    if (countEl) {
      clear(countEl);
      countEl.appendChild(h('strong', 'num', String(Math.min(state.shown, list.length))));
      countEl.appendChild(document.createTextNode(' من '));
      countEl.appendChild(h('strong', 'num', String(list.length)));
      countEl.appendChild(document.createTextNode(' حدثاً'));
    }
    var box = slot('explorer'); if (!box) return; clear(box);
    if (!list.length) {
      var empty = h('div', 'archive-empty');
      var icon = h('div', 'archive-empty__icon fa-solid fa-magnifying-glass'); icon.setAttribute('aria-hidden', 'true'); empty.appendChild(icon);
      empty.appendChild(h('p', 'archive-empty__title', 'لا توجد أحداث ضمن هذا النطاق'));
      empty.appendChild(h('p', 'archive-empty__text', 'جرّب توسيع النطاق الزمني أو تعديل الفلاتر.'));
      var rb = h('button', 'btn btn--primary', 'إعادة الضبط'); rb.type = 'button';
      rb.addEventListener('click', resetAll); empty.appendChild(rb);
      box.appendChild(empty);
      toggleMore(list); return;
    }
    if (state.view === 'cards') renderCards(box, list);
    else renderTable(box, list);
    toggleMore(list);
  }

  function sortHeader(label, key) {
    var th = h('th', 'dtable__th' + (state.sort === key ? ' is-sorted' : ''));
    th.setAttribute('scope', 'col');
    th.setAttribute('aria-sort', state.sort === key ? (state.dir === 'asc' ? 'ascending' : 'descending') : 'none');
    th.setAttribute('role', 'button');
    th.setAttribute('aria-label', label + ' — ترتيب');
    th.tabIndex = 0;
    th.appendChild(document.createTextNode(label + ' '));
    var sortIc = h('span', 'dtable__sort fa-solid ' + (state.sort === key ? (state.dir === 'asc' ? 'fa-caret-up' : 'fa-caret-down') : 'fa-sort')); sortIc.setAttribute('aria-hidden', 'true'); th.appendChild(sortIc);
    function go() { if (state.sort === key) state.dir = state.dir === 'asc' ? 'desc' : 'asc'; else { state.sort = key; state.dir = 'desc'; } renderExplorer(); }
    th.addEventListener('click', go);
    th.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    return th;
  }

  function renderTable(box, list) {
    var wrap = h('div', 'dtable-wrap');
    var table = h('table', 'dtable');
    var thead = document.createElement('thead');
    var trh = document.createElement('tr');
    trh.appendChild(sortHeader('التاريخ', 'date'));
    trh.appendChild(sortHeader('المحافظة', 'gov'));
    trh.appendChild(sortHeader('النوع', 'type'));
    var thDesc = h('th', null, 'الوصف'); thDesc.setAttribute('scope', 'col'); trh.appendChild(thDesc);
    var thMore = h('th'); thMore.setAttribute('scope', 'col'); thMore.appendChild(h('span', 'visually-hidden', 'تفاصيل')); trh.appendChild(thMore);
    thead.appendChild(trh); table.appendChild(thead);
    var tbody = document.createElement('tbody');
    list.slice(0, state.shown).forEach(function (r) {
      var tr = h('tr', 'dtable__row');
      var tdDate = h('td', 'dtable__date'); tdDate.appendChild(h('span', 'num', r.date)); tr.appendChild(tdDate);
      var tdGov = document.createElement('td'); tdGov.appendChild(h('span', 'dgov', r.gov)); tr.appendChild(tdGov);
      var tdType = document.createElement('td'); tdType.appendChild(typeTag(r)); tr.appendChild(tdType);
      tr.appendChild(h('td', 'dtable__desc', r.desc));
      var tdBtn = document.createElement('td');
      var btn = h('button', 'dtable__toggle', _expanded[r.id] ? '−' : '+'); btn.type = 'button';
      btn.setAttribute('aria-label', _expanded[r.id] ? 'إخفاء التفاصيل' : 'عرض التفاصيل');
      btn.setAttribute('aria-expanded', String(!!_expanded[r.id]));
      btn.setAttribute('aria-controls', 'det-' + r.id);
      tdBtn.appendChild(btn); tr.appendChild(tdBtn);
      tbody.appendChild(tr);

      var det = h('tr', 'dtable__detail'); det.id = 'det-' + r.id;
      var dtd = document.createElement('td'); dtd.colSpan = 5;
      var inner = h('div', 'dtable__detail-inner');
      inner.appendChild(h('p', 'dtable__detail-desc', r.desc));
      var meta = h('div', 'dtable__detail-meta');
      var mg = h('span'); mg.innerHTML = '<i class="fa-solid fa-location-dot" aria-hidden="true"></i> '; mg.appendChild(document.createTextNode(r.gov)); meta.appendChild(mg);
      var md = h('span'); md.innerHTML = '<i class="fa-solid fa-calendar-day" aria-hidden="true"></i> '; md.appendChild(document.createTextNode(r.date)); meta.appendChild(md);
      var ms = h('span'); ms.innerHTML = '<i class="fa-solid fa-folder-open" aria-hidden="true"></i> '; ms.appendChild(document.createTextNode('المصدر: ' + r.source)); meta.appendChild(ms);
      inner.appendChild(meta);
      dtd.appendChild(inner); det.appendChild(dtd);
      if (!_expanded[r.id]) det.hidden = true;
      tbody.appendChild(det);

      function toggle() {
        _expanded[r.id] = !_expanded[r.id];
        det.hidden = !_expanded[r.id];
        btn.textContent = _expanded[r.id] ? '−' : '+';
        btn.setAttribute('aria-label', _expanded[r.id] ? 'إخفاء التفاصيل' : 'عرض التفاصيل');
        btn.setAttribute('aria-expanded', String(_expanded[r.id]));
        tr.classList.toggle('is-open', _expanded[r.id]);
      }
      btn.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
      tr.addEventListener('click', toggle);
      tr.classList.toggle('is-open', !!_expanded[r.id]);
    });
    table.appendChild(tbody);
    wrap.appendChild(table); box.appendChild(wrap);
  }

  function renderCards(box, list) {
    var grid = h('div', 'dcards');
    list.slice(0, state.shown).forEach(function (r) {
      var card = h('article', 'dcard');
      var head = h('div', 'dcard__head');
      head.appendChild(typeTag(r));
      head.appendChild(h('span', 'dcard__date num', r.date));
      card.appendChild(head);
      card.appendChild(h('p', 'dcard__desc', r.desc));
      var meta = h('div', 'dcard__meta');
      meta.appendChild(h('span', 'dgov', r.gov));
      var ds = h('span', 'dcard__source'); ds.innerHTML = '<i class="fa-solid fa-folder-open" aria-hidden="true"></i> '; ds.appendChild(document.createTextNode(r.source)); meta.appendChild(ds);
      card.appendChild(meta);
      grid.appendChild(card);
    });
    box.appendChild(grid);
  }

  function toggleMore(list) {
    var more = $('[data-loadmore]');
    if (more && more.parentElement) more.parentElement.hidden = state.shown >= list.length || !list.length;
  }

  // ===== التفصيلات (breakdowns) =====
  function renderBreakdowns() {
    var qb = slot('bd-qualitative');
    if (qb) {
      clear(qb);
      var qmax = Math.max.apply(null, BREAKDOWN.qualitative.items.map(function (x) { return x.v; }));
      BREAKDOWN.qualitative.items.forEach(function (x) {
        var tile = h('div', 'bd-tile');
        var bdi = h('span', 'bd-tile__icon ' + x.icon); bdi.setAttribute('aria-hidden', 'true'); tile.appendChild(bdi);
        tile.appendChild(h('div', 'bd-tile__value num', fmt(x.v)));
        tile.appendChild(h('div', 'bd-tile__label', x.n));
        var track = h('div', 'bd-tile__track'); var fill = h('div', 'bd-tile__fill'); fill.style.setProperty('--w', (x.v / qmax * 100) + '%'); track.appendChild(fill); tile.appendChild(track);
        qb.appendChild(tile);
      });
    }
    var pb = slot('bd-popular');
    if (pb) {
      clear(pb);
      var pmax = Math.max.apply(null, BREAKDOWN.popular.items.map(function (x) { return x.v; }));
      BREAKDOWN.popular.items.forEach(function (x) {
        var row = h('div', 'bd-row');
        var head = h('div', 'bd-row__head');
        head.appendChild(h('span', 'bd-row__name', x.n));
        head.appendChild(h('span', 'bd-row__value num', fmt(x.v)));
        row.appendChild(head);
        var track = h('div', 'bd-track'); var fill = h('div', 'bd-fill'); fill.style.setProperty('--w', (x.v / pmax * 100) + '%'); track.appendChild(fill); row.appendChild(track);
        pb.appendChild(row);
      });
    }
  }

  // ===== التصدير CSV =====
  function exportCsv() {
    var list = filtered();
    var rows = [['التاريخ', 'المحافظة', 'النوع', 'التصنيف', 'الوصف', 'المصدر']];
    list.forEach(function (r) { rows.push([r.date, r.gov, r.type, CATS[r.cat].label, r.desc, r.source]); });
    var csv = '﻿' + rows.map(function (row) {
      return row.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(',');
    }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mo3ta-events.csv';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function renderAll() { renderCounters(); renderExplorer(); }

  function resetAll() {
    state.region = 'all'; state.type = 'all'; state.range = 'all'; state.q = ''; state.shown = PER;
    var s = $('[data-search]'); if (s) s.value = '';
    setActive('[data-range]', 'data-range', state.range);
    renderControls(); renderAll();
  }
  function setActive(sel, attr, val) { $$(sel).forEach(function (b) { var on = b.getAttribute(attr) === val; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', String(on)); }); }

  function bind() {
    // عدّاد الأيام
    var dc = $('[data-day-counter]'); if (dc) dc.textContent = fmt(daysSinceOct7());

    // النطاق الزمني
    $$('[data-range]').forEach(function (b) {
      b.addEventListener('click', function () { state.range = b.getAttribute('data-range'); state.shown = PER; setActive('[data-range]', 'data-range', state.range); renderControls(); renderAll(); });
    });
    setActive('[data-range]', 'data-range', state.range);

    // عرض جدول/بطاقات
    $$('[data-view]').forEach(function (b) {
      b.addEventListener('click', function () { state.view = b.getAttribute('data-view'); setActive('[data-view]', 'data-view', state.view); renderExplorer(); });
    });
    setActive('[data-view]', 'data-view', state.view);

    // بحث
    var search = $('[data-search]');
    if (search) { var t = null; search.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { state.q = search.value.trim(); state.shown = PER; renderControls(); renderExplorer(); }, 200); }); }

    var more = $('[data-loadmore]'); if (more) more.addEventListener('click', function () { state.shown += PER; renderExplorer(); });
    var reset = $('[data-reset]'); if (reset) reset.addEventListener('click', resetAll);
    var exp = $('[data-export]'); if (exp) exp.addEventListener('click', exportCsv);
  }

  function init() {
    renderControls();
    renderCounters();
    renderExplorer();
    renderBreakdowns();
    bind();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
