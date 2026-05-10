// Wanted UI kit — minimal cosmetic recreation of the Wanted job-marketplace web product.
// All visuals derived from colors_and_type.css. Components are intentionally small and reusable.

const { useState } = React;

// ───────────────────────── Icons (inline 24×24, 1.5 stroke — Wanted Icon/Normal feel) ────────────
const I = {
  search: (p) => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>),
  bell:   (p) => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 19a2 2 0 0 0 4 0"/></svg>),
  bookmark:(p) => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 4h12v17l-6-4-6 4Z"/></svg>),
  bookmarkFill:(p) => (<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...p}><path d="M6 4h12v17l-6-4-6 4Z"/></svg>),
  heart:  (p) => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10Z"/></svg>),
  briefcase:(p)=>(<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>),
  compass:(p) => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><path d="m15 9-2 5-5 2 2-5 5-2Z"/></svg>),
  users:  (p) => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15 20a4 4 0 0 1 6.5-3"/></svg>),
  user:   (p) => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="9" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>),
  pin:    (p) => (<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 21s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>),
  star:   (p) => (<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" {...p}><path d="m12 2 2.9 6.3 6.7.6-5 4.6 1.5 6.6L12 16.7 5.9 20l1.5-6.6-5-4.6 6.7-.6Z"/></svg>),
  chev:   (p) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m9 6 6 6-6 6"/></svg>),
  check:  (p) => (<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m5 12 4 4 10-10"/></svg>),
  filter: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 5h18M6 12h12M10 19h4"/></svg>),
};

// ───────────────────────── Atoms ────────────────────────────────────────────────────────────────
function Logo({ inverted }) {
  return (
    <a href="#" className="wnt-logo" style={{ filter: inverted ? "brightness(0) invert(1)" : "none" }}>
      <img src="../../assets/logo/wanted-logotype.svg" alt="Wanted" />
    </a>
  );
}

function Button({ kind = "primary", size = "m", icon, children, onClick, disabled }) {
  return (
    <button className={`wnt-btn wnt-btn-${kind} wnt-btn-${size}`} onClick={onClick} disabled={disabled}>
      {icon}{children}
    </button>
  );
}

function Chip({ active, children, onClick }) {
  return (
    <button className={`wnt-chip ${active ? "is-active" : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}

function Badge({ tone = "soft", children }) {
  return <span className={`wnt-badge wnt-badge-${tone}`}>{children}</span>;
}

function Avatar({ name, color = "var(--color-blue-600)" }) {
  const initial = (name || "·").trim()[0];
  return <div className="wnt-avatar" style={{ background: color }}>{initial}</div>;
}

// ───────────────────────── Header ───────────────────────────────────────────────────────────────
function Header({ tab, onTab, onProfile, applied }) {
  const tabs = [
    { id: "home", label: "홈" },
    { id: "jobs", label: "채용" },
    { id: "career", label: "커리어" },
    { id: "social", label: "소셜" },
    { id: "ai", label: "AI 매칭" },
  ];
  return (
    <header className="wnt-header">
      <div className="wnt-header-inner">
        <Logo />
        <nav className="wnt-nav">
          {tabs.map((t) => (
            <button key={t.id} className={`wnt-nav-item ${tab === t.id ? "is-active" : ""}`} onClick={() => onTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="wnt-header-actions">
          <button className="wnt-icon-btn"><I.search /></button>
          <button className="wnt-icon-btn"><I.bell /></button>
          <button className="wnt-icon-btn" onClick={onProfile}>
            <I.user />
            {applied > 0 && <span className="wnt-icon-dot">{applied}</span>}
          </button>
          <Button kind="secondary" size="s">기업 서비스</Button>
        </div>
      </div>
    </header>
  );
}

Object.assign(window, { I, Logo, Button, Chip, Badge, Avatar, Header });
