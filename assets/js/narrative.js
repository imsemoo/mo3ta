/* ==========================================================================
   مُعطى — «الرواية المصوّرة» (visual_narrative.html)
   narrative.js — عارض كتاب واقعي بتأثير تقليب الصفحات عبر StPageFlip
   (مكتبة محلية: assets/vendor/page-flip). الصفحات مستضافة عندنا
   (assets/narrative/page-NNN.webp).
   • وضع HTML (صفحات DOM حقيقية) كي نتحكّم في الصور والتحميل الكسول.
   • RTL: نعكس الحاوية بـscaleX(-1) فيُقلَّب من اليمين كالكتاب العربي،
     ونعكس صورة كل صفحة كي يبقى محتواها سليماً.
   • تحميل كسول: لا تُحمَّل الـ250 صورة معاً — فقط الجوار يُحمَّل عند التقليب.
   • مزايا: رابط لكل صفحة (#p=N) · استئناف آخر صفحة · شريط تقدّم ·
     نطق لقارئ الشاشة · معالجة فشل التحميل · صوت تقليب (Web Audio).
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
  var soundBtn = document.querySelector('[data-vn-sound]');
  var loading = document.querySelector('[data-vn-loading]');
  var progress = document.querySelector('[data-vn-progress]');
  var live = document.querySelector('[data-vn-live]');
  var reader = document.querySelector('.vn-reader');

  var LS_LAST = 'mo3ta:vn:lastPage';
  var LS_SOUND = 'mo3ta:vn:sound';

  function pad(n) { return ('00' + n).slice(-3); }
  function src(n) { return 'assets/narrative/page-' + pad(n) + '.webp'; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }

  /* ---------- بناء الصفحات + معالجة فشل التحميل ---------- */
  var pageEls = [];
  for (var i = 1; i <= TOTAL; i++) pageEls.push(buildPage(i));

  function buildPage(n) {
    var d = document.createElement('div');
    d.className = 'vn-page';
    if (n === 1 || n === TOTAL) d.setAttribute('data-density', 'hard'); // الغلافان صلبان
    var img = document.createElement('img');
    img.className = 'vn-page__img';
    img.setAttribute('width', '1980');
    img.setAttribute('height', '2800');
    img.alt = 'صفحة ' + n + ' من الرواية المصوّرة';
    img.decoding = 'async';
    img.dataset.src = src(n);
    img.dataset.tries = '0';
    img.addEventListener('error', function () { onImgError(d, img, n); });
    img.addEventListener('load', function () { var ov = d.querySelector('.vn-page__retry'); if (ov) ov.remove(); });
    d.appendChild(img);
    mount.appendChild(d);
    return d;
  }

  function onImgError(pageEl, img, n) {
    if (!img.getAttribute('src')) return;            // لم نطلب تحميلها بعد (كسول)
    var t = parseInt(img.dataset.tries || '0', 10);
    if (t < 2) {                                      // محاولتان صامتتان بتراجع زمني
      img.dataset.tries = String(t + 1);
      setTimeout(function () { img.setAttribute('src', src(n) + '?r=' + (t + 1)); }, 400 * (t + 1));
    } else {
      showRetry(pageEl, img, n);
    }
  }

  function showRetry(pageEl, img, n) {
    if (pageEl.querySelector('.vn-page__retry')) return;
    var ov = document.createElement('div');
    ov.className = 'vn-page__retry';
    var p = document.createElement('p');
    p.textContent = 'تعذّر تحميل الصفحة ' + n;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'vn-page__retry-btn';
    btn.textContent = 'إعادة المحاولة';
    btn.addEventListener('click', function () {
      img.dataset.tries = '0';
      ov.remove();
      img.setAttribute('src', src(n) + '?r=' + Date.now());
    });
    ov.appendChild(p);
    ov.appendChild(btn);
    pageEl.appendChild(ov);
  }

  /* ---------- StPageFlip ---------- */
  var pf = new St.PageFlip(mount, {
    width: 424, height: 600,            // نسبة الصفحة 0.707 (1980×2800)
    size: 'stretch',
    minWidth: 250, minHeight: 354,
    maxWidth: 1600, maxHeight: 2264,
    maxShadowOpacity: 0.5,
    drawShadow: true,
    flippingTime: 800,
    usePortrait: true,                  // صفحة واحدة على الضيّق
    showCover: true,                    // الغلاف وحده (يُمركَز عبر .is-cover مع عكس RTL)
    autoSize: true,
    mobileScrollSupport: false,
    clickEventForward: false,
    useMouseEvents: false   // نُعطّل سحب المكتبة (يتعارض اتجاهه مع عكس RTL) ونتولّى السحب بأنفسنا
  });

  pf.loadFromHTML(mount.querySelectorAll('.vn-page'));

  /* ---------- تحميل كسول + فهرس ---------- */
  function loadAround(idx) {
    for (var n = idx - 2; n <= idx + 3; n++) {
      var p = pageEls[n]; if (!p) continue;
      var im = p.querySelector('img');
      if (im && !im.getAttribute('src') && im.dataset.src) im.setAttribute('src', im.dataset.src);
    }
  }

  function curIndex() { return pf.getCurrentPageIndex ? (pf.getCurrentPageIndex() || 0) : 0; }
  function setCover(on) { book.classList.toggle('is-cover', !!on); }

  // الطيّة الأولى (بعد الغلاف) تشغل الفهرسين 1 و2 ⇒ الرجوع من فهرسٍ ≤ COVER_PREV_MAX يهبط على الغلاف.
  var COVER_PREV_MAX = 2;

  /* ---------- صوت التقليب (مُولّد عبر Web Audio — بلا ملف) ---------- */
  var soundOn = false;
  try { soundOn = localStorage.getItem(LS_SOUND) === '1'; } catch (e) {}
  var actx = null;

  function playFlipSound() {
    if (!soundOn) return;
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      var ctx = actx;
      if (ctx.state === 'suspended') ctx.resume();
      var dur = 0.17, len = Math.floor(ctx.sampleRate * dur);
      var buf = ctx.createBuffer(1, len, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var j = 0; j < len; j++) {
        var env = Math.pow(1 - j / len, 2.2);              // ظرفٌ بتلاشٍ سريع
        data[j] = (Math.random() * 2 - 1) * env;           // ضوضاء = حفيف ورق
      }
      var node = ctx.createBufferSource(); node.buffer = buf;
      var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 0.6;
      var g = ctx.createGain(); g.gain.value = 0.4;
      node.connect(bp); bp.connect(g); g.connect(ctx.destination);
      node.start();
    } catch (e) {}
  }

  function syncSound() {
    if (!soundBtn) return;
    soundBtn.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
    soundBtn.title = soundOn ? 'كتم صوت التقليب' : 'تشغيل صوت التقليب';
  }
  if (soundBtn) {
    soundBtn.addEventListener('click', function () {
      soundOn = !soundOn;
      try { localStorage.setItem(LS_SOUND, soundOn ? '1' : '0'); } catch (e) {}
      syncSound();
      if (soundOn) playFlipSound();   // تغذية راجعة + فكّ قفل الصوت على إيماءة المستخدم
    });
  }

  /* ---------- رابط الصفحة (#p=N) + الاستئناف ---------- */
  function writeHash(page) {
    try {
      var base = location.pathname + location.search;
      if (page <= 1) { if (location.hash) history.replaceState(null, '', base); }
      else history.replaceState(null, '', base + '#p=' + page);
    } catch (e) {}
  }
  function readHash() {
    var m = (location.hash || '').match(/p=(\d+)/);
    return m ? clamp(parseInt(m[1], 10), 1, TOTAL) - 1 : null;
  }
  function readLast() {
    try { var v = parseInt(localStorage.getItem(LS_LAST) || '', 10); if (v >= 1 && v <= TOTAL) return v - 1; } catch (e) {}
    return null;
  }
  function saveLast(idx) { try { localStorage.setItem(LS_LAST, String(idx + 1)); } catch (e) {} }

  /* ---------- نطق + تقدّم ---------- */
  function announce(msg) { if (live) live.textContent = msg; }
  function setProgress(page) {
    if (!progress) return;
    progress.style.setProperty('--vn-progress', (page / TOTAL * 100) + '%');
    progress.setAttribute('aria-valuenow', String(page));
  }

  /* ---------- التنقّل (مركزيّ: نضبط حالة الغلاف قبل التقليب) ---------- */
  function goNext() { setCover(false); pf.flipNext(); }
  function goPrev() { if (curIndex() <= COVER_PREV_MAX) setCover(true); pf.flipPrev(); }
  function goTo(idx) { idx = clamp(idx, 0, TOTAL - 1); setCover(idx === 0); loadAround(idx); pf.flip(idx); }

  function updateBar() {
    var page = curIndex() + 1;
    if (jump && document.activeElement !== jump) jump.value = page;
    $$('[data-vn-prev]').forEach(function (b) { b.disabled = page <= 1; });
    $$('[data-vn-next]').forEach(function (b) { b.disabled = page >= TOTAL; });
    setCover(curIndex() === 0);
    setProgress(page);
    writeHash(page);
    if (page > 1) saveLast(page - 1);   // لا نحفظ الغلاف كي لا يمحو التحميلُ قيمةَ الاستئناف
    announce('صفحة ' + page + ' من ' + TOTAL);
  }

  /* ---------- التهيئة + أولوية البداية (hash > saved > الغلاف) ---------- */
  var started = false;
  function ready() {
    if (loading) loading.hidden = true;
    book.classList.add('is-ready');
    loadAround(curIndex());
    if (!started) {
      started = true;
      syncSound();
      var hashIdx = readHash();
      if (hashIdx != null && hashIdx > 0) { goTo(hashIdx); return; } // الفتح المباشر؛ flip سيُحدّث الشريط
      var lastIdx = readLast();
      if (lastIdx != null && lastIdx > 0) showResume(lastIdx);
    }
    updateBar();
  }
  pf.on('init', ready);
  pf.on('flip', function () { loadAround(curIndex()); updateBar(); });
  pf.on('changeOrientation', function () { loadAround(curIndex()); });
  // صوت التقليب عند بداية الحركة (changeState='flipping') لا عند نهايتها
  var lastState = null;
  pf.on('changeState', function (e) {
    var st = e && e.data;
    if (st === 'flipping' && lastState !== 'flipping') playFlipSound();
    lastState = st;
  });
  setTimeout(ready, 700);

  // استجابة لتعديل الرابط يدوياً (replaceState لا يطلق hashchange فلا حلقة)
  window.addEventListener('hashchange', function () {
    var idx = readHash();
    if (idx != null && idx !== curIndex()) goTo(idx);
  });

  /* ---------- شريحة الاستئناف ---------- */
  function showResume(idx) {
    var anchor = reader ? reader.querySelector('.vn-reader__head') : null;
    if (!anchor || !anchor.parentNode) return;
    var chip = document.createElement('div');
    chip.className = 'vn-resume';
    chip.setAttribute('role', 'status');
    var span = document.createElement('span');
    span.textContent = 'تابِع القراءة من صفحة ' + (idx + 1);
    var go = document.createElement('button');
    go.type = 'button'; go.className = 'vn-resume__go'; go.textContent = 'متابعة';
    go.addEventListener('click', function () { chip.remove(); goTo(idx); });
    var x = document.createElement('button');
    x.type = 'button'; x.className = 'vn-resume__x'; x.setAttribute('aria-label', 'إغلاق'); x.textContent = '×';
    x.addEventListener('click', function () { chip.remove(); });
    chip.appendChild(span); chip.appendChild(go); chip.appendChild(x);
    anchor.parentNode.insertBefore(chip, anchor.nextSibling);
  }

  /* ---------- أزرار التنقّل ---------- */
  $$('[data-vn-next]').forEach(function (b) { b.addEventListener('click', goNext); });
  $$('[data-vn-prev]').forEach(function (b) { b.addEventListener('click', goPrev); });
  var firstBtn = document.querySelector('[data-vn-first]'); if (firstBtn) firstBtn.addEventListener('click', function () { goTo(0); });
  var lastBtn = document.querySelector('[data-vn-last]'); if (lastBtn) lastBtn.addEventListener('click', function () { goTo(TOTAL - 1); });

  // القفز لصفحة: يدعم Enter + يقصّ النطاق + يُغذّي راجعةً عند الخطأ
  function submitJump() {
    var v = parseInt(jump.value, 10);
    if (v >= 1 && v <= TOTAL) { if (v - 1 !== curIndex()) goTo(v - 1); }
    else {
      announce('رقم صفحة غير صالح؛ النطاق 1 إلى ' + TOTAL);
      jump.value = curIndex() + 1;
      jump.classList.add('is-invalid');
      setTimeout(function () { jump.classList.remove('is-invalid'); }, 600);
    }
  }
  if (jump) {
    jump.addEventListener('change', submitJump);
    jump.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submitJump(); jump.blur(); } });
  }

  // لوحة المفاتيح (RTL: يسار = التالي، يمين = السابق)
  document.addEventListener('keydown', function (e) {
    if (/^(input|textarea|select)$/i.test(e.target.tagName || '')) return;
    if (e.key === 'ArrowLeft') goNext();
    else if (e.key === 'ArrowRight') goPrev();
    else if (e.key === 'Home') goTo(0);
    else if (e.key === 'End') goTo(TOTAL - 1);
  });

  // السحب باللمس (سحب لليسار = التالي · لليمين = السابق)
  var tx = null, ty = null;
  mount.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  mount.addEventListener('touchend', function (e) {
    if (tx == null) return;
    var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; tx = null;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return; // تجاهل التمرير العمودي
    if (dx < 0) goNext(); else goPrev();
  }, { passive: true });

  /* ---------- متصفّح المصغّرات ---------- */
  (function () {
    var panel = document.querySelector('[data-vn-thumbs]');
    var grid = document.querySelector('[data-vn-thumbs-grid]');
    var openBtn = document.querySelector('[data-vn-grid]');
    var closeBtn = document.querySelector('[data-vn-thumbs-close]');
    if (!panel || !grid || !openBtn) return;

    var built = false, io = null, items = [], lastFocus = null;
    function thumbSrc(n) { return 'assets/narrative/thumb/page-' + pad(n) + '.webp'; }

    function build() {
      if (built) return; built = true;
      var frag = document.createDocumentFragment();
      for (var n = 1; n <= TOTAL; n++) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'vn-thumb'; b.dataset.page = n;
        b.setAttribute('aria-label', 'الصفحة ' + n);
        var im = document.createElement('img');
        im.alt = ''; im.width = 180; im.height = 255; im.decoding = 'async';
        im.dataset.src = thumbSrc(n);
        var lab = document.createElement('span'); lab.className = 'vn-thumb__n'; lab.textContent = n;
        b.appendChild(im); b.appendChild(lab);
        b.addEventListener('click', function () { var p = parseInt(this.dataset.page, 10); close(); goTo(p - 1); });
        frag.appendChild(b); items.push(b);
      }
      grid.appendChild(frag);
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var im = en.target.querySelector('img');
          if (im && !im.getAttribute('src')) im.setAttribute('src', im.dataset.src);
          io.unobserve(en.target);
        });
      }, { root: grid, rootMargin: '300px' });
      items.forEach(function (it) { io.observe(it); });
    }

    function markActive() {
      var cur = curIndex() + 1;
      items.forEach(function (it) { it.classList.toggle('is-active', parseInt(it.dataset.page, 10) === cur); });
    }
    function open() {
      build();
      lastFocus = document.activeElement;
      panel.hidden = false;
      markActive();
      var act = grid.querySelector('.vn-thumb.is-active');
      if (act) act.scrollIntoView({ block: 'center' });
      (closeBtn || panel).focus();
      document.addEventListener('keydown', onKey, true);
    }
    function close() {
      panel.hidden = true;
      document.removeEventListener('keydown', onKey, true);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'Tab') {                                   // حصر التركيز داخل اللوحة
        var f = panel.querySelectorAll('button');
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    panel.addEventListener('click', function (e) { if (e.target === panel) close(); });
  })();

  /* ---------- فهرس المحتويات ---------- */
  (function () {
    var toc = window.VN_TOC;
    if (!toc || !toc.length) return;
    var openBtn = document.querySelector('[data-vn-toc]');
    var panel = document.querySelector('[data-vn-toc-panel]');
    var listEl = document.querySelector('[data-vn-toc-list]');
    var closeBtn = document.querySelector('[data-vn-toc-close]');
    if (!openBtn || !panel || !listEl) return;
    openBtn.hidden = false;

    var entries = [];
    toc.forEach(function (s) {
      var page = clamp(parseInt(s.page, 10) || 1, 1, TOTAL);
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'vn-toc__item'; b.dataset.page = page;
      var t = document.createElement('span'); t.className = 'vn-toc__title'; t.textContent = s.title || ('صفحة ' + page);
      var pg = document.createElement('span'); pg.className = 'vn-toc__page'; pg.textContent = page;
      b.appendChild(t); b.appendChild(pg);
      b.addEventListener('click', function () { close(); goTo(parseInt(this.dataset.page, 10) - 1); });
      li.appendChild(b); listEl.appendChild(li);
      entries.push({ page: page, btn: b });
    });

    function markActive() {
      var cur = curIndex() + 1, bestPage = -1;
      entries.forEach(function (e) { if (e.page <= cur && e.page > bestPage) bestPage = e.page; });
      entries.forEach(function (e) { e.btn.classList.toggle('is-active', e.page === bestPage); });
    }
    var lastFocus = null;
    function open() {
      lastFocus = document.activeElement;
      panel.hidden = false; markActive();
      (closeBtn || panel).focus();
      document.addEventListener('keydown', onKey, true);
    }
    function close() {
      panel.hidden = true;
      document.removeEventListener('keydown', onKey, true);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'Tab') {
        var f = panel.querySelectorAll('button');
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    panel.addEventListener('click', function (e) { if (e.target === panel) close(); });
  })();

  /* ---------- ملء الشاشة ---------- */
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
    [0, 60, 180, 360].forEach(function (t) { setTimeout(function () { window.dispatchEvent(new Event('resize')); }, t); });
  }
  if (fsBtn) {
    fsBtn.addEventListener('click', function () { setFs(!fsOn()); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && fsOn()) { setFs(false); fsBtn.focus(); } });
  }
})();
