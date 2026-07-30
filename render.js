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
'    <div class="mark">' + esc(brand.partners || '') + '</div>\n' +
'  </footer>\n\n' +
'</div>\n\n' +
'<div class="lb" id="lb"><img id="lb-img" alt="" /><div class="lb-hint">아무 곳이나 눌러 닫기 · Tap anywhere to close</div></div>\n\n' +
'<script>\n' + global.GUIDE_JS + '\n<\/script>\n' +
'</body>\n</html>\n';
  }

  /* ---- landing page ---------------------------------------------------- */
  function renderIndex(project) {
    var brand = project.brand || {};
    var wm = esc(brand.wordmark || 'LiteracyM').replace(/M$/, '<em>M</em>');
    var groups = {};
    project.docs.forEach(function (d) {
      var key = d.langName || d.lang;
      (groups[key] = groups[key] || []).push(d);
    });
    var sections = Object.keys(groups).map(function (key) {
      var ds = groups[key];
      var label = esc(ds[0].langLabel || key);
      return '  <section class="group">\n' +
        '    <div class="group-label">' + label + ' <span>· ' + esc(key) + '</span></div>\n' +
        '    <div class="links">\n' +
        ds.map(function (d) {
          return '      <a class="pick" href="' + esc(d.file) + '">\n' +
            '        <span class="os">' + esc(d.os) + ' <i>&rarr;</i></span>\n' +
            '        <span class="sub">' + esc(d.titleMain) + '</span>\n' +
            '      </a>';
        }).join('\n') + '\n    </div>\n  </section>';
    }).join('\n\n');

    return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8" />\n' +
'<meta name="viewport" content="width=device-width,initial-scale=1.0" />\n' +
'<title>' + esc(brand.wordmark || 'LiteracyM') + ' — User Guides | ' + esc(brand.wordmarkKo || '') + ' 사용자 매뉴얼</title>\n' +
'<meta name="description" content="Choose your phone and language to open the setup guide. 사용 기기와 언어를 선택하세요." />\n' +
'<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
'<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+KR:wght@400;500;600;700;900&display=swap" rel="stylesheet">\n' +
'<style>\n' + global.INDEX_CSS + '\n</style>\n</head>\n<body>\n' +
'<main class="card">\n' +
'  <div class="wordmark">' + wm + '</div>\n' +
'  <div class="wordmark-ko">' + esc(brand.wordmarkKo || '') + '</div>\n' +
'  <div class="rule"></div>\n' +
'  <h1>Choose your phone and language<br>to open the setup guide</h1>\n' +
'  <div class="h1-ko">사용 기기와 언어를 선택하면 가입·설치·로그인 가이드가 열립니다</div>\n\n' +
sections + '\n\n' +
'  <div class="note">Every guide prints as 16:9 slides — use the print button at the top of the page.<br>\n' +
'  각 가이드는 상단 인쇄 버튼으로 16:9 슬라이드 형식 인쇄 · PDF 저장이 됩니다.</div>\n' +
'  <div class="mark">' + esc(brand.partners || '') + '</div>\n' +
'</main>\n</body>\n</html>\n';
  }

  global.renderGuide = renderGuide;
  global.renderIndex = renderIndex;
})(typeof window !== 'undefined' ? window : this);
