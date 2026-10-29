// Meridian is a fictional mid-size B2B SaaS. Every recipe reads this seed.
// Numbers are a pure function of SEED + flags. Do not call Date.now() or Math.random().
//
// Projections are the organic drift: a live sheet, a copied Google Sheet, a Friday CRM
// export. `false` means the row was not on that extract. A partial object overrides the live row.

export const COMPANY = {
  name: 'Meridian',
  blurb: 'Revenue workspace for mid-market finance and ops teams.',
  people: 380,
  quarter: '2026Q4',
  seed: 'meridian-q4-2026',
}

export const DEFAULT_FLAGS = {
  qualifyStageMin: 3,
  shadowCaughtUp: false,
}

export const DOCS = {
  brandLine: {line: 'Operate the quarter, not the spreadsheet.'},
  brandLineOld: {line: 'The operating system for revenue teams.'},
  acvPlan: {acv: 48000},
  acvOld: {acv: 42000},
  msaCurrent: {paymentTerms: 'Net 30', liability: '12 months of fees'},
  msa2024: {paymentTerms: 'Net 45', liability: 'fees paid in the prior 12 months'},
}

export const SOURCES = {
  'sheet.pipeline.live': {
    label: 'Q4 pipeline — Revenue Ops (live sheet)',
    kind: 'opps', projection: 'live', official: true, duplicateOf: null,
    asOf: 'today', place: 'Google Sheet · Revenue Ops',
  },
  'sheet.pipeline.shadow': {
    label: "Q4 pipeline — Priya's copy",
    kind: 'opps', projection: 'shadow', official: false, duplicateOf: 'sheet.pipeline.live',
    asOf: 'Oct 6, 2026', place: 'Google Sheet · copied from Revenue Ops',
  },
  'crm.pipeline.friday': {
    label: 'CRM pipeline export — Friday',
    kind: 'opps', projection: 'friday', official: false, duplicateOf: 'sheet.pipeline.live',
    asOf: 'Oct 24, 2026', place: 'CRM export',
  },
  'sheet.sql.live': {
    label: 'Accepted SQLs — Marketing ops (live)',
    kind: 'sqls', official: true, duplicateOf: null,
    asOf: 'today', place: 'Google Sheet · Marketing ops',
  },
  'sheet.clients.live': {
    label: 'Customers — CS ops (live sheet)',
    kind: 'accounts', projection: 'live', official: true, duplicateOf: null,
    asOf: 'today', place: 'Google Sheet · CS ops',
  },
  'sheet.clients.copy': {
    label: "Customers — Jonah's copy",
    kind: 'accounts', projection: 'copy', official: false, duplicateOf: 'sheet.clients.live',
    asOf: 'Sep 2, 2026', place: 'Google Sheet · copied from CS ops',
  },
  'crm.clients.sept': {
    label: 'CRM accounts export — September',
    kind: 'accounts', projection: 'export', official: false, duplicateOf: 'sheet.clients.live',
    asOf: 'Sep 28, 2026', place: 'CRM export',
  },
  'brain.brand': {
    label: 'Company brain · Brand',
    kind: 'doc', doc: 'brandLine', official: true, duplicateOf: null,
    asOf: 'Sep 1, 2026', place: 'Company brain',
  },
  'notion.brand': {
    label: 'Notion · Brand guidelines',
    kind: 'doc', doc: 'brandLine', official: true, duplicateOf: null,
    asOf: 'Sep 1, 2026', place: 'Notion',
  },
  'notion.brand.old': {
    label: 'Notion · Brand (OLD)',
    kind: 'doc', doc: 'brandLineOld', official: false, duplicateOf: 'notion.brand',
    asOf: 'Nov 12, 2025', place: 'Notion · duplicated page',
  },
  'brain.acv': {
    label: 'Company brain · planning ACV',
    kind: 'doc', doc: 'acvPlan', official: true, duplicateOf: null,
    asOf: 'Aug 15, 2026', place: 'Company brain',
  },
  'notion.acv.old': {
    label: 'Notion · SQL coverage (enablement copy)',
    kind: 'doc', doc: 'acvOld', official: false, duplicateOf: 'brain.acv',
    asOf: 'Jun 3, 2025', place: 'Notion · duplicated page',
  },
  'notion.msa': {
    label: 'Notion · MSA (current)',
    kind: 'doc', doc: 'msaCurrent', official: true, duplicateOf: null,
    asOf: 'Mar 2, 2026', place: 'Notion · Legal',
  },
  'notion.msa.2024': {
    label: 'Notion · MSA 2024 (deal-desk copy)',
    kind: 'doc', doc: 'msa2024', official: false, duplicateOf: 'notion.msa',
    asOf: 'Jan 18, 2024', place: 'Notion · duplicated into Deal desk',
  },
}

