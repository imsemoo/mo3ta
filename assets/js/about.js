/* ==========================================================================
   مُعطى — صفحة «من نحن» (about_us.html)
   about.js — يملأ شريط الحصيلة الموثّقة من بيانات window.M3 الحيّة (قيم نهائية).
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

  function renderTrust() {
    var box = slot('about-trust'); if (!box) return; clear(box);
    function item(v, l) { var it = h('div', 'trust__item'); it.appendChild(h('div', 'trust__value', v)); it.appendChild(h('div', 'trust__label', l)); return it; }
    box.appendChild(item(fmt(heroTarget('events') || 434505), 'حدثاً موثّقاً'));
    box.appendChild(h('div', 'trust__sep'));
    box.appendChild(item(String(GOV.length || 12), 'محافظة'));
    box.appendChild(h('div', 'trust__sep'));
    box.appendChild(item('102', 'شهراً متواصلاً'));
    box.appendChild(h('div', 'trust__sep'));
    box.appendChild(item('+50', 'مصدراً موثوقاً'));
    var link = h('a', 'trust__link', 'استعرض اللوحة ↓'); link.href = 'index.html';
    box.appendChild(link);
  }

  function init() { renderTrust(); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
