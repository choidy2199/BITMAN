# Wanted Design System

A design-system folder reconstructed from the open-source **Wanted Design System** (원티드 디자인 시스템) Figma community file by Wanted Lab (원티드랩). The original library is published under **CC BY 4.0**.

This folder contains everything an agent needs to design new screens, slides, and prototypes for any of the **Wanted** family of products (Wanted, Wanted Gigs, Wanted Space, Wanted Agent, Wanted OneID, LaaS) without flipping back to the source Figma.

---

## Brand & product context

**Wanted Lab** is a Korean career-and-recruiting company. Their flagship is **Wanted (원티드)** — a job-matching platform popular across Korea, Japan, and APAC. The Wanted ecosystem has expanded into a **family of products** that share a single visual system:

| Product | What it is |
|---|---|
| **Wanted** | Core job-matching marketplace + career content (web + mobile) |
| **Wanted Gigs** | Freelance / project-based work marketplace |
| **Wanted Space** | Coworking / office space brand |
| **Wanted Agent** | AI-powered career-matching assistant |
| **Wanted OneID** | Unified identity / single sign-on across the family |
| **LaaS** | Wanted's HR/recruiting B2B platform (Recruiting-as-a-Service) |

The design system is **trilingual-first** — every typographic decision is built around supporting **Korean (Hangul)**, **English (Latin)**, and **Japanese (CJK)** in the same line of text without breaking rhythm. This is why the entire system rides on **Pretendard JP**.

The library is meant to be cross-product. A surface in Wanted Gigs uses the same buttons, the same Body/Title scale, the same blue, as Wanted Space. Differentiation between products lives almost entirely in the wordmark.

---

## Sources

- **Figma file (mounted):** *Wanted Design System (Community).fig* — 25 pages, 36 frames, 1,310 components.
  - Public Figma community URL not provided in this attachment; ask the user if you need to re-link it.
  - Key pages explored: `/Color---Atomic`, `/Color---Semantic`, `/Typography`, `/Logo`, `/Icon`, `/Theme`, `/Spacing`, `/3-Component/*`, `/Overview`.
- **Codebase:** none provided. Component recreations in `ui_kits/` are reconstructed from Figma JSX pseudocode + screenshots, not from production source. If you have access to the Wanted code, please attach it for higher fidelity.

---

## Index

| Path | What's there |
|---|---|
| `README.md` | This file. |
| `SKILL.md` | Agent-skill manifest (cross-compatible with Claude Code skills). |
| `colors_and_type.css` | Atomic + semantic CSS variables for color and type. Import into any HTML you build. |
| `fonts/` | Self-hosted Pretendard JP & Wanted Sans (+ `fonts.css`). |
| `assets/logo/` | All product wordmarks + symbol (SVG). |
| `assets/illustrations/` | Generic placeholder imagery (none copied — Figma only had photo placeholders). |
| `preview/` | Per-token cards rendered into the Design System tab. |
| `ui_kits/wanted/` | Pixel-feel recreation of the core Wanted job-marketplace web product. |
| `ui_kits/wanted-mobile/` | Mobile screen recreations (iOS frame). |

> Slides: no slide template was attached, so the `slides/` folder is intentionally absent.

---

## CONTENT FUNDAMENTALS

The Wanted voice in this library is **Korean-first, calmly informational, and faintly formal** — never marketing-shouty, never overly playful. Translations into English keep the same temperature.

