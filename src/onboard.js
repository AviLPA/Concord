// Landing, hands-on onboarding, search, and the owner resolve flow.
import * as M from './model.js'
import {lockup, status, tag, Brand} from './brand.js'
import {leadCta} from './lead.js'
import {SCAN, TENANT} from './liveModel.js'
let C=null
export const OB={step:'workspace',company:'Private live scan',name:'Demo admin',role:M.SARA_ROLE,size:'301–1,000 people',conn:{claude:false,n8n:false},scanned:false,searched:false,resolved:false,cid:'c1',q:'',dismissed:false}
export function initOB(ctx){C=ctx}
const esc=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))
const save=()=>C.save()
const SYN={'Count at-risk accounts':['at risk','at-risk','risk','churn','health'],'Sum ARR this quarter':['arr','revenue','recurring','quarter'],'Score MQLs':['mql','lead','score','scoring'],'Measure pipeline coverage':['pipeline','coverage','quota'],'Count overdue renewals':['renewal','renewals','overdue'],'Count open tickets':['ticket','tickets','support'],'Customer health':['customer health','health','churn','at risk','at-risk','risk','renewal','csat','nps','healthy'],'ARR':['arr','revenue','recurring','annual','mrr','bookings'],'Discount approval':['discount','discounts','pricing','quote','approval','approve','deal desk'],'Refund policy':['refund','refunds','return','returns','money back'],'Lead scoring':['lead','mql','score','scoring'],'Pipeline coverage':['pipeline','coverage','quota'],'Onboarding FAQ':['onboarding','hire','checklist']}
const STOP=new Set('how many much what which who is are the a an our we do does of for to in on this that it be can with my me show list give all any per'.split(' '))
function lev(a,b){if(Math.abs(a.length-b.length)>2)return 9;const d=[...Array(b.length+1).keys()];for(let i=1;i<=a.length;i++){let p=d[0];d[0]=i;for(let j=1;j<=b.length;j++){const t=d[j];d[j]=Math.min(d[j]+1,d[j-1]+1,p+(a[i-1]===b[j-1]?0:1));p=t}}return d[b.length]}

export function search(q){
  q=(q||'').toLowerCase().trim();if(!q)return []
  const toks=q.split(/[^a-z0-9%$.×-]+/).filter(t=>t.length>1&&!STOP.has(t))
  const jobsHit=Object.entries(SYN).filter(([,ws])=>ws.some(w=>q.includes(w)||toks.some(t=>t.length>=4&&w.length>=4&&lev(t,w)<=(w.length>=7?2:1))))
  const sc=new Map()
  M.AGENTS.forEach((a,i)=>{const text=[a.n,a.job,a.src,a.b,a.dept,...M.effectiveDef(i,C.S),a.ans].join(' ').toLowerCase();const words=text.split(/[^a-z0-9%$]+/);let s=0
    for(const t of toks){if(text.includes(t))s+=2;else if(t.length>=4&&words.some(w=>w.length>=3&&lev(t,w)<=(t.length>=7?2:1)))s+=1}
    if(jobsHit.some(([j])=>j===a.job))s+=6;if(s>0)sc.set(i,s)})
  const groups={}
  for(const [i,s] of sc){const j=M.AGENTS[i].job;(groups[j]=groups[j]||{job:j,ids:[],score:0});groups[j].score=Math.max(groups[j].score,s)}
  for(const g of Object.values(groups)) g.ids=M.jobIds(g.job)
  return Object.values(groups).sort((a,b)=>b.score-a.score||b.ids.length-a.ids.length).slice(0,6)
}
const CHIPS=['at-risk accounts','ARR this quarter','MQL','pipeline coverage','overdue renewals','open tickets']
export function searchBox(q,big=true){return `<div class="sbox ${big?'big':''}"><span class="sbi">${C.ic('search',big?18:15)}</span><input id="sq" autocomplete="off" placeholder="Search a business term or question, e.g. customer health, ARR, refund…" value="${esc(q||'')}"/>${q?'<button class="sclr" data-sclear title="Clear">×</button>':''}</div>
<div class="schips"><span class="dim">Try:</span>${CHIPS.map(c=>`<button class="schip" data-sq="${esc(c)}">${esc(c)}</button>`).join('')}</div><div id="sres">${results(q)}</div>`}
function results(q){
  if(!q||!q.trim())return `<div class="sempty">${C.ic('search',20)}<div><b>Search definitions and answers already on record</b><span>It shows the definition it read, and the answer that agent already gave.</span></div></div>`
  const R=search(q);if(!R.length)return `<div class="sempty"><div><b>No agents match “${esc(q)}”</b><span>Try at-risk accounts, ARR, MQL, pipeline, renewals, or tickets.</span></div></div>`
  return `<div class="smeta">${R.reduce((n,g)=>n+g.ids.length,0)} agents in ${R.length} job${R.length>1?'s':''} match “${esc(q)}”</div>`+R.map(group).join('')
}
function group(g){
  const c=M.conflictByJob(g.job), score=M.jobScore(g.job,C.S)
  const inCols=c?c.cols.map(k=>k.a):[], rest=g.ids.filter(i=>!inCols.includes(i))
  const answers=[...new Set(g.ids.map(i=>M.effectiveAnswer(i,C.S)).filter(a=>a&&a!=='—'))]
  const tools=[...new Set(g.ids.map(i=>M.AGENTS[i].tool))].map(t=>M.TOOLS[t].n).join(' and ')
  const agreed=score===100
  return `<section class="sg card"><div class="sgh"><div><h3>${esc(g.job)}</h3><div class="mut">${g.ids.length} agents · built in ${tools}${c?` · on record: “${esc(c.q)}”`:''}</div></div>
<div class="sga">${(()=>{const pres=M.jobPresentation(g.job,C.S);return status(pres.kind,pres.label)+(c&&M.isOpen(c,C.S)?`<button class="btn p" data-resolve="${c.id}">Resolve as owner →</button>`:'')})()}</div></div>
${c?`<div class="sgrid" style="--n:${c.cols.length}">${c.cols.map(k=>{const a=M.AGENTS[k.a], variant=M.isVariant(c.id,k.a,C.S);return `<div class="sc ${agreed||variant?'ok':''}"><div class="sch">${C.dav(a)}<div><b>${esc(a.n)}</b><span>${esc(a.b)} · ${esc(a.dept)}</span></div></div>${C.tool(a.tool)}<div class="scn">${esc(M.effectiveAnswer(k.a,C.S))}</div><div class="scl">${M.effectiveDef(k.a,C.S).map(esc).join('<br/>')}</div><div class="dim">${esc(a.evidence)}</div></div>`}).join('')}</div>`:''}
${rest.length?`<div class="srest">${c?'<div class="lbl" style="margin:0 0 4px">Also doing this job</div>':''}${rest.map(i=>{const a=M.AGENTS[i];return `<div class="sr">${C.dav(a)}<div class="srn"><b>${esc(a.n)}</b><span>${esc(a.b)} · ${esc(a.dept)}</span></div>${C.tool(a.tool)}<code>${esc(M.effectiveDef(i,C.S)[0]||'')}</code></div>`}).join('')}</div>`:''}</section>`
}

