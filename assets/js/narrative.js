/* ==========================================================================
   مُعطى — «الرواية المصوّرة» (visual_narrative.html)
   narrative.js — عارض كتاب محلي للعدد المصوّر: الصفحات مستضافة عندنا
   (assets/narrative/page-NNN.webp) بدل تضمين منصّة خارجية مدفوعة.
   طيّة (صفحتان) على الديسكتوب · صفحة واحدة على الموبايل · تنقّل/قفز/ملء شاشة/
   لوحة مفاتيح/سحب · تحميل كسول (لا تُحمَّل الـ250 صفحة دفعةً واحدة).
   ========================================================================== */
(function () {
  'use strict';

  var book = document.querySelector('[data-vn-book]');
  var stage = document.querySelector('[data-vn-stage]');
  if (!book || !stage) return;

  var totalEl = document.querySelector('[data-vn-total]');
  var TOTAL = parseInt((totalEl && totalEl.textContent) || '250', 10) || 250;
  var jump = document.querySelector('[data-vn-jump]');
  var fsBtn = document.querySelector('[data-vn-fs]');
  var spreadMQ = window.matchMedia('(min-width: 820px)');

  function pad(n) { return ('00' + n).slice(-3); }
  function path(n) { return 'assets/narrative/page-' + pad(n) + '.webp'; }

  var current = 1, cache = {};

  function imgEl(n) {
    if (!cache[n]) {
      var img = new Image();
      img.className = 'vn-book__page';
      img.alt = 'صفحة ' + n + ' من الرواية المصوّرة';
      img.decoding = 'async';
      img.src = path(n);
      cache[n] = img;
    }
    return cache[n];
  }

  // الطيّة التي تحوي الصفحة c (الغلاف وحده، ثم أزواج 2-3، 4-5…)
  function spread(c) {
    if (c <= 1) return [1];
    var a = c % 2 === 0 ? c : c - 1;
    return (a + 1 <= TOTAL) ? [a, a + 1] : [a];
  }
  function shown() { return spreadMQ.matches ? spread(current) : [current]; }

  function preload(pages) {
    var lo = pages[0], hi = pages[pages.length - 1];
    [hi + 1, hi + 2, lo - 1, lo - 2].forEach(function (n) {
      if (n >= 1 && n <= TOTAL) { var i = new Image(); i.src = path(n); }
    });
  }

  function render() {
    var pages = shown();
    while (stage.firstChild) stage.removeChild(stage.firstChild);
    stage.classList.toggle('is-spread', pages.length === 2);
    // RTL: الرقم الأصغر يميناً → نُلحق تصاعدياً وحاوية الفليكس RTL تضعه يمين
    pages.forEach(function (n) { stage.appendChild(imgEl(n)); });
    if (jump) jump.value = pages[0];
    $$('[data-vn-prev]').forEach(function (b) { b.disabled = pages[0] <= 1; });
    $$('[data-vn-next]').forEach(function (b) { b.disabled = pages[pages.length - 1] >= TOTAL; });
    preload(pages);
  }

  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function go(c) { current = Math.max(1, Math.min(TOTAL, c)); render(); }
  function next() { if (spreadMQ.matches) { var p = spread(current); go(p[p.length - 1] + 1); } else go(current + 1); }
  function prev() { if (spreadMQ.matches) { var p = spread(current); go(p[0] - 1); } else go(current - 1); }

  $$('[data-vn-next]').forEach(function (b) { b.addEventListener('click', next); });
  $$('[data-vn-prev]').forEach(function (b) { b.addEventListener('click', prev); });
  var firstBtn = document.querySelector('[data-vn-first]'); if (firstBtn) firstBtn.addEventListener('click', function () { go(1); });
  var lastBtn = document.querySelector('[data-vn-last]'); if (lastBtn) lastBtn.addEventListener('click', function () { go(TOTAL); });

  if (jump) {
    jump.addEventListener('change', function () {
      var v = parseInt(jump.value, 10);
      if (v >= 1 && v <= TOTAL) go(v); else jump.value = shown()[0];
    });
  }

  // لوحة المفاتيح (RTL: يسار = التالي، يمين = السابق)
  document.addEventListener('keydown', function (e) {
    if (/^(input|textarea|select)$/i.test(e.target.tagName || '')) return;
    if (e.key === 'ArrowLeft') next();
    else if (e.key === 'ArrowRight') prev();
    else if (e.key === 'Home') go(1);
    else if (e.key === 'End') go(TOTAL);
  });

  // السحب باللمس
  var tx = null;
  stage.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (tx == null) return;
    var dx = e.changedTouches[0].clientX - tx; tx = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) next(); else prev(); // سحب لليسار = التالي
  }, { passive: true });

  // إعادة الرسم عند تبدّل وضع الطيّة (موبايل↔ديسكتوب)
  if (spreadMQ.addEventListener) spreadMQ.addEventListener('change', render);
  else if (spreadMQ.addListener) spreadMQ.addListener(render);

  // ملء الشاشة (طبقة مثبّتة عبر كلاس — قابلة للتنسيق بالكامل)
  function fsOn() { return book.classList.contains('is-fullscreen'); }
  function syncFs() {
    if (!fsBtn) return;
    fsBtn.setAttribute('aria-pressed', fsOn() ? 'true' : 'false');
    fsBtn.title = fsOn() ? 'خروج من ملء الشاشة' : 'ملء الشاشة';
  }
  function setFs(on) {
    book.classList.toggle('is-fullscreen', on);
    document.body.classList.toggle('vn-fs-lock', on);
    syncFs(); render();
  }
  if (fsBtn) {
    fsBtn.addEventListener('click', function () { setFs(!fsOn()); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && fsOn()) { setFs(false); fsBtn.focus(); } });
  }

  go(1);
})();