**Person & address.** Korean copy uses the polite `–습니다 / –합니다` register throughout — "안내합니다" (we'll guide you), "사용합니다" (we use), "지원합니다" (we support). It addresses the reader through implication ("the team") rather than direct "you / 당신". English copy mirrors this — uses **first-person plural** ("We believe…", "we use Pretendard JP as our default") and a soft imperative ("Install the fonts… below to enable text editing").

**Casing.** English headings are **Title Case** ("Looking Forward", "Before Use", "Table of Contents", "In conclusion"). Body copy is sentence case. Korean has no casing equivalent — section headers just sit a bit larger and bolder.

**Tone examples (lifted from the Overview section):**

> *"색상이 특정 의미나 기능을 전달하도록 설정된 시스템을 의미합니다. 컬러는 자주 쓰이는 상황에 효율적으로 사용 가능한 시멘틱과, 다양한 상황에 대응할 수 있는 팔레트로 나뉩니다."*
> "A system where color carries specific meaning or function. Colors are split into Semantics — efficient for common situations — and a Palette that adapts to many."

> *"오픈 소스는 우리가 일하는 환경을 더욱 풍요롭고 생산적으로 만들어주는 핵심이라고 믿습니다."*
> "We believe open source is essential to making the way we work richer and more productive."

> *"새로운 개선 의견은 언제나 환영합니다. 궁금하신 사항이나 해결이 필요하다면 댓글로 자유롭게 의견을 남겨주세요."*
> "We always welcome suggestions for improvement — leave a comment freely."

**Vocabulary patterns.**
- Section openers describe **what something is**, then **what it's split into / how it's organized**, in two short sentences. Definition before instruction.
- Words like *원칙* (principles), *규칙* (rules), *위계* (hierarchy), *목차* (table of contents), *대표 예시* (representative example), *상세 예시* (detailed example), *이렇게 써요 / 이렇게 쓰지 않아요* (do / don't) appear repeatedly — this is the canonical structure of every doc page.
- Numbers come with explicit units in copy ("**7단계 위계에서 총 18개 하위 위계**" — 7 tiers, 18 sub-tiers).

**Emoji.** None. The system does not use emoji — not in headers, not in labels, not as bullet markers. If a leading visual is needed, it's an icon from the icon library or a small colored chip.

**Punctuation & micro-rules.**
- Korean copy uses standard `.` and `,` (not `。`/`、`).
- Mixed Korean/English/Japanese in the same sentence is normal and intended; the type system is built to make this read smoothly.
- Bulleted lists usually have **no bullet character** — just a soft line break and tight `gap`.
- Dates render as `YYYY. M. D.` ("2025. 11. 6.").

**The vibe in one line:** *a quiet textbook written by a careful product team — confident, neutral, organized.*

---

## VISUAL FOUNDATIONS

**Foundational stance.** The Wanted system is **flat, rigorously gridded, and high-contrast**, with the visual energy concentrated in **typography and a single saturated blue**. It is not gradient-driven, not illustration-driven, not glass/blur-driven. Surfaces are nearly always white or near-white with subtle low-alpha black borders (`rgba(112,115,124,0.22)`).

### Color

- **Atomic palette:** 12 hue ramps × 11–14 stops + a 14-step alpha scale and a 22-step neutral. Hues are Common (B/W), Neutral, **Blue (primary)**, Red, Green, Orange, RedOrange, Lime, Cyan, SkyBlue, Violet, Magenta, Pink. Stops are spaced for **APCA-style legibility** rather than HSL evenness.
- **Primary brand color is `#0066FF` (Blue 500)** — used for primary CTAs, links, and any "the answer is here" moment. It's bright but not neon; pairs with pure black text.
- **Neutrals are warm-cool blue-gray** (e.g. `#70737C`, `#46474C`, `#171719`) rather than pure gray. This is critical to the brand feel — never substitute `#000`/`#888`/`#fff` for neutrals.
- **Semantic tokens** (Light + Dark themes) are layered on top of atoms: `text-primary / text-neutral / text-neutral-subtle`, `fill-neutral-subtle / fill-neutral-subtler`, `stroke-neutral / stroke-neutral-subtle`, etc. Always reach for the semantic var first; only drop down to an atomic stop when you're styling something genuinely outside the system.
- **Imagery** is warm and color-true (slight orange/yellow cast in Wanted's marketing photography), never desaturated or grain-filtered.

### Type

- **Pretendard JP** is the **only** body & UI font. Korean / English / Japanese coexist in one line; Pretendard JP's metrics are tuned for that.
- **Wanted Sans** is the display/identity face — used at very large sizes for marketing or headline moments, and inside the wordmark itself. Use sparingly.
- The scale is **7 tiers × 18 sub-styles**: Display 2/3, Title 1/2/3, Heading 1/2, Headline 1/2, Body 1 / 2 (each in *Normal* and *Reading* line-heights), Label 1 / 2 (also Normal/Reading), Caption 1/2.
- Negative letter-spacing increases with size (Display 2 is `-0.0282em`, Caption 2 is `+0.0311em`). Don't override.
- Default UI body is **Body 1 / Normal — 16px / 24px / `+0.0057em`** Medium weight.
- Default font weight pattern: **Medium for body / Semibold for emphasis / Bold for titles & display**. Regular is rare. Italic is essentially never used.

### Spacing & layout

- Spacing tokens go in **4-px steps from 4 → 64 → 128**. Most layouts only use `8 / 12 / 16 / 24 / 32 / 48 / 64`.
- **Cards** are `border-radius: 24` or `32` with a 1px `rgba(112,115,124,0.22)` stroke and an inner padding of `48px` or `64px` on desktop. No drop shadows by default.
- Larger surfaces (whole pages, theme containers) use `border-radius: 60` or `64` and a tinted `rgba(112,115,124,0.08)` background to set them off from white.
- Dividers are 1px or 2px rules in `rgba(112,115,124,0.22)` for hairlines or **solid black** at 2–4px for strong section breaks.
- Grid: 8-pt baseline. Desktop content max-width sits around **1280px** in this Figma; the chrome around it lives at 1536px.

### Backgrounds, imagery, decoration

- Backgrounds are **solid color** — `#FFFFFF` for cards, `#F7F7F8` (Neutral 50) for the page when stepping behind a card, `rgba(112,115,124,0.08)` for tinted theme containers. **No gradients in chrome.**
- Photo placeholders in the source are **full-bleed, warm-toned, color photography** — usually people in workspaces. Where you need a placeholder, use a flat neutral fill, not generated imagery.
- No noise, no grain, no patterns, no textures behind type. The exception is the *Decorate* page, where decorative chips and badges are used inside marketing layouts.

### Animation

- Animations are **short, ease-out, and almost imperceptible** — used only to acknowledge interaction. Standard transition: `120ms cubic-bezier(0.16, 1, 0.3, 1)` on color/opacity.
- No bounces, no spring physics, no slide-up modal flourishes longer than 220ms.
- Page-level animations are absent; the system trusts the layout to do the work.

### States

- **Hover (web):** background fill shifts to `rgba(112,115,124,0.08)` for ghost/icon buttons; primary buttons darken to Blue 600 (`#005EEB`); text-only links get an `underline-offset: 4px` underline.
- **Press / active:** primary buttons darken further to Blue 700 (`#0054D1`); cards do **not** scale or shrink — they tint slightly darker. No transform-based press states.
- **Focus:** 2px outer outline in Blue 500 with `outline-offset: 2px`. Never a glowing box-shadow.
- **Disabled:** opacity 0.43 (`color-text-neutral-disabled` token) on text + `cursor: not-allowed`. Buttons drop to `rgba(112,115,124,0.08)` fill.

### Borders, shadows, transparency

- Borders almost always `1px solid rgba(112,115,124,0.22)`. Heavier rules go to **2px** or **4px** in solid black for top-of-page dividers.
- **Shadows are reserved.** Default cards have **no shadow**. When elevation is needed (popovers, toasts, modals), the system uses three stacked shadows of the form `0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(23,23,23,0.07), 0 12px 32px rgba(23,23,23,0.06)`. Never a single big blurry shadow.
- Transparency / blur is used **only** for sticky headers (a 92%-white backdrop with `backdrop-filter: blur(12px)`) and for sheet scrims (`rgba(0,0,0,0.43)`). Frosted glass is not a brand motif.
- "Protection gradients" (the soft fade-to-dark behind text on a hero photo) appear in marketing only, never in app chrome. When used, they go top-down, `rgba(0,0,0,0)` → `rgba(0,0,0,0.43)`.

### Corner radii

- `4` (chips, tiny tags) · `8` (inputs, small buttons) · `12` (medium buttons, list rows) · `16` (default cards on mobile) · `24` (default cards on desktop) · `32` (large feature cards) · `60–64` (page-level containers) · `9999` / `50%` (avatars, pill buttons, dots).

### Cards

- Default card: `background: #FFFFFF`, `border: 1px solid rgba(112,115,124,0.22)`, `border-radius: 24`, `padding: 48` desktop / `24` mobile, **no shadow**.
- Theme/feature card: `background: rgba(112,115,124,0.08)`, `border-radius: 60`, padding `128`. Used as page-section wrappers.
- Always `flex-direction: column; gap: <token>;` for content; **never** rely on `<br>` for spacing.

### Icons

- Single-color stroke icons drawn on a 24×24 grid. Two thicknesses (`Thick=False` ≈ 1.5pt, `Thick=True` ≈ 2pt). Typical naming: `Icon/Normal/{name}` (interface), `Icon/Color/{name}` (brand-color icons like Apple/Google/Facebook for OAuth), `Icon/Navigation/{name}` (the bottom-nav set).

---

## ICONOGRAPHY

The Figma library defines its own outline icon set named **Icon/Normal**, **Icon/Color**, **Icon/Navigation**. We were unable to extract the underlying SVG geometry cleanly from the binary (the Figma library marks them as Symbol nodes without inline `<svg>` paths in the pseudo-JSX). To keep prototypes pixel-honest:

- **Substitution:** we use **[Lucide](https://lucide.dev)** as the icon family in the UI kits — same 24×24 grid, same outline-only stance, same ~1.5pt stroke. Loaded from CDN (`https://unpkg.com/lucide@latest`).
- **Naming map (Wanted → Lucide):**
  - `chevron-right-tight-small` → `chevron-right`
  - `circle / circle-dot / circle-fill` → `circle`, `dot`, `circle-check`
  - `square-check / square` → `square-check`, `square`
  - `check / check-thick` → `check`
  - `close / close-thick` → `x`
  - `Navigation/Recruit` → `briefcase`
  - `Navigation/Career` → `compass`
  - `Navigation/Social` → `users`
  - `Navigation/My Page` → `user-round`
  - `Navigation/Menu` → `menu`
- **Color OAuth icons** (Apple / Google / Facebook): use brand-correct logo SVGs from the official sources, not Lucide.
- **Emoji:** never. **Unicode dingbats:** never. The system is icon-only.

⚠ **Substitution flag for the user:** if you have access to the production Wanted icon SVG sprite or Iconify `wanted-*` set, please attach it — we'll swap Lucide out for the real set.

---

## Caveats & substitutions

- **Fonts.** Pretendard JP and Wanted Sans are loaded from the open-source CDNs (jsDelivr / Wanted's own GitHub release). If you have licensed `.woff2` files, drop them into `fonts/` and update `fonts.css`.
- **Icons.** Substituted with Lucide (see above).
- **Photography / illustrations.** None copied — the source library only contained photo placeholders and a single decorative noise image.
- **Production codebase.** Not provided. UI kit is a high-fidelity *cosmetic* recreation, not a production component port.