const RS={}
function rs(cid){
  if(RS[cid]) return RS[cid]
  const decided=C.S.resolved[cid]
  const plan=M.adoptionPlan(M.CONF.find(c=>c.id===cid), C.S)
  const finished=decided==='official' && plan.need.length===plan.verifiedNeed.length && C.S.suggested.includes(cid)
  RS[cid]={stage:finished||decided==='variant'?4:decided==='official'?2:0, pick:C.S.wins[cid]??null, mode:'agent', text:'', reason:C.S.reasons[cid]||'', sem:'', write:false, sandbox:false, publishBack:true}
  return RS[cid]
}
function verifySentence(a){
  return a.tool==='n8n'
    ? 'Opened the workflow and applied the suggestion. Concord re-read the workflow JSON and left every other step as written.'
    : 'Applied the suggestion in Claude. Concord re-read the project instructions.'
}
export function timelineMarkup(cid){
  const c=M.CONF.find(x=>x.id===cid); if(!c||!C.S.suggested.includes(cid)) return ''
  const plan=M.adoptionPlan(c,C.S)
  const who=plan.need.map(i=>M.AGENTS[i].b.split(' ')[0])
  return `<ol class="tl" data-timeline="${cid}">
<li class="done"><span class="day">Day 0</span><div><b>Suggested changes sent · 0/${plan.need.length}</b><span>Slack and email to ${who.join(', ')||'no one'}.</span></div></li>
${plan.days.map(d=>{const a=M.AGENTS[d.i];return `<li class="${d.done?'done':''}"><span class="day">Day ${d.day}</span><div><b>${esc(a.b)} ${d.done?'· verified':'· waiting'}</b><span>${d.done?esc(verifySentence(a)):'The suggestion is with the builder.'}</span></div></li>`}).join('')}
</ol><div class="mut" data-adopt>${plan.verifiedNeed.length}/${plan.need.length} verified by re-reading${plan.matched.length?` · ${plan.matched.map(i=>esc(M.AGENTS[i].b.split(' ')[0])).join(', ')} already matched`:''}</div>`
}
function blockName(c){const b=M.BLOCKS.find(x=>x.job===c.job);return `${c.job} ${b?b.v:'v1'}`}
export function resolveView(cid,inOB){
  const c=M.CONF.find(x=>x.id===cid); if(!c) return '<p class="mut">Nothing to resolve here.</p>'
  const R=rs(cid), p=M.companyParts(C.S), js=M.jobScore(c.job,C.S), plan=M.adoptionPlan(c,C.S)
  const st=R.stage, sem=M.SEMANTIC[c.job]
  const chosen=R.mode==='agent'&&R.pick!=null?c.cols[R.pick]:null
  const ready=R.mode==='semantic'?!!R.sem:R.mode==='custom'?!!R.text.trim():R.pick!=null
  const offAns=R.mode==='semantic'&&sem?sem[R.sem].ans:R.mode==='custom'?(R.customAns||'Custom'):chosen?M.AGENTS[chosen.a].ans:''
  if(C.S.resolved[cid]==='variant'&&st===4) return variantDone(c,inOB)
  return `<div class="rv" data-cid="${cid}"><div class="rvh"><div><div class="lbl" style="margin:0 0 4px">Resolve as owner · ${esc(OB.name)} · ${esc(OB.role)}</div><h2>${esc(c.t)}</h2>
<div class="mut">${esc(c.note)} Question already in the logs: <b class="tx">“${esc(c.q)}”</b></div></div>
<div class="rvm"><div><span class="mut">This job</span><b data-jobscore>${js==null?'—':js}</b><span class="scorewhy">${esc(M.SCORE_JOB)}</span></div><div><span class="mut">Company</span><b data-coscore>${p.score}</b><span class="scorewhy">${esc(M.SCORE_COMPANY)}</span></div><div><span class="mut">Suggestions</span><b data-adopt>${C.S.suggested.includes(cid)?plan.verifiedNeed.length:0}/${plan.need.length}</b></div></div></div>
<div class="rsteps">${['Compare & decide','Reason & publish','Suggest & track'].map((s,i)=>{const d=i===0?st>=1:i===1?st>=2:st===4,on=i===0?st===0:i===1?st===1:st>=2&&st<4;return `<span class="${d?'done':on?'on':''}"><i>${d?'✓':i+1}</i>${s}</span>`}).join('<b></b>')}</div>
<div class="rcards" style="--n:${c.cols.length}">${c.cols.map((col,i)=>{const a=M.AGENTS[col.a], variant=M.isVariant(c.id,col.a,C.S), isOff=R.mode==='agent'&&R.pick===i
  const shown=C.S.verified.includes(col.a)?M.effectiveAnswer(col.a,C.S):a.ans
  const lines=C.S.verified.includes(col.a)?M.effectiveDef(col.a,C.S):a.def
  return `<div class="rc ${isOff?'pick':''} ${variant?'var':''}" ${st===0&&!variant?`data-rpick="${i}"`:''}><div class="rch">${C.dav(a)}<div><b>${esc(a.n)}</b><span>${esc(a.b)} · ${esc(a.dept)}</span></div>${variant?status('sync','Valid variant'):st===0?`<span class="rad ${isOff?'on':''}"></span>`:''}</div>${C.tool(a.tool)}
<div class="rcn ${C.S.verified.includes(col.a)?'ok':''}">${esc(shown)}</div><div class="dim">${esc(a.evidence)}</div><div class="rcl">${lines.map(esc).join('<br/>')}</div>
${st===0&&!variant?`<div class="rcp">${isOff?'Selected':'Make this official'}</div><button class="btn vbtn" data-rvariant="${i}">Different job / valid variant</button>`:''}</div>`}).join('')}</div>
<div class="rpanel">${st===0?stage0(c,R,sem,ready):st===1?stage1(R):st===2?stage2(c,R,plan):st===3?`<div class="rrow"><span class="mut">Days passing. Builders apply the change. Concord re-reads.</span><div class="bar" style="flex:1;max-width:260px"><span style="width:${plan.need.length?plan.verifiedNeed.length/plan.need.length*100:100}%"></span></div></div>${timelineMarkup(c.id)}`:stage4(c,R,inOB,offAns,plan)}</div></div>`
}
function stage0(c,R,sem,ready){
  const base=R.pick!=null?M.AGENTS[c.cols[R.pick].a]:null
  return `<div class="rrow"><span class="mut">${R.mode==='agent'&&base?`<b class="tx">${esc(base.n)}</b> is selected.`:R.mode==='semantic'&&R.sem?'Imported definition selected.':R.mode==='custom'&&R.text.trim()?'Your definition is ready.':'Choose a source for the official definition.'}</span><span style="flex:1"></span><button class="btn p" data-rnext ${ready?'':'disabled'}>Continue</button></div>
<div class="alts"><div class="alt"><b>Write your own</b><p>Start from an agent’s definition and edit it, or write a new one. Paste lines from more than one agent to combine them.</p>
<button class="btn ${R.write?'':'p'}" data-rwrite>${R.write?'Hide editor':'Write your own'}</button>
${R.write?`<label class="fl" style="margin-top:10px">Start from<select id="rbase"><option value="">Blank page</option>${c.cols.map((col,i)=>`<option value="${i}" ${R.pick===i&&R.mode==='custom'?'selected':''}>${esc(M.AGENTS[col.a].n)} · ${esc(M.AGENTS[col.a].ans)}</option>`).join('')}</select></label><textarea id="rdef" rows="5" placeholder="Write the official definition">${esc(R.text)}</textarea><label class="fl">Answer this definition should show<input id="rans" value="${esc(R.customAns||(base?base.ans:''))}" placeholder="e.g. 28"/></label>`:''}</div>
<div class="alt"><b>dbt or Atlan · Coming next</b></div>
<div class="rrow"><button class="btn" data-rvariant="job">Whole job is a different job</button><button class="btn" data-rsandbox>${R.sandbox?'Sandbox result below':'Run a sandboxed test (optional)'}</button></div>
${R.sandbox?`<div class="sandbox"><b>Sandbox result · opt-in</b><p>You asked for this. It has no side effects and will not post to Slack. Detection above used recorded answers only.</p><div class="sans">${c.cols.map(col=>`<span><b>${esc(M.AGENTS[col.a].ans)}</b> ${esc(M.AGENTS[col.a].b.split(' ')[0])}</span>`).join('')}</div></div>`:''}
<p class="dim">Tom’s “excludes contracts under $10k” line is the kind of thing that may be a real scope difference. Mark that card as a valid variant and it leaves the conflict.</p></div>`
}
function stage1(R){
  return `<label class="lbl" for="rreason" style="display:block">Why is this the official definition? Builders will see this.</label><input id="rreason" placeholder="Most complete signal, and it matches what we report to the board" value="${esc(R.reason)}"/>
<div class="schips" style="margin-top:8px"><span class="dim">Suggestions:</span>${['Most complete signal, matches what we report to the board','Uses the certified warehouse metric','Current policy. The old source is outdated.'].map(s=>`<button class="schip" data-rchip="${esc(s)}">${esc(s)}</button>`).join('')}</div>
<div class="rrow" style="margin-top:12px"><button class="btn" data-rback>← Back</button><span style="flex:1"></span><button class="btn p" data-rpublish ${R.reason.trim()?'':'disabled'}>${C.ic('cube',14)} Publish as official version</button></div>`
}
function stage2(c,R,plan){
  return `<div class="rblock">${C.ic('cube',18)}<div><b>${esc(blockName(c))} · official version</b><span>Owner ${esc(OB.name)} · “${esc(R.reason)}”</span></div>${status('sync','In sync')}</div>
<p class="mut" style="margin-top:10px">${plan.need.length} builder${plan.need.length===1?'':'s'} still ${plan.need.length===1?'uses':'use'} a different definition${plan.matched.length?`. ${plan.matched.map(i=>esc(M.AGENTS[i].b.split(' ')[0])).join(', ')} already matches.`:'.'} Send each of them a suggested change. They apply it. Concord re-reads to verify.</p>
<div class="rrow" style="margin-top:12px"><span style="flex:1"></span><button class="btn p" data-rsuggest>Send suggested changes</button></div>`
}
function stage4(c,R,inOB,offAns,plan){
  const js=M.jobScore(c.job,C.S), p=M.companyParts(C.S)
  return `${timelineMarkup(c.id)}<div class="rdone">${C.ic('check',18)}<div><b>This job is ${js==null?'—':js}. The recorded answer on the official definition is ${esc(plan.ans||offAns)}.</b><span>${plan.verifiedNeed.length}/${plan.need.length} builders applied the suggestion. Concord verified by re-reading. Company score is ${p.score}.</span></div></div>
<p class="mut" style="margin-top:8px">The next daily scans check that the builders applied the change. Concord alerts again if one is still off.</p>
<div class="rrow" style="margin-top:12px;flex-wrap:wrap">${inOB?`<button class="btn p" data-obfinish>Go to dashboard →</button><button class="btn" data-reset>Restart demo</button><a class="btn wbtn" href="#/watch">${C.ic('play',12)} Use case</a>`:`<a class="btn p" href="#/overview">Back to dashboard</a><a class="btn" href="#/conflicts/${c.id}">See adoption</a>`}</div>`
}
function variantDone(c,inOB){
  const p=M.companyParts(C.S)
  return `<div class="rv" data-cid="${c.id}"><div class="rvh"><div><div class="lbl">Resolve as owner · ${esc(OB.name)}</div><h2>${esc(c.t)}</h2></div><div class="rvm"><div><span class="mut">Company</span><b data-coscore>${p.score}</b><span class="scorewhy">${esc(M.SCORE_COMPANY)}</span></div><div><span class="mut">Open conflicts</span><b>${M.openConflicts(C.S).length}</b></div></div></div>
<div class="rdone">${C.ic('check',18)}<div><b>Marked as a different job / valid variant</b><span>Removed from the conflict count. No definition was changed, and no agent was edited. Company score is ${p.score}, with this job left out where it no longer counts as the same job.</span></div></div>
<div class="rrow" style="margin-top:12px">${inOB?'<button class="btn p" data-obfinish>Go to dashboard →</button>':'<a class="btn p" href="#/conflicts">Back to conflicts</a>'}</div></div>`
}
function commitFrom(R,c){
  const opts={reason:R.reason, origin:R.mode==='semantic'?'semantic':R.mode==='custom'?'custom':'agent', publishBack:R.mode==='semantic'&&R.publishBack}
  if(opts.origin==='agent') opts.pick=R.pick
  if(opts.origin==='semantic'){opts.semanticTool=R.sem; if(R.pick!=null) opts.pick=R.pick}
  if(opts.origin==='custom'){opts.edit=R.text; opts.customAns=R.customAns||'Custom'; if(R.pick!=null) opts.pick=R.pick}
  C.publish(c.id, opts)
}
function rerenderR(){const el=document.querySelector('.rv');if(!el)return;const cid=el.dataset.cid,inOB=!!document.querySelector('.ob');el.outerHTML=resolveView(cid,inOB);guide()}
function syncBadge(){const b=document.querySelector('[data-nav=conflicts] .ct');if(b)b.textContent=M.openConflicts(C.S).length}

