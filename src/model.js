// Shared Northwind demo data and the consistency score.
// Detection reads definitions and answers already on record. Nothing here runs or edits an agent.

export const PEOPLE = 480
export const SARA_ROLE = 'Head of RevOps'
export const LS_KEY = 'concord-demo-v2'

export const TOOLS = {
  claude: {n:'Claude', a:'C', c:'#82B9D9', via:'Compliance API'},
  n8n: {n:'n8n', a:'n', c:'#58A2CD', via:'REST API'},
}
export const DC = {
  CS:'#82B9D9', Sales:'#58A2CD', Finance:'#8CECC7', RevOps:'#ABD1E6', Exec:'#D5E8F2',
  Support:'#B2F3D9', Marketing:'#65E6B4', 'Sales Ops':'#EAF3F9', People:'#ECFCF6',
  Eng:'#9AABB3', Legal:'#C5D8E0', Data:'#3FE0A1',
}
export const BLIND = 'The Compliance API cannot see which connectors or MCP servers a Claude project uses.'
export const N8N_NOTE = 'n8n has no execute endpoint. Triggering a webhook would run the workflow, including its Slack post, so Concord never does.'

export const AGENTS = [
  {n:'Q4 at-risk accounts', job:'Customer health', tool:'claude', b:'Dana Ortiz', dept:'Sales Ops', own:'Sara Klein', src:'Q4_accounts_dana.xlsx', up:'4d', st:'conflict', ans:'35', sub:'accounts', users:4,
    evidence:'Claude chat · Thu · “35 accounts”',
    def:['at_risk = no login in 21 days','OR open_tickets > 3','source = Q4_accounts_dana.xlsx']},
  {n:'Account health monitor', job:'Customer health', tool:'claude', b:'Maya Cohen', dept:'CS', own:'Sara Klein', src:'Gainsight export (Mar)', up:'2d', st:'conflict', ans:'42', sub:'accounts', users:11,
    evidence:'Claude chat · Tue · “42 accounts”',
    def:['at_risk = tickets_30d > 5','OR csat < 3.5','window = last 30 days','source = Gainsight export (Mar)']},
  {n:'CSM weekly risk digest', job:'Customer health', tool:'n8n', b:'Tom Rivera', dept:'CS', own:'Sara Klein', src:'Snowflake · usage_daily', up:'5h', st:'conflict', ans:'17', sub:'accounts', users:8,
    evidence:'n8n execution · Mon · “17 accounts” · also posted to #cs-risk',
    def:['at_risk = usage_drop_pct > 40','window = last 30 days','excludes contracts under $10k','then posts the digest to #cs-risk','source = usage_daily']},
  {n:'Renewal radar', job:'Customer health', tool:'claude', b:'Priya Shah', dept:'Sales', own:'Sara Klein', src:'Warehouse · health_account_daily', up:'1d', st:'conflict', ans:'28', sub:'accounts', users:9,
    evidence:'Claude chat · Wed · “28 accounts”',
    def:['score = 0.5·usage + 0.3·nps + 0.2·tickets','at_risk = score < 60','window = last 30 days','source = health_account_daily']},

  {n:'ARR rollup', job:'ARR', tool:'claude', b:'Omer Levi', dept:'Finance', own:'Ravi Iyer', src:'NetSuite · invoices', up:'6h', st:'conflict', ans:'$4.8M', sub:'net of churn', users:6,
    evidence:'Claude chat · today · “$4.8M”',
    def:['arr = sum(active_subscriptions)','minus churned_this_month','source = NetSuite invoices']},
  {n:'Board metrics pack', job:'ARR', tool:'claude', b:'Ben Adler', dept:'Exec', own:'Ravi Iyer', src:'Snowflake · arr_monthly', up:'1d', st:'conflict', ans:'$5.3M', sub:'includes signed, not live', users:5,
    evidence:'Claude chat · yesterday · “$5.3M”',
    def:['arr = sum(active_subscriptions)','plus signed_not_started','source = arr_monthly']},
  {n:'Pipeline ARR helper', job:'ARR', tool:'n8n', b:'Jess Wong', dept:'Sales', own:'Ravi Iyer', src:'Salesforce · closed-won', up:'4h', st:'conflict', ans:'$5.1M', sub:'gross, no churn', users:7,
    evidence:'n8n execution · today · “$5.1M”',
    def:['arr = sum(opps where stage = closed-won)','no churn adjustment','source = Salesforce opps']},

  {n:'Deal desk assistant', job:'Discount approval', tool:'claude', b:'Chris Hall', dept:'Sales', own:'Noa Friedman', src:'Pricing policy v3', up:'2d', st:'ok', onBlock:true, ans:'Needs VP', sub:'auto-approval capped at 15%', users:14,
    evidence:'Claude chat · Mon · “Needs VP”',
    def:['calls concord.discount_approval()','if discount <= 15%: auto_approve','else: route to VP Sales','source = Pricing policy v3']},
  {n:'Quote approval', job:'Discount approval', tool:'n8n', b:'Omer Levi', dept:'RevOps', own:'Noa Friedman', src:'Pricing policy v3', up:'1d', st:'ok', onBlock:true, ans:'Needs VP', sub:'auto-approval capped at 15%', users:10,
    evidence:'n8n execution · yesterday · “Needs VP”',
    def:['calls concord.discount_approval()','if discount <= 15%: auto_approve','else: route to VP Sales in Slack','source = Pricing policy v3']},
  {n:'Rep discount helper', job:'Discount approval', tool:'claude', b:'Tom Rivera', dept:'Sales', own:'Unassigned', src:'Slack thread #deals', up:'2w', st:'conflict', ans:'Approved', sub:'auto-approves up to 20%', users:9,
    evidence:'Claude chat · 2 weeks ago · “Approved”',
    def:['auto_approve if discount <= 20%','source = Slack thread #deals']},
  {n:'Discount checker', job:'Discount approval', tool:'claude', b:'Jess Wong', dept:'Sales', own:'Noa Friedman', src:'Pricing policy v2 (2024)', up:'5w', st:'stale', ans:'Needs VP', sub:'15% cap, 2024 file', users:3,
    evidence:'Claude chat · Sep · “Needs VP”',
    def:['if discount <= 15%: auto_approve','else: route to VP Sales','source = Pricing policy v2 (2024)']},

  {n:'Refund assistant', job:'Refund policy', tool:'claude', b:'Sara Klein', dept:'Support', own:'Maya Cohen', src:'Refund policy 2026', up:'3d', st:'ok', onBlock:true, ans:'No', sub:'30-day window', users:12,
    evidence:'Claude chat · Mon · “No”',
    def:['calls concord.refund_policy()','refund_window = 30 days','source = Refund policy 2026']},
  {n:'Refund macro', job:'Refund policy', tool:'n8n', b:'Noa Friedman', dept:'Support', own:'Maya Cohen', src:'Refund policy 2024', up:'9w', st:'stale', ans:'Yes', sub:'60-day window', users:6,
    evidence:'n8n execution · last month · “Yes”',
    def:['refund_window = 60 days','source = Refund policy 2024']},

  {n:'New hire onboarding guide', job:'Onboarding FAQ', tool:'claude', b:'Leo Park', dept:'People', own:'Leo Park', src:'Notion · onboarding wiki', up:'1d', st:'ok', onBlock:true, ans:'Aligned', sub:'same checklist', users:15,
    evidence:'Instructions call the shared block',
    def:['calls concord.onboarding_faq()','source = Notion onboarding wiki']},
  {n:'Customer onboarding checklist', job:'Onboarding FAQ', tool:'n8n', b:'Maya Cohen', dept:'CS', own:'Leo Park', src:'Notion · onboarding wiki', up:'3d', st:'ok', onBlock:true, ans:'Aligned', sub:'same checklist', users:8,
    evidence:'Workflow JSON calls the shared block',
    def:['calls concord.onboarding_faq()','source = Notion onboarding wiki']},

  {n:'MQL scoring assistant', job:'Lead scoring', tool:'claude', b:'Chris Hall', dept:'Marketing', own:'Chris Hall', src:'HubSpot · contact score', up:'4d', st:'conflict', ans:'65', sub:'MQL threshold', users:6,
    evidence:'Claude chat · last week · “threshold 65”',
    def:['mql = hubspot_score >= 65','source = HubSpot contact score']},
  {n:'SDR lead qualifier', job:'Lead scoring', tool:'n8n', b:'Dana Ortiz', dept:'Sales Ops', own:'Chris Hall', src:'HubSpot · contact score', up:'1w', st:'conflict', ans:'70', sub:'MQL threshold', users:5,
    evidence:'n8n execution · last week · “threshold 70”',
    def:['mql = hubspot_score >= 70','source = HubSpot contact score']},

  {n:'Pipeline coverage check', job:'Pipeline coverage', tool:'claude', b:'Priya Shah', dept:'Sales', own:'Sara Klein', src:'Salesforce · pipeline', up:'4d', st:'conflict', ans:'3×', sub:'coverage target', users:7,
    evidence:'Claude chat · last week · “3× covered”',
    def:['covered = pipeline / quota >= 3','source = Salesforce pipeline']},
  {n:'Q4 coverage digest', job:'Pipeline coverage', tool:'n8n', b:'Leo Park', dept:'RevOps', own:'Sara Klein', src:'Salesforce · pipeline', up:'6d', st:'conflict', ans:'4×', sub:'coverage target', users:4,
    evidence:'n8n execution · last week · “4× covered”',
    def:['covered = pipeline / quota >= 4','source = Salesforce pipeline']},

  {n:'Security questionnaire drafter', job:'Security questionnaire', tool:'claude', b:'Ravi Iyer', dept:'Eng', own:'Unassigned', src:'Trust center docs', up:'3w', st:'orphan', ans:'—', sub:'no owner', users:2,
    evidence:'No recent answer on record',
    def:['draft answers from the trust center','source = Trust center docs']},
]

