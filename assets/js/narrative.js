/* ==========================================================================
   مُعطى — «الرواية المصوّرة» (visual_narrative.html)
   narrative.js — تفاعلات قارئ الإصدار فقط: زرّ ملء الشاشة للفليبوك المضمّن.
   (أُزيلت رحلة الخريطة/المحطّات بعد إعادة تصميم الصفحة حول الإصدار المصوّر.)
   ========================================================================== */
(function () {
  'use strict';

  var frame = document.querySelector('[data-vn-frame]');
  var btn = document.querySelector('[data-vn-fs]');
  if (!frame || !btn) return;

  function nativeOn() { return document.fullscreenElement === frame; }
  function classOn() { return frame.classList.contains('is-fullscreen'); }
  function isOn() { return nativeOn() || classOn(); }
  function sync() {
    btn.setAttribute('aria-pressed', isOn() ? 'true' : 'false');
    btn.title = isOn() ? 'خروج من ملء الشاشة' : 'ملء الشاشة';
  }

  // بديل بلا fullscreen API: تثبيت العنصر ملءَ الشاشة عبر كلاس + قفل تمرير الصفحة
  function classFullscreen(on) {
    frame.classList.toggle('is-fullscreen', on);
    document.body.classList.toggle('vn-fs-lock', on);
    sync();
  }

  btn.addEventListener('click', function () {
    if (typeof frame.requestFullscreen === 'function') {
      if (nativeOn()) document.exitFullscreen();
      else frame.requestFullscreen().catch(function () { classFullscreen(true); });
    } else {
      classFullscreen(!classOn());
    }
  });

  document.addEventListener('fullscreenchange', function () {
    sync();
    if (!isOn()) btn.focus(); // استعادة التركيز عند الخروج (يشمل Esc الأصلي)
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && classOn()) {
      classFullscreen(false);
      btn.focus();
    }
  });
})();
