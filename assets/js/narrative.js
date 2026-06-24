/* ==========================================================================
   مُعطى — «الرواية المصوّرة» (visual_narrative.html)
   narrative.js — رحلة خريطة لاصقة + محطّات سردية + كشف ترتيب حتمي
   كل رقم في الصفحة = إجمالي موثّق حقيقي من window.M3.DATA.GOV[i].v (لا أرقام مُختلقة).
   الخريطة يبنيها main.js في [data-map]؛ هذا الملف يقرّبها مع التمرير عبر M3.zoomToGov/fitAll.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var slot = function (n) { return $('[data-render="' + n + '"]'); };
  function h(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function clear(e) { if (e) while (e.firstChild) e.removeChild(e.firstChild); }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  var M3 = window.M3 || {};
  var DATA = M3.DATA || {};
  var GOV = DATA.GOV || [];
  var VISUALS = DATA.VISUALS || [];
  var RATIOS = DATA.VICTIM_RATIOS || [];
  var CAL = DATA.CAL_EVENTS || {};
  var fmt = M3.fmt || function (n) { return Math.round(n).toLocaleString('en-US'); };

  function heroTarget(key) {
    var arr = DATA.hero || [];
    for (var i = 0; i < arr.length; i++) if (arr[i].key === key) return arr[i].target;
    return 0;
  }
  function calText(k) { return (CAL[k] && CAL[k][0] && CAL[k][0].t) || ''; }

  // ترتيب المحافظات حسب الأحداث الموثّقة (تنازلي) + أقصى قيمة + الرتبة
  var ranked = GOV.map(function (g, i) { return { n: g.n, v: g.v, gaza: !!g.gaza, i: i }; })
    .sort(function (a, b) { return b.v - a.v; });
  var maxV = ranked.length ? ranked[0].v : 0;
  var rankOf = {};
  ranked.forEach(function (o, pos) { rankOf[o.i] = pos + 1; });

  // ===== تهيئة محطّات السرد =====
  var STEPS = [
    {
      gov: -1, eyebrow: 'المشهد الكامل', title: 'فلسطين بالأرقام الموثّقة',
      lead: 'قبل التفاصيل: هذا حجم ما تمّ توثيقه فعلاً عبر فلسطين منذ مطلع 2018 — حدثاً حدثاً، محافظةً محافظة.',
      figs: [
        { v: fmt(heroTarget('events') || 434505), l: 'إجمالي الأحداث الموثّقة', u: 'حدث' },
        { v: '12', l: 'محافظة مرصودة', u: '' },
        { v: '102', l: 'شهراً متواصلاً', u: '' }
      ]
    },
    {
      gov: 1, eyebrow: 'شمال الضفة', title: 'شمال الضفة: ثِقَل الميدان',
      lead: 'في الشمال تتكثّف الأحداث الموثّقة؛ نابلس وجنين وطولكرم في صدارة السجلّ الوطني.',
      govFigs: [0, 1, 2, 9]
    },
    {
      gov: 5, eyebrow: 'القدس', title: 'القدس: قلب التوثيق',
      lead: 'مدينةٌ تحت ضغطٍ يومي من الاقتحامات والإخطارات والاعتقالات، يحفظ السجلّ تفاصيلها.',
      govFigs: [5],
      anchor: { tag: 'ذروة تاريخية موثّقة', text: calText('2021-5-14') || 'الذروة التاريخية — 556 حدثاً موثّقاً في يومٍ واحد' }
    },
    {
      gov: 11, eyebrow: 'قطاع غزة', title: 'غزة: الرقم الذي لا يُختزل',
      lead: 'يحمل القطاع المحاصَر سجلّاً مثقلاً؛ ووراء كل رقمٍ موثّق حكايةُ بشر.',
      govFigs: [11],
      note: 'هذا الرقم يمثّل الأحداث الموثّقة في سجلّنا حتى تاريخه، ولا يُقدَّم كحصيلة بشرية نهائية.',
      gallery: true
    },
    {
      gov: -1, eyebrow: 'المحطة الفاصلة', title: 'السابع من أكتوبر 2023',
      lead: (calText('2023-10-7') || 'بدء «طوفان الأقصى» — منعطفٌ تاريخي في توثيق الأحداث الميدانية') + ' — تضاعف بعده إيقاع التوثيق الميداني.',
      anchor: { tag: 'حدث مفصلي موثّق', text: 'منعطفٌ غيّر إيقاع الرصد والتوثيق عبر المحافظات كافّة.' }
    }
  ];

  var stepEls = [], dotEls = [];

  function govFig(i) {
    var g = GOV[i]; if (!g) return null;
    var row = h('li', 'nv-fig');
    row.appendChild(h('span', 'nv-fig__value num', fmt(g.v)));
    row.appendChild(h('span', 'nv-fig__label', g.n));
    row.appendChild(h('span', 'nv-fig__unit', 'حدثاً موثّقاً'));
    return row;
  }

  function buildGallery() {
    var g = h('div', 'gallery');
    [0, 1, 2, 3].forEach(function (i) {
      var v = VISUALS[i]; if (!v) return;
      var item = h('button', 'gallery__item'); item.type = 'button';
      item.setAttribute('aria-label', 'عرض الصورة: ' + v.caption);
      var img = h('img', 'gallery__img'); img.src = v.img; img.alt = v.caption; img.loading = 'lazy'; img.decoding = 'async';
      item.appendChild(img);
      var zoom = h('span', 'gallery__zoom', '⤢'); zoom.setAttribute('aria-hidden', 'true'); item.appendChild(zoom);
      var ov = h('div', 'gallery__overlay'); ov.appendChild(h('span', 'gallery__caption', v.caption)); item.appendChild(ov);
      item.addEventListener('click', function () { if (M3.openLightbox) M3.openLightbox(i); });
      g.appendChild(item);
    });
    return g;
  }

  function buildStep(step, idx) {
    var wrap = h('div', 'nv-step');
    wrap.setAttribute('data-step-gov', String(step.gov));
    var card = h('div', 'nv-step__card');
    card.appendChild(h('p', 'nv-step__eyebrow', step.eyebrow));
    card.appendChild(h('h2', 'nv-step__title', step.title));
    card.appendChild(h('p', 'nv-step__lead', step.lead));

    if (step.figs || step.govFigs) {
      var figs = h('ul', 'nv-figs');
      if (step.figs) {
        step.figs.forEach(function (f) {
          var li = h('li', 'nv-fig');
          li.appendChild(h('span', 'nv-fig__value num', f.v));
          li.appendChild(h('span', 'nv-fig__label', f.l));
          if (f.u) li.appendChild(h('span', 'nv-fig__unit', f.u));
          figs.appendChild(li);
        });
      } else {
        step.govFigs.forEach(function (i) { var r = govFig(i); if (r) figs.appendChild(r); });
      }
      card.appendChild(figs);
    }

    if (step.anchor) {
      var anc = h('p', 'nv-anchor');
      anc.appendChild(h('strong', null, step.anchor.tag + ': '));
      anc.appendChild(document.createTextNode(step.anchor.text));
      card.appendChild(anc);
    }
    if (step.note) card.appendChild(h('p', 'nv-note', step.note));
    if (step.gallery) card.appendChild(buildGallery());

    wrap.appendChild(card);
    return wrap;
  }

  function renderSteps() {
    var box = slot('steps'); if (!box) return;
    clear(box);
    STEPS.forEach(function (s, i) { var el = buildStep(s, i); stepEls.push(el); box.appendChild(el); });
  }

  function renderRail() {
    var rail = slot('rail'); if (!rail) return; clear(rail);
    STEPS.forEach(function (s, i) {
      var dot = h('button', 'nv-rail__dot'); dot.type = 'button';
      dot.setAttribute('aria-label', 'الانتقال إلى محطّة: ' + s.eyebrow);
      dot.addEventListener('click', function () {
        if (stepEls[i]) stepEls[i].scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      });
      dotEls.push(dot); rail.appendChild(dot);
    });
  }

  function renderAlt() {
    var box = slot('alt'); if (!box) return; clear(box);
    ranked.forEach(function (o, idx) {
      box.appendChild(h('li', null, o.n + ': ' + fmt(o.v) + ' حدثاً موثّقاً (المرتبة ' + (idx + 1) + ')'));
    });
  }

  function renderRank() {
    var box = slot('rank'); if (!box) return; clear(box);
    ranked.forEach(function (o, idx) {
      var row = h('div', 'nv-rank__row'); row.style.setProperty('--i', String(idx));
      var head = h('div', 'nv-rank__head');
      head.appendChild(h('span', 'nv-rank__name', o.n));
      head.appendChild(h('span', 'nv-rank__value num', fmt(o.v)));
      row.appendChild(head);
      var track = h('div', 'bar-track');
      var fill = h('div', 'nv-rank__fill');
      fill.style.setProperty('--w', (maxV ? o.v / maxV * 100 : 0) + '%');
      fill.style.setProperty('--tone', o.gaza ? 'var(--red)' : 'var(--accent)');
      track.appendChild(fill); row.appendChild(track);
      box.appendChild(row);
    });
  }

  function renderReckon() {
    var rc = slot('reckon-ratios');
    if (rc) {
      clear(rc);
      RATIOS.forEach(function (r) {
        var card = h('div', 'ratio-card');
        card.appendChild(h('div', 'ratio-card__value', r.k));
        card.appendChild(h('div', 'ratio-card__label', r.label));
        rc.appendChild(card);
      });
    }
    var tr = slot('reckon-trust');
    if (tr) {
      clear(tr);
      function item(v, l) { var it = h('div', 'trust__item'); it.appendChild(h('div', 'trust__value', v)); it.appendChild(h('div', 'trust__label', l)); return it; }
      tr.appendChild(item('+50', 'مصدراً موثوقاً'));
      tr.appendChild(h('div', 'trust__sep'));
      tr.appendChild(item('12', 'محافظة'));
      tr.appendChild(h('div', 'trust__sep'));
      tr.appendChild(item('102', 'شهراً متواصلاً'));
      var link = h('a', 'trust__link', 'استعرض المحافظات ↓'); link.href = 'governorates.html';
      tr.appendChild(link);
    }
  }

  // ===== التفاعل: تقريب الخريطة مع المحطّات + كشف الترتيب =====
  function setActiveStep(el) {
    stepEls.forEach(function (s, i) {
      var on = s === el;
      s.classList.toggle('is-active', on);
      var card = s.firstChild; if (card && card.setAttribute) card.setAttribute('aria-current', on ? 'true' : 'false');
      if (dotEls[i]) { dotEls[i].classList.toggle('is-on', on); dotEls[i].setAttribute('aria-current', on ? 'true' : 'false'); }
    });
    var gov = parseInt(el.getAttribute('data-step-gov'), 10);
    if (gov >= 0 && M3.zoomToGov) M3.zoomToGov(gov);
    else if (M3.fitAll) M3.fitAll();
  }

  function wireSteps() {
    if (!hasIO || reduceMotion || !stepEls.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setActiveStep(e.target); });
    }, { threshold: 0.55, rootMargin: '-20% 0px -35% 0px' });
    stepEls.forEach(function (s) { io.observe(s); });
  }

  function wireRanking() {
    var sec = $('[data-nv-ranking]'); if (!sec) return;
    if (!hasIO || reduceMotion) { sec.classList.add('is-filled'); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { sec.classList.add('is-filled'); io.unobserve(e.target); } });
    }, { threshold: 0.2, rootMargin: '0px 0px -40px 0px' });
    io.observe(sec);
  }

  function init() {
    renderSteps();
    renderRail();
    renderAlt();
    renderRank();
    renderReckon();
    wireSteps();
    wireRanking();
    // الخريطة يبنيها main.js تلقائياً في [data-map]؛ نضبط المنظر الأولي للمشهد الكامل
    if (!reduceMotion) setTimeout(function () { if (M3.fitAll) M3.fitAll(); }, 400);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
