/* ==========================================================================
   مُعطى — «بحث في الموقع» (search.html)
   search.js — بحث عميل (client-side) فوق فهرسٍ يُبنى من: صفحات الموقع +
   الأحداث الموثّقة (DATA.CAL_EVENTS، تربط بمحطّات الخطّ الزمني #st-) + المحافظات
   (DATA.GOV). فانيلا، مستقلّ، يقرأ window.M3.DATA. لا أرقام مُختلقة.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  function h(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function clear(e) { if (e) while (e.firstChild) e.removeChild(e.firstChild); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  var M3 = window.M3 || {};
  var DATA = M3.DATA || {};
  var AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  // ===== بناء الفهرس =====
  var INDEX = [];
  [
    { t: 'الرئيسية — لوحة البيانات', d: 'مؤشّرات وخرائط تفاعلية لتوزّع الأحداث الموثّقة عبر المحافظات والزمن.', u: 'index.html' },
    { t: 'منذ 7 أكتوبر — الرصد اليومي', d: 'مركز رصدٍ للأحداث الموثّقة منذ السابع من أكتوبر 2023.', u: 'daily_mo3ta.html' },
    { t: 'التقارير', d: 'الأرشيف التحريري: تقارير دورية وخاصة ودراسات موثّقة حول الانتهاكات والمقاومة.', u: 'articles.html' },
    { t: 'الرواية المصوّرة', d: 'سردٌ بصري يجمع الأرقام الموثّقة في رحلةٍ عبر الميدان الفلسطيني.', u: 'visual_narrative.html' },
    { t: 'الخطّ الزمني الموثّق', d: 'محطّات السجلّ الفلسطيني الموثّق تُقرأ بالتمرير.', u: 'timeline.html' },
    { t: 'المحافظات', d: 'ملفٌّ لكل محافظة فلسطينية: الموقع والجغرافيا وكثافة الأحداث.', u: 'governorates.html' },
    { t: 'من نحن', d: 'مركز معلومات فلسطين «مُعطى» — رؤيتنا ومبادئنا.', u: 'about_us.html' },
    { t: 'منهجية التوثيق', d: 'مراحل الرصد والإسناد والتصنيف الدلالي وحدود البيانات.', u: 'methodology.html' },
    { t: 'تواصل معنا', d: 'للاستفسارات الإعلامية والبحثية والتعاون والشراكات.', u: 'contact.html' }
  ].forEach(function (p) { INDEX.push({ title: p.t, snippet: p.d, type: 'صفحة', tone: 'accent', url: p.u }); });

  var CAL = DATA.CAL_EVENTS || {};
  Object.keys(CAL).forEach(function (k) {
    var p = k.split('-'), y = +p[0], m = +p[1], d = +p[2], iso = y + '-' + pad(m) + '-' + pad(d);
    (CAL[k] || []).forEach(function (ev) {
      INDEX.push({
        title: ev.t,
        snippet: (ev.gov ? ev.gov + ' · ' : '') + (ev.tag || '') + ' · ' + d + ' ' + AR_MONTHS[m - 1] + ' ' + y,
        type: 'حدث موثّق', tone: 'violations', url: 'timeline.html#st-' + iso
      });
    });
  });

  (DATA.GOV || []).forEach(function (g, i) {
    INDEX.push({
      title: 'محافظة ' + g.n,
      snippet: 'ملفّ المحافظة: الموقع والجغرافيا وكثافة الأحداث الموثّقة.',
      type: 'محافظة', tone: 'resistance', url: 'city_town_info.html?gov=' + i
    });
  });

  function norm(s) { return (s || '').toString().toLowerCase(); }

  function search(q) {
    q = norm(q).trim(); if (!q) return [];
    var terms = q.split(/\s+/);
    var out = [];
    INDEX.forEach(function (it) {
      var hayTitle = norm(it.title), hay = hayTitle + ' ' + norm(it.snippet) + ' ' + norm(it.type);
      var score = 0, ok = true;
      terms.forEach(function (t) {
        if (hay.indexOf(t) >= 0) { score += (hayTitle.indexOf(t) >= 0 ? 3 : 1); }
        else { ok = false; }
      });
      if (ok) out.push({ it: it, score: score });
    });
    out.sort(function (a, b) { return b.score - a.score; });
    return out.map(function (x) { return x.it; });
  }

  function render(q) {
    var box = $('[data-render="search-results"]'), cnt = $('[data-render="search-count"]');
    if (!box) return;
    clear(box);
    q = (q || '').trim();
    if (cnt) clear(cnt);
    if (!q) {
      if (cnt) cnt.textContent = 'اكتب كلمةً للبحث في صفحات الموقع والأحداث الموثّقة والمحافظات.';
      return;
    }
    var res = search(q);
    if (cnt) {
      cnt.appendChild(document.createTextNode('نتائج البحث عن «' + q + '»: '));
      cnt.appendChild(h('strong', 'num', String(res.length)));
    }
    if (!res.length) {
      var empty = h('div', 'archive-empty');
      var ic = h('div', 'archive-empty__icon fa-solid fa-magnifying-glass'); ic.setAttribute('aria-hidden', 'true'); empty.appendChild(ic);
      empty.appendChild(h('p', 'archive-empty__title', 'لا نتائج مطابقة'));
      empty.appendChild(h('p', 'archive-empty__text', 'جرّب كلماتٍ أخرى أو أكثر عمومية.'));
      box.appendChild(empty);
      return;
    }
    res.slice(0, 40).forEach(function (it) {
      var a = h('a', 'search-result'); a.href = it.url; a.setAttribute('data-st', '');
      a.style.setProperty('--tone', 'var(--' + it.tone + ')');
      var type = h('span', 'search-result__type', it.type);
      a.appendChild(type);
      a.appendChild(h('h3', 'search-result__title', it.title));
      a.appendChild(h('p', 'search-result__snippet', it.snippet));
      box.appendChild(a);
    });
  }

  function init() {
    var input = $('[data-search]'); if (!input) return;
    var qs = null;
    try { qs = new URLSearchParams(location.search); } catch (e) {}
    var q0 = (qs && qs.get('q')) || '';
    if (q0) input.value = q0;
    var t = null;
    input.addEventListener('input', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        render(input.value);
        try { history.replaceState(null, '', input.value ? ('?q=' + encodeURIComponent(input.value)) : location.pathname); } catch (e) {}
      }, 160);
    });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); render(input.value); } });
    render(q0);
    try { input.focus(); } catch (e) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