const STEPS=[['workspace','Workspace'],['connect','Connect'],['scan','Scan'],['search','Search'],['resolve','Resolve']]
const reach=s=>({workspace:true,connect:OB.step!=='workspace',scan:OB.conn.claude&&OB.conn.n8n,search:OB.scanned,resolve:OB.searched||OB.resolved}[s])
let modal=null,mstate={},authGen=0,testGen=0
function guideText(){const s=OB.step
  if(s==='workspace')return 'Check the workspace, then click <b>Create workspace</b>.'
  if(s==='connect')return !OB.conn.claude?'Click <b>Connect</b> on Claude. The key is the Compliance API, created by the Primary Owner.':!OB.conn.n8n?'Now connect n8n. Test the connection, then save.':'Both tools connected. Click <b>Continue to scan</b>.'
  if(s==='scan')return OB.scanned?'Scan complete. Click <b>Continue to search</b>.':SC.running?'Reading projects, workflows, and answers already on record.':'Click <b>Start scan</b>.'
  if(s==='search'){const q=(document.getElementById('sq')||{}).value??OB.q;return !q?'Try <b>at-risk accounts</b>.':search(q).some(g=>{const c=M.conflictByJob(g.job);return c&&M.isOpen(c,C.S)})?'These definitions disagree. Click <b>Resolve as owner</b>.':'Try ARR, discount, or your own question.'}
  if(s==='resolve'){const R=rs(OB.cid);if(C.S.resolved[OB.cid]==='variant')return 'Marked as a valid variant. Go to the dashboard, or watch the build-time story.'
    return ['Pick a definition, write your own, or mark a valid variant if it is not the same job.','Add a short reason, then <b>Publish as official version</b>.','The official version is live. Click <b>Send suggested changes</b>. Builders apply them.','Watching the next few days. Concord is re-reading.','Done. Go to the dashboard, or watch how the next agent is prevented.'][R.stage]||''}
  return ''
}
export function guide(){const g=document.getElementById('obguide');if(g)g.innerHTML=`<span class="gdot"></span><span><b class="gk">Next:</b> ${guideText()}</span>`}
export function onboardPage(){const s=OB.step
  return `<div class="ob"><header class="obh"><a class="brand" href="#/" aria-label="concord, home">${lockup(20)}</a><a class="backsite" href="#/">Back to site</a><span class="obws" data-obws-label>${esc(OB.company||'Your company')}</span>
<nav class="obsteps">${STEPS.map(([k,l],i)=>{const idx=STEPS.findIndex(x=>x[0]===s),done=i<idx||(k==='resolve'&&OB.resolved);return `<button class="${k===s?'on':''} ${done?'done':''}" data-obgo="${k}" ${reach(k)?'':'disabled'}><i>${done?'✓':i+1}</i><span>${l}</span></button>`}).join('')}</nav>
<div class="obr"><a class="obwatch" href="#/watch">${C.ic('play',11)}<span>Use case</span></a><button class="obskip navbtn" data-reset style="cursor:pointer">Restart demo</button><a class="obskip" href="#/overview">Skip to app</a></div></header>
<div class="obguide" id="obguide"></div><main class="obm">${({workspace:wsStep,connect:connStep,scan:scanStep,search:searchStep,resolve:()=>resolveView(OB.cid,true)})[s]()}</main>${modal?modalHTML():''}</div>`}
const logo=()=>lockup(18)
function wsStep(){return `<div class="obgrid"><div class="card obcard"><h1>Create your workspace</h1><p class="sub">Demo admin sign-up. Scan reads real n8n execution results (example jobs). Nothing leaves your browser.</p>
<label class="fl">Company name<input id="f-company" value="${esc(OB.company)}"/></label><div class="frow2"><label class="fl">Your name<input id="f-name" value="${esc(OB.name)}"/></label><label class="fl">Your role<input id="f-role" value="${esc(OB.role)}"/></label></div>
<label class="fl">Company size<select id="f-size">${['301–1,000 people','Under 300 people','1,001–5,000 people'].map(o=>`<option ${OB.size===o?'selected':''}>${o}</option>`).join('')}</select><small class="dim">Concord is for companies on Claude Enterprise, usually 300 to 1,000 people. The Compliance API needs that plan.</small></label>
<button class="btn p big" data-obws style="margin-top:8px">Create workspace →</button></div>
<div class="obside"><div class="lbl">What happens next</div>${[['plug','Connect','Claude via the Compliance API. n8n via its REST API.'],['bot','Scan','Read instructions, workflow JSON, and answers already given.'],['search','Search','See every definition for a job, side by side.'],['check','Resolve','You pick or write the official version. Builders apply it.']].map(([i,t,d],k)=>`<div class="obs"><span>${k+1}</span><div><b>${t}</b><p>${d}</p></div></div>`).join('')}</div></div>`}
function connCard(k,name,desc){const on=OB.conn[k], count=M.AGENTS.filter(a=>a.tool===k).length
  return `<div class="card icard ${on?'on':''}"><div class="ich"><span class="tile" style="background:${M.TOOLS[k].c}">${M.TOOLS[k].a}</span><div><b>${name}</b><span>${desc}</span></div></div>
${on?`<div class="ion">${C.ic('check',14)} Connected · read-only · <b>${count} ${k==='claude'?'projects':'workflows'} visible</b></div>`:`<div class="mut" style="font-size:12px">${C.ic('lock',11)} Read-only</div><button class="btn p" data-connect="${k}">Connect</button>`}</div>`}
function connStep(){
  return `<div class="obwide"><h1>Connect where your people build agents.</h1><p class="sub">Concord reads agent instructions and the answers they've already given. Your teams stay in control of their agents.</p>
<div class="igrid">${connCard('claude','Claude','Compliance API · key from the Primary Owner')}${connCard('n8n','n8n','REST API · Owner or Admin key')}
<div class="card icard soon"><div class="ich"><span class="tile sem">S</span><div><b>dbt or Atlan · Coming next</b></div></div></div>
${['ChatGPT Enterprise','Microsoft Copilot Studio','Google Gemini','Zapier'].map(n=>`<div class="card icard soon"><div class="ich"><span class="tile g">${n[0]}</span><div><b>${n}</b><span>Coming soon</span></div></div>${tag('Coming soon')}</div>`).join('')}</div>
<div class="obfoot"><span class="mut">${OB.conn.claude&&OB.conn.n8n?'Claude and n8n are connected.':'Connect Claude and n8n to continue.'}</span><button class="btn p big" data-obgo="scan" ${OB.conn.claude&&OB.conn.n8n?'':'disabled'}>Continue to scan →</button></div></div>`}
function modalHTML(){
  const m=mstate
  if(modal==='claude') return `<div class="mbg" data-mclose></div><div class="modal" role="dialog"><div class="mh">${logo()}<span class="mx">⇄</span><span class="tile cl">C</span><button class="iconbtn" data-mclose style="margin-left:auto">${C.ic('x')}</button></div>
<h2>Connect Claude with the Compliance API</h2><p class="mut">A read-only key created by the workspace Primary Owner. You are signed in as ${esc(OB.name)}, ${esc(OB.role)}.</p>
<div class="scope"><div class="lbl">${Brand} will be able to read</div>${['Projects, instructions, and knowledge files','Chats and messages linked to a project','Who built each project, and when it changed'].map(s=>`<div class="sc-y">${C.ic('check',14)}${s}${tag('read')}</div>`).join('')}</div>
<div class="scope"><div class="lbl">${Brand} will not be able to</div>${['See which connectors or MCP servers a project uses','Invoke a project or send a message','Create, edit, or delete anything'].map(s=>`<div class="sc-n">${C.ic('x',14)}${s}</div>`).join('')}</div>
<div class="mf"><button class="btn" data-mclose>Cancel</button><button class="btn p" data-cauth ${m.busy?'disabled':''}>${m.busy?'<span class="spin"></span> Authorizing…':'Authorize read-only access'}</button></div></div>`
  const checks=n8nChecks()
  return `<div class="mbg" data-mclose></div><div class="modal" role="dialog"><div class="mh">${logo()}<span class="mx">⇄</span><span class="tile n8">n</span><button class="iconbtn" data-mclose style="margin-left:auto">${C.ic('x')}</button></div>
<h2>Connect your n8n instance</h2><p class="mut">Owner or Admin key, read-only. Concord reads workflow JSON and execution history. There is no execute endpoint, and Concord never calls a webhook.</p>
<label class="fl">Instance URL<input value="https://self-hosted n8n" spellcheck="false"/></label><label class="fl">API key<input type="password" value="n8n_api_demo_7f3a92c1e4b8" spellcheck="false"/><small class="dim">Demo value. In n8n: Settings, n8n API, Create an API key.</small></label>
<div class="tests-slot"><div class="tests">${checks.map((s,i)=>`<div>${i<(m.k||0)?C.ic('check',14)+esc(s):'<span class="dim">'+(i===0&&!m.testing?'Results appear here.':' ')+'</span>'}</div>`).join('')}</div></div>
<div class="mf"><button class="btn" data-mclose>Cancel</button><button class="btn" data-ntest ${m.testing?'disabled':''}>Test connection</button><button class="btn p" data-nsave ${m.k>=4?'':'disabled'}>Save connection</button></div></div>`
}
function n8nChecks(){return ['Reached self-hosted n8n','API key accepted · Owner, read-only','workflows:read and executions:read','Found '+M.AGENTS.filter(a=>a.tool==='n8n').length+' workflows with an AI step']}
function paintN8n(){
  const rows=document.querySelectorAll('.tests-slot .tests > div'), checks=n8nChecks()
  rows.forEach((row,i)=>{row.innerHTML=i<(mstate.k||0)?C.ic('check',14)+esc(checks[i]):'<span class="dim">'+(i===0&&!mstate.testing?'Results appear here.':' ')+'</span>'})
  const save=document.querySelector('[data-nsave]'), test=document.querySelector('[data-ntest]')
  if(save) save.disabled=(mstate.k||0)<4
  if(test) test.disabled=!!mstate.testing
}
const SC={running:false,timers:[]}
function scanStep(){const done=OB.scanned, jobs=new Set(M.AGENTS.map(a=>a.job)).size
  return `<div class="obwide"><h1>Scan for agents</h1><p class="sub"><b>${TENANT}</b> · live n8n results pulled ${esc(SCAN.pulled_at)} (${SCAN.jobs.length} jobs). Concord reads Claude projects through the Compliance API and n8n workflow JSON, then reads chat history and execution logs. It compares definitions.</p>
<div class="scan"><div class="card sphases">${['Reading Claude projects','Reading n8n workflows','Reading chats and execution logs','Comparing definitions on record'].map((p,i)=>`<div class="ph" data-ph="${i}"><i></i><div><b>${p}</b><span></span></div></div>`).join('')}
<div class="sbtn">${done?'':`<button class="btn p big" data-scan ${SC.running?'disabled':''}>${C.ic('search',14)} Start scan</button>`}</div></div>
<div class="sright"><div class="scount"><div><b id="k-all">0</b><span>agents found</span></div><div><b id="k-cl">0</b><span>in Claude</span></div><div><b id="k-n8">0</b><span>in n8n</span></div><div><b id="k-jobs">0</b><span>jobs</span></div></div>
<div class="card sfeed"><div class="lbl">Discovered agents</div><div id="feed" class="feedl"><div class="fempty">Agents appear here as Concord reads them.</div></div></div>
<div class="card sjobs"><div class="lbl">Jobs <span class="dim" id="jobsn"></span></div><div id="jobs" class="jchips"><span class="fempty">Agents doing the same job are grouped here.</span></div></div>
<div class="card sconf"><div class="lbl">Conflicts found</div><div id="confl" class="clist"><span class="fempty">Same job, different definition. Found by reading, not by running.</span></div></div></div></div>
<div class="obfoot"><span class="mut" id="scanmsg">${done?`Scan complete: ${M.AGENTS.length} agents, ${jobs} jobs, ${M.openConflicts(C.S).length} conflicts.`:''}</span>${!done&&SC.running?'<button class="btn" data-scanskip>Skip animation</button>':''}<button class="btn p big" data-obgo="search" id="toSearch" ${done?'':'disabled'}>Continue to search →</button></div></div>`}
function jobList(){const m={};M.AGENTS.forEach(a=>m[a.job]=(m[a.job]||0)+1);return M.JOB_ORDER.filter(j=>m[j]).map(j=>[j,m[j]])}
function fillScan(full){
  const cl=[],n8=[];M.AGENTS.forEach((a,i)=>(a.tool==='claude'?cl:n8).push(i));const J=jobList(),CF=M.CONF
  const id=x=>document.getElementById(x);if(!id('feed'))return
  const row=i=>{const a=M.AGENTS[i],d=document.createElement('div');d.className='frow';d.innerHTML=`${C.dav(a)}<div class="frn"><b>${esc(a.n)}</b><span>${esc(a.b)} · ${esc(a.dept)}</span></div>${C.tool(a.tool)}<span class="fj">${esc(a.job)}</span>`;return d}
  const ph=(i,state,txt)=>{const e=document.querySelector(`[data-ph="${i}"]`);if(!e)return;e.className='ph '+state;e.querySelector('span').textContent=txt||''}
  const counts=(c,n)=>{id('k-all').textContent=c+n;id('k-cl').textContent=c;id('k-n8').textContent=n}
  const feed=id('feed'),jobs=id('jobs'),confl=id('confl')
  const jobChip=([j,n])=>{const s=document.createElement('span');const cf=CF.find(c=>c.job===j);s.className='jc'+(cf&&M.isOpen(cf,C.S)?' bad':'');s.innerHTML=`${esc(j)} <b>${n}</b>`;return s}
  const confRow=c=>{const d=document.createElement('div');d.className='cr';const n=c.cols.filter(col=>!M.isVariant(c.id,col.a,C.S)).length;d.innerHTML=`<span class="sev" style="background:${M.isOpen(c,C.S)?{bad:'var(--status-conflict-fill)',warn:'var(--status-risk-fill)',info:'var(--status-review-fill)'}[c.sev]:'var(--sync)'}"></span><b>${esc(c.t)}</b><span class="mut">${n} definitions</span>`;return d}
  if(full){feed.innerHTML='';[...cl,...n8].forEach(i=>feed.appendChild(row(i)));counts(cl.length,n8.length);jobs.innerHTML='';J.forEach(j=>jobs.appendChild(jobChip(j)));id('k-jobs').textContent=J.length;id('jobsn').textContent=`· ${J.length}`;confl.innerHTML='';CF.forEach(c=>confl.appendChild(confRow(c)));ph(0,'done',cl.length+' projects');ph(1,'done',n8.length+' workflows');ph(2,'done','history read');ph(3,'done',M.openConflicts(C.S).length+' conflicts');return}
  SC.running=true;const T=(f,ms)=>SC.timers.push(setTimeout(f,ms));let t=300,c=0,n=0
  T(()=>{feed.innerHTML='';ph(0,'on','Compliance API…')},t)
  cl.forEach(i=>{t+=160;T(()=>{feed.appendChild(row(i));feed.scrollTop=feed.scrollHeight;counts(++c,n)},t)});t+=200;T(()=>{ph(0,'done',cl.length+' projects');ph(1,'on','workflow JSON…')},t)
  n8.forEach(i=>{t+=160;T(()=>{feed.appendChild(row(i));feed.scrollTop=feed.scrollHeight;counts(c,++n)},t)});t+=280;T(()=>{ph(1,'done',n8.length+' workflows');ph(2,'on','chats and execution logs…');jobs.innerHTML=''},t)
  J.forEach((j,k)=>{t+=140;T(()=>{jobs.appendChild(jobChip(j));id('k-jobs').textContent=k+1;id('jobsn').textContent=`· ${k+1}`},t)});t+=280;T(()=>{ph(2,'done','history read');ph(3,'on','comparing definitions…');confl.innerHTML=''},t)
  CF.forEach(cf=>{t+=320;T(()=>confl.appendChild(confRow(cf)),t)});t+=360
  T(()=>{ph(3,'done',M.openConflicts(C.S).length+' conflicts');SC.running=false;OB.scanned=true;save();id('scanmsg').innerHTML=`<b class="tx">Scan complete:</b> ${M.AGENTS.length} agents, ${J.length} jobs, ${M.openConflicts(C.S).length} conflicts.`;id('toSearch').disabled=false;const stepBtn=document.querySelector('.obsteps [data-obgo=search]');if(stepBtn)stepBtn.disabled=false;const sk=document.querySelector('[data-scanskip]');if(sk)sk.remove();guide()},t)
}
function stopScan(){SC.timers.forEach(clearTimeout);SC.timers=[];SC.running=false}
function searchStep(){return `<div class="obwide"><h1>Search across every agent</h1><p class="sub">Type a business term or a question. You get every agent on that job, the definition Concord read, and the answer already on record.</p>${searchBox(OB.q)}</div>`}