const live = (stage, prob, amount, close, status = 'open') => ({stage, prob, amount, close, status})

export const OPPS = [
  {id: 'northpeak', name: 'Northpeak Logistics', pod: 'west', type: 'new', next: true, buyer: true, legal: false,
    live: live(4, 80, 420000, '2026-11-18'), shadow: {stage: 3, prob: 60}, friday: {}},
  {id: 'bramble', name: 'Bramble Health', pod: 'east', type: 'new', next: true, buyer: false, legal: false,
    live: live(3, 55, 180000, '2026-12-04'), shadow: {}, friday: {}},
  {id: 'cinder', name: 'Cinder & Co', pod: 'west', type: 'expansion', next: true, buyer: true, legal: true,
    live: live(5, 90, 610000, '2026-11-02'), shadow: {stage: 4, prob: 70, amount: 480000}, friday: {}},
  {id: 'halcyon', name: 'Halcyon Bank', pod: 'east', type: 'new', next: true, buyer: true, legal: true,
    live: live(4, 75, 255000, '2026-12-12'), shadow: {}, friday: {stage: 3, prob: 60}},
  {id: 'kite', name: 'Kite Municipal', pod: 'west', type: 'new', next: false, buyer: false, legal: false,
    live: live(3, 40, 95000, '2026-12-19'), shadow: {}, friday: {}},
  {id: 'lumen', name: 'Lumen Freight', pod: 'east', type: 'expansion', next: true, buyer: true, legal: false,
    live: live(4, 70, 340000, '2027-01-20'), shadow: {close: '2026-11-30'}, friday: {close: '2026-11-30'}},
  {id: 'oak', name: 'Oak & Iron', pod: 'west', type: 'new', next: true, buyer: true, legal: false,
    live: live(4, 65, 150000, '2026-12-09'), shadow: false, friday: {}},
  {id: 'plover', name: 'Plover Systems', pod: 'east', type: 'new', next: true, buyer: false, legal: false,
    live: live(3, 60, 210000, '2026-12-16'), shadow: false, friday: false},
  {id: 'sable', name: 'Sable Studio', pod: 'west', type: 'new', next: true, buyer: true, legal: false,
    live: live(3, 80, 18000, '2026-11-25'), shadow: {}, friday: {}},
  {id: 'vesper', name: 'Vesper Grid', pod: 'west', type: 'expansion', next: true, buyer: true, legal: true,
    live: live(3, 70, 275000, '2026-12-02'), shadow: {prob: 50}, friday: {}},
  {id: 'umber', name: 'Umber Clinic', pod: 'west', type: 'new', next: false, buyer: false, legal: false,
    live: live(2, 20, 260000, '2026-12-22'), shadow: {}, friday: {}},
  {id: 'quarry', name: 'Quarry Media', pod: 'west', type: 'new', next: false, buyer: false, legal: false,
    live: live(0, 0, 125000, '2026-10-30', 'lost'), shadow: {}, friday: {}},
  {id: 'reed', name: 'Reed Analytics', pod: 'east', type: 'new', next: true, buyer: true, legal: true,
    live: live(6, 100, 500000, '2026-10-08', 'won'), shadow: {}, friday: {}},
  {id: 'tideform', name: 'Tideform', pod: 'west', type: 'new', next: true, buyer: true, legal: true,
    live: live(4, 85, 480000, '2027-02-03'), shadow: {}, friday: {}},
]