export const JOB_ORDER = ['Customer health','ARR','Discount approval','Refund policy','Onboarding FAQ','Lead scoring','Pipeline coverage','Security questionnaire']

export const CONF = [
  {id:'c1', t:'Customer health: 4 definitions', job:'Customer health', type:'Definition', sev:'bad', odept:'RevOps', age:'2d', owner:'Sara Klein',
    d:'Dana, Maya, Tom, and Priya each define at-risk differently. Last week their agents told people four different numbers.',
    q:'How many accounts are at risk this quarter?',
    note:'Those answers are already in Claude chats and an n8n execution log. Concord did not ask the question.',
    cols:[0,1,2,3].map(a=>({a})), win:3,
    impact:['$1.9M ARR','in disputed accounts'], imp2:['4 agents','Sales, CS, Sales Ops'], imp3:['4 answers','35, 42, 17, and 28']},
  {id:'c2', t:'ARR: 3 different totals', job:'ARR', type:'Definition', sev:'bad', odept:'Data', age:'6h', owner:'Ravi Iyer',
    d:'Finance says $4.8M net. The board pack says $5.3M. The pipeline helper says $5.1M.',
    q:'What is our current ARR?',
    note:'Taken from chats and an n8n execution this week. Concord did not run the agents.',
    cols:[4,5,6].map(a=>({a})), win:0,
    impact:['$500K','spread between answers'], imp2:['3 agents','board pack Thursday'], imp3:['2 teams','using different numbers']},
  {id:'c3', t:'Discount approval: 15% vs 20%', job:'Discount approval', type:'Rule', sev:'warn', odept:'RevOps', age:'1d', owner:'Noa Friedman',
    d:'The published policy caps auto-approval at 15%. Tom’s helper still auto-approves 20% from a Slack thread. Jess’s checker agrees on 15% but still cites the 2024 file.',
    q:'Can I give 18% off a 2-year deal?',
    note:'Answers already on record. A sandboxed test is optional and is not how this was found.',
    cols:[8,9,10].map(a=>({a})), win:0,
    impact:['$84K','discount leakage / qtr'], imp2:['4 agents','Sales, RevOps'], imp3:['12 deals','approved off the published cap']},
  {id:'c4', t:'Refund policy: 30 days vs 60', job:'Refund policy', type:'Stale source', sev:'warn', odept:'CS', age:'3d', owner:'Maya Cohen',
    d:'The 2026 policy is a 30-day window. The n8n macro still has the 2024 file, which says 60 days.',
    q:'Can a customer get a refund after 45 days?',
    note:'The “Yes” is from an n8n execution last month, not a new run.',
    cols:[11,12].map(a=>({a})), win:0,
    impact:['31','refunds / mo affected'], imp2:['2 agents','Support'], imp3:['9 weeks','since the policy changed']},
  {id:'c5', t:'Lead score: MQL at 65 vs 70', job:'Lead scoring', type:'Definition', sev:'info', odept:'Marketing', age:'1w', owner:'Chris Hall',
    d:'Marketing’s assistant treats 65 as an MQL. The SDR workflow waits until 70.',
    q:'Is a score of 67 an MQL?',
    note:'Thresholds were read from instructions and from last week’s answers.',
    cols:[15,16].map(a=>({a})), win:0,
    impact:['—','routing difference'], imp2:['2 agents','Marketing, Sales Ops'], imp3:['1 week','since the thresholds diverged']},
  {id:'c6', t:'Pipeline coverage: 3× vs 4×', job:'Pipeline coverage', type:'Rule', sev:'info', odept:'RevOps', age:'4d', owner:'Sara Klein',
    d:'Priya’s check calls the quarter covered at 3×. Leo’s Monday digest uses 4×. One of these may be a real scope difference.',
    q:'Are we covered for Q4?',
    note:'Both targets were read from instructions. Mark a valid variant if they are not the same job.',
    cols:[17,18].map(a=>({a})), win:0,
    impact:['—','forecast narrative'], imp2:['2 agents','Sales, RevOps'], imp3:['2 targets','3× and 4×']},
]