function syncField(){
  const cols=[["Maya’s renewal radar",'Claude','35',-52,20],["Dan’s pipeline watch",'Claude','42',44,-28],["Priya’s escalation flow",'n8n','17',-20,16],["Sara’s official renewal risk",'n8n','28',0,0]]
  return `<div class="syncfield"><div class="sfline"></div>${cols.map((c,i)=>`<div class="sfcol${i===3?' official':''}" style="--off:${c[3]};--snap:${c[4]};--i:${i}"><div class="sfmove"><span class="sfn"><span class="off">${c[2]}</span><span class="on">28</span></span><span class="sfdot"></span></div><span class="sfl"><span class="sfnm">${esc(c[0])}</span><span class="sfpl"> · ${esc(c[1])}</span></span></div>`).join('')}</div>`
}
const BURGER=`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`
const CLOSE=`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>`
const MKT=[['home','Home','#/'],['how','How it works','#/how'],['watch','Use case','#/watch'],['pricing','Pricing','#/pricing'],['about','About','#/about']]
function mktLinks(active){return MKT.map(([id,label,href])=>`<a href="${href}" class="${active===id?'on':''}"${active===id?' aria-current="page"':''}>${label}</a>`).join('')}
function marketFoot(active){
  return `<footer class="sitefoot"><div class="sitefoot-in"><a class="brand" href="#/">${lockup(16)}</a><nav class="sitefoot-nav" aria-label="Footer">${mktLinks(active)}</nav><div class="sitefoot-meta"><span>Let everyone build. Keep every answer consistent.</span><span>Works with Claude and n8n.</span><a href="#/overview">Open the demo</a><a href="#/start">Try it with sample data</a></div></div></footer>`
}
export function marketShell(active, main){
  return `<div class="mkt"><header class="sitebar"><div class="sitebar-in"><a class="brand" href="#/" aria-label="Concord home">${lockup(20)}</a><nav class="sitenav" aria-label="Primary">${mktLinks(active)}</nav><div class="siteacts"><a class="sitein" href="#/start">Try it with sample data</a><a class="btn p" href="#/overview">Open the demo</a></div><button class="siteburger" type="button" data-navtoggle aria-expanded="false" aria-label="Open menu">${BURGER}</button></div><div class="sitemenu" hidden><nav aria-label="Mobile">${mktLinks(active)}</nav><a class="sitein" href="#/start">Try it with sample data</a><a class="btn p" href="#/overview">Open the demo</a></div></header><div class="lp">${main}</div>${marketFoot(active)}</div>`
}
let syncTimer=0, readTimer=0, syncObs=null
function readDelay(){
  const cs=getComputedStyle(document.documentElement)
  const ms=name=>{
    const raw=cs.getPropertyValue(name).trim()
    const n=parseFloat(raw)
    if(!raw||Number.isNaN(n)) return 0
    return /ms$/.test(raw)?n:n*1000
  }
  return ms('--dur-snap')+2*ms('--stagger')
}
function watchSyncRead(el){
  if(syncObs) syncObs.disconnect()
  let synced=el.classList.contains('is-sync')
  syncObs=new MutationObserver(()=>{
    const on=el.classList.contains('is-sync')
    if(on===synced) return
    synced=on
    clearTimeout(readTimer)
    if(el.classList.contains('is-read')) el.classList.remove('is-read')
    if(!on) return
    readTimer=setTimeout(()=>{if(el.isConnected&&el.classList.contains('is-sync')) el.classList.add('is-read')}, readDelay())
  })
  syncObs.observe(el,{attributes:true, attributeFilter:['class']})
}
export function mountLanding(){
  clearInterval(syncTimer);clearTimeout(syncTimer);clearTimeout(readTimer)
  const el=document.getElementById('lcard');if(!el)return
  const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.classList.remove('is-sync','is-read','is-reduce')
  if(reduce){el.classList.add('is-reduce','is-sync','is-read');return}
  const cycle=()=>{
    const card=document.getElementById('lcard');if(!card)return
    card.classList.remove('is-sync','is-read')
    syncTimer=setTimeout(()=>{if(!card.isConnected)return;card.classList.add('is-sync');readTimer=setTimeout(()=>{if(card.isConnected)card.classList.add('is-read')},500)
      syncTimer=setTimeout(cycle,3000)},2300)
  }
  cycle()
}
function agentTiles(){
  const T=[['Maya',"Maya’s renewal radar",'CS','Claude','35',0],['Dan',"Dan’s pipeline watch",'Sales','Claude','42',0],['Priya',"Priya’s escalation flow",'Support','n8n','17',0],['Sara',"Sara’s official renewal risk",'RevOps','n8n','28',1]]
  return `<div class="atiles">${T.map(([n,a,t,tool,v,o],i)=>`<div class="atile${o?' official':''}" style="--i:${i}"><div class="atop"><span class="av">${n[0]}</span><b>${n}</b></div><span class="aname">${a}</span><span class="ameta">${t} · <span class="tool">${tool}</span></span><div class="anum"><span class="anc">${v}</span><span class="ans">28</span></div><span class="aoff">${o?'Official version':'Same job'}</span></div>`).join('')}</div>`
}
export function landingPage(){
  const defs=[
    ['35',"Maya’s renewal radar",'CS','Claude','no login 21d OR &gt; 3 tickets'],
    ['42',"Dan’s pipeline watch",'Sales','Claude','tickets &gt; 5 OR CSAT &lt; 3.5'],
    ['17',"Priya’s escalation flow",'Support','n8n','usage drop &gt; 40%, excl. under $10k'],
    ['28',"Sara’s official renewal risk",'RevOps','n8n','usage + NPS + tickets, score &lt; 60'],
  ]
  const steps=[
    ['01','unknown','Scanning','Find','Concord checks the agents people already built and groups the ones doing the same job.'],
    ['02','conflict','Conflict','Show','When their answers differ, the owner of that number sees each answer and why.'],
    ['03','review','Decide','Decide','The owner signs off one official version. Each builder updates their own agent.'],
    ['04','sync','Confirm','Confirm','Later checks confirm every agent is consistent with it — and alert if one drifts.'],
  ]
  const jobs=[
    ['Accounts at risk','review','Fixing','2 of 4 updated'],
    ['ARR','review','Needs sign-off','Owner to decide'],
    ['Lead scoring','conflict','Inconsistent','65 vs 70'],
  ]
  const rows=[
    ["Sara’s official renewal risk · n8n",'sync','28','Consistent'],
    ["Maya’s renewal radar · Claude",'sync','28','Consistent'],
    ["Dan’s pipeline watch · Claude",'drift','42','Not updated yet'],
    ["Priya’s escalation flow · n8n",'drift','17','Not updated yet'],
  ]
  const story=['Sara gets the alert: four agents, four numbers for “How many accounts are at risk?”','She opens the inconsistency: Maya 35 · Dan 42 · Priya 17 · Sara 28 — each with its rule.','She signs <b>28</b> as the official version.','Builders update their own agents. Concord re-reads. What’s still inconsistent stays visible until it matches.']
  const gets=[
    ['See every place','See every place personal agents collide on the same job.'],
    ['Know why','Definition, data or instructions behind each answer.'],
    ['Fix it once','The owner signs the official version; builders update their own agents.'],
  ]
  return marketShell('home', `<section class="lhero"><div class="lht"><h1>Your teams' AI agents are giving different answers to the same question.</h1>
<p class="lsub">Concord finds where they disagree, shows you why, and gets every agent onto one official answer.</p>
<div class="lcta"><a class="btn p xl" href="#/start">Try it with sample data</a><a class="btn xl" href="#/overview">Open the demo</a></div></div>
<div class="lcard ltree" id="lcard"><div class="lcardh"><span class="q">“How many accounts are at risk?”</span><span class="slot" data-off>${status('conflict','Conflict · 4 answers',{big:true})}</span><span class="slot" data-on>${status('sync','4 of 4 consistent',{big:true})}</span></div>
<svg class="lbr lbr-top" viewBox="0 0 400 44" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M200 0 C200 26 50 18 50 44"/><path pathLength="1" d="M200 0 C200 26 150 18 150 44"/><path pathLength="1" d="M200 0 C200 26 250 18 250 44"/><path pathLength="1" d="M200 0 C200 26 350 18 350 44"/></svg>${agentTiles()}<svg class="lbr lbr-bot" viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" class="" d="M50 0 C50 22 200 14 200 40"/><path pathLength="1" class="" d="M150 0 C150 22 200 14 200 40"/><path pathLength="1" class="" d="M250 0 C250 22 200 14 200 40"/><path pathLength="1" class="om" d="M350 0 C350 22 200 14 200 40"/></svg><div class="lofficial"><span class="lon">28</span><span>Official answer · Sara Klein, RevOps</span></div><p class="mcap">Example data · same job, four agents, one official version: 28 (Sara Klein)</p></div></section>
<div class="lband" data-hero-line><span class="mut">Security tools check whether an agent is safe. </span><b>${Brand} checks whether agents built for the same job are consistent.</b></div>
<section class="lsec" id="drift"><div class="lsh"><span class="eyebrow">Why answers drift</span><h2>Why answers drift</h2></div>
<div class="l3 ldrift"><div><span class="lsn">01</span><b>Private context</b><p>People build on their own spreadsheets, old threads and last quarter's deck.</p></div><div><span class="lsn">02</span><b>Different definitions</b><p>Each team defines 'at risk' its own way.</p></div><div><span class="lsn">03</span><b>Conflicting sources</b><p>Even official documents disagree with each other.</p></div></div></section>
<section class="lsec"><div class="lsh"><span class="eyebrow">The problem</span><h2>Same question. Different answers.</h2>
<p>People don’t wait for a shared platform. They build agents for themselves — and they keep building. The friction starts when several of those personal agents are meant to answer the same company question. Each builder picks a definition that works for them. Same job. Different rules. Different numbers. Those numbers don’t stay personal — they show up in forecasts, customer calls and board decks.</p></div>
<p>Four agents at a sample company answer “How many accounts are at risk?” with 35, 42, 17 and 28. Each was built by a different person for their own work. Concord shows why they differ. The official answer is 28, signed off by Sara Klein, Head of RevOps.</p>
<div class="l4">${defs.map(r=>`<div class="lc"><div class="lcn">${r[0]}</div><b>${r[1]}</b><span>${r[2]} · ${r[3]}</span><code>${r[4]}</code></div>`).join('')}</div>
<div class="l3">${gets.map(([t,d])=>`<div><b>${t}</b><p>${d}</p></div>`).join('')}</div></section>
<section class="lsec" id="how"><div class="lsh"><span class="eyebrow">How it works</span><h2>How it works</h2></div>
<div class="lsteps">${steps.map(s=>`<div class="lstep k-${s[1]}"><div class="lstephead"><span class="lsn">${s[0]}</span>${status(s[1],s[2])}</div><b>${s[3]}</b><p>${s[4]}</p></div>`).join('')}</div></section>
<section class="lsec"><div class="lsh"><span class="eyebrow">Product</span><h2>From conflict to one official version.</h2><p>What Concord looks like after a scan finds the same job with different answers.</p></div>
<ol class="lstory">${story.map((t,i)=>`<li><span class="lsn">0${i+1}</span><p>${t}</p></li>`).join('')}</ol>
<div class="lprod"><div class="lprodbar">${lockup(14)}<span>Private live scan · Inconsistencies · Accounts at risk</span></div>
<div class="lbanner"><div><b>Reminder to Sara Klein</b><span>Accounts at risk: 2 of 4 agents still give a different answer (42, 17).</span></div><span class="act">Open in Concord</span></div>
<div class="lsplit"><div class="ljobs">${jobs.map((j,i)=>`<div class="ljob k-${j[1]} ${i===0?'on':''}"><b>${j[0]}</b><span>${status(j[1],j[2])} <span class="mut">${j[3]}</span></span></div>`).join('')}</div>
<div class="lmain"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><b style="font-size:18px">Accounts at risk · official v2</b>${status('review','2 of 4 updated')}</div>
<div class="mut" style="margin:4px 0 12px">Official version: 28, warehouse score, signed off by Sara Klein</div>
<div class="ldef">score = 0.5·usage + 0.3·nps + 0.2·tickets<br>at_risk = score &lt; 60<br><span class="c"># warehouse score, signed off by Sara Klein</span></div>
${rows.map(a=>`<div class="larow k-${a[1]}"><b>${a[0]}</b><span class="n">${a[2]}</span>${status(a[1],a[3])}</div>`).join('')}
</div></div></div></section>
<section class="lsec lwho"><p><b>Who decides.</b> The person who owns the number signs the official version. Builders keep building. Concord never rewrites their agents.</p>
<p class="lnext"><b>Coming next.</b> Today Concord compares number answers. Next: written answers (refund windows, onboarding steps). Connecting a semantic layer you already use (dbt or Atlan) is also coming next.</p>
<p class="ltrust"><b>Setup.</b> Read-only. Concord reads your agents' definitions and answers. It never runs or edits them. Claude needs an Enterprise plan. n8n connects with an Owner or Admin API key. Scans run daily.</p></section>
<section class="lclose" id="hear"><h2>Seen two teams bring different numbers to the same meeting? Tell us about it.</h2><div class="lcta"><a class="btn p xl" href="#">Book 15 minutes</a></div></section>`)
}
export function howPage(){
  const g=i=>`<i${[2,5,9,14].includes(i)?' class="g"':''}></i>`
  const rows=[
    ['01','Find','Concord checks the agents people already built and groups the ones doing the same job.',`<div class="hviz hv1">${Array.from({length:16},(_,i)=>g(i)).join('')}</div>`],
    ['02','Show','When their answers differ, the owner of that number sees each answer and why: definition, data source or instructions.','<div class="hviz hv2"><span>Definition</span><span>Data source</span><span>Instructions</span></div>'],
    ['03','Decide','The owner signs off one official version. Each builder updates their own agent. Concord never rewrites it.','<div class="hviz hv5"><i></i><i></i><i></i><i></i><em>→</em><b></b></div>'],
    ['04','Confirm','Later checks confirm every agent is consistent with it — and alert the owner if one drifts.','<div class="hviz hv4"><i></i><i></i><i></i><i></i></div>'],
  ]
  return marketShell('how', `<section class="mhero"><span class="eyebrow">How it works</span><h1>From different answers to one consistent official version.</h1></section>
<div class="hrows">${rows.map(r=>`<div class="hrow"><div class="hn">${r[0]}<span class="hbar"></span></div><div><h3>${r[1]}</h3><p>${r[2]}</p></div>${r[3]}</div>`).join('')}</div>
<div class="hduo"><div class="hpanel"><span class="eyebrow">Intentional differences</span><p class="hlede">If a team really does a different job, for example only counting contracts over $10k, the owner marks it as a valid variant and Concord stops flagging it.</p>
<div class="hvt"><div><i class="s"></i><span class="ln s"></span></div><div><i class="s"></i><span class="ln s"></span></div><div><i class="t"></i><span class="ln t"></span></div></div></div>
<div class="hpanel"><span class="eyebrow">Setup</span><p class="hlede">Read-only. Concord reads your agents' definitions and answers. It never runs or edits them.</p><ul class="hspecs"><li><span class="k">Claude</span>Claude needs an Enterprise plan (Compliance API).</li><li><span class="k">n8n</span>n8n connects with an Owner or Admin API key.</li><li><span class="k">Daily</span>Scans run daily.</li></ul></div></div>`)
}
export function pricingPage(){
  const tiers=[
    ['Consistency audit','Free','We look at the agents you already have and show where agents doing the same job disagree.',true],
    ['Team','Talk to us','For teams building agents in more than one tool. One official version for every key question, a named owner for each, and proof every agent follows it.',false],
    ['Enterprise','Talk to us','For a wider rollout across workspaces. Coming next: connect the semantic layer you already use.',false],
  ]
  return marketShell('pricing', `<section class="mhero"><span class="eyebrow">Pricing</span><h1>Pricing that fits how your teams build.</h1><p>Claude connections need Claude Enterprise.</p></section>
<div class="prices">${tiers.map(t=>`<article class="price card ${t[3]?'feat':''}"><h2>${t[0]}</h2><div class="pricev">${t[1]}</div><p>${t[2]}</p>${leadCta(t[3]?'p':'')}</article>`).join('')}</div>`)
}
export function aboutPage(){
  return marketShell('about', `<section class="mhero"><span class="eyebrow">About</span><h1>Every team should work from consistent answers to the same question.</h1></section>
<div class="hduo hab">
<div class="hpanel"><div class="hviz hv1">${Array.from({length:16},()=>'<i></i>').join('')}</div><p class="hbig">People build their own agents for their own work, constantly. That's a good thing.</p><p>A CS lead's renewal check, a sales watchlist, a support escalation flow, a RevOps score. Nobody waits for a shared platform, and nobody should have to.</p></div>
<div class="hpanel"><div class="hviz hv5"><i></i><i></i><i></i><i></i><em>→</em><b></b></div><p class="hbig">The problem starts when several personal agents meant for the same job give different numbers.</p><p>Each builder picks a definition that works for them. Same job, different rules, different numbers, and those numbers reach forecasts and board decks.</p></div>
<div class="hpanel"><span class="eyebrow">What Concord does</span><p>Concord finds those splits and shows why each answer differs. The person who owns the number signs one official version. Builders update their own agents. Concord never rewrites them.</p></div>
<div class="hpanel"><span class="eyebrow">What Concord is not</span><p>It is not one shared bot for everyone, and it is not "AI consistency" or prompt-matching. People keep their own agents. Concord only checks whether agents built for the same job are consistent.</p></div></div>
<div class="lband"><b>People build their own agents; Concord finds where those agents disagree on the same job and helps settle one official version.</b></div>`)
}

