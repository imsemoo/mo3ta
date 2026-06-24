/* ==========================================================================
   مُعطى — صفحة التقرير المفرد
   single.js — شريط تقدّم القراءة (RTL) + فهرس متتبّع + أزرار المشاركة
   (الأرقام المفتاحية تتحرّك تلقائياً عبر countUp في main.js لأنها [data-count])
   ========================================================================== */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- شريط تقدّم القراءة ---
  var bar = document.querySelector('[data-progress]');
  function onScroll() {
    if (!bar) return;
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    var p = max > 0 ? doc.scrollTop / max : 0;
    bar.style.setProperty('--progress', (Math.max(0, Math.min(1, p)) * 100) + '%');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // --- فهرس متتبّع (scroll-spy) ---
  var links = Array.prototype.slice.call(document.querySelectorAll('[data-toc] a'));
  var map = {};
  links.forEach(function (a) {
    var id = (a.getAttribute('href') || '').replace('#', '');
    if (id) map[id] = a;
  });
  if ('IntersectionObserver' in window && links.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (a) { a.classList.remove('is-active'); });
          var a = map[e.target.id];
          if (a) a.classList.add('is-active');
        }
      });
    }, { rootMargin: '-18% 0px -72% 0px' });
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  // --- المشاركة ---
  function url() { return encodeURIComponent(location.href); }
  function title() { return encodeURIComponent(document.title); }
  function pop(u) { window.open(u, '_blank', 'noopener,noreferrer,width=640,height=560'); }
  var handlers = {
    facebook: function () { pop('https://www.facebook.com/sharer/sharer.php?u=' + url()); },
    x: function () { pop('https://twitter.com/intent/tweet?url=' + url() + '&text=' + title()); },
    whatsapp: function () { pop('https://wa.me/?text=' + title() + '%20' + url()); },
    telegram: function () { pop('https://t.me/share/url?url=' + url() + '&text=' + title()); },
    print: function () { window.print(); },
    copy: function () {
      var done = function () { flashCopied(); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(location.href).then(done, done);
      else done();
    }
  };
  function flashCopied() {
    var c = document.querySelector('[data-share="copy"]');
    if (!c) return;
    c.classList.add('is-copied');
    var prev = c.getAttribute('aria-label');
    c.setAttribute('aria-label', 'تم نسخ الرابط ✓');
    setTimeout(function () { c.classList.remove('is-copied'); if (prev) c.setAttribute('aria-label', prev); }, 1600);
  }
  Array.prototype.slice.call(document.querySelectorAll('[data-share]')).forEach(function (btn) {
    btn.addEventListener('click', function () {
      var k = btn.getAttribute('data-share');
      if (handlers[k]) handlers[k]();
    });
  });
})();
