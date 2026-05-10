// Wanted UI kit — screen-level components: HomeFeed, JobDetail, ApplyDialog, AppliedDrawer.

const { useState: useStateScreens, useMemo } = React;

// Cherry-picked job data (synthetic but plausible for the marketplace)
const JOBS = [
  {
    id: "j1",
    company: "토스",
    title: "Product Designer (Growth)",
    location: "서울 강남구",
    experience: "3년 이상",
    salary: "협의",
    tags: ["Figma", "Growth", "B2C"],
    accept: "92%",
    reward: "1,000,000원",
    cover: "var(--color-blue-600)",
    initial: "T",
    pinned: true,
  },
  {
    id: "j2",
    company: "당근",
    title: "프로덕트 디자이너 (마이비즈니스)",
    location: "서울 서초구",
    experience: "5년 이상",
    salary: "8,500만원~",
    tags: ["Local", "Mobile", "Design Ops"],
    accept: "78%",
    reward: "1,500,000원",
    cover: "var(--color-orange-600)",
    initial: "당",
  },
  {
    id: "j3",
    company: "네이버",
    title: "UX Researcher · Hyperclova",
    location: "성남 분당구",
    experience: "경력 무관",
    salary: "협의",
    tags: ["Research", "AI", "Mixed methods"],
    accept: "64%",
    reward: "500,000원",
    cover: "var(--color-green-600)",
    initial: "N",
  },
  {
    id: "j4",
    company: "쿠팡",
    title: "Senior UI Engineer",
    location: "서울 송파구",
    experience: "7년 이상",
    salary: "1억 1,000만원~",
    tags: ["React", "Web", "Logistics"],
    accept: "55%",
    reward: "2,000,000원",
    cover: "var(--color-redorange-600)",
    initial: "C",
  },
  {
    id: "j5",
    company: "카카오뱅크",
    title: "iOS Engineer",
    location: "서울 영등포구",
    experience: "3년 이상",
    salary: "9,000만원~",
    tags: ["Swift", "Fintech", "iOS"],
    accept: "71%",
    reward: "1,200,000원",
    cover: "var(--color-blue-700)",
    initial: "K",
  },
  {
    id: "j6",
    company: "라인",
    title: "Backend Engineer · Messaging",
    location: "도쿄 + 서울",
    experience: "5년 이상",
    salary: "협의",
    tags: ["Kotlin", "Distributed", "Trilingual"],
    accept: "60%",
    reward: "1,800,000원",
    cover: "var(--color-green-700)",
    initial: "L",
  },
];

const FILTERS = ["전체", "디자이너", "엔지니어", "PM", "마케터", "데이터", "사업개발"];

function JobCard({ job, onOpen, saved, onSave }) {
  return (
    <article className="wnt-job">
      <div className="wnt-job-cover" style={{ background: job.cover }} role="button" tabIndex={0} onClick={() => onOpen(job)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onOpen(job); }}>
        <span className="wnt-job-cover-initial">{job.initial}</span>
        <button className={`wnt-job-save ${saved ? "is-saved" : ""}`} onClick={(e) => { e.stopPropagation(); onSave(job); }} aria-label="Save">
          {saved ? <I.bookmarkFill /> : <I.bookmark />}
        </button>
      </div>
      <div className="wnt-job-body" onClick={() => onOpen(job)}>
        <div className="wnt-job-company">{job.company}</div>
        <h3 className="wnt-job-title">{job.title}</h3>
        <div className="wnt-job-meta"><I.pin /> <span>{job.location}</span><span className="dot">·</span><span>{job.experience}</span></div>
        <div className="wnt-job-foot">
          <span className="wnt-job-reward">합격보상금 {job.reward}</span>
          <span className="wnt-job-accept">합격률 {job.accept}</span>
        </div>
      </div>
    </article>
  );
}

function HomeFeed({ saved, onOpen, onSave }) {
  const [filter, setFilter] = useStateScreens("전체");
  const visible = useMemo(() => {
    if (filter === "전체") return JOBS;
    const map = { "디자이너": "Designer", "엔지니어": "Engineer", "PM": "Product", "데이터": "Researcher" };
    return JOBS.filter((j) => j.title.toLowerCase().includes((map[filter] || "").toLowerCase()) || filter === "전체");
  }, [filter]);
  return (
    <main className="wnt-home">
      <section className="wnt-hero">
        <div className="wnt-hero-eyebrow">매칭 — 11월 6일 기준</div>
        <h1 className="wnt-hero-title">새로운 기회를 찾아서.<br/><span className="wnt-hero-em">합격률이 높은 12곳</span>을 추렸어요.</h1>
        <div className="wnt-hero-search">
          <I.search />
          <input placeholder="회사, 직무, 기술 스택을 검색하세요" />
          <Button kind="primary" size="m">검색</Button>
        </div>
        <div className="wnt-hero-stats">
          <div><strong>4,213</strong><span>지금 채용 중</span></div>
          <div><strong>92%</strong><span>이번 주 평균 합격률</span></div>
          <div><strong>1.4억</strong><span>이번 달 보상금 누계</span></div>
        </div>
      </section>

      <section className="wnt-filters">
        <div className="wnt-filter-row">
          {FILTERS.map((f) => (
            <Chip key={f} active={f === filter} onClick={() => setFilter(f)}>{f}</Chip>
          ))}
        </div>
        <button className="wnt-filter-more"><I.filter /> 상세 필터</button>
      </section>

      <section className="wnt-grid">
        {visible.map((j) => (
          <JobCard key={j.id} job={j} onOpen={onOpen} saved={saved.has(j.id)} onSave={onSave} />
        ))}
      </section>
    </main>
  );
}

