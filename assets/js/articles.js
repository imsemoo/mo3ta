/* ==========================================================================
   مُعطى — صفحة «التقارير» (الأرشيف)
   articles.js — تصفية/بحث/فرز/ترقيم لقائمة التقارير (فانيلا، مستقلّ عن main.js)
   البيانات في REPORTS = نقطة الربط بالـ CMS.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var slot = function (n) { return $('[data-render="' + n + '"]'); };
  function h(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function clear(e) { if (e) while (e.firstChild) e.removeChild(e.firstChild); }

  var IMG = 'assets/img/reports/';

  // فئات التقارير — كل فئة لها لون دلالي
  var CATS = [
    { k: 'all', label: 'الكل' },
    { k: 'periodic', label: 'تقرير دوري' },
    { k: 'special', label: 'تقرير خاص' },
    { k: 'violations', label: 'الانتهاكات' },
    { k: 'resistance', label: 'حصاد المقاومة' },
    { k: 'inside48', label: 'الداخل 48' }
  ];
  function catLabel(k) { for (var i = 0; i < CATS.length; i++) if (CATS[i].k === k) return CATS[i].label; return k; }
  function catTone(k) {
    return ({ periodic: 'accent', special: 'crimes', violations: 'violations', resistance: 'resistance', inside48: 'israeli' })[k] || 'accent';
  }

  // ===== البيانات (استبدلها/املأها من الـ CMS) =====
  var REPORTS = [
    { id: 70, cat: 'periodic', title: '16 شهيداً و248 جريحاً في 7,514 انتهاكاً إسرائيلياً في الضفة والقدس خلال سبتمبر 2025', excerpt: 'رصد مركز «معطى» استمرار قوات الاحتلال والمستوطنين في ارتكاب سلسلة واسعة من الانتهاكات بحق الفلسطينيين وممتلكاتهم خلال الشهر.', date: '2 أكتوبر 2025', ts: 20251002, img: IMG + 'report-1.webp', readMin: 7, gov: 'الضفة والقدس', views: 4820 },
    { id: 69, cat: 'resistance', title: '10 قتلى و51 جريحاً إسرائيلياً — عمليات نوعية تهزّ الاحتلال في الضفة والقدس خلال سبتمبر 2025', excerpt: 'توثيق لأبرز العمليات النوعية التي نفّذتها المقاومة في الضفة الغربية والقدس المحتلة وحصيلتها في صفوف الاحتلال.', date: '1 أكتوبر 2025', ts: 20251001, img: IMG + 'report-2.webp', readMin: 6, gov: 'الضفة والقدس', views: 6310 },
    { id: 67, cat: 'periodic', title: '7 شهداء و183 جريحاً في 6,009 انتهاكاً إسرائيلياً في الضفة والقدس خلال أغسطس 2025', excerpt: 'الحصاد الشهري الموثّق لانتهاكات الاحتلال والمستوطنين عبر محافظات الضفة الغربية والقدس خلال شهر أغسطس.', date: '2 سبتمبر 2025', ts: 20250902, img: IMG + 'report-3.webp', readMin: 7, gov: 'الضفة والقدس', views: 3990 },
    { id: 66, cat: 'resistance', title: '7 جرحى إسرائيليين و263 عملاً مقاوماً في الضفة الغربية خلال أغسطس 2025', excerpt: 'رصدت الضفة الغربية والقدس استمرارًا لأعمال المقاومة المتنوّعة خلال الشهر، نوثّق أبرزها وحصيلتها.', date: '1 سبتمبر 2025', ts: 20250901, img: IMG + 'report-4.webp', readMin: 5, gov: 'الضفة الغربية', views: 4520 },
    { id: 61, cat: 'special', title: 'تقرير خاص — الحواجز والبوابات الحديدية: تقطيعٌ لأوصال الضفة الغربية', excerpt: 'قراءة في منظومة الحواجز والبوابات الحديدية وأثرها على حركة الفلسطينيين وتقطيع التواصل الجغرافي بين المدن والقرى.', date: '18 سبتمبر 2025', ts: 20250918, img: IMG + 'special-1.webp', readMin: 9, gov: 'الضفة الغربية', views: 7180 },
    { id: 55, cat: 'special', title: 'تقرير خاص: الشعارات التي ظهرت على منصّة تسليم الأسرى في صفقة التبادل الرابعة', excerpt: 'تحليل دلالات الشعارات والرموز التي ظهرت على منصّة تسليم الأسرى في الجزء الثاني من صفقة التبادل الرابعة.', date: '1 فبراير 2025', ts: 20250201, img: IMG + 'special-2.webp', readMin: 8, gov: 'غزة', views: 9240 },
    { id: 54, cat: 'special', title: 'تقرير خاص: دلالات الرموز ونوعية السلاح الذي غنمته المقاومة في جباليا', excerpt: 'قراءة في الرموز ونوعية السلاح الذي ظهر تحت أقدام المقاومة في مخيّم جباليا ودلالاته الميدانية.', date: '30 يناير 2025', ts: 20250130, img: IMG + 'special-3.webp', readMin: 8, gov: 'غزة', views: 8650 },
    { id: 52, cat: 'violations', title: '60,758 اقتحاماً و54,385 اعتقالاً — حصيلة انتهاكات الاحتلال التراكمية في الضفة', excerpt: 'جردة شاملة لاقتحامات الاحتلال وحملات الاعتقال وتضييقات الحواجز وتدمير الممتلكات منذ بداية التوثيق.', date: '15 يوليو 2025', ts: 20250715, img: IMG + 'report-1.webp', readMin: 10, gov: 'الضفة الغربية', views: 5120 },
    { id: 49, cat: 'periodic', title: 'الحصاد الشهري الموثّق لانتهاكات الاحتلال في الضفة والقدس خلال يوليو 2025', excerpt: 'تقرير دوري يرصد الانتهاكات والاعتقالات والإصابات عبر محافظات الضفة الغربية والقدس المحتلة خلال يوليو.', date: '2 أغسطس 2025', ts: 20250802, img: IMG + 'report-3.webp', readMin: 6, gov: 'الضفة والقدس', views: 3410 },
    { id: 47, cat: 'resistance', title: 'حراكات وأعمال مقاومة شعبية: 55,516 فعلاً موثّقاً في الضفة الغربية', excerpt: 'توثيق لأبرز المواجهات وصدّ المستوطنين والتظاهرات والفعاليات الشعبية عبر محافظات الضفة الغربية.', date: '20 يونيو 2025', ts: 20250620, img: IMG + 'report-4.webp', readMin: 5, gov: 'الضفة الغربية', views: 2980 },
    { id: 44, cat: 'inside48', title: 'رصد خاص: ملاحقة الفلسطينيين في الداخل المحتل عام 1948', excerpt: 'تقرير يرصد سياسات الملاحقة والاعتقال بحق فلسطينيي الداخل المحتل عام 1948 خلال الفترة الأخيرة.', date: '12 يونيو 2025', ts: 20250612, img: IMG + 'special-1.webp', readMin: 7, gov: 'أراضي 48', views: 2240 },
    { id: 41, cat: 'violations', title: 'تقرير: حصيلة الاعتقالات في الضفة الغربية منذ بداية العام', excerpt: 'جردة بأعداد المعتقلين وتوزيعهم على المحافظات وأبرز حملات الاعتقال الجماعي منذ مطلع العام.', date: '5 أغسطس 2025', ts: 20250805, img: IMG + 'report-2.webp', readMin: 6, gov: 'الضفة الغربية', views: 3120 },
    { id: 38, cat: 'periodic', title: '9 شهداء و210 جرحى في 5,840 انتهاكاً إسرائيلياً خلال يونيو 2025', excerpt: 'الحصاد الشهري الموثّق لانتهاكات الاحتلال والمستوطنين عبر محافظات الضفة الغربية والقدس خلال شهر يونيو.', date: '2 يوليو 2025', ts: 20250702, img: IMG + 'report-1.webp', readMin: 7, gov: 'الضفة والقدس', views: 2760 },
    { id: 33, cat: 'special', title: 'تقرير خاص: المستوطنون والاعتداءات الممنهجة على القرى الفلسطينية', excerpt: 'قراءة في تصاعد اعتداءات المستوطنين الممنهجة على القرى الفلسطينية وأراضيها وممتلكاتها وأنماطها المتكرّرة.', date: '22 مايو 2025', ts: 20250522, img: IMG + 'special-3.webp', readMin: 9, gov: 'الضفة الغربية', views: 4080 }
  ];

  var TAGS = ['انتهاكات', 'الضفة الغربية', 'القدس', 'اعتقالات', 'هدم', 'مقاومة', 'المستوطنون', 'غزة', 'شهداء', 'الأسرى'];

  // ===== الحالة =====
  var state = { cat: 'all', q: '', sort: 'newest', shown: 6 };
  var PER = 6;
  var FEATURED = REPORTS.slice().sort(function (a, b) { return b.ts - a.ts; })[0];

  function filtered() {
    var list = REPORTS.filter(function (r) { return r.id !== FEATURED.id; });
    if (state.cat !== 'all') list = list.filter(function (r) { return r.cat === state.cat; });
    if (state.q) {
      var q = state.q.trim();
      list = list.filter(function (r) { return (r.title + ' ' + r.excerpt + ' ' + r.gov).indexOf(q) >= 0; });
    }
    list.sort(state.sort === 'read'
      ? function (a, b) { return b.views - a.views; }
      : function (a, b) { return b.ts - a.ts; });
    return list;
  }

  function badge(cat) {
    var b = h('span', 'rbadge', catLabel(cat));
    b.style.setProperty('--tone', 'var(--' + catTone(cat) + ')');
    return b;
  }

  function reportCard(r) {
    var card = h('a', 'rcard'); card.href = 'single_article.html'; card.setAttribute('data-st', '');
    var media = h('span', 'rcard__media');
    var img = h('img', 'rcard__img'); img.src = r.img; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async'; img.width = 480; img.height = 270;
    media.appendChild(img);
    media.appendChild(badge(r.cat));
    card.appendChild(media);
    var body = h('div', 'rcard__body');
    body.appendChild(h('h3', 'rcard__title', r.title));
    body.appendChild(h('p', 'rcard__excerpt', r.excerpt));
    var meta = h('div', 'rcard__meta');
    meta.appendChild(h('span', 'rcard__date', '🗓 ' + r.date));
    meta.appendChild(h('span', 'rcard__read', '⏱ ' + r.readMin + ' دقائق'));
    body.appendChild(meta);
    card.appendChild(body);
    return card;
  }

  function renderFeatured() {
    var box = slot('featured'); if (!box) return; clear(box);
    var r = FEATURED;
    var art = h('a', 'feature-report'); art.href = 'single_article.html'; art.setAttribute('data-st', '');
    var media = h('span', 'feature-report__media');
    var img = h('img', 'feature-report__img'); img.src = r.img; img.alt = ''; img.loading = 'eager'; img.decoding = 'async'; img.width = 760; img.height = 475;
    media.appendChild(img);
    art.appendChild(media);
    var body = h('div', 'feature-report__body');
    body.appendChild(badge(r.cat));
    body.appendChild(h('h2', 'feature-report__title', r.title));
    body.appendChild(h('p', 'feature-report__excerpt', r.excerpt));
    var meta = h('div', 'rcard__meta');
    meta.appendChild(h('span', 'rcard__date', '🗓 ' + r.date));
    meta.appendChild(h('span', 'rcard__read', '⏱ ' + r.readMin + ' دقائق'));
    body.appendChild(meta);
    var cta = h('span', 'feature-report__cta', 'اقرأ التقرير كاملاً ←');
    body.appendChild(cta);
    art.appendChild(body);
    box.appendChild(art);
  }

  function renderCats() {
    var box = slot('cats'); if (!box) return; clear(box);
    CATS.forEach(function (c) {
      var count = c.k === 'all' ? REPORTS.length : REPORTS.filter(function (r) { return r.cat === c.k; }).length;
      var btn = h('button', 'chip' + (c.k === state.cat ? ' is-active' : ''), c.label + ' · ' + count);
      btn.type = 'button';
      btn.setAttribute('data-cat-set', c.k);
      btn.setAttribute('aria-pressed', String(c.k === state.cat));
      btn.addEventListener('click', function () {
        state.cat = c.k; state.shown = PER;
        renderCats(); renderGrid();
      });
      box.appendChild(btn);
    });
  }

  function renderGrid() {
    var grid = slot('grid'); var countEl = slot('count');
    var list = filtered();
    if (countEl) {
      clear(countEl);
      countEl.appendChild(document.createTextNode('يظهر '));
      countEl.appendChild(h('strong', 'num', String(Math.min(state.shown, list.length))));
      countEl.appendChild(document.createTextNode(' من '));
      countEl.appendChild(h('strong', 'num', String(list.length)));
      countEl.appendChild(document.createTextNode(' تقريراً'));
    }
    if (!grid) return;
    clear(grid);
    if (!list.length) {
      var empty = h('div', 'archive-empty');
      var icon = h('div', 'archive-empty__icon', '🔍'); icon.setAttribute('aria-hidden', 'true');
      empty.appendChild(icon);
      empty.appendChild(h('p', 'archive-empty__title', 'لا توجد تقارير مطابقة'));
      empty.appendChild(h('p', 'archive-empty__text', 'جرّب تعديل الفلتر أو مسح البحث.'));
      var reset = h('button', 'btn btn--primary', 'مسح الفلاتر'); reset.type = 'button';
      reset.addEventListener('click', resetFilters);
      empty.appendChild(reset);
      grid.appendChild(empty);
    } else {
      list.slice(0, state.shown).forEach(function (r) { grid.appendChild(reportCard(r)); });
    }
    var more = $('[data-loadmore]');
    if (more && more.parentElement) more.parentElement.hidden = state.shown >= list.length || !list.length;
  }

  function resetFilters() {
    state.cat = 'all'; state.q = ''; state.sort = 'newest'; state.shown = PER;
    var search = $('[data-search]'); if (search) search.value = '';
    setActiveSort();
    renderCats(); renderGrid();
  }

  function renderPopular() {
    var box = slot('popular'); if (!box) return; clear(box);
    REPORTS.slice().sort(function (a, b) { return b.views - a.views; }).slice(0, 5).forEach(function (r, i) {
      var item = h('a', 'popular-item'); item.href = 'single_article.html';
      item.appendChild(h('span', 'popular-item__rank', String(i + 1)));
      var body = h('div', 'popular-item__body');
      body.appendChild(h('span', 'popular-item__title', r.title));
      body.appendChild(h('span', 'popular-item__meta', r.date + ' · ' + r.views.toLocaleString('en-US') + ' قراءة'));
      item.appendChild(body);
      box.appendChild(item);
    });
  }

  function renderTags() {
    var box = slot('tags'); if (!box) return; clear(box);
    TAGS.forEach(function (t) {
      var chip = h('button', 'tag-chip', '#' + t); chip.type = 'button';
      chip.addEventListener('click', function () {
        state.cat = 'all'; state.q = t; state.shown = PER;
        var search = $('[data-search]'); if (search) search.value = t;
        renderCats(); renderGrid();
        var grid = slot('grid'); if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      box.appendChild(chip);
    });
  }

  function setActiveSort() {
    $$('[data-sort]').forEach(function (b) { var on = b.getAttribute('data-sort') === state.sort; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', String(on)); });
  }

  function bind() {
    var search = $('[data-search]');
    if (search) {
      var t = null;
      search.addEventListener('input', function () {
        clearTimeout(t);
        t = setTimeout(function () { state.q = search.value; state.shown = PER; renderGrid(); }, 220);
      });
    }
    $$('[data-sort]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.sort = b.getAttribute('data-sort'); state.shown = PER;
        setActiveSort(); renderGrid();
      });
    });
    var more = $('[data-loadmore]');
    if (more) more.addEventListener('click', function () { state.shown += PER; renderGrid(); });
    var reset = $('[data-reset]');
    if (reset) reset.addEventListener('click', resetFilters);
  }

  function init() {
    renderFeatured();
    renderCats();
    renderGrid();
    renderPopular();
    renderTags();
    setActiveSort();
    bind();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
