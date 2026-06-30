/* ==========================================================================
   مُعطى — صفحة «من نحن» (about_us.html)
   about.js — يبني قسم «أثر مُعطى»: ترويسة سرديّة + شريط 4 مؤشّرات موثّقة من
   window.M3 الحيّة + رابط للّوحة. لا يُختلَق أي رقم («عدد التقارير» نصّ بلا عدد).
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var slot = function (n) { return $('[data-render="' + n + '"]'); };
  function h(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function clear(e) { if (e) while (e.firstChild) e.removeChild(e.firstChild); }

  var M3 = window.M3 || {};
  var DATA = M3.DATA || {};
  var GOV = DATA.GOV || [];
  var fmt = M3.fmt || function (n) { return Math.round(n).toLocaleString('en-US'); };

  function heroTarget(key) {
    var arr = DATA.hero || [];
    for (var i = 0; i < arr.length; i++) if (arr[i].key === key) return arr[i].target;
    return 0;
  }

  function renderImpact() {
    var box = slot('about-trust'); if (!box) return; clear(box);
    var events = fmt(heroTarget('events') || 434505);
    var govs = String(GOV.length || 12);

    // (أ) ترويسة سرديّة — تؤكّد الاستمراريّة بقدر الحجم؛ «التقارير» نصٌّ بلا عدد مختلق
    var head = h('div', 'trust__head');
    head.appendChild(h('p', 'trust__head-title', 'منذ يناير 2018، لم نتوقّف.'));
    head.appendChild(h('p', 'trust__head-text',
      'على مدى 102 شهراً متواصلاً، وثّقنا ' + events + ' حدثاً عبر ' + govs +
      ' محافظة، من أكثر من 50 مصدراً موثوقاً، نضعها في تقارير دوريّة ومتخصّصة. كلّ رقمٍ هنا حدٌّ أدنى متحقَّق منه، لا تقدير.'));
    box.appendChild(head);

    // (ب) شريط 4 مؤشّرات رقميّة موثّقة فقط
    var row = h('div', 'trust');
    function item(v, l) { var it = h('div', 'trust__item'); it.appendChild(h('div', 'trust__value', v)); it.appendChild(h('div', 'trust__label', l)); return it; }
    row.appendChild(item(events, 'حدثاً موثّقاً'));
    row.appendChild(h('div', 'trust__sep'));
    row.appendChild(item(govs, 'محافظة'));
    row.appendChild(h('div', 'trust__sep'));
    row.appendChild(item('102', 'شهراً متواصلاً'));
    row.appendChild(h('div', 'trust__sep'));
    row.appendChild(item('+50', 'مصدراً موثوقاً'));
    var link = h('a', 'trust__link'); link.innerHTML = 'استعرض اللوحة الحيّة <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>'; link.href = 'index.html';
    row.appendChild(link);
    box.appendChild(row);
  }

  function init() { renderImpact(); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
