/* ==========================================================================
   مُعطى — «الخطّ الزمني» (timeline.html)
   timeline.js — خطّ زمني يرسم نفسه مع التمرير: عمود فقري يتعبّأ، محطّات تنزلق
   عند الوصول إليها، ومشهدان مفصليّان كاملا العرض. كل رقم/حدث موثّق من DATA.CAL_EVENTS
   (لا أرقام مُختلقة). يحاكي بنية narrative.js (IntersectionObserver) وحساب تقدّم single.js.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var slot = function (n) { return $('[data-render="' + n + '"]'); };
  function h(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function clear(e) { if (e) while (e.firstChild) e.removeChild(e.firstChild); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  var M3 = window.M3 || {};
  var DATA = M3.DATA || {};
  var CAL = DATA.CAL_EVENTS || {};
  var VISUALS = DATA.VISUALS || [];
  var fmt = M3.fmt || function (n) { return Math.round(n).toLocaleString('en-US'); };

  var AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  // المحطّات المفصلية (مفاتيحها موجودة فعلاً في CAL_EVENTS — نعرضها بمعالجة درامية)
  var SCENES = {
    '2021-5-14': { eyebrow: 'الذروة التاريخية', title: 'أعلى حصيلة يومية موثّقة', metric: '556', metricLabel: 'حدثاً موثّقاً في يومٍ واحد', note: 'أعلى عددٍ يومي في السجلّ — لا يُقدَّم كحصيلة بشرية نهائية.' },
    '2023-10-7': { eyebrow: 'محطّة فاصلة', title: 'السابع من أكتوبر 2023', metric: null, note: 'بدء «طوفان الأقصى» — منعطفٌ تضاعف بعده إيقاع الرصد والتوثيق الميداني عبر المحافظات كافّة.' }
  };

  // وسم الحدث → لون دلالي (مراجع توكنز فقط، لا قيم لونية — يحترم الفاتح/الداكن)
  var TAG_TONE = {
    'تقرير دوري': 'violations', 'تقرير خاص': 'crimes', 'رواية مصوّرة': 'accent',
    'إنفوغرافيك': 'accent', 'رصد ميداني': 'violations', 'حدث مفصلي': 'casualties', 'ذروة تاريخية': 'casualties'
  };
  function toneVar(tag) { return 'var(--' + (TAG_TONE[tag] || 'accent') + ')'; }

  function parseKey(k) { var p = k.split('-'); return { y: +p[0], m: +p[1], d: +p[2] }; }
  function arDate(o) { return o.d + ' ' + AR_MONTHS[o.m - 1] + ' ' + o.y; }
  function isoDate(o) { return o.y + '-' + String(o.m).padStart(2, '0') + '-' + String(o.d).padStart(2, '0'); }
  function imgIndex(url) { for (var i = 0; i < VISUALS.length; i++) if (VISUALS[i].img === url) return i; return -1; }

  // النموذج: مفاتيح CAL مفروزة تصاعدياً (الأقدم أولاً — السجلّ يُكتب إلى الأمام)
  var keys = Object.keys(CAL).sort(function (a, b) {
    var A = parseKey(a), B = parseKey(b);
    return A.y - B.y || A.m - B.m || A.d - B.d;
  });

  var revealEls = [], dotEls = [], railTargets = [];

  function buildDate(o, cls) {
    var t = h('time', cls, arDate(o));
    t.setAttribute('datetime', isoDate(o));
    return t;
  }

  function buildEntry(key, side) {
    var o = parseKey(key), evs = CAL[key] || [];
    var li = h('li', 'tl-entry');
    li.setAttribute('data-side', side);
    li.appendChild(h('span', 'tl-entry__node'));
    var card = h('article', 'tl-card');
    if (evs[0] && evs[0].tag) card.style.setProperty('--tone', toneVar(evs[0].tag));
    card.appendChild(buildDate(o, 'tl-card__date num'));
    if (evs[0] && evs[0].tag) card.appendChild(h('span', 'tl-card__tag', evs[0].tag));
    evs.forEach(function (ev, ei) {
      var item = h('div', 'tl-card__event');
      item.appendChild(h(ei === 0 ? 'h3' : 'p', 'tl-card__title', ev.t));
      if (ev.img) {
        var idx = imgIndex(ev.img), media;
        if (idx >= 0 && M3.openLightbox) {
          media = h('button', 'tl-card__media'); media.type = 'button';
          media.setAttribute('aria-label', 'تكبير الصورة: ' + ev.t);
          media.addEventListener('click', (function (k) { return function () { M3.openLightbox(k); }; })(idx));
        } else {
          media = h('div', 'tl-card__media');
        }
        var img = h('img', 'tl-card__img'); img.src = ev.img; img.alt = ev.t; img.loading = 'lazy'; img.decoding = 'async';
        media.appendChild(img); item.appendChild(media);
      }
      card.appendChild(item);
    });
    li.appendChild(card);
    return li;
  }

  function buildScene(key) {
    var o = parseKey(key), sc = SCENES[key];
    var li = h('li', 'tl-scene band band--dark');
    li.setAttribute('data-tl-scene', '');
    var inner = h('div', 'tl-scene__inner');
    inner.appendChild(h('p', 'tl-scene__eyebrow', sc.eyebrow));
    inner.appendChild(buildDate(o, 'tl-scene__date num'));
    inner.appendChild(h('h2', 'tl-scene__title', sc.title));
    if (sc.metric) {
      var m = h('p', 'tl-scene__metric');
      m.appendChild(h('span', 'num', sc.metric));
      m.appendChild(document.createTextNode(' ' + sc.metricLabel));
      inner.appendChild(m);
    }
    if (sc.note) inner.appendChild(h('p', 'tl-scene__note', sc.note));
    li.appendChild(inner);
    return li;
  }

  function renderTrack() {
    var track = slot('track'); if (!track) return;
    if (!keys.length) return; // لا بيانات → نُبقي بديل .tl-nojs كما هو
    clear(track);
    var lastYear = null, regIdx = 0;
    keys.forEach(function (key) {
      var o = parseKey(key), el;
      var yearBreak = (o.y !== lastYear);
      if (SCENES[key]) {
        el = buildScene(key);
      } else {
        el = buildEntry(key, regIdx % 2 === 0 ? 'start' : 'end');
        regIdx++;
      }
      if (yearBreak) {
        el.classList.add('tl--year-break');
        el.setAttribute('data-year', String(o.y));
        railTargets.push({ year: o.y, el: el });
        lastYear = o.y;
      }
      revealEls.push(el);
      track.appendChild(el);
    });
  }

  function renderRail() {
    var rail = slot('rail'); if (!rail) return; clear(rail);
    railTargets.forEach(function (t) {
      var dot = h('button', 'tl-rail__dot'); dot.type = 'button';
      dot.setAttribute('aria-label', 'الانتقال إلى ' + t.year);
      dot.appendChild(h('span', 'tl-rail__year', String(t.year)));
      dot.addEventListener('click', function () {
        t.el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      });
      dotEls.push(dot); rail.appendChild(dot);
    });
  }

  // كشف العناصر مع التمرير (يحاكي reveal في main.js)
  function wireReveal() {
    if (!hasIO || reduceMotion) { revealEls.forEach(function (e) { e.classList.add('is-visible'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (e) { io.observe(e); });
  }

  // إبراز العنصر المتوسّط + مزامنة نقاط السنوات (يحاكي setActiveStep في narrative.js)
  function wireActive() {
    if (!hasIO || reduceMotion || !revealEls.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        revealEls.forEach(function (el) { el.classList.toggle('is-active', el === e.target); });
        var activeYear = nearestYear(e.target);
        dotEls.forEach(function (d, i) {
          var on = railTargets[i] && railTargets[i].year === activeYear;
          d.classList.toggle('is-on', on);
          if (on) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
        });
      });
    }, { threshold: 0.55, rootMargin: '-20% 0px -35% 0px' });
    revealEls.forEach(function (e) { io.observe(e); });
  }

  function nearestYear(el) {
    // أقرب سنة سابقة لهذا العنصر ضمن railTargets حسب موضعه في revealEls
    var idx = revealEls.indexOf(el), year = railTargets.length ? railTargets[0].year : null;
    for (var i = 0; i <= idx; i++) {
      var k = revealEls[i].getAttribute('data-year');
      if (k) year = +k;
    }
    return year;
  }

  // العمود الفقري يتعبّأ مع التقدّم (يحاكي حساب single.js؛ تعبئة عمودية block-size فقط)
  function wireSpine() {
    var scrolly = $('[data-tl-scrolly]'); var fill = $('[data-tl-fill]');
    if (!scrolly || !fill || reduceMotion) return;
    var ticking = false;
    function update() {
      ticking = false;
      var r = scrolly.getBoundingClientRect();
      var center = window.innerHeight * 0.5;
      var p = clamp((center - r.top) / Math.max(1, r.height), 0, 1);
      fill.style.setProperty('--fill', (p * 100).toFixed(2) + '%');
    }
    function onScroll() { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  function init() {
    if (!slot('track')) return;
    renderTrack();
    renderRail();
    wireReveal();
    wireActive();
    wireSpine();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
