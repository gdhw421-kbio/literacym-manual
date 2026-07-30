# 리터러시M 사용자 매뉴얼 저장소

환자용 앱 리터러시M의 설치·가입 안내 매뉴얼 사이트다.
사용자는 개발자가 아니다. 한국어로 대화하고, 코드 설명은 요청받을 때만 한다.

## 핵심 구조 — 한국어 원본 하나, 언어는 파생

텍스트는 **기기별 한국어 원본에 한 번만** 존재한다. 언어를 추가하면 그 원본에서
문서가 파생된다. 같은 문장을 언어마다 따로 관리하지 않는다.

manual-project.json
├─ site        브랜드·사업명·푸터 (관리자 화면에 노출하지 않음)
├─ languages[] 언어 정의. 여기에 항목을 추가하면 문서가 자동으로 늘어난다
│   └─ { code, label, labelKo, isSource?, ui{ title, audience, contents,
│         stepWord, btnPrint, pickDevice, back, homeLink, btnKoOff, btnKoOn } }
└─ devices[]   기기별 한국어 원본
    └─ { id, name, nameKo, steps[] }
        └─ steps[]
           ├─ titleKo    제목 (한국어 원본)
           ├─ sectionKo  섹션 구분선 문구. 빈 문자열이면 없음
           ├─ items[]    { ko, type: "dot" | "star" | "check" }
           ├─ images{}   언어코드별 스크린샷 dataURL  예: images.ko, images.mn
           └─ t{}        언어코드별 번역
                         { title, section, items[{text}] }

문서 파일명은 `literacym-guide-<기기id>-<언어code>.html` 로 자동 생성된다.

## 절대 규칙

1. **HTML을 직접 수정하지 않는다.** `index.html` 과 `literacym-guide-*.html` 은
   전부 자동 생성물이다. 고칠 곳은 `manual-project.json` 하나뿐이다.
2. **`manual-project.json` 전체를 읽거나 출력하지 않는다.** 스크린샷이 base64로
   들어 있어 크다. Python/Node 스크립트로 필요한 부분만 읽고 고친다.
   예: `python3 -c "import json;d=json.load(open('manual-project.json'));print(d['devices'][0]['steps'][4]['items'])"`
3. **`images` 필드는 절대 건드리지 않는다.** 이미지 교체는 관리자 페이지의 일이다.
4. **수정 후 반드시 `node build.mjs` 를 실행**해 성공을 확인한 뒤 커밋한다.
5. **번역(`t`)을 만들어냈으면 원어민 검수가 필요하다고 반드시 알린다.** 의료 안내문이다.
   특히 동의를 구하는 문장(병원 연동·건강정보 공유)은 오역이 실제 문제가 된다.

## 언어를 추가하는 방법

1. `languages[]` 에 `{ code, label, labelKo, ui{...} }` 를 추가한다
2. 각 `steps[].t[code]` 에 번역을 넣는다. 없으면 한국어가 그대로 표시되므로
   페이지가 깨지지는 않는다 — 번역을 나눠서 채워도 된다
3. 스크린샷은 관리자 페이지에서 언어별로 업로드한다 (`images[code]`)
4. `node build.mjs` → 문서가 자동으로 늘어난다

`languages` 에 `isSource: true` 는 한국어에만 둔다. 원본 언어는 보조 줄(한국어 대역)과
한국어 토글 버튼 없이 단일 언어로 렌더링된다.

## 작업할 때 확인할 것

- 어느 기기인지 불명확하면 **먼저 물어본다.** 안드로이드와 아이폰은 단계 수가 다르다
  (현재 12 / 13). 아이폰에만 있는 "설치 완료 → 앱 열기 & 접근 권한 동의" 단계가 그 차이다.
- **한 페이지의 items 는 5개까지가 안전하다.** 인쇄가 16:9 슬라이드(338×190mm)이고
  스크린샷이 세로 120mm를 차지한다. 6개 이상이면 넘칠 수 있으니 경고하고 분리를 제안한다.
- 페이지를 추가·삭제·이동한 뒤에는 **본문의 단계 번호 상호참조를 점검한다.**
  예: 로그인 페이지에 "3단계에서 적어둔 이메일" 같은 문구가 있다.
- 항목을 추가·삭제·이동하면 `t[*].items` 의 순서도 함께 맞춘다.

## 마무리 절차

1. `node build.mjs` 실행 → 파일 생성 확인
2. 무엇을 바꿨는지 **한국어로 3줄 이내 요약**
3. 커밋 메시지는 한국어로 구체적으로
4. push 하면 Netlify가 1~2분 뒤 자동 배포한다는 것을 알린다

## 하지 말 것

- 요청하지 않은 문구·디자인 개선을 임의로 하지 않는다
- `render.js` `guide.css` 를 요청 없이 수정하지 않는다 (인쇄 레이아웃이 깨진다)
- 커밋·push 전에 무엇을 할지 알리고 확인받는다
