/* ==========================================================================
   مُعطى — «الرواية المصوّرة» (visual_narrative.html)
   narrative.js — عارض كتاب واقعي بتأثير تقليب الصفحات عبر StPageFlip
   (مكتبة محلية: assets/vendor/page-flip). الصفحات مستضافة عندنا
   (assets/narrative/page-NNN.webp).
   • وضع HTML (صفحات DOM حقيقية) كي نتحكّم في الصور والتحميل الكسول.
   • RTL: نعكس الحاوية بـscaleX(-1) فيُقلَّب من اليمين كالكتاب العربي،
     ونعكس صورة كل صفحة كي يبقى محتواها سليماً.
   • تحميل كسول: لا تُحمَّل الـ250 صورة معاً — فقط الجوار يُحمَّل عند التقليب.
   • مزايا: رابط لكل صفحة (#p=N) · استئناف آخر صفحة · شريط تقدّم (نقرة = انتقال) ·
     نطق لقارئ الشاشة · معالجة فشل التحميل · صوت تقليب (Web Audio) ·
     ملء شاشة حقيقي (Fullscreen API + بديل) بكروم أيقونات يختفي عند السكون.
   ========================================================================== */
(function () {
  'use strict';

  var book = document.querySelector('[data-vn-book]');
  var mount = document.querySelector('[data-vn-flip]');
  if (!book || !mount || !window.St || !window.St.PageFlip) return;

  function pad(n) { return ('00' + n).slice(-3); }
  function src(n) { return 'assets/narrative/page-' + pad(n) + '.webp'; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }

  var totalEl = document.querySelector('[data-vn-total]');
  var TOTAL = parseInt((totalEl && totalEl.textContent) || '250', 10) || 250;
  var jumps = $$('[data-vn-jump]');            // حقلا القفز: الشريط السفلي + شريط ملء الشاشة
  var fsBtns = $$('[data-vn-fs]');
  var soundBtns = $$('[data-vn-sound]');
  var loading = document.querySelector('[data-vn-loading]');
  var progress = document.querySelector('[data-vn-progress]');
  var live = document.querySelector('[data-vn-live]');
  var reader = document.querySelector('.vn-reader');

  var LS_LAST = 'mo3ta:vn:lastPage';
  var LS_SOUND = 'mo3ta:vn:sound';

  /* أيقونة/تلميح زرّ — يُحدّثان كل النسخ (شريط الأدوات العلوي + شريط ملء الشاشة) */
  function setIcon(btn, name) { var ic = btn.querySelector('i'); if (ic) ic.className = 'fa-solid ' + name; }
  function setTip(btn, txt) {
    btn.title = txt;
    if (btn.hasAttribute('data-tip')) btn.setAttribute('data-tip', txt);
    if (btn.hasAttribute('aria-label')) btn.setAttribute('aria-label', txt);
  }

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
  // احترام تفضيل تقليل الحركة: قلبٌ أقصر (300ms) بلا ظلّ متحرّك
  var REDUCE = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var pf = new St.PageFlip(mount, {
    width: 424, height: 600,            // نسبة الصفحة 0.707 (1980×2800)
    size: 'stretch',
    minWidth: 250, minHeight: 354,
    maxWidth: 1600, maxHeight: 2264,
    maxShadowOpacity: REDUCE ? 0 : 0.35,
    drawShadow: !REDUCE,
    flippingTime: REDUCE ? 300 : 800,
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
    for (var n = idx - 2; n <= idx + 4; n++) {   // ‎+4 أماماً كي لا يتلعثم العرض التلقائي السريع (4ث)
      var p = pageEls[n]; if (!p) continue;
      var im = p.querySelector('img');
      if (im && !im.getAttribute('src') && im.dataset.src) im.setAttribute('src', im.dataset.src);
    }
  }

  function curIndex() { return pf.getCurrentPageIndex ? (pf.getCurrentPageIndex() || 0) : 0; }
  function setCover(on) { book.classList.toggle('is-cover', !!on); }

  // وضع العرض (portrait صفحة واحدة / landscape طيّتان) — يحدّده StPageFlip حسب عرض الحاوية.
  // نضبط كلاس .is-portrait كي تُطبَّق إزاحةُ تمركز الغلاف في landscape فقط (في portrait الصفحة متمركزة أصلاً).
  function syncOrientation() {
    var w = mount.querySelector('.stf__wrapper');
    book.classList.toggle('is-portrait', !!(w && /(^|\s)--portrait(\s|$)/.test(w.className)));
  }

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
    soundBtns.forEach(function (b) {
      b.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
      setIcon(b, soundOn ? 'fa-volume-high' : 'fa-volume-xmark');
      setTip(b, soundOn ? 'كتم صوت التقليب' : 'تشغيل صوت التقليب');
    });
  }
  soundBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      soundOn = !soundOn;
      try { localStorage.setItem(LS_SOUND, soundOn ? '1' : '0'); } catch (e) {}
      syncSound();
      if (soundOn) playFlipSound();   // تغذية راجعة + فكّ قفل الصوت على إيماءة المستخدم
    });
  });

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

  /* ---------- التنقّل (مركزيّ: نضبط حالة الغلاف قبل التقليب · ونوقف العرض التلقائي عند تدخّل المستخدم) ---------- */
  function goNext() { if (!autoTicking) stopAuto(); setCover(false); pf.flipNext(); }
  function goPrev() { if (!autoTicking) stopAuto(); if (curIndex() <= COVER_PREV_MAX) setCover(true); pf.flipPrev(); }
  function goTo(idx) { if (!autoTicking) stopAuto(); idx = clamp(idx, 0, TOTAL - 1); setCover(idx === 0); loadAround(idx); pf.flip(idx); }

  /* ---------- العرض التلقائي ---------- */
  var playBtns = $$('[data-vn-play]');
  var speedSel = document.querySelector('[data-vn-speed]');
  var restartBtn = document.querySelector('[data-vn-restart]');
  var LS_SPEED = 'mo3ta:vn:speed';
  var autoTimer = null, autoTicking = false, autoWasPlaying = false, autoSpeed = 7000;
  try { var sp0 = parseInt(localStorage.getItem(LS_SPEED), 10); if (sp0 >= 1000) autoSpeed = sp0; } catch (e) {}
  if (speedSel) {
    speedSel.value = String(autoSpeed);
    speedSel.addEventListener('change', function () {
      autoSpeed = parseInt(speedSel.value, 10) || 7000;
      try { localStorage.setItem(LS_SPEED, String(autoSpeed)); } catch (e) {}
      if (autoTimer) { clearInterval(autoTimer); autoTimer = setInterval(autoTick, autoSpeed); }
    });
  }
  function syncPlay() {
    var on = autoTimer != null;
    playBtns.forEach(function (b) {
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      setIcon(b, on ? 'fa-pause' : 'fa-play');
      var lab = b.querySelector('[data-vn-play-label]');
      if (lab) lab.textContent = on ? 'إيقاف' : 'عرض تلقائي';
      setTip(b, on ? 'إيقاف العرض التلقائي' : 'عرض تلقائي');
    });
  }
  function stopAuto() { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; syncPlay(); } }
  function startAuto() {
    if (autoTimer) return;
    if (curIndex() + 1 >= TOTAL) goTo(0);          // من البداية لو كنّا في النهاية
    autoTimer = setInterval(autoTick, autoSpeed); syncPlay();
  }
  function autoTick() {
    if (curIndex() + 1 >= TOTAL) { stopAuto(); return; }
    autoTicking = true; goNext(); autoTicking = false;
  }
  playBtns.forEach(function (b) { b.addEventListener('click', function () { if (autoTimer) stopAuto(); else startAuto(); }); });
  if (restartBtn) restartBtn.addEventListener('click', function () { goTo(0); });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (autoTimer) { autoWasPlaying = true; stopAuto(); } }
    else if (autoWasPlaying) { autoWasPlaying = false; startAuto(); }
  });

  function updateBar() {
    var page = curIndex() + 1;
    jumps.forEach(function (inp) { if (document.activeElement !== inp) inp.value = page; });
    $$('[data-vn-prev]').forEach(function (b) { b.disabled = page <= 1; });
    $$('[data-vn-next]').forEach(function (b) { b.disabled = page >= TOTAL; });
    setCover(curIndex() === 0);
    setProgress(page);
    writeHash(page);
    if (page > 1) saveLast(page - 1);   // لا نحفظ الغلاف كي لا يمحو التحميلُ قيمةَ الاستئناف
    if (page === TOTAL && !book.classList.contains('is-end')) stopAuto();
    book.classList.toggle('is-end', page === TOTAL);   // شاشة الختام على الصفحة الأخيرة
    // أثناء العرض التلقائي لا نُثرثر على قارئ الشاشة كل بضع ثوانٍ — نعلن آخر صفحة فقط
    if (!autoTimer || page === TOTAL) announce('صفحة ' + page + ' من ' + TOTAL);
  }

  /* ---------- التهيئة + أولوية البداية (hash > saved > الغلاف) ---------- */
  var started = false;
  function ready() {
    if (loading) loading.hidden = true;
    book.classList.add('is-ready');
    syncOrientation();
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
  pf.on('changeOrientation', function () { syncOrientation(); loadAround(curIndex()); });
  window.addEventListener('resize', syncOrientation, { passive: true });
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
    x.type = 'button'; x.className = 'vn-resume__x'; x.setAttribute('aria-label', 'إغلاق'); x.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
    x.addEventListener('click', function () { chip.remove(); });
    chip.appendChild(span); chip.appendChild(go); chip.appendChild(x);
    anchor.parentNode.insertBefore(chip, anchor.nextSibling);
  }

  /* ---------- أزرار التنقّل ---------- */
  $$('[data-vn-next]').forEach(function (b) { b.addEventListener('click', goNext); });
  $$('[data-vn-prev]').forEach(function (b) { b.addEventListener('click', goPrev); });
  $$('[data-vn-first]').forEach(function (b) { b.addEventListener('click', function () { goTo(0); }); });
  $$('[data-vn-last]').forEach(function (b) { b.addEventListener('click', function () { goTo(TOTAL - 1); }); });

  // «ابدأ القراءة»: يُبرز مساحة القراءة ويفتح الكتاب من الغلاف
  var startBtn = document.querySelector('[data-vn-start]');
  if (startBtn) startBtn.addEventListener('click', function () {
    var reader = document.getElementById('vn-reader') || book;
    reader.scrollIntoView({ block: 'start', behavior: 'smooth' });
    if (curIndex() === 0) setTimeout(goNext, 360);
  });

  /* ---------- أدوات: نسخ · مشاركة · حفظ · طباعة ---------- */
  function toast(msg) {
    announce(msg);
    var host = realFsEl() || document.body;   // داخل عنصر ملء الشاشة الحقيقي وإلا لن تُرى
    var t = document.querySelector('.vn-toast');
    if (!t) { t = document.createElement('div'); t.className = 'vn-toast'; }
    if (t.parentNode !== host) host.appendChild(t);
    t.textContent = msg; t.classList.add('is-show');
    clearTimeout(t.__h); t.__h = setTimeout(function () { t.classList.remove('is-show'); }, 2200);
  }
  function copyText(text, okMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast(okMsg); }, function () { toast(text); });
    } else { toast(text); }
  }
  $$('[data-vn-copy]').forEach(function (b) { b.addEventListener('click', function () { copyText(location.href, 'تم نسخ الرابط'); }); });
  $$('[data-vn-share]').forEach(function (b) { b.addEventListener('click', function () {
    var data = { title: 'الرواية المصوّرة — مُعطى', text: 'العدد المصوّر من «مُعطى»', url: location.href };
    if (navigator.share) { navigator.share(data).catch(function () {}); }
    else { copyText(data.url, 'تم نسخ الرابط للمشاركة'); }
  }); });
  var printBtn = document.querySelector('[data-vn-print]');
  if (printBtn) printBtn.addEventListener('click', function () { window.print(); });
  var saveBtn = document.querySelector('[data-vn-save]');
  if (saveBtn) {
    var LS_SAVE = 'mo3ta:vn:saved';
    var isSaved = false; try { isSaved = localStorage.getItem(LS_SAVE) === '1'; } catch (e) {}
    var syncSave = function () { saveBtn.setAttribute('aria-pressed', isSaved ? 'true' : 'false'); saveBtn.textContent = isSaved ? 'محفوظ' : 'حفظ'; };
    syncSave();
    saveBtn.addEventListener('click', function () {
      isSaved = !isSaved;
      try { localStorage.setItem(LS_SAVE, isSaved ? '1' : '0'); } catch (e) {}
      syncSave(); toast(isSaved ? 'حُفِظ في قائمتك' : 'أُزيل من قائمتك');
    });
  }

  // القفز لصفحة: يدعم Enter + يقصّ النطاق + يُغذّي راجعةً عند الخطأ (كلا الحقلين)
  function submitJump(inp) {
    var v = parseInt(inp.value, 10);
    if (v >= 1 && v <= TOTAL) { if (v - 1 !== curIndex()) goTo(v - 1); }
    else {
      announce('رقم صفحة غير صالح؛ النطاق 1 إلى ' + TOTAL);
      inp.value = curIndex() + 1;
      inp.classList.add('is-invalid');
      setTimeout(function () { inp.classList.remove('is-invalid'); }, 600);
    }
  }
  jumps.forEach(function (inp) {
    inp.addEventListener('change', function () { submitJump(inp); });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submitJump(inp); inp.blur(); } });
  });

  // لوحة المفاتيح (RTL: يسار = التالي، يمين = السابق · Space يقلّب في ملء الشاشة · F يبدّله)
  document.addEventListener('keydown', function (e) {
    if (/^(input|textarea|select)$/i.test(e.target.tagName || '')) return;
    if (e.key === 'ArrowLeft') goNext();
    else if (e.key === 'ArrowRight') goPrev();
    else if (e.key === 'Home') goTo(0);
    else if (e.key === 'End') goTo(TOTAL - 1);
    else if (e.key === ' ' && fsOn()) { e.preventDefault(); if (e.shiftKey) goPrev(); else goNext(); }
    else if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey && !e.altKey) setFs(!fsOn());
  });

  // السحب باللمس (سحب لليسار = التالي · لليمين = السابق)
  // عتبة مسافة + سرعة: نقبل السحبة الطويلة (≥60px) أو الخاطفة القصيرة (≥35px وسريعة)
  // كي لا يقلب الانزلاقُ البطيء العرضي أثناء القراءة صفحةً بغير قصد.
  var tx = null, ty = null, tt = 0;
  mount.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; tt = e.timeStamp; }, { passive: true });
  mount.addEventListener('touchend', function (e) {
    if (tx == null) return;
    var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; tx = null;
    if (Math.abs(dx) < Math.abs(dy)) return;                       // تمرير عمودي
    var speed = Math.abs(dx) / Math.max(1, e.timeStamp - tt);      // px/ms
    if (Math.abs(dx) < 60 && !(Math.abs(dx) >= 35 && speed > 0.5)) return;
    if (dx < 0) goNext(); else goPrev();
  }, { passive: true });

  /* نقر حافّة الصفحة = تقليب (كنمط fliphtml5) — الوسط يبقى للتكبير بالنقر المزدوج.
     مهلة 240ms تميّز النقرة المفردة عن المزدوجة؛ اللمسة المزدوجة تُلغيها عبر cancelEdgeClick. */
  var stageEl = document.querySelector('.vn-book__stage');
  var edgeClickT = null, suppressEdgeUntil = 0;
  function cancelEdgeClick() { clearTimeout(edgeClickT); suppressEdgeUntil = Date.now() + 400; }
  if (stageEl) stageEl.addEventListener('click', function (e) {
    if (Date.now() < suppressEdgeUntil) return;
    if (e.target.closest('button, a, input, .vn-page__retry')) return;
    if (!book.classList.contains('is-ready') || book.classList.contains('is-end')) return;
    var r = stageEl.getBoundingClientRect();
    if (!r.width) return;
    var fx = (e.clientX - r.left) / r.width;   // إحداثيات بصريّة — عكس scaleX لا يغيّرها
    var go = fx <= 0.32 ? goNext : (fx >= 0.68 ? goPrev : null);   // RTL: يسار = التالي
    if (!go) return;
    clearTimeout(edgeClickT);
    edgeClickT = setTimeout(go, 240);
  });
  mount.addEventListener('dblclick', function () { cancelEdgeClick(); });

  /* ---------- متصفّح المصغّرات ---------- */
  (function () {
    var panel = document.querySelector('[data-vn-thumbs]');
    var grid = document.querySelector('[data-vn-thumbs-grid]');
    var openBtns = $$('[data-vn-grid]');
    var closeBtn = document.querySelector('[data-vn-thumbs-close]');
    if (!panel || !grid || !openBtns.length) return;

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
    openBtns.forEach(function (b) { b.addEventListener('click', open); });
    if (closeBtn) closeBtn.addEventListener('click', close);
    panel.addEventListener('click', function (e) { if (e.target === panel) close(); });
  })();

  /* ---------- فهرس المحتويات ---------- */
  (function () {
    var toc = window.VN_TOC;
    if (!toc || !toc.length) return;
    var openBtns = $$('[data-vn-toc]');
    var panel = document.querySelector('[data-vn-toc-panel]');
    var listEl = document.querySelector('[data-vn-toc-list]');
    var closeBtn = document.querySelector('[data-vn-toc-close]');
    if (!openBtns.length || !panel || !listEl) return;
    openBtns.forEach(function (b) { b.hidden = false; });

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
    openBtns.forEach(function (b) { b.addEventListener('click', open); });
    if (closeBtn) closeBtn.addEventListener('click', close);
    panel.addEventListener('click', function (e) { if (e.target === panel) close(); });
  })();

  /* ---------- تكبير الصفحة (دقة أصلية · سحب وقرص) ---------- */
  (function () {
    var panel = document.querySelector('[data-vn-zoom-panel]');
    var stage = document.querySelector('[data-vn-zoom-stage]');
    var img = document.querySelector('[data-vn-zoom-img]');
    var openBtns = $$('[data-vn-zoom]');
    var closeBtn = document.querySelector('[data-vn-zoom-close]');
    var inBtn = document.querySelector('[data-vn-zoom-in]');
    var outBtn = document.querySelector('[data-vn-zoom-out]');
    var prevBtn = document.querySelector('[data-vn-zoom-prev]');
    var nextBtn = document.querySelector('[data-vn-zoom-next]');
    var levelEl = document.querySelector('[data-vn-zoom-level]');
    if (!panel || !stage || !img || !openBtns.length) return;

    var MINZ = 1, MAXZ = 4;
    var zPage = 1, scale = 1, tx = 0, ty = 0, rot = 0;
    var pointers = {}, startDist = 0, startScale = 1, panStart = null, lastFocus = null;

    function clampPan() {
      var visW = img.clientWidth * scale, visH = img.clientHeight * scale;
      var maxX = Math.max(0, (visW - stage.clientWidth) / 2);
      var maxY = Math.max(0, (visH - stage.clientHeight) / 2);
      tx = Math.max(-maxX, Math.min(maxX, tx));
      ty = Math.max(-maxY, Math.min(maxY, ty));
    }
    function apply() {
      clampPan();
      img.style.setProperty('--zs', scale);
      img.style.setProperty('--zx', tx + 'px');
      img.style.setProperty('--zy', ty + 'px');
      img.style.setProperty('--zr', rot + 'deg');
      if (levelEl) levelEl.textContent = Math.round(scale * 100) + '%';
      if (outBtn) outBtn.disabled = scale <= MINZ + 0.01;
      if (inBtn) inBtn.disabled = scale >= MAXZ - 0.01;
    }
    function setScale(s) {
      scale = Math.max(MINZ, Math.min(MAXZ, s));
      if (scale === MINZ) { tx = 0; ty = 0; }
      apply();
    }
    function loadPage(p) {
      zPage = clamp(p, 1, TOTAL);
      img.setAttribute('src', src(zPage));
      img.alt = 'صفحة ' + zPage + ' مكبّرة';
      tx = 0; ty = 0; rot = 0; apply();   // مستوى التكبير يثبت بين الصفحات (كـfliphtml5)؛ يُصفَّر السحب والدوران فقط
      if (prevBtn) prevBtn.disabled = zPage <= 1;
      if (nextBtn) nextBtn.disabled = zPage >= TOTAL;
    }
    function open(p) {
      lastFocus = document.activeElement;
      panel.hidden = false;
      loadPage(p);
      (closeBtn || panel).focus();
      document.addEventListener('keydown', onKey, true);
    }
    function close() {
      panel.hidden = true;
      document.removeEventListener('keydown', onKey, true);
      goTo(zPage - 1);                       // مزامنة الكتاب مع آخر صفحة مكبّرة
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === '+' || e.key === '=') setScale(scale + 0.5);
      else if (e.key === '-' || e.key === '_') setScale(scale - 0.5);
      else if (e.key === 'ArrowLeft') loadPage(zPage + 1);   // RTL: يسار = التالي
      else if (e.key === 'ArrowRight') loadPage(zPage - 1);
    }

    openBtns.forEach(function (b) { b.addEventListener('click', function () { open(curIndex() + 1); }); });
    // تدوير الصفحة: يفتح طبقة التكبير (إن لزم) ويُدوّر 90° في كل نقرة
    var rotateBtn = document.querySelector('[data-vn-rotate]');
    if (rotateBtn) rotateBtn.addEventListener('click', function () {
      if (panel.hidden) open(curIndex() + 1);
      rot = (rot + 90) % 360; apply();
    });
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (inBtn) inBtn.addEventListener('click', function () { setScale(scale + 0.5); });
    if (outBtn) outBtn.addEventListener('click', function () { setScale(scale - 0.5); });
    if (prevBtn) prevBtn.addEventListener('click', function () { loadPage(zPage - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { loadPage(zPage + 1); });
    panel.addEventListener('click', function (e) { if (e.target === panel) close(); });

    stage.addEventListener('wheel', function (e) {
      e.preventDefault();
      setScale(scale + (e.deltaY < 0 ? 0.3 : -0.3));
    }, { passive: false });

    function dist() {
      var ps = Object.keys(pointers).map(function (k) { return pointers[k]; });
      return Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y);
    }
    stage.addEventListener('pointerdown', function (e) {
      try { stage.setPointerCapture(e.pointerId); } catch (err) {}
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      var n = Object.keys(pointers).length;
      if (n === 1) { panStart = { x: e.clientX, y: e.clientY, tx: tx, ty: ty }; stage.classList.add('is-panning'); }
      else if (n === 2) { startDist = dist(); startScale = scale; panStart = null; }
    });
    stage.addEventListener('pointermove', function (e) {
      if (!pointers[e.pointerId]) return;
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      var n = Object.keys(pointers).length;
      if (n >= 2 && startDist) {
        setScale(startScale * (dist() / startDist));
      } else if (n === 1 && panStart && scale > 1) {
        tx = panStart.tx + (e.clientX - panStart.x);
        ty = panStart.ty + (e.clientY - panStart.y);
        apply();
      }
    });
    function endPointer(e) {
      delete pointers[e.pointerId];
      if (Object.keys(pointers).length === 0) { stage.classList.remove('is-panning'); panStart = null; startDist = 0; }
    }
    stage.addEventListener('pointerup', endPointer);
    stage.addEventListener('pointercancel', endPointer);

    // فتح بالنقر المزدوج على الصفحة
    mount.addEventListener('dblclick', function () { if (panel.hidden) open(curIndex() + 1); });

    // لمسة مزدوجة باللمس = تكبير (dblclick غير موثوق على المتصفّحات اللمسية)
    var ltT = 0, ltX = 0, ltY = 0;
    mount.addEventListener('touchend', function (e) {
      var t = e.changedTouches[0], now = e.timeStamp;
      if (now - ltT < 320 && Math.abs(t.clientX - ltX) < 40 && Math.abs(t.clientY - ltY) < 40) {
        ltT = 0;
        cancelEdgeClick();               // كي لا تقلب اللمسةُ الأولى صفحةً بالتوازي
        if (panel.hidden) open(curIndex() + 1);
      } else { ltT = now; ltX = t.clientX; ltY = t.clientY; }
    }, { passive: true });
  })();

  /* ---------- ملء الشاشة (Fullscreen API حقيقي + بديل بطبقة مثبّتة) ---------- */
  function fsOn() { return book.classList.contains('is-fullscreen'); }
  function realFsEl() { return document.fullscreenElement || document.webkitFullscreenElement || null; }

  function syncFs() {
    fsBtns.forEach(function (b) {
      b.setAttribute('aria-pressed', fsOn() ? 'true' : 'false');
      setIcon(b, fsOn() ? 'fa-compress' : 'fa-expand');
      setTip(b, fsOn() ? 'خروج من ملء الشاشة' : 'ملء الشاشة');
    });
  }

  function applyFs(on) {
    book.classList.toggle('is-fullscreen', on);
    document.body.classList.toggle('vn-fs-lock', on);
    syncFs();
    if (on) wakeChrome();
    else { clearTimeout(idleT); book.classList.remove('is-idle'); }
    // StPageFlip يقيس حاويته — نبثّ resize على دفعات أثناء انتقال الأبعاد
    [0, 60, 180, 360].forEach(function (t) { setTimeout(function () { window.dispatchEvent(new Event('resize')); }, t); });
  }

  function setFs(on) {
    var req = book.requestFullscreen || book.webkitRequestFullscreen;
    var exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (on && req) {
      // الحقيقي: الكلاس يُطبَّق عند fullscreenchange؛ عند الرفض نسقط للبديل
      try { var p = req.call(book); if (p && p.catch) p.catch(function () { applyFs(true); }); }
      catch (e) { applyFs(true); }
    } else if (!on && realFsEl()) {
      try { exit.call(document); } catch (e) { applyFs(false); }
    } else {
      applyFs(on);                       // متصفّحات بلا API (iOS Safari على iPhone)
    }
  }

  ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (ev) {
    document.addEventListener(ev, function () { applyFs(realFsEl() === book); });
  });
  fsBtns.forEach(function (b) { b.addEventListener('click', function () { setFs(!fsOn()); }); });
  // Escape للبديل فقط — الحقيقي يخرج بنفسه ويطلق fullscreenchange
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && fsOn() && !realFsEl()) setFs(false);
  });

  /* كروم يختفي عند السكون داخل ملء الشاشة (كمشغّلات الفيديو) */
  var idleT = null;
  function wakeChrome() {
    if (!fsOn()) return;
    book.classList.remove('is-idle');
    clearTimeout(idleT);
    idleT = setTimeout(function () {
      if (!fsOn()) return;
      if (book.querySelector('.vn-fsbar:hover, .vn-book__nav:hover')) { wakeChrome(); return; } // المؤشر فوق الأدوات
      book.classList.add('is-idle');
    }, 2600);
  }
  book.addEventListener('pointermove', wakeChrome, { passive: true });
  book.addEventListener('touchstart', wakeChrome, { passive: true });
  document.addEventListener('keydown', function () { if (fsOn()) wakeChrome(); });

  /* حصر التركيز داخل العارض في ملء الشاشة (اللوحات المفتوحة تدير حصرها بنفسها) */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || !fsOn()) return;
    if (book.querySelector('[data-vn-thumbs]:not([hidden]), [data-vn-toc-panel]:not([hidden]), [data-vn-zoom-panel]:not([hidden])')) return;
    var f = book.querySelectorAll('button:not([hidden]):not(:disabled), a[href], input');
    var vis = Array.prototype.filter.call(f, function (el) { return el.offsetWidth > 0 || el.offsetHeight > 0; });
    if (!vis.length) return;
    var first = vis[0], last = vis[vis.length - 1];
    var inside = book.contains(document.activeElement);
    if (e.shiftKey && (document.activeElement === first || !inside)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !inside)) { e.preventDefault(); first.focus(); }
  }, true);

  /* الوضع الليلي داخل ملء الشاشة — يخفّف سطوع الصفحات للقراءة الطويلة */
  var LS_NIGHT = 'mo3ta:vn:night';
  var nightBtns = $$('[data-vn-night]');
  var nightOn = false; try { nightOn = localStorage.getItem(LS_NIGHT) === '1'; } catch (e) {}
  function syncNight() {
    book.classList.toggle('is-night', nightOn);
    nightBtns.forEach(function (b) {
      b.setAttribute('aria-pressed', nightOn ? 'true' : 'false');
      setIcon(b, nightOn ? 'fa-sun' : 'fa-moon');
      setTip(b, nightOn ? 'إيقاف الوضع الليلي' : 'وضع ليلي للقراءة');
    });
  }
  nightBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      nightOn = !nightOn;
      try { localStorage.setItem(LS_NIGHT, nightOn ? '1' : '0'); } catch (e) {}
      syncNight();
    });
  });
  syncNight();

  /* نقرة شريط التقدّم = انتقال مباشر (RTL: يمتلئ من اليمين) */
  if (progress) {
    progress.style.cursor = 'pointer';
    progress.title = 'انقر للانتقال إلى موضعٍ في العدد';
    progress.addEventListener('click', function (e) {
      var r = progress.getBoundingClientRect();
      if (!r.width) return;
      var frac = (r.right - e.clientX) / r.width;
      goTo(clamp(Math.round(frac * TOTAL), 1, TOTAL) - 1);
    });
  }
})();
