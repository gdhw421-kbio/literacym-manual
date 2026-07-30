/* 리터러시M 매뉴얼 사이트 빌드 스크립트
 *
 *  manual-project.json 하나만 고치면 아래 파일들을 dist/ 에 새로 만듭니다.
 *    dist/index.html
 *    dist/literacym-guide-*.html
 *    dist/manual-project.json   (관리자 페이지가 읽어가는 사본)
 *
 *  Netlify 설정
 *    Build command      : node build.mjs
 *    Publish directory  : dist
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, 'dist');
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

/* optional: ship the editor too, if you chose to host it */
const admin = join(ROOT, 'admin.html');
if (existsSync(admin)) {
  copyFileSync(admin, join(DIST, 'admin.html'));
  console.log('  admin.html');
}

console.log(`\n완료: ${files.length}개 페이지를 dist/ 에 만들었습니다.`);