function JobDetail({ job, onClose, onApply, applied, saved, onSave }) {
  if (!job) return null;
  return (
    <div className="wnt-sheet" onClick={onClose}>
      <div className="wnt-sheet-card" onClick={(e) => e.stopPropagation()}>
        <header className="wnt-sheet-head">
          <div className="wnt-sheet-co" style={{ background: job.cover }}>{job.initial}</div>
          <div className="wnt-sheet-co-meta">
            <div className="wnt-sheet-co-name">{job.company} <I.star style={{ color: "var(--color-orange-600)" }}/></div>
            <h2 className="wnt-sheet-title">{job.title}</h2>
            <div className="wnt-sheet-meta">
              <span><I.pin /> {job.location}</span>
              <span className="dot">·</span>
              <span>{job.experience}</span>
              <span className="dot">·</span>
              <span>{job.salary}</span>
            </div>
          </div>
          <button className="wnt-icon-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
          </button>
        </header>

        <section className="wnt-sheet-stats">
          <div><span className="k">합격률</span><strong>{job.accept}</strong></div>
          <div><span className="k">합격보상금</span><strong>{job.reward}</strong></div>
          <div><span className="k">평균 검토 기간</span><strong>5일</strong></div>
        </section>

        <section className="wnt-sheet-body">
          <h3>주요 업무</h3>
          <ul>
            <li>제품팀과 함께 사용자 흐름과 인터페이스를 설계합니다.</li>
            <li>실험 가설을 세우고 데이터로 검증해 다음 라운드를 정의합니다.</li>
            <li>디자인 시스템을 운영하며 다른 디자이너와 엔지니어를 돕습니다.</li>
          </ul>
          <h3>자격 요건</h3>
          <ul>
            <li>{job.experience} 이상의 프로덕트 디자인 경력이 있는 분</li>
            <li>Figma 기반의 협업과 핸드오프에 익숙한 분</li>
            <li>한국어 + 영어 (또는 일본어) 의사소통이 가능한 분</li>
          </ul>
          <div className="wnt-sheet-tags">
            {job.tags.map((t) => <Chip key={t}>{t}</Chip>)}
          </div>
        </section>

        <footer className="wnt-sheet-foot">
          <button className={`wnt-icon-btn wnt-icon-btn-lg ${saved.has(job.id) ? "is-saved" : ""}`} onClick={() => onSave(job)}>
            {saved.has(job.id) ? <I.bookmarkFill /> : <I.bookmark />}
          </button>
          <Button kind={applied.has(job.id) ? "secondary" : "primary"} size="l" onClick={() => onApply(job)} disabled={applied.has(job.id)}>
            {applied.has(job.id) ? <><I.check /> 지원 완료</> : "지원하기"}
          </Button>
        </footer>
      </div>
    </div>
  );
}

function AppliedDrawer({ open, onClose, applied }) {
  if (!open) return null;
  const list = JOBS.filter((j) => applied.has(j.id));
  return (
    <div className="wnt-drawer" onClick={onClose}>
      <aside className="wnt-drawer-card" onClick={(e) => e.stopPropagation()}>
        <header className="wnt-drawer-head">
          <h3>지원 현황</h3>
          <button className="wnt-icon-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
          </button>
        </header>
        {list.length === 0 ? (
          <div className="wnt-drawer-empty">
            <div className="wnt-drawer-empty-icon"><I.briefcase /></div>
            <div className="wnt-drawer-empty-title">아직 지원한 공고가 없어요</div>
            <div className="wnt-drawer-empty-sub">관심있는 공고에 <strong>지원하기</strong>를 눌러보세요.</div>
          </div>
        ) : (
          <ul className="wnt-drawer-list">
            {list.map((j, i) => (
              <li key={j.id} className="wnt-drawer-item">
                <div className="wnt-drawer-item-co" style={{ background: j.cover }}>{j.initial}</div>
                <div className="wnt-drawer-item-body">
                  <div className="wnt-drawer-item-co-name">{j.company}</div>
                  <div className="wnt-drawer-item-title">{j.title}</div>
                </div>
                <Badge tone={i === 0 ? "blue" : "soft"}>{i === 0 ? "서류 검토" : "지원 완료"}</Badge>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

Object.assign(window, { JOBS, JobCard, HomeFeed, JobDetail, AppliedDrawer });
