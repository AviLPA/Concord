// Closed interpreter. A new agent is a registry row. A new behavior is one op here.
import {COMPANY, readSource} from './warehouse.js'

export const OPS = new Set([
  'note', 'read_rows', 'read_doc', 'where', 'sum', 'multiply_count',
  'answer_money', 'answer_names', 'answer_doc', 'literal', 'trend', 'answer_trend',
])

export const ROLE_LABEL = {
  instructions: 'Instructions',
  source: 'Source',
  window: 'In quarter',
  qualify: 'Qualify',
  scope: 'Local filter',
  trend: 'Trend',
  aggregate: 'Total',
  answer: 'Answer',
}

const FIELD = {
  closeQuarter: 'close quarter',
  status: 'status',
  stage: 'stage',
  prob: 'probability',
  amount: 'amount',
  pod: 'pod',
  type: 'type',
  next: 'next step',
  buyer: 'economic buyer',
  accepted: 'accepted',
  quarter: 'quarter',
  week: 'week starting',
}

export function money(n) {
  const v = Math.round(Number(n) || 0)
  const sign = v < 0 ? '-' : ''
  return sign + '$' + Math.abs(v).toLocaleString('en-US')
}

function resolve(v, flags) {
  if (v === '$quarter') return COMPANY.quarter
  if (typeof v === 'string' && v.startsWith('$flag.')) return flags[v.slice(6)]
  return v
}

function cmp(op, field, val) {
  if (op === 'eq') return field === val
  if (op === 'neq') return field !== val
  if (op === 'gte') return field >= val
  if (op === 'gt') return field > val
  if (op === 'lte') return field <= val
  if (op === 'lt') return field < val
  return false
}

function matchRow(row, pred, flags) {
  const field = row[pred.field]
  for (const op of ['eq', 'neq', 'gte', 'gt', 'lte', 'lt']) {
    if (op in pred) return cmp(op, field, resolve(pred[op], flags))
  }
  return false
}

function predText(pred, flags) {
  const name = FIELD[pred.field] || pred.field
  if (pred.field === 'next' || pred.field === 'buyer' || pred.field === 'accepted') {
    const on = resolve(pred.eq, flags) === true
    if (pred.field === 'accepted') return on ? 'accepted' : 'not accepted'
    return on ? `${name} is set` : `${name} is missing`
  }
  for (const [op, sym] of [['eq', 'is'], ['neq', 'is not'], ['gte', '≥'], ['gt', '>'], ['lte', '≤'], ['lt', '<']]) {
    if (!(op in pred)) continue
    let val = resolve(pred[op], flags)
    if (pred.field === 'amount' && typeof val === 'number') val = money(val)
    if (op === 'eq' || op === 'neq') return `${name} ${sym} ${val}`
    return `${name} ${sym} ${val}`
  }
  return name
}

function sumAmount(rows) {
  return rows.reduce((s, r) => s + (typeof r.amount === 'number' ? r.amount : 0), 0)
}

function idsOf(rows) {
  return rows.map(r => r.id).sort().join(',')
}

function rowKind(rows) {
  if (!rows.length) return 'empty'
  if ('week' in rows[0]) return 'weeks'
  if ('stage' in rows[0]) return 'opps'
  if ('accepted' in rows[0]) return 'sqls'
  if ('status' in rows[0]) return 'accounts'
  return 'rows'
}

function whereText(rows, clause) {
  const kind = rowKind(rows)
  if (kind === 'opps') return `${clause} · ${rows.length} deals · ${money(sumAmount(rows))}`
  if (kind === 'sqls') return `${clause} · ${rows.length} SQLs`
  if (kind === 'weeks') return `${clause} · ${rows.length} weeks · ${rows.map(w => `${w.label}: ${w.sqls}`).join(', ')}`
  if (kind === 'accounts') {
    const names = rows.map(r => r.name).sort((a, b) => a < b ? -1 : a > b ? 1 : 0)
    return `${clause} · ${rows.length} accounts · ${names.join(', ') || 'none'}`
  }
  return `${clause} · ${rows.length}`
}

function bindingOf(source) {
  if (!source) return {}
  return {binding: source.id || null, official: !!source.official, duplicateOf: source.duplicateOf || null}
}

