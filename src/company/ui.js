// Pick or ask a question → the agents on it side by side, read from the last deterministic scan.
import './company.css'
import {QUESTIONS} from './registry.js'
import {ask, currentFlags, lastScan, rescan} from './engine.js'
import {COMPANY, DEFAULT_FLAGS, SOURCES} from './warehouse.js'

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
  selected: QUESTIONS.find(q => q.tab)?.id || null,
  open: {},
  miss: null,
  scroll: false,
}

function flagsEqual(a, b) {
  return a.qualifyStageMin === b.qualifyStageMin && !!a.shadowCaughtUp === !!b.shadowCaughtUp
}

function persistAndScan() {
  rescan(ui.pending)
  try { sessionStorage.setItem(SS, JSON.stringify(currentFlags())) } catch (e) {}
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

const TONE = {
  live: {cls: 't-live'},
  copy: {cls: 't-copy'},
  note: {cls: 't-note', badge: 'Note / words only'},
}

function sourceOf(run) {
  const step = run.steps.find(s => s.role === 'source')
  return step && step.binding ? SOURCES[step.binding] : null
}

function toneOf(card) {
  if (card.agent.depth === 'instructions') return {...TONE.note, key: 'note'}
  const src = sourceOf(card.run)
  const key = src && src.official ? 'live' : 'copy'
  return {...TONE[key], key, badge: src ? src.badge : 'Recipe'}
}

const initials = n => n.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
const cardsOf = cluster => {
  const ids = cluster.question.featured || cluster.cards.map(c => c.agent.id)
  return ids.map(id => cluster.cards.find(c => c.agent.id === id)).filter(Boolean)
}
const num = n => ['Zero', 'One', 'Two', 'Three', 'Four', 'Five'][n] || String(n)

function agentCol(card) {
  const t = toneOf(card)
  const {agent, run} = card
  const steps = run.steps.map(step => `<li><b>${esc(step.roleLabel)}</b><span>${esc(step.text)}</span></li>`).join('')
  return `<article class="co-col ${t.cls}"><header class="co-colh"><span class="co-av">${esc(initials(agent.owner))}</span><div><b>${esc(agent.owner)}'s agent</b><small>${esc(agent.team)} · ${esc(agent.role)}</small></div></header>
<span class="co-badge">${esc(t.badge)}</span><p class="co-colsub">${esc(agent.note)}</p><ol class="co-steps">${steps}</ol><p class="co-final">${esc(run.finalText)}</p></article>`
}

function splitRows(cluster, cards) {
  const recipes = cards.filter(c => c.agent.depth === 'recipe')
  const roles = []
  for (const c of recipes) for (const s of c.run.steps) if (s.role !== 'answer' && !roles.includes(s.role)) roles.push(s.role)
  let seenSplit = false
  const rows = roles.map(role => {
    const keys = new Set(recipes.map(c => c.run.steps.find(s => s.role === role)).filter(Boolean).map(s => s.valueKey))
    let state = 'same'
    if (keys.size > 1) { state = seenSplit ? 'carry' : 'split'; seenSplit = true }
    const label = recipes.map(c => c.run.steps.find(s => s.role === role)).find(Boolean).roleLabel
    return {role, state, label: role === 'source' ? 'Source (what each agent read)' : label}
  })
  const open = ui.open[cluster.question.id] ?? rows.find(r => r.state === 'split')?.role ?? null
  const chip = {split: 'Split starts here', carry: 'Gap carries through', same: 'Same step'}
  return rows.map(row => {
    const isOpen = open === row.role
    const cells = isOpen ? `<div class="co-splitcells">${cards.map(card => {
      const t = toneOf(card)
      const step = card.run.steps.find(s => s.role === row.role)
      const note = card.agent.depth === 'instructions' ? card.run.steps.find(s => s.role === 'instructions') : null
      const text = step ? step.text : note && row.role === 'source' ? note.text : note ? 'No step. The answer is written in the note.' : 'No step.'
      return `<div class="co-splitcell ${t.cls}"><small>${esc(card.agent.owner)} · ${esc(t.badge)}</small><p>${esc(text)}</p></div>`
    }).join('')}</div>` : ''
    return `<div class="co-split is-${row.state} ${isOpen ? 'is-open' : ''}"><button type="button" class="co-splith" data-role="${esc(row.role)}" aria-expanded="${isOpen}"><span>${esc(row.label)}</span><span class="co-chip">${chip[row.state]}</span></button>${cells}</div>`
  }).join('')
}

function questionView(cluster) {
  const q = cluster.question
  const cards = cardsOf(cluster)
  const finals = []
  for (const c of cards) if (!finals.some(f => f.run.finalKey === c.run.finalKey)) finals.push(c)
  const n = cards.length
  const head = finals.length > 1 ? `${num(finals.length)} different answers to one question` : 'One answer'
  const others = cluster.cards.length - n
  const more = others > 0 ? `<details class="co-all"><summary>All ${cluster.cards.length} ${esc(q.section)} agents on this question</summary><div class="co-body">${answerBoard(cluster)}${pathBlock(cluster)}${traces(cluster)}</div></details>` : ''
  return `<article class="card co-view" id="co-view" tabindex="-1"><header class="co-vh"><p class="co-kicker">${q.kind === 'section' ? `Same team · ${esc(q.section)}` : 'Company-wide'}</p><h2>“${esc(q.ask)}”</h2><p class="co-meta">${n === 3 ? 'All three' : `All ${n}`} finished · read from the last scan</p></header>
<div class="co-cols">${cards.map(agentCol).join('')}</div>
<h3 class="co-h">${head}</h3>
<div class="co-finals">${finals.map(c => `<div class="co-fin ${toneOf(c).cls}${c.run.finalText.length > 70 ? ' is-long' : ''}"><span class="co-badge">${esc(toneOf(c).badge)}</span><b>${esc(c.run.finalText)}</b><small>${esc(cards.filter(x => x.run.finalKey === c.run.finalKey).map(x => x.agent.owner).join(', '))}</small></div>`).join('')}</div>
${q.story ? `<p class="co-story">${esc(q.story)}</p>` : ''}
<h3 class="co-h">Where they split <small>tap a step</small></h3>
<div class="co-splits">${splitRows(cluster, cards)}</div>
<p class="co-foot">Concord doesn't average these. It shows you which source each answer came from.</p>${more}</article>`
}

function tabs(scan) {
  return `<div class="co-tabs" role="tablist">${QUESTIONS.filter(q => q.tab).map(q => {
    const cluster = scan.clusters.find(c => c.question.id === q.id)
    const cards = cardsOf(cluster)
    const answers = new Set(cards.map(c => c.run.finalKey)).size
    const on = ui.selected === q.id
    return `<button type="button" class="co-tab ${on ? 'on' : ''}" role="tab" aria-selected="${on}" data-pick="${esc(q.id)}"><span class="co-herok">Same team · ${esc(q.section)}</span><b>${esc(q.ask)}</b><small>${cards.length} agents · ${answers} ${answers === 1 ? 'answer' : 'answers'}</small></button>`
  }).join('')}</div>`
}

function flagsCard(scan) {
  const pending = !flagsEqual(ui.pending, scan.flags)
  const stage = n => `<button type="button" class="fbtn ${ui.pending.qualifyStageMin === n ? 'on' : ''}" data-flag="qualifyStageMin" data-value="${n}" aria-pressed="${ui.pending.qualifyStageMin === n}">Stage ≥ ${n}</button>`
  const shadow = (on, label) => `<button type="button" class="fbtn ${ui.pending.shadowCaughtUp === on ? 'on' : ''}" data-flag="shadowCaughtUp" data-value="${on ? '1' : '0'}" aria-pressed="${ui.pending.shadowCaughtUp === on}">${label}</button>`
  return `<div class="card co-flags"><div class="hd"><h3>Change the data, then rescan</h3><span class="r">Seed ${esc(scan.seed)} · last scan stage ≥ ${scan.flags.qualifyStageMin} · ${scan.flags.shadowCaughtUp ? 'copy caught up' : 'copy stale'}</span></div><div class="bd"><div class="co-flagrow"><span>Sales qualify bar</span><span class="co-flagbtns">${stage(3)}${stage(4)}</span></div><div class="co-flagrow"><span>Priya's pipeline copy</span><span class="co-flagbtns">${shadow(false, 'Stale copy')}${shadow(true, 'Caught up')}</span></div><div class="co-flagact"><button type="button" class="btn p" data-rescan>Rescan</button><button type="button" class="btn" data-flag-reset>Reset flags</button>${pending ? '<p class="co-pending">Flag changed. Rescan reruns every recipe. The answers stay on the last scan until then.</p>' : '<p class="co-pending is-quiet">Every answer comes from the last scan of the registry.</p>'}</div></div></div>`
}

export function companyPage() {
  const scan = lastScan()
  const cluster = ui.selected ? scan.clusters.find(c => c.question.id === ui.selected) : null
  const body = ui.miss != null
    ? `<p class="co-missbox">No registered agent answers “${esc(ui.miss)}”. Pick one of the questions above. Concord will not invent a blended reply.</p>`
    : cluster ? questionView(cluster) : '<p class="co-empty">Pick a question. Each one is asked by three people on the same team, and their agents disagree.</p>'
  return `<div class="page co" id="company"><div class="co-intro"><h1>Ask Meridian</h1><p class="sub">A fictional ${COMPANY.people}-person B2B company. People on the same team built agents for the same question and get different answers. Agents are recipes over one shared dataset, not model calls. Pick a question, or ask one.</p></div>
<form class="co-ask sbox big" id="co-form"><label class="co-label" for="coq">Question</label><input id="coq" name="q" autocomplete="off" placeholder="Ask a workplace question" enterkeyhint="send"/><button class="btn p" type="submit">Ask</button></form>
${tabs(scan)}
<div class="co-out" aria-live="polite">${body}</div>
${flagsCard(scan)}</div>`
}

export function resetCompany() {
  try { sessionStorage.removeItem(SS) } catch (e) {}
}

export function mountCompany(rerender) {
  const root = document.getElementById('company')
  if (!root) return
  if (ui.scroll) {
    ui.scroll = false
    document.getElementById('co-view')?.scrollIntoView({block: 'start'})
  }
  root.addEventListener('click', e => {
    const pick = e.target.closest('[data-pick]')
    if (pick) { ui.selected = pick.dataset.pick; ui.miss = null; rerender(); return }
    const role = e.target.closest('[data-role]')
    if (role) {
      const q = ui.selected
      ui.open[q] = ui.open[q] === role.dataset.role ? '' : role.dataset.role
      rerender(); return
    }
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
    const query = String(root.querySelector('#coq').value || '').trim()
    if (!query) return
    const result = ask(query)
    ui.selected = result.cluster ? result.cluster.question.id : ui.selected
    ui.miss = result.cluster ? null : query
    ui.scroll = !!result.cluster
    rerender()
  })
}
