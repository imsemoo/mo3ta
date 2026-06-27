/* ==========================================================================
   مُعطى — «الرواية المصوّرة» (visual_narrative.html)
   narrative.js — عارض كتاب واقعي بتأثير تقليب الصفحات عبر StPageFlip
   (مكتبة محلية: assets/vendor/page-flip). الصفحات مستضافة عندنا
   (assets/narrative/page-NNN.webp).
   • وضع HTML (صفحات DOM حقيقية) كي نتحكّم في الصور والتحميل الكسول.
   • RTL: نعكس الحاوية بـscaleX(-1) فيُقلَّب من اليمين كالكتاب العربي،
     ونعكس صورة كل صفحة كي يبقى محتواها سليماً.
   • تحميل كسول: لا تُحمَّل الـ250 صورة معاً — فقط الجوار يُحمَّل عند التقليب.
   ========================================================================== */
(function () {
  'use strict';

  var book = document.querySelector('[data-vn-book]');
  var mount = document.querySelector('[data-vn-flip]');
  if (!book || !mount || !window.St || !window.St.PageFlip) return;

  var totalEl = document.querySelector('[data-vn-total]');
  var TOTAL = parseInt((totalEl && totalEl.textContent) || '250', 10) || 250;
  var jump = document.querySelector('[data-vn-jump]');
  var fsBtn = document.querySelector('[data-vn-fs]');
  var loading = document.querySelector('[data-vn-loading]');

  function pad(n) { return ('00' + n).slice(-3); }
  function src(n) { return 'assets/narrative/page-' + pad(n) + '.webp'; }

  // بناء عناصر الصفحات (بلا src بعد — الأبعاد من width/height كي يصحّ التخطيط قبل التحميل)
  var pageEls = [];
  for (var i = 1; i <= TOTAL; i++) {
    var d = document.createElement('div');
    d.className = 'vn-page';
    if (i === 1 || i === TOTAL) d.setAttribute('data-density', 'hard'); // الغلافان صلبان
    var img = document.createElement('img');
    img.className = 'vn-page__img';
    img.setAttribute('width', '1980');
    img.setAttribute('height', '2800');
    img.alt = 'صفحة ' + i + ' من الرواية المصوّرة';
    img.decoding = 'async';
    img.dataset.src = src(i);
    d.appendChild(img);
    mount.appendChild(d);
    pageEls.push(d);
  }

  var pf = new St.PageFlip(mount, {
    width: 424, height: 600,            // نسبة الصفحة 0.707 (1980×2800)
    size: 'stretch',
    minWidth: 250, minHeight: 354,
    maxWidth: 1600, maxHeight: 2264,
    maxShadowOpacity: 0.5,
    drawShadow: true,
    flippingTime: 800,
    usePortrait: true,                  // صفحة واحدة على الضيّق
    showCover: true,                    // الغلاف وحده
    autoSize: true,
    mobileScrollSupport: false,
    swipeDistance: 30,
    clickEventForward: false,
    useMouseEvents: true
  });

  pf.loadFromHTML(mount.querySelectorAll('.vn-page'));

  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }

  // تحميل كسول للجوار
  function loadAround(idx) {
    for (var n = idx - 2; n <= idx + 3; n++) {
      var p = pageEls[n]; if (!p) continue;
      var im = p.querySelector('img');
      if (im && !im.getAttribute('src') && im.dataset.src) im.setAttribute('src', im.dataset.src);
    }
  }

  function curIndex() { return pf.getCurrentPageIndex ? (pf.getCurrentPageIndex() || 0) : 0; }

  function updateBar() {
    var page = curIndex() + 1;
    if (jump && document.activeElement !== jump) jump.value = page;
    $$('[data-vn-prev]').forEach(function (b) { b.disabled = page <= 1; });
    $$('[data-vn-next]').forEach(function (b) { b.disabled = page >= TOTAL; });
  }

  function ready() {
    if (loading) loading.hidden = true;
    book.classList.add('is-ready');
    loadAround(curIndex());
    updateBar();
  }
  pf.on('init', ready);
  pf.on('flip', function () { loadAround(curIndex()); updateBar(); });
  pf.on('changeOrientation', function () { loadAround(curIndex()); });
  setTimeout(ready, 700);

  // أزرار التنقّل
  $$('[data-vn-next]').forEach(function (b) { b.addEventListener('click', function () { pf.flipNext(); }); });
  $$('[data-vn-prev]').forEach(function (b) { b.addEventListener('click', function () { pf.flipPrev(); }); });
  var firstBtn = document.querySelector('[data-vn-first]'); if (firstBtn) firstBtn.addEventListener('click', function () { pf.flip(0); });
  var lastBtn = document.querySelector('[data-vn-last]'); if (lastBtn) lastBtn.addEventListener('click', function () { pf.flip(TOTAL - 1); });
  if (jump) jump.addEventListener('change', function () {
    var v = parseInt(jump.value, 10);
    if (v >= 1 && v <= TOTAL) { loadAround(v - 1); pf.flip(v - 1); } else updateBar();
  });

  // لوحة المفاتيح (RTL: يسار = التالي، يمين = السابق)
  document.addEventListener('keydown', function (e) {
    if (/^(input|textarea|select)$/i.test(e.target.tagName || '')) return;
    if (e.key === 'ArrowLeft') pf.flipNext();
    else if (e.key === 'ArrowRight') pf.flipPrev();
    else if (e.key === 'Home') pf.flip(0);
    else if (e.key === 'End') pf.flip(TOTAL - 1);
  });

  // ملء الشاشة (طبقة مثبّتة عبر كلاس) — StPageFlip يُعيد القياس عند resize
  function fsOn() { return book.classList.contains('is-fullscreen'); }
  function syncFs() {
    if (!fsBtn) return;
    fsBtn.setAttribute('aria-pressed', fsOn() ? 'true' : 'false');
    fsBtn.title = fsOn() ? 'خروج من ملء الشاشة' : 'ملء الشاشة';
  }
  function setFs(on) {
    book.classList.toggle('is-fullscreen', on);
    document.body.classList.toggle('vn-fs-lock', on);
    syncFs();
    requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); });
  }
  if (fsBtn) {
    fsBtn.addEventListener('click', function () { setFs(!fsOn()); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && fsOn()) { setFs(false); fsBtn.focus(); } });
  }
})();
