// Chat → same-question match → cluster, read from the last deterministic scan.
import './company.css'
import {QUESTIONS} from './registry.js'
import {ask, currentFlags, lastScan, rescan, summarize} from './engine.js'
import {COMPANY, DEFAULT_FLAGS} from './warehouse.js'

const SS = 'concord-meridian-flags-v1'
const TOOL = {
  claude: {n: 'Claude', c: '#82B9D9'},
  n8n: {n: 'n8n', c: '#58A2CD'},
  chatgpt: {n: 'ChatGPT', c: '#ABD1E6'},
}
const esc = s => String(s ?? '').replace(/[&<>"]/g, m => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[m]))

function readStored() {
  try {
    const raw = sessionStorage.getItem(SS)
    if (!raw) return null
    const p = JSON.parse(raw)
    return {qualifyStageMin: p.qualifyStageMin === 4 ? 4 : 3, shadowCaughtUp: !!p.shadowCaughtUp}
  } catch (e) {
    return null
  }
}

const stored = readStored()
if (stored && (stored.qualifyStageMin !== DEFAULT_FLAGS.qualifyStageMin || stored.shadowCaughtUp !== DEFAULT_FLAGS.shadowCaughtUp)) {
  rescan(stored)
}

const ui = {
  pending: stored || {...DEFAULT_FLAGS},
  turns: [],
  scroll: false,
}

function flagsEqual(a, b) {
  return a.qualifyStageMin === b.qualifyStageMin && !!a.shadowCaughtUp === !!b.shadowCaughtUp
}

function persistAndScan() {
  rescan(ui.pending)
  try { sessionStorage.setItem(SS, JSON.stringify(currentFlags())) } catch (e) {}
  const scan = lastScan()
  ui.turns = ui.turns.map(turn => turn.questionId
    ? {...turn, cluster: scan.clusters.find(c => c.question.id === turn.questionId) || null}
    : turn)
}

function toolTag(key) {
  const t = TOOL[key] || {n: key || 'Recipe', c: '#9AABB3'}
  return `<span class="ptag"><i style="background:${t.c}"></i>Built in ${esc(t.n)}</span>`
}

function depthTag(agent) {
  return agent.depth === 'instructions'
    ? '<span class="co-depth co-depth-thin">Instructions + final only</span>'
    : `<span class="co-depth">Recipe · ${agent.steps.length} steps</span>`
}

function answerBoard(cluster) {
  return `<div class="co-answers">${cluster.answers.map(group => {
    const long = !/^\$[\d,]+$/.test(group.text)
    const who = group.agents.map(a => `<div class="co-awho-block">${toolTag(a.tool)}<p class="co-awho"><b>${esc(a.owner)}</b> · ${esc(a.role)}</p><p class="co-averb">${esc(a.verb)}</p>${depthTag(a)}<p class="co-anote">${esc(a.note)}</p></div>`).join('')
    return `<article class="co-answer ${long ? 'is-long' : ''}"><p class="co-aval">${esc(group.text)}</p>${who}</article>`
  }).join('')}</div>`
}

function pathBlock(cluster) {
  const thin = cluster.cards.filter(c => c.agent.depth === 'instructions')
  const roles = cluster.paths.map(path => {
    const present = path.cells.filter(c => !c.missing)
    const missing = path.cells.filter(c => c.missing).map(c => cluster.cards.find(card => card.agent.id === c.agentId).agent)
    const cells = present.map(cell => {
      const agent = cluster.cards.find(card => card.agent.id === cell.agentId).agent
      const mark = cell.lone ? '<span class="co-mark co-mark-split">Split</span>'
        : cell.differentFile ? '<span class="co-mark co-mark-file">Same output, different file</span>'
        : ''
      const src = cell.duplicateOf ? '<span class="co-src co-src-copy">Stale copy</span>'
        : cell.official ? '<span class="co-src co-src-off">Official source</span>' : ''
      const tone = cell.lone ? 'is-split' : cell.diverges ? 'is-alt' : 'is-same'
      return `<div class="co-cell ${tone}"><div class="co-cellh"><b>${esc(agent.owner)}</b>${mark}</div><div class="co-cellsub">${esc(agent.team)} · ${esc(agent.role)} ${src}</div><div class="co-celllab">${esc(cell.label)}</div><div class="co-cellout">${esc(cell.text)}</div></div>`
    }).join('')
    const miss = missing.length ? `<p class="co-miss">No ${esc(path.label.toLowerCase())} step — ${missing.map(a => esc(a.owner)).join(', ')}</p>` : ''
    return `<section class="co-role"><div class="co-roleh"><h3>${esc(path.label)}</h3>${path.split ? '<span class="co-mark co-mark-split">Mid-path split</span>' : '<span class="co-mark co-mark-same">Same step</span>'}</div><div class="co-cells">${cells}</div>${miss}</section>`
  }).join('')
  const thinNote = thin.length ? `<aside class="co-thin"><b>Instructions + final only.</b> ${thin.map(c => esc(c.agent.owner)).join(', ')} ${thin.length > 1 ? 'have' : 'has'} no shared steps. The final is still in the cluster, so both check depths are on this question.</aside>` : ''
  return `<div class="co-path"><div class="co-pathh"><h3>Path</h3><p>Shared steps line up by role. A split is a step that was the same kind of work and came out different. Nothing here is averaged.</p></div>${thinNote}${roles}</div>`
}

function traces(cluster) {
  return `<div class="co-traces">${cluster.cards.map(({agent, run}) => `<details class="co-trace"><summary>${esc(agent.owner)} · ${esc(agent.verb)} · ${esc(run.finalText)}</summary><p>${esc(agent.note)}</p><ol>${run.steps.map(step => `<li><span>${esc(step.roleLabel)}</span><b>${esc(step.label)}</b><em>${esc(step.text)}</em></li>`).join('')}</ol></details>`).join('')}</div>`
}

function clusterView(cluster, latest) {
  const q = cluster.question
  const where = q.kind === 'section'
    ? `Same section · ${q.section}. Shared steps are compared inside ${q.section}.`
    : 'Company-wide. These agents sit on different teams. One of them is on a stale copy of the same fact.'
  return `<article class="co-cluster card"${latest ? ' id="co-latest" tabindex="-1"' : ''}><header class="co-ch"><p class="co-kicker">${esc(where)}</p><h2>“${esc(q.ask)}”</h2><p class="co-meta">${cluster.cards.length} agents · ${cluster.answers.length} ${cluster.answers.length === 1 ? 'answer' : 'answers'} · ${cluster.splits.length} mid-path ${cluster.splits.length === 1 ? 'split' : 'splits'} · ${cluster.recipeCount} recipes${cluster.thinCount ? ` · ${cluster.thinCount} instructions only` : ''}</p><p class="co-blend">Concord did not blend these into one answer.</p></header><div class="co-body">${answerBoard(cluster)}${pathBlock(cluster)}${traces(cluster)}</div></article>`
}

function turnView(turn, index) {
  const q = `<p class="co-you"><span>You asked</span> ${esc(turn.query)}</p>`
  const latest = index === ui.turns.length - 1
  if (!turn.cluster) return `<div class="co-turn">${q}<p class="co-missbox">No registered agent answers that. Try a question below. Concord will not invent a blended reply.</p></div>`
  return `<div class="co-turn">${q}${clusterView(turn.cluster, latest)}</div>`
}

function dash(scan) {
  const s = summarize(scan)
  const pending = !flagsEqual(ui.pending, s.flags)
  const stage = n => `<button type="button" class="fbtn ${ui.pending.qualifyStageMin === n ? 'on' : ''}" data-flag="qualifyStageMin" data-value="${n}" aria-pressed="${ui.pending.qualifyStageMin === n}">Stage ≥ ${n}</button>`
  const shadow = (on, label) => `<button type="button" class="fbtn ${ui.pending.shadowCaughtUp === on ? 'on' : ''}" data-flag="shadowCaughtUp" data-value="${on ? '1' : '0'}" aria-pressed="${ui.pending.shadowCaughtUp === on}">${label}</button>`
  return `<div class="grid g4 co-kpis"><div class="card kpi"><div class="l">Recipe agents</div><div class="v">${s.agents}</div><div class="d">${s.questions} questions in the registry</div></div>
<div class="card kpi"><div class="l">Questions that disagree</div><div class="v">${s.openQuestions}</div><div class="d">${s.splits} mid-path splits in the last scan</div></div>
<div class="card kpi"><div class="l">Jordan · live sheet</div><div class="v co-money">${esc(s.heroText)}</div><div class="d">Qualified pipeline after his recipe</div></div>
<div class="card kpi"><div class="l">Priya · sheet copy</div><div class="v co-money">${esc(s.shadowText)}</div><div class="d">${s.flags.shadowCaughtUp ? 'Copy caught up to the live sheet' : 'Copy still frozen on Oct 6'}</div></div></div>
<div class="card co-flags"><div class="hd"><h3>Data flags</h3><span class="r">Seed ${esc(s.seed)} · last scan stage ≥ ${s.flags.qualifyStageMin} · ${s.flags.shadowCaughtUp ? 'shadow caught up' : 'shadow stale'}</span></div><div class="bd"><div class="co-flagrow"><span>Qualify bar</span><span class="co-flagbtns">${stage(3)}${stage(4)}</span></div><div class="co-flagrow"><span>Priya's pipeline copy</span><span class="co-flagbtns">${shadow(false, 'Stale copy')}${shadow(true, 'Caught up')}</span></div><div class="co-flagact"><button type="button" class="btn p" data-rescan>Rescan</button><button type="button" class="btn" data-flag-reset>Reset flags</button>${pending ? '<p class="co-pending">Flag changed. Rescan reruns every recipe. The numbers above stay on the last scan until then.</p>' : '<p class="co-pending is-quiet">Numbers come from the last scan of the registry. Rescan after a flag change.</p>'}</div></div></div>
<div class="card co-qs"><div class="hd"><h3>Last scan, by question</h3><span class="r">Ask one. The cluster is every agent registered for it.</span></div><div class="bd">${s.questionsDetail.map(q => `<button type="button" class="co-q" data-ask="${esc(q.ask)}"><span><b>${esc(q.ask)}</b><small>${esc(q.section)} · ${q.agents} agents · ${q.recipes} recipes${q.thin ? ` · ${q.thin} instructions only` : ''}</small></span><span class="co-qstat">${q.answers} ${q.answers === 1 ? 'answer' : 'answers'} · ${q.splits} ${q.splits === 1 ? 'split' : 'splits'}</span></button>`).join('')}</div></div>`
}

export function companyPage() {
  const scan = lastScan()
  const chips = QUESTIONS.map(q => `<button type="button" class="schip" data-ask="${esc(q.ask)}">${esc(q.ask)}</button>`).join('')
  return `<div class="page co" id="company"><div class="hrow"><div class="co-intro"><h1>Ask Meridian</h1><p class="sub">A fictional ${COMPANY.people}-person B2B company. Agents are recipes over one shared dataset — not model calls. Ask a workplace question. Concord returns the cluster: every matching agent, and the step where a shared path splits.</p></div></div>
${dash(scan)}
<form class="co-ask sbox big" id="co-form"><label class="co-label" for="coq">Question</label><input id="coq" name="q" autocomplete="off" placeholder="Ask a workplace question" enterkeyhint="send"/><button class="btn p" type="submit">Ask</button></form>
<div class="schips"><span class="dim">Try</span>${chips}</div>
<div class="co-log" aria-live="polite">${ui.turns.map((turn, i) => turnView(turn, i)).join('') || '<p class="co-empty">The scan is already in. Ask a question to see the cluster. Concord reads that scan. It does not pick a winner.</p>'}</div></div>`
}

export function mountCompany(rerender) {
  const root = document.getElementById('company')
  if (!root) return
  if (ui.scroll) {
    ui.scroll = false
    document.getElementById('co-latest')?.scrollIntoView({block: 'start'})
  }
  root.addEventListener('click', e => {
    const askBtn = e.target.closest('[data-ask]')
    if (askBtn) { submit(askBtn.dataset.ask); rerender(); return }
    const flag = e.target.closest('[data-flag]')
    if (flag) {
      if (flag.dataset.flag === 'qualifyStageMin') ui.pending.qualifyStageMin = Number(flag.dataset.value) === 4 ? 4 : 3
      if (flag.dataset.flag === 'shadowCaughtUp') ui.pending.shadowCaughtUp = flag.dataset.value === '1'
      rerender(); return
    }
    if (e.target.closest('[data-rescan]')) { persistAndScan(); rerender(); return }
    if (e.target.closest('[data-flag-reset]')) {
      ui.pending = {...DEFAULT_FLAGS}
      persistAndScan()
      rerender()
    }
  })
  root.addEventListener('submit', e => {
    if (e.target.id !== 'co-form') return
    e.preventDefault()
    const input = root.querySelector('#coq')
    submit(input.value)
    rerender()
  })
}

function submit(text) {
  const query = String(text || '').trim()
  if (!query) return
  const result = ask(query)
  ui.turns.push({
    query,
    questionId: result.cluster ? result.cluster.question.id : null,
    cluster: result.cluster,
  })
  if (ui.turns.length > 4) ui.turns.shift()
  ui.scroll = !!result.cluster
}
