(function () {
  var pages = Array.prototype.slice.call(document.querySelectorAll('.page'));
  if (!pages.length) return;

  var prevBtn = document.getElementById('prev');
  var nextBtn = document.getElementById('next');
  var midEl = document.getElementById('pager-mid');
  var progEl = document.getElementById('prog-bar');
  var wrap = document.querySelector('.wrap');
  var cur = 0;

  function label(i) {
    var p = pages[i];
    var t = p.dataset.label || '';
    var n = p.dataset.step;
    if (n) return '<b>' + n + '</b> / ' + p.dataset.total + (t ? ' · ' + t : '');
    return t;
  }

  function show(i, back) {
    i = Math.max(0, Math.min(pages.length - 1, i));
    cur = i;
    pages.forEach(function (p, j) {
      p.classList.toggle('back', !!back);
      p.classList.toggle('on', j === i);
    });
    if (prevBtn) prevBtn.disabled = i === 0;
    if (nextBtn) nextBtn.disabled = i === pages.length - 1;
    if (midEl) midEl.innerHTML = label(i);
    if (progEl) progEl.style.width = ((i + 1) / pages.length * 100) + '%';
    if (wrap) wrap.scrollTop = 0;
    var id = pages[i].id;
    /* 샌드박스 iframe 등에서는 주소 변경이 막힌다. 실패해도 넘기기는 계속 되어야 한다. */
    try {
      if (id && history.replaceState) history.replaceState(null, '', '#' + id);
    } catch (e) { /* 무시 */ }
    document.querySelectorAll('.toc-panel .jump').forEach(function (b) {
      b.classList.toggle('cur', Number(b.dataset.i) === i);
    });
  }
  function go(d) { show(cur + d, d < 0); }

  if (prevBtn) prevBtn.addEventListener('click', function () { go(-1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { go(1); });

  /* 키보드 */
  document.addEventListener('keydown', function (e) {
    if (document.querySelector('.lb.open') || document.querySelector('.toc.open')) {
      if (e.key === 'Escape') { closeLb(); closeToc(); }
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { go(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { go(-1); }
  });

  /* 스와이프 */
  var sx = 0, sy = 0, tracking = false;
  document.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1 || document.querySelector('.lb.open')) { tracking = false; return; }
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; tracking = true;
  }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (!tracking) return;
    tracking = false;
    var t = e.changedTouches[0];
    var dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.7) go(dx < 0 ? 1 : -1);
  }, { passive: true });

  /* 목차 */
  var toc = document.querySelector('.toc');
  var tocBtn = document.getElementById('toc-btn');
  function openToc() { if (toc) toc.classList.add('open'); }
  function closeToc() { if (toc) toc.classList.remove('open'); }
  if (tocBtn) tocBtn.addEventListener('click', openToc);
  if (toc) {
    toc.addEventListener('click', function (e) { if (e.target === toc) closeToc(); });
    var cls = toc.querySelector('.toc-close');
    if (cls) cls.addEventListener('click', closeToc);
    toc.querySelectorAll('.jump').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = Number(b.dataset.i);
        closeToc();
        show(i, i < cur);
      });
    });
  }

  /* 표지의 시작 버튼 */
  document.querySelectorAll('[data-goto]').forEach(function (b) {
    b.addEventListener('click', function () { show(Number(b.dataset.goto)); });
  });

  /* 인쇄 */
  var printBtn = document.getElementById('print-btn');
  if (printBtn) printBtn.addEventListener('click', function () { window.print(); });

  /* 한국어 토글 */
  var koBtn = document.getElementById('ko-toggle');
  if (koBtn) {
    koBtn.addEventListener('click', function () {
      var off = document.body.classList.toggle('ko-off');
      this.textContent = off ? this.dataset.on : this.dataset.off;
    });
  }

  /* 이미지 확대 */
  var lb = document.getElementById('lb');
  var lbImg = document.getElementById('lb-img');
  function closeLb() {
    if (lb) lb.classList.remove('open');
  }
  if (lb && lbImg) {
    document.querySelectorAll('.shot img').forEach(function (img) {
      img.addEventListener('click', function () {
        lbImg.src = img.src; lbImg.alt = img.alt; lb.classList.add('open');
      });
    });
    lb.addEventListener('click', closeLb);
  }

  /* 진입 위치: 주소의 #앵커 */
  var h = (location.hash || '').slice(1);
  var start = 0;
  if (h) { pages.forEach(function (p, j) { if (p.id === h) start = j; }); }
  show(start);
})();
