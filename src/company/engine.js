// Match a question, run every registered recipe, and diff shared steps inside the cluster.
import {AGENTS, QUESTIONS} from './registry.js'
import {OPS, runAgent} from './ops.js'
import {COMPANY, DEFAULT_FLAGS, SOURCES} from './warehouse.js'

const STOP = new Set('how many much what which who is are was were the a an our we do does of for to in on this that it be can with my me show list give all any per whats whats your you just from about right now please tell'.split(' '))
const PATH_ROLES = ['source', 'window', 'qualify', 'scope', 'aggregate']

function norm(s) {
  return String(s || '').toLowerCase().replace(/['’]/g, '')
}

function tokens(s) {
  return norm(s).split(/[^a-z0-9]+/).filter(t => t.length > 1 && !STOP.has(t))
}

function lev(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 9
  const d = [...Array(b.length + 1).keys()]
  for (let i = 1; i <= a.length; i++) {
    let p = d[0]
    d[0] = i
    for (let j = 1; j <= b.length; j++) {
      const t = d[j]
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, p + (a[i - 1] === b[j - 1] ? 0 : 1))
      p = t
    }
  }
  return d[b.length]
}

export function matchQuestion(text, questions = QUESTIONS) {
  const raw = String(text || '').trim()
  if (!raw) return null
  const q = norm(raw)
  const toks = tokens(raw)
  let best = null
  let second = 0
  for (const question of questions) {
    let score = 0
    const ask = norm(question.ask)
    if (q === ask) score += 20
    else if (q.includes(ask) || (ask.includes(q) && q.length > 18)) score += 12
    for (const signal of question.signals) {
      const s = norm(signal)
      if (q.includes(s)) score += 6
      else {
        const st = tokens(signal)
        if (st.length && st.every(t => toks.includes(t))) score += 4
      }
    }
    const pool = [...tokens(question.ask), ...question.signals.flatMap(s => tokens(s))]
    let overlap = 0
    for (const t of toks) {
      if (t.length < 4) continue
      if (pool.includes(t)) overlap++
      else if (t.length >= 5 && pool.some(w => w.length >= 4 && lev(t, w) <= (t.length >= 8 ? 2 : 1))) overlap++
    }
    score += overlap
    if (!best || score > best.score) {
      second = best ? best.score : 0
      best = {question, score}
    } else if (score > second) second = score
  }
  if (!best || best.score < 6) return null
  if (second >= 6 && best.score < second + 2) return null
  return best
}

function buildCluster(question, runs, byId) {
  const cards = runs.map(run => ({agent: byId.get(run.agentId), run}))
  const answers = []
  for (const card of cards) {
    let group = answers.find(a => a.key === card.run.finalKey)
    if (!group) {
      group = {key: card.run.finalKey, text: card.run.finalText, value: card.run.finalValue, agents: []}
      answers.push(group)
    }
    group.agents.push(card.agent)
  }
  const paths = []
  for (const role of PATH_ROLES) {
    const cells = cards.map(card => {
      const step = card.run.steps.find(s => s.role === role) || null
      return {agent: card.agent, step}
    })
    const present = cells.filter(c => c.step)
    if (!present.length) continue
    const freq = new Map()
    for (const cell of present) freq.set(cell.step.valueKey, (freq.get(cell.step.valueKey) || 0) + 1)
    const max = Math.max(...freq.values())
    const leaders = [...freq.values()].filter(v => v === max).length
    let quietKey = null
    if (leaders === 1 && max >= 2) {
      for (const [key, n] of freq) if (n === max) quietKey = key
    }
    const bindingsByKey = new Map()
    for (const cell of present) {
      if (!cell.step.binding) continue
      const set = bindingsByKey.get(cell.step.valueKey) || new Set()
      set.add(cell.step.binding)
      bindingsByKey.set(cell.step.valueKey, set)
    }
    const bindings = new Set(present.map(c => c.step.binding).filter(Boolean))
    paths.push({
      role,
      label: present[0].step.roleLabel,
      split: freq.size > 1,
      bindingsDiffer: bindings.size > 1,
      cells: cells.map(cell => {
      const count = cell.step ? (freq.get(cell.step.valueKey) || 0) : 0
      const diverges = !!(cell.step && freq.size > 1 && cell.step.valueKey !== quietKey)
      return {
        agentId: cell.agent.id,
        missing: !cell.step,
        text: cell.step ? cell.step.text : '',
        label: cell.step ? cell.step.label : '',
        valueKey: cell.step ? cell.step.valueKey : null,
        binding: cell.step ? cell.step.binding : null,
        official: cell.step ? cell.step.official : null,
        duplicateOf: cell.step ? cell.step.duplicateOf : null,
        diverges,
        lone: diverges && count === 1,
        differentFile: !!(cell.step && (bindingsByKey.get(cell.step.valueKey)?.size || 0) > 1),
      }
    }),
    })
  }
  return {
    question,
    cards,
    answers,
    paths,
    splits: paths.filter(p => p.split),
    recipeCount: cards.filter(c => c.agent.depth === 'recipe').length,
    thinCount: cards.filter(c => c.agent.depth === 'instructions').length,
  }
}

export function validateRegistry(agents = AGENTS, questions = QUESTIONS, sources = SOURCES) {
  const errors = []
  const qids = new Set(questions.map(q => q.id))
  const seen = new Set()
  for (const agent of agents) {
    if (seen.has(agent.id)) errors.push(`duplicate agent ${agent.id}`)
    seen.add(agent.id)
    if (!qids.has(agent.questionId)) errors.push(`${agent.id} has unknown question ${agent.questionId}`)
    for (const key of ['section', 'team', 'owner', 'verb', 'role', 'note']) {
      if (!agent[key]) errors.push(`${agent.id} missing ${key}`)
    }
    if (agent.depth !== 'recipe' && agent.depth !== 'instructions') errors.push(`${agent.id} bad depth`)
    const roles = new Set()
    let answer = false
    let read = false
    for (const step of agent.steps) {
      if (!OPS.has(step.op)) errors.push(`${agent.id} unknown op ${step.op}`)
      if (roles.has(step.role)) errors.push(`${agent.id} repeated role ${step.role}`)
      roles.add(step.role)
      if (step.role === 'answer') answer = true
      if (step.op === 'read_rows' || step.op === 'read_doc') read = true
      if (step.source && !sources[step.source]) errors.push(`${agent.id} unknown source ${step.source}`)
      if (step.doc && !sources[step.doc]) errors.push(`${agent.id} unknown doc source ${step.doc}`)
    }
    if (!answer) errors.push(`${agent.id} has no answer step`)
    if (agent.depth === 'recipe' && !read) errors.push(`${agent.id} recipe does not read a source`)
    if (agent.depth === 'instructions' && read) errors.push(`${agent.id} instructions agent reads a source`)
    if (agent.depth === 'instructions' && !roles.has('instructions')) errors.push(`${agent.id} missing instructions`)
  }
  for (const question of questions) {
    if (!agents.some(a => a.questionId === question.id)) errors.push(`question ${question.id} has no agents`)
  }
  return errors
}

export function runScan(flags = DEFAULT_FLAGS) {
  const applied = {
    qualifyStageMin: flags.qualifyStageMin === 4 ? 4 : 3,
    shadowCaughtUp: !!flags.shadowCaughtUp,
  }
  const byId = new Map(AGENTS.map(agent => [agent.id, agent]))
  const runs = AGENTS.map(agent => runAgent(agent, applied))
  const clusters = QUESTIONS.map(question => buildCluster(
    question,
    runs.filter(run => byId.get(run.agentId).questionId === question.id),
    byId,
  ))
  return {seed: COMPANY.seed, company: COMPANY.name, flags: applied, runs, clusters}
}

export function summarize(scan) {
  const questions = scan.clusters.map(cluster => ({
    id: cluster.question.id,
    ask: cluster.question.ask,
    section: cluster.question.section,
    kind: cluster.question.kind,
    agents: cluster.cards.length,
    answers: cluster.answers.length,
    splits: cluster.splits.length,
    recipes: cluster.recipeCount,
    thin: cluster.thinCount,
  }))
  const hero = scan.runs.find(run => run.agentId === 'sales.live.qualified')
  const shadow = scan.runs.find(run => run.agentId === 'sales.shadow.qualified')
  return {
    seed: scan.seed,
    flags: scan.flags,
    agents: scan.runs.length,
    questions: questions.length,
    openQuestions: questions.filter(q => q.answers > 1).length,
    splits: questions.reduce((sum, q) => sum + q.splits, 0),
    heroText: hero ? hero.finalText : '—',
    heroValue: hero ? hero.finalValue : null,
    shadowText: shadow ? shadow.finalText : '—',
    shadowValue: shadow ? shadow.finalValue : null,
    questionsDetail: questions,
  }
}

let applied = {...DEFAULT_FLAGS}
let last = null

export function currentFlags() {
  return {...applied}
}

export function lastScan() {
  if (!last) last = runScan(applied)
  return last
}

export function rescan(next) {
  applied = {...applied, ...next}
  last = runScan(applied)
  return last
}

// The buyer card shows three agents: the official file, a stale copy, and a note
// that never opens a file. Extra agents stay in the full cluster.
export function buyerLanes(cluster) {
  const cards = cluster?.cards || []
  const sourceStep = card => card.run.steps.find(step => step.binding)
  const official = cards.find(card => sourceStep(card)?.official)
  const copy = cards.find(card => sourceStep(card)?.duplicateOf)
  const thin = cards.find(card => card.agent.depth === 'instructions')
  const picked = []
  for (const card of [official, copy, thin]) {
    if (card && !picked.includes(card)) picked.push(card)
  }
  for (const card of cards) {
    if (picked.length >= 3) break
    if (!picked.includes(card)) picked.push(card)
  }
  return picked.slice(0, 3)
}

export function ask(text, scan = lastScan()) {
  const hit = matchQuestion(text)
  if (!hit) return {query: String(text || '').trim(), match: null, cluster: null}
  return {
    query: String(text || '').trim(),
    match: hit,
    cluster: scan.clusters.find(cluster => cluster.question.id === hit.question.id) || null,
  }
}
