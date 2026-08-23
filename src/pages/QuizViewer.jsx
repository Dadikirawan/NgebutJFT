import { useCallback, useEffect, useMemo, useState } from 'react';

function buildGroups(items) {
  const groups = [];
  const seenGroups = new Map();
  for (const q of items) {
    if (q.context_id) {
      if (!seenGroups.has(q.context_id)) {
        seenGroups.set(q.context_id, { contextId: q.context_id, type: 'context', questions: [] });
        groups.push(seenGroups.get(q.context_id));
      }
      seenGroups.get(q.context_id).questions.push(q);
    } else {
      groups.push({ type: 'single', question: q });
    }
  }
  return groups;
}

function flatten(groups) {
  const list = [];
  groups.forEach((g, gi) => {
    if (g.type === 'context') {
      g.questions.forEach((q) => list.push({ groupIndex: gi, question: q }));
    } else {
      list.push({ groupIndex: gi, question: g.question });
    }
  });
  return list;
}

export default function QuizViewer({
  activeQuiz,
  finishQuiz,
  navigate,
  helpers,
}) {
  const groups = useMemo(() => buildGroups(activeQuiz.items), [activeQuiz]);
  const flat = useMemo(() => flatten(groups), [groups]);
  const total = flat.length;

  const [cursor, setCursor] = useState(0);
  const [selections, setSelections] = useState({});
  const [submitted, setSubmitted] = useState({});

  useEffect(() => {
    setCursor(0);
    setSelections({});
    setSubmitted({});
  }, [activeQuiz]);

  const currentEntry = flat[cursor];
  const group = currentEntry ? groups[currentEntry.groupIndex] : null;
  const currentQ = currentEntry?.question;

  const answeredCount = Object.keys(submitted).length;
  const correctCount = Object.values(submitted).reduce(
    (acc, s) => acc + (s.correct ? 1 : 0),
    0
  );
  const wrongCount = answeredCount - correctCount;
  const pctProgress = total ? Math.round(((cursor + (submitted[currentQ?.id] ? 1 : 0)) / total) * 100) : 0;

  const showContextBox = group && group.type === 'context' && group.questions[0]?.id === currentQ?.id;
  const contextObj = showContextBox ? helpers.getContextForQuestion(currentQ) : null;

  function selectOption(index) {
    if (submitted[currentQ.id]) return;
    setSelections((prev) => ({ ...prev, [currentQ.id]: index }));
  }

  function submitCurrent() {
    if (submitted[currentQ.id] || selections[currentQ.id] == null) return;
    const isCorrect = selections[currentQ.id] === currentQ.answer_index;
    setSubmitted((prev) => ({
      ...prev,
      [currentQ.id]: {
        selected: selections[currentQ.id],
        correct: isCorrect,
      },
    }));
  }

  function gotoDelta(delta) {
    const next = Math.min(total - 1, Math.max(0, cursor + delta));
    setCursor(next);
  }

  function handleFinish() {
    const answers = flat.map(({ question }) => {
      const s = submitted[question.id];
      return {
        questionId: question.id,
        section: question.section ?? 'bonus',
        selected: s?.selected ?? null,
        correct: !!s?.correct,
        correctIndex: question.answer_index,
      };
    });
    const totalCorrect = answers.filter((a) => a.correct).length;
    const xpGained = Math.max(0, totalCorrect * 5 + (totalCorrect === total ? 50 : 0));
    finishQuiz({
      mode: activeQuiz.mode,
      title: activeQuiz.title,
      description: activeQuiz.description,
      breakdown: activeQuiz.breakdown,
      total,
      correct: totalCorrect,
      wrong: total - totalCorrect,
      pct: total ? Math.round((totalCorrect / total) * 100) : 0,
      answers,
      xpGained,
    });
  }

  const isLast = cursor >= total - 1;
  const isFirst = cursor === 0;
  const currentSubmitted = submitted[currentQ?.id];
  const hasSelection = selections[currentQ?.id] != null;

  return (
    <>
      <div className="breadcrumbs">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            if (confirm('Keluar dari kuis? Progress halaman ini tidak akan disimpan.')) {
              navigate('dashboard');
            }
          }}
          style={{ minHeight: 'auto', padding: '4px 0', width: 'auto', fontSize: 13 }}
        >
          ← Keluar
        </button>
        <span className="sep">/</span>
        <span>{activeQuiz.title}</span>
        <span className="sep">/</span>
        <span className="current">Soal ke-{cursor + 1}</span>
      </div>

      <div className="quiz-wrap">
        <aside className="quiz-side" aria-label="Panel ringkasan kuis">
          <div className="panel">
            <div className="q-progress-head">
              <div>
                <div className="index">
                  <b>{cursor + 1}</b> / {total} soal
                </div>
                <div className="mode">{activeQuiz.description || activeQuiz.mode}</div>
              </div>
            </div>

            <div className="progress-bar" role="progressbar" aria-valuenow={pctProgress} aria-valuemin={0} aria-valuemax={100}>
              <span style={{ width: `${pctProgress}%` }} />
            </div>

            <div className="answers-summary">
              <div className="item">
                <span className="lbl">Dijawab</span>
                <span className="val">{answeredCount}</span>
              </div>
              <div className="item">
                <span className="lbl">Benar</span>
                <span className="val ok">{correctCount}</span>
              </div>
              <div className="item">
                <span className="lbl">Salah</span>
                <span className="val bad">{wrongCount}</span>
              </div>
            </div>

            <div className="nav-actions">
              <div className="row">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={isFirst}
                  onClick={() => gotoDelta(-1)}
                >
                  ← Soal sebelumnya
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={isLast}
                  onClick={() => gotoDelta(1)}
                >
                  Soal berikutnya →
                </button>
              </div>

              {!currentSubmitted ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!hasSelection}
                  onClick={submitCurrent}
                >
                  Konfirmasi Jawaban
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    if (isLast) {
                      handleFinish();
                    } else {
                      gotoDelta(1);
                    }
                  }}
                >
                  {isLast ? 'Lihat Hasil Akhir' : 'Soal berikutnya →'}
                </button>
              )}

              {answeredCount === total && (
                <button type="button" className="btn btn-dark" onClick={handleFinish}>
                  Selesaikan Kuis
                </button>
              )}
            </div>
          </div>
        </aside>

        <section className="quiz-body" aria-label="Isi soal kuis">
          <div className="panel">
            {currentQ && showContextBox && contextObj && (
              <ContextBoxDynamic
                key={contextObj.context_id}
                contextObj={contextObj}
                count={group.questions.length}
              />
            )}

            {currentQ && (
              <QuestionItem
                key={currentQ.id}
                q={currentQ}
                selection={selections[currentQ.id]}
                submission={currentSubmitted}
                onSelect={selectOption}
                displayIndex={cursor + 1}
              />
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function ContextBoxDynamic({ contextObj, count }) {
  const isDialogue = contextObj.type === 'dialogue';
  const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const audioPath = isDialogue && contextObj.context_id ? `${BASE}/audio/${contextObj.context_id}.mp3` : null;

  const [audioStatus, setAudioStatus] = useState('checking');
  const [showTranscript, setShowTranscript] = useState(false);
  const [audioRef, setAudioRef] = useState(null);

  const checkAudio = useCallback(async (path) => {
    if (!path) {
      setAudioStatus('unavailable');
      return;
    }
    try {
      const res = await fetch(path, { method: 'HEAD' });
      if (res.ok) {
        setAudioStatus('available');
      } else {
        setAudioStatus('unavailable');
      }
    } catch {
      setAudioStatus('unavailable');
    }
  }, []);

  useEffect(() => {
    if (audioPath) checkAudio(audioPath);
    else setAudioStatus('unavailable');
  }, [audioPath, checkAudio]);

  const attachAudio = useCallback((el) => {
    setAudioRef(el);
  }, []);

  useEffect(() => {
    const el = audioRef;
    if (!el) return undefined;
    let didSetAvail = false;
    const onErr = () => setAudioStatus('unavailable');
    const onCanPlay = () => {
      if (didSetAvail) return;
      didSetAvail = true;
      try {
        const p = el.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch {
        /* ignore autoplay policy errors */
      }
    };
    el.addEventListener('error', onErr);
    el.addEventListener('canplay', onCanPlay, { once: true });
    if (!didSetAvail) {
      didSetAvail = true;
      setAudioStatus('available');
    }
    return () => {
      try { el.pause(); } catch { /* ignore */ }
      el.removeEventListener('error', onErr);
      el.removeEventListener('canplay', onCanPlay);
    };
  }, [audioRef]);

  const hasAudio = isDialogue && audioStatus === 'available';

  return (
    <div className="context-box">
      <div className="context-head">
        <h4>
          {contextObj.type === 'dialogue' ? 'Dialog / 会話' : contextObj.type === 'passage' ? 'Bacaan / 読解文' : 'Context'}
        </h4>
        <span className="context-badge">{count} soal</span>
      </div>

      {hasAudio ? (
        <>
          <div className="audio-player-wrap">
            <audio ref={attachAudio} controls preload="auto" src={audioPath} className="audio-player">
              Browser Anda tidak mendukung pemutar audio.
            </audio>
          </div>
          <div className="transcript-toggle-row">
            <button
              type="button"
              className="btn btn-ghost transcript-toggle"
              onClick={() => setShowTranscript((v) => !v)}
              style={{ minHeight: 40, padding: '8px 14px', fontSize: 13, width: 'auto' }}
            >
              {showTranscript ? 'Sembunyikan transkrip' : 'Tampilkan transkrip'}
            </button>
          </div>
          {showTranscript && (
            <div className="context-text transcript" translate="no">{contextObj.text}</div>
          )}
        </>
      ) : (
        <>
          <div className="context-text" translate="no">{contextObj.text}</div>
        </>
      )}
    </div>
  );
}

function QuestionItem({ q, selection, submission, onSelect, displayIndex }) {
  const options = Array.isArray(q.options) ? q.options : [];
  const submitted = !!submission;
  const correctIdx = q.answer_index;
  const isKanjiReading = q?.subtype === 'kanji_reading'
    && typeof q?.instruction === 'string'
    && typeof q?.highlight === 'string';

  return (
    <article className="question-block">
      <div className="q-number">Soal {displayIndex}</div>

      {isKanjiReading ? (
        <div className="q-prompt q-prompt-kanji">
          {q.instruction && (
            <div className="q-instruction">{q.instruction}</div>
          )}
          <div className="q-sentence" translate="no">
            {q.sentence_before ? (
              <span className="q-sent-before">{q.sentence_before}</span>
            ) : null}
            <span className="q-highlight">{q.highlight}</span>
            {q.sentence_after ? (
              <span className="q-sent-after">{q.sentence_after}</span>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="q-prompt" translate="no">{q.prompt}</p>
      )}

      <div className="options" role="radiogroup" aria-label={`Pilihan soal ${displayIndex}`}>
        {options.map((opt, idx) => {
          const letter = String.fromCharCode(65 + idx);
          const selected = selection === idx;
          const isCorrect = idx === correctIdx;
          const isIncorrect = submitted && selected && !isCorrect;

          let cls = 'option';
          if (submitted) {
            if (isCorrect) cls += ' correct';
            else if (isIncorrect) cls += ' incorrect';
          } else if (selected) {
            cls += ' selected';
          }

          return (
            <button
              key={idx}
              type="button"
              className={cls}
              onClick={() => onSelect(idx)}
              disabled={submitted}
              aria-checked={selected}
              role="radio"
            >
              <span className="let">{letter}</span>
              <span className="opt-text" translate="no">{opt}</span>
              <span className="tick" aria-hidden="true" />
            </button>
          );
        })}
      </div>

      {submitted && (
        <div className={`feedback ${submission.correct ? 'ok' : 'bad'}`}>
          <div className="fb-head">
            <span aria-hidden="true">{submission.correct ? '✅' : '❌'}</span>
            <span>{submission.correct ? 'Jawaban benar!' : 'Jawaban kurang tepat.'}</span>
          </div>
          {q.explanation && (
            <div className="explanation">
              <b>Pembahasan:</b> {q.explanation}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