export function checklist(){
  const items=[['Connect Claude and n8n',OB.conn.claude&&OB.conn.n8n,'connect'],['Scan for agents',OB.scanned,'scan'],['Search a business term',OB.searched,'search'],['Resolve your first inconsistency',OB.resolved,'resolve']]
  const n=items.filter(i=>i[1]).length;if(n===4&&OB.dismissed)return ''
  return `<div class="card chk"><div class="chkh"><div><b>${n===4?"You're set up":'Get set up'}</b><span class="mut">${n}/4 done</span></div><div class="bar" style="flex:1;max-width:200px"><span style="width:${n/4*100}%"></span></div>${n===4?'<button class="btn" data-chkx>Dismiss</button>':`<a class="btn p" href="#/start">Continue setup →</a>`}</div>
<div class="chki">${items.map(([t,d])=>`<a href="#/start" class="${d?'d':''}"><i>${d?'✓':''}</i>${t}</a>`).join('')}</div></div>`}

export function mountOB(){if(document.querySelector('.ob')){guide();if(OB.step==='scan'&&OB.scanned)fillScan(true)}}
document.addEventListener('input',e=>{const t=e.target
  if(t.id==='sq'){clearTimeout(t._d);t._d=setTimeout(()=>runQ(t.value),160)}
  else if(t.id==='rdef'){const R=rs(t.closest('.rv').dataset.cid);R.text=t.value;R.mode='custom'}
  else if(t.id==='rans'){rs(t.closest('.rv').dataset.cid).customAns=t.value}
  else if(t.id==='rreason'){const R=rs(t.closest('.rv').dataset.cid);R.reason=t.value;const b=document.querySelector('[data-rpublish]');if(b)b.disabled=!t.value.trim();guide()}
  else if(t.id==='rback'){rs(t.closest('.rv').dataset.cid).publishBack=t.checked}
})
document.addEventListener('change',e=>{
  if(e.target.id==='rback'){const rv=e.target.closest('.rv');if(rv)rs(rv.dataset.cid).publishBack=e.target.checked;return}
  if(e.target.id!=='rbase')return
  const cid=e.target.closest('.rv').dataset.cid,R=rs(cid),c=M.CONF.find(x=>x.id===cid)
  if(e.target.value===''){R.text='';R.pick=null;R.customAns=''}else{R.pick=+e.target.value;const a=M.AGENTS[c.cols[R.pick].a];R.text=a.def.join('\n');R.customAns=a.ans}
  R.mode='custom';R.write=true;rerenderR();document.getElementById('rdef')?.focus()
})
function runQ(q){const r=document.getElementById('sres');if(!r)return;r.innerHTML=results(q);if(document.querySelector('.ob')){OB.q=q;if(q.trim()&&search(q).length)OB.searched=true;save();const b=document.querySelector('.obsteps [data-obgo=resolve]');if(b)b.disabled=!reach('resolve');guide()}
  const box=document.querySelector('.sbox'),x=document.querySelector('.sclr');if(q&&!x&&box)box.insertAdjacentHTML('beforeend','<button class="sclr" data-sclear title="Clear">×</button>');else if(!q&&x)x.remove()}
