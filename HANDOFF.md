# BITMAN 디자인 시스템 작업 핸드오프

> 이 문서는 다른 Claude Code 세션에서 작업을 이어받기 위한 핸드오프 자료입니다.
> 작성일: 2026-05-10

---

## 1. 작업 목적

사용자(`choidy2199@gmail.com`, `toollab.studio`)는 **Claude Design** (claude.ai의 Anthropic Labs Research Preview)에서 만들어둔 디자인 시스템을 활용해:

1. 새로운 **앱/웹 디자인** 작업
2. **기존에 만들어둔 웹디자인**을 새 디자인 시스템으로 변경/마이그레이션

기존에 사용자가 가지고 있던 두 가지 — **툴랩디자인시스템(Toollab DS)** 과 **웹 UI** — 를 폐기하고, 이번에 인계된 디자인 시스템으로 대체할 계획입니다.

---

## 2. 인계된 디자인 시스템: Wanted Design System

Claude Design "클로드 코드에게 인계" 메뉴를 통해 다음 명령으로 인계됨:

```
Fetch this design file, read its readme, and implement the relevant aspects of the design.
https://api.anthropic.com/v1/design/h/NCtPhlv5yiy2RNy_VGKEHA
Implement: the designs in this project
```

URL은 gzip tar 아카이브를 반환. 압축 해제 후 `claude-design-import/wanted-design-system/`에 저장됨.

### 정체
- **Wanted Design System** (원티드 디자인 시스템)
- Wanted Lab(원티드랩)의 오픈소스 Figma 커뮤니티 파일을 재구성
- 라이선스: **CC BY 4.0**
- 출처: Figma 커뮤니티 파일 (25 pages, 36 frames, 1,310 components)

### 디자인 철학 (요약)
- **Flat, rigorously gridded, high-contrast** — 그라데이션/일러스트/글래스 효과 ❌
- 비주얼 에너지는 **타이포그래피 + 단일 saturated blue**에 집중
- **트라이링구얼 우선**: 한국어/영어/일본어가 한 줄에 자연스럽게 — Pretendard JP 기반
- 보이스: **한국어 폴라이트체** (-습니다/-합니다), 영어 Title Case 헤딩, **이모지 절대 금지**

### 디자인 토큰 핵심값
| 토큰 | 값 |
|---|---|
| Primary brand color | `#0066FF` (Blue 600) |
| Body text near-black | `#171719` (Neutral 940) |
| 브랜드 mid-gray | `#70737C` (Neutral 600) |
| Page background | `#F7F7F8` (Neutral 50) |
| Card border | `1px solid rgba(112,115,124,0.22)` |
| Card radius (desktop) | `24px` |
| Card radius (mobile) | `16px` |
| Default body | Body 1 / Normal — 16px / 24px / `+0.0057em` / Medium |
| Spacing tokens | 4px steps, 주로 `8/12/16/24/32/48/64` |
| Standard transition | `120ms cubic-bezier(0.16, 1, 0.3, 1)` |
| Focus | 2px outline Blue 500, `outline-offset: 2px` |
| Disabled opacity | `0.43` |
| Icons | Lucide 24×24 outline (1.5pt/2pt 두께) |

---

## 3. 현재 레포 상태

### 위치
- 로컬: `/home/user/BITMAN`
- 원격: GitHub `choidy2199/bitman`
- 작업 브랜치: **`claude/design-system-development-660zN`**

### 디렉토리 구조 (현재)
```
/home/user/BITMAN/
├── .gitattributes
├── HANDOFF.md                            ← 이 파일
└── claude-design-import/
    └── wanted-design-system/
        ├── README.md                     ← 15KB, 디자인 철학/원칙 상세
        ├── chats/chat1.md                ← Claude Design에서의 작업 대화 로그
        └── project/
            ├── README.md                 ← project-level 문서
            ├── SKILL.md                  ← Claude agent skill manifest
            ├── colors_and_type.css       ← 418줄, 모든 토큰 (color/type/spacing/radius/shadow/motion)
            ├── fonts/
            │   ├── fonts.css
            │   └── Pretendard-{Black,Bold,ExtraBold,ExtraLight,Light,Medium,Regular,SemiBold}.otf
            ├── assets/logo/
            │   ├── wanted-logotype.svg
            │   └── wanted-symbol.svg
            ├── preview/                  ← 17개 HTML, 토큰별 시각 레퍼런스
            │   ├── _card.css
            │   ├── brand-logo.html
            │   ├── color-{accent,brand,neutral,semantic-light,status}.html
            │   ├── components-{buttons-primary,buttons-secondary,cards,chips,fields}.html
            │   ├── elevation.html, radius.html, spacing.html
            │   └── type-{body,display,pretendard}.html
            └── ui_kits/wanted/           ← Wanted 잡 마켓플레이스 재현 UI 키트
                ├── README.md
                ├── index.html            ← 58줄
                ├── components.jsx        ← 92줄
                ├── screens.jsx           ← 251줄
                └── styles.css            ← 377줄
```

### Git 히스토리
```
073698f Import Wanted Design System handed off from Claude Design
46c95e0 Initial commit
```

