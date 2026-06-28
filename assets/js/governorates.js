/* ==========================================================================
   مُعطى — صفحة فهرس المحافظات (governorates.html)
   governorates.js — ملخّص عام + شبكة بطاقات المحافظات مجمّعة حسب الإقليم
   يقرأ window.M3 (واجهة main.js للقراءة فقط) — لا يعدّل أي حالة عامّة.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var slot = function (n) { return $('[data-render="' + n + '"]'); };
  function h(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function clear(e) { if (e) while (e.firstChild) e.removeChild(e.firstChild); }

  var M3 = window.M3 || {};
  var GOV = (M3.DATA && M3.DATA.GOV) || [];
  var fmt = M3.fmt || function (n) { return Math.round(n).toLocaleString('en-US'); };

  // أقاليم — مطابقة لنموذج REGIONS في daily.js
  var REGIONS = [
    { k: 'wb', label: 'الضفة الغربية', idx: [0, 1, 2, 3, 4, 6, 7, 8, 9, 10] },
    { k: 'jeru', label: 'القدس', idx: [5] },
    { k: 'gaza', label: 'قطاع غزة', idx: [11] }
  ];
  function regionLabelFor(i) {
    for (var r = 0; r < REGIONS.length; r++) if (REGIONS[r].idx.indexOf(i) >= 0) return REGIONS[r].label;
    return '';
  }

  // أقصى قيمة + الترتيب الوطني حسب عدد الأحداث (تنازلي)
  var maxV = GOV.reduce(function (m, g) { return Math.max(m, g.v); }, 0);
  var rankOf = {};
  GOV.map(function (g, i) { return { i: i, v: g.v }; })
    .sort(function (a, b) { return b.v - a.v; })
    .forEach(function (o, pos) { rankOf[o.i] = pos + 1; });

  // ===== بطاقة محافظة =====
  function buildCard(i) {
    var g = GOV[i];
    var card = h('a', 'govx-card' + (g.gaza ? ' govx-card--gaza' : ''));
    card.href = 'city_town_info.html?gov=' + i;
    card.setAttribute('data-st', '');
    card.setAttribute('aria-label', g.n + ' — المرتبة ' + rankOf[i] + ' وطنياً — ' + fmt(g.v) + ' حدثاً موثّقاً — استعراض الملف');

    card.appendChild(h('span', 'govx-card__rank', '#' + rankOf[i]));
    card.appendChild(h('span', 'govx-card__name', g.n));
    card.appendChild(h('span', 'govx-card__region', regionLabelFor(i)));

    var value = h('span', 'govx-card__value num', fmt(g.v));
    card.appendChild(value);
    card.appendChild(h('span', 'govx-card__metric-label', 'حدثاً موثّقاً'));

    var track = h('div', 'bar-track'); track.setAttribute('aria-hidden', 'true');
    var fill = h('div', 'bar-fill bar-fill--tone');
    fill.style.setProperty('--w', (maxV ? g.v / maxV * 100 : 0) + '%');
    fill.style.setProperty('--tone', g.gaza ? 'var(--red)' : 'var(--accent)');
    track.appendChild(fill); card.appendChild(track);

    var cta = h('span', 'govx-card__cta');
    cta.appendChild(document.createTextNode('استعراض الملف'));
    var arrow = h('span', 'govx-card__arrow fa-solid fa-chevron-left'); arrow.setAttribute('aria-hidden', 'true');
    cta.appendChild(arrow);
    card.appendChild(cta);
    return card;
  }

  // ===== الملخّص العام (شريط ثقة) =====
  function renderSummary() {
    var box = slot('summary'); if (!box) return; clear(box);
    var total = GOV.reduce(function (s, g) { return s + g.v; }, 0);
    var top = GOV.reduce(function (a, g) { return g.v > a.v ? g : a; }, GOV[0] || { v: 0, n: '—' });

    function item(value, label) {
      var it = h('div', 'trust__item');
      it.appendChild(h('div', 'trust__value', value));
      it.appendChild(h('div', 'trust__label', label));
      return it;
    }
    box.appendChild(item('12', 'محافظة'));
    box.appendChild(h('div', 'trust__sep'));
    box.appendChild(item(fmt(total), 'حدث موثّق إجمالاً'));
    box.appendChild(h('div', 'trust__sep'));
    box.appendChild(item(top.n, 'الأكثر توثيقاً'));
    var link = h('a', 'trust__link'); link.innerHTML = 'ابدأ بالضفة الغربية <i class="fa-solid fa-arrow-down" aria-hidden="true"></i>'; link.href = '#region-wb';
    box.appendChild(link);
  }

  // ===== أقسام الأقاليم =====
  function renderRegion(r) {
    var grid = slot('region-' + r.k);
    if (grid) {
      clear(grid);
      r.idx.forEach(function (i) { grid.appendChild(buildCard(i)); });
    }
    var totalEl = slot('region-total-' + r.k);
    if (totalEl) {
      var sum = r.idx.reduce(function (s, i) { return s + (GOV[i] ? GOV[i].v : 0); }, 0);
      clear(totalEl);
      totalEl.appendChild(h('span', 'num', fmt(sum)));
      totalEl.appendChild(document.createTextNode(' حدثاً موثّقاً'));
    }
  }

  function init() {
    if (!GOV.length) return;
    renderSummary();
    REGIONS.forEach(renderRegion);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