export const BLOCKS = [
  {id:'c1', n:'Customer health', v:'v2', job:'Customer health', own:'Sara Klein', pub:false, calls:'—', upd:'Draft'},
  {id:'c2', n:'ARR (net)', v:'v1', job:'ARR', own:'Ravi Iyer', pub:false, calls:'—', upd:'Draft'},
  {id:'c3', n:'Discount approval', v:'v3', job:'Discount approval', own:'Noa Friedman', pub:true, calls:'860 / wk', upd:'Oct 02'},
  {id:'c4', n:'Refund policy', v:'2026.1', job:'Refund policy', own:'Maya Cohen', pub:true, calls:'410 / wk', upd:'Aug 14'},
  {id:'b-onboard', n:'Onboarding FAQ', v:'v5', job:'Onboarding FAQ', own:'Leo Park', pub:true, calls:'2.4k / wk', upd:'Oct 11'},
]

const sem = (tool, metric, ans, lines) => ({tool, metric, ans, lines})
export const SEMANTIC = {
  'Customer health': {
    dbt: sem('dbt Semantic Layer','customer_health.at_risk_accounts','28',[
      'score = 0.5·usage_health + 0.3·nps + 0.2·ticket_health',
      'at_risk = score < 60',
      'window = trailing 30 days',
      'certified by Data · grain = account']),
    atlan: sem('Atlan','Glossary · At-risk customer','28',[
      'certified: health score below 60',
      'score = 0.5·usage + 0.3·nps + 0.2·tickets',
      'domain: Customer · owner: Data']),
    qontext: sem('Qontext','context.customer_health.at_risk','28',[
      'at_risk = health_score < 60',
      'health_score uses usage, nps, and tickets',
      'linked metric: customer_health.at_risk_accounts']),
  },
  'ARR': {
    dbt: sem('dbt Semantic Layer','finance.arr_net','$4.8M',[
      'arr = sum(active_subscriptions)','minus churned_this_month','excludes signed_not_started','certified by Finance']),
    atlan: sem('Atlan','Glossary · ARR (net)','$4.8M',[
      'net of churn, live subscriptions only','excludes signed-not-started','owner: Finance']),
    qontext: sem('Qontext','context.finance.arr_net','$4.8M',[
      'arr_net excludes churn and unstarted contracts','source metric: finance.arr_net']),
  },
  'Discount approval': {
    dbt: sem('dbt Semantic Layer','pricing.auto_approve_cap','Needs VP',[
      'auto_approve if discount <= 15%','else route to VP Sales','policy version 2026.3']),
    atlan: sem('Atlan','Glossary · Discount cap','Needs VP',[
      'auto-approval cap = 15%','above that, VP Sales','owner: RevOps']),
    qontext: sem('Qontext','context.pricing.discount_cap','Needs VP',[
      'cap = 15% for auto-approval','links to Pricing policy v3']),
  },
  'Refund policy': {
    dbt: sem('dbt Semantic Layer','support.refund_window','No',[
      'refund_window = 30 days','source = Refund policy 2026','owner: Support']),
    atlan: sem('Atlan','Glossary · Refund window','No',[
      '30 days from invoice','2024 window of 60 days is retired']),
    qontext: sem('Qontext','context.support.refund_window','No',[
      'refund_window_days = 30','policy year 2026']),
  },
  'Lead scoring': {
    dbt: sem('dbt Semantic Layer','marketing.mql_threshold','65',[
      'mql = hubspot_score >= 65','certified by Marketing']),
    atlan: sem('Atlan','Glossary · MQL','65',['MQL threshold = 65','owner: Marketing']),
    qontext: sem('Qontext','context.marketing.mql','65',['mql_threshold = 65']),
  },
  'Pipeline coverage': {
    dbt: sem('dbt Semantic Layer','sales.coverage_target','3×',[
      'covered = pipeline / quota >= 3','company target, not a team overlay']),
    atlan: sem('Atlan','Glossary · Coverage target','3×',['company coverage target = 3×','owner: RevOps']),
    qontext: sem('Qontext','context.sales.coverage','3×',['coverage_target = 3']),
  },
}

