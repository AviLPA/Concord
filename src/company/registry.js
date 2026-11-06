// Agent registry. Adding the next recipe is a row here, not a new screen.
//
// Scale path toward ~150 agents:
// - Append to AGENTS. Reuse an op from ops.js (read a source, filter, sum, multiply, answer).
// - Point questionId at a QUESTIONS row, or add a question and its signals.
// - Point source / doc at a SOURCES id. A new file or copy is a source row plus, if needed,
//   a projection on the shared table (live / shadow / friday / copy / export).
// - Do not add a function per agent. The runner is the interpreter in ops.js.
// - Chat, cluster diff, and the scan dashboard read this registry. They do not know Meridian's deals.
//
// depth: "recipe" records every step. "instructions" is a note plus a final, so both check depths exist.
// section is who gets compared on a shared step. team is the workplace team on the card.
// note is prose about why this agent drifts. The runner does not branch on it.

export const QUESTIONS = [
  {
    id: 'q.sales.pipeline',
    kind: 'section',
    section: 'Sales',
    ask: "What's our qualified pipeline for this quarter?",
    signals: [
      'qualified pipeline', 'pipeline this quarter', 'q4 pipeline', 'sales pipeline',
      'pipeline for this quarter', 'how much pipeline', 'qualified pipe',
    ],
  },
  {
    id: 'q.company.clients',
    kind: 'company',
    section: 'Company',
    ask: 'Which clients are active?',
    signals: [
      'active clients', 'active customers', 'active accounts', 'who are our clients',
      'customer list', 'which customers are live', 'current clients',
    ],
  },
  {
    id: 'q.company.brand',
    kind: 'company',
    section: 'Company',
    ask: "What's our current brand line?",
    signals: ['brand line', 'tagline', 'slogan', 'brand guidelines', 'current brand', 'branding line'],
  },
  {
    id: 'q.company.terms',
    kind: 'company',
    section: 'Company',
    ask: 'What are our standard payment terms?',
    signals: ['payment terms', 'standard payment', 'net 30', 'contract terms', 'msa payment', 'payment term'],
  },
  {
    id: 'q.sales.acv',
    kind: 'section',
    section: 'Sales',
    ask: "What's our planning ACV?",
    signals: ['planning acv', 'average contract value', 'average deal size', 'planning average'],
  },
  {
    id: 'q.company.liability',
    kind: 'company',
    section: 'Company',
    ask: "What's our standard liability cap?",
    signals: ['liability cap', 'limitation of liability', 'standard liability', 'liability limit'],
  },
]

// Buyer board, read left to right, then the second row. Six clusters, two rows of three.
export const BOARD = [
  'q.sales.pipeline',
  'q.sales.acv',
  'q.company.clients',
  'q.company.brand',
  'q.company.terms',
  'q.company.liability',
]

const IN_QUARTER = [
  {field: 'closeQuarter', eq: '$quarter'},
  {field: 'status', eq: 'open'},
]
const STAGE_BAR = [{field: 'stage', gte: '$flag.qualifyStageMin'}]

const readRows = (source, label) => ({id: 'src', role: 'source', op: 'read_rows', source, label})
const where = (id, role, all, label) => ({id, role, op: 'where', all, label})
const total = () => ({id: 'agg', role: 'aggregate', op: 'sum', field: 'amount', label: 'Sum the amounts'})
const answerMoney = () => ({id: 'ans', role: 'answer', op: 'answer_money', label: 'Answer with the total'})

function pipe(extra) {
  return [
    readRows(extra.source, extra.sourceLabel),
    where('win', 'window', IN_QUARTER, 'Keep open opportunities closing this quarter'),
    where('qual', 'qualify', extra.qualify, extra.qualifyLabel),
    ...(extra.scope ? [where('scope', 'scope', extra.scope, extra.scopeLabel)] : []),
    total(),
    answerMoney(),
  ]
}