// Status strings are the column on that extract. `false` means the account was not in the file.
export const ACCOUNTS = [
  {id: 'northpeak', name: 'Northpeak Logistics', arr: 180000, live: 'active', copy: 'active', export: 'active'},
  {id: 'reed', name: 'Reed Analytics', arr: 500000, live: 'active', copy: 'active', export: 'active'},
  {id: 'bramble', name: 'Bramble Health', arr: 96000, live: 'active', copy: 'active', export: 'active'},
  {id: 'quarry', name: 'Quarry Media', arr: 0, live: 'churned', copy: 'active', export: 'active'},
  {id: 'kite', name: 'Kite Municipal', arr: 40000, live: 'active', copy: 'active', export: 'active'},
  {id: 'umber', name: 'Umber Clinic', arr: 72000, live: 'active', copy: 'paused', export: 'active'},
  {id: 'plover', name: 'Plover Systems', arr: 0, live: 'onboarding', copy: 'onboarding', export: false},
  {id: 'sable', name: 'Sable Studio', arr: 18000, live: 'active', copy: 'active', export: 'active'},
  {id: 'halcyon', name: 'Halcyon Bank', arr: 255000, live: 'active', copy: 'active', export: false},
  {id: 'vesper', name: 'Vesper Grid', arr: 275000, live: 'active', copy: 'active', export: 'active'},
  {id: 'lumen', name: 'Lumen Freight', arr: 110000, live: 'active', copy: 'active', export: 'active'},
  {id: 'cinder', name: 'Cinder & Co', arr: 610000, live: 'active', copy: 'active', export: 'active'},
  {id: 'oak', name: 'Oak & Iron', arr: 0, live: 'prospect', copy: 'prospect', export: 'prospect'},
]

export const SQLS = [
  ...Array.from({length: 14}, (_, i) => ({id: `sql${i + 1}`, name: `Accepted SQL ${i + 1}`, accepted: true, quarter: '2026Q4'})),
  ...Array.from({length: 3}, (_, i) => ({id: `open${i + 1}`, name: `Open SQL ${i + 1}`, accepted: false, quarter: '2026Q4'})),
  ...Array.from({length: 2}, (_, i) => ({id: `q3${i + 1}`, name: `Q3 SQL ${i + 1}`, accepted: true, quarter: '2026Q3'})),
]

export function quarterOf(iso) {
  const [y, m] = iso.split('-').map(Number)
  return `${y}Q${Math.ceil(m / 3)}`
}

function flattenOpp(row, snap) {
  return {
    id: row.id, name: row.name, pod: row.pod, type: row.type,
    next: row.next, buyer: row.buyer, legal: row.legal,
    stage: snap.stage, prob: snap.prob, amount: snap.amount,
    close: snap.close, closeQuarter: quarterOf(snap.close), status: snap.status,
  }
}

function projectOpp(row, projection, flags) {
  const which = projection === 'shadow' && flags.shadowCaughtUp ? 'live' : projection
  if (which === 'live') return [flattenOpp(row, row.live)]
  const over = row[which]
  if (over === false) return []
  return [flattenOpp(row, {...row.live, ...over})]
}

function projectAccount(row, projection) {
  const status = row[projection]
  if (status === false) return []
  return [{id: row.id, name: row.name, arr: row.arr, status}]
}

export function readSource(sourceId, flags) {
  const found = SOURCES[sourceId]
  if (!found) throw new Error('Unknown source ' + sourceId)
  const source = {...found, id: sourceId}
  if (source.kind === 'doc') return {source, doc: DOCS[source.doc], rows: []}
  if (source.kind === 'opps') return {source, doc: null, rows: OPPS.flatMap(row => projectOpp(row, source.projection, flags))}
  if (source.kind === 'accounts') return {source, doc: null, rows: ACCOUNTS.flatMap(row => projectAccount(row, source.projection))}
  if (source.kind === 'sqls') return {source, doc: null, rows: SQLS.map(row => ({...row}))}
  throw new Error('Unknown kind ' + source.kind)
}
