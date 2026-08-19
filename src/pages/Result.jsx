import { useMemo } from 'react';

const PASING_THRESHOLD = 0.6;

export default function Result({
  result,
  activeQuiz,
  navigate,
  startQuiz,
  helpers,
}) {
  const pctP = result.pct / 100;

  const perSection = useMemo(() => {
    if (!result.breakdown || result.breakdown.length === 0) return [];
    return result.breakdown.map((b) => {
      const inSection = result.answers.filter((a) => a.section === b.sectionId);
      const total = inSection.length;
      const correct = inSection.filter((a) => a.correct).length;
      const pct = total ? Math.round((correct / total) * 100) : 0;
      return {
        ...b,
        total,
        correct,
        wrong: total - correct,
        pct,
      };
    });
  }, [result]);

  const label = result.mode === 'bonus' ? 'Bonus' : result.mode === 'full' ? 'Simulasi Lengkap' : 'Latihan Bagian';

  const predicate =
    result.total > 0 && pctP >= PASING_THRESHOLD ? 'Lulus ambang batas (≥60%).' : 'Belum mencapai ambang batas (<60%). Ayo coba lagi!';

  return (
    <>
      <div className="breadcrumbs" style={{ marginBottom: 16 }}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => navigate('dashboard')}
          style={{ minHeight: 'auto', padding: '4px 0', width: 'auto', fontSize: 13 }}
        >
          ← Kembali ke Dashboard
        </button>
      </div>

      <section className="result-hero">
        <div className="score-big">
          <span className="label">Hasil {label}</span>
          <span className="big">{result.pct}%</span>
          <span className="sub">{result.title}</span>
          <span className="sub" style={{ marginTop: 8 }}>{predicate}</span>
        </div>
        <div className="score-ring" style={{ ['--pct']: String(Math.max(0, Math.min(1, pctP))) }}>
          <span>
            <b>{result.correct}</b>
            <small>BENAR / {result.total}</small>
          </span>
        </div>
      </section>

      <section className="result-grid">
        <div className="result-tile">
          <div className="lbl">Total soal</div>
          <div className="val">{result.total}</div>
        </div>
        <div className="result-tile">
          <div className="lbl">Benar</div>
          <div className="val ok">{result.correct}</div>
        </div>
        <div className="result-tile">
          <div className="lbl">Salah / tidak dijawab</div>
          <div className="val bad">{result.wrong}</div>
        </div>
        <div className="result-tile">
          <div className="lbl">XP didapat</div>
          <div className="val" style={{ color: 'var(--plum-deep)' }}>+{result.xpGained}</div>
        </div>
      </section>

      {perSection.length > 1 && (
        <section className="breakdown-list" aria-label="Breakdown per bagian">
          <h3>Breakdown per Bagian</h3>
          {perSection.map((row) => (
            <div className="breakdown-row" key={row.sectionId}>
              <div className="lbl">
                Bagian {row.sectionId} — {row.nameJp}
                <small>{row.nameId}</small>
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="progress-bar">
                  <span style={{ width: `${row.pct}%` }} />
                </div>
              </div>
              <div className="val">
                <span style={{ color: 'var(--success)' }}>{row.correct}</span>
                <span className="muted"> / {row.total}</span>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--neutral-700)' }}>{row.pct}%</div>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="result-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            if (result.mode === 'full') startQuiz('full');
            else if (result.mode === 'bonus') startQuiz('bonus');
            else if (result.breakdown && result.breakdown[0]) startQuiz('section', result.breakdown[0].sectionId);
            else navigate('dashboard');
          }}
        >
          <span aria-hidden="true">🔁</span>
          Ulangi Mode yang Sama
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => navigate('dashboard')}>
          <span aria-hidden="true">🏠</span>
          Kembali ke Dashboard
        </button>
        <button type="button" className="btn btn-dark" onClick={() => navigate('mode')} style={{ gridColumn: '1 / -1' }}>
          <span aria-hidden="true">🧭</span>
          Pilih Mode Lainnya
        </button>
      </section>
    </>
  );
}
