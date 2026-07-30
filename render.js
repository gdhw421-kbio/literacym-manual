/* Renders a project document into a complete, standalone HTML file.
   GUIDE_CSS / GUIDE_JS are injected at assembly time. */
(function (global) {

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* Bullet / title text may contain a small amount of inline markup the editor
     allows: <b>, <i>, <br>, <a href>. Everything else is escaped. */
  var ALLOWED = /^(b|i|em|strong|br|a|small)$/i;
  function rich(s) {
    s = String(s == null ? '' : s);
    var out = '', last = 0, re = /<\/?([a-zA-Z0-9]+)((?:\s+[a-zA-Z-]+\s*=\s*"[^"]*")*)\s*\/?>/g, m;
    while ((m = re.exec(s)) !== null) {
      out += esc(s.slice(last, m.index));
      if (ALLOWED.test(m[1])) {
        var attrs = '';
        if (/^a$/i.test(m[1]) && m[2]) {
          var href = /href\s*=\s*"([^"]*)"/i.exec(m[2]);
          if (href) attrs = ' href="' + esc(href[1]) + '"';
        }
        out += '<' + (m[0][1] === '/' ? '/' : '') + m[1].toLowerCase() + attrs + '>';
      } else {
        out += esc(m[0]);
      }
      last = re.lastIndex;
    }
    return out + esc(s.slice(last));
  }

  function ui(doc, key, fallback) {
    var v = (doc.ui || {})[key];
    return (v === undefined || v === null || v === '') ? fallback : v;
  }

  function renderShot(step, doc, n) {
    var alt = esc(doc.brandLabel || 'LiteracyM') + ' ' + esc(doc.os) + ' — STEP ' + n;
    var inner = step.image
      ? '<img src="' + step.image + '" alt="' + alt + '" />'
      : '<div class="shot-empty">이미지 없음<br>No screenshot yet<br><small>관리자 페이지에서 등록하세요</small></div>';
    return '<figure class="shot">\n' +
      '        <!-- SCREENSHOT · STEP ' + n + ' -->\n' +
      '        ' + inner + '\n' +
      '        <figcaption class="shot-cap">' + esc(ui(doc, 'stepWord', 'Step')) + ' ' + n + ' / ' + doc.steps.length + '</figcaption>\n' +
      '      </figure>';
  }

  function renderItems(items) {
    return (items || []).map(function (it) {
      var cls = (it.type === 'star' || it.type === 'check') ? ' class="' + it.type + '"' : '';
      return '        <li' + cls + '>\n' +
        '          <div class="line-en">' + rich(it.main) + '</div>\n' +
        (it.ko ? '          <div class="line-ko">' + rich(it.ko) + '</div>\n' : '') +
        '        </li>';
    }).join('\n');
  }

  function renderGuide(doc, project) {
    project = project || {};
    var brand = project.brand || {};
    var common = project.common || {};
    var total = doc.steps.length;
    var wm = esc(brand.wordmark || 'LiteracyM');
    var wmHtml = wm.replace(/M$/, '<em>M</em>');

    var idx = doc.steps.map(function (st, i) {
      var n = i + 1;
      return '      <li><a href="#step-' + n + '"><b>' + (n < 10 ? '0' + n : n) + '</b>' +
        '<span>' + rich(st.titleMain) +
        (st.titleKo ? '<span class="line-ko">' + rich(st.titleKo) + '</span>' : '') +
        '</span></a></li>';
    }).join('\n');

    var blocks = doc.steps.map(function (st, i) {
      var n = i + 1;
      var out = '';
      if (st.sectionBreak) {
        out += '  <div class="divider no-print"><span class="line"></span>' +
          '<span class="label">' + rich(st.sectionBreak) +
          (common.sectionBreakKo ? '<i>' + rich(common.sectionBreakKo) + '</i>' : '') +
          '</span><span class="line"></span></div>\n';
      }
      out += '  <section class="step" id="step-' + n + '">\n' +
        (st.sectionBreak
          ? '    <div class="step-eyebrow print-only">' + rich(st.sectionBreak) +
            (common.sectionBreakKo ? '<i>' + rich(common.sectionBreakKo) + '</i>' : '') + '</div>\n'
          : '') +
        '    <div class="step-head">\n' +
        '      <span class="step-num">STEP ' + n + '</span>\n' +
        '      <h2 class="step-title">' + rich(st.titleMain) +
        (st.titleKo ? '<span class="ko">' + rich(st.titleKo) + '</span>' : '') + '</h2>\n' +
        '    </div>\n' +
        '    <div class="step-body">\n' +
        '      ' + renderShot(st, doc, n) + '\n' +
        '      <ul class="bullets">\n' + renderItems(st.items) + '\n      </ul>\n' +
        '    </div>\n' +
        '    <div class="slide-foot print-only"><span>' + wm.replace(/M$/, '<em>M</em>') +
        ' · ' + esc(doc.os) + '</span><span>' + esc(ui(doc, 'stepWord', 'Step')) + ' ' + n + ' / ' + total + '</span></div>\n' +
        '  </section>';
      return out;
    }).join('\n');

    return '<!DOCTYPE html>\n' +
'<html lang="' + esc(doc.lang || 'en') + '">\n' +
'<head>\n' +
'<meta charset="utf-8" />\n' +
'<meta name="viewport" content="width=device-width,initial-scale=1.0" />\n' +
'<title>' + esc(doc.docTitle || (wm + ' — ' + doc.titleMain)) + '</title>\n' +
'<meta name="description" content="' + esc(doc.docDesc || '') + '" />\n' +
'<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
'<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+KR:wght@400;500;600;700;900&display=swap" rel="stylesheet">\n' +
'<style>\n' + global.GUIDE_CSS + '\n</style>\n' +
'</head>\n' +
'<body>\n\n' +
'<div class="toolbar no-print">\n' +
'  <div class="tb-brand"><span class="tb-dot"></span>' + wmHtml + '</div>\n' +
'  <span class="tb-os">' + esc(doc.os) + '</span>\n' +
'  <div class="tb-spacer"></div>\n' +
'  <button class="btn tb-hide-sm" id="ko-toggle" data-off="' + esc(ui(doc, 'btnKoOff', '한국어 숨기기 / Hide Korean')) +
      '" data-on="' + esc(ui(doc, 'btnKoOn', '한국어 보기 / Show Korean')) + '">' +
      esc(ui(doc, 'btnKoOff', '한국어 숨기기 / Hide Korean')) + '</button>\n' +
'  <button class="btn btn-primary" id="print-btn">' + esc(ui(doc, 'btnPrint', '인쇄 / Print')) + '</button>\n' +
'</div>\n\n' +
'<div class="wrap">\n\n' +
'  <header class="cover">\n' +
'    <div class="wordmark">' + wmHtml + '</div>\n' +
'    <div class="wordmark-ko">' + esc(brand.wordmarkKo || '') + '</div>\n' +
'    <div class="cover-rule"></div>\n' +
'    <h1>' + rich(doc.titleMain) + '<br><span class="os">(' + esc(doc.osTitle || doc.os) + ')</span></h1>\n' +
'    <div class="h1-ko">' + rich(doc.titleKo) + ' <span>(' + esc(doc.osKo || '') + '용)</span></div>\n' +
'    <div class="audience">' + rich(doc.audienceMain) + ' <span>· ' + rich(doc.audienceKo) + '</span></div>\n' +
'    <div class="credits">\n' +
'      <div>' + rich(doc.projectMain) + '</div>\n' +
'      <div class="ko">' + rich(common.projectKo || '') + '</div>\n' +
'      <div class="partners">' + esc(brand.partners || '') + '</div>\n' +
'    </div>\n' +
'    <div class="slide-foot print-only"><span>' + wmHtml + ' · ' + esc(doc.os) +
     '</span><span>' + esc(brand.partners || '') + '</span></div>\n' +
'  </header>\n\n' +
'  <nav class="index no-print">\n' +
'    <h2>' + esc(ui(doc, 'contents', 'Contents')) + ' <span>· 목차</span></h2>\n' +
'    <ol>\n' + idx + '\n    </ol>\n' +
'  </nav>\n\n' +
blocks + '\n\n' +
'  <footer class="foot">\n' +
'    <div class="line-en">' + rich(doc.footerMain) + '</div>\n' +
'    <div class="line-ko">' + rich(common.footerKo || '') + '</div>\n' +
(doc.switchHtml ? '    <div class="switch no-print">' + doc.switchHtml + '</div>\n' : '') +
'    <div class="switch no-print"><a href="index.html">' + esc(ui(doc, 'homeLink', 'Choose a different language or phone')) + '</a> <span>· 언어·기기 다시 선택</span></div>\n' +
'    <div class="mark">' + esc(brand.partners || '') + '</div>\n' +
'  </footer>\n\n' +
'</div>\n\n' +
'<div class="lb" id="lb"><img id="lb-img" alt="" /><div class="lb-hint">아무 곳이나 눌러 닫기 · Tap anywhere to close</div></div>\n\n' +
'<script>\n' + global.GUIDE_JS + '\n<\/script>\n' +
'</body>\n</html>\n';
  }

  /* ---- landing page: two-step selector ---------------------------------- */
  var PHONE = {
    android: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="6" y="2.5" width="12" height="19" rx="2.4"/><path d="M9.6 18.8h4.8"/></svg>',
    iphone: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="6" y="2.5" width="12" height="19" rx="3.2"/><path d="M10.2 5.1h3.6"/><path d="M10.4 19.2h3.2"/></svg>',
    globe: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="8.6"/><path d="M3.6 12h16.8"/><path d="M12 3.4c2.3 2.3 3.5 5.3 3.5 8.6S14.3 18.3 12 20.6c-2.3-2.3-3.5-5.3-3.5-8.6S9.7 5.7 12 3.4z"/></svg>'
  };

  function phoneIcon(os) {
    var o = String(os || '').toLowerCase();
    if (o.indexOf('iphone') >= 0 || o.indexOf('ios') >= 0) return PHONE.iphone;
    if (o.indexOf('android') >= 0) return PHONE.android;
    return PHONE.android;
  }

  /* "iPhone (iOS)" -> "iPhone" */
  function shortOs(os) {
    return String(os || '').replace(/\s*[（(].*?[)）]\s*/g, '').trim() || String(os || '');
  }

  function renderIndex(project) {
    var brand = project.brand || {};
    var wmPlain = esc(brand.wordmark || 'LiteracyM');
    var wm = wmPlain.replace(/M$/, '<em>M</em>');

    /* group documents by language, keeping the order they appear in */
    var order = [], byLang = {};
    (project.docs || []).forEach(function (d) {
      var key = d.lang || d.langName || 'x';
      if (!byLang[key]) { byLang[key] = { key: key, docs: [], sample: d }; order.push(key); }
      byLang[key].docs.push(d);
    });

    /* step 1 — language */
    var langOpts = order.map(function (key) {
      var g = byLang[key], d = g.sample;
      return '        <button class="opt" type="button" data-go="lang-' + esc(key) + '">\n' +
        '          <span class="ic">' + PHONE.globe + '</span>\n' +
        '          <span class="tx"><span class="main">' + esc(d.langLabel || d.langName || key) + '</span>' +
        '<span class="sub">' + esc(d.langName || '') + '</span></span>\n' +
        '          <span class="go">&rarr;</span>\n' +
        '        </button>';
    }).join('\n');

    /* step 2 — device, one panel per language */
    var devSteps = order.map(function (key) {
      var g = byLang[key], d0 = g.sample;
      var ui = d0.ui || {};
      var title = ui.pickDevice || 'Which phone do you use?';
      var back = ui.back || 'Back';
      var opts = g.docs.map(function (d) {
        return '        <a class="opt" href="' + esc(d.file) + '">\n' +
          '          <span class="ic">' + phoneIcon(d.os) + '</span>\n' +
          '          <span class="tx"><span class="main">' + esc(shortOs(d.os)) + '</span>' +
          '<span class="sub">' + esc(d.osKo || '') + '</span></span>\n' +
          '          <span class="go">&rarr;</span>\n' +
          '        </a>';
      }).join('\n');
      return '    <section class="step" id="lang-' + esc(key) + '">\n' +
        '      <div class="top">\n' +
        '        <button class="back" type="button" data-go="pick-lang">&larr; ' + esc(back) + '</button>\n' +
        '        <span class="sp"></span>\n' +
        '        <span class="count"><b>2</b> / 2</span>\n' +
        '      </div>\n' +
        '      <h1>' + esc(title) + '<span>사용하시는 기기를 선택하세요</span></h1>\n' +
        '      <div class="opts">\n' + opts + '\n      </div>\n' +
        '    </section>';
    }).join('\n\n');

    return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8" />\n' +
'<meta name="viewport" content="width=device-width,initial-scale=1.0" />\n' +
'<title>' + wmPlain + ' — User Guide | ' + esc(brand.wordmarkKo || '') + ' 사용자 매뉴얼</title>\n' +
'<meta name="description" content="Select your language and phone to open the setup guide. 언어와 기기를 선택하면 설치 가이드가 열립니다." />\n' +
'<meta name="theme-color" content="#f6f6f4" />\n' +
'<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
'<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+KR:wght@400;500;600;700;900&display=swap" rel="stylesheet">\n' +
'<style>\n' + global.INDEX_CSS + '\n</style>\n</head>\n<body>\n\n' +
'<div class="brand">\n' +
'  <div class="wm">' + wm + '</div>\n' +
'  <div class="ko">' + esc(brand.wordmarkKo || '') + '</div>\n' +
'</div>\n\n' +
'<main class="app">\n' +
'  <div class="card">\n\n' +
'    <section class="step on" id="pick-lang">\n' +
'      <div class="top"><span class="sp"></span><span class="count"><b>1</b> / 2</span></div>\n' +
'      <h1>Select your language<span>언어를 선택하세요</span></h1>\n' +
'      <div class="opts">\n' + langOpts + '\n      </div>\n' +
'    </section>\n\n' +
devSteps + '\n\n' +
'  </div>\n' +
'</main>\n\n' +
'<div class="mark">' + esc(brand.partners || '') + '</div>\n\n' +
'<script>\n' +
'(function () {\n' +
'  var steps = document.querySelectorAll(".step");\n' +
'  function show(id) {\n' +
'    steps.forEach(function (s) { s.classList.toggle("on", s.id === id); });\n' +
'    if (history.replaceState) history.replaceState(null, "", "#" + id);\n' +
'    window.scrollTo(0, 0);\n' +
'  }\n' +
'  document.querySelectorAll("[data-go]").forEach(function (b) {\n' +
'    b.addEventListener("click", function () { show(b.dataset.go); });\n' +
'  });\n' +
'  var h = (location.hash || "").slice(1);\n' +
'  if (h && document.getElementById(h)) show(h);\n' +
'  window.addEventListener("hashchange", function () {\n' +
'    var id = (location.hash || "").slice(1) || "pick-lang";\n' +
'    if (document.getElementById(id)) show(id);\n' +
'  });\n' +
'})();\n' +
'<\/script>\n</body>\n</html>\n';
  }

  global.renderGuide = renderGuide;
  global.renderIndex = renderIndex;
})(typeof window !== 'undefined' ? window : this);
