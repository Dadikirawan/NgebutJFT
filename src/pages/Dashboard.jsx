export default function Dashboard({
  progress,
  level,
  sectionProgress,
  bonusProgress,
  navigate,
  startQuiz,
  helpers,
}) {
  const sections = helpers.getSectionInfo();
  const bonus = bonusProgress();

  return (
    <>
      <div className="page-lead">
        <div>
          <h1 className="page-title">Dashboard Latihanmu</h1>
          <p className="page-subtitle">
            Asah kemampuan JFT-Basic secara bertahap. Kerjakan per bagian, atau langsung tantang simulasi lengkap 200 soal.
          </p>
        </div>
      </div>

      <section className="stats-strip" aria-label="Statistik gamifikasi">
        <div className="stat-card">
          <div className="stat-ico xp" aria-hidden="true">⭐</div>
          <div className="stat-meta" style={{ flex: 1 }}>
            <span className="stat-label">Total XP</span>
            <span className="stat-value">{progress.xp.toLocaleString('id-ID')} XP</span>
            <div className="progress-mini" aria-hidden="true">
              <span style={{ width: `${Math.round(level.progressInLevel * 100)}%` }} />
            </div>
            <span className="stat-sub">
              {level.currentMin.toLocaleString('id-ID')} → {level.nextMin.toLocaleString('id-ID')} XP
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-ico level" aria-hidden="true">🏆</div>
          <div className="stat-meta">
            <span className="stat-label">Level saat ini</span>
            <span className="stat-value">Level {level.level}</span>
            <span className="stat-sub">
              {level.progressInLevel >= 1
                ? 'Max level untuk saat ini.'
                : `${Math.round(level.progressInLevel * 100)}% menuju level ${level.level + 1}.`}
            </span>
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
                : 'Selesaikan satu kuis untuk mulai streak!'}
            </span>
          </div>
        </div>
      </section>

      <section className="top-cta">
        <div>
          <h3>Mulai Simulasi Lengkap 200 Soal</h3>
          <p>
            Mode pengalaman penuh seperti tes asli: 4 bagian berurutan tanpa bonus. Cocok untuk latihan simulasi sungguhan.
          </p>
        </div>
        <button
          type="button"
          className="btn"
          onClick={() => startQuiz('full')}
          aria-label="Mulai simulasi lengkap 200 soal"
        >
          <span aria-hidden="true">▶</span>
          Mulai Simulasi Lengkap (200 Soal)
        </button>
      </section>

      <h2 className="page-title" style={{ fontSize: 20 }}>Latihan per Bagian</h2>
      <p className="page-subtitle" style={{ marginTop: -4 }}>
        Fokus pada satu kemampuan dulu. Pilih kartu, lalu klik <b>Latihan bagian ini</b>.
      </p>

      <div className="cards-grid" style={{ marginBottom: 24 }}>
        {sections.map((s) => {
          const prog = sectionProgress(s.id);
          return (
            <article key={s.id} className="section-card" data-grad={s.id}>
              <div className="card-head">
                <span className="card-number">Bagian {s.id}</span>
                <span className="card-badge">
                  {s.range ? `${s.range[0]}–${s.range[1]}` : `${prog.total} soal`}
                </span>
              </div>

              <div className="card-title">
                <span className="jp">{s.name}</span>
                <span className="id">{s.name_id}</span>
              </div>

              <div className="card-meta">
                <span className="muted">Jumlah soal</span>
                <span className="count">{prog.total} butir</span>
              </div>

              <div className="progress-wrap">
                <div className="progress-head">
                  <span className="label">
                    Progress: {prog.done}/{prog.total} soal
                  </span>
                  <span className="pct">{prog.pct}%</span>
                </div>
                <div className="progress-bar" role="progressbar" aria-valuenow={prog.pct} aria-valuemin={0} aria-valuemax={100}>
                  <span style={{ width: `${prog.pct}%` }} />
                </div>
              </div>

              <div className="card-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => startQuiz('section', s.id)}
                >
                  <span aria-hidden="true">📝</span>
                  Latihan Bagian Ini
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('mode', { sectionId: s.id })}
                >
                  Lihat Opsi Mode
                </button>
              </div>
            </article>
          );
        })}

        <article className="section-card" data-grad="bonus">
          <div className="card-head">
            <span className="card-number">Bonus</span>
            <span className="card-badge">8 Soal Nuansa</span>
          </div>

          <div className="card-title">
            <span className="jp" style={{ fontSize: 18 }}>ボーナス問題</span>
            <span className="id">Soal Bonus — Nuansa Grammar</span>
          </div>

          <div className="card-meta">
            <span className="muted">Jumlah soal</span>
            <span className="count">{bonus.total} butir</span>
          </div>

          <div className="progress-wrap">
            <div className="progress-head">
              <span className="label">
                Progress: {bonus.done}/{bonus.total} soal
              </span>
              <span className="pct" style={{ color: 'var(--plum-deep)' }}>{bonus.pct}%</span>
            </div>
            <div className="progress-bar" role="progressbar" aria-valuenow={bonus.pct} aria-valuemin={0} aria-valuemax={100}>
              <span style={{ width: `${bonus.pct}%` }} />
            </div>
          </div>

          <div className="card-actions">
            <button
              type="button"
              className="btn btn-dark"
              onClick={() => startQuiz('bonus')}
            >
              <span aria-hidden="true">🎁</span>
              Latihan Bonus
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('mode', { sectionId: 'bonus' })}
            >
              Lihat Detail
            </button>
          </div>
        </article>
      </div>
    </>
  );
}
