import {createServer} from 'vite'
import {fileURLToPath} from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))
const server = await createServer({
  root,
  server: {middlewareMode: true},
  appType: 'custom',
  logLevel: 'error',
})

const failed = []
function check(name, cond, detail) {
  if (!cond) failed.push(detail ? `${name} — ${detail}` : name)
}

try {
  const eng = await server.ssrLoadModule('/src/company/engine.js')
  const reg = await server.ssrLoadModule('/src/company/registry.js')
  const {AGENTS, QUESTIONS, BOARD} = reg
  const errors = eng.validateRegistry()
  check('registry', errors.length === 0, errors.join('; '))

  const scan = eng.runScan()
  const again = eng.runScan()
  check('deterministic', JSON.stringify(scan.runs) === JSON.stringify(again.runs))

  const salesAsk = eng.ask("What's our qualified pipeline for this quarter?", scan)
  check('match sales', salesAsk.cluster?.question.id === 'q.sales.pipeline')
  const paraphrase = eng.ask('how much qualified pipeline do we have this quarter', scan)
  check('paraphrase sales', paraphrase.cluster?.question.id === 'q.sales.pipeline')
  check('match clients', eng.ask('which clients are active', scan).cluster?.question.id === 'q.company.clients')
  check('match customers', eng.ask('active customers', scan).cluster?.question.id === 'q.company.clients')
  check('match brand', eng.ask("what's our current brand line", scan).cluster?.question.id === 'q.company.brand')
  check('match tagline', eng.ask('what is our tagline', scan).cluster?.question.id === 'q.company.brand')
  check('match terms', eng.ask('what are our standard payment terms', scan).cluster?.question.id === 'q.company.terms')
  check('match msa', eng.ask('payment terms on the msa', scan).cluster?.question.id === 'q.company.terms')
  check('no match', eng.ask('hello there', scan).cluster == null)

  const sales = salesAsk.cluster
  check('sales count', sales.cards.length === 10, String(sales.cards.length))
  check('sales section', sales.cards.every(c => c.agent.section === 'Sales' && c.agent.team === 'Sales'))
  check('no other team', !sales.cards.some(c => c.agent.id.startsWith('clients.') || c.agent.id.startsWith('brand.')))
  check('ten answers', sales.answers.length === 10, String(sales.answers.length))
  check('both depths', sales.thinCount === 1 && sales.recipeCount === 9)
  check('has splits', sales.splits.length >= 3, sales.splits.map(s => s.role).join(','))

  const final = id => sales.cards.find(c => c.agent.id === id).run
  const expect = {
    'sales.live.qualified': 2213000,
    'sales.shadow.qualified': 2063000,
    'sales.friday.commit': 1520000,
    'sales.west.pod': 1568000,
    'sales.desk.floor': 2195000,
    'sales.newlogo': 825000,
    'sales.sdr.stale': 588000,
    'sales.sdr.brain': 672000,
    'sales.hygiene': 1728000,
    'sales.standup': 2400000,
  }
  for (const [id, value] of Object.entries(expect)) {
    check(id, final(id).finalValue === value, `got ${final(id).finalValue}`)
  }

  const dana = final('sales.standup')
  check('dana thin', dana.depth === 'instructions' && !dana.steps.some(s => s.role === 'source' || s.role === 'qualify'))

  const qual = sales.paths.find(p => p.role === 'qualify')
  const cell = (path, id) => path.cells.find(c => c.agentId === id)
  check('shared qualify', cell(qual, 'sales.live.qualified').valueKey === cell(qual, 'sales.west.pod').valueKey)
  check('qualify diverges', cell(qual, 'sales.live.qualified').valueKey !== cell(qual, 'sales.newlogo').valueKey)
  check('qualify split', qual.split === true)
  const scope = sales.paths.find(p => p.role === 'scope')
  check('scope gap', cell(scope, 'sales.live.qualified').missing && !cell(scope, 'sales.west.pod').missing)
  const src = sales.paths.find(p => p.role === 'source')
  check('shadow source splits', cell(src, 'sales.live.qualified').valueKey !== cell(src, 'sales.shadow.qualified').valueKey)
  check('sdr shared source', cell(src, 'sales.sdr.stale').valueKey === cell(src, 'sales.sdr.brain').valueKey)
  check('sdr qualify splits', cell(qual, 'sales.sdr.stale').valueKey !== cell(qual, 'sales.sdr.brain').valueKey)
  check('sdr same then split', cell(qual, 'sales.sdr.stale').lone && cell(qual, 'sales.sdr.brain').lone)
  const win = sales.paths.find(p => p.role === 'window')
  const noahWin = cell(win, 'sales.sdr.stale')
  const tessWin = cell(win, 'sales.sdr.brain')
  check('sdr window twins', noahWin.valueKey === tessWin.valueKey && noahWin.diverges && !noahWin.lone && !tessWin.lone)
  check('jordan window shared', cell(win, 'sales.live.qualified').diverges === false)

  const summary = eng.summarize(scan)
  check('summary agents', summary.agents === AGENTS.length && summary.questions === QUESTIONS.length)
  check('summary hero', summary.heroValue === 2213000 && summary.shadowValue === 2063000)
  check('summary open', summary.openQuestions === QUESTIONS.length)

  const raised = eng.runScan({qualifyStageMin: 4, shadowCaughtUp: false})
  const jordan = raised.runs.find(r => r.agentId === 'sales.live.qualified')
  const lena = raised.runs.find(r => r.agentId === 'sales.west.pod')
  const samir = raised.runs.find(r => r.agentId === 'sales.desk.floor')
  const priya = raised.runs.find(r => r.agentId === 'sales.shadow.qualified')
  const riley = raised.runs.find(r => r.agentId === 'sales.hygiene')
  check('flag moves jordan', jordan.finalValue === 1435000)
  check('flag moves lena', lena.finalValue === 1180000)
  check('flag moves samir', samir.finalValue === 1435000)
  check('flag moves priya', priya.finalValue === 1075000)
  check('riley ignores flag', riley.finalValue === 1728000)
  check('summary moves', eng.summarize(raised).heroValue !== summary.heroValue)

  const caught = eng.runScan({qualifyStageMin: 3, shadowCaughtUp: true})
  const caughtCluster = caught.clusters.find(c => c.question.id === 'q.sales.pipeline')
  const caughtSrc = caughtCluster.paths.find(p => p.role === 'source')
  const jCell = cell(caughtSrc, 'sales.live.qualified')
  const pCell = cell(caughtSrc, 'sales.shadow.qualified')
  check('caught up value', caught.runs.find(r => r.agentId === 'sales.shadow.qualified').finalValue === 2213000)
  check('caught up rows', jCell.valueKey === pCell.valueKey && jCell.binding !== pCell.binding && pCell.differentFile === true)

  const clients = eng.ask('which clients are active right now', scan).cluster
  check('clients cluster', clients?.question.id === 'q.company.clients')
  const cl = id => clients.cards.find(c => c.agent.id === id).run.finalText
  check('maya set', cl('clients.live').startsWith('10 active') && cl('clients.live').includes('Umber Clinic') && !cl('clients.live').includes('Quarry Media'))
  check('jonah set', cl('clients.copy').startsWith('10 active') && cl('clients.copy').includes('Quarry Media') && !cl('clients.copy').includes('Umber Clinic'))
  check('elena set', cl('clients.export').startsWith('10 active') && cl('clients.export').includes('Quarry Media') && cl('clients.export').includes('Umber Clinic') && !cl('clients.export').includes('Halcyon Bank'))
  check('harper thin', cl('clients.board').startsWith('6 active'))
  const csrc = clients.paths.find(p => p.role === 'source')
  const cqual = clients.paths.find(p => p.role === 'qualify')
  check('clients same file list', cell(csrc, 'clients.live').valueKey === cell(csrc, 'clients.copy').valueKey)
  check('clients status splits', cell(cqual, 'clients.live').valueKey !== cell(cqual, 'clients.copy').valueKey && cqual.split)

  const brand = eng.ask('brand line', scan).cluster
  check('brand answers', brand.answers.length === 2)
  const agreed = brand.answers.find(a => a.agents.length === 2)
  check('brand agrees', agreed && agreed.text === 'Operate the quarter, not the spreadsheet.')
  check('brand stale', brand.answers.some(a => a.text === 'The operating system for revenue teams.' && a.agents[0].id === 'brand.old'))
  const bsrc = brand.paths.find(p => p.role === 'source')
  check('brand same line different file', cell(bsrc, 'brand.brain').valueKey === cell(bsrc, 'brand.notion').valueKey && cell(bsrc, 'brand.brain').differentFile)
  check('brand old splits', cell(bsrc, 'brand.old').diverges)

  const terms = eng.ask('standard contract terms', scan).cluster
  check('terms', terms?.question.id === 'q.company.terms')
  const termText = id => terms.cards.find(c => c.agent.id === id).run.finalText
  check('terms values', termText('terms.current') === 'Net 30' && termText('terms.archive') === 'Net 45' && termText('terms.note') === 'Net 60')
  check('terms thin', terms.thinCount === 1 && terms.cards.find(c => c.agent.id === 'terms.note').agent.depth === 'instructions')

  check('questions covered', QUESTIONS.every(q => scan.clusters.some(c => c.question.id === q.id && c.cards.length >= 3)))

  check('board six', BOARD.length === 6 && new Set(BOARD).size === 6)
  check('board known', BOARD.every(id => QUESTIONS.some(q => q.id === id)))
  const laneIds = id => eng.buyerLanes(scan.clusters.find(c => c.question.id === id)).map(c => c.agent.id).join(',')
  check('sales lanes', laneIds('q.sales.pipeline') === 'sales.live.qualified,sales.shadow.qualified,sales.standup')
  check('client lanes', laneIds('q.company.clients') === 'clients.live,clients.copy,clients.board')
  check('brand lanes', laneIds('q.company.brand') === 'brand.brain,brand.old,brand.notion')
  check('term lanes', laneIds('q.company.terms') === 'terms.current,terms.archive,terms.note')
  check('every card has three', BOARD.every(id => eng.buyerLanes(scan.clusters.find(c => c.question.id === id)).length === 3))

  const acv = eng.ask("what's our planning acv", scan).cluster
  check('match acv', acv?.question.id === 'q.sales.acv')
  check('acv section', acv.cards.every(c => c.agent.section === 'Sales' && c.agent.team === 'Sales'))
  const acvText = id => acv.cards.find(c => c.agent.id === id).run
  check('acv brain', acvText('sales.acv.brain').finalValue === 48000 && acvText('sales.acv.brain').finalText === '$48,000')
  check('acv copy', acvText('sales.acv.old').finalValue === 42000 && acvText('sales.acv.old').finalText === '$42,000')
  check('acv note', acvText('sales.acv.note').finalText === '$45,000' && acvText('sales.acv.note').depth === 'instructions')
  check('acv lanes', laneIds('q.sales.acv') === 'sales.acv.brain,sales.acv.old,sales.acv.note')

  const cap = eng.ask('standard liability cap', scan).cluster
  check('match liability', cap?.question.id === 'q.company.liability')
  const capText = id => cap.cards.find(c => c.agent.id === id).run.finalText
  check('liability values', capText('terms.cap.current') === '12 months of fees' && capText('terms.cap.archive') === 'fees paid in the prior 12 months' && capText('terms.cap.note') === 'Uncapped')
  check('liability thin', cap.thinCount === 1)
  check('pipeline still distinct', eng.ask('qualified pipeline this quarter', scan).cluster?.question.id === 'q.sales.pipeline')
} finally {
  await server.close()
}

if (failed.length) {
  console.error(failed.map(f => 'FAIL ' + f).join('\n'))
  process.exit(1)
}
console.log('company recipes ok')
