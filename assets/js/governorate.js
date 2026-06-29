/* ==========================================================================
   مُعطى — الملف المعلوماتي للمحافظة (city_town_info.html)
   governorate.js — «Governorate Intelligence Profile» سرديّ بثماني مراحل
   (تعريف ← مؤشّرات ← موقع ← تحليل ← أحداث ← خطّ زمني ← مقارنة ← سياق اليوم).
   انضباط البيانات: الموثّق الوحيد لكل محافظة = GOV[i].v + الإحداثيات + الحدود
   (PS_GOV_GEO) + PROFILE المرجعي؛ كل ما عداه مشتقّ ويُوسَم «تقديري/تمثيلي/نموذج».
   مجموع GOV.v=462,657 لا يطابق الرقم الوطني المنشور 434,505 → لا «✓ موثّق» على v،
   والنسبة «من مجموع المحافظات الـ12». الألوان في كل SVG عبر var() لتستجيب للسمة.
   ========================================================================== */
(function () {
  'use strict';

  var SVGNS = 'http://www.w3.org/2000/svg';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var slot = function (n) { return $('[data-render="' + n + '"]'); };
  function h(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function svg(tag, attrs, kids) { var e = document.createElementNS(SVGNS, tag); if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]); if (kids) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) { if (c) e.appendChild(c); }); return e; }
  function clear(e) { if (e) while (e.firstChild) e.removeChild(e.firstChild); }

  var M3 = window.M3 || {};
  var DATA = M3.DATA || {};
  var GOV = DATA.GOV || [];
  var METRICS = DATA.METRICS || [];
  var OPS = DATA.OPS || { q: { items: [] }, p: { items: [] }, v: { items: [] } };
  var CAL = DATA.CAL_EVENTS || {};
  var fmt = M3.fmt || function (n) { return Math.round(n).toLocaleString('en-US'); };
  var rng = M3.rng || function (s) { var x = Math.sin(s * 12.9898) * 43758.5453; return x - Math.floor(x); };

  var AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  function fmtDate(d) { return d.getDate() + ' ' + AR_MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }

  /* ----- المحافظة النشطة ----- */
  function resolveIndex() {
    var m = /[?&]gov=(\d+)/.exec(location.search);
    var i = m ? parseInt(m[1], 10) : (typeof window.M3_GOV_INDEX === 'number' ? window.M3_GOV_INDEX : 0);
    if (isNaN(i)) i = 0;
    return Math.max(0, Math.min(GOV.length - 1, i));
  }
  var IDX = resolveIndex();
  var g = GOV[IDX] || null;

  var REGIONS = [
    { k: 'wb', label: 'الضفة الغربية', idx: [0, 1, 2, 3, 4, 6, 7, 8, 9, 10] },
    { k: 'jeru', label: 'القدس', idx: [5] },
    { k: 'gaza', label: 'قطاع غزة', idx: [11] }
  ];
  function regionOf(i) { for (var r = 0; r < REGIONS.length; r++) if (REGIONS[r].idx.indexOf(i) >= 0) return REGIONS[r]; return REGIONS[0]; }

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

  var totalNational = GOV.reduce(function (m, x) { return m + x.v; }, 0) || 1;
  var maxV = GOV.reduce(function (m, x) { return Math.max(m, x.v); }, 0);
  var rankOf = {};
  GOV.map(function (x, i) { return { i: i, v: x.v }; }).sort(function (a, b) { return b.v - a.v; })
    .forEach(function (o, pos) { rankOf[o.i] = pos + 1; });

  function metricVal(metricId) {
    var m = null;
    for (var i = 0; i < METRICS.length; i++) if (METRICS[i].id === metricId) m = METRICS[i];
    if (!m) return 0;
    return g.gaza && metricId !== 'all'
      ? Math.round(g.v * m.mult * 1.4)
      : Math.round(g.v * m.mult * (0.7 + rng(g.x + g.y) * 0.7));
  }
  function scaledItems(opsKey, govCatTotal) {
    var items = (OPS[opsKey] && OPS[opsKey].items) || [];
    var natTotal = items.reduce(function (a, x) { return a + x.v; }, 0) || 1;
    var f = govCatTotal / natTotal;
    return items.map(function (x) { return { n: x.n, v: Math.max(1, Math.round(x.v * f)) }; });
  }
  var CAT = { v: metricVal('v'), p: metricVal('p'), q: metricVal('q') };

  // أحدث توثيق في السجلّ الوطني (مشتقّ من أحدث مفتاح CAL، لا تاريخ مختلق)
  function latestCalLabel() {
    var best = null, bestTs = -1;
    Object.keys(CAL).forEach(function (k) {
      var p = k.split('-'); var ts = new Date(+p[0], (+p[1]) - 1, +p[2]).getTime();
      if (ts > bestTs) { bestTs = ts; best = p; }
    });
    return best ? AR_MONTHS[(+best[1]) - 1] + ' ' + best[0] : '';
  }

  /* ===== بطاقة محافظة (للكاروسيل) ===== */
  function buildCard(i) {
    var gg = GOV[i];
    var card = h('a', 'govx-card' + (gg.gaza ? ' govx-card--gaza' : ''));
    card.href = 'city_town_info.html?gov=' + i;
    card.setAttribute('data-st', '');
    card.setAttribute('aria-label', gg.n + ' — المرتبة ' + rankOf[i] + ' — ' + fmt(gg.v) + ' حدثاً مرصوداً — استعراض الملف');
    card.appendChild(h('span', 'govx-card__rank', '#' + rankOf[i]));
    card.appendChild(h('span', 'govx-card__name', gg.n));
    card.appendChild(h('span', 'govx-card__region', regionOf(i).label));
    card.appendChild(h('span', 'govx-card__value num', fmt(gg.v)));
    card.appendChild(h('span', 'govx-card__metric-label', 'حدثاً مرصوداً'));
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

  function renderCrumb() {
    var c = slot('crumb'); if (c) c.textContent = g.n;
    document.title = 'محافظة ' + g.n + ' — مُعطى';
  }

  /* ===== 1) البطل السرديّ ===== */
  function renderHero() {
    var p = prof();
    var eyebrow = slot('hero-eyebrow'); if (eyebrow) eyebrow.textContent = g.gaza ? 'قطاع غزة' : 'محافظة فلسطينية';
    var name = slot('hero-name'); if (name) name.textContent = g.n;
    var region = slot('hero-region'); if (region) region.textContent = p.region;
    var rank = slot('hero-rank'); if (rank) rank.textContent = 'المرتبة #' + rankOf[IDX] + ' من 12 محافظة';
    var desc = slot('hero-desc');
    if (desc) {
      desc.textContent = g.gaza
        ? 'قطاع غزة تجمّعٌ لخمس محافظات على ساحل المتوسّط؛ من أبرز مدنه: ' + p.notable + '.'
        : 'محافظةٌ في ' + p.region + '، ' + p.admin + '؛ من أبرز تجمّعاتها: ' + p.notable + '.';
    }
    var total = slot('hero-total'); if (total) total.textContent = fmt(g.v);
    var updated = slot('hero-updated');
    if (updated) { var lbl = latestCalLabel(); updated.textContent = lbl ? 'أحدث توثيق في السجلّ الوطني: ' + lbl : ''; }
    renderSilhouette(slot('hero-silhouette'));
  }

  // سيلويت يُبرز موقع المحافظة داخل فلسطين (مبنيّ محليّاً من الحدود الحقيقية، يميّز IDX)
  function renderSilhouette(box) {
    if (!box || !window.PS_GOV_GEO || !window.PS_GOV_GEO.features) return; clear(box);
    var geo = window.PS_GOV_GEO;
    var idxFor = (M3 && M3.govIndexForName) ? M3.govIndexForName : function () { return -1; };
    function rings(f, cb) { var gm = f.geometry; if (!gm) return; if (gm.type === 'Polygon') cb(gm.coordinates[0]); else if (gm.type === 'MultiPolygon') gm.coordinates.forEach(function (pp) { cb(pp[0]); }); }
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    geo.features.forEach(function (f) { rings(f, function (r) { r.forEach(function (c) { if (c[0] < minX) minX = c[0]; if (c[0] > maxX) maxX = c[0]; if (c[1] < minY) minY = c[1]; if (c[1] > maxY) maxY = c[1]; }); }); });
    if (minX === Infinity) return;
    var cosL = Math.cos((minY + maxY) / 2 * Math.PI / 180);
    var W = 260, PAD = 10;
    var sc = (W - 2 * PAD) / ((maxX - minX) * cosL);
    var H = (maxY - minY) * sc + 2 * PAD;
    function px(lng) { return PAD + (lng - minX) * cosL * sc; }
    function py(lat) { return PAD + (maxY - lat) * sc; }
    var els = [];
    geo.features.forEach(function (f) {
      var active = idxFor(f.properties && f.properties.name) === IDX;
      rings(f, function (r) {
        var d = 'M';
        r.forEach(function (c, i) { d += (i ? ' L ' : ' ') + px(c[0]).toFixed(1) + ',' + py(c[1]).toFixed(1); });
        d += ' Z';
        var pa = svg('path', { d: d });
        pa.style.fill = active ? 'var(--accent)' : 'var(--border)';
        pa.style.fillOpacity = active ? '1' : '0.5';
        pa.style.stroke = 'var(--surface)';
        pa.style.strokeWidth = '0.6';
        els.push(pa);
      });
    });
    var s = svg('svg', { viewBox: '0 0 ' + W.toFixed(0) + ' ' + H.toFixed(0), width: '100%', role: 'img', 'aria-label': 'موقع محافظة ' + g.n + ' داخل خريطة فلسطين (تمييز جغرافي للموقع فقط)' }, els);
    s.setAttribute('class', 'gov-silhouette__svg');
    box.appendChild(s);
    box.appendChild(h('p', 'gov-hero__visual-cap', (g.gaza ? 'موقع القطاع' : 'موقع المحافظة') + ' ضمن فلسطين · المرتبة #' + rankOf[IDX] + ' من 12'));
  }

  /* ===== 2) أهم المؤشرات — شبكة هرميّة ===== */
  function renderMetrics() {
    var box = slot('gov-metrics'); if (!box) return; clear(box);
    var share = (g.v / totalNational * 100);
    function cell(area, cls, value, label, badge, tone) {
      var c = h('div', 'counter ' + cls); c.style.setProperty('grid-area', area);
      var v = h('div', 'counter__value num', value); if (tone) v.style.setProperty('--tone', 'var(--' + tone + ')'); c.appendChild(v);
      c.appendChild(h('div', 'counter__label', label));
      if (badge) { var b = h('span', 'rbadge', badge); b.style.setProperty('--tone', 'var(--' + (tone || 'accent') + ')'); c.appendChild(b); }
      return c;
    }
    var lead = h('div', 'counter counter--lead'); lead.style.setProperty('grid-area', 'lead');
    var lv = h('div', 'counter__value num', fmt(g.v)); lv.style.setProperty('--tone', 'var(--accent)'); lead.appendChild(lv);
    var lmeta = h('div', 'counter--lead__meta');
    lmeta.appendChild(h('div', 'counter__label', 'إجمالي الأحداث المرصودة'));
    lmeta.appendChild(h('p', 'counter--lead__note', 'حصيلةٌ تراكميّة منذ بداية الرصد — المرتبة #' + rankOf[IDX] + ' من 12 محافظة، وتمثّل ' + share.toFixed(1) + '٪ من مجموع المحافظات الـ12.'));
    var lb = h('span', 'rbadge', 'حصيلة تراكمية مرصودة'); lb.style.setProperty('--tone', 'var(--accent)'); lmeta.appendChild(lb);
    lead.appendChild(lmeta); box.appendChild(lead);
    box.appendChild(cell('rank', 'counter--sec', '#' + rankOf[IDX], 'المرتبة من 12 محافظة', null, null));
    box.appendChild(cell('share', 'counter--sec', share.toFixed(1) + '٪', 'من مجموع المحافظات الـ12', 'محسوبة', 'crimes'));
    box.appendChild(cell('c1', 'counter--cat', fmt(CAT.v), 'انتهاكات', 'تقديري', 'violations'));
    box.appendChild(cell('c2', 'counter--cat', fmt(CAT.p), 'مقاومة شعبية', 'تقديري', 'resistance'));
    box.appendChild(cell('c3', 'counter--cat', fmt(CAT.q), 'مقاومة نوعية', 'تقديري', 'resistance'));
  }

  /* ===== 3) الموقع والتكوين ===== */
  function renderMapSub() {
    var sub = slot('map-sub'); if (sub) sub.textContent = 'حدود محافظة ' + g.n + ' وموقعها ضمن فلسطين · مرّر فوق المحافظات لعدد أحداثها وانقرها للتقريب.';
    var mapEl = $('[data-map]'); if (mapEl) mapEl.setAttribute('aria-label', 'خريطة محافظة ' + g.n + ' ضمن خريطة فلسطين التفاعلية — البطاقات والحقائق المجاورة بديلٌ نصّي');
  }
  function renderCities() {
    var box = slot('gov-cities'); if (!box) return; clear(box);
    prof().notable.split('،').forEach(function (nm) {
      box.appendChild(h('span', 'gov-cities__chip', nm.trim()));
    });
  }
  function renderFacts() {
    var box = slot('facts'); if (!box) return; clear(box);
    var p = prof();
    [
      { v: p.area + ' كم²', label: 'المساحة' },
      { v: p.pop, label: 'عدد السكّان (تقديري)' },
      { v: p.places, label: 'التجمّعات السكنية' },
      { v: p.admin, label: 'التبعية الإدارية' }
    ].forEach(function (f) {
      var tile = h('div', 'gov-fact'); tile.appendChild(h('div', 'gov-fact__value', f.v)); tile.appendChild(h('div', 'gov-fact__label', f.label)); box.appendChild(tile);
    });
  }

  /* ===== 4) التحليلات (دونات + تفصيلات + مقارنة v) ===== */
  function renderDonut() {
    var box = slot('donut'); if (!box) return; clear(box);
    var segs = [
      { n: 'انتهاكات', v: CAT.v, tone: 'violations', soft: false },
      { n: 'مقاومة شعبية', v: CAT.p, tone: 'resistance', soft: false },
      { n: 'مقاومة نوعية', v: CAT.q, tone: 'resistance', soft: true }
    ];
    var tot = segs.reduce(function (a, s) { return a + s.v; }, 0) || 1;
    var R = 78, r = 50, cx = 100, cy = 100, a0 = -Math.PI / 2, els = [];
    segs.forEach(function (s) {
      var frac = s.v / tot, a1 = a0 + frac * Math.PI * 2, lg = frac > 0.5 ? 1 : 0;
      var x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0), x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
      var xi1 = cx + r * Math.cos(a1), yi1 = cy + r * Math.sin(a1), xi0 = cx + r * Math.cos(a0), yi0 = cy + r * Math.sin(a0);
      var d = 'M ' + x0 + ',' + y0 + ' A ' + R + ',' + R + ' 0 ' + lg + ' 1 ' + x1 + ',' + y1 + ' L ' + xi1 + ',' + yi1 + ' A ' + r + ',' + r + ' 0 ' + lg + ' 0 ' + xi0 + ',' + yi0 + ' Z';
      var pa = svg('path', { d: d }); pa.style.fill = 'var(--' + s.tone + ')'; if (s.soft) pa.setAttribute('opacity', '0.5');
      els.push(pa);
      a0 = a1;
    });
    var pct = (CAT.v / tot * 100);
    function dtxt(attrs, str, cv) { var t = svg('text', attrs, [document.createTextNode(str)]); t.style.fill = 'var(--' + cv + ')'; return t; }
    els.push(dtxt({ x: cx, y: cy - 4, 'text-anchor': 'middle', 'font-size': 21, 'font-weight': 700 }, pct.toFixed(0) + '٪', 'ink'));
    els.push(dtxt({ x: cx, y: cy + 14, 'text-anchor': 'middle', 'font-size': 10 }, 'انتهاكات', 'muted'));
    var s2 = svg('svg', { viewBox: '0 0 200 200', width: '100%', height: 190, role: 'img', 'aria-label': 'توزّع فئات الأحداث في ' + g.n + ' (تمثيلي): انتهاكات ' + pct.toFixed(0) + '٪' }, els);
    box.appendChild(s2);
    var lg2 = h('div', 'gov-legend');
    segs.forEach(function (s) {
      var it = h('span', 'gov-legend__item');
      var sw = h('span', 'gov-legend__swatch'); sw.style.setProperty('background', 'var(--' + s.tone + ')'); if (s.soft) sw.style.setProperty('opacity', '0.5');
      it.appendChild(sw); it.appendChild(document.createTextNode(s.n));
      lg2.appendChild(it);
    });
    box.appendChild(lg2);
  }
  function renderBreakdowns() {
    var qb = slot('bd-qualitative');
    if (qb) {
      clear(qb);
      var qit = scaledItems('q', CAT.q), qmax = Math.max.apply(null, qit.map(function (x) { return x.v; })) || 1;
      qit.forEach(function (x) {
        var tile = h('div', 'bd-tile');
        tile.appendChild(h('div', 'bd-tile__value num', fmt(x.v)));
        tile.appendChild(h('div', 'bd-tile__label', x.n));
        var track = h('div', 'bd-tile__track'); var fill = h('div', 'bd-tile__fill'); fill.style.setProperty('--w', (x.v / qmax * 100) + '%'); track.appendChild(fill); tile.appendChild(track);
        qb.appendChild(tile);
      });
    }
    var pb = slot('bd-popular');
    if (pb) {
      clear(pb);
      var pit = scaledItems('p', CAT.p), pmax = Math.max.apply(null, pit.map(function (x) { return x.v; })) || 1;
      pit.forEach(function (x) {
        var row = h('div', 'bd-row');
        var head = h('div', 'bd-row__head');
        head.appendChild(h('span', 'bd-row__name', x.n));
        head.appendChild(h('span', 'bd-row__value num', fmt(x.v)));
        row.appendChild(head);
        var track = h('div', 'bd-track'); var fill = h('div', 'bd-fill'); fill.style.setProperty('--w', (x.v / pmax * 100) + '%'); track.appendChild(fill); row.appendChild(track);
        pb.appendChild(row);
      });
    }
    var vb = slot('bd-violations');
    if (vb) {
      clear(vb);
      var vit = scaledItems('v', CAT.v), vmax = Math.max.apply(null, vit.map(function (x) { return x.v; })) || 1;
      vit.forEach(function (x) {
        var row = h('div', 'bd-row');
        var head = h('div', 'bd-row__head');
        head.appendChild(h('span', 'bd-row__name', x.n));
        head.appendChild(h('span', 'bd-row__value num', fmt(x.v)));
        row.appendChild(head);
        var track = h('div', 'bd-track'); var fill = h('div', 'bd-fill'); fill.style.setProperty('--w', (x.v / vmax * 100) + '%'); fill.style.setProperty('--tone', 'var(--violations)'); track.appendChild(fill); row.appendChild(track);
        vb.appendChild(row);
      });
    }
  }
  // مقارنة المقياس بأرقام v الحقيقيّة (ترتيب نسبيّ محافظة-مقابل-محافظة)
  function renderCompare() {
    var box = slot('gov-compare'); if (!box) return; clear(box);
    var avg = totalNational / (GOV.length || 1);
    var top = GOV.reduce(function (a, x) { return x.v > a.v ? x : a; }, GOV[0]);
    var rows = [
      { n: g.n + ' — هذه المحافظة', v: g.v, hi: true },
      { n: 'الأعلى توثيقاً: ' + top.n, v: top.v, hi: false },
      { n: 'متوسّط المحافظات الـ12', v: Math.round(avg), hi: false }
    ];
    var mx = Math.max.apply(null, rows.map(function (x) { return x.v; })) || 1;
    rows.forEach(function (r) {
      var row = h('div', 'bd-row');
      var head = h('div', 'bd-row__head');
      head.appendChild(h('span', 'bd-row__name' + (r.hi ? ' is-current' : ''), r.n));
      head.appendChild(h('span', 'bd-row__value num', fmt(r.v)));
      row.appendChild(head);
      var track = h('div', 'bd-track'); var fill = h('div', 'bd-fill'); fill.style.setProperty('--w', (r.v / mx * 100) + '%'); fill.style.setProperty('--tone', r.hi ? 'var(--accent)' : 'var(--muted)'); track.appendChild(fill); row.appendChild(track);
      box.appendChild(row);
    });
  }

  /* ===== 5) أنماط الوقائع — معاينة + مستكشف كامل مطويّ ===== */
  var CATS = { violations: { label: 'انتهاك', tone: 'violations' }, qualitative: { label: 'مقاومة نوعية', tone: 'resistance' }, popular: { label: 'مقاومة شعبية', tone: 'accent' } };
  var TYPE_FILTERS = [{ k: 'all', label: 'الكل' }, { k: 'violations', label: 'انتهاكات' }, { k: 'qualitative', label: 'نوعية' }, { k: 'popular', label: 'شعبية' }];
  var TPL = {
    violations: [
      { t: 'اقتحام', d: 'اقتحمت قوات الاحتلال {g} وداهمت عدداً من المنازل وفتّشتها وعاثت فيها فساداً.' },
      { t: 'اعتقال', d: 'اعتقلت قوات الاحتلال {n} مواطنين من {g} بعد مداهمة منازلهم والعبث بمحتوياتها.' },
      { t: 'هدم', d: 'هدمت جرافات الاحتلال منشأةً سكنيةً في {g} بحجّة عدم الترخيص.' },
      { t: 'اعتداء مستوطنين', d: 'اعتدى مستوطنون على ممتلكات الفلسطينيين وأراضيهم في {g} تحت حماية الاحتلال.' },
      { t: 'إصابة', d: 'أُصيب {n} مواطنين بالرصاص والاختناق خلال مواجهات اندلعت في {g}.' },
      { t: 'تضييقات الحواجز', d: 'شدّدت قوات الاحتلال إجراءاتها على حواجز {g} وأعاقت حركة المواطنين لساعات.' }
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
  // مسمّيات عامّة غير منسوبة — لا تُسنَد الأحداث التمثيليّة لوكالاتٍ حقيقيّة (التزام انضباط البيانات)
  var SOURCES = ['رصد ميداني', 'توثيق محلّي', 'بلاغات الأهالي', 'متابعة ميدانية', 'مصدر محلّي'];
  function buildIncidents() {
    var out = [], seq = ['violations', 'violations', 'popular', 'qualitative', 'violations', 'popular', 'violations', 'violations'];
    var today = new Date(), N = 48;
    for (var i = 0; i < N; i++) {
      var cat = seq[(i + IDX) % seq.length], pool = TPL[cat], ty = pool[(i + IDX) % pool.length];
      var date = new Date(today.getTime() - Math.round(i * 0.9) * 86400000);
      var n = 2 + ((i + IDX) % 6);
      out.push({ id: i + 1, ts: date.getTime(), date: fmtDate(date), type: ty.t, cat: cat, desc: ty.d.replace('{g}', g.n).replace('{n}', String(n)), source: SOURCES[(i + IDX) % SOURCES.length] });
    }
    return out;
  }
  var INCIDENTS = [];
  var coll = new Intl.Collator('ar');
  var ex = { type: 'all', q: '', sort: 'date', dir: 'desc', view: 'table', shown: 8 };
  var PER = 8, _expanded = {};

  function typeTag(r) { var tag = h('span', 'dtype', r.type); tag.style.setProperty('--tone', 'var(--' + CATS[r.cat].tone + ')'); return tag; }

  // بطاقات المعاينة (آخر 5) — حاوية مستقلّة لا تشارك أي data-* مع المستكشف
  function renderLatestPreview() {
    var box = slot('latest-preview'); if (!box) return; clear(box);
    var grid = h('div', 'dcards');
    INCIDENTS.slice(0, 5).forEach(function (r) {
      var card = h('article', 'dcard');
      var head = h('div', 'dcard__head'); head.appendChild(typeTag(r)); head.appendChild(h('span', 'dcard__date num', r.date)); card.appendChild(head);
      card.appendChild(h('p', 'dcard__desc', r.desc));
      var foot = h('div', 'dcard__meta');
      var badge = h('span', 'rbadge', 'نموذج توضيحي'); badge.style.setProperty('--tone', 'var(--muted)');
      foot.appendChild(badge);
      card.appendChild(foot); grid.appendChild(card);
    });
    box.appendChild(grid);
  }

  function exFiltered() {
    var list = INCIDENTS.filter(function (r) {
      if (ex.type !== 'all' && r.cat !== ex.type) return false;
      if (ex.q && (r.desc + ' ' + r.type).indexOf(ex.q) < 0) return false;
      return true;
    });
    var key = ex.sort, mul = ex.dir === 'asc' ? 1 : -1;
    list.sort(function (a, b) { return key === 'date' ? (a.ts - b.ts) * mul : coll.compare(a.type, b.type) * mul; });
    return list;
  }
  function renderTypeFilters() {
    var box = slot('exp-typefilters'); if (!box) return; clear(box);
    TYPE_FILTERS.forEach(function (tf) {
      var b = h('button', 'chip chip--sm' + (tf.k === ex.type ? ' is-active' : ''), tf.label); b.type = 'button';
      b.setAttribute('aria-pressed', String(tf.k === ex.type));
      b.addEventListener('click', function () { ex.type = tf.k; ex.shown = PER; renderTypeFilters(); renderExplorer(); });
      box.appendChild(b);
    });
  }
  function sortHeader(label, key) {
    var th = h('th', 'dtable__th' + (ex.sort === key ? ' is-sorted' : ''));
    th.setAttribute('scope', 'col'); th.setAttribute('aria-sort', ex.sort === key ? (ex.dir === 'asc' ? 'ascending' : 'descending') : 'none');
    th.setAttribute('role', 'button'); th.setAttribute('aria-label', label + ' — ترتيب'); th.tabIndex = 0;
    th.appendChild(document.createTextNode(label + ' '));
    var ic = h('span', 'dtable__sort fa-solid ' + (ex.sort === key ? (ex.dir === 'asc' ? 'fa-caret-up' : 'fa-caret-down') : 'fa-sort')); ic.setAttribute('aria-hidden', 'true'); th.appendChild(ic);
    function go() { if (ex.sort === key) ex.dir = ex.dir === 'asc' ? 'desc' : 'asc'; else { ex.sort = key; ex.dir = 'desc'; } renderExplorer(); }
    th.addEventListener('click', go);
    th.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    return th;
  }
  function renderTable(box, list) {
    var wrap = h('div', 'dtable-wrap'), table = h('table', 'dtable');
    var thead = document.createElement('thead'), trh = document.createElement('tr');
    trh.appendChild(sortHeader('التاريخ', 'date'));
    trh.appendChild(sortHeader('النوع', 'type'));
    var thDesc = h('th', null, 'الوصف'); thDesc.setAttribute('scope', 'col'); trh.appendChild(thDesc);
    var thMore = h('th'); thMore.setAttribute('scope', 'col'); thMore.appendChild(h('span', 'visually-hidden', 'تفاصيل')); trh.appendChild(thMore);
    thead.appendChild(trh); table.appendChild(thead);
    var tbody = document.createElement('tbody');
    list.slice(0, ex.shown).forEach(function (r) {
      var tr = h('tr', 'dtable__row');
      var tdDate = h('td', 'dtable__date'); tdDate.appendChild(h('span', 'num', r.date)); tr.appendChild(tdDate);
      var tdType = document.createElement('td'); tdType.appendChild(typeTag(r)); tr.appendChild(tdType);
      tr.appendChild(h('td', 'dtable__desc', r.desc));
      var tdBtn = document.createElement('td');
      var btn = h('button', 'dtable__toggle', _expanded[r.id] ? '−' : '+'); btn.type = 'button';
      btn.setAttribute('aria-label', _expanded[r.id] ? 'إخفاء التفاصيل' : 'عرض التفاصيل'); btn.setAttribute('aria-expanded', String(!!_expanded[r.id])); btn.setAttribute('aria-controls', 'gdet-' + r.id);
      tdBtn.appendChild(btn); tr.appendChild(tdBtn); tbody.appendChild(tr);
      var det = h('tr', 'dtable__detail'); det.id = 'gdet-' + r.id;
      var dtd = document.createElement('td'); dtd.colSpan = 4;
      var inner = h('div', 'dtable__detail-inner');
      inner.appendChild(h('p', 'dtable__detail-desc', r.desc));
      var meta = h('div', 'dtable__detail-meta');
      var md = h('span'); md.innerHTML = '<i class="fa-solid fa-calendar-day" aria-hidden="true"></i> '; md.appendChild(document.createTextNode(r.date)); meta.appendChild(md);
      var ms = h('span'); ms.innerHTML = '<i class="fa-solid fa-folder-open" aria-hidden="true"></i> '; ms.appendChild(document.createTextNode('المصدر: ' + r.source)); meta.appendChild(ms);
      inner.appendChild(meta); dtd.appendChild(inner); det.appendChild(dtd);
      if (!_expanded[r.id]) det.hidden = true;
      tbody.appendChild(det);
      function toggle() { _expanded[r.id] = !_expanded[r.id]; det.hidden = !_expanded[r.id]; btn.textContent = _expanded[r.id] ? '−' : '+'; btn.setAttribute('aria-expanded', String(_expanded[r.id])); tr.classList.toggle('is-open', _expanded[r.id]); }
      btn.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
      tr.addEventListener('click', toggle);
      tr.classList.toggle('is-open', !!_expanded[r.id]);
    });
    table.appendChild(tbody); wrap.appendChild(table); box.appendChild(wrap);
  }
  function renderCards(box, list) {
    var grid = h('div', 'dcards');
    list.slice(0, ex.shown).forEach(function (r) {
      var card = h('article', 'dcard');
      var head = h('div', 'dcard__head'); head.appendChild(typeTag(r)); head.appendChild(h('span', 'dcard__date num', r.date)); card.appendChild(head);
      card.appendChild(h('p', 'dcard__desc', r.desc));
      var meta = h('div', 'dcard__meta');
      var ds = h('span', 'dcard__source'); ds.innerHTML = '<i class="fa-solid fa-folder-open" aria-hidden="true"></i> '; ds.appendChild(document.createTextNode(r.source)); meta.appendChild(ds);
      card.appendChild(meta); grid.appendChild(card);
    });
    box.appendChild(grid);
  }
  function renderExplorer() {
    var list = exFiltered();
    var countEl = slot('exp-count');
    if (countEl) { clear(countEl); countEl.appendChild(h('strong', 'num', String(Math.min(ex.shown, list.length)))); countEl.appendChild(document.createTextNode(' من ')); countEl.appendChild(h('strong', 'num', String(list.length))); countEl.appendChild(document.createTextNode(' حدثاً')); }
    var box = slot('explorer'); if (!box) return; clear(box);
    if (!list.length) {
      var empty = h('div', 'archive-empty');
      var ic = h('div', 'archive-empty__icon fa-solid fa-magnifying-glass'); ic.setAttribute('aria-hidden', 'true'); empty.appendChild(ic);
      empty.appendChild(h('p', 'archive-empty__title', 'لا توجد أحداث مطابقة'));
      empty.appendChild(h('p', 'archive-empty__text', 'جرّب تعديل الفلتر أو مسح البحث.'));
      box.appendChild(empty); toggleMore(list); return;
    }
    if (ex.view === 'cards') renderCards(box, list); else renderTable(box, list);
    toggleMore(list);
  }
  function toggleMore(list) { var more = $('[data-loadmore]'); if (more && more.parentElement) more.parentElement.hidden = ex.shown >= list.length || !list.length; }
  function exportCsv() {
    var list = exFiltered(), rows = [['التاريخ', 'النوع', 'التصنيف', 'الوصف', 'المصدر']];
    list.forEach(function (r) { rows.push([r.date, r.type, CATS[r.cat].label, r.desc, r.source]); });
    var csv = '﻿' + rows.map(function (row) { return row.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'mo3ta-' + g.n + '-events.csv';
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function bindExplorer() {
    var search = $('[data-search]');
    if (search) { var t = null; search.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { ex.q = search.value.trim(); ex.shown = PER; renderExplorer(); }, 200); }); }
    $$('[data-view]').forEach(function (b) { b.addEventListener('click', function () { ex.view = b.getAttribute('data-view'); $$('[data-view]').forEach(function (x) { var on = x === b; x.classList.toggle('is-active', on); x.setAttribute('aria-pressed', String(on)); }); renderExplorer(); }); });
    var more = $('[data-loadmore]'); if (more) more.addEventListener('click', function () { ex.shown += PER; renderExplorer(); });
    var exp = $('[data-export]'); if (exp) exp.addEventListener('click', exportCsv);
  }
  // زر «عرض جميع الأحداث» يكشف المستكشف الكامل المطويّ (bindExplorer يُستدعى مرّة واحدة في init)
  function bindExplorerToggle() {
    var btn = $('[data-explorer-toggle]'), wrap = $('[data-explorer-wrap]'); if (!btn || !wrap) return;
    btn.addEventListener('click', function () {
      var show = wrap.hidden;
      wrap.hidden = !show;
      btn.setAttribute('aria-expanded', String(show));
      var lbl = btn.querySelector('[data-toggle-label]'); if (lbl) lbl.textContent = show ? 'إخفاء جميع الأحداث' : 'عرض جميع الأحداث';
      if (show) { renderExplorer(); wrap.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
    });
  }

  /* ===== 6) التطوّر الزمني — سياق وطنيّ موثّق ===== */
  var TONE_OF = { 'تقرير دوري': 'violations', 'تقرير خاص': 'crimes', 'رصد ميداني': 'violations', 'إنفوغرافيك': 'accent', 'رواية مصوّرة': 'accent', 'حدث مفصلي': 'casualties', 'ذروة تاريخية': 'casualties' };
  function renderTimeline() {
    var box = slot('gov-timeline'); if (!box) return; clear(box);
    var entries = [];
    Object.keys(CAL).forEach(function (k) {
      var p = k.split('-'); var ts = new Date(+p[0], (+p[1]) - 1, +p[2]).getTime();
      (CAL[k] || []).forEach(function (ev) { entries.push({ ts: ts, y: p[0], mo: +p[1], ev: ev }); });
    });
    entries.sort(function (a, b) { return a.ts - b.ts; });
    var pick = [], seen = {};
    function add(e) { var key = e.ts + '|' + e.ev.t; if (!seen[key]) { seen[key] = 1; pick.push(e); } }
    entries.forEach(function (e) { if (e.ev.tag === 'حدث مفصلي' || e.ev.tag === 'ذروة تاريخية') add(e); });
    entries.slice(-5).forEach(add);
    pick.sort(function (a, b) { return a.ts - b.ts; });
    var ol = h('ol', 'gov-timeline');
    pick.forEach(function (e) {
      var li = h('li', 'gov-timeline__item');
      li.style.setProperty('--tone', 'var(--' + (TONE_OF[e.ev.tag] || 'accent') + ')');
      var head = h('div', 'gov-timeline__head');
      head.appendChild(h('span', 'gov-timeline__date num', AR_MONTHS[e.mo - 1] + ' ' + e.y));
      head.appendChild(h('span', 'rbadge', e.ev.tag || 'حدث'));
      li.appendChild(head);
      li.appendChild(h('p', 'gov-timeline__text', e.ev.t));
      ol.appendChild(li);
    });
    box.appendChild(ol);
  }

  /* ===== 7) المقارنة — كاروسيل بأرقام v الحقيقيّة ===== */
  function renderCarousel() {
    var box = slot('gov-carousel'); if (!box) return; clear(box);
    var order = GOV.map(function (x, i) { return i; }).sort(function (a, b) { return GOV[b].v - GOV[a].v; });
    order.forEach(function (i) { var card = buildCard(i); if (i === IDX) card.classList.add('is-current'); box.appendChild(card); });
  }

  /* ===== 8) في مثل هذا اليوم ===== */
  function renderToday() {
    var box = slot('today'); if (!box) return; clear(box);
    var now = new Date(), items = [];
    Object.keys(CAL).forEach(function (k) { var p = k.split('-'); if (+p[1] === now.getMonth() + 1 && +p[2] === now.getDate()) (CAL[k] || []).forEach(function (ev) { items.push({ y: +p[0], ev: ev }); }); });
    if (!items.length) {
      // لا حدث في مثل اليوم → ملء المساحة بأحدث ما وُثّق وطنيّاً (موسوم بوضوح)
      box.appendChild(h('p', 'gov-note', 'لا توجد أحداث موثّقة في مثل تاريخ اليوم — وفي ما يلي أحدث ما وُثّق في السجلّ الوطنيّ:'));
      var all = [];
      Object.keys(CAL).forEach(function (k) { var p = k.split('-'); var ts = new Date(+p[0], (+p[1]) - 1, +p[2]).getTime(); (CAL[k] || []).forEach(function (ev) { all.push({ ts: ts, y: +p[0], mo: +p[1], d: +p[2], ev: ev }); }); });
      all.sort(function (a, b) { return b.ts - a.ts; });
      all.slice(0, 4).forEach(function (it) {
        var item = h('div', 'gov-feed__item');
        item.style.setProperty('--tone', 'var(--' + (TONE_OF[it.ev.tag] || 'accent') + ')');
        item.appendChild(h('span', 'rbadge', it.ev.tag || 'حدث'));
        item.appendChild(h('span', 'gov-feed__date num', it.d + ' ' + AR_MONTHS[it.mo - 1] + ' ' + it.y));
        item.appendChild(h('p', 'gov-feed__desc', it.ev.t));
        box.appendChild(item);
      });
      return;
    }
    items.forEach(function (it) {
      var item = h('div', 'gov-feed__item');
      item.style.setProperty('--tone', 'var(--' + (TONE_OF[it.ev.tag] || 'accent') + ')');
      item.appendChild(h('span', 'rbadge', it.ev.tag || 'حدث'));
      item.appendChild(h('span', 'gov-feed__date num', now.getDate() + ' ' + AR_MONTHS[now.getMonth()] + ' ' + it.y));
      item.appendChild(h('p', 'gov-feed__desc', it.ev.t));
      box.appendChild(item);
    });
  }

  function zoomActive() { if (window.M3 && window.M3.zoomToGov) window.M3.zoomToGov(IDX); }

  function init() {
    if (!g) return;
    INCIDENTS = buildIncidents();
    renderCrumb(); renderHero(); renderMetrics();
    renderMapSub(); renderCities(); renderFacts();
    renderDonut(); renderBreakdowns(); renderCompare();
    renderLatestPreview(); renderTypeFilters(); renderExplorer(); bindExplorer(); bindExplorerToggle();
    renderTimeline(); renderCarousel(); renderToday();
    setTimeout(zoomActive, 350);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