export const AGENTS = [
  {
    id: 'sales.live.qualified',
    questionId: 'q.sales.pipeline',
    section: 'Sales', team: 'Sales', role: 'AE', owner: 'Jordan Hale',
    verb: 'Pull qualified pipeline',
    tool: 'n8n', depth: 'recipe',
    note: 'Pointed at the Revenue Ops sheet. He uses whatever stage bar is in the forecast doc this week.',
    steps: pipe({
      source: 'sheet.pipeline.live',
      sourceLabel: 'Read the live pipeline sheet',
      qualify: STAGE_BAR,
      qualifyLabel: 'Qualified means stage at or above the current bar',
    }),
  },
  {
    id: 'sales.shadow.qualified',
    questionId: 'q.sales.pipeline',
    section: 'Sales', team: 'Sales', role: 'Sales manager', owner: 'Priya Shah',
    verb: 'Refresh the forecast from the team sheet',
    tool: 'n8n', depth: 'recipe',
    note: 'She copied the pipeline into her own Google Drive on Oct 6 and never pointed the agent back.',
    steps: pipe({
      source: 'sheet.pipeline.shadow',
      sourceLabel: "Read Priya's copied pipeline sheet",
      qualify: STAGE_BAR,
      qualifyLabel: 'Qualified means stage at or above the current bar',
    }),
  },
  {
    id: 'sales.friday.commit',
    questionId: 'q.sales.pipeline',
    section: 'Sales', team: 'Sales', role: 'VP Sales', owner: 'Chris Adelman',
    verb: 'Lock the commit',
    tool: 'chatgpt', depth: 'recipe',
    note: "The VP's agent still reads Friday's CRM export and treats commit as stage 4 or later.",
    steps: pipe({
      source: 'crm.pipeline.friday',
      sourceLabel: "Read Friday's CRM export",
      qualify: [{field: 'stage', gte: 4}],
      qualifyLabel: 'Commit means stage 4 or later',
    }),
  },
  {
    id: 'sales.west.pod',
    questionId: 'q.sales.pipeline',
    section: 'Sales', team: 'Sales', role: 'West pod lead', owner: 'Lena Ortiz',
    verb: 'Total the West pod pipeline',
    tool: 'n8n', depth: 'recipe',
    note: 'Same live sheet as Jordan, then she keeps only the West pod.',
    steps: pipe({
      source: 'sheet.pipeline.live',
      sourceLabel: 'Read the live pipeline sheet',
      qualify: STAGE_BAR,
      qualifyLabel: 'Qualified means stage at or above the current bar',
      scope: [{field: 'pod', eq: 'west'}],
      scopeLabel: 'Keep the West pod',
    }),
  },
  {
    id: 'sales.desk.floor',
    questionId: 'q.sales.pipeline',
    section: 'Sales', team: 'Sales', role: 'Deal desk', owner: 'Samir Qureshi',
    verb: 'Size deals that clear the desk floor',
    tool: 'n8n', depth: 'recipe',
    note: 'Deal desk ignores anything under $25k. On this seed that drops Sable Studio and nothing else that already qualified.',
    steps: pipe({
      source: 'sheet.pipeline.live',
      sourceLabel: 'Read the live pipeline sheet',
      qualify: STAGE_BAR,
      qualifyLabel: 'Qualified means stage at or above the current bar',
      scope: [{field: 'amount', gte: 25000}],
      scopeLabel: 'Drop deals under the $25k desk floor',
    }),
  },
  {
    id: 'sales.newlogo',
    questionId: 'q.sales.pipeline',
    section: 'Sales', team: 'Sales', role: 'New logo AE', owner: 'Avery Chen',
    verb: 'Commit the new-logo number',
    tool: 'claude', depth: 'recipe',
    note: 'New-logo commit only, and he starts at stage 4. Expansions never enter the number.',
    steps: pipe({
      source: 'sheet.pipeline.live',
      sourceLabel: 'Read the live pipeline sheet',
      qualify: [{field: 'stage', gte: 4}],
      qualifyLabel: 'Commit means stage 4 or later',
      scope: [{field: 'type', eq: 'new'}],
      scopeLabel: 'Keep new logos',
    }),
  },
  {
    id: 'sales.sdr.stale',
    questionId: 'q.sales.pipeline',
    section: 'Sales', team: 'Sales', role: 'SDR manager', owner: 'Noah Park',
    verb: 'Project pipeline from accepted SQLs',
    tool: 'n8n', depth: 'recipe',
    note: 'Coverage is accepted SQLs times the ACV on the old enablement page, not opportunities.',
    steps: [
      readRows('sheet.sql.live', 'Read the SQL sheet'),
      where('win', 'window', [{field: 'accepted', eq: true}, {field: 'quarter', eq: '$quarter'}], 'Keep SQLs accepted this quarter'),
      {id: 'qual', role: 'qualify', op: 'multiply_count', doc: 'notion.acv.old', field: 'acv', label: 'Multiply by the ACV on the enablement page'},
      answerMoney(),
    ],
  },
  {
    id: 'sales.sdr.brain',
    questionId: 'q.sales.pipeline',
    section: 'Sales', team: 'Sales', role: 'SDR manager', owner: 'Tess Morgan',
    verb: 'Project pipeline from accepted SQLs',
    tool: 'claude', depth: 'recipe',
    note: 'Same SQL list as Noah. She multiplies by the planning ACV in the company brain.',
    steps: [
      readRows('sheet.sql.live', 'Read the SQL sheet'),
      where('win', 'window', [{field: 'accepted', eq: true}, {field: 'quarter', eq: '$quarter'}], 'Keep SQLs accepted this quarter'),
      {id: 'qual', role: 'qualify', op: 'multiply_count', doc: 'brain.acv', field: 'acv', label: 'Multiply by the planning ACV in the company brain'},
      answerMoney(),
    ],
  },
  {
    id: 'sales.hygiene',
    questionId: 'q.sales.pipeline',
    section: 'Sales', team: 'Sales', role: 'Sales ops', owner: 'Riley Cho',
    verb: 'Count clean qualified pipeline',
    tool: 'n8n', depth: 'recipe',
    note: 'A deal has to be stage 3 or better, at least 60% probability, with a next step and an economic buyer.',
    steps: pipe({
      source: 'sheet.pipeline.live',
      sourceLabel: 'Read the live pipeline sheet',
      qualify: [
        {field: 'stage', gte: 3},
        {field: 'prob', gte: 60},
        {field: 'next', eq: true},
        {field: 'buyer', eq: true},
      ],
      qualifyLabel: 'Stage, probability, next step, and economic buyer all have to hold',
    }),
  },
  {
    id: 'sales.standup',
    questionId: 'q.sales.pipeline',
    section: 'Sales', team: 'Sales', role: 'AE', owner: 'Dana Brooks',
    verb: 'Answer commit from the Monday note',
    tool: 'claude', depth: 'instructions',
    note: "Monday's standup note. The agent was told not to open the sheet.",
    steps: [
      {id: 'note', role: 'instructions', op: 'note', label: 'Read the project instructions', text: "From Monday's forecast standup: qualified pipeline is $2.4M. Do not re-pull the sheet."},
      {id: 'ans', role: 'answer', op: 'literal', label: 'Return the number in the note', value: 2400000, text: '$2,400,000', unit: 'USD'},
    ],
  },
  {
    id: 'clients.live',
    questionId: 'q.company.clients',
    section: 'Company', team: 'CS', role: 'CS ops', owner: 'Maya Ellison',
    verb: 'List active clients',
    tool: 'n8n', depth: 'recipe',
    note: 'The live customer sheet CS ops maintains.',
    steps: [
      readRows('sheet.clients.live', 'Read the live customer sheet'),
      where('qual', 'qualify', [{field: 'status', eq: 'active'}], 'Keep accounts marked active'),
      {id: 'ans', role: 'answer', op: 'answer_names', label: 'Name the active clients'},
    ],
  },
  {
    id: 'clients.copy',
    questionId: 'q.company.clients',
    section: 'Company', team: 'CS', role: 'CS', owner: 'Jonah Pike',
    verb: 'List active clients',
    tool: 'n8n', depth: 'recipe',
    note: "A copy of that sheet from September. Quarry is still active on it. Umber is still paused.",
    steps: [
      readRows('sheet.clients.copy', "Read Jonah's copy of the customer sheet"),
      where('qual', 'qualify', [{field: 'status', eq: 'active'}], 'Keep accounts marked active'),
      {id: 'ans', role: 'answer', op: 'answer_names', label: 'Name the active clients'},
    ],
  },
  {
    id: 'clients.export',
    questionId: 'q.company.clients',
    section: 'Company', team: 'RevOps', role: 'RevOps', owner: 'Elena Voss',
    verb: 'List active clients from the CRM export',
    tool: 'chatgpt', depth: 'recipe',
    note: 'September CRM export. Halcyon had not gone live yet, and Quarry had not been marked churned.',
    steps: [
      readRows('crm.clients.sept', 'Read the September CRM export'),
      where('qual', 'qualify', [{field: 'status', eq: 'active'}], 'Keep accounts marked active'),
      {id: 'ans', role: 'answer', op: 'answer_names', label: 'Name the active clients'},
    ],
  },
  {
    id: 'clients.board',
    questionId: 'q.company.clients',
    section: 'Company', team: 'Exec', role: 'Chief of staff', owner: 'Harper Lin',
    verb: 'Read the client slide',
    tool: 'claude', depth: 'instructions',
    note: 'The client list on the Q3 board slide. It does not open a system.',
    steps: [
      {id: 'note', role: 'instructions', op: 'note', label: 'Read the project instructions', text: 'Q3 board slide, clients: Reed, Bramble, Northpeak, Cinder, Vesper, Lumen. Do not open the customer sheet.'},
      {id: 'ans', role: 'answer', op: 'literal', label: 'Return the names on the slide', value: 'bramble,cinder,lumen,northpeak,reed,vesper', text: '6 active — Bramble Health, Cinder & Co, Lumen Freight, Northpeak Logistics, Reed Analytics, Vesper Grid', unit: 'clients'},
    ],
  },
  {
    id: 'brand.brain',
    questionId: 'q.company.brand',
    section: 'Company', team: 'Marketing', role: 'Brand', owner: 'Mira Santos',
    verb: 'Read the brand line',
    tool: 'claude', depth: 'recipe',
    note: 'Company brain, brand page.',
    steps: [
      {id: 'src', role: 'source', op: 'read_doc', source: 'brain.brand', label: 'Read the brand line in the company brain'},
      {id: 'ans', role: 'answer', op: 'answer_doc', field: 'line', label: 'Return that line'},
    ],
  },
  {
    id: 'brand.notion',
    questionId: 'q.company.brand',
    section: 'Company', team: 'Marketing', role: 'Brand', owner: 'Owen Blake',
    verb: 'Read the brand line',
    tool: 'n8n', depth: 'recipe',
    note: 'The official Notion brand guidelines. Same line as the brain, different file.',
    steps: [
      {id: 'src', role: 'source', op: 'read_doc', source: 'notion.brand', label: 'Read the Notion brand guidelines'},
      {id: 'ans', role: 'answer', op: 'answer_doc', field: 'line', label: 'Return that line'},
    ],
  },
  {
    id: 'brand.old',
    questionId: 'q.company.brand',
    section: 'Company', team: 'Sales', role: 'Enablement', owner: 'Jules Ferrer',
    verb: 'Read the brand line',
    tool: 'chatgpt', depth: 'recipe',
    note: 'A duplicated Notion page titled Brand (OLD) that enablement still links from the pitch deck.',
    steps: [
      {id: 'src', role: 'source', op: 'read_doc', source: 'notion.brand.old', label: 'Read the brand page linked from the deck'},
      {id: 'ans', role: 'answer', op: 'answer_doc', field: 'line', label: 'Return that line'},
    ],
  },
  {
    id: 'terms.current',
    questionId: 'q.company.terms',
    section: 'Company', team: 'Legal', role: 'Counsel', owner: 'Naomi Idris',
    verb: 'Read standard payment terms',
    tool: 'claude', depth: 'recipe',
    note: 'Current MSA in the legal Notion.',
    steps: [
      {id: 'src', role: 'source', op: 'read_doc', source: 'notion.msa', label: 'Read the current MSA'},
      {id: 'ans', role: 'answer', op: 'answer_doc', field: 'paymentTerms', label: 'Return the payment term'},
    ],
  },
  {
    id: 'terms.archive',
    questionId: 'q.company.terms',
    section: 'Company', team: 'Sales', role: 'Deal desk', owner: 'Leo Marsh',
    verb: 'Read standard payment terms',
    tool: 'n8n', depth: 'recipe',
    note: "The 2024 MSA duplicated into the deal-desk folder. The agent's instructions still open that copy.",
    steps: [
      {id: 'src', role: 'source', op: 'read_doc', source: 'notion.msa.2024', label: 'Read the MSA in the deal-desk folder'},
      {id: 'ans', role: 'answer', op: 'answer_doc', field: 'paymentTerms', label: 'Return the payment term'},
    ],
  },
  {
    id: 'terms.note',
    questionId: 'q.company.terms',
    section: 'Company', team: 'Sales', role: 'AE', owner: 'Evan Cho',
    verb: 'Answer payment terms from the note',
    tool: 'chatgpt', depth: 'instructions',
    note: 'A personal note: enterprise orders go out at Net 60.',
    steps: [
      {id: 'note', role: 'instructions', op: 'note', label: 'Read the project instructions', text: 'Enterprise orders go out at Net 60. That is what I put on the last three orders. Do not open the MSA.'},
      {id: 'ans', role: 'answer', op: 'literal', label: 'Return the term in the note', value: 'Net 60', text: 'Net 60', unit: 'text'},
    ],
  },
  {
    id: 'sales.acv.brain',
    questionId: 'q.sales.acv',
    section: 'Sales', team: 'Sales', role: 'Sales ops', owner: 'Nia Patel',
    verb: 'Read the planning ACV',
    tool: 'claude', depth: 'recipe',
    note: 'The planning ACV in the company brain. Coverage math uses this number.',
    steps: [
      {id: 'src', role: 'source', op: 'read_doc', source: 'brain.acv', label: 'Read the planning ACV in the company brain'},
      {id: 'ans', role: 'answer', op: 'answer_doc', field: 'acv', label: 'Return that ACV'},
    ],
  },
  {
    id: 'sales.acv.old',
    questionId: 'q.sales.acv',
    section: 'Sales', team: 'Sales', role: 'Enablement', owner: 'Caleb Ruiz',
    verb: 'Read the planning ACV',
    tool: 'n8n', depth: 'recipe',
    note: 'The enablement copy of the SQL coverage page. It still says $42k.',
    steps: [
      {id: 'src', role: 'source', op: 'read_doc', source: 'notion.acv.old', label: 'Read the ACV on the enablement copy'},
      {id: 'ans', role: 'answer', op: 'answer_doc', field: 'acv', label: 'Return that ACV'},
    ],
  },
  {
    id: 'sales.acv.note',
    questionId: 'q.sales.acv',
    section: 'Sales', team: 'Sales', role: 'AE', owner: 'Willa Grant',
    verb: 'Answer ACV from the deck note',
    tool: 'chatgpt', depth: 'instructions',
    note: 'The pitch deck still says $45k. The agent was told not to open the brain.',
    steps: [
      {id: 'note', role: 'instructions', op: 'note', label: 'Read the project instructions', text: 'The pitch deck says planning ACV is $45,000. Do not open the company brain.'},
      {id: 'ans', role: 'answer', op: 'literal', label: 'Return the number in the note', value: 45000, text: '$45,000', unit: 'USD'},
    ],
  },
  {
    id: 'terms.cap.current',
    questionId: 'q.company.liability',
    section: 'Company', team: 'Legal', role: 'Counsel', owner: 'Naomi Idris',
    verb: 'Read the liability cap',
    tool: 'claude', depth: 'recipe',
    note: 'The current MSA, same file as the payment term.',
    steps: [
      {id: 'src', role: 'source', op: 'read_doc', source: 'notion.msa', label: 'Read the liability cap in the current MSA'},
      {id: 'ans', role: 'answer', op: 'answer_doc', field: 'liability', label: 'Return the cap'},
    ],
  },
  {
    id: 'terms.cap.archive',
    questionId: 'q.company.liability',
    section: 'Company', team: 'Sales', role: 'Deal desk', owner: 'Leo Marsh',
    verb: 'Read the liability cap',
    tool: 'n8n', depth: 'recipe',
    note: 'The 2024 MSA in the deal-desk folder. Same copy as the Net 45 term.',
    steps: [
      {id: 'src', role: 'source', op: 'read_doc', source: 'notion.msa.2024', label: 'Read the liability cap in the deal-desk copy'},
      {id: 'ans', role: 'answer', op: 'answer_doc', field: 'liability', label: 'Return the cap'},
    ],
  },
  {
    id: 'terms.cap.note',
    questionId: 'q.company.liability',
    section: 'Company', team: 'Sales', role: 'AE', owner: 'Sasha Nguyen',
    verb: 'Answer the cap from the note',
    tool: 'chatgpt', depth: 'instructions',
    note: 'A personal note that enterprise paper goes out uncapped.',
    steps: [
      {id: 'note', role: 'instructions', op: 'note', label: 'Read the project instructions', text: 'Enterprise paper goes out uncapped. That is what I told the last three buyers. Do not open the MSA.'},
      {id: 'ans', role: 'answer', op: 'literal', label: 'Return the cap in the note', value: 'Uncapped', text: 'Uncapped', unit: 'text'},
    ],
  },
]
