export default function Progress({
  progress,
  level,
  sectionProgress,
  bonusProgress,
  navigate,
  startQuiz,
  resetProgress,
  helpers,
}) {
  const sections = helpers.getSectionInfo();
  const rows = sections.map((s) => ({ section: s, data: sectionProgress(s.id) }));
  const bonus = bonusProgress();
  const totalRegular = rows.reduce((a, r) => a + r.data.total, 0);
  const doneRegular = rows.reduce((a, r) => a + r.data.done, 0);
  const overallPct = totalRegular ? Math.round(((doneRegular + bonus.done) / (totalRegular + bonus.total)) * 100) : 0;

  return (
    <>
      <div className="page-lead">
        <div>
          <h1 className="page-title">Progress Belajar</h1>
          <p className="page-subtitle">
            Ringkasan pencapaianmu: XP, level, streak, dan progress per bagian (data disimpan lokal di browser).
          </p>
        </div>
      </div>

      <section className="stats-strip">
        <div className="stat-card">
          <div className="stat-ico xp" aria-hidden="true">⭐</div>
          <div className="stat-meta" style={{ flex: 1 }}>
            <span className="stat-label">Total XP</span>
            <span className="stat-value">{progress.xp.toLocaleString('id-ID')} XP</span>
            <div className="progress-mini" aria-hidden="true">
              <span style={{ width: `${Math.round(level.progressInLevel * 100)}%` }} />
            </div>
            <span className="stat-sub">
              {level.currentMin.toLocaleString('id-ID')} → {level.nextMin.toLocaleString('id-ID')} XP menuju Lv.{level.level + 1}
            </span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-ico level" aria-hidden="true">🏆</div>
          <div className="stat-meta">
            <span className="stat-label">Level saat ini</span>
            <span className="stat-value">Level {level.level}</span>
            <span className="stat-sub">{Math.round(level.progressInLevel * 100)}% selesai di level ini.</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-ico streak" aria-hidden="true">🔥</div>
          <div className="stat-meta">
            <span className="stat-label">Streak harian</span>
            <span className="stat-value">{progress.streak || 0} hari</span>
            <span className="stat-sub">
              {progress.lastDate
                ? `Terakhir latihan: ${progress.lastDate}.`
                : 'Selesaikan satu kuis untuk mulai streak.'}
            </span>
          </div>
        </div>
      </section>

      <section className="top-cta">
        <div>
          <h3>Progress Keseluruhan: {overallPct}%</h3>
          <p>
            Total soal reguler yang dikerjakan: <b>{doneRegular}/{totalRegular}</b>
            {bonus.total > 0 && <> — Bonus: <b>{bonus.done}/{bonus.total}</b></>}
          </p>
        </div>
        <button type="button" className="btn" onClick={() => startQuiz('full')}>
          <span aria-hidden="true">▶</span>
          Lanjut Simulasi Lengkap
        </button>
      </section>

      <section className="breakdown-list" style={{ marginBottom: 24 }}>
        <h3>Progress per Bagian & Bonus</h3>
        {rows.map(({ section, data }) => (
          <div className="breakdown-row" key={section.id}>
            <div className="lbl">
              Bagian {section.id} — {section.name}
              <small>{section.name_id} • {section.range ? `No. ${section.range[0]}–${section.range[1]}` : ''}</small>
            </div>
            <div>
              <div className="progress-bar">
                <span style={{ width: `${data.pct}%` }} />
              </div>
            </div>
            <div className="val">
              <span style={{ color: 'var(--success)' }}>{data.done}</span>
              <span className="muted"> / {data.total}</span>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--neutral-700)' }}>{data.pct}%</div>
            </div>
          </div>
        ))}
        <div className="breakdown-row">
          <div className="lbl">
            Bonus — ニュアンス
            <small>Soal tambahan nuansa kalimat</small>
          </div>
          <div>
            <div className="progress-bar">
              <span style={{ width: `${bonus.pct}%`, background: 'linear-gradient(90deg, var(--plum-deep), var(--navy-ink))' }} />
            </div>
          </div>
          <div className="val">
            <span style={{ color: 'var(--plum-deep)' }}>{bonus.done}</span>
            <span className="muted"> / {bonus.total}</span>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--plum-deep)' }}>{bonus.pct}%</div>
          </div>
        </div>
      </section>

      <section className="result-actions" style={{ marginBottom: 24 }}>
        <button type="button" className="btn btn-primary" onClick={() => navigate('dashboard')}>
          <span aria-hidden="true">🏠</span>
          Kembali ke Dashboard
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            if (confirm('Reset seluruh progress (XP, level, streak, dan progress soal)? Data yang dihapus tidak bisa dikembalikan.')) {
              resetProgress();
            }
          }}
        >
          <span aria-hidden="true">🗑️</span>
          Reset Progress
        </button>
      </section>
    </>
  );
}
