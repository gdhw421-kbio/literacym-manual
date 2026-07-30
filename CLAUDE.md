# 리터러시M 사용자 매뉴얼 저장소

이 저장소는 환자용 앱 리터러시M의 설치·가입 안내 매뉴얼 사이트다.
기기(안드로이드/아이폰) × 언어(영어/몽골어) 4종을 만든다.
사용자는 개발자가 아니다. 한국어로 대화하고, 코드 설명은 요청받을 때만 한다.

## 절대 규칙

1. **HTML 파일을 직접 수정하지 않는다.** `index.html` 과 `literacym-guide-*.html` 은
   모두 자동 생성물이다. 내용을 바꿀 곳은 `manual-project.json` 하나뿐이다.
2. **`manual-project.json` 전체를 읽거나 출력하지 않는다.** 1.8MB이며 스크린샷이
   base64로 들어 있다. 반드시 Python/Node 스크립트로 부분만 읽고 부분만 고친다.
   예: `python3 -c "import json; d=json.load(open('manual-project.json')); print(d['docs'][0]['steps'][4]['items'])"`
3. **`image` 필드는 절대 건드리지 않는다.** 값을 그대로 보존한다.
   이미지 교체 요청은 관리자 페이지(`admin.html`)로 안내한다.
4. **수정 후 반드시 `node build.mjs` 를 실행**해 빌드가 성공하는지 확인한 뒤 커밋한다.
   빌드 없이 커밋하면 사이트에 반영되지 않는다.
5. **문구는 주언어와 한국어를 항상 함께 수정한다.** 한쪽만 고치면 대역이 깨진다.

## 파일 구조

manual-project.json   내용 원본 — 여기만 수정
build.mjs             빌드 스크립트 (node build.mjs → dist/ 생성)
render.js             HTML 생성 로직 (수정하지 말 것)
guide.css             가이드 스타일 + 16:9 인쇄 규칙
guide.js              가이드 동작 (한국어 토글·인쇄·이미지 확대)
index.css             첫 화면 스타일
admin.html            관리자 페이지 (이미지 교체 전용, 로컬 실행)
dist/                 빌드 결과 — 손대지 말 것, 커밋 대상도 아님

## 데이터 구조

manual-project.json
├─ brand   { wordmark, wordmarkKo, partners }
├─ common  { projectKo, footerKo, sectionBreakKo }   ← 4종 공통 한국어 문구
└─ docs[]  문서 4개
   ├─ id          "android-en" | "iphone-en" | "android-mn" | "iphone-mn"
   ├─ file        내보낼 파일명 (index.html이 이 이름으로 링크함 — 바꾸면 switchHtml도 함께 수정)
   ├─ lang        "en" | "mn"      langName 한국어 이름     langLabel 현지어 이름
   ├─ os, osTitle, osKo            기기 표기
   ├─ titleMain / titleKo          표지 제목
   ├─ audienceMain / audienceKo    대상 안내
   ├─ projectMain, footerMain, docTitle, docDesc, switchHtml
   ├─ ui { contents, stepWord, btnPrint, btnKoOff, btnKoOn }   ← 화면 문구, 문서 언어로
   └─ steps[]  페이지들 (배열 순서 = STEP 번호, 1부터)
      ├─ titleMain / titleKo      페이지 제목
      ├─ image                    스크린샷 dataURL — 건드리지 않음
      ├─ sectionBreak             섹션 구분선 문구. 빈 문자열이면 없음
      └─ items[]  설명 항목
         ├─ main   주언어 본문 (<b> <br> <a> 만 허용)
         ├─ ko     한국어 본문
         └─ type   "dot" 일반 · "star" ★강조 · "check" ✓체크

## 작업할 때 확인할 것

- 어느 문서인지 불명확하면 **먼저 물어본다.** "4종 전부"인지 "안드로이드 영어판만"인지에 따라 결과가 완전히 다르다.
- 페이지를 추가·삭제·이동한 뒤에는 **다른 페이지 본문의 상호참조를 점검한다.**
  예: 로그인 페이지 본문에 "STEP 3에서 적어둔 이메일" 같은 문구가 있다. 번호가 밀리면 함께 고친다.
- **한 페이지의 items 는 5개까지가 안전하다.** 인쇄가 16:9 슬라이드(338×190mm)이고
  스크린샷이 세로 120mm를 차지한다. 6개 이상이면 넘칠 수 있으니 경고하고 페이지 분리를 제안한다.
- 새 언어판을 만들 때는 기존 문서를 복제하고 `id` `file` `lang` `langName` `langLabel`
  `ui` `audienceMain` `switchHtml` 을 모두 새 언어에 맞게 바꾼다. `switchHtml` 의 링크가
  같은 언어의 다른 기기를 가리키게 해야 한다.
- 번역을 만들어냈으면 **원어민 검수가 필요하다고 반드시 알린다.** 의료 안내문이다.

## 마무리 절차

1. `node build.mjs` 실행 → 5개 파일 생성 확인
2. 무엇을 바꿨는지 **한국어로 3줄 이내 요약**
3. 커밋 메시지는 한국어로 구체적으로. 예: `안드로이드 영어판 STEP 5에 쿠폰번호 대소문자 주의 항목 추가`
4. push 하면 Netlify가 1~2분 뒤 자동 배포한다는 것을 알린다

## 하지 말 것

- 사용자가 요청하지 않은 문구·디자인 개선을 임의로 하지 않는다
- `render.js` `guide.css` 를 요청 없이 수정하지 않는다 (인쇄 레이아웃이 깨진다)
- 커밋·push 전에 반드시 무엇을 할지 알리고 확인받는다
