/* 리터러시M 매뉴얼 사이트 빌드 스크립트
 *
 *  manual-project.json 하나만 고치면 아래 파일들을 dist/ 에 새로 만듭니다.
 *    dist/index.html
 *    dist/literacym-guide-*.html
 *    dist/manual-project.json   (관리자 페이지가 읽어가는 사본)
 *
 *  Netlify 설정 (공개 사이트)
 *    Build command      : node build.mjs
 *    Publish directory  : dist
 *
 *  admin.html 을 저장소에 넣으면 admin-dist/ 도 함께 만들어진다.
 *  이 폴더는 Private 로 둔 두 번째 Netlify 사이트에서 쓴다.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, 'dist');
const ADMIN_DIST = join(ROOT, 'admin-dist');
const read = (p) => readFileSync(p, 'utf8');

/* src/ 폴더에 있어도 되고, 저장소 루트에 그냥 두어도 됩니다. */
function asset(name) {
  for (const p of [join(ROOT, 'src', name), join(ROOT, name)]) {
    if (existsSync(p)) return read(p);
  }
  console.error(`파일을 찾을 수 없습니다: ${name} (src/${name} 또는 ./${name})`);
  process.exit(1);
}

/* --- load the shared renderer (same file the admin page uses) --- */
const sandbox = {};
new Function('window', asset('render.js'))(sandbox);
sandbox.GUIDE_CSS = asset('guide.css');
sandbox.GUIDE_JS = asset('guide.js');
sandbox.INDEX_CSS = asset('index.css');

/* --- render --- */
const project = JSON.parse(read(join(ROOT, 'manual-project.json')));
if (!project.docs || !project.docs.length) {
  console.error('manual-project.json 에 docs 가 없습니다.');
  process.exit(1);
}

mkdirSync(DIST, { recursive: true });

const files = [['index.html', sandbox.renderIndex(project)]];
for (const doc of project.docs) {
  const name = doc.file || `${doc.id || 'guide'}.html`;
  files.push([name, sandbox.renderGuide(doc, project)]);
}

for (const [name, html] of files) {
  writeFileSync(join(DIST, name), html, 'utf8');
  console.log(`  ${name}  ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB`);
}

/* the admin page fetches this to stay in sync with what is published */
copyFileSync(join(ROOT, 'manual-project.json'), join(DIST, 'manual-project.json'));
console.log('  manual-project.json (사본)');

console.log(`\n공개 사이트: ${files.length}개 페이지를 dist/ 에 만들었습니다.`);

/* ------------------------------------------------------------------ *
 *  관리자 페이지는 별도 폴더(admin-dist/)로 내보낸다.
 *  Netlify 사이트를 2개 만들어
 *    사이트1  publish: dist        → Public  (환자용)
 *    사이트2  publish: admin-dist  → Private (관리자 전용, 본인만)
 *  로 설정하면 관리자 페이지가 공개되지 않는다.
 * ------------------------------------------------------------------ */
/* admin-dist/ 는 admin.html 유무와 상관없이 항상 만든다.
   폴더가 없으면 관리자 사이트 배포가 실패하기 때문이다. */
mkdirSync(ADMIN_DIST, { recursive: true });
copyFileSync(join(ROOT, 'manual-project.json'), join(ADMIN_DIST, 'manual-project.json'));

const admin = join(ROOT, 'admin.html');
if (existsSync(admin)) {
  copyFileSync(admin, join(ADMIN_DIST, 'index.html'));
  console.log('관리자 사이트: admin-dist/index.html + manual-project.json');
} else {
  writeFileSync(join(ADMIN_DIST, 'index.html'),
    '<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>관리자 페이지 준비 중</title>' +
    '<style>body{font-family:-apple-system,"Noto Sans KR",sans-serif;background:#f6f6f4;color:#1e1e1c;' +
    'display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;' +
    'text-align:center;line-height:1.7}div{max-width:420px}h1{font-size:19px;margin:0 0 10px}' +
    'p{font-size:14px;color:#54534e;margin:0}code{background:#eeeee8;padding:2px 6px;border-radius:4px;' +
    'font-size:13px}</style></head><body><div><h1>관리자 페이지가 아직 없습니다</h1>' +
    '<p>저장소에 <code>admin.html</code> 을 업로드하면 이 자리에 관리자 페이지가 표시됩니다.</p>' +
    '</div></body></html>\n', 'utf8');
  console.log('관리자 사이트: admin.html 이 없어 안내 페이지를 넣었습니다 (admin-dist/)');
}
