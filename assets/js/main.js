/* ==========================================================================
   مُعطى — لوحة الإحصائيات والمؤشّرات الفلسطينية
   main.js — كل التفاعلات بـ JavaScript فانيلا (بدون React / بدون runtime خارجي)

   البنية:
     1) DATA      — كل البيانات في مكان واحد (نقطة الربط بالـ CMS)
     2) STATE     — حالة الواجهة (الفئة المختارة، نوع المخطط… إلخ)
     3) Helpers   — تنسيق الأرقام، النموذج الشهري، قراءة ألوان السمة، بناء SVG
     4) Charts    — مولّدات الرسوم (sparkline / خطّي / دونات / حرارية / خريطة)
     5) Renderers — تعبئة الحاويات ذات data-render
     6) Events    — ربط الأزرار والتبديلات
     7) Init      — التشغيل
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var slot = function (name) { return $('[data-render="' + name + '"]'); };

  /* =========================================================================
     1) DATA — استبدل هذا الكائن (أو املأه من واجهة الـ CMS) — انظر README.md
     ========================================================================= */
  var DATA = {
    hero: [
      { key: 'martyrs', label: 'شهداء فلسطينيون', target: 1581,   note: 'منذ 1 يناير 2018',     accent: true  },
      { key: 'injured', label: 'جرحى فلسطينيون', target: 36776,  note: 'إصابات موثّقة',         accent: false },
      { key: 'events',  label: 'إجمالي الأحداث', target: 434505, note: 'حدث موثّق · 102 شهر',   accent: false }
    ],
    kpisLead: [
      { label: 'إجمالي الأحداث',    target: 434505, icon: '◆', tone: 'ink'    },
      { label: 'انتهاكات الاحتلال', target: 370772, icon: '⚠', tone: 'red'    },
      { label: 'مقاومة شعبية',      target: 55516,  icon: '✊', tone: 'accent' },
      { label: 'مقاومة نوعية',      target: 8217,   icon: '⊛', tone: 'olive'  }
    ],
    kpisSub: [
      { label: 'شهداء فلسطينيون', target: 1581,  tone: 'red'    },
      { label: 'جرحى فلسطينيون', target: 36776, tone: 'accent' },
      { label: 'قتلى إسرائيليون', target: 154,   tone: 'muted'  },
      { label: 'جرحى إسرائيليون', target: 2439,  tone: 'muted'  }
    ],
    GOV: [
      { n: 'نابلس',            v: 66547, x: 188, y: 150, lat: 32.221, lng: 35.261 },
      { n: 'جنين',             v: 57533, x: 200, y: 106, lat: 32.461, lng: 35.300 },
      { n: 'طولكرم',           v: 50740, x: 150, y: 126, lat: 32.311, lng: 35.028 },
      { n: 'الخليل',           v: 50543, x: 176, y: 286, lat: 31.529, lng: 35.097 },
      { n: 'رام الله والبيرة', v: 49839, x: 182, y: 198, lat: 31.902, lng: 35.206 },
      { n: 'القدس',            v: 48633, x: 188, y: 226, lat: 31.776, lng: 35.235 },
      { n: 'بيت لحم',          v: 30798, x: 182, y: 250, lat: 31.705, lng: 35.203 },
      { n: 'قلقيلية',          v: 26422, x: 150, y: 158, lat: 32.190, lng: 34.970 },
      { n: 'سلفيت',            v: 16124, x: 168, y: 176, lat: 32.085, lng: 35.181 },
      { n: 'طوباس',            v: 15098, x: 222, y: 132, lat: 32.321, lng: 35.369 },
      { n: 'أريحا والأغوار',   v: 9120,  x: 230, y: 214, lat: 31.857, lng: 35.444 },
      { n: 'قطاع غزة',         v: 41260, x: 48,  y: 300, lat: 31.420, lng: 34.370, gaza: true }
    ],
    METRICS: [
      { id: 'all',     label: 'الكل',      mult: 1      },
      { id: 'q',       label: 'نوعية',     mult: 0.0189 },
      { id: 'p',       label: 'شعبية',     mult: 0.1278 },
      { id: 'v',       label: 'انتهاكات',  mult: 0.8533 },
      { id: 'martyrs', label: 'شهداء',     mult: 0.0036 },
      { id: 'injured', label: 'جرحى',      mult: 0.0847 },
      { id: 'crimes',  label: 'جرائم',     mult: 0.052  }
    ],
    OPS: {
      q: { label: 'مقاومة نوعية', items: [
        { n: 'إطلاق نار', v: 4580 }, { n: 'عبوات ناسفة', v: 2127 }, { n: 'عمليات طعن', v: 266 }, { n: 'عمليات دهس', v: 139 } ] },
      p: { label: 'مقاومة شعبية', items: [
        { n: 'مواجهات', v: 42068 }, { n: 'صدّ مستوطنين', v: 6558 }, { n: 'تظاهرات', v: 4196 }, { n: 'زجاجات حارقة', v: 2171 } ] },
      v: { label: 'انتهاكات الاحتلال', items: [
        { n: 'اقتحام', v: 60758 }, { n: 'اعتقال', v: 54385 }, { n: 'تضييقات الحواجز', v: 48308 }, { n: 'إغلاقات', v: 12575 },
        { n: 'تدمير ممتلكات', v: 10951 }, { n: 'جريح', v: 40614 }, { n: 'شهيد', v: 1670 }, { n: 'إبعاد', v: 1356 } ] }
    },
    WEEK: [
      { d: 'الأحد', v: 35559 }, { d: 'الإثنين', v: 38644 }, { d: 'الثلاثاء', v: 40273 },
      { d: 'الأربعاء', v: 37615 }, { d: 'الخميس', v: 34058 }, { d: 'الجمعة', v: 37514 }, { d: 'السبت', v: 31136 }
    ],
    CATSHARE: [
      { n: 'انتهاكات الاحتلال', v: 370772, tone: 'red'    },
      { n: 'مقاومة شعبية',      v: 55516,  tone: 'accent' },
      { n: 'مقاومة نوعية',      v: 8217,   tone: 'olive'  }
    ],
    VICTIM_BARS: [
      { label: 'جرحى فلسطينيون',  v: 36776, tone: 'accent' },
      { label: 'جرحى إسرائيليون', v: 2439,  tone: 'muted'  },
      { label: 'شهداء فلسطينيون', v: 1581,  tone: 'red'    },
      { label: 'قتلى إسرائيليون', v: 154,   tone: 'muted'  }
    ],
    VICTIM_RATIOS: [
      { k: '10.3×', label: 'شهيد فلسطيني مقابل كل قتيل إسرائيلي' },
      { k: '15.1×', label: 'جريح فلسطيني مقابل كل جريح إسرائيلي' },
      { k: '94٪',   label: 'نسبة الضحايا الفلسطينيين من الإجمالي' }
    ],
    ARTICLES: [
      { t: '16 شهيداً و248 جريحاً في 7514 انتهاكاً إسرائيلياً في الضفة والقدس خلال شهر سبتمبر 2025', d: '2 أكتوبر 2025', tag: 'تقرير دوري', img: 'assets/img/reports/report-1.webp' },
      { t: '10 قتلى و51 جريحاً إسرائيلياً — عمليات نوعية تهزّ الاحتلال في الضفة والقدس خلال سبتمبر 2025', d: '1 أكتوبر 2025', tag: 'تقرير دوري', img: 'assets/img/reports/report-2.webp' },
      { t: '7 شهداء و183 جريحاً في 6009 انتهاكاً إسرائيلياً في الضفة والقدس خلال أغسطس 2025', d: '2 سبتمبر 2025', tag: 'تقرير دوري', img: 'assets/img/reports/report-3.webp' },
      { t: '7 جرحى إسرائيليين | 263 عملاً مقاوماً في الضفة الغربية خلال أغسطس 2025', d: '1 سبتمبر 2025', tag: 'تقرير دوري', img: 'assets/img/reports/report-4.webp' }
    ],
    TIMELINE: [
      { d: '2 أكتوبر 2025', t: '16 شهيداً و248 جريحاً في 7514 انتهاكاً إسرائيلياً في الضفة والقدس خلال سبتمبر 2025', tag: 'تقرير دوري' },
      { d: '1 أكتوبر 2025', t: '10 قتلى و51 جريحاً إسرائيلياً — عمليات نوعية تهزّ الاحتلال خلال سبتمبر 2025', tag: 'تقرير دوري' },
      { d: '2 سبتمبر 2025', t: '7 شهداء و183 جريحاً في 6009 انتهاكاً إسرائيلياً خلال شهر أغسطس 2025', tag: 'تقرير دوري' },
      { d: '1 سبتمبر 2025', t: '7 جرحى إسرائيليين و263 عملاً مقاوماً في الضفة الغربية خلال أغسطس 2025', tag: 'تقرير دوري' }
    ],
    DOWS: ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
    // أحداث التقويم — مفتاح "السنة-الشهر-اليوم"؛ كل يوم قائمة بأحداثه (نقطة الربط بالـ CMS)
    CAL_EVENTS: {
      '2025-10-2':  [
        { t: '16 شهيداً و248 جريحاً في 7,514 انتهاكاً إسرائيلياً في الضفة والقدس خلال سبتمبر 2025', tag: 'تقرير دوري', img: 'assets/img/reports/report-1.webp' },
        { t: 'رواية مصوّرة: أبرز محطّات الحصاد الميداني خلال سبتمبر', tag: 'رواية مصوّرة' }
      ],
      '2025-10-1':  [
        { t: '10 قتلى و51 جريحاً إسرائيلياً — عمليات نوعية تهزّ الاحتلال في الضفة والقدس خلال سبتمبر 2025', tag: 'تقرير دوري', img: 'assets/img/reports/report-2.webp' }
      ],
      '2025-9-18':  [
        { t: 'تقرير خاص — الحواجز والبوابات الحديدية: تقطيعٌ لأوصال الضفة الغربية', tag: 'تقرير خاص', img: 'assets/img/reports/special-1.webp' }
      ],
      '2025-9-10':  [
        { t: 'رصد ميداني: تصاعد اقتحامات المستوطنين للمسجد الأقصى خلال الأسبوع', tag: 'رصد ميداني' }
      ],
      '2025-9-2':   [
        { t: '7 شهداء و183 جريحاً في 6,009 انتهاكاً إسرائيلياً في الضفة والقدس خلال أغسطس 2025', tag: 'تقرير دوري', img: 'assets/img/reports/report-3.webp' },
        { t: 'إنفوغرافيك: توزيع الانتهاكات على المحافظات خلال أغسطس', tag: 'إنفوغرافيك' }
      ],
      '2025-9-1':   [
        { t: '7 جرحى إسرائيليين و263 عملاً مقاوماً في الضفة الغربية خلال أغسطس 2025', tag: 'تقرير دوري', img: 'assets/img/reports/report-4.webp' }
      ],
      '2025-8-5':   [
        { t: 'تقرير: حصيلة الاعتقالات في الضفة الغربية منذ بداية العام', tag: 'تقرير دوري' }
      ],
      '2025-2-1':   [
        { t: 'تقرير خاص: الشعارات التي ظهرت على منصّة تسليم الأسرى في صفقة التبادل الرابعة', tag: 'تقرير خاص', img: 'assets/img/reports/special-2.webp' }
      ],
      '2025-1-30':  [
        { t: 'تقرير خاص: دلالات الرموز ونوعية السلاح الذي غنمته المقاومة في جباليا', tag: 'تقرير خاص', img: 'assets/img/reports/special-3.webp' }
      ],
      '2023-10-7':  [
        { t: 'بدء «طوفان الأقصى» — منعطفٌ تاريخي في توثيق الأحداث الميدانية', tag: 'حدث مفصلي' }
      ],
      '2021-5-14':  [
        { t: 'الذروة التاريخية — 556 حدثاً موثّقاً في يومٍ واحد', tag: 'ذروة تاريخية' }
      ]
    },
    // شريط التحديثات الحيّة — أحدث الأحداث الموثّقة (tone = اللون الدلالي)
    TICKER: [
      { d: '23 يونيو', gov: 'نابلس', type: 'اقتحام', tone: 'violations', t: 'اقتحام بلدة بيتا وإطلاق قنابل الغاز تجاه المنازل' },
      { d: '23 يونيو', gov: 'الخليل', type: 'اعتقال', tone: 'violations', t: 'حملة اعتقالات طالت 6 مواطنين من المدينة' },
      { d: '22 يونيو', gov: 'جنين', type: 'مقاومة', tone: 'resistance', t: 'اشتباكات مسلّحة خلال اقتحام المخيّم' },
      { d: '22 يونيو', gov: 'القدس', type: 'انتهاك', tone: 'violations', t: 'إخطارات هدم جديدة في حيّ سلوان' },
      { d: '21 يونيو', gov: 'رام الله', type: 'مواجهات', tone: 'resistance', t: 'مواجهات مع المستوطنين عند مدخل بلدة المغيّر' },
      { d: '21 يونيو', gov: 'طولكرم', type: 'إصابة', tone: 'casualties', t: 'إصابة شاب بالرصاص خلال اقتحام مخيّم نور شمس' }
    ],
    // المرئيات (معرض + lightbox)
    VISUALS: [
      { img: 'assets/img/reports/report-1.webp', caption: 'حصاد سبتمبر الميداني في الضفة والقدس' },
      { img: 'assets/img/reports/special-1.webp', caption: 'الحواجز والبوابات الحديدية تقطّع أوصال الضفة' },
      { img: 'assets/img/reports/report-3.webp', caption: 'توثيق انتهاكات أغسطس عبر المحافظات' },
      { img: 'assets/img/reports/special-3.webp', caption: 'دلالات الرموز ونوعية السلاح في جباليا' },
      { img: 'assets/img/reports/report-2.webp', caption: 'عمليات نوعية تهزّ الاحتلال خلال سبتمبر' },
      { img: 'assets/img/reports/special-2.webp', caption: 'شعارات منصّة تسليم الأسرى في صفقة التبادل' },
      { img: 'assets/img/reports/report-4.webp', caption: 'حصيلة المقاومة الشعبية في الضفة الغربية' },
      { img: 'assets/img/reports/report-1.webp', caption: 'رصد ميداني موثّق لأحداث المحافظات' }
    ],
    FILTERS: [
      { id: 'range', label: 'النطاق', options: [
        { v: 'all', t: '2018 → 2026' }, { v: 'aqsa', t: 'منذ 7 أكتوبر 2023' },
        { v: '12m', t: 'آخر 12 شهراً' }, { v: 'pre', t: '2018 → 2023' } ] },
      { id: 'geo', label: 'الجغرافيا', options: [
        { v: 'all', t: 'الضفة · غزة · 48' }, { v: 'wb', t: 'الضفة الغربية' },
        { v: 'gaza', t: 'قطاع غزة' }, { v: 'jeru', t: 'القدس' }, { v: '48', t: 'أراضي 48' } ] },
      { id: 'gov', label: 'المحافظات', options: [ { v: 'all', t: 'كل المحافظات (12)' } ] },
      { id: 'type', label: 'النوع', options: [
        { v: 'all', t: 'كل الأنواع' }, { v: 'q', t: 'مقاومة نوعية' },
        { v: 'p', t: 'مقاومة شعبية' }, { v: 'v', t: 'انتهاكات الاحتلال' } ] }
    ]
  };

  // إضافة المحافظات لخيارات فلتر «المحافظات» من نفس مصدر البيانات
  (function () {
    var gf;
    DATA.FILTERS.forEach(function (f) { if (f.id === 'gov') gf = f; });
    if (gf) DATA.GOV.forEach(function (g) { gf.options.push({ v: g.n, t: g.n }); });
  })();

  /* =========================================================================
     2) STATE
     ========================================================================= */
  var state = {
    opCat: 'q',
    mapMetric: 'all',
    mapHover: null,
    trendType: 'area',
    heatCat: 'all',
    filters: { range: 'all', geo: 'all', gov: 'all', type: 'all' },
    cal: { y: 2025, m: 10 },   // الشهر المعروض في التقويم
    selDay: '2025-10-2'        // اليوم المحدّد
  };

  var AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  function todayParts() { var d = new Date(); return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() }; }

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================================
     3) Helpers
     ========================================================================= */
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }

  // لون من متغيّرات السمة (المصدر الوحيد للحقيقة = CSS)
  function tc(name) { return getComputedStyle(root).getPropertyValue('--' + name).trim(); }
  function tone(key, th) {
    var map = { ink: th.ink, red: th.red, accent: th.accent, olive: th.olive, muted: th.muted };
    return map[key] || th.ink;
  }
  function theme() {
    return {
      mode: root.getAttribute('data-mode') || 'light',
      bg: tc('bg'), surface: tc('surface'), surface2: tc('surface-2'),
      ink: tc('ink'), muted: tc('muted'), border: tc('border'),
      accent: tc('accent'), red: tc('red'), olive: tc('olive')
    };
  }

  // مولّد عشوائي حتمي (نفس النتائج في كل مرّة) — مطابق للأصل
  function rng(s) { var x = Math.sin(s * 12.9898) * 43758.5453; return x - Math.floor(x); }

  // النموذج الشهري (102 شهراً) — يُحسب مرّة واحدة
  var _monthly = null;
  function monthly() {
    if (_monthly) return _monthly;
    var n = 102, q = [], p = [], v = [], tot = [], labels = [];
    var may21 = 40, oct23 = 69;
    for (var i = 0; i < n; i++) {
      var yr = 2018 + Math.floor(i / 12), mo = (i % 12) + 1;
      labels.push(yr + '-' + String(mo).padStart(2, '0'));
      var base = 85 + 45 * Math.sin(i * 0.5 + 1) + rng(i + 3) * 40;
      var mult = 1;
      if (i === may21) mult = 4.0; else if (Math.abs(i - may21) === 1) mult = 1.9;
      if (i >= oct23) mult = Math.max(mult, 2.6 - (i - oct23) * 0.05);
      if (i === oct23) mult = 4.7;
      var total = Math.max(28, Math.round(base * mult));
      var vv = Math.round(total * (0.80 + rng(i) * 0.06));
      var pp = Math.round(total * (0.12 + rng(i + 1) * 0.05));
      var qq = Math.max(1, total - vv - pp);
      tot.push(total); v.push(vv); p.push(pp); q.push(qq);
    }
    _monthly = { labels: labels, q: q, p: p, v: v, tot: tot };
    return _monthly;
  }

  // قيم الخريطة حسب المقياس المختار
  function mapVals() {
    var metric = null, i;
    for (i = 0; i < DATA.METRICS.length; i++) if (DATA.METRICS[i].id === state.mapMetric) metric = DATA.METRICS[i];
    if (!metric) metric = DATA.METRICS[0];
    var vals = DATA.GOV.map(function (g) {
      return g.gaza && metric.id !== 'all'
        ? Math.round(g.v * metric.mult * 1.4)
        : Math.round(g.v * metric.mult * (0.7 + rng(g.x + g.y) * 0.7));
    });
    return { metric: metric, vals: vals, max: Math.max.apply(null, vals) };
  }

  // بناء عنصر SVG
  var SVGNS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs, kids) {
    var el = document.createElementNS(SVGNS, tag), k;
    if (attrs) for (k in attrs) if (attrs[k] != null) el.setAttribute(k, attrs[k]);
    if (kids) {
      if (!Array.isArray(kids)) kids = [kids];
      kids.forEach(function (c) {
        if (c == null) return;
        el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
    }
    return el;
  }

  // بناء عنصر HTML بكلاسات (بدون أي استايل inline)
  function h(tag, cls, text) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text != null) el.textContent = text;
    return el;
  }
  function clear(el) { if (el) while (el.firstChild) el.removeChild(el.firstChild); }
  // ضبط قيمة ديناميكية عبر متغيّر CSS (الأسلوب النظيف بدل style inline)
  function cssVar(el, name, val) { el.style.setProperty(name, val); }

  // مسار ناعم (catmull-rom -> bezier)
  function smooth(pts) {
    if (pts.length < 2) return '';
    var d = 'M ' + pts[0][0] + ',' + pts[0][1];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ' C ' + c1x + ',' + c1y + ' ' + c2x + ',' + c2y + ' ' + p2[0] + ',' + p2[1];
    }
    return d;
  }

  /* =========================================================================
     4) Charts (SVG)
     ========================================================================= */
  function sparkSvg(seed, color) {
    var pts = [], n = 26, v = 30 + (seed % 7) * 4, i;
    for (i = 0; i < n; i++) {
      v += Math.sin(i * 0.9 + seed) * 8 + (((i * (seed + 3)) % 11) - 5);
      if (i === 18) v += 38;
      pts.push(Math.max(6, v));
    }
    var mx = Math.max.apply(null, pts), w = 120, hh = 30;
    var d = pts.map(function (p, idx) { return (idx / (n - 1)) * w + ',' + (hh - (p / mx) * hh); }).join(' ');
    return svg('svg', { viewBox: '0 0 ' + w + ' ' + hh, width: '100%', height: 30, preserveAspectRatio: 'none', 'aria-hidden': 'true' },
      svg('polyline', { points: d, fill: 'none', stroke: color, 'stroke-width': 1.6, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
  }

  function heroRingSvg(th) {
    var size = 240, cx = 120, cy = 120, r = 92, sw = 20, pct = 0.86;
    var circ = 2 * Math.PI * r;
    var grad = svg('linearGradient', { id: 'heroRingGrad', x1: '0', y1: '0', x2: '1', y2: '1' }, [
      svg('stop', { offset: '0%', 'stop-color': th.accent, 'stop-opacity': 1 }),
      svg('stop', { offset: '100%', 'stop-color': th.accent, 'stop-opacity': 0.45 })
    ]);
    var track = svg('circle', { cx: cx, cy: cy, r: r, fill: 'none', stroke: th.surface2, 'stroke-width': sw });
    var prog = svg('circle', {
      cx: cx, cy: cy, r: r, fill: 'none', stroke: 'url(#heroRingGrad)', 'stroke-width': sw,
      'stroke-linecap': 'round', 'stroke-dasharray': circ.toFixed(2),
      'stroke-dashoffset': (circ * (1 - pct)).toFixed(2),
      transform: 'rotate(-90 ' + cx + ' ' + cy + ')'
    });
    return svg('svg', { viewBox: '0 0 ' + size + ' ' + size, width: '100%', 'aria-hidden': 'true' },
      [svg('defs', null, grad), track, prog]);
  }

  function lineChartSvg(th) {
    var m = monthly(), n = m.tot.length, W = 860, H = 300, padB = 34, padT = 18, padX = 8;
    var type = state.trendType, iw = W - padX * 2, ih = H - padB - padT;
    var X = function (i) { return padX + (i / (n - 1)) * iw; };
    var series = type === 'stacked'
      ? [{ key: 'v', color: th.red }, { key: 'p', color: th.accent }, { key: 'q', color: th.olive }]
      : [{ key: 'tot', color: th.accent }];
    var mx = type === 'stacked' ? Math.max.apply(null, m.tot) : Math.max.apply(null, m[series[0].key]);
    mx = mx * 1.08;
    var Y = function (val) { return padT + ih - (val / mx) * ih; };
    var els = [], g, i;

    for (g = 0; g <= 3; g++) {
      var yy = padT + (ih / 3) * g;
      els.push(svg('line', { x1: padX, x2: W - padX, y1: yy, y2: yy, stroke: th.border, 'stroke-width': 1, opacity: 0.7 }));
      els.push(svg('text', { x: W - padX, y: yy - 4, 'text-anchor': 'end', 'font-size': 10, fill: th.muted }, String(Math.round(mx * (1 - g / 3)))));
    }

    if (type === 'stacked') {
      var acc = new Array(n).fill(0);
      series.forEach(function (s) {
        var top = m[s.key].map(function (val, i) { acc[i] += val; return [X(i), Y(acc[i])]; });
        var bottomVals = m[s.key].map(function (val, i) { return acc[i] - val; });
        var bot = bottomVals.map(function (val, i) { return [X(i), Y(val)]; }).reverse();
        var dd = smooth(top) + ' L ' + bot.map(function (pt) { return pt[0] + ',' + pt[1]; }).join(' L ') + ' Z';
        els.push(svg('path', { d: dd, fill: s.color, opacity: 0.85 }));
      });
    } else {
      var key = series[0].key, color = series[0].color;
      var pts = m[key].map(function (val, i) { return [X(i), Y(val)]; });
      var lineD = (type === 'line' || type === 'area')
        ? 'M ' + pts.map(function (pt) { return pt[0] + ',' + pt[1]; }).join(' L ')
        : smooth(pts);
      if (type === 'area' || type === 'curve') {
        var areaD = lineD + ' L ' + X(n - 1) + ',' + (padT + ih) + ' L ' + X(0) + ',' + (padT + ih) + ' Z';
        var grad = svg('linearGradient', { id: 'mg', x1: 0, y1: 0, x2: 0, y2: 1 }, [
          svg('stop', { offset: '0%', 'stop-color': color, 'stop-opacity': 0.32 }),
          svg('stop', { offset: '100%', 'stop-color': color, 'stop-opacity': 0 })
        ]);
        els.push(svg('defs', null, grad));
        els.push(svg('path', { d: areaD, fill: 'url(#mg)' }));
      }
      if (type === 'bars') {
        var bw = iw / n * 0.62;
        pts.forEach(function (pt) {
          els.push(svg('rect', { x: pt[0] - bw / 2, y: pt[1], width: bw, height: padT + ih - pt[1], rx: 1.5, fill: color, opacity: 0.85 }));
        });
      } else {
        els.push(svg('path', { d: lineD, fill: 'none', stroke: color, 'stroke-width': 2.2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
      }
    }

    for (var yr = 0; yr <= 8; yr++) {
      i = Math.min(n - 1, yr * 12);
      els.push(svg('text', { x: X(i), y: H - 12, 'text-anchor': 'middle', 'font-size': 10.5, fill: th.muted }, String(2018 + yr)));
    }
    [40, 69].forEach(function (pi) {
      els.push(svg('line', { x1: X(pi), x2: X(pi), y1: padT, y2: padT + ih, stroke: th.red, 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0.5 }));
    });

    return svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', role: 'img', 'aria-label': 'مخطط الاتجاه الشهري للأحداث عبر 102 شهراً (2018–2026)' }, els);
  }

  function donutSvg(th) {
    var segs = DATA.CATSHARE, tot = segs.reduce(function (a, s) { return a + s.v; }, 0);
    var R = 78, r = 50, cx = 100, cy = 100, a0 = -Math.PI / 2, els = [];
    segs.forEach(function (s) {
      var frac = s.v / tot, a1 = a0 + frac * Math.PI * 2, lg = frac > 0.5 ? 1 : 0;
      var x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0), x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
      var xi1 = cx + r * Math.cos(a1), yi1 = cy + r * Math.sin(a1), xi0 = cx + r * Math.cos(a0), yi0 = cy + r * Math.sin(a0);
      var d = 'M ' + x0 + ',' + y0 + ' A ' + R + ',' + R + ' 0 ' + lg + ' 1 ' + x1 + ',' + y1 +
              ' L ' + xi1 + ',' + yi1 + ' A ' + r + ',' + r + ' 0 ' + lg + ' 0 ' + xi0 + ',' + yi0 + ' Z';
      els.push(svg('path', { d: d, fill: tone(s.tone, th) }));
      a0 = a1;
    });
    els.push(svg('text', { x: cx, y: cy - 4, 'text-anchor': 'middle', 'font-size': 21, 'font-weight': 700, fill: th.ink }, '85.3٪'));
    els.push(svg('text', { x: cx, y: cy + 14, 'text-anchor': 'middle', 'font-size': 10, fill: th.muted }, 'انتهاكات'));
    return svg('svg', { viewBox: '0 0 200 200', width: '100%', height: 200, role: 'img', 'aria-label': 'مخطط دائري لنسب الفئات: انتهاكات الاحتلال 85.3٪، مقاومة شعبية 12.8٪، مقاومة نوعية 1.9٪' }, els);
  }

  function heatSvg(th) {
    var cities = DATA.GOV.filter(function (g) { return !g.gaza; }).slice(0, 12).map(function (g) { return g.n; });
    var cols = 40, cell = 15, gap = 2.5, lblW = 84;
    var W = lblW + cols * (cell + gap), H = cities.length * (cell + gap) + 20, els = [];
    var catSeed = ({ all: 0, q: 5, p: 9, v: 2, crimes: 7 })[state.heatCat] || 0;
    cities.forEach(function (c, ri) {
      els.push(svg('text', { x: lblW - 8, y: ri * (cell + gap) + cell - 2.5, 'text-anchor': 'end', 'font-size': 10.5, fill: th.muted }, c));
      for (var ci = 0; ci < cols; ci++) {
        var intensity = rng(ri * 100 + ci + catSeed);
        var spike = (ci > 26 && ci < 31) ? 0.5 : 0; if (ci === 28) spike = 0.7;
        var val = Math.min(1, intensity * 0.7 + spike);
        var op = 0.08 + val * 0.92;
        els.push(svg('rect', { x: lblW + ci * (cell + gap), y: ri * (cell + gap), width: cell, height: cell, rx: 2.5, fill: th.accent, opacity: op }));
      }
    });
    return svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', role: 'img', 'aria-label': 'خريطة حرارية لكثافة الأحداث شهرياً لأكثر المحافظات نشاطاً؛ كثافة اللون تعكس عدد الأحداث' }, els);
  }

  // ===== الخريطة التفاعلية (Leaflet + OpenStreetMap) — choropleth حدود المحافظات =====
  var _map = null, _tiles = null, _geoLayer = null, _geoLayers = [];
  var TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

  // ربط أسماء مضلّعات geoBoundaries (إنجليزي) بفهارس DATA.GOV — محافظات غزة الخمس تُدمج في «قطاع غزة»
  var GOV_NAME_MAP = {
    'Nablus': 0, 'Jenin': 1, 'Tulkarm': 2, 'Hebron': 3, 'Ramallah & Al Bireh': 4,
    'Jerusalem': 5, 'Bethlehem': 6, 'Qalqiliya': 7, 'Salfit': 8, 'Tubas': 9,
    'Jericho & Al Aghwar': 10,
    'Gaza': 11, 'North Gaza': 11, 'Rafah': 11, 'Khan Yunis': 11, 'Deir Al Balah': 11
  };
  function govIndexForName(name) { return (name in GOV_NAME_MAP) ? GOV_NAME_MAP[name] : -1; }

  function tileUrl() {
    return root.getAttribute('data-mode') === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
  }

  // نمط مضلّع المحافظة: كثافة التعبئة حسب قيمة المقياس (choropleth) — أحمر لغزة، مميّز للضفة
  function geoStyle(idx, hov, mv) {
    var th = theme(), base = DATA.GOV[idx].gaza ? th.red : th.accent;
    var t = mv.max ? mv.vals[idx] / mv.max : 0;
    var op = 0.16 + 0.6 * t;
    return {
      color: hov ? (th.mode === 'dark' ? '#fff' : th.ink) : base,
      weight: hov ? 2.5 : 1,
      fillColor: base,
      fillOpacity: hov ? Math.min(0.94, op + 0.22) : op
    };
  }

  function initMap() {
    var el = $('[data-map]');
    if (!el || !window.L || _map) return;
    _map = L.map(el, {
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: true,
      fadeAnimation: !reduceMotion,
      zoomAnimation: !reduceMotion,
      minZoom: 7,
      maxZoom: 12
    });
    _map.fitBounds([[31.18, 34.15], [32.62, 35.62]], { padding: [12, 12] });
    _tiles = L.tileLayer(tileUrl(), { subdomains: 'abcd', maxZoom: 19, attribution: TILE_ATTR }).addTo(_map);

    if (window.L && window.PS_GOV_GEO) {
      var mv = mapVals();
      _geoLayer = L.geoJSON(window.PS_GOV_GEO, {
        style: function (feature) {
          var i = govIndexForName(feature.properties.name);
          return i >= 0 ? geoStyle(i, false, mv) : { color: '#888', weight: 1, fillOpacity: 0.04 };
        },
        onEachFeature: function (feature, layer) {
          var i = govIndexForName(feature.properties.name);
          if (i < 0) return;
          layer._govIndex = i;
          _geoLayers.push(layer);
          layer.bindTooltip('', { sticky: true, direction: 'top', className: 'map-tip', opacity: 1 });
          layer.on('mouseover', function () { setMapHover(i); });
          layer.on('mouseout', function () { setMapHover(null); });
          layer.on('click', function () { setMapHover(i); zoomToGov(i); });
        }
      }).addTo(_map);
      refreshMap();
    }
    setTimeout(function () { if (_map) _map.invalidateSize(); }, 250);
  }

  // تحديث تلوين المضلّعات والتلميحات عند تغيّر المقياس أو السمة
  function refreshMap() {
    if (!_map || !_geoLayers.length) return;
    var mv = mapVals();
    _geoLayers.forEach(function (layer) {
      var i = layer._govIndex;
      layer.setStyle(geoStyle(i, state.mapHover === i, mv));
      layer.setTooltipContent('<strong>' + DATA.GOV[i].n + '</strong><br>' + mv.metric.label + ': ' + fmt(mv.vals[i]));
    });
  }

  // تقريب الخريطة إلى محافظة (عند النقر على المضلّع أو على القائمة الجانبية)
  function zoomToGov(i) {
    if (!_map || !_geoLayers.length) return;
    var bounds = null;
    _geoLayers.forEach(function (layer) {
      if (layer._govIndex === i) bounds = bounds ? bounds.extend(layer.getBounds()) : L.latLngBounds(layer.getBounds());
    });
    if (!bounds) return;
    if (reduceMotion) _map.fitBounds(bounds, { padding: [30, 30], maxZoom: 11 });
    else _map.flyToBounds(bounds, { padding: [30, 30], maxZoom: 11, duration: 0.6 });
  }

  // تبديل بلاطات الخريطة حسب الوضع (فاتح/داكن)
  function setTiles() {
    if (!_map) return;
    if (_tiles) _map.removeLayer(_tiles);
    _tiles = L.tileLayer(tileUrl(), { subdomains: 'abcd', maxZoom: 19, attribution: TILE_ATTR }).addTo(_map);
  }

  /* =========================================================================
     5) Renderers
     ========================================================================= */
  function bar(track, fill) { var t = h('div', 'bar-track'); var f = h('div', fill || 'bar-fill'); t.appendChild(f); return { track: t, fill: f }; }

  function renderHeroRing() {
    var box = slot('hero-ring'); if (!box) return; clear(box);
    box.appendChild(heroRingSvg(theme()));
  }

  // ---- شريط الفلاتر ----
  function renderFilters() {
    var box = slot('filters'); if (!box) return; clear(box);
    DATA.FILTERS.forEach(function (f) {
      var lab = h('label', 'filter');
      lab.appendChild(h('span', 'filter__label', f.label));
      var field = h('span', 'filter__field');
      var sel = document.createElement('select');
      sel.className = 'filter__select';
      sel.setAttribute('data-filter', f.id);
      f.options.forEach(function (o) {
        var opt = document.createElement('option');
        opt.value = o.v;
        opt.textContent = o.t;
        sel.appendChild(opt);
      });
      sel.value = state.filters[f.id];
      field.appendChild(sel);
      var chev = h('span', 'filter__chev', '▾');
      chev.setAttribute('aria-hidden', 'true');
      field.appendChild(chev);
      lab.appendChild(field);
      box.appendChild(lab);
    });
  }

  function filterOptionLabel(id, v) {
    var label = v, f;
    DATA.FILTERS.forEach(function (fl) { if (fl.id === id) f = fl; });
    if (f) f.options.forEach(function (o) { if (o.v === v) label = o.t; });
    return label;
  }

  function setFilterStatus(msg) {
    var el = $('[data-filter-status]'); if (el) el.textContent = msg || '';
  }

  function filterSummary() {
    var parts = [];
    DATA.FILTERS.forEach(function (f) {
      var v = state.filters[f.id];
      if (v && v !== 'all') parts.push(filterOptionLabel(f.id, v));
    });
    return parts.length ? ('تم تطبيق العرض: ' + parts.join(' · ')) : 'يُعرض كل البيانات';
  }

  function syncTypeFromMetric() {
    var sel = $('[data-filter="type"]');
    if (sel && ['all', 'q', 'p', 'v'].indexOf(state.mapMetric) >= 0) {
      sel.value = state.mapMetric;
      state.filters.type = state.mapMetric;
    }
  }

  function applyFilters() {
    // قراءة الاختيارات الحالية من القوائم
    $$('[data-filter]').forEach(function (sel) {
      state.filters[sel.getAttribute('data-filter')] = sel.value;
    });
    // النوع → مقياس الخريطة
    if (['all', 'q', 'p', 'v'].indexOf(state.filters.type) >= 0) {
      state.mapMetric = state.filters.type;
      setActive($$('[data-map-metric]'), 'data-map-metric', state.mapMetric);
      refreshMap();
      renderMapRank();
    }
    // المحافظة → تحديدها على الخريطة
    if (state.filters.gov === 'all') {
      setMapHover(null);
    } else {
      var idx = -1;
      DATA.GOV.forEach(function (g, i) { if (g.n === state.filters.gov) idx = i; });
      setMapHover(idx >= 0 ? idx : null);
    }
    setFilterStatus(filterSummary());
  }

  function resetFilters() {
    DATA.FILTERS.forEach(function (f) { state.filters[f.id] = 'all'; });
    $$('[data-filter]').forEach(function (sel) { sel.value = 'all'; });
    state.mapMetric = 'all';
    state.mapHover = null;
    setActive($$('[data-map-metric]'), 'data-map-metric', 'all');
    refreshMap();
    renderMapRank();
    setMapHover(null);
    setFilterStatus('تمت إعادة الضبط — يُعرض كل البيانات');
  }

  function renderHero() {
    var box = slot('hero'); if (!box) return; clear(box);
    DATA.hero.forEach(function (f) {
      var fig = h('div', 'figure' + (f.accent ? ' figure--accent' : ''));
      var val = h('div', 'figure__value num'); val.setAttribute('data-count', f.target); val.textContent = '0';
      fig.appendChild(val);
      fig.appendChild(h('div', 'figure__label', f.label));
      fig.appendChild(h('div', 'figure__note', f.note));
      box.appendChild(fig);
    });
  }

  function renderKpisLead() {
    var box = slot('kpis-lead'); if (!box) return; clear(box);
    DATA.kpisLead.forEach(function (k, i) {
      var card = h('div', 'kpi-card'); card.setAttribute('data-st', '');
      var head = h('div', 'kpi-card__head');
      var icon = h('span', 'kpi-card__icon', k.icon);
      cssVar(icon, '--tone', 'var(--' + k.tone + ')');
      head.appendChild(icon);
      head.appendChild(h('span', 'kpi-card__label', k.label));
      card.appendChild(head);
      var val = h('div', 'kpi-card__value num'); val.setAttribute('data-count', k.target); val.textContent = '0';
      card.appendChild(val);
      var sp = h('div', 'kpi-card__spark');
      sp.setAttribute('data-spark-seed', i * 5 + 3);
      sp.setAttribute('data-tone', k.tone);
      card.appendChild(sp);
      box.appendChild(card);
    });
  }

  function renderKpisSub() {
    var box = slot('kpis-sub'); if (!box) return; clear(box);
    DATA.kpisSub.forEach(function (k) {
      var card = h('div', 'kpi-stat'); card.setAttribute('data-st', '');
      var left = document.createElement('div');
      left.appendChild(h('div', 'kpi-stat__label', k.label));
      var val = h('div', 'kpi-stat__value num'); val.setAttribute('data-count', k.target); val.textContent = '0';
      left.appendChild(val);
      card.appendChild(left);
      var arrow = h('span', 'kpi-stat__arrow', '›');
      cssVar(arrow, '--tone', 'var(--' + k.tone + ')');
      card.appendChild(arrow);
      box.appendChild(card);
    });
  }

  function renderSparks() {
    var th = theme();
    $$('[data-spark-seed]').forEach(function (sp) {
      clear(sp);
      var seed = parseFloat(sp.getAttribute('data-spark-seed'));
      var key = sp.getAttribute('data-tone');
      sp.appendChild(sparkSvg(seed, tone(key, th)));
    });
  }

  function renderMapRank() {
    var box = slot('map-rank'); if (!box) return; clear(box);
    var th = theme(), mv = mapVals();
    var ranked = DATA.GOV.map(function (g, i) { return { n: g.n, i: i, v: mv.vals[i] }; })
      .sort(function (a, b) { return b.v - a.v; }).slice(0, 8);
    ranked.forEach(function (r) {
      var item = h('div', 'rank-item' + (r.i === state.mapHover ? ' is-active' : ''));
      item.setAttribute('data-st', '');
      item.setAttribute('data-gov-index', r.i);
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');
      item.setAttribute('aria-label', DATA.GOV[r.i].n + ' — ' + fmt(r.v) + ' · عرض على الخريطة');
      var head = h('div', 'rank-item__head');
      head.appendChild(h('span', 'rank-item__name', r.n));
      head.appendChild(h('span', 'rank-item__value num', fmt(r.v)));
      item.appendChild(head);
      var b = bar(); cssVar(b.fill, '--w', (r.v / mv.max * 100) + '%');
      cssVar(b.fill, '--tone', DATA.GOV[r.i].gaza ? 'var(--red)' : 'var(--accent)');
      item.appendChild(b.track);
      item.addEventListener('mouseenter', function () { setMapHover(r.i); });
      item.addEventListener('mouseleave', function () { setMapHover(null); });
      item.addEventListener('focus', function () { setMapHover(r.i); });
      item.addEventListener('blur', function () { setMapHover(null); });
      item.addEventListener('click', function () { setMapHover(r.i); zoomToGov(r.i); });
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMapHover(r.i); zoomToGov(r.i); }
      });
      box.appendChild(item);
    });
  }

  // إبراز محافظة على الخريطة + مزامنة القائمة الجانبية (يعمل من المضلّع أو من القائمة)
  function setMapHover(i) {
    state.mapHover = i;
    if (_map && _geoLayers.length) {
      var mv = mapVals();
      _geoLayers.forEach(function (layer) {
        var k = layer._govIndex;
        layer.setStyle(geoStyle(k, i === k, mv));
        if (i === k) layer.bringToFront();
      });
    }
    var rankBox = slot('map-rank');
    if (rankBox) {
      Array.prototype.forEach.call(rankBox.querySelectorAll('.rank-item'), function (it) {
        it.classList.toggle('is-active', parseInt(it.getAttribute('data-gov-index'), 10) === i);
      });
    }
  }

  function renderTrend() {
    var box = slot('trend'); if (!box) return; clear(box);
    box.appendChild(lineChartSvg(theme()));
  }

  function renderOpsTabs() {
    var box = slot('ops-tabs'); if (!box) return; clear(box);
    Object.keys(DATA.OPS).forEach(function (key) {
      var o = DATA.OPS[key];
      var btn = h('button', 'ops-tab' + (key === state.opCat ? ' is-active' : ''), o.label + ' · ' + o.items.length);
      btn.type = 'button';
      btn.setAttribute('data-op-cat', key);
      btn.setAttribute('aria-pressed', String(key === state.opCat));
      box.appendChild(btn);
    });
  }

  function renderOps() {
    var box = slot('ops'); if (!box) return; clear(box);
    var cat = DATA.OPS[state.opCat] || DATA.OPS.q;
    var max = Math.max.apply(null, cat.items.map(function (x) { return x.v; }));
    cat.items.forEach(function (x) {
      var row = h('div', 'bar-row');
      var head = h('div', 'bar-row__head');
      head.appendChild(h('span', 'bar-row__name', x.n));
      head.appendChild(h('span', 'bar-row__value num', fmt(x.v)));
      row.appendChild(head);
      var b = bar(); cssVar(b.fill, '--w', (x.v / max * 100) + '%');
      row.appendChild(b.track);
      box.appendChild(row);
    });
  }

  function renderTopGov5() {
    var box = slot('top-gov5'); if (!box) return; clear(box);
    var sorted = DATA.GOV.filter(function (g) { return !g.gaza; }).sort(function (a, b) { return b.v - a.v; });
    var max = sorted[0].v;
    sorted.slice(0, 5).forEach(function (g, i) {
      var item = h('div', 'gov-rank__item');
      item.appendChild(h('span', 'gov-rank__num', String(i + 1)));
      var body = h('div', 'gov-rank__body');
      var head = h('div', 'gov-rank__head');
      head.appendChild(h('span', 'gov-rank__name', g.n));
      head.appendChild(h('span', 'gov-rank__value num', fmt(g.v)));
      body.appendChild(head);
      var b = bar(); cssVar(b.fill, '--w', (g.v / max * 100) + '%');
      body.appendChild(b.track);
      item.appendChild(body);
      box.appendChild(item);
    });
  }

  function renderDonut() {
    var box = slot('donut'); if (!box) return; clear(box);
    box.appendChild(donutSvg(theme()));
  }

  function renderCommon() {
    var box = slot('common'); if (!box) return; clear(box);
    var common = DATA.OPS.q.items.concat(DATA.OPS.p.items)
      .sort(function (a, b) { return b.v - a.v; }).slice(0, 8);
    var max = Math.max.apply(null, common.map(function (x) { return x.v; }));
    common.forEach(function (x) {
      var row = h('div', 'bar-inline');
      row.appendChild(h('span', 'bar-inline__name bar-inline__name--w108', x.n));
      var b = bar(); cssVar(b.fill, '--w', (x.v / max * 100) + '%');
      row.appendChild(b.track);
      row.appendChild(h('span', 'bar-inline__value num', fmt(x.v)));
      box.appendChild(row);
    });
  }

  function renderViolations() {
    var box = slot('violations'); if (!box) return; clear(box);
    var viol = DATA.OPS.v.items.slice().sort(function (a, b) { return b.v - a.v; });
    var max = Math.max.apply(null, viol.map(function (x) { return x.v; }));
    viol.forEach(function (x, i) {
      var row = h('div', 'bar-inline');
      row.appendChild(h('span', 'bar-inline__name bar-inline__name--w120', x.n));
      var b = bar(null, 'bar-fill bar-fill--red');
      cssVar(b.fill, '--w', (x.v / max * 100) + '%');
      cssVar(b.fill, '--op', (1 - i * 0.09).toFixed(2));
      row.appendChild(b.track);
      row.appendChild(h('span', 'bar-inline__value num', fmt(x.v)));
      box.appendChild(row);
    });
  }

  function renderVictimBars() {
    var box = slot('victim-bars'); if (!box) return; clear(box);
    var max = Math.max.apply(null, DATA.VICTIM_BARS.map(function (x) { return x.v; }));
    DATA.VICTIM_BARS.forEach(function (x) {
      var row = h('div', 'bar-inline bar-inline--lg');
      row.appendChild(h('span', 'bar-inline__name bar-inline__name--w128', x.label));
      var b = bar(null, 'bar-fill bar-fill--tone');
      cssVar(b.fill, '--w', (x.v / max * 100) + '%');
      cssVar(b.fill, '--tone', 'var(--' + x.tone + ')');
      row.appendChild(b.track);
      row.appendChild(h('span', 'bar-inline__value num', fmt(x.v)));
      box.appendChild(row);
    });
  }

  function renderVictimRatios() {
    var box = slot('victim-ratios'); if (!box) return; clear(box);
    DATA.VICTIM_RATIOS.forEach(function (rt) {
      var card = h('div', 'ratio-card');
      card.appendChild(h('div', 'ratio-card__value', rt.k));
      card.appendChild(h('div', 'ratio-card__label', rt.label));
      box.appendChild(card);
    });
  }

  function renderHeat() {
    var box = slot('heat'); if (!box) return; clear(box);
    box.appendChild(heatSvg(theme()));
  }

  function renderWeek() {
    var max = Math.max.apply(null, DATA.WEEK.map(function (w) { return w.v; }));
    var sum = DATA.WEEK.reduce(function (a, w) { return a + w.v; }, 0);
    var avg = sum / DATA.WEEK.length;
    var CAP = 86; // ترك مساحة أعلى الأعمدة لأرقام القيم

    var box = slot('week');
    if (box) {
      clear(box);
      DATA.WEEK.forEach(function (w) {
        var col = h('div', 'week-bar' + (w.v === max ? ' is-top' : ''));
        col.appendChild(h('span', 'week-bar__value num', fmt(w.v)));
        var fill = h('div', 'week-bar__fill');
        cssVar(fill, '--h', (w.v / max * CAP) + '%');
        col.appendChild(fill);
        box.appendChild(col);
      });
    }
    var days = slot('week-days');
    if (days) {
      clear(days);
      DATA.WEEK.forEach(function (w) { days.appendChild(h('span', 'week-day', w.d)); });
    }
    var avgEl = $('[data-week-avg]');
    if (avgEl) cssVar(avgEl, '--avg', (avg / max * CAP) + '%');
  }

  function renderTop10() {
    var box = slot('top10'); if (!box) return; clear(box);
    var medals = ['🥇', '🥈', '🥉'];
    var sorted = DATA.GOV.filter(function (g) { return !g.gaza; }).sort(function (a, b) { return b.v - a.v; });
    sorted.slice(0, 10).forEach(function (g, i) {
      var item = h('div', 'top-item' + (i < 3 ? ' is-lead' : '')); item.setAttribute('data-st', '');
      item.appendChild(h('span', 'top-item__rank', i < 3 ? medals[i] : '#' + (i + 1)));
      item.appendChild(h('span', 'top-item__name', g.n));
      item.appendChild(h('span', 'top-item__value num', fmt(g.v)));
      box.appendChild(item);
    });
  }

  function renderTimeline() {
    var box = slot('timeline'); if (!box) return; clear(box);
    // يفصل التاريخ "2 أكتوبر 2025" إلى يوم/شهر/سنة لبناء قرص تاريخ على الخطّ
    function splitDate(d) {
      var parts = String(d).trim().split(/\s+/);
      return {
        day: parts[0] || '',
        month: parts.length > 2 ? parts.slice(1, parts.length - 1).join(' ') : (parts[1] || ''),
        year: parts.length > 1 ? parts[parts.length - 1] : ''
      };
    }

    DATA.TIMELINE.forEach(function (ev, i) {
      var dt = splitDate(ev.d);

      var item = h('a', 'timeline__item');
      item.href = 'single_article.html';
      item.setAttribute('data-st', '');
      item.setAttribute('aria-label', ev.tag + ' — ' + ev.d + ' — ' + ev.t);

      // العمود الأول: قرص التاريخ + رقم ترتيبي شبحي
      var marker = h('div', 'timeline__marker');
      marker.setAttribute('aria-hidden', 'true');
      marker.appendChild(h('span', 'timeline__index', String(DATA.TIMELINE.length - i)));
      var node = h('div', 'timeline__node');
      node.appendChild(h('span', 'timeline__day num', dt.day));
      node.appendChild(h('span', 'timeline__month', dt.month));
      marker.appendChild(node);

      // العمود الأوسط: التاريخ الكامل ثمّ العنوان
      var body = h('div', 'timeline__body');
      body.appendChild(h('time', 'timeline__date', ev.d));
      body.appendChild(h('p', 'timeline__text', ev.t));

      // العمود الأخير: الوسم + دعوة القراءة
      var aside = h('div', 'timeline__aside');
      aside.appendChild(h('span', 'timeline__tag', ev.tag));
      var cta = h('span', 'timeline__cta');
      cta.appendChild(h('span', 'timeline__cta-label', 'اقرأ التقرير'));
      var arrow = h('span', 'timeline__arrow', '←');
      arrow.setAttribute('aria-hidden', 'true');
      cta.appendChild(arrow);
      aside.appendChild(cta);

      item.appendChild(marker);
      item.appendChild(body);
      item.appendChild(aside);
      box.appendChild(item);
    });
  }

  function renderArticles() {
    var box = slot('articles'); if (!box) return; clear(box);
    DATA.ARTICLES.slice(1).forEach(function (a) {
      var card = h('a', 'article-card'); card.href = 'single_article.html'; card.setAttribute('data-st', '');
      var img = h('img', 'thumb thumb--sm');
      img.src = a.img; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
      img.width = 760; img.height = 475;
      card.appendChild(img);
      card.appendChild(h('span', 'article-card__tag', a.tag + ' · ' + a.d));
      card.appendChild(h('h4', 'article-card__title', a.t));
      box.appendChild(card);
    });
  }

  function renderCalendar() {
    var dowsBox = slot('calendar-dows');
    if (dowsBox) {
      clear(dowsBox);
      DATA.DOWS.forEach(function (d) { dowsBox.appendChild(h('div', 'calendar__dow', d)); });
    }
    var box = slot('calendar'); if (!box) return; clear(box);

    var y = state.cal.y, m = state.cal.m, today = todayParts();

    var titleEl = $('[data-cal-month]');
    if (titleEl) titleEl.textContent = AR_MONTHS[m - 1] + ' ' + y;

    // عدد أحداث الشهر المعروض
    var prefix = y + '-' + m + '-', monthCount = 0;
    Object.keys(DATA.CAL_EVENTS).forEach(function (k) {
      if (k.indexOf(prefix) === 0) monthCount += DATA.CAL_EVENTS[k].length;
    });
    var countEl = $('[data-cal-count]');
    if (countEl) {
      clear(countEl);
      countEl.appendChild(document.createTextNode('إجمالي أحداث الشهر: '));
      countEl.appendChild(h('strong', 'num', String(monthCount)));
    }

    // بناء الشبكة (6 صفوف ثابتة) مع أيام الشهرين المجاورين باهتة
    var first = new Date(y, m - 1, 1).getDay();        // 0 = الأحد
    var dim = new Date(y, m, 0).getDate();             // أيام الشهر
    var prevDim = new Date(y, m - 1, 0).getDate();     // أيام الشهر السابق
    var cells = [], i;
    for (i = first; i > 0; i--) cells.push({ day: prevDim - i + 1, out: true });
    for (i = 1; i <= dim; i++) cells.push({ day: i, out: false });
    var nextDay = 1;
    while (cells.length < 42) cells.push({ day: nextDay++, out: true });

    var grid = h('div', 'calendar__grid');
    cells.forEach(function (c) {
      var key = y + '-' + m + '-' + c.day;
      var marked = !c.out && !!DATA.CAL_EVENTS[key];
      var isToday = !c.out && today.y === y && today.m === m && today.d === c.day;
      var isSel = !c.out && state.selDay === key;
      var cls = 'calendar__cell';
      if (c.out) cls += ' calendar__cell--out';
      if (marked) cls += ' is-marked';
      if (isToday) cls += ' is-today';
      if (isSel) cls += ' is-selected';
      var cell;
      if (c.out) {
        cell = h('div', cls, String(c.day));
      } else {
        cell = h('button', cls, String(c.day));
        cell.type = 'button';
        if (marked) cell.setAttribute('aria-label', c.day + ' ' + AR_MONTHS[m - 1] + ' — يحتوي أحداثاً');
        cell.addEventListener('click', (function (dd) {
          return function () { selectDay(y, m, dd); };
        })(c.day));
      }
      grid.appendChild(cell);
    });
    box.appendChild(grid);
  }

  function selectDay(y, m, d) {
    state.selDay = y + '-' + m + '-' + d;
    renderCalendar();
    renderDayEvents();
  }

  function calShift(delta) {
    var m = state.cal.m + delta, y = state.cal.y;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    state.cal = { y: y, m: m };
    renderCalendar();
  }

  function renderDayEvents() {
    var box = slot('day-events'); if (!box) return; clear(box);
    var p = state.selDay.split('-'), y = +p[0], m = +p[1], d = +p[2];
    var dateEl = $('[data-day-date]');
    if (dateEl) dateEl.textContent = d + ' ' + AR_MONTHS[m - 1] + ' ' + y;

    var evs = DATA.CAL_EVENTS[state.selDay] || [];
    if (!evs.length) {
      var empty = h('div', 'day-empty');
      var icon = h('div', 'day-empty__icon', '🗓'); icon.setAttribute('aria-hidden', 'true');
      empty.appendChild(icon);
      empty.appendChild(h('p', 'day-empty__title', 'لا توجد أحداث موثّقة في هذا اليوم'));
      empty.appendChild(h('p', 'day-empty__text', 'اختر يوماً معلّماً بنقطة على التقويم لعرض الأحداث والتقارير الموثّقة فيه.'));
      box.appendChild(empty);
      return;
    }

    evs.forEach(function (ev) {
      var item = h('a', 'day-event'); item.href = '#'; item.setAttribute('data-st', '');
      if (ev.img) {
        var img = h('img', 'day-event__thumb');
        img.src = ev.img; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
        img.width = 96; img.height = 68;
        item.appendChild(img);
      } else {
        var ph = h('div', 'day-event__thumb day-event__thumb--icon', '⚑');
        ph.setAttribute('aria-hidden', 'true');
        item.appendChild(ph);
      }
      var body = h('div', 'day-event__body');
      body.appendChild(h('span', 'day-event__tag', ev.tag));
      body.appendChild(h('p', 'day-event__title', ev.t));
      item.appendChild(body);
      box.appendChild(item);
    });
  }

  // ===== شريط التحديثات الحيّة =====
  function renderTicker() {
    var box = slot('ticker'); if (!box) return; clear(box);
    function build() {
      DATA.TICKER.forEach(function (it) {
        var a = h('a', 'ticker__item'); a.href = '#';
        a.appendChild(h('span', 'ticker__item-date', it.d));
        var type = h('span', 'ticker__item-type', it.type);
        cssVar(type, '--tone', 'var(--' + (it.tone || 'accent') + ')');
        a.appendChild(type);
        a.appendChild(h('span', 'ticker__item-text', it.t + ' — ' + it.gov));
        box.appendChild(a);
      });
    }
    build(); build(); // نسختان للالتفاف السلس
  }

  // ===== المرئيات + Lightbox =====
  var _lbIndex = 0;
  function renderVisuals() {
    var box = slot('visuals'); if (!box) return; clear(box);
    DATA.VISUALS.forEach(function (v, i) {
      var item = h('button', 'gallery__item'); item.type = 'button';
      item.setAttribute('aria-label', 'عرض الصورة: ' + v.caption);
      var img = h('img', 'gallery__img'); img.src = v.img; img.alt = v.caption; img.loading = 'lazy'; img.decoding = 'async';
      item.appendChild(img);
      var zoom = h('span', 'gallery__zoom', '⤢'); zoom.setAttribute('aria-hidden', 'true'); item.appendChild(zoom);
      var ov = h('div', 'gallery__overlay'); ov.appendChild(h('span', 'gallery__caption', v.caption)); item.appendChild(ov);
      item.addEventListener('click', function () { openLightbox(i); });
      box.appendChild(item);
    });
  }
  function updateLightbox() {
    var v = DATA.VISUALS[_lbIndex]; if (!v) return;
    var img = $('[data-lightbox-img]'); if (img) { img.src = v.img; img.alt = v.caption; }
    var cap = $('[data-lightbox-caption]'); if (cap) cap.textContent = v.caption;
  }
  var _lbOpener = null;
  function openLightbox(i) {
    _lbIndex = i; updateLightbox();
    var lb = $('[data-lightbox]'); if (!lb) return;
    _lbOpener = document.activeElement;
    lb.hidden = false;
    document.body.classList.add('lb-open');
    var closeBtn = lb.querySelector('.lightbox__close');
    if (closeBtn && closeBtn.focus) closeBtn.focus();
  }
  function closeLightbox() {
    var lb = $('[data-lightbox]'); if (lb) lb.hidden = true;
    document.body.classList.remove('lb-open');
    if (_lbOpener && _lbOpener.focus) _lbOpener.focus();
    _lbOpener = null;
  }
  function lbStep(delta) {
    _lbIndex = (_lbIndex + delta + DATA.VISUALS.length) % DATA.VISUALS.length;
    updateLightbox();
  }

  function renderHist() {
    var m = monthly();
    var since = m.tot.slice(69).reduce(function (a, b) { return a + b; }, 0);
    var before = m.tot.slice(0, 69).reduce(function (a, b) { return a + b; }, 0);
    var pct = Math.round(since / (since + before) * 100);
    var elPct = slot('hist-pct'); if (elPct) elPct.textContent = String(pct);
    var elSince = slot('hist-since'); if (elSince) elSince.textContent = fmt(since * 4.1);
    var elBefore = slot('hist-before'); if (elBefore) elBefore.textContent = fmt(before * 4.1);
    var barSince = $('[data-hist-since-bar]'); if (barSince) cssVar(barSince, '--w', pct + '%');
    var barBefore = $('[data-hist-before-bar]'); if (barBefore) cssVar(barBefore, '--w', (100 - pct) + '%');
  }

  /* =========================================================================
     6) Count-up + reveal
     ========================================================================= */
  function countUp() {
    var nodes = $$('[data-count]');
    if (reduceMotion) {
      nodes.forEach(function (el) { el.textContent = fmt(parseFloat(el.getAttribute('data-count'))); });
      return;
    }
    var dur = 1300, start = null;
    function tick(now) {
      if (start === null) start = now;
      var p = Math.min(1, (now - start) / dur);
      p = 1 - Math.pow(1 - p, 3);
      nodes.forEach(function (el) { el.textContent = fmt(parseFloat(el.getAttribute('data-count')) * p); });
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function reveal() {
    var items = $$('.rv');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* =========================================================================
     7) Events
     ========================================================================= */
  // الرسوم التي تعتمد ألوانها على السمة تحتاج إعادة بناء عند تبديلها
  function renderThemed() {
    renderHeroRing();
    renderSparks();
    setTiles();
    refreshMap();
    renderMapRank();
    renderTrend();
    renderDonut();
    renderHeat();
  }

  function setActive(buttons, attr, value) {
    buttons.forEach(function (b) {
      var on = b.getAttribute(attr) === value;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  function bindEvents() {
    // تبديل الوضع (فاتح / داكن)
    var toggle = $('[data-theme-toggle]');
    if (toggle) toggle.addEventListener('click', function () {
      var dark = root.getAttribute('data-mode') === 'dark';
      root.setAttribute('data-mode', dark ? 'light' : 'dark');
      var icon = toggle.querySelector('.theme-toggle__icon') || toggle;
      icon.textContent = dark ? '☾' : '☀';
      try { localStorage.setItem('m3-mode', root.getAttribute('data-mode')); } catch (e) {}
      renderThemed();
    });

    // الاتجاه التحريري (يغيّر اللون المميّز)
    var dirBtns = $$('[data-dir-set]');
    dirBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var v = btn.getAttribute('data-dir-set');
        root.setAttribute('data-dir', v);
        setActive(dirBtns, 'data-dir-set', v);
        try { localStorage.setItem('m3-dir', v); } catch (e) {}
        renderThemed();
      });
    });

    // مقياس الخريطة
    var mapBtns = $$('[data-map-metric]');
    mapBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.mapMetric = btn.getAttribute('data-map-metric');
        state.mapHover = null;
        setActive(mapBtns, 'data-map-metric', state.mapMetric);
        syncTypeFromMetric();
        refreshMap();
        renderMapRank();
      });
    });

    // شريط الفلاتر: تطبيق / إعادة الضبط
    var applyBtn = $('[data-filter-apply]');
    if (applyBtn) applyBtn.addEventListener('click', applyFilters);
    var resetBtn = $('[data-filter-reset]');
    if (resetBtn) resetBtn.addEventListener('click', resetFilters);

    // نوع مخطط الاتجاه
    var trendBtns = $$('[data-trend]');
    trendBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.trendType = btn.getAttribute('data-trend');
        setActive(trendBtns, 'data-trend', state.trendType);
        renderTrend();
      });
    });

    // فئة الخريطة الحرارية
    var heatBtns = $$('[data-heat-cat]');
    heatBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.heatCat = btn.getAttribute('data-heat-cat');
        setActive(heatBtns, 'data-heat-cat', state.heatCat);
        renderHeat();
      });
    });

    // فئة العمليات (تفويض الحدث لأن الأزرار مُولّدة)
    var opsTabs = slot('ops-tabs');
    if (opsTabs) opsTabs.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-op-cat]'); if (!btn) return;
      state.opCat = btn.getAttribute('data-op-cat');
      setActive($$('[data-op-cat]', opsTabs), 'data-op-cat', state.opCat);
      renderOps();
    });

    // تنقّل شهور التقويم
    var calPrev = $('[data-cal-prev]');
    if (calPrev) calPrev.addEventListener('click', function () { calShift(-1); });
    var calNext = $('[data-cal-next]');
    if (calNext) calNext.addEventListener('click', function () { calShift(1); });

    // المرئيات: Lightbox
    $$('[data-lightbox-close]').forEach(function (el) { el.addEventListener('click', closeLightbox); });
    var lbPrev = $('[data-lightbox-prev]'); if (lbPrev) lbPrev.addEventListener('click', function () { lbStep(-1); });
    var lbNext = $('[data-lightbox-next]'); if (lbNext) lbNext.addEventListener('click', function () { lbStep(1); });
    document.addEventListener('keydown', function (e) {
      var lb = $('[data-lightbox]'); if (!lb || lb.hidden) return;
      if (e.key === 'Escape') { closeLightbox(); return; }
      if (e.key === 'ArrowRight') { lbStep(-1); return; }
      if (e.key === 'ArrowLeft') { lbStep(1); return; }
      if (e.key === 'Tab') {
        var f = Array.prototype.filter.call(
          lb.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])'),
          function (el) { return !el.disabled && el.offsetParent !== null; }
        );
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // شريط التحديثات: إيقاف/تشغيل
    var tkToggle = $('[data-ticker-toggle]');
    if (tkToggle) tkToggle.addEventListener('click', function () {
      var sec = tkToggle.closest('.ticker'); if (!sec) return;
      var paused = sec.classList.toggle('is-paused');
      tkToggle.textContent = paused ? '▶' : '⏸';
    });
  }

  /* =========================================================================
     8) Init
     ========================================================================= */
  function restorePrefs() {
    try {
      var mode = localStorage.getItem('m3-mode');
      var dir = localStorage.getItem('m3-dir');
      if (mode) root.setAttribute('data-mode', mode);
      if (dir) root.setAttribute('data-dir', dir);
    } catch (e) {}
    var toggle = $('[data-theme-toggle]');
    if (toggle) {
      var icon = toggle.querySelector('.theme-toggle__icon') || toggle;
      icon.textContent = root.getAttribute('data-mode') === 'dark' ? '☀' : '☾';
    }
    var v = root.getAttribute('data-dir');
    setActive($$('[data-dir-set]'), 'data-dir-set', v);
  }

  function init() {
    restorePrefs();

    // المحتوى الثابت (يُبنى مرّة واحدة)
    renderFilters();
    renderTicker();
    renderVisuals();
    renderHero();
    renderKpisLead();
    renderKpisSub();
    renderMapRank();
    renderOpsTabs();
    renderOps();
    renderTopGov5();
    renderCommon();
    renderViolations();
    renderVictimBars();
    renderVictimRatios();
    renderWeek();
    renderTop10();
    renderTimeline();
    renderArticles();
    renderCalendar();
    renderDayEvents();
    renderHist();

    // الرسوم المعتمدة على السمة
    renderHeroRing();
    renderSparks();
    initMap();
    renderTrend();
    renderDonut();
    renderHeat();

    bindEvents();

    // مزامنة حالة aria-pressed الابتدائية لمجموعات الأزرار (التحديد المفرد)
    setActive($$('[data-map-metric]'), 'data-map-metric', state.mapMetric);
    setActive($$('[data-trend]'), 'data-trend', state.trendType);
    setActive($$('[data-heat-cat]'), 'data-heat-cat', state.heatCat);

    countUp();
    reveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // واجهة صغيرة للقراءة فقط لإعادة الاستخدام في صفحات المحافظات (governorates.js / governorate.js)
  // لا تؤثّر على الصفحات الحالية (تتجاهل window.M3).
  window.M3 = {
    DATA: DATA, fmt: fmt, rng: rng, theme: theme,
    mapVals: mapVals, geoStyle: geoStyle, govIndexForName: govIndexForName,
    initMap: initMap, zoomToGov: zoomToGov, refreshMap: refreshMap,
    openLightbox: openLightbox,
    fitAll: function () { if (_map) _map.fitBounds([[31.18, 34.15], [32.62, 35.62]], { padding: [12, 12] }); }
  };
})();