function apply(step, ctx, flags) {
  if (step.op === 'note') {
    return {text: step.text, valueKey: 'note:' + step.text, value: null}
  }
  if (step.op === 'read_rows') {
    const got = readSource(step.source, flags)
    ctx.rows = got.rows
    ctx.doc = null
    ctx.scalar = null
    const kind = rowKind(got.rows)
    const total = kind === 'opps' ? ` · sheet total ${money(sumAmount(got.rows))}`
      : kind === 'weeks' ? ` · latest week ${got.rows[got.rows.length - 1].label}` : ''
    return {
      text: `${got.source.label} · ${got.rows.length} ${kind === 'weeks' ? 'weekly rows' : 'rows'} · as of ${got.source.asOf}${total}`,
      valueKey: 'rows:' + idsOf(got.rows),
      value: got.rows.length,
      ...bindingOf(got.source),
    }
  }
  if (step.op === 'read_doc') {
    const got = readSource(step.source, flags)
    ctx.doc = got.doc
    ctx.rows = []
    const preview = got.doc.line || got.doc.paymentTerms || (got.doc.acv != null ? money(got.doc.acv) : '')
    return {
      text: `${got.source.label} · as of ${got.source.asOf} · ${preview}`,
      valueKey: 'doc:' + preview,
      value: preview,
      ...bindingOf(got.source),
    }
  }
  if (step.op === 'where') {
    const rows = (ctx.rows || []).filter(row => step.all.every(pred => matchRow(row, pred, flags)))
    ctx.rows = rows
    const clause = step.all.map(pred => predText(pred, flags)).join(' · ')
    return {
      text: whereText(rows, clause),
      valueKey: clause + '|' + idsOf(rows),
      value: rowKind(rows) === 'opps' ? sumAmount(rows) : rows.length,
    }
  }
  if (step.op === 'sum') {
    const rows = ctx.rows || []
    const total = sumAmount(rows)
    ctx.scalar = total
    return {text: money(total), valueKey: 'sum:' + total + '|' + idsOf(rows), value: total, unit: 'USD'}
  }
  if (step.op === 'multiply_count') {
    const got = readSource(step.doc, flags)
    const n = (ctx.rows || []).length
    const each = got.doc[step.field]
    const total = n * each
    ctx.scalar = total
    return {
      text: `${n} × ${money(each)} from ${got.source.label}`,
      valueKey: `${n}x${each}`,
      value: total,
      unit: 'USD',
      ...bindingOf(got.source),
    }
  }
  if (step.op === 'trend') {
    const rows = ctx.rows || []
    const first = rows[0]
    const last = rows[rows.length - 1]
    const peak = rows.reduce((top, w) => w.sqls > top.sqls ? w : top, first)
    const pct = Math.round((last.sqls - first.sqls) / first.sqls * 100)
    ctx.trend = {first, last, peak, pct}
    return {
      text: `First week ${first.label}: ${first.sqls} SQLs → latest week ${last.label}: ${last.sqls} SQLs · ${pct > 0 ? '+' : ''}${pct}%`,
      valueKey: `trend:${pct}|${idsOf(rows)}`,
      value: pct,
      unit: 'pct',
    }
  }
  if (step.op === 'answer_trend') {
    const {first, last, peak, pct} = ctx.trend
    const text = `${pct >= 0 ? 'Up' : 'Down'} ${Math.abs(pct)}% since ${first.label} — ${last.sqls} SQLs in the week of ${last.label} (peaked ${peak.label} at ${peak.sqls})`
    return {text, valueKey: 'trendans:' + text, value: pct, unit: 'pct'}
  }
  if (step.op === 'answer_money') {
    const total = ctx.scalar != null ? ctx.scalar : sumAmount(ctx.rows || [])
    return {text: money(total), valueKey: 'usd:' + total, value: total, unit: 'USD'}
  }
  if (step.op === 'answer_names') {
    const rows = [...(ctx.rows || [])].sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
    const names = rows.map(r => r.name)
    return {
      text: `${rows.length} active — ${names.join(', ') || 'none'}`,
      valueKey: 'names:' + rows.map(r => r.id).sort().join(','),
      value: rows.length,
      unit: 'clients',
    }
  }
  if (step.op === 'answer_doc') {
    const v = ctx.doc ? ctx.doc[step.field] : ''
    return {text: String(v ?? ''), valueKey: 'docans:' + v, value: v, unit: 'text'}
  }
  if (step.op === 'literal') {
    ctx.scalar = step.value
    return {text: step.text, valueKey: 'lit:' + step.value, value: step.value, unit: step.unit || 'text'}
  }
  throw new Error('Unknown op ' + step.op)
}

export function runAgent(agent, flags) {
  const ctx = {rows: null, scalar: null, doc: null}
  const steps = agent.steps.map(step => {
    const out = apply(step, ctx, flags)
    return {
      id: step.id,
      role: step.role,
      roleLabel: ROLE_LABEL[step.role] || step.role,
      label: step.label,
      text: out.text,
      valueKey: out.valueKey,
      value: out.value ?? null,
      unit: out.unit || null,
      binding: out.binding || null,
      official: out.official ?? null,
      duplicateOf: out.duplicateOf || null,
    }
  })
  const answer = [...steps].reverse().find(s => s.role === 'answer') || steps[steps.length - 1]
  return {
    agentId: agent.id,
    depth: agent.depth,
    finalText: answer.text,
    finalValue: answer.value,
    finalKey: answer.valueKey,
    steps,
  }
}
