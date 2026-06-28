/* ==========================================================================
   مُعطى — قالب صفحة المحافظة (city_town_info.html)
   governorate.js — يعرض محافظةً واحدة (افتراضي: نابلس) قابلة للاستبدال من الـ CMS
   عبر ?gov=<0..11> أو window.M3_GOV_INDEX. يقرأ window.M3 (واجهة main.js للقراءة فقط).
   الخريطة يبنيها main.js تلقائياً في [data-map]؛ هذا الملف يقرّبها للمحافظة النشطة فقط.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var slot = function (n) { return $('[data-render="' + n + '"]'); };
  function h(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function clear(e) { if (e) while (e.firstChild) e.removeChild(e.firstChild); }

  var M3 = window.M3 || {};
  var GOV = (M3.DATA && M3.DATA.GOV) || [];
  var METRICS = (M3.DATA && M3.DATA.METRICS) || [];
  var fmt = M3.fmt || function (n) { return Math.round(n).toLocaleString('en-US'); };
  var rng = M3.rng || function (s) { var x = Math.sin(s * 12.9898) * 43758.5453; return x - Math.floor(x); };

  // --- تحديد المحافظة النشطة ---
  function resolveIndex() {
    var m = /[?&]gov=(\d+)/.exec(location.search);
    var i = m ? parseInt(m[1], 10) : (typeof window.M3_GOV_INDEX === 'number' ? window.M3_GOV_INDEX : 0);
    if (isNaN(i)) i = 0;
    return Math.max(0, Math.min(GOV.length - 1, i));
  }
  var IDX = resolveIndex();
  var g = GOV[IDX] || null;

  // --- أقاليم ---
  var REGIONS = [
    { k: 'wb', label: 'الضفة الغربية', idx: [0, 1, 2, 3, 4, 6, 7, 8, 9, 10] },
    { k: 'jeru', label: 'القدس', idx: [5] },
    { k: 'gaza', label: 'قطاع غزة', idx: [11] }
  ];
  function regionOf(i) { for (var r = 0; r < REGIONS.length; r++) if (REGIONS[r].idx.indexOf(i) >= 0) return REGIONS[r]; return REGIONS[0]; }

  // --- بيانات تعريفية عامة (قابلة للاستبدال من الـ CMS) — ليست إحصاءات ضحايا ---
  var PROFILE = {
    0:  { region: 'الضفة الغربية', pop: '420,000',   area: '605', places: '70+ تجمّعاً',  notable: 'البلدة القديمة، عسكر، بلاطة',   admin: 'شمال الضفة' },
    1:  { region: 'الضفة الغربية', pop: '340,000',   area: '583', places: '80+ تجمّعاً',  notable: 'مخيم جنين، قباطية، يعبد',      admin: 'شمال الضفة' },
    2:  { region: 'الضفة الغربية', pop: '200,000',   area: '246', places: '40+ تجمّعاً',  notable: 'مخيم طولكرم، نور شمس، عنبتا',  admin: 'شمال الضفة' },
    3:  { region: 'الضفة الغربية', pop: '800,000',   area: '997', places: '120+ تجمّعاً', notable: 'البلدة القديمة، يطّا، دورا',    admin: 'جنوب الضفة' },
    4:  { region: 'الضفة الغربية', pop: '360,000',   area: '855', places: '70+ تجمّعاً',  notable: 'البيرة، بيتونيا، الأمعري',     admin: 'وسط الضفة' },
    5:  { region: 'القدس',         pop: '440,000',   area: '345', places: '40+ تجمّعاً',  notable: 'البلدة القديمة، شعفاط، سلوان',  admin: 'القدس' },
    6:  { region: 'الضفة الغربية', pop: '220,000',   area: '659', places: '70+ تجمّعاً',  notable: 'بيت ساحور، بيت جالا، الدهيشة', admin: 'جنوب الضفة' },
    7:  { region: 'الضفة الغربية', pop: '115,000',   area: '166', places: '35+ تجمّعاً',  notable: 'عزون، حبلة، كفر ثلث',          admin: 'شمال الضفة' },
    8:  { region: 'الضفة الغربية', pop: '80,000',    area: '204', places: '20+ تجمّعاً',  notable: 'بديا، ديرستيا، كفل حارس',      admin: 'وسط الضفة' },
    9:  { region: 'الضفة الغربية', pop: '65,000',    area: '402', places: '25+ تجمّعاً',  notable: 'طمون، عقابا، الفارعة',         admin: 'شمال الأغوار' },
    10: { region: 'الضفة الغربية', pop: '50,000',    area: '593', places: '25+ تجمّعاً',  notable: 'العوجا، الجفتلك، عقبة جبر',     admin: 'وادي الأردن' },
    11: { region: 'قطاع غزة',      pop: '2,200,000', area: '365', places: '5 محافظات',    notable: 'غزة، خان يونس، رفح، جباليا',    admin: 'قطاع غزة' }
  };
  function prof() { return PROFILE[IDX] || PROFILE[0]; }

  // --- الترتيب الوطني + أقصى قيمة ---
  var maxV = GOV.reduce(function (m, x) { return Math.max(m, x.v); }, 0);
  var rankOf = {};
  GOV.map(function (x, i) { return { i: i, v: x.v }; })
    .sort(function (a, b) { return b.v - a.v; })
    .forEach(function (o, pos) { rankOf[o.i] = pos + 1; });

  // قيمة مقياس لمحافظة واحدة — تطابق صيغة mapVals في main.js (مشتقّة/تمثيلية)
  function metricVal(metricId) {
    var m = null;
    for (var i = 0; i < METRICS.length; i++) if (METRICS[i].id === metricId) m = METRICS[i];
    if (!m) return 0;
    return g.gaza && metricId !== 'all'
      ? Math.round(g.v * m.mult * 1.4)
      : Math.round(g.v * m.mult * (0.7 + rng(g.x + g.y) * 0.7));
  }

  /* ===== بطاقة محافظة (تُعاد استخدامها في «محافظات أخرى») ===== */
  function buildCard(i) {
    var gg = GOV[i];
    var card = h('a', 'govx-card' + (gg.gaza ? ' govx-card--gaza' : ''));
    card.href = 'city_town_info.html?gov=' + i;
    card.setAttribute('data-st', '');
    card.setAttribute('aria-label', gg.n + ' — المرتبة ' + rankOf[i] + ' وطنياً — ' + fmt(gg.v) + ' حدثاً موثّقاً — استعراض الملف');
    card.appendChild(h('span', 'govx-card__rank', '#' + rankOf[i]));
    card.appendChild(h('span', 'govx-card__name', gg.n));
    card.appendChild(h('span', 'govx-card__region', regionOf(i).label));
    card.appendChild(h('span', 'govx-card__value num', fmt(gg.v)));
    card.appendChild(h('span', 'govx-card__metric-label', 'حدثاً موثّقاً'));
    var track = h('div', 'bar-track'); track.setAttribute('aria-hidden', 'true');
    var fill = h('div', 'bar-fill bar-fill--tone');
    fill.style.setProperty('--w', (maxV ? gg.v / maxV * 100 : 0) + '%');
    fill.style.setProperty('--tone', gg.gaza ? 'var(--red)' : 'var(--accent)');
    track.appendChild(fill); card.appendChild(track);
    var cta = h('span', 'govx-card__cta');
    cta.appendChild(document.createTextNode('استعراض الملف'));
    var arrow = h('span', 'govx-card__arrow fa-solid fa-chevron-left'); arrow.setAttribute('aria-hidden', 'true');
    cta.appendChild(arrow); card.appendChild(cta);
    return card;
  }

  /* ===== المسار ===== */
  function renderCrumb() {
    var c = slot('crumb'); if (c) c.textContent = g.n;
    document.title = 'محافظة ' + g.n + ' — مُعطى';
  }

  /* ===== الهيرو ===== */
  function renderHero() {
    var name = slot('hero-name'); if (name) name.textContent = g.n;
    var region = slot('hero-region'); if (region) region.textContent = prof().region;
    var rank = slot('hero-rank'); if (rank) rank.textContent = 'المرتبة #' + rankOf[IDX] + ' وطنياً حسب كثافة الأحداث';
    var coords = slot('hero-coords'); if (coords) coords.textContent = g.lat + '°N، ' + g.lng + '°E';

    var kpis = slot('hero-kpis'); if (!kpis) return; clear(kpis);
    [
      { v: fmt(g.v), label: 'حدثاً موثّقاً' },
      { v: prof().pop, label: 'نسمة (تقديري)' },
      { v: prof().area, label: 'كم² (مساحة تقديرية)' }
    ].forEach(function (k) {
      var tile = h('div', 'gov-hero__kpi');
      tile.appendChild(h('div', 'gov-hero__kpi-value num', k.v));
      tile.appendChild(h('div', 'gov-hero__kpi-label', k.label));
      kpis.appendChild(tile);
    });
  }

  /* ===== مؤشّرات تمثيليّة ===== */
  function renderStatband() {
    var box = slot('statband'); if (box) {
      clear(box);
      var detained = Math.round(g.v * 0.012 * (0.7 + rng(IDX) * 0.7));
      var defs = [
        { label: 'شهداء (تقديري)',   n: metricVal('martyrs'), tone: 'casualties' },
        { label: 'جرحى (تقديري)',    n: metricVal('injured'), tone: 'accent' },
        { label: 'معتقلون (تقديري)', n: detained,             tone: 'violations' },
        { label: 'انتهاكات (تقديري)', n: metricVal('v'),       tone: 'violations' }
      ];
      defs.forEach(function (d) {
        var c = h('div', 'counter');
        var v = h('div', 'counter__value num', fmt(d.n)); v.style.setProperty('--tone', 'var(--' + d.tone + ')');
        c.appendChild(v);
        c.appendChild(h('div', 'counter__label', d.label));
        box.appendChild(c);
      });
    }
    var note = slot('statband-note');
    if (note) note.textContent = 'أرقامٌ تمثيليّة مشتقّة من إجمالي الأحداث الموثّقة للمحافظة (' + fmt(g.v) + ') — للتوضيح فقط.';
  }

  /* ===== الخريطة (نص بديل + تقريب) ===== */
  function renderMapSub() {
    var sub = slot('map-sub');
    if (sub) sub.textContent = 'حدود محافظة ' + g.n + ' وموقعها ضمن فلسطين · كثافة التلوين تعكس حجم الأحداث الموثّقة.';
    var mapEl = $('[data-map]');
    if (mapEl) mapEl.setAttribute('aria-label', 'خريطة محافظة ' + g.n + ' ضمن خريطة فلسطين التفاعلية — استخدم القائمة الجانبية كبديل نصّي');
  }

  /* ===== قائمة «محافظات أخرى» (رتبة + روابط) ===== */
  function renderOtherGovs() {
    var box = slot('other-govs'); if (!box) return; clear(box);
    var others = GOV.map(function (x, i) { return { i: i, v: x.v }; })
      .filter(function (o) { return o.i !== IDX; })
      .sort(function (a, b) { return b.v - a.v; })
      .slice(0, 6);
    others.forEach(function (o) {
      var gg = GOV[o.i];
      var item = h('a', 'rank-item'); item.href = 'city_town_info.html?gov=' + o.i;
      item.setAttribute('aria-label', gg.n + ' — ' + fmt(gg.v) + ' حدثاً — فتح الملف');
      var head = h('div', 'rank-item__head');
      head.appendChild(h('span', 'rank-item__name', gg.n));
      head.appendChild(h('span', 'rank-item__value num', fmt(gg.v)));
      item.appendChild(head);
      var track = h('div', 'bar-track');
      var fill = h('div', 'bar-fill');
      fill.style.setProperty('--w', (maxV ? gg.v / maxV * 100 : 0) + '%');
      fill.style.setProperty('--tone', gg.gaza ? 'var(--red)' : 'var(--accent)');
      track.appendChild(fill); item.appendChild(track);
      box.appendChild(item);
    });
  }

  /* ===== الجغرافيا والسكّان ===== */
  function renderFacts() {
    var box = slot('facts'); if (!box) return; clear(box);
    var p = prof();
    [
      { v: p.pop, label: 'عدد السكّان (تقديري)' },
      { v: p.area + ' كم²', label: 'المساحة' },
      { v: p.places, label: 'التجمّعات السكنية' },
      { v: p.notable, label: 'أبرز المدن والمخيّمات' },
      { v: p.admin, label: 'التبعية الإدارية' }
    ].forEach(function (f) {
      var tile = h('div', 'gov-fact');
      tile.appendChild(h('div', 'gov-fact__value', f.v));
      tile.appendChild(h('div', 'gov-fact__label', f.label));
      box.appendChild(tile);
    });
  }

  /* ===== موجز الأحداث (مولّد محلّي — قوالب مطابقة لـ daily.js) ===== */
  var AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  function fmtDate(d) { return d.getDate() + ' ' + AR_MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }
  var TPL = {
    violations: [
      { t: 'اقتحام', d: 'اقتحمت قوات الاحتلال {g} وداهمت عدداً من المنازل وفتّشتها وعاثت فيها فساداً.' },
      { t: 'اعتقال', d: 'اعتقلت قوات الاحتلال {n} مواطنين من {g} بعد مداهمة منازلهم والعبث بمحتوياتها.' },
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
  var TONE_OF = { violations: 'violations', qualitative: 'resistance', popular: 'accent' };
  var BADGE_OF = { violations: 'rbadge--violations', qualitative: 'rbadge--resistance', popular: 'rbadge--accent' };

  function renderFeed() {
    var sub = slot('feed-sub'); if (sub) sub.textContent = 'أمثلة توضيحية تعكس أنماط الوقائع الميدانية في محافظة ' + g.n;
    var box = slot('feed'); if (!box) return; clear(box);
    var seq = ['violations', 'popular', 'violations', 'qualitative', 'violations', 'popular', 'violations', 'violations'];
    var now = new Date();
    seq.forEach(function (cat, k) {
      var pool = TPL[cat], ty = pool[(k + IDX) % pool.length];
      var date = new Date(now.getTime() - Math.round(k * 1.3) * 86400000);
      var n = 2 + ((k + IDX) % 6);
      var item = h('div', 'gov-feed__item');
      item.style.setProperty('--tone', 'var(--' + TONE_OF[cat] + ')');
      var badge = h('span', 'rbadge ' + BADGE_OF[cat], ty.t);
      item.appendChild(badge);
      item.appendChild(h('span', 'gov-feed__date num', fmtDate(date)));
      item.appendChild(h('p', 'gov-feed__desc', ty.d.replace('{g}', g.n).replace('{n}', String(n))));
      box.appendChild(item);
    });
  }

  /* ===== محافظات ذات صلة ===== */
  function renderRelated() {
    var box = slot('related'); if (!box) return; clear(box);
    var neighbors = regionOf(IDX).idx.filter(function (i) { return i !== IDX; });
    var rest = GOV.map(function (x, i) { return { i: i, v: x.v }; })
      .filter(function (o) { return o.i !== IDX && neighbors.indexOf(o.i) < 0; })
      .sort(function (a, b) { return b.v - a.v; })
      .map(function (o) { return o.i; });
    var ordered = neighbors.concat(rest).slice(0, 4);
    ordered.forEach(function (i) { box.appendChild(buildCard(i)); });
  }

  function zoomActive() {
    if (window.M3 && window.M3.zoomToGov) window.M3.zoomToGov(IDX);
  }

  function init() {
    if (!g) return;
    renderCrumb();
    renderHero();
    renderStatband();
    renderMapSub();
    renderOtherGovs();
    renderFacts();
    renderFeed();
    renderRelated();
    // الخريطة يبنيها main.js؛ نقرّبها للمحافظة بعد استقرار fitBounds/invalidateSize
    setTimeout(zoomActive, 350);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
