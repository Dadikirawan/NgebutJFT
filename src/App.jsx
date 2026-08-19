import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getSectionInfo,
  getQuestionsBySection,
  getBonusQuestions,
  getContextForQuestion,
  groupQuestionsByContext,
} from './data/dataLoader.js';
import Dashboard from './pages/Dashboard.jsx';
import ModeSelect from './pages/ModeSelect.jsx';
import QuizViewer from './pages/QuizViewer.jsx';
import Result from './pages/Result.jsx';
import Progress from './pages/Progress.jsx';
import Sidebar from './components/Sidebar.jsx';

const TABLET_MIN = 768;
const DESKTOP_MIN = 1024;
const MOBILE_MAX = 767;

const STORAGE_KEY = 'ngebutjft.user_progress.v1';

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fisherYatesShuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

function shuffleQuestionList(list) {
  if (!Array.isArray(list) || list.length <= 1) return list;

  const groups = new Map();
  const singles = [];
  const groupOrder = [];

  for (const q of list) {
    if (q && q.context_id && (typeof q.context_id === 'string' || typeof q.context_id === 'number')) {
      const key = String(q.context_id);
      if (!groups.has(key)) {
        groups.set(key, []);
        groupOrder.push(key);
      }
      groups.get(key).push(q);
    } else {
      singles.push(q);
    }
  }

  const hasGroups = groups.size > 0;
  let out;

  if (hasGroups) {
    const shuffledGroupKeys = fisherYatesShuffle(groupOrder);
    out = [];
    for (const key of shuffledGroupKeys) {
      const block = groups.get(key);
      for (const q of block) out.push(q);
    }
    if (singles.length > 0) {
      const shuffledSingles = fisherYatesShuffle(singles);
      for (const q of shuffledSingles) out.push(q);
    }
  } else {
    out = fisherYatesShuffle(singles);
  }

  return out;
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error('no data');
    const parsed = JSON.parse(raw);
    return {
      xp: Number(parsed.xp) || 0,
      streak: Number(parsed.streak) || 0,
      lastDate: parsed.lastDate || null,
      answeredQuestionIds: Array.isArray(parsed.answeredQuestionIds)
        ? parsed.answeredQuestionIds
        : [],
    };
  } catch {
    return { xp: 0, streak: 0, lastDate: null, answeredQuestionIds: [] };
  }
}

