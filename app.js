/* RAVA static course app. Content comes from content.js (window.RAVA). */
(function () {
  'use strict';
  const R = window.RAVA;
  const $ = (s, el) => (el || document).querySelector(s);
  const store = {
    get(k, d) { try { const v = localStorage.getItem('rava.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('rava.' + k, JSON.stringify(v)); } catch (e) {} }
  };
  let lang = store.get('lang', 'en');
  let route = store.get('route', 'home');
  const arr = x => (x == null ? [] : Array.isArray(x) ? x : [x]);
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[^*\w])\*(?!\s)(.+?)(?<!\s)\*(?![*\w])/g, '$1<i>$2</i>').replace(/\n/g, '<br>');
  const ui = () => R.ui[lang];
  const T = (path) => path.split('.').reduce((o, k) => (o ? o[k] : undefined), ui()) || path;
  const days = () => R[lang].days;
  const dayObj = n => days().find(d => d.day === n);
  const NUMS = Array.from({ length: 14 }, (_, i) => i + 1);

  // ---- progress ----
  const done = () => store.get('done', {});
  const toggleDone = n => { const d = done(); d[n] = !d[n]; store.set('done', d); renderSide(); renderTop(); render(); };

  // ---- assignment submission and certificate ----
  const subs = () => store.get('sub', {});
  const subCount = () => NUMS.filter(n => subs()[n]).length;
  const C = k => (ui().cert || {})[k] || k;
  function submitBox(n) {
    const s = subs()[n];
    return '<div class="callout noprint"><button class="btn" id="subBtn"' + (s ? ' disabled' : '') + '>' + (s ? C('submitted') : C('submit')) + '</button><span class="mut" id="subMsg"></span></div>';
  }
  function pageCert() {
    const cnt = subCount(), ok = cnt === 14;
    let h = '<h1 class="day">' + C('nav') + '</h1><div class="card"><p class="score">' + C('progress') + ': ' + cnt + ' / 14</p><div>' +
      NUMS.map(n => '<span class="tag" style="' + (subs()[n] ? 'background:#e3f6ea' : '') + '">' + n + (subs()[n] ? ' ✓' : '') + '</span>').join('') + '</div>' +
      '<p>' + (ok ? C('unlocked') : C('locked')) + '</p></div>';
    h += '<div class="card"><div class="callout">' + md(ui().cert.disclaimer) + '</div></div>';
    if (ok) {
      const nm = store.get('certName', '');
      h += '<div class="card noprint"><label><b>' + C('nameLabel') + '</b><input type="text" id="certName" value="' + esc(nm) + '"></label><button class="btn" id="certGo">' + C('generate') + '</button></div>';
      if (nm) {
        const dt = store.get('certDate', null) || (() => { const d = new Date().toISOString().slice(0, 10); store.set('certDate', d); return d; })();
        h += '<div class="certificate"><div class="certin"><div class="ct1">' + esc(ui().brand) + '</div><h1>' + C('title') + '</h1><p>' + C('certify') + '</p><div class="cname">' + esc(nm) + '</div><p>' + C('body') + '</p><h2>' + C('course') + '</h2><p><b>' + C('programme') + '</b><br>' + C('duration') + '</p>' +
          '<div class="csign"><div><b>' + C('instructors') + '</b><br><span>' + C('instructorRole') + '</span></div><div><b>' + C('date') + ':</b> ' + esc(dt) + '</div></div><p class="cdisc">' + md(C('disclaimer')) + '</p></div></div>' +
          '<button class="btn noprint" onclick="window.print()">' + C('print') + '</button>';
      }
    }
    return h;
  }

  // ---- text helpers ----
  const listOrText = x => {
    if (Array.isArray(x)) return '<ol>' + x.map(i => '<li>' + md(typeof i === 'string' ? i : (i.text || JSON.stringify(i))) + '</li>').join('') + '</ol>';
    return x ? '<p>' + md(x) + '</p>' : '';
  };
  const ul = a => a && a.length ? '<ul>' + arr(a).map(i => '<li>' + md(typeof i === 'string' ? i : (i.text || i.title || JSON.stringify(i))) + '</li>').join('') + '</ul>' : '';
  const table = (h, rows) => '<table>' + (h && h.length ? '<tr>' + h.map(x => '<th>' + md(x) + '</th>').join('') + '</tr>' : '') + arr(rows).map(r => '<tr>' + arr(r).map(c => '<td>' + md(c) + '</td>').join('') + '</tr>').join('') + '</table>';
  const block = b => {
    if (typeof b === 'string') return '<p>' + md(b) + '</p>';
    switch (b.type) {
      case 'paragraph': return '<p>' + md(b.text) + '</p>';
      case 'list': return b.ordered ? '<ol>' + arr(b.items).map(i => '<li>' + md(i) + '</li>').join('') + '</ol>' : ul(b.items);
      case 'table': return table(b.headers, b.rows);
      case 'callout': return '<div class="callout ' + (b.style === 'note' ? 'note' : '') + '">' + md(b.text) + '</div>';
      case 'heading': return '<h4>' + md(b.text) + '</h4>';
      default: return b.text ? '<p>' + md(b.text) + '</p>' : '';
    }
  };
  const details = (title, inner, open) => '<details' + (open ? ' open' : '') + '><summary>' + md(title) + '</summary>' + inner + '</details>';

  // ---- MCQ helpers ----
  const optList = o => { if (Array.isArray(o)) return o; if (typeof o === 'string') return o.split(/\s{2,}|\n/).filter(Boolean); return []; };
  const correctIdx = (q, opts) => {
    const a = String(q.answer || '').trim();
    const m = a.match(/^\(?([A-Da-d])\)?(?:[.)\s]|$)/);
    if (m) return m[1].toUpperCase().charCodeAt(0) - 65;
    const i = opts.findIndex(o => o.toLowerCase().replace(/^[a-d][.)]\s*/, '') === a.toLowerCase());
    return i;
  };
  const stripOpt = o => String(o).replace(/^\s*\(?[A-Da-d][.)]\s*/, '');
  const qHtml = (q, key) => {
    const opts = optList(q.options);
    const saved = store.get('q.' + key, null);
    if (opts.length) {
      const ci = correctIdx(q, opts);
      return '<div class="card" data-q="' + key + '"><div>' + md(q.question) + '</div>' + opts.map((o, i) => {
        let cls = ''; if (saved != null) { if (i === ci) cls = 'right'; else if (i === saved) cls = 'wrong'; }
        return '<button class="opt ' + cls + '" data-pick="' + i + '" data-ci="' + ci + '">' + String.fromCharCode(65 + i) + ') ' + esc(stripOpt(o)) + '</button>';
      }).join('') + (saved != null && q.explanation ? '<div class="callout note">' + md(q.explanation) + '</div>' : '') + '</div>';
    }
    return '<div class="card"><div>' + md(q.question) + '</div><button class="btn alt sm" data-reveal="1">' + T('actions.showAnswer') + '</button><div class="callout" style="display:none">' + md(q.answer) + (q.explanation ? '<br>' + md(q.explanation) : '') + '</div></div>';
  };

  // ---- sections ----
  function rubricBox(d) {
    const p = d.practical || {};
    const sc = arr(p.scoring);
    if (!sc.length) return '';
    const key = 'score.' + d.day, saved = store.get(key, {});
    const total = sc.reduce((a, s, i) => a + (+saved[i] || 0), 0);
    return '<h4>' + T('day.assignment') + ' (' + (p.totalPoints || 20) + ' ' + T('assess.points') + ')</h4><p class="mut">Self-assessment</p>' +
      sc.map((s, i) => '<label>' + md(s.criterion) + ' (0–' + s.points + ') <input type="number" min="0" max="' + s.points + '" value="' + (saved[i] || 0) + '" data-score="' + i + '" style="width:70px"></label><br>').join('') +
      '<p class="score">' + T('assess.yourScore') + ': <span id="scoreTot">' + total + '</span> / ' + (p.totalPoints || 20) + '</p>';
  }
  function gridTool() {
    return '<div class="gridtool noprint"><p class="mut">' + T('day.grid') + ': ' + T('actions.uploadPlan') + ' · ' + T('actions.rotateNorth') + '</p>' +
      '<input type="file" accept="image/*" id="planFile"> <label>N° <input type="range" min="0" max="359" value="0" id="northRot"></label> <button class="btn alt sm" id="gridClear">✕</button>' +
      '<svg id="planSvg" viewBox="0 0 400 400"><defs><pattern id="sq" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#ddd" stroke-width="1"/></pattern></defs>' +
      '<rect width="400" height="400" fill="url(#sq)"/><image id="planImg" x="0" y="0" width="400" height="400" preserveAspectRatio="xMidYMid meet"/>' +
      '<g stroke="#4b2e83" stroke-width="1.5" opacity=".6"><line x1="133" y1="0" x2="133" y2="400"/><line x1="267" y1="0" x2="267" y2="400"/><line x1="0" y1="133" x2="400" y2="133"/><line x1="0" y1="267" x2="400" y2="267"/></g>' +
      '<g id="dirs" font-size="13" fill="#4b2e83" font-weight="700"><text x="200" y="14" text-anchor="middle">N</text><text x="200" y="395" text-anchor="middle">S</text><text x="392" y="205" text-anchor="end">E</text><text x="8" y="205">W</text><text x="392" y="14" text-anchor="end">NE</text><text x="8" y="14">NW</text><text x="392" y="395" text-anchor="end">SE</text><text x="8" y="395">SW</text></g>' +
      '<g id="arrow" transform="translate(200 200) rotate(0)"><line x1="0" y1="30" x2="0" y2="-40" stroke="#c77d1a" stroke-width="4"/><polygon points="0,-55 -9,-35 9,-35" fill="#c77d1a"/><text y="-60" text-anchor="middle" font-size="13" fill="#c77d1a" font-weight="700">N</text></g>' +
      '<g id="ink" fill="none" stroke="#b3261e" stroke-width="2" stroke-linecap="round"></g></svg></div>';
  }
  function fwTable(d) {
    const t = arr(d.frameworkTable);
    if (!t.length) return '';
    return '<div class="card fw"><h3>' + T('day.framework') + '</h3><div class="callout">' + md(d.frameworkLabel || ui().disclaimer.frameworkLabel) + '</div>' +
      table([T('day.framework'), 'Commonly taught', 'Variation', 'Practical check'].map((x, i) => i === 0 ? x : x), t.map(r => [r.element, r.preference, r.variation, r.practicalCheck])) +
      '<p class="mut">' + md(ui().disclaimer.deviation) + '</p></div>';
  }
  function weeklyTest(wt, id) {
    if (!wt) return '';
    const parts = arr(wt.parts);
    let n = 0;
    let html = '<div class="card"><h2>' + md(wt.title) + '</h2><p class="mut">' + T('assess.timeLimit') + ': ' + wt.minutes + ' ' + T('assess.minutes') + ' · ' + T('assess.passMark') + ': ' + wt.passMark + '%</p>' + (wt.format ? '<p>' + md(wt.format) + '</p>' : '');
    parts.forEach(p => {
      html += '<h3>' + md(p.title) + '</h3>';
      arr(p.questions).forEach(q => { html += qHtml(q, id + '.' + (q.id || n)); n++; });
      arr(p.tasks).forEach(t => { html += '<div class="card"><div>' + md(t.task || t.question || t.text || t.title || '') + '</div>' + (t.modelAnswer || t.answer ? details(T('case.modelAnswer'), listOrText(t.modelAnswer || t.answer)) : '') + '</div>'; });
    });
    return html + '</div>';
  }

  // ---- pages ----
  const insList = () => arr(R.instructors);
  const initials = n => String(n).split(/\s+/).map(w => w[0]).slice(0, 2).join('');
  const avatar = p => p.photo ? '<img class="avatar" alt="' + esc(p.name[lang]) + '" src="' + p.photo + '">' : '<div class="avatar ph">' + esc(initials(p.name[lang])) + '</div>';
  function pageInstructors() {
    return '<h1 class="day">' + C('meet') + '</h1>' + insList().map(p => '<div class="card insfull"><div class="inshead">' + avatar(p) + '<div><h2 style="margin:0">' + esc(p.name[lang]) + '</h2><div class="mut">' + esc(p.title[lang]) + '</div></div></div>' + arr(p.bio[lang]).map(t => '<p>' + md(t) + '</p>').join('') + '</div>').join('');
  }
  function pageHome() {
    const intro = dayObj(0) || {};
    const dn = done(), cnt = NUMS.filter(n => dn[n]).length;
    return '<div class="hero"><div class="mut" style="color:#fff9">' + esc(ui().brand) + '</div><h1>' + esc(ui().appName) + '</h1><p>' + esc((intro.tagline || '')) + '</p><p>' + cnt + ' / 14 ' + T('status.completed') + '</p>' +
      '<p class="mut" style="color:#fff">' + C('by') + ': ' + C('instructors') + '</p><p style="color:#fff">' + C('selfPaced') + '</p>' + (() => { const nx = NUMS.find(n => !subs()[n]); return nx ? '<button class="btn" data-go="day' + nx + '">' + (subCount() ? C('continueAt') + ' ' + nx : T('actions.start')) + '</button>' : '<button class="btn" data-go="cert">' + C('allDone') + '</button>'; })() + '<button class="btn alt" data-go="day0">' + esc(intro.title || 'Introduction') + '</button></div>' +
      '<h2>' + C('meet') + '</h2><div class="grid ins">' + insList().map(p => '<div class="card inscard" data-go="instructors">' + avatar(p) + '<div><b>' + esc(p.name[lang]) + '</b><div class="mut">' + esc(p.title[lang]) + '</div><p>' + esc(p.short[lang]) + '</p><span class="tag">' + C('readProfile') + ' →</span></div></div>').join('') + '</div>' +
      '<h2>' + T('nav.course') + '</h2><div class="grid">' + NUMS.map(n => { const d = dayObj(n); return d ? '<div class="card" data-go="day' + n + '"><span class="tag">' + T('day.day') + ' ' + n + '</span>' + (dn[n] ? '✓' : '') + '<div>' + esc(d.title) + '</div><div class="mut">90 ' + T('assess.minutes') + '</div></div>' : ''; }).join('') + '</div>';
  }
  function pageIntro() {
    const d = dayObj(0); if (!d) return '<p>…</p>';
    const sec = (t, h) => h ? '<div class="card"><h3>' + t + '</h3>' + h + '</div>' : '';
    return '<h1 class="day">' + esc(d.title) + '</h1><p class="mut">' + esc(d.edition || '') + '</p>' + (d.tagline ? '<div class="callout">' + md(d.tagline) + '</div>' : '') +
      sec('Overview', arr(d.overview).map(p => '<p>' + md(p) + '</p>').join('')) + sec('', d.instructorNote ? '<p>' + md(d.instructorNote) + '</p>' : '') +
      sec('Audience', ul(d.audience)) + sec('Prerequisites', ul(d.prerequisites)) + sec('How to use', '<ol>' + arr(d.howToUse).map(i => '<li>' + md(i) + '</li>').join('') + '</ol>') +
      sec('Format', table([], arr(d.format).map(f => [f.item, f.detail]))) + sec(T('day.rhythm'), table([], arr(d.rhythm).map(r => [r.minutes, r.activity]))) +
      sec('Syllabus', table([], arr(d.syllabus).map(s => [s.day, s.title]))) + sec('', d.assessmentPrinciples ? '<p>' + md(d.assessmentPrinciples) + '</p>' : '') + sec('', d.readinessCheck ? '<p>' + md(d.readinessCheck) + '</p>' : '');
  }
  function pageDay(n) {
    const d = dayObj(n); if (!d) return '<p>Content not available yet.</p>';
    const x = d.extras || {}, dn = done();
    let h = '<span class="tag">' + T('day.day') + ' ' + n + '</span><h1 class="day">' + esc(d.title) + '</h1>';
    h += '<div class="card"><h3>' + T('day.learningQuestion') + '</h3><div class="callout">' + md(d.learningQuestion) + '</div><h3>' + T('day.objectives') + '</h3>' + ul(d.objectives) + details(T('day.rhythm'), table([], arr(d.rhythm).map(r => [r.minutes, r.activity]))) + '</div>';
    h += '<div class="card"><h2>' + T('day.lessons') + '</h2>' + arr(d.lessons).map((l, i) => {
      const gd = arr(d.goDeeper).find(g => g.lessonId === l.id);
      return details((l.id || '') + ' — ' + l.title + (l.focus ? ' · ' + l.focus : ''), arr(l.blocks).map(block).join('') + (gd ? '<div class="card deeper"><h4>🔎 ' + T('day.goDeeper') + ' <span class="tag">' + T('day.optional') + '</span></h4>' + arr(gd.blocks).map(block).join('') + '</div>' : ''), i === 0);
    }).join('') + '</div>';
    h += fwTable(d);
    if (arr(d.checklist).length) h += '<div class="card"><h2>✅ ' + T('day.checklist') + '</h2><ul class="chk">' + arr(d.checklist).map(i => '<li>☐ ' + md(i) + '</li>').join('') + '</ul></div>';
    const caseCard = (c, title) => '<div class="card"><h2>' + title + '</h2><h3>' + md(c.title) + '</h3><p>' + md(c.background) + '</p>' +
        (c.documentsReceived ? '<p><b>' + T('case.received') + ':</b> ' + md(c.documentsReceived) + '</p>' : '') + (c.documentsMissing ? '<p><b>' + T('case.missing') + ':</b> ' + md(c.documentsMissing) + '</p>' : '') +
        (c.wrongFirstReaction ? '<div class="callout"><b>' + T('case.wrongReaction') + ':</b> ' + md(c.wrongFirstReaction) + '</div>' : '') +
        '<h4>' + T('case.questions') + '</h4>' + listOrText(c.questions) + details(T('case.modelAnswer'), listOrText(c.modelAnswer)) + (c.lesson ? '<div class="callout note"><b>' + T('case.lesson') + ':</b> ' + md(c.lesson) + '</div>' : '') + '</div>';
    if (d.caseStudy) h += caseCard(d.caseStudy, T('day.caseStudy'));
    if (d.caseStudyB && d.caseStudyB.title) h += caseCard(d.caseStudyB, T('day.caseStudyB'));
    if (arr(d.miniCases).length) h += '<div class="card"><h2>' + T('day.miniCases') + '</h2>' + arr(d.miniCases).map((m, i) => '<p><b>' + (i + 1) + '.</b> ' + md(m.scenario) + '</p>' + details(T('actions.showAnswer'), '<p>' + md(m.answer) + '</p>')).join('') + '</div>';
    const p = d.practical;
    if (p) {
      h += '<div class="card"><h2>' + T('day.practical') + '</h2>' + (p.intro ? '<p>' + md(p.intro) + '</p>' : '') + '<ol>' + arr(p.steps).map(s => '<li>' + (s && s.minutes ? '<span class="tag">' + s.minutes + ' ' + T('assess.minutes') + '</span>' : '') + md(typeof s === 'string' ? s : s.text) + '</li>').join('') + '</ol>' + rubricBox(d) + submitBox(n) + '</div>';
    }
    h += '<div class="card"><h2>' + T('day.worksheet') + '</h2>' + arr(d.worksheet).map((w, i) => { const v = store.get('ws.' + n + '.' + i, ''); return '<label><b>' + md(w.label || w) + '</b><textarea data-ws="' + i + '">' + esc(v) + '</textarea></label>'; }).join('') +
      (d.gridPage ? '<h3>' + md(d.gridPage.title || T('day.grid')) + '</h3><p>' + md(d.gridPage.description || '') + '</p>' + ul(d.gridPage.items) : '') + gridTool() + '<button class="btn alt noprint" onclick="window.print()">' + T('actions.download') + '</button></div>';
    if (arr(d.extraPractice).length) h += '<div class="card"><h2>' + T('day.extraPractice') + ' <span class="tag">' + T('day.optional') + '</span></h2>' + arr(d.extraPractice).map((e, i) => '<p><b>' + (i + 1) + '.</b> ' + md(e.task) + '</p>' + details(T('actions.showAnswer'), '<p>' + md(e.answer) + '</p>')).join('') + '</div>';
    h += '<div class="card"><h2>' + T('day.summary') + '</h2><p>' + md(d.summary) + '</p>' + (d.takeHome ? '<div class="callout"><b>' + T('day.takeHome') + ':</b> ' + md(d.takeHome) + '</div>' : '') + '</div>';
    h += '<h2>' + T('day.knowledgeCheck') + '</h2>' + arr(d.knowledgeCheck).map(q => qHtml(q, q.id)).join('');
    if (x.weeklyTest) h += weeklyTest(x.weeklyTest, 'wt' + n);
    h += '<div class="card"><h2>' + T('day.flashcards') + '</h2><button class="btn" data-go="cards' + n + '">' + T('nav.flashcards') + ' (' + arr(d.flashcards).length + ')</button></div>';
    h += '<div class="card"><h2>' + T('day.faq') + '</h2>' + arr(d.faq).map(f => details(f.q, '<p>' + md(f.a) + '</p>')).join('') + '</div>';
    h += '<div class="card"><h3>' + T('day.commonMistakes') + '</h3>' + ul(d.commonMistakes) + details(T('day.instructorNotes'), ul(d.instructorNotes)) + '</div>';
    h += '<button class="btn" id="doneBtn">' + (dn[n] ? '✓ ' + T('status.completed') : T('actions.markComplete')) + '</button>';
    if (n > 1) h += '<button class="btn alt" data-go="day' + (n - 1) + '">← ' + T('actions.previous') + '</button>';
    if (n < 14) h += '<button class="btn alt" data-go="day' + (n + 1) + '">' + T('actions.next') + ' →</button>';
    return h;
  }
  let cardState = { i: 0, back: false, list: [] };
  function pageCards(which) {
    const list = [];
    NUMS.forEach(n => { if (which === 'all' || +which === n) { const d = dayObj(n); if (d) arr(d.flashcards).forEach(f => list.push(Object.assign({ day: n }, f))); } });
    if (cardState.key !== which) cardState = { i: 0, back: false, list, key: which }; else cardState.list = list;
    const known = store.get('known', {});
    let h = '<h1 class="day">' + T('nav.flashcards') + '</h1><div class="noprint"><button class="btn alt sm" data-go="cardsall">All</button>' + NUMS.map(n => '<button class="btn alt sm" data-go="cards' + n + '">' + n + '</button>').join('') + '</div>';
    if (!list.length) return h + '<p>…</p>';
    const c = list[cardState.i % list.length];
    h += '<p class="mut">' + (cardState.i % list.length + 1) + ' / ' + list.length + ' · ' + T('day.day') + ' ' + c.day + (known[c.id] ? ' ✓' : '') + '</p><div class="fc ' + (cardState.back ? 'back' : '') + '" id="fc"><div>' + md(cardState.back ? c.back : c.front) + '</div></div>' +
      '<button class="btn alt" id="fcPrev">←</button><button class="btn alt" id="fcFlip">' + T('actions.flip') + '</button><button class="btn" id="fcKnew">' + T('actions.knewIt') + '</button><button class="btn alt" id="fcNext">→</button>';
    return h;
  }
  function pageGlossary(q) {
    const seen = {}; const rows = [];
    NUMS.forEach(n => { const d = dayObj(n); if (d) arr(d.glossary).forEach(g => { const k = g.id || g.term; if (!seen[k] && g.term) { seen[k] = 1; rows.push(Object.assign({}, g, { definition: g.definition || ((R.gdefs || {})[g.id] || {})[lang] || null })); } }); });
    rows.sort((a, b) => a.term.localeCompare(b.term, lang));
    return '<h1 class="day">' + T('nav.glossary') + ' (' + rows.length + ')</h1><input type="text" id="gq" placeholder="' + T('actions.search') + '" value="' + esc(q || '') + '">' + table([], rows.filter(g => !q || (g.term + ' ' + (g.definition || '')).toLowerCase().includes(q.toLowerCase())).map(g => ['**' + g.term + '**', g.definition || '—']));
  }
  function pageFaq() {
    return '<h1 class="day">' + T('nav.faq') + '</h1>' + NUMS.map(n => { const d = dayObj(n); return d && arr(d.faq).length ? '<div class="card"><h3>' + T('day.day') + ' ' + n + ' — ' + esc(d.title) + '</h3>' + arr(d.faq).map(f => details(f.q, '<p>' + md(f.a) + '</p>')).join('') + '</div>' : ''; }).join('');
  }
  function pageTest(n) {
    const d = dayObj(n); const wt = d && d.extras && d.extras.weeklyTest;
    return '<h1 class="day">' + T('assess.weeklyTest') + ' ' + (n === 7 ? 1 : 2) + '</h1>' + (wt ? weeklyTest(wt, 'wt' + n) : '<p>…</p>');
  }
  function pageFramework() {
    return '<h1 class="day">' + T('day.framework') + '</h1><div class="callout">' + md(ui().disclaimer.frameworkLabel) + '</div>' + NUMS.map(n => { const d = dayObj(n); return d && arr(d.frameworkTable).length ? '<h3>' + T('day.day') + ' ' + n + ' — ' + esc(d.title) + '</h3>' + table([], arr(d.frameworkTable).map(r => ['**' + r.element + '**', r.preference, r.variation, r.practicalCheck])) : ''; }).join('');
  }
  function pageSearch(q) {
    const res = []; const ql = q.toLowerCase();
    const hit = s => s && String(s).toLowerCase().includes(ql);
    NUMS.forEach(n => { const d = dayObj(n); if (!d) return;
      arr(d.lessons).forEach(l => { if (hit(l.title) || arr(l.blocks).some(b => hit(JSON.stringify(b)))) res.push(['day' + n, T('day.day') + ' ' + n + ' · ' + l.title]); });
      arr(d.glossary).forEach(g => { if (hit(g.term) || hit(g.definition || ((R.gdefs || {})[g.id] || {})[lang])) res.push(['glossary', g.term]); });
      arr(d.faq).forEach(f => { if (hit(f.q) || hit(f.a)) res.push(['faq', f.q]); });
      arr(d.flashcards).forEach(f => { if (hit(f.front) || hit(f.back)) res.push(['cards' + n, f.front]); });
    });
    return '<h1 class="day">“' + esc(q) + '” (' + res.length + ')</h1>' + res.slice(0, 80).map(r => '<div class="card" data-go="' + r[0] + '">' + md(r[1]) + '</div>').join('');
  }

  // ---- shell ----
  function renderTop() {
    $('#brandSub').textContent = ui().brand;
    $('#langBtn').textContent = lang === 'en' ? 'हिंदी' : 'English';
    const dn = done(); $('#progressPill').textContent = NUMS.filter(n => dn[n]).length + '/14';
    $('#search').placeholder = T('actions.search') + '…';
    $('#disc').textContent = ui().disclaimer.footer;
    document.documentElement.lang = lang;
  }
  function renderSide() {
    const dn = done();
    const link = (r, label, sm) => '<a data-go="' + r + '" class="' + (route === r ? 'on' : '') + '"><span>' + label + '</span><small>' + (sm || '') + '</small></a>';
    let h = link('home', '🏠 ' + T('nav.home')) + link('instructors', '👤 ' + C('meet')) + '<h4>' + T('nav.course') + '</h4>' + link('day0', (dayObj(0) || {}).title || 'Intro');
    NUMS.forEach(n => { const d = dayObj(n); h += link('day' + n, n + '. ' + (d ? d.title : ''), dn[n] ? '✓' : ''); });
    h += '<h4>' + T('nav.tests') + '</h4>' + link('test7', T('assess.weeklyTest') + ' 1') + link('test14', T('assess.weeklyTest') + ' 2') +
      '<h4>' + T('nav.workbook') + '</h4>' + link('cardsall', T('nav.flashcards')) + link('glossary', T('nav.glossary')) + link('faq', T('nav.faq')) + link('framework', T('day.framework')) + '<h4>' + C('nav') + '</h4>' + link('cert', '🎓 ' + C('nav'), subCount() + '/14');
    $('#side').innerHTML = h;
    $('#side').querySelectorAll('[data-go]').forEach(e => e.addEventListener('click', () => go(e.dataset.go)));
  }
  function render() {
    let h; const m = $('#main');
    if (route === 'home') h = pageHome();
    else if (route === 'day0') h = pageIntro();
    else if (/^day\d+$/.test(route)) h = pageDay(+route.slice(3));
    else if (route.startsWith('cards')) h = pageCards(route.slice(5));
    else if (route === 'glossary') h = pageGlossary('');
    else if (route === 'faq') h = pageFaq();
    else if (/^test\d+$/.test(route)) h = pageTest(+route.slice(4));
    else if (route === 'framework') h = pageFramework();
    else if (route === 'cert') h = pageCert();
    else if (route === 'instructors') h = pageInstructors();
    else if (route.startsWith('search:')) h = pageSearch(route.slice(7));
    else h = pageHome();
    m.innerHTML = h; bind(m);
  }
  function go(r) { route = r; store.set('route', r); renderSide(); render(); window.scrollTo(0, 0); $('#side').classList.remove('open'); }

  function bind(m) {
    m.querySelectorAll('[data-go]').forEach(e => e.addEventListener('click', () => go(e.dataset.go)));
    m.querySelectorAll('[data-reveal]').forEach(b => b.addEventListener('click', () => { const nx = b.nextElementSibling; nx.style.display = nx.style.display === 'none' ? 'block' : 'none'; }));
    m.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => { const card = b.closest('[data-q]'); store.set('q.' + card.dataset.q, +b.dataset.pick); const y = window.scrollY; render(); window.scrollTo(0, y); }));
    m.querySelectorAll('[data-ws]').forEach(t => t.addEventListener('input', () => store.set('ws.' + route.slice(3) + '.' + t.dataset.ws, t.value)));
    m.querySelectorAll('[data-score]').forEach(i => i.addEventListener('input', () => {
      const k = 'score.' + route.slice(3), s = store.get(k, {}); s[i.dataset.score] = Math.max(0, Math.min(+i.max, +i.value || 0)); store.set(k, s);
      $('#scoreTot').textContent = Object.keys(s).reduce((a, x) => a + (+s[x] || 0), 0); }));
    const sb = $('#subBtn');
    if (sb && !sb.disabled) sb.addEventListener('click', () => {
      const n = +route.slice(3);
      const hasWs = arr((dayObj(n) || {}).worksheet).some((w, i) => String(store.get('ws.' + n + '.' + i, '')).trim());
      const sc = store.get('score.' + n, {}); const hasSc = Object.keys(sc).some(k => +sc[k] > 0);
      if (!hasWs && !hasSc) { $('#subMsg').textContent = ' ' + C('needText'); return; }
      const s = subs(); s[n] = true; store.set('sub', s); renderSide(); render();
    });
    const cg = $('#certGo'); if (cg) cg.addEventListener('click', () => { const v = $('#certName').value.trim(); if (v) { store.set('certName', v); render(); } });
    const db = $('#doneBtn'); if (db) db.addEventListener('click', () => toggleDone(+route.slice(3)));
    const gq = $('#gq'); if (gq) gq.addEventListener('input', () => { const pos = gq.selectionStart; m.innerHTML = pageGlossary(gq.value); bind(m); const n = $('#gq'); n.focus(); n.setSelectionRange(pos, pos); });
    const fc = $('#fc');
    if (fc) {
      const L = () => cardState.list.length;
      const re = () => { m.innerHTML = pageCards(route.slice(5)); bind(m); };
      $('#fc').addEventListener('click', () => { cardState.back = !cardState.back; re(); });
      $('#fcFlip').addEventListener('click', () => { cardState.back = !cardState.back; re(); });
      $('#fcNext').addEventListener('click', () => { cardState.i = (cardState.i + 1) % L(); cardState.back = false; re(); });
      $('#fcPrev').addEventListener('click', () => { cardState.i = (cardState.i - 1 + L()) % L(); cardState.back = false; re(); });
      $('#fcKnew').addEventListener('click', () => { const c = cardState.list[cardState.i % L()], k = store.get('known', {}); k[c.id] = true; store.set('known', k); cardState.i = (cardState.i + 1) % L(); cardState.back = false; re(); });
    }
    // grid tool
    const svg = $('#planSvg');
    if (svg) {
      const rot = $('#northRot'); rot.addEventListener('input', () => $('#arrow').setAttribute('transform', 'translate(200 200) rotate(' + rot.value + ')'));
      $('#planFile').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => $('#planImg').setAttribute('href', r.result); r.readAsDataURL(f); });
      $('#gridClear').addEventListener('click', () => { $('#ink').innerHTML = ''; });
      let cur = null; const pt = ev => { const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
      svg.addEventListener('pointerdown', ev => { svg.setPointerCapture(ev.pointerId); const p = pt(ev); cur = document.createElementNS('http://www.w3.org/2000/svg', 'path'); cur.setAttribute('d', 'M' + p.x + ' ' + p.y); $('#ink').appendChild(cur); });
      svg.addEventListener('pointermove', ev => { if (!cur) return; const p = pt(ev); cur.setAttribute('d', cur.getAttribute('d') + ' L' + p.x + ' ' + p.y); });
      svg.addEventListener('pointerup', () => { cur = null; });
    }
  }

  $('#langBtn').addEventListener('click', () => { lang = lang === 'en' ? 'hi' : 'en'; store.set('lang', lang); cardState = { i: 0, back: false, list: [] }; renderTop(); renderSide(); render(); });
  $('#menuBtn').addEventListener('click', () => $('#side').classList.toggle('open'));
  let st; $('#search').addEventListener('input', e => { clearTimeout(st); st = setTimeout(() => { const q = e.target.value.trim(); if (q.length > 1) { route = 'search:' + q; render(); } else if (!q) go('home'); }, 250); });
  renderTop(); renderSide(); render();
})();
