# 리터러시M 사용자 매뉴얼 사이트

환자용 앱 **리터러시M(LiteracyM)** 의 회원가입 · 앱 설치 · 로그인 안내 매뉴얼입니다.

> 2026년 「ICT기반 외국인환자 사전상담·사후관리 지원 사업」 (한국보건산업진흥원)
> KBIOHEALTHCARE · KYUNG HEE UNIVERSITY MEDICAL CENTER · MEDIJOY

현재 **한국어판 2종**(안드로이드 · 아이폰)을 제공합니다.
언어는 데이터 파일에 항목을 추가하면 문서가 자동으로 늘어납니다.

---

## 구조 — 한국어 원본 하나에서 파생

텍스트는 `manual-project.json` 의 **기기별 한국어 원본에 한 번만** 있습니다.
언어가 5개로 늘어도 관리자가 손댈 건 한국어 원본 2개뿐입니다.

```
한국어 원본 (안드로이드 · 아이폰)
        │
        ├─ 한국어판 ──▶ literacym-guide-android-ko.html / -iphone-ko.html
        └─ (언어 추가 시) ──▶ literacym-guide-android-xx.html …
```

스크린샷만 언어별로 따로 관리합니다. 각 언어로 표시된 앱 화면이 필요하기 때문입니다.

---

## 내용을 수정하는 방법

**HTML 파일을 직접 고치지 마세요.** 전부 자동 생성물입니다.

1. 관리자 페이지를 엽니다 (비공개 Netlify 사이트, 또는 로컬 `admin.html`)
2. 상단에서 **기기**와 **언어**를 고릅니다
3. 페이지 제목·설명 항목을 **한국어로** 편집하고, 스크린샷을 언어별로 올립니다
4. **`프로젝트 저장`** → `manual-project.json` 내려받기
5. 그 파일 하나만 이 저장소에 업로드하고 커밋 → Netlify가 자동 배포

관리자 페이지가 사이트에 올라가 있으면, 열 때마다 **게시된 최신 데이터를 자동으로
불러옵니다.** 오래된 파일로 덮어쓰는 사고가 나지 않습니다.

---

## 파일 구조

```
manual-project.json    내용 원본 — 모든 텍스트와 이미지의 유일한 출처
build.mjs              빌드 스크립트 (node build.mjs)
render.js              HTML 생성 로직 — 관리자 페이지와 동일한 코드
guide.css              가이드 스타일 + 16:9 인쇄 규칙
guide.js               가이드 동작 (인쇄, 이미지 확대, 한국어 토글)
index.css              첫 화면 스타일
admin.html             관리자 페이지 (공개 폴더로 나가지 않음)
CLAUDE.md              Claude 작업 지침
```

빌드 결과

```
dist/          공개 사이트 — index.html + 가이드 + manual-project.json
admin-dist/    관리자 사이트 — admin.html + manual-project.json
```

## Netlify 설정

| | 공개 사이트 | 관리자 사이트 |
|---|---|---|
| Build command | `node build.mjs` | `node build.mjs` |
| Publish directory | `dist` | `admin-dist` |
| 공개 설정 | **Public** | **Private** (본인만) |

`render.js` 는 관리자 페이지와 빌드 스크립트가 똑같이 사용합니다.
따라서 관리자 페이지에서 내보낸 파일과 Netlify가 생성한 파일은 바이트 단위로 동일합니다.

---

## 언어를 추가할 때

`manual-project.json` 의 `languages[]` 에 항목을 하나 넣으면 됩니다.

```json
{
  "code": "en",
  "label": "English",
  "labelKo": "영어",
  "ui": {
    "title": "Sign-up · App installation · Login guide",
    "audience": "For English-speaking users",
    "contents": "Contents", "stepWord": "Step", "btnPrint": "Print",
    "pickDevice": "Which phone do you use?", "back": "Back",
    "homeLink": "Choose a different phone",
    "btnKoOff": "한국어 숨기기 / Hide Korean",
    "btnKoOn": "한국어 보기 / Show Korean"
  }
}
```

그 다음 각 단계의 `t.en` 에 번역을 채웁니다. **번역이 없으면 한국어가 그대로
표시되므로 페이지가 깨지지 않습니다** — 나눠서 채워도 됩니다.

첫 화면도 언어가 2개 이상이 되면 `언어 선택 → 기기 선택` 2단계로 자동 전환됩니다.

번역은 의료 안내문이므로 **원어민 검수를 거치세요.** 특히 병원 연동·건강정보 공유처럼
동의를 구하는 문장은 오역이 실제 문제가 됩니다.

---

## 주의사항

- 관리자 페이지는 **자동 저장되지 않습니다.** 편집 후 반드시 `프로젝트 저장`을 누르세요.
- `manual-project.json` 이 사실상의 원본입니다. 항상 저장소에 최신본을 올려두세요.
- 한 페이지의 설명 항목은 **5개까지**가 인쇄(16:9)에 안전합니다.
- 인쇄 시 브라우저 대화상자에서 **배경 그래픽 켜기**, 배율 **100%** 로 두세요.