### ⚠️ 발견사항
**기존 툴랩디자인시스템 / 웹 UI 코드는 이 BITMAN 레포에 존재하지 않습니다.**
- `git log`에 `46c95e0 Initial commit` 1개만 있었고 `.gitattributes`만 포함되어 있었음
- 사용자도 "기존에 있는데, 비트맨에 없나보다"라고 확인함
- 즉, 그 두 가지는 다른 곳(다른 레포? Claude Design 내 별도 프로젝트? Figma?)에 있고, 위치 확인이 필요함

---

## 4. 사용자에게 받아야 할 답변 (미해결 질문)

다음 메시지에서 사용자가 아직 답변하지 않은 항목입니다:

1. **진행 Plan 선택**
   - **Plan A** — 디자인 시스템 + 데모 페이지만 (가벼움)
     - `claude-design-import/` → `/design-system/`으로 재배치
     - 루트 `index.html` (시스템 소개 + preview 링크)
     - `README.md` 작성
   - **Plan B** — A + 풀스택 셋업 (React/Next.js 또는 Vite, 토큰→Tailwind config)
   - **Plan C** — A + 사용자의 실제 앱/웹 화면 구현 시작
2. 만들 **앱/웹의 성격** (채용? 도구? 대시보드? 다른 도메인?)
3. **기술 스택 선호** (HTML+CSS / React+Vite / Next.js / 기타)
4. **"기존 웹디자인"의 위치** — 다른 레포? Figma? Claude Design 내 다른 프로젝트?

---

## 5. 다음 세션에서 즉시 할 수 있는 일

### 옵션 ① 사용자에게 Plan을 다시 물어 진행

### 옵션 ② 사용자가 Plan을 정하지 않아도 안전하게 진행 가능한 작업
어떤 Plan을 택해도 필요한 베이스 작업:

1. **재배치**: `claude-design-import/wanted-design-system/project/*` → `/design-system/*`
2. **루트 README.md 작성** (BITMAN 프로젝트 소개 + Wanted DS 채택 안내)
3. **루트 `index.html` 또는 `preview/index.html`** — 모든 preview HTML로 가는 인덱스 페이지
4. **`.gitignore` 추가** (node_modules 등 표준 항목)

### 옵션 ③ Plan B를 진행할 경우
- `package.json` 초기화
- Vite + React + TypeScript 셋업 권장 (Next.js보다 가벼움; 정적 호스팅 친화)
- `tailwind.config.js`에 `colors_and_type.css` 토큰을 매핑 (CSS 변수 그대로 사용 가능)
- 폰트는 self-host (이미 `fonts/` 안에 .otf 파일 있음 — `.woff2` 변환 권장)
- `ui_kits/wanted/components.jsx` 와 `screens.jsx`를 React 컴포넌트로 정제

### 옵션 ④ Plan C — 화면을 만들 때
디자인 시스템 사용 규칙 (이 레포 README/SKILL에 명시된 핵심):
- `colors_and_type.css` 임포트 후 **CSS 변수 사용** (`var(--color-blue-600)`)
- 시맨틱 토큰 우선, 아토믹은 시스템 밖 스타일링 때만
- Pretendard JP만 사용 (영문/일문도 동일 폰트)
- 카드/버튼/입력 컴포넌트는 `ui_kits/wanted/components.jsx` 참고
- 이모지/이모티콘/유니코드 딩벳 사용 금지 — 아이콘은 **Lucide** 사용
- 한국어 카피는 `-습니다/-합니다` 폴라이트체 유지

---

## 6. 환경 / MCP 서버 메모

이 세션에서 연결되어 있던 MCP 서버 (다음 세션에서도 사용 가능):

- **GitHub MCP** (`mcp__github__*`) — repo scope: `choidy2199/bitman`
- **Figma MCP** (`mcp__d189cd85-...`) — Figma 디자인 읽기/연동
- **Supabase MCP** (`mcp__ff8f4839-...`) — DB / Edge Function
- **Canva MCP** (`mcp__042093de-...`)
- **Vercel MCP** (`mcp__53660e39-...`)
- **Gmail / Calendar / Notion / Google Drive MCP**

만약 사용자가 "기존 웹디자인"을 Figma 등에서 가져오라고 하면 위 MCP 활용.

---

## 7. 사용자 컨텍스트

- 한국어로 소통
- Anthropic Labs Research Preview의 Claude Design을 적극적으로 사용 중
- Claude Design에 다음 디자인 시스템들을 만들어둠:
  - Montage (Wanted WDS) Design System
  - Wanted Design System ← **이번에 인계받은 것**
  - Material 3 Design System
  - iOS 26 Design System
  - Daehan Tool / daehan-platform Design System
- 본인 조직: `choidy2199@gmail.com's Organization`, `toollab.studio`

---

## 8. 권장 첫 메시지 (다음 세션에서 사용자에게)

> 안녕하세요, 이전 세션에서 인계받은 Wanted Design System 작업을 이어받았어요. `HANDOFF.md`를 읽었고 현재 상태를 파악했습니다.
>
> 진행을 위해 아직 정해지지 않은 다음 항목을 확인해주세요:
>
> 1. Plan A(디자인 시스템만) / B(풀스택 셋업) / C(실제 화면 구현) 중 어느 쪽?
> 2. 만들 앱/웹의 성격은?
> 3. 기술 스택 선호는?
> 4. 기존 웹디자인은 어디 있나요? (대체 대상)