export const ADOPT_DAYS = [1, 3, 6]
export const HIST = [46, 47, 48, 47, 49, 50, 51, 50, 52, 52, 53, 53]

export function emptyState(){
  return {resolved:{}, variants:{}, wins:{}, edits:{}, origin:{}, semanticTool:{}, customAns:{}, publishBack:{}, verified:[], suggested:[], reasons:{}}
}
export function slug(s){return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')}
export function jobIds(job){return AGENTS.map((a,i)=>a.job===job?i:-1).filter(i=>i>=0)}
export function conflictByJob(job){return CONF.find(c=>c.job===job)||null}
export function conflictByAgent(i){return CONF.find(c=>c.cols.some(col=>col.a===i))||null}
export function winCol(c, state){const i=state.wins[c.id]; return i==null?c.win:i}
export function isVariant(cid, i, state){return ((state.variants||{})[cid]||[]).includes(i)}

export function officialAnswer(c, state){
  const origin=state.origin[c.id]||'agent'
  if(origin==='semantic'){
    const tool=state.semanticTool[c.id]||'dbt'
    return SEMANTIC[c.job]?.[tool]?.ans || AGENTS[c.cols[winCol(c,state)].a].ans
  }
  if(origin==='custom') return state.customAns[c.id] || 'Custom'
  return AGENTS[c.cols[winCol(c,state)].a].ans
}
export function officialDef(c, state){
  const origin=state.origin[c.id]||'agent'
  if(origin==='custom' && state.edits[c.id]) return state.edits[c.id].split('\n').map(s=>s.trim()).filter(Boolean)
  if(origin==='semantic') return SEMANTIC[c.job]?.[state.semanticTool[c.id]||'dbt']?.lines || []
  return AGENTS[c.cols[winCol(c,state)].a].def
}
export function effectiveAnswer(i, state){
  const a=AGENTS[i], c=conflictByAgent(i)
  if(!c || isVariant(c.id, i, state)) return a.ans
  if(state.verified.includes(i)) return officialAnswer(c, state)
  return a.ans
}
export function effectiveDef(i, state){
  const a=AGENTS[i], c=conflictByAgent(i)
  if(c && state.verified.includes(i)) return officialDef(c, state)
  return a.def
}

export function tally(job, state){
  const ids=jobIds(job).filter(i=>{const c=conflictByAgent(i); return !(c && isVariant(c.id, i, state))})
  if(!ids.length) return {majority:0, count:0}
  const answers=ids.map(i=>effectiveAnswer(i, state))
  const freq={}
  for(const ans of answers) freq[ans]=(freq[ans]||0)+1
  return {majority:Math.max(...Object.values(freq)), count:ids.length}
}
export function jobScore(job, state){
  const t=tally(job, state)
  if(t.count<2) return null
  return Math.round(100*t.majority/t.count)
}
export function companyParts(state){
  let maj=0, n=0
  const rows=JOB_ORDER.map(job=>{
    const t=tally(job, state)
    const score=t.count<2?null:Math.round(100*t.majority/t.count)
    if(t.count>=2){maj+=t.majority; n+=t.count}
    return {job, ...t, score}
  })
  return {maj, n, score:n?Math.round(100*maj/n):100, rows}
}

export function isOpen(c, state){
  if(state.resolved[c.id]==='official' || state.resolved[c.id]==='variant') return false
  const ids=c.cols.map(col=>col.a).filter(i=>!isVariant(c.id, i, state))
  return new Set(ids.map(i=>AGENTS[i].ans)).size>=2
}
export function openConflicts(state){return CONF.filter(c=>isOpen(c, state))}

export function adoptionPlan(c, state){
  const ans=officialAnswer(c, state)
  const members=c.cols.map(col=>col.a).filter(i=>!isVariant(c.id, i, state))
  const need=members.filter(i=>AGENTS[i].ans!==ans)
  const matched=members.filter(i=>AGENTS[i].ans===ans)
  const verifiedNeed=need.filter(i=>state.verified.includes(i))
  const days=need.map((i,k)=>({i, day:ADOPT_DAYS[k]??(6+k), done:state.verified.includes(i)}))
  return {members, need, matched, verifiedNeed, days, ans}
}

export function agentStatus(i, state){
  const a=AGENTS[i], c=conflictByAgent(i)
  if(c && isVariant(c.id, i, state)) return 'variant'
  if(state.verified.includes(i)) return 'adopted'
  if(c && state.resolved[c.id]==='official' && state.suggested.includes(c.id) && a.ans!==officialAnswer(c, state)) return 'suggested'
  if(a.st==='orphan') return 'orphan'
  if(a.st==='stale') return 'stale'
  if(c && isOpen(c, state) && a.st==='conflict') return 'conflict'
  if(a.st==='conflict') return 'ok'
  return a.st
}

export function blockLive(b, state){
  if(b.id==='c1' || b.id==='c2') return state.resolved[b.id]==='official' || b.pub
  return b.pub || state.resolved[b.id]==='official'
}

export function deptConflicts(state){
  const names=['RevOps','Data','CS','Marketing','Sales','Support']
  const m=Object.fromEntries(names.map(n=>[n,0]))
  for(const c of openConflicts(state)) m[c.odept]=(m[c.odept]||0)+1
  return names.map(n=>[n, m[n]||0])
}

export function storyState(verifiedCount){
  const state=emptyState()
  if(verifiedCount<0) return state
  state.resolved.c1='official'
  state.wins.c1=3
  state.origin.c1='agent'
  state.suggested=['c1']
  state.verified=[0,1,2].slice(0, Math.max(0, verifiedCount))
  return state
}

export const SCORE_HELP = 'The company score is the share of agents on shared jobs whose answer matches the most common answer for that job. A job scores 100 when everyone still in it agrees. Valid variants are left out. A job with one agent is not scored. Concord does not run agents to compute this.'
export const INITIAL = companyParts(emptyState())
