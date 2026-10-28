// Live-scan preview data and the consistency score.
// Detection reads definitions and answers already on record. Nothing here runs or edits an agent.

export const PEOPLE = 480
export const SARA_ROLE = 'Head of RevOps'
export const LS_KEY = 'concord-live-preview-v1'

export const TOOLS = {
  claude: {n:'Claude', a:'C', c:'#82B9D9', via:'Compliance API'},
  n8n: {n:'n8n', a:'n', c:'#58A2CD', via:'REST API'},
  chatgpt: {n:'ChatGPT', a:'G', c:'#ABD1E6', via:'Compliance API'},
}
export const DC = {
  CS:'#82B9D9', Sales:'#58A2CD', Finance:'#8CECC7', RevOps:'#ABD1E6', Exec:'#D5E8F2',
  Support:'#B2F3D9', Marketing:'#65E6B4', 'Sales Ops':'#EAF3F9', People:'#ECFCF6',
  Eng:'#9AABB3', Legal:'#C5D8E0', Data:'#3FE0A1',
}
export const BLIND = 'The Compliance API cannot see which connectors or MCP servers a Claude project uses.'
export const N8N_NOTE = 'n8n has no execute endpoint. Triggering a webhook would run the workflow, including its Slack post, so Concord never does.'

import {LIVE_AGENTS, LIVE_CONF, LIVE_BLOCKS, LIVE_JOBS} from './liveModel.js'
export const AGENTS = LIVE_AGENTS
export const JOB_ORDER = LIVE_JOBS
export const CONF = LIVE_CONF
export const BLOCKS = LIVE_BLOCKS

export const SEMANTIC = {}

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

// Number answers match after rounding. Everything else matches as text.
export function answerKey(ans){
  const s=String(ans??'').trim()
  if(/^[+-]?(?:\d+\.\d+|\d+\.|\.\d+|\d+)$/.test(s)){
    const n=Number(s)
    if(Number.isFinite(n)) return 'n:'+Math.round(n)
  }
  return 's:'+s
}
function jobAgents(job, state){
  return jobIds(job).filter(i=>{const c=conflictByAgent(i); return !(c && isVariant(c.id, i, state))})
}
function modeKey(keys){
  const freq=new Map()
  let best=keys[0]??'', n=0
  for(const k of keys){
    const c=(freq.get(k)||0)+1
    freq.set(k, c)
    if(c>n){n=c; best=k}
  }
  return best
}
// One scorer. A job score is the share of agents on that job whose answer matches
// the official answer, or the most common answer when none is picked. A job with
// fewer than two agents is unscored. The consistency score is the average of the
// job scores, weighted by how many agents each scored job has.
export function scores(state){
  const rows=JOB_ORDER.map(job=>{
    const ids=jobAgents(job, state)
    const count=ids.length
    if(count<2) return {job, majority:0, count, score:null}
    const keys=ids.map(i=>answerKey(effectiveAnswer(i, state)))
    const c=conflictByJob(job)
    const target=c&&state.resolved[c.id]==='official' ? answerKey(officialAnswer(c, state)) : modeKey(keys)
    const majority=keys.filter(k=>k===target).length
    return {job, majority, count, score:Math.round(100*majority/count)}
  })
  const scored=rows.filter(r=>r.score!=null)
  const n=scored.reduce((s,r)=>s+r.count,0)
  const maj=scored.reduce((s,r)=>s+r.majority,0)
  const score=n?Math.round(scored.reduce((s,r)=>s+r.score*r.count,0)/n):100
  return {maj, n, score, rows}
}
export function tally(job, state){
  const row=scores(state).rows.find(r=>r.job===job)
  return row?{majority:row.majority, count:row.count}:{majority:0, count:0}
}
export function jobScore(job, state){
  const row=scores(state).rows.find(r=>r.job===job)
  return row?row.score:null
}
// How a shared job reads in the status system. Counts do not change.
// 100 is In sync. An open high-severity job is Conflict. Medium is At risk.
// Low severity is Needs sign-off. A signed-off job that is not 100 yet is Drift.
export function jobPresentation(job, state){
  const score=jobScore(job, state)
  const c=conflictByJob(job)
  if(c && state.resolved[c.id]==='variant') return {kind:'sync', label:'Valid variant', score}
  if(score==null) return {kind:'unknown', label:'Not checked', score}
  if(score===100) return {kind:'sync', label:'Consistent', score}
  if(c && state.resolved[c.id]==='official') return {kind:'drift', label:'Drift detected', score}
  if(c && isOpen(c, state)){
    if(c.sev==='bad') return {kind:'conflict', label:'Inconsistent', score}
    if(c.sev==='warn') return {kind:'risk', label:'At risk', score}
    return {kind:'review', label:'Needs sign-off', score}
  }
  return {kind:'drift', label:'Drift detected', score}
}
export function companyParts(state){return scores(state)}

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
  const names=['RevOps']
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

export const SCORE_COMPANY = 'How many of your agents agree, out of 100. Bigger jobs count more. 100 means every job is in sync.'
export const SCORE_JOB = 'How many agents doing this job match the official answer, out of 100. 100 means they all agree.'
export const SCORE_HELP = SCORE_COMPANY
export const INITIAL = companyParts(emptyState())
