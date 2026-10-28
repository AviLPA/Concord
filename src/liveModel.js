// Live preview: agents and conflicts built from latest-scan.json (real n8n executions).
import SCAN from './latest-scan.json'
export {SCAN}
export const TENANT = 'Private live scan · example jobs'
const ID={accounts_at_risk:'c1',arr_this_quarter:'c2',discount_cap:'c3',critical_tickets:'c4',mql_scoring:'c5',dirty_pipeline:'c6',open_p1_agree:'c8'}
const SEV={accounts_at_risk:'bad',arr_this_quarter:'bad',discount_cap:'bad',critical_tickets:'warn',mql_scoring:'warn',dirty_pipeline:'info'}
const FL=[['data_source','Data source'],['rule','Rule'],['time_window','Time window'],['calculation','Calculation'],['result_unit','Result + unit']]
const fmt=(v,u)=>u==='USD'?'$'+Number(v).toLocaleString('en-US'):u==='% max discount'?v+'%':String(v)
const ago=t=>{const m=Math.max(1,Math.round((Date.now()-Date.parse(t))/60000));return m<60?m+'m':m<1440?Math.round(m/60)+'h':Math.round(m/1440)+'d'}
export const LIVE_AGENTS=[], LIVE_CONF=[], LIVE_BLOCKS=[], LIVE_JOBS=[]
for(const j of SCAN.jobs){
  const start=LIVE_AGENTS.length
  LIVE_JOBS.push(j.label)
  const off=j.job==='accounts_at_risk'?j.agents.findIndex(a=>a.builder==='Sara'):-1
  for(const a of j.agents){
    LIVE_AGENTS.push({n:a.workflow_name, job:j.label, tool:(a.tool||'n8n').toLowerCase(), b:(a.tool||'n8n')+' · built by '+(a.builder||'—'), dept:a.dept||'RevOps', own:a.builder||'Demo admin', src:a.fields.data_source,
      up:ago(a.execution_finished), st:j.status==='conflict'?'conflict':'ok', onBlock:false, ans:fmt(a.value,a.unit), sub:a.unit, users:1,
      evidence:`n8n execution #${a.execution_id} · ${a.execution_finished} · “${a.value} ${a.unit}”`,
      def:FL.map(([k,l])=>`${l}: ${a.fields[k]}`), fields:a.fields, split:j.split_fields, wf:a.workflow_id})
  }
  const ids=j.agents.map((_,k)=>start+k)
  if(j.status!=='conflict') continue
  const vals=j.agents.map(a=>fmt(a.value,a.unit))
  LIVE_CONF.push({id:ID[j.job]||j.job, t:`${j.label}: ${j.agents.length} answers`, job:j.label, type:'Definition', sev:SEV[j.job]||'warn', odept:j.agents[j.agents.length-1].dept||'RevOps', age:ago(j.agents[0].execution_finished), owner:'Demo admin',
    d:`${j.agents.length} n8n workflows answer the same job differently. They split on: ${j.split_fields.join(', ')}.`,
    q:j.label, note:`Read from recorded n8n executions (pulled ${SCAN.pulled_at}). Concord did not re-run the workflows.`,
    cols:ids.map(a=>({a})), win:off>=0?off:0, official:off>=0?'Official: 28, signed by Sara Klein, Head of RevOps':undefined, split:j.split_fields,
    impact:[vals.join(' · '),'recorded answers'], imp2:[j.agents.length+' agents','n8n workflows'], imp3:[j.split_fields.length+' fields','differ: '+j.split_fields.join(', ')]})
  LIVE_BLOCKS.push({id:ID[j.job]||j.job, n:j.label, v:'v1', job:j.label, own:'Demo admin', pub:false, calls:'—', upd:'Draft'})
}
