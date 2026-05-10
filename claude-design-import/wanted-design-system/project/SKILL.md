---
name: wanted-design
description: Use this skill to generate well-branded interfaces and assets for Wanted (원티드, by Wanted Lab), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick start

- **Single root stylesheet:** `colors_and_type.css` exposes all atoms (colors, type scale, spacing, radii, shadows, motion) as CSS variables and registers semantic aliases. Import it.
- **Fonts:** `fonts/fonts.css` self-hosts Pretendard JP + Wanted Sans via jsDelivr.
- **Logos:** `assets/logo/` (`wanted-logotype.svg`, `wanted-symbol.svg`).
- **Visual reference:** `preview/*.html` shows every token in use; great for double-checking what a "Body 1" or "Blue 600" actually looks like.
- **UI kit:** `ui_kits/wanted/` is a click-thru recreation of the job marketplace; copy any component out as a starting point.
- **Voice & casing rules:** see CONTENT FUNDAMENTALS in README.md (polite Korean register, sentence-case English body, Title Case English headings, **no emoji**).
