/* ==========================================================================
   مُعطى — «الخطّ الزمني» (timeline.html)
   timeline.js — خطّ زمني يرسم نفسه مع التمرير: عمود فقري يتعبّأ، محطّات تنزلق
   عند الوصول إليها، ومشهدان مفصليّان كاملا العرض. كل رقم/حدث موثّق من DATA.CAL_EVENTS
   (لا أرقام مُختلقة). يحاكي بنية narrative.js (IntersectionObserver) وحساب تقدّم single.js.
   إضافات: رابط/مشاركة لكل محطّة (deep-link #st-التاريخ)، شريحة محافظة + رابط التقرير،
   عدّاد تصاعديّ للمشهد الفاصل، نقل تركيز عند القفز، ونطق السنة النشطة (aria-live).
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

  // وسم الحدث → وجهة «اقرأ المزيد» (روابط حقيقيّة ضمن الموقع — لا روابط ميتة)
  function destFor(tag) {
    if (tag === 'رواية مصوّرة') return { href: 'visual_narrative.html', label: 'شاهد الرواية المصوّرة' };
    return { href: 'single_article.html', label: 'اقرأ التقرير' };
  }

  function parseKey(k) { var p = k.split('-'); return { y: +p[0], m: +p[1], d: +p[2] }; }
  function arDate(o) { return o.d + ' ' + AR_MONTHS[o.m - 1] + ' ' + o.y; }
  function isoDate(o) { return o.y + '-' + String(o.m).padStart(2, '0') + '-' + String(o.d).padStart(2, '0'); }
  function stationId(o) { return 'st-' + isoDate(o); }
  function imgIndex(url) { for (var i = 0; i < VISUALS.length; i++) if (VISUALS[i].img === url) return i; return -1; }

  // النموذج: مفاتيح CAL مفروزة تصاعدياً (الأقدم أولاً — السجلّ يُكتب إلى الأمام)
  var keys = Object.keys(CAL).sort(function (a, b) {
    var A = parseKey(a), B = parseKey(b);
    return A.y - B.y || A.m - B.m || A.d - B.d;
  });

  var revealEls = [], dotEls = [], railTargets = [], liveEl = null, lastYearSaid = null, toastEl = null, toastT = null;

  function buildDate(o, cls) {
    var t = h('time', cls, arDate(o));
    t.setAttribute('datetime', isoDate(o));
    return t;
  }

  /* ----- مشاركة/نسخ رابط المحطّة ----- */
  function stationUrl(id) { return location.origin + location.pathname + '#' + id; }
  function toast(msg) {
    if (!toastEl) {
      toastEl = h('div', 'tl-toast'); toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg; toastEl.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2400);
  }
  function copyLink(id) {
    var url = stationUrl(id);
    try { history.replaceState(null, '', '#' + id); } catch (e) {}
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { toast('نُسخ رابط المحطّة'); }, function () { toast(url); });
    } else { toast(url); }
  }
  function shareStation(id, title) {
    var url = stationUrl(id);
    if (navigator.share) { navigator.share({ title: 'مُعطى — ' + (title || 'محطّة موثّقة'), url: url }).catch(function () {}); }
    else { copyLink(id); }
  }

  function buildEntry(key, side) {
    var o = parseKey(key), evs = CAL[key] || [];
    var li = h('li', 'tl-entry');
    li.id = stationId(o);
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

    // تذييل البطاقة: محافظة (إن وُجدت) + رابط التقرير + أزرار رابط/مشاركة
    var foot = h('div', 'tl-card__foot');
    var gov = null; for (var gi = 0; gi < evs.length; gi++) { if (evs[gi].gov) { gov = evs[gi].gov; break; } }
    if (gov) {
      var gchip = h('span', 'tl-card__gov');
      gchip.innerHTML = '<i class="fa-solid fa-location-dot" aria-hidden="true"></i> ';
      gchip.appendChild(document.createTextNode(gov));
      foot.appendChild(gchip);
    }
    var dest = destFor(evs[0] && evs[0].tag);
    var link = h('a', 'tl-card__link'); link.href = dest.href;
    link.appendChild(document.createTextNode(dest.label + ' '));
    var li2 = h('i', 'fa-solid fa-arrow-left'); li2.setAttribute('aria-hidden', 'true'); link.appendChild(li2);
    foot.appendChild(link);

    var acts = h('div', 'tl-card__actions');
    var cBtn = h('button', 'tl-card__act'); cBtn.type = 'button'; cBtn.setAttribute('aria-label', 'نسخ رابط هذه المحطّة');
    cBtn.innerHTML = '<i class="fa-solid fa-link" aria-hidden="true"></i>';
    cBtn.addEventListener('click', (function (id) { return function () { copyLink(id); }; })(li.id));
    acts.appendChild(cBtn);
    if (navigator.share) {
      var sBtn = h('button', 'tl-card__act'); sBtn.type = 'button'; sBtn.setAttribute('aria-label', 'مشاركة هذه المحطّة');
      sBtn.innerHTML = '<i class="fa-solid fa-share-nodes" aria-hidden="true"></i>';
      sBtn.addEventListener('click', (function (id, t) { return function () { shareStation(id, t); }; })(li.id, evs[0] && evs[0].t));
      acts.appendChild(sBtn);
    }
    foot.appendChild(acts);
    card.appendChild(foot);

    li.appendChild(card);
    return li;
  }

  function buildScene(key) {
    var o = parseKey(key), sc = SCENES[key];
    var li = h('li', 'tl-scene band band--dark');
    li.id = stationId(o);
    li.setAttribute('data-tl-scene', '');
    var inner = h('div', 'tl-scene__inner');
    inner.appendChild(h('p', 'tl-scene__eyebrow', sc.eyebrow));
    inner.appendChild(buildDate(o, 'tl-scene__date num'));
    inner.appendChild(h('h2', 'tl-scene__title', sc.title));
    if (sc.metric) {
      var m = h('p', 'tl-scene__metric');
      var mv = h('span', 'num');
      mv.setAttribute('data-count-to', sc.metric.replace(/[^\d.]/g, ''));
      mv.textContent = reduceMotion ? sc.metric : '0';
      m.appendChild(mv);
      m.appendChild(document.createTextNode(' ' + sc.metricLabel));
      inner.appendChild(m);
    }
    if (sc.note) inner.appendChild(h('p', 'tl-scene__note', sc.note));

    // مشاركة المشهد الفاصل أيضاً
    var acts = h('div', 'tl-scene__actions');
    var cBtn = h('button', 'tl-card__act tl-card__act--light'); cBtn.type = 'button'; cBtn.setAttribute('aria-label', 'نسخ رابط هذه المحطّة');
    cBtn.innerHTML = '<i class="fa-solid fa-link" aria-hidden="true"></i>';
    cBtn.addEventListener('click', (function (id) { return function () { copyLink(id); }; })(li.id));
    acts.appendChild(cBtn);
    if (navigator.share) {
      var sBtn = h('button', 'tl-card__act tl-card__act--light'); sBtn.type = 'button'; sBtn.setAttribute('aria-label', 'مشاركة هذه المحطّة');
      sBtn.innerHTML = '<i class="fa-solid fa-share-nodes" aria-hidden="true"></i>';
      sBtn.addEventListener('click', (function (id, t) { return function () { shareStation(id, t); }; })(li.id, sc.title));
      acts.appendChild(sBtn);
    }
    inner.appendChild(acts);

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
        t.el.setAttribute('tabindex', '-1');
        try { t.el.focus({ preventScroll: true }); } catch (e) {}
      });
      dotEls.push(dot); rail.appendChild(dot);
    });
  }

  // عدّاد تصاعديّ لرقم المشهد عند ظهوره
  function countOne(el) {
    var to = parseFloat(el.getAttribute('data-count-to')); if (isNaN(to)) return;
    if (el.getAttribute('data-counted')) return; el.setAttribute('data-counted', '1');
    if (reduceMotion) { el.textContent = fmt(to); return; }
    var dur = 1100, start = null;
    function tick(now) {
      if (start === null) start = now;
      var p = Math.min(1, (now - start) / dur); p = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(to * p);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // كشف العناصر مع التمرير (يحاكي reveal في main.js)
  function wireReveal() {
    if (!hasIO || reduceMotion) {
      revealEls.forEach(function (e) { e.classList.add('is-visible'); var n = e.querySelector('[data-count-to]'); if (n) countOne(n); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          var n = e.target.querySelector('[data-count-to]'); if (n) countOne(n);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (e) { io.observe(e); });
  }

  // إبراز العنصر المتوسّط + مزامنة نقاط السنوات + نطق السنة (يحاكي setActiveStep في narrative.js)
  function wireActive() {
    if (!hasIO || reduceMotion || !revealEls.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        revealEls.forEach(function (el) { el.classList.toggle('is-active', el === e.target); });
        var activeYear = nearestYear(e.target);
        if (activeYear && activeYear !== lastYearSaid && liveEl) { liveEl.textContent = 'السنة ' + activeYear; lastYearSaid = activeYear; }
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

  // فتح رابطٍ مباشر لمحطّة (#st-التاريخ): تمرير + إبراز + تركيز
  function gotoHash() {
    var id = (location.hash || '').replace('#', '');
    if (!id) return;
    var el = document.getElementById(id);
    if (!el || !el.classList || el.className.indexOf('tl-') < 0) return;
    el.classList.add('is-visible', 'is-target');
    var n = el.querySelector('[data-count-to]'); if (n) countOne(n);
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    el.setAttribute('tabindex', '-1');
    setTimeout(function () { try { el.focus({ preventScroll: true }); } catch (e) {} }, reduceMotion ? 0 : 420);
    setTimeout(function () { el.classList.remove('is-target'); }, 2600);
  }

  function init() {
    if (!slot('track')) return;
    liveEl = h('div', 'visually-hidden'); liveEl.setAttribute('aria-live', 'polite');
    document.body.appendChild(liveEl);
    renderTrack();
    renderRail();
    wireReveal();
    wireActive();
    wireSpine();
    if (location.hash) setTimeout(gotoHash, 60);
    window.addEventListener('hashchange', gotoHash);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