document.addEventListener('keydown',e=>{if(e.target.id==='topq'&&e.key==='Enter')location.hash='#/search/'+encodeURIComponent(e.target.value.trim())})
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-navtoggle],[data-obgo],[data-obws],[data-connect],[data-mclose],[data-cauth],[data-ntest],[data-nsave],[data-scan],[data-scanskip],[data-sq],[data-sclear],[data-resolve],[data-rpick],[data-rwrite],[data-rnext],[data-rback],[data-rchip],[data-rpublish],[data-rsuggest],[data-rvariant],[data-rsem],[data-rsandbox],[data-obfinish],[data-scroll],[data-reset],[data-chkx],[data-semcon]')
  if(!t)return
  const d=t.dataset,Rerender=()=>C.render()
  if(d.navtoggle!=null){const bar=t.closest('.sitebar'),menu=bar.querySelector('.sitemenu'),open=menu.hasAttribute('hidden');if(open)menu.removeAttribute('hidden');else menu.setAttribute('hidden','');t.setAttribute('aria-expanded',open?'true':'false');t.setAttribute('aria-label',open?'Close menu':'Open menu');t.innerHTML=open?CLOSE:BURGER;return}
  if(d.scroll){document.getElementById(d.scroll)?.scrollIntoView({behavior:'smooth'});return}
  if(d.reset!=null){C.reset();return}
  if(d.chkx!=null){OB.dismissed=true;save();Rerender();return}
  if(d.semcon!=null){C.S.semanticConnected=true;save();Rerender();return}
  if(d.obgo){if(t.disabled||!reach(d.obgo))return;stopScan();OB.step=d.obgo;save();if(location.hash!=='#/start')location.hash='#/start';else Rerender();scrollTo(0,0);return}
  if(d.obws!=null){OB.company=document.getElementById('f-company').value.trim()||'Private live scan';OB.name=document.getElementById('f-name').value.trim()||'Demo admin';OB.role=document.getElementById('f-role').value.trim()||M.SARA_ROLE;OB.size=document.getElementById('f-size').value;OB.step='connect';save();Rerender();return}
  if(d.connect){modal=d.connect;mstate={k:0};Rerender();return}
  if(d.mclose!=null){authGen++;testGen++;modal=null;mstate={};Rerender();return}
  if(d.cauth!=null){const g=++authGen;mstate.busy=true;Rerender();setTimeout(()=>{if(g!==authGen)return;OB.conn.claude=true;modal=null;mstate={};save();Rerender()},800);return}
  if(d.ntest!=null){const g=++testGen;mstate.testing=true;mstate.k=0;paintN8n();const step=()=>{if(g!==testGen||modal!=='n8n')return;mstate.k++;paintN8n();if(mstate.k<4)setTimeout(step,450)};setTimeout(step,300);return}
  if(d.nsave!=null){OB.conn.n8n=true;modal=null;mstate={};save();Rerender();return}
  if(d.scan!=null){t.disabled=true;fillScan(false);guide();return}
  if(d.scanskip!=null){stopScan();OB.scanned=true;save();Rerender();return}
  if(d.sq){const i=document.getElementById('sq');if(i){i.value=d.sq;runQ(d.sq);i.focus()}return}
  if(d.sclear!=null){const i=document.getElementById('sq');if(i){i.value='';runQ('');i.focus()}return}
  if(d.resolve){if(document.querySelector('.ob')){OB.cid=d.resolve;OB.step='resolve';save();Rerender();scrollTo(0,0)}else location.hash='#/resolve/'+d.resolve;return}
  const rv=t.closest('.rv');if(!rv&&d.obfinish==null)return
  const cid=rv?rv.dataset.cid:OB.cid, R=cid?rs(cid):null, c=cid?M.CONF.find(x=>x.id===cid):null
  if(d.rpick!=null){R.pick=+d.rpick;R.mode='agent';R.text='';rerenderR();return}
  if(d.rwrite!=null){R.write=!R.write;if(R.write){R.mode='custom';if(R.pick!=null&&!R.text){const a=M.AGENTS[c.cols[R.pick].a];R.text=a.def.join('\n');R.customAns=a.ans}}rerenderR();if(R.write)document.getElementById('rdef')?.focus();return}
  if(d.rsem){R.mode='semantic';R.sem=d.rsem;rerenderR();return}
  if(d.rsandbox!=null){R.sandbox=!R.sandbox;rerenderR();return}
  if(d.rvariant!=null){
    C.markVariant(cid, d.rvariant==='job'?null:+c.cols[+d.rvariant].a)
    if(C.S.resolved[cid]==='variant'){R.stage=4;if(document.querySelector('.ob')){OB.resolved=true;save()}}
    rerenderR();syncBadge();return}
  if(d.rnext!=null){if(R.mode==='custom'&&!R.customAns){const base=R.pick!=null?M.AGENTS[c.cols[R.pick].a].ans:'';R.customAns=document.getElementById('rans')?.value||base||'Custom'}R.stage=1;rerenderR();document.getElementById('rreason')?.focus();return}
  if(d.rback!=null){R.stage=0;rerenderR();return}
  if(d.rchip){R.reason=d.rchip;rerenderR();return}
  if(d.rpublish!=null){if(!R.reason.trim())return;commitFrom(R,c);R.stage=2;rerenderR();syncBadge();return}
  if(d.rsuggest!=null){startSuggest(cid);return}
  if(d.obfinish!=null){OB.resolved=true;save();location.hash='#/overview'}
})
function startSuggest(cid){
  const c=M.CONF.find(x=>x.id===cid), R=rs(cid)
  if(!C.S.suggested.includes(cid)) C.S.suggested.push(cid)
  if(C.S.resolved[cid]!=='official') commitFrom(R,c)
  C.save(); R.stage=3; rerenderR(); syncBadge()
  const need=M.adoptionPlan(c,C.S).need.filter(i=>!C.S.verified.includes(i))
  let k=0
  const tick=()=>{
    if(!document.querySelector(`.rv[data-cid="${cid}"]`)) return
    if(k>=need.length){R.stage=4;if(document.querySelector('.ob')){OB.resolved=true;C.save()}rerenderR();syncBadge();return}
    C.verify(need[k]);k++;rerenderR();setTimeout(tick,700)
  }
  setTimeout(tick, need.length?450:200)
}
