# Wanted UI kit

A cosmetic, hi-fi recreation of the **Wanted** job-marketplace web product, built against the design tokens in `colors_and_type.css`.

This kit is **not** a production component port — it's a faithful visual + interaction recreation of the marketplace experience.

## Files

- `index.html` — Click-thru prototype: header → home feed → job detail → apply → applied drawer.
- `components.jsx` — Atoms (`Logo`, `Button`, `Chip`, `Badge`, `Avatar`, `I` icon set, `Header`).
- `screens.jsx` — Screens (`HomeFeed`, `JobCard`, `JobDetail`, `AppliedDrawer`) + `JOBS` data.
- `styles.css` — Visual layer (imports `/colors_and_type.css`).

## What works

- Browse 6 sample jobs, filter by role chip
- Save (bookmark) any job
- Open a detail sheet, apply to a job (toast confirms)
- Profile button opens an "Applied" drawer showing all applied jobs

## Caveats / known shortcuts

- Icons are inline 24×24 outline SVGs in the spirit of the Wanted **Icon/Normal** set, **not** the production icons.
- Company logos are large initials on a brand-tinted cover (Wanted's real cards use uploaded photography).
- Job copy is plausible but synthetic.
- This is **not** the real Wanted home page — it's the **shape** of one, faithfully styled.

## To upgrade

- Drop the real Wanted icon SVG sprite into `assets/icons/`, then swap `I.*` to read from it.
- Replace `JOBS` cover initials with company logo URLs.