function saveProgress(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function levelForXP(xp) {
  const thresholds = [
    0, 100, 250, 500, 900, 1400, 2100, 3000, 4200, 5800, 7800, 10400,
  ];
  let level = 1;
  for (let i = 0; i < thresholds.length; i += 1) {
    if (xp >= thresholds[i]) level = i + 1;
  }
  const currentMin = thresholds[level - 1] ?? 0;
  const nextMin = thresholds[level] ?? thresholds[thresholds.length - 1] + 2000;
  const progressInLevel = Math.min(1, Math.max(0, (xp - currentMin) / Math.max(1, nextMin - currentMin)));
  return { level, currentMin, nextMin, progressInLevel };
}

function sectionProgress(answeredIds, sectionId) {
  const questions = getQuestionsBySection(sectionId);
  if (questions.length === 0) return { pct: 0, done: 0, total: 0 };
  const set = new Set(answeredIds);
  const done = questions.filter((q) => set.has(q.id)).length;
  return { pct: Math.round((done / questions.length) * 100), done, total: questions.length };
}

function bonusProgress(answeredIds) {
  const list = getBonusQuestions();
  if (list.length === 0) return { pct: 0, done: 0, total: 0 };
  const set = new Set(answeredIds);
  const done = list.filter((q) => set.has(q.id)).length;
  return { pct: Math.round((done / list.length) * 100), done, total: list.length };
}

function buildQuiz(mode, sectionId = null) {
  if (mode === 'full') {
    const sections = getSectionInfo();
    const shuffledParts = sections.map((s) => shuffleQuestionList(getQuestionsBySection(s.id)));
    const items = shuffledParts.flat();
    return {
      mode,
      title: 'Simulasi Lengkap',
      description: '200 soal berurutan — Semua Bagian (tidak termasuk bonus)',
      items,
      breakdown: sections.map((s) => ({
        sectionId: s.id,
        nameId: s.name_id,
        nameJp: s.name,
      })),
    };
  }
  if (mode === 'section' && sectionId != null) {
    const section = getSectionInfo().find((s) => s.id === Number(sectionId));
    const items = shuffleQuestionList(getQuestionsBySection(sectionId));
    return {
      mode,
      title: section ? `${section.name_id} / ${section.name}` : 'Latihan Bagian',
      description: section
        ? `Soal nomor ${section.range?.[0] ?? ''}–${section.range?.[1] ?? ''}`
        : '',
      items,
      breakdown: section
        ? [{ sectionId: section.id, nameId: section.name_id, nameJp: section.name }]
        : [],
    };
  }
  if (mode === 'bonus') {
    const items = shuffleQuestionList(getBonusQuestions());
    return {
      mode,
      title: 'Bonus — Soal Nuansa',
      description: `${items.length} soal latihan tambahan (bukan bagian dari simulasi utama)`,
      items,
      breakdown: [],
    };
  }
  return { mode, title: '', description: '', items: [], breakdown: [] };
}

export default function App() {
  const [progress, setProgress] = useState(() => loadProgress());
  const [route, setRoute] = useState(() => ({ name: 'dashboard', params: {} }));
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [result, setResult] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tabletCollapsed, setTabletCollapsed] = useState(false);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    setMobileOpen(false);
  }, [route]);

  const sections = useMemo(() => getSectionInfo(), []);
  const level = useMemo(() => levelForXP(progress.xp), [progress.xp]);
  const sProgress = useCallback(
    (id) => sectionProgress(progress.answeredQuestionIds, id),
    [progress.answeredQuestionIds]
  );
  const bProgress = useCallback(
    () => bonusProgress(progress.answeredQuestionIds),
    [progress.answeredQuestionIds]
  );

  const navigate = useCallback((name, params = {}) => {
    setResult(null);
    setRoute({ name, params });
  }, []);

  const startQuiz = useCallback((mode, sectionId = null) => {
    const quiz = buildQuiz(mode, sectionId);
    if (!quiz.items.length) return;
    setActiveQuiz(quiz);
    setResult(null);
    navigate('quiz');
  }, [navigate]);

  const finishQuiz = useCallback((attempt) => {
    setResult(attempt);
    const today = todayKey();
    setProgress((prev) => {
      const newSet = new Set(prev.answeredQuestionIds);
      attempt.answers.forEach((a) => {
        if (a.questionId != null) newSet.add(a.questionId);
      });
      let newStreak = prev.streak || 0;
      if (prev.lastDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
        if (prev.lastDate === yKey) {
          newStreak = prev.streak + 1;
        } else if (!prev.lastDate || prev.lastDate !== today) {
          newStreak = 1;
        }
      }
      return {
        xp: prev.xp + (attempt.xpGained || 0),
        streak: newStreak,
        lastDate: today,
        answeredQuestionIds: Array.from(newSet),
      };
    });
    navigate('result');
  }, [navigate]);

  const resetProgress = useCallback(() => {
    const fresh = { xp: 0, streak: 0, lastDate: null, answeredQuestionIds: [] };
    setProgress(fresh);
    saveProgress(fresh);
  }, []);

  const common = {
    progress,
    level,
    sectionProgress: sProgress,
    bonusProgress: bProgress,
    navigate,
    startQuiz,
    finishQuiz,
    resetProgress,
    activeQuiz,
    result,
    helpers: { getSectionInfo, getQuestionsBySection, getBonusQuestions, getContextForQuestion, groupQuestionsByContext },
  };

  let page = null;
  if (route.name === 'dashboard') page = <Dashboard {...common} />;
  else if (route.name === 'mode') page = <ModeSelect {...common} sectionId={route.params.sectionId} />;
  else if (route.name === 'quiz' && activeQuiz) page = <QuizViewer {...common} />;
  else if (route.name === 'result' && result) page = <Result {...common} />;
  else if (route.name === 'progress') page = <Progress {...common} />;
  else page = <Dashboard {...common} />;

  return (
    <div className={`app-shell with-sidebar ${tabletCollapsed ? 'tablet-collapsed' : ''}`}>
      <Sidebar
        sections={sections}
        route={route}
        navigate={navigate}
        startQuiz={startQuiz}
        sectionProgress={sProgress}
        bonusProgress={bProgress}
        onMobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        onToggleCollapse={() => setTabletCollapsed((v) => !v)}
        collapsed={tabletCollapsed}
      />
      <header className="app-header">
        <div className="app-header-inner">
          <div className="header-brand-row">
            <button
              type="button"
              className="sb-burger sb-only-mobile"
              aria-label="Buka menu navigasi"
              onClick={() => setMobileOpen(true)}
            >
              <span aria-hidden="true">☰</span>
            </button>
            <button
              type="button"
              className="sb-burger sb-only-tablet"
              aria-label={tabletCollapsed ? 'Buka sidebar' : 'Sempitkan sidebar'}
              onClick={() => setTabletCollapsed((v) => !v)}
            >
              <span aria-hidden="true">{tabletCollapsed ? '≡' : '«'}</span>
            </button>
            <button className="brand" type="button" onClick={() => navigate('dashboard')} style={{ background: 'transparent', border: 'none', padding: 0, color: 'inherit' }}>
              <span className="brand-mark" aria-hidden="true">J</span>
              <span className="brand-text">
                <span className="main">NgebutJFT</span>
                <span className="sub">SIMULASI JFT-BASIC</span>
              </span>
            </button>
          </div>
          <div className="header-ctas">
            <span className="icon-btn" title={`Level ${level.level} • ${progress.xp} XP`}>
              <span aria-hidden="true">⭐</span>
              <span>Lv.{level.level}</span>
            </span>
            <span className="icon-btn" title={`Streak ${progress.streak || 0} hari`}>
              <span aria-hidden="true">🔥</span>
              <span>{progress.streak || 0}</span>
            </span>
            <button type="button" className="icon-btn primary" onClick={() => navigate('mode')}>
              <span aria-hidden="true">▶</span>
              <span>Mulai</span>
            </button>
          </div>
        </div>
      </header>
      <main className="app-main">{page}</main>
      <footer className="page-footer page-footer-copyright" aria-label="Hak cipta">
        <span>© 2026 Dadik Irawan. All rights reserved.</span>
      </footer>
    </div>
  );
}
