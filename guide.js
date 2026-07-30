(function () {
  var koBtn = document.getElementById('ko-toggle');
  if (koBtn) {
    koBtn.addEventListener('click', function () {
      var off = document.body.classList.toggle('ko-off');
      this.textContent = off ? this.dataset.on : this.dataset.off;
    });
  }
  var printBtn = document.getElementById('print-btn');
  if (printBtn) printBtn.addEventListener('click', function () { window.print(); });

  var lb = document.getElementById('lb');
  var lbImg = document.getElementById('lb-img');
  if (lb && lbImg) {
    document.querySelectorAll('.shot img').forEach(function (img) {
      img.addEventListener('click', function () {
        lbImg.src = img.src;
        lbImg.alt = img.alt;
        lb.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });
    var close = function () { lb.classList.remove('open'); document.body.style.overflow = ''; };
    lb.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }
})();
