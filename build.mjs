/* 리터러시M 매뉴얼 사이트 빌드 (v2)
 *
 *  manual-project.json 하나만 고치면 아래 파일들을 새로 만듭니다.
 *    dist/index.html
 *    dist/literacym-guide-<기기>-<언어>.html   (기기 × 언어 조합 전부)
 *    dist/manual-project.json
 *    admin-dist/index.html                     (admin.html 이 있으면)
 *
 *  Netlify 설정
 *    공개 사이트 : Build command  node build.mjs   /  Publish directory  dist
 *    관리자 사이트: Build command  node build.mjs   /  Publish directory  admin-dist
 *
 *  언어를 추가하려면 manual-project.json 의 languages 배열에 항목을 하나 넣으면
 *  됩니다. 문서는 자동으로 늘어납니다.
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

/* 관리자 페이지와 똑같은 렌더러를 사용한다 */
const R = {};
new Function('window', asset('render.js'))(R);
R.GUIDE_CSS = asset('guide.css');
R.GUIDE_JS = asset('guide.js');
R.INDEX_CSS = asset('index.css');

const project = JSON.parse(read(join(ROOT, 'manual-project.json')));
const languages = project.languages || [];
const devices = project.devices || [];
if (!languages.length || !devices.length) {
  console.error('manual-project.json 에 languages 또는 devices 가 없습니다.');
  process.exit(1);
}

mkdirSync(DIST, { recursive: true });

const files = [['index.html', R.renderIndex(project)]];
for (const lang of languages) {
  for (const device of devices) {
    files.push([R.guideFileName(device.id, lang.code), R.renderGuide(device, lang, project)]);
  }
}

for (const [name, html] of files) {
  writeFileSync(join(DIST, name), html, 'utf8');
  console.log(`  ${name}  ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB`);
}
copyFileSync(join(ROOT, 'manual-project.json'), join(DIST, 'manual-project.json'));
/* 링크 공유 미리보기 이미지 (카카오톡·슬랙 등에서 보이는 썸네일) */
const og = join(ROOT, 'og-image.png');
if (existsSync(og)) copyFileSync(og, join(DIST, 'og-image.png'));

console.log(`\n공개 사이트: ${files.length}개 페이지 → dist/`);
console.log(`  언어 ${languages.length}개 (${languages.map((l) => l.code).join(', ')})` +
            ` × 기기 ${devices.length}개 (${devices.map((d) => d.id).join(', ')})`);

/* ------------------------------------------------------------------ *
 *  관리자 페이지는 별도 폴더로. 폴더는 admin.html 유무와 상관없이 만든다.
 * ------------------------------------------------------------------ */
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
  console.log('관리자 사이트: admin.html 이 없어 안내 페이지를 넣었습니다');
}
