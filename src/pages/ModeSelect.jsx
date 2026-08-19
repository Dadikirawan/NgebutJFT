export default function ModeSelect({
  sectionId,
  startQuiz,
  navigate,
  helpers,
}) {
  const sections = helpers.getSectionInfo();
  const bonus = helpers.getBonusQuestions();

  const selectedSection = sectionId === 'bonus'
    ? { id: 'bonus', name: 'ボーナス問題', name_id: 'Soal Bonus', description: '8 soal nuansa pilihan. Latihan tambahan di luar simulasi utama.', count: bonus.length }
    : sections.find((s) => s.id === Number(sectionId));

  return (
    <>
      <div className="breadcrumbs" style={{ marginBottom: 12 }}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => navigate('dashboard')}
          style={{ minHeight: 'auto', padding: '4px 0', width: 'auto', fontSize: 13 }}
        >
          ← Kembali ke Dashboard
        </button>
      </div>

      <h1 className="page-title">Pilih Mode Latihan</h1>
      {selectedSection ? (
        <p className="page-subtitle">
          Kamu memilih bagian: <b>{selectedSection.name_id || selectedSection.name_id}</b> (
          {selectedSection.name}). Pilih mode di bawah ini.
        </p>
      ) : (
        <p className="page-subtitle">Pilih salah satu mode untuk memulai latihan.</p>
      )}

      <div className="mode-list">
        <div className="mode-card">
          <div className="ico" aria-hidden="true">🧩</div>
          <div className="stack" style={{ gap: 8 }}>
            <h4>Simulasi Lengkap</h4>
            <p>200 soal dari Bagian 1 sampai Bagian 4 secara berurutan (tidak termasuk bonus). Cocok untuk simulasi tes sungguhan.</p>
            <div className="mode-meta">
              <span className="chip teal">200 soal</span>
              <span className="chip">4 Bagian</span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => startQuiz('full')}
          >
            Mulai Simulasi Lengkap
          </button>
        </div>

        <div className="mode-card alt">
          <div className="ico" aria-hidden="true">🎯</div>
          <div className="stack" style={{ gap: 8 }}>
            <h4>Latihan per Bagian</h4>
            <p>Fokus pada satu bagian saja untuk mengasah satu kemampuan. 50 soal per bagian (Kosakata, Percakapan, Menyimak, atau Membaca).</p>
            <div className="mode-meta">
              <span className="chip plum">50 soal / bagian</span>
              <span className="chip">Fokus belajar</span>
            </div>
          </div>
          <div className="stack" style={{ gap: 8 }}>
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                className="btn btn-secondary"
                onClick={() => startQuiz('section', s.id)}
              >
                {s.id}. {s.name_id} / {s.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mode-card bonus">
          <div className="ico" aria-hidden="true">🎁</div>
          <div className="stack" style={{ gap: 8 }}>
            <h4>Latihan Bonus</h4>
            <p>8 soal nuansa tambahan (bukan bagian dari 200 soal inti) untuk mempertajam rasa bahasa dan perbedaan nuansa kalimat.</p>
            <div className="mode-meta">
              <span className="chip warn">8 soal bonus</span>
              <span className="chip">Nuansa grammar</span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-dark"
            onClick={() => startQuiz('bonus')}
          >
            Mulai Latihan Bonus
          </button>
        </div>
      </div>

      <div className="panel" style={{ padding: 20 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Keterangan Mode</h3>
        <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--neutral-700)', fontSize: 14 }}>
          <li>Mode <b>Simulasi Lengkap</b>: mengerjakan soal berurutan nomor 1–200, bonus dikecualikan. Setelah selesai, akan ada breakdown skor per bagian.</li>
          <li>Mode <b>Latihan per Bagian</b>: hanya soal di bagian tersebut. Progress bagian akan langsung ter-update di dashboard.</li>
          <li>Mode <b>Bonus</b>: soal bonus saja. XP dan progress tetap dihitung.</li>
          <li>Setelah pilih jawaban, kamu akan langsung dapat feedback <i>benar/salah</i> dan penjelasan singkat (explanation).</li>
        </ul>
      </div>
    </>
  );
}
