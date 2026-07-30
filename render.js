/* 리터러시M 매뉴얼 렌더러 (v2)
 *
 *   renderGuide(device, lang, project)  →  가이드 HTML 한 편
 *   renderIndex(project)                →  첫 화면(선택 화면)
 *   guideFileName(deviceId, langCode)   →  파일명 규칙
 *
 * 텍스트는 device.steps 에 한국어로 한 번만 존재한다.
 * 다른 언어는 step.t[langCode] 에 번역이 들어오면 그것을 쓰고,
 * 없으면 한국어를 그대로 쓴다(번역 전 상태에서도 페이지가 깨지지 않도록).
 *
 * GUIDE_CSS / GUIDE_JS / INDEX_CSS 는 조립 시점에 주입된다.
 */
(function (global) {

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* 본문에 허용하는 최소 서식만 통과시키고 나머지는 이스케이프 */
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

  /* ---- 언어별 기본 UI 문구 ------------------------------------------- */
  var UI_FALLBACK = {
    title: 'Sign-up · App installation · Login guide',
    audience: '',
    contents: 'Contents',
    stepWord: 'Step',
    btnPrint: 'Print',
    btnKoOff: '한국어 숨기기 / Hide Korean',
    btnKoOn: '한국어 보기 / Show Korean',
    pickDevice: 'Which phone do you use?',
    pickLang: 'Select your language',
    back: 'Back',
    homeLink: 'Choose a different phone'
  };
  function ui(lang, key) {
    var v = (lang.ui || {})[key];
    return (v === undefined || v === null || v === '') ? UI_FALLBACK[key] : v;
  }

  function guideFileName(deviceId, langCode) {
    return 'literacym-guide-' + deviceId + '-' + langCode + '.html';
  }

  /* ---- 한 단계의 표시용 텍스트를 언어에 맞춰 뽑아낸다 ------------------ */
  function resolve(step, lang) {
    var src = lang.isSource;
    var tr = (step.t || {})[lang.code] || null;
    var items = (step.items || []).map(function (x, i) {
      var t = tr && tr.items && tr.items[i];
      return {
        main: src ? x.ko : (t && t.text ? t.text : x.ko),
        ko: src ? '' : x.ko,
        type: x.type || 'dot'
      };
    });
    return {
      title: src ? step.titleKo : ((tr && tr.title) ? tr.title : step.titleKo),
      titleKo: src ? '' : step.titleKo,
      section: src ? step.sectionKo : ((tr && tr.section) ? tr.section : step.sectionKo),
      sectionKo: src ? '' : step.sectionKo,
      items: items
    };
  }

  /* ---- 가이드 -------------------------------------------------------- */
  function renderGuide(device, lang, project) {
    var site = project.site || {};
    var total = device.steps.length;
    var wmPlain = esc(site.wordmark || 'LiteracyM');
    var wm = wmPlain.replace(/M$/, '<em>M</em>');
    var bilingual = !lang.isSource;
    var osKo = lang.isSource ? device.nameKo : device.nameKo;
    var langs = project.languages || [];

    var resolved = device.steps.map(function (st) { return resolve(st, lang); });

    var idx = resolved.map(function (r, i) {
      var n = i + 1;
      return '      <li><a href="#step-' + n + '"><b>' + (n < 10 ? '0' + n : n) + '</b>' +
        '<span>' + rich(r.title) +
        (r.titleKo ? '<span class="line-ko">' + rich(r.titleKo) + '</span>' : '') +
        '</span></a></li>';
    }).join('\n');

    var blocks = resolved.map(function (r, i) {
      var n = i + 1;
      var step = device.steps[i];
      var img = (step.images || {})[lang.code] || '';
      var alt = wmPlain + ' ' + esc(device.name) + ' — STEP ' + n;
      var shot = img
        ? '<img src="' + img + '" alt="' + alt + '" />'
        : '<div class="shot-empty">이미지 없음<br><small>관리자 페이지에서 등록하세요</small></div>';

      var out = '';
      if (r.section) {
        out += '  <div class="divider no-print"><span class="line"></span>' +
          '<span class="label">' + rich(r.section) +
          (r.sectionKo ? '<i>' + rich(r.sectionKo) + '</i>' : '') +
          '</span><span class="line"></span></div>\n';
      }
      out += '  <section class="step" id="step-' + n + '">\n' +
        (r.section
          ? '    <div class="step-eyebrow print-only">' + rich(r.section) +
            (r.sectionKo ? '<i>' + rich(r.sectionKo) + '</i>' : '') + '</div>\n'
          : '') +
        '    <div class="step-head">\n' +
        '      <span class="step-num">' + esc(ui(lang, 'stepWord')) + ' ' + n + '</span>\n' +
        '      <h2 class="step-title">' + rich(r.title) +
        (r.titleKo ? '<span class="ko">' + rich(r.titleKo) + '</span>' : '') + '</h2>\n' +
        '    </div>\n' +
        '    <div class="step-body">\n' +
        '      <figure class="shot">\n' +
        '        <!-- SCREENSHOT · ' + device.id + ' / ' + lang.code + ' / STEP ' + n + ' -->\n' +
        '        ' + shot + '\n' +
        '        <figcaption class="shot-cap">' + esc(ui(lang, 'stepWord')) + ' ' + n + ' / ' + total + '</figcaption>\n' +
        '      </figure>\n' +
        '      <ul class="bullets">\n' +
        r.items.map(function (x) {
          var cls = (x.type === 'star' || x.type === 'check') ? ' class="' + x.type + '"' : '';
          return '        <li' + cls + '>\n' +
            '          <div class="line-en">' + rich(x.main) + '</div>\n' +
            (x.ko ? '          <div class="line-ko">' + rich(x.ko) + '</div>\n' : '') +
            '        </li>';
        }).join('\n') + '\n' +
        '      </ul>\n' +
        '    </div>\n' +
        '    <div class="slide-foot print-only"><span>' + wm + ' · ' + esc(device.name) +
        '</span><span>' + esc(ui(lang, 'stepWord')) + ' ' + n + ' / ' + total + '</span></div>\n' +
        '  </section>';
      return out;
    }).join('\n');

    /* 같은 언어의 다른 기기로 가는 링크 */
    var others = (project.devices || []).filter(function (d) { return d.id !== device.id; });
    var switchHtml = others.map(function (d) {
      return '<a href="' + guideFileName(d.id, lang.code) + '">' + esc(d.name) + '</a>';
    }).join(' · ');

    var title = ui(lang, 'title');
    var docTitle = wmPlain + ' — ' + title + ' (' + device.name + ')';

    return '<!DOCTYPE html>\n' +
'<html lang="' + esc(lang.code) + '">\n' +
'<head>\n' +
'<meta charset="utf-8" />\n' +
'<meta name="viewport" content="width=device-width,initial-scale=1.0" />\n' +
'<title>' + esc(docTitle) + '</title>\n' +
'<meta name="description" content="' + esc(title + ' · ' + device.name + ' · ' + wmPlain) + '" />\n' +
'<meta name="theme-color" content="#f6f6f4" />\n' +
'<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
'<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+KR:wght@400;500;600;700;900&display=swap" rel="stylesheet">\n' +
'<style>\n' + global.GUIDE_CSS + '\n</style>\n' +
'</head>\n<body>\n\n' +
'<div class="toolbar no-print">\n' +
'  <div class="tb-brand"><span class="tb-dot"></span>' + wm + '</div>\n' +
'  <span class="tb-os">' + esc(device.name) + '</span>\n' +
'  <div class="tb-spacer"></div>\n' +
(bilingual
  ? '  <button class="btn tb-hide-sm" id="ko-toggle" data-off="' + esc(ui(lang, 'btnKoOff')) +
    '" data-on="' + esc(ui(lang, 'btnKoOn')) + '">' + esc(ui(lang, 'btnKoOff')) + '</button>\n'
  : '') +
'  <button class="btn btn-primary" id="print-btn">' + esc(ui(lang, 'btnPrint')) + '</button>\n' +
'</div>\n\n' +
'<div class="wrap">\n\n' +
'  <header class="cover">\n' +
'    <div class="wordmark">' + wm + '</div>\n' +
'    <div class="wordmark-ko">' + esc(site.wordmarkKo || '') + '</div>\n' +
'    <div class="cover-rule"></div>\n' +
'    <h1>' + rich(title) + '<br><span class="os">(' + esc(device.name) + ')</span></h1>\n' +
(bilingual ? '    <div class="h1-ko">' + esc(site.wordmarkKo || '') + ' · ' + esc(osKo) + '용</div>\n' : '') +
(ui(lang, 'audience') ? '    <div class="audience">' + esc(ui(lang, 'audience')) + '</div>\n' : '') +
'    <div class="credits">\n' +
'      <div>' + rich(site.projectKo || '') + '</div>\n' +
'      <div class="partners">' + esc(site.partners || '') + '</div>\n' +
'    </div>\n' +
'    <div class="slide-foot print-only"><span>' + wm + ' · ' + esc(device.name) +
     '</span><span>' + esc(site.partners || '') + '</span></div>\n' +
'  </header>\n\n' +
'  <nav class="index no-print">\n' +
'    <h2>' + esc(ui(lang, 'contents')) + '</h2>\n' +
'    <ol>\n' + idx + '\n    </ol>\n' +
'  </nav>\n\n' +
blocks + '\n\n' +
'  <footer class="foot">\n' +
'    <div class="line-en">' + rich(site.footerKo || '') + '</div>\n' +
(switchHtml ? '    <div class="switch no-print">' + switchHtml + '</div>\n' : '') +
'    <div class="switch no-print"><a href="index.html">' + esc(ui(lang, 'homeLink')) + '</a></div>\n' +
'    <div class="mark">' + esc(site.partners || '') + '</div>\n' +
'  </footer>\n\n' +
'</div>\n\n' +
'<div class="lb" id="lb"><img id="lb-img" alt="" /><div class="lb-hint">아무 곳이나 눌러 닫기</div></div>\n\n' +
'<script>\n' + global.GUIDE_JS + '\n<\/script>\n' +
'</body>\n</html>\n';
  }

  /* ---- 첫 화면 ------------------------------------------------------- */
  var ICON = {
    android: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="6" y="2.5" width="12" height="19" rx="2.4"/><path d="M9.6 18.8h4.8"/></svg>',
    iphone: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="6" y="2.5" width="12" height="19" rx="3.2"/><path d="M10.2 5.1h3.6"/><path d="M10.4 19.2h3.2"/></svg>',
    globe: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="8.6"/><path d="M3.6 12h16.8"/><path d="M12 3.4c2.3 2.3 3.5 5.3 3.5 8.6S14.3 18.3 12 20.6c-2.3-2.3-3.5-5.3-3.5-8.6S9.7 5.7 12 3.4z"/></svg>'
  };
  function deviceIcon(d) {
    var s = (d.id + ' ' + d.name).toLowerCase();
    if (s.indexOf('iphone') >= 0 || s.indexOf('ios') >= 0) return ICON.iphone;
    return ICON.android;
  }

  function renderIndex(project) {
    var site = project.site || {};
    var langs = project.languages || [];
    var devices = project.devices || [];
    var wmPlain = esc(site.wordmark || 'LiteracyM');
    var wm = wmPlain.replace(/M$/, '<em>M</em>');
    var single = langs.length <= 1;
    var totalSteps = single ? 1 : 2;

    function devicePanel(lang, idAttr, withBack) {
      var opts = devices.map(function (d) {
        return '        <a class="opt" href="' + guideFileName(d.id, lang.code) + '">\n' +
          '          <span class="ic">' + deviceIcon(d) + '</span>\n' +
          '          <span class="tx"><span class="main">' + esc(d.name) + '</span>' +
          '<span class="sub">' + esc(d.nameKo || '') + '</span></span>\n' +
          '          <span class="go">&rarr;</span>\n' +
          '        </a>';
      }).join('\n');
      return '    <section class="step' + (withBack ? '' : ' on') + '" id="' + idAttr + '">\n' +
        '      <div class="top">' +
        (withBack ? '<button class="back" type="button" data-go="pick-lang">&larr; ' + esc(ui(lang, 'back')) + '</button>' : '') +
        '<span class="sp"></span><span class="count"><b>' + totalSteps + '</b> / ' + totalSteps + '</span></div>\n' +
        '      <h1>' + esc(ui(lang, 'pickDevice')) + '</h1>\n' +
        '      <div class="opts">\n' + opts + '\n      </div>\n' +
        '    </section>';
    }

    var body;
    if (single) {
      body = devicePanel(langs[0] || { code: 'ko', ui: {} }, 'pick-device', false);
    } else {
      var langOpts = langs.map(function (l) {
        return '        <button class="opt" type="button" data-go="lang-' + esc(l.code) + '">\n' +
          '          <span class="ic">' + ICON.globe + '</span>\n' +
          '          <span class="tx"><span class="main">' + esc(l.label || l.code) + '</span>' +
          '<span class="sub">' + esc(l.labelKo || '') + '</span></span>\n' +
          '          <span class="go">&rarr;</span>\n' +
          '        </button>';
      }).join('\n');
      body = '    <section class="step on" id="pick-lang">\n' +
        '      <div class="top"><span class="sp"></span><span class="count"><b>1</b> / 2</span></div>\n' +
        '      <h1>Select your language<span>언어를 선택하세요</span></h1>\n' +
        '      <div class="opts">\n' + langOpts + '\n      </div>\n' +
        '    </section>\n\n' +
        langs.map(function (l) { return devicePanel(l, 'lang-' + l.code, true); }).join('\n\n');
    }

    return '<!DOCTYPE html>\n<html lang="ko">\n<head>\n<meta charset="utf-8" />\n' +
'<meta name="viewport" content="width=device-width,initial-scale=1.0" />\n' +
'<title>' + wmPlain + ' 사용자 매뉴얼</title>\n' +
'<meta name="description" content="사용하시는 기기를 선택하면 회원가입·앱 설치·로그인 가이드가 열립니다." />\n' +
'<meta name="theme-color" content="#f6f6f4" />\n' +
'<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
'<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+KR:wght@400;500;600;700;900&display=swap" rel="stylesheet">\n' +
'<style>\n' + global.INDEX_CSS + '\n</style>\n</head>\n<body>\n\n' +
'<div class="brand">\n  <div class="wm">' + wm + '</div>\n' +
'  <div class="ko">' + esc(site.wordmarkKo || '') + '</div>\n</div>\n\n' +
'<main class="app">\n  <div class="card">\n\n' + body + '\n\n  </div>\n</main>\n\n' +
'<div class="mark">' + esc(site.partners || '') + '</div>\n\n' +
'<script>\n' +
'(function () {\n' +
'  var steps = document.querySelectorAll(".step");\n' +
'  if (steps.length < 2) return;\n' +
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
  global.guideFileName = guideFileName;
  global.resolveStep = resolve;
})(typeof window !== 'undefined' ? window : this);
