import data from './ngebutjft_data.json' with { type: 'json' };

export function getSectionInfo() {
  if (!data?.meta?.sections) return [];
  return data.meta.sections;
}

export function getQuestionsBySection(sectionId) {
  if (!data?.questions) return [];
  const id = typeof sectionId === 'string' ? parseInt(sectionId, 10) : sectionId;
  return data.questions.filter((q) => q.section === id);
}

export function getBonusQuestions() {
  if (!data?.bonus) return [];
  return data.bonus;
}

export function getContextForQuestion(question) {
  if (!question?.context_id || !data?.contexts) return null;
  return data.contexts.find((ctx) => ctx.context_id === question.context_id) || null;
}

export function groupQuestionsByContext(sectionId) {
  const questions = getQuestionsBySection(sectionId);
  if (questions.length === 0) return [];

  const standalone = [];
  const contextMap = new Map();

  for (const q of questions) {
    if (q.context_id) {
      if (!contextMap.has(q.context_id)) {
        const context = getContextForQuestion(q);
        contextMap.set(q.context_id, { context, questions: [] });
      }
      contextMap.get(q.context_id).questions.push(q);
    } else {
      standalone.push(q);
    }
  }

  const groups = Array.from(contextMap.values());

  if (standalone.length > 0) {
    groups.push({ context: null, questions: standalone });
  }

  return groups;
}

const exported = {
  getSectionInfo,
  getQuestionsBySection,
  getBonusQuestions,
  getContextForQuestion,
  groupQuestionsByContext,
};

export default exported;

async function runSelfCheck() {
  console.log('==========================================');
  console.log('  📦 NgebutJFT Data Loader — Quick Check');
  console.log('==========================================\n');

  const sections = getSectionInfo();
  console.log(`✅ Jumlah section terdaftar: ${sections.length}`);
  sections.forEach((s) => {
    const count = getQuestionsBySection(s.id).length;
    const rangeInfo = s.range ? `(no. ${s.range[0]}–${s.range[1]})` : '';
    const label = s.name_id ? `${s.name_id} / ${s.name}` : s.name;
    console.log(`   • Section ${s.id}: ${label} — ${count} soal ${rangeInfo}`);
  });
  console.log();

  const totalQuestions = data?.questions?.length ?? 0;
  const totalContexts = data?.contexts?.length ?? 0;
  const bonusCount = getBonusQuestions().length;
  const metaTotal = data?.meta?.total_questions ?? 0;
  const metaBonusTotal = data?.meta?.total_bonus ?? 0;
  console.log(`📊 Total soal reguler: ${totalQuestions} (meta: ${metaTotal})`);
  console.log(`📚 Total context (dialog/bacaan): ${totalContexts}`);
  console.log(`⭐ Total soal bonus: ${bonusCount} (meta: ${metaBonusTotal})`);
  console.log();

  const bySectionCtx = (id) => data.contexts.filter((c) => c.section === id).length;
  console.log(`   → Context Section 3 (聴解/Menyimak): ${bySectionCtx(3)}`);
  console.log(`   → Context Section 4 (読解/Membaca): ${bySectionCtx(4)}`);
  console.log();

  console.log('------------------------------------------');
  console.log('  🧪 groupQuestionsByContext(3) — Section 3');
  console.log('------------------------------------------');
  const groupsSection3 = groupQuestionsByContext(3);
  console.log(`Total grup: ${groupsSection3.length}`);
  groupsSection3.slice(0, 5).forEach((g, idx) => {
    if (g.context) {
      const title =
        g.context.text
          .replace(/\n/g, ' ')
          .slice(0, 40) + '...';
      console.log(
        `\n   Grup ${idx + 1}: [${g.context.type ? g.context.type.toUpperCase() : 'CONTEXT'}] "${g.context.context_id}"`
      );
      console.log(`     • ${g.questions.length} soal | preview: ${title}`);
      g.questions.forEach((q) =>
        console.log(
          `       - Soal #${q.id}: ${q.prompt ? q.prompt.replace(/\n/g, ' ').slice(0, 55) : '(no prompt)'}...`
        )
      );
    } else {
      console.log(`\n   Grup ${idx + 1}: [TANPA CONTEXT] — ${g.questions.length} soal standalone`);
    }
  });
  if (groupsSection3.length > 5) {
    console.log(`\n   …dan ${groupsSection3.length - 5} grup lagi (tidak ditampilkan).`);
  }
  console.log();

  console.log('------------------------------------------');
  console.log('  🧪 groupQuestionsByContext(4) — Section 4');
  console.log('------------------------------------------');
  const groupsSection4 = groupQuestionsByContext(4);
  console.log(`Total grup: ${groupsSection4.length}`);
  groupsSection4.slice(0, 5).forEach((g, idx) => {
    if (g.context) {
      const title =
        g.context.text
          .replace(/\n/g, ' ')
          .slice(0, 50) + '...';
      const typeLabel = g.context.type ? g.context.type.toUpperCase() : 'PASSAGE';
      console.log(
        `\n   Grup ${idx + 1}: [${typeLabel}] "${g.context.context_id}" — ${g.questions.length} soal`
      );
      console.log(`     • Preview: ${title}`);
    } else {
      console.log(`\n   Grup ${idx + 1}: [TANPA CONTEXT] — ${g.questions.length} soal standalone`);
    }
  });
  if (groupsSection4.length > 5) {
    console.log(`\n   …dan ${groupsSection4.length - 5} grup lagi (tidak ditampilkan).`);
  }

  const sampleQ = data.questions.find((q) => q.context_id);
  if (sampleQ) {
    console.log('\n------------------------------------------');
    console.log('  🧪 getContextForQuestion() — Soal #' + sampleQ.id);
    console.log('------------------------------------------');
    const ctx = getContextForQuestion(sampleQ);
    console.log(`   • context_id di soal  : ${sampleQ.context_id}`);
    console.log(`   • context ditemukan   : ${ctx ? '✅ Ya' : '❌ Tidak'}`);
    if (ctx) {
      console.log(`   • type                : ${ctx.type}`);
      console.log(`   • section di context  : ${ctx.section}`);
      console.log(
        `   • text (80 char)      : ${ctx.text.replace(/\n/g, ' ').slice(0, 80)}...`
      );
      console.log(`   • question_ids        : ${JSON.stringify(ctx.question_ids)}`);
    }
  }

  console.log('\n==========================================');
  console.log('  ✅ Verifikasi data selesai.');
  console.log('==========================================');
}

try {
  const isNodeCLI =
    typeof process !== 'undefined' &&
    process.argv &&
    process.argv[1] &&
    typeof import.meta !== 'undefined' &&
    (process.argv[1].endsWith('/dataLoader.js') ||
      process.argv[1].endsWith('\\dataLoader.js'));
  if (isNodeCLI) runSelfCheck().catch(console.error);
} catch {
  /* ignore */
}
