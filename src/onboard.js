// Landing, hands-on onboarding, search, and the owner resolve flow.
import * as M from './model.js'
import {lockup, status, tag, Brand} from './brand.js'
import {leadCta} from './lead.js'
let C=null
export const OB={step:'workspace',company:'Northwind',name:'Sara Klein',role:M.SARA_ROLE,size:'301–1,000 people',conn:{claude:false,n8n:false},scanned:false,searched:false,resolved:false,cid:'c1',q:'',dismissed:false}
export function initOB(ctx){C=ctx}
const esc=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))
const save=()=>C.save()
const SYN={'Customer health':['customer health','health','churn','at risk','at-risk','risk','renewal','csat','nps','healthy'],'ARR':['arr','revenue','recurring','annual','mrr','bookings'],'Discount approval':['discount','discounts','pricing','quote','approval','approve','deal desk'],'Refund policy':['refund','refunds','return','returns','money back'],'Lead scoring':['lead','mql','score','scoring'],'Pipeline coverage':['pipeline','coverage','quota'],'Onboarding FAQ':['onboarding','hire','checklist']}
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
const CHIPS=['customer health','ARR','discount','refund','how many accounts are at risk?','pipeline']
export function searchBox(q,big=true){return `<div class="sbox ${big?'big':''}"><span class="sbi">${C.ic('search',big?18:15)}</span><input id="sq" autocomplete="off" placeholder="Search a business term or question, e.g. customer health, ARR, refund…" value="${esc(q||'')}"/>${q?'<button class="sclr" data-sclear title="Clear">×</button>':''}</div>
<div class="schips"><span class="dim">Try:</span>${CHIPS.map(c=>`<button class="schip" data-sq="${esc(c)}">${esc(c)}</button>`).join('')}</div><div id="sres">${results(q)}</div>`}
function results(q){
  if(!q||!q.trim())return `<div class="sempty">${C.ic('search',20)}<div><b>Search definitions and answers already on record</b><span>It shows the definition it read, and the answer that agent already gave.</span></div></div>`
  const R=search(q);if(!R.length)return `<div class="sempty"><div><b>No agents match “${esc(q)}”</b><span>Try customer health, ARR, discount, or refund.</span></div></div>`
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
<div class="rrow" style="margin-top:12px;flex-wrap:wrap">${inOB?`<button class="btn p" data-obfinish>Open the demo →</button><a class="btn wbtn" href="#/company">${C.ic('ask',12)} Ask Meridian</a>`:`<a class="btn p" href="#/company">Back to the demo</a>`}</div>`
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
  if(s==='search'){const q=(document.getElementById('sq')||{}).value??OB.q;return !q?'Try <b>customer health</b>.':search(q).some(g=>{const c=M.conflictByJob(g.job);return c&&M.isOpen(c,C.S)})?'These definitions disagree. Click <b>Resolve as owner</b>.':'Try ARR, discount, or your own question.'}
  if(s==='resolve'){const R=rs(OB.cid);if(C.S.resolved[OB.cid]==='variant')return 'Marked as a valid variant. Go to the dashboard, or watch the build-time story.'
    return ['Pick a definition, write your own, or mark a valid variant if it is not the same job.','Add a short reason, then <b>Publish as official version</b>.','The official version is live. Click <b>Send suggested changes</b>. Builders apply them.','Watching the next few days. Concord is re-reading.','Done. Go to the dashboard, or watch how the next agent is prevented.'][R.stage]||''}
  return ''
}
export function guide(){const g=document.getElementById('obguide');if(g)g.innerHTML=`<span class="gdot"></span><span><b class="gk">Next:</b> ${guideText()}</span>`}
export function onboardPage(){const s=OB.step
  return `<div class="ob"><header class="obh"><a class="brand" href="#/" aria-label="concord, home">${lockup(20)}</a><a class="backsite" href="/">Back to site</a><span class="obws" data-obws-label>${esc(OB.company||'Your company')}</span>
<nav class="obsteps">${STEPS.map(([k,l],i)=>{const idx=STEPS.findIndex(x=>x[0]===s),done=i<idx||(k==='resolve'&&OB.resolved);return `<button class="${k===s?'on':''} ${done?'done':''}" data-obgo="${k}" ${reach(k)?'':'disabled'}><i>${done?'✓':i+1}</i><span>${l}</span></button>`}).join('')}</nav>
<div class="obr"><a class="obwatch" href="#/company">${C.ic('ask',11)}<span>Ask Meridian</span></a><a class="obskip" href="#/company">Skip to demo</a></div></header>
<div class="obguide" id="obguide"></div><main class="obm">${({workspace:wsStep,connect:connStep,scan:scanStep,search:searchStep,resolve:()=>resolveView(OB.cid,true)})[s]()}</main>${modal?modalHTML():''}</div>`}
const logo=()=>lockup(18)
function wsStep(){return `<div class="obgrid"><div class="card obcard"><h1>Create your workspace</h1><p class="sub">Northwind is a fictional company of ${M.PEOPLE} people. Nothing leaves your browser.</p>
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
<h2>Connect Claude with the Compliance API</h2><p class="mut">A read-only key created by Northwind’s Primary Owner. You are signed in as ${esc(OB.name)}, ${esc(OB.role)}.</p>
<div class="scope"><div class="lbl">${Brand} will be able to read</div>${['Projects, instructions, and knowledge files','Chats and messages linked to a project','Who built each project, and when it changed'].map(s=>`<div class="sc-y">${C.ic('check',14)}${s}${tag('read')}</div>`).join('')}</div>
<div class="scope"><div class="lbl">${Brand} will not be able to</div>${['See which connectors or MCP servers a project uses','Invoke a project or send a message','Create, edit, or delete anything'].map(s=>`<div class="sc-n">${C.ic('x',14)}${s}</div>`).join('')}</div>
<div class="mf"><button class="btn" data-mclose>Cancel</button><button class="btn p" data-cauth ${m.busy?'disabled':''}>${m.busy?'<span class="spin"></span> Authorizing…':'Authorize read-only access'}</button></div></div>`
  const checks=n8nChecks()
  return `<div class="mbg" data-mclose></div><div class="modal" role="dialog"><div class="mh">${logo()}<span class="mx">⇄</span><span class="tile n8">n</span><button class="iconbtn" data-mclose style="margin-left:auto">${C.ic('x')}</button></div>
<h2>Connect your n8n instance</h2><p class="mut">Owner or Admin key, read-only. Concord reads workflow JSON and execution history. There is no execute endpoint, and Concord never calls a webhook.</p>
<label class="fl">Instance URL<input value="https://northwind.app.n8n.cloud" spellcheck="false"/></label><label class="fl">API key<input type="password" value="n8n_api_demo_7f3a92c1e4b8" spellcheck="false"/><small class="dim">Demo value. In n8n: Settings, n8n API, Create an API key.</small></label>
<div class="tests-slot"><div class="tests">${checks.map((s,i)=>`<div>${i<(m.k||0)?C.ic('check',14)+esc(s):'<span class="dim">'+(i===0&&!m.testing?'Results appear here.':' ')+'</span>'}</div>`).join('')}</div></div>
<div class="mf"><button class="btn" data-mclose>Cancel</button><button class="btn" data-ntest ${m.testing?'disabled':''}>Test connection</button><button class="btn p" data-nsave ${m.k>=4?'':'disabled'}>Save connection</button></div></div>`
}
function n8nChecks(){return ['Reached northwind.app.n8n.cloud','API key accepted · Owner, read-only','workflows:read and executions:read','Found '+M.AGENTS.filter(a=>a.tool==='n8n').length+' workflows with an AI step']}
function paintN8n(){
  const rows=document.querySelectorAll('.tests-slot .tests > div'), checks=n8nChecks()
  rows.forEach((row,i)=>{row.innerHTML=i<(mstate.k||0)?C.ic('check',14)+esc(checks[i]):'<span class="dim">'+(i===0&&!mstate.testing?'Results appear here.':' ')+'</span>'})
  const save=document.querySelector('[data-nsave]'), test=document.querySelector('[data-ntest]')
  if(save) save.disabled=(mstate.k||0)<4
  if(test) test.disabled=!!mstate.testing
}
const SC={running:false,timers:[]}
function scanStep(){const done=OB.scanned, jobs=new Set(M.AGENTS.map(a=>a.job)).size
  return `<div class="obwide"><h1>Scan for agents</h1><p class="sub">Concord reads Claude projects through the Compliance API and n8n workflow JSON, then reads chat history and execution logs. It compares definitions.</p>
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

const BURGER=`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`
const CLOSE=`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>`
const MKT=[['home','Home','#/'],['how','How it works','#/how'],['watch','Walkthrough','#/watch'],['pricing','Pricing','#/pricing'],['about','About','#/about']]
function mktLinks(active){return MKT.map(([id,label,href])=>`<a href="${href}" class="${active===id?'on':''}"${active===id?' aria-current="page"':''}>${label}</a>`).join('')}
function marketFoot(active){
  return `<footer class="sitefoot"><div class="sitefoot-in"><a class="brand" href="#/">${lockup(16)}</a><nav class="sitefoot-nav" aria-label="Footer">${mktLinks(active)}</nav><div class="sitefoot-meta"><span>Your teams build. Concord keeps their answers aligned.</span><span>Works with Claude and n8n.</span><a href="#/company">Open the demo</a><a href="#/company">Try it with sample data</a></div></div></footer>`
}
export function marketShell(active, main){
  return `<div class="mkt"><header class="sitebar"><div class="sitebar-in"><a class="brand" href="#/" aria-label="Concord home">${lockup(20)}</a><nav class="sitenav" aria-label="Primary">${mktLinks(active)}</nav><div class="siteacts"><a class="sitein" href="#/company">Open the demo</a><a class="btn p" href="#/company">Try it with sample data</a></div><button class="siteburger" type="button" data-navtoggle aria-expanded="false" aria-label="Open menu">${BURGER}</button></div><div class="sitemenu" hidden><nav aria-label="Mobile">${mktLinks(active)}</nav><a class="sitein" href="#/company">Open the demo</a><a class="btn p" href="#/company">Try it with sample data</a></div></header><div class="lp">${main}</div>${marketFoot(active)}</div>`
}
let phaseTimer=0, phaseTimers=[]
const LANES=[
  {v:35,who:'Agent 1',st:'risk',left:70,gap:'left:56%;width:14%'},
  {v:42,who:'Agent 2',st:'drift',left:84,gap:'left:56%;width:28%'},
  {v:17,who:'Agent 3',st:'drift',left:34,gap:'left:34%;width:22%'},
  {v:28,who:'Agent 4',st:'sync',left:56,gap:''},
]
const PHASE_CAP={
  1:'Four agents at Northwind answer “Which accounts are at risk?” with 35, 42, 17 and 28. Each answer is built differently, and Concord shows why.',
  2:'The official answer is 28, signed off by Sara Klein, Head of RevOps.',
  3:'Each builder updates their own agent. The next checks confirm every agent follows it.',
}
const CHIP={risk:'At risk',drift:'Drifting',sync:'In sync'}
function clearPhase(){clearTimeout(phaseTimer);phaseTimers.forEach(clearTimeout);phaseTimers=[];phaseTimer=0}
export function mountLanding(){
  clearPhase()
  const demo=document.getElementById('example');if(!demo)return
  const cap=document.getElementById('cap')
  const dots=[...demo.querySelectorAll('.vdot')]
  const chips=[...demo.querySelectorAll('.vchip')]
  const kind={35:'risk',42:'drift',17:'drift',28:'sync'}
  const reduce=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const set=p=>{
    phaseTimers.forEach(clearTimeout);phaseTimers=[]
    demo.dataset.phase=String(p)
    if(cap) cap.textContent=PHASE_CAP[p]
    demo.querySelectorAll('[data-go]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.go)===String(p)?'true':'false'))
    dots.forEach((d,i)=>{
      const v=+d.dataset.v, st=p===3?'sync':kind[v]
      d.style.transitionDelay=(p===3&&!reduce?i*80:0)+'ms'
      d.style.left=((p===3?28:v)/50*100)+'%'
      const apply=()=>{
        if(!d.isConnected) return
        d.className='vdot '+st
        d.querySelector('b').textContent=p===3?'28':String(v)
        chips[i].className='vchip s-'+st
        chips[i].textContent=CHIP[st]
      }
      if(p===3&&!reduce) phaseTimers.push(setTimeout(apply,900+i*80))
      else apply()
    })
  }
  let phase=1
  const loop=()=>{phaseTimer=setTimeout(()=>{if(!demo.isConnected)return;phase=phase%3+1;set(phase);loop()},phase===3?3600:2800)}
  demo.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>{clearPhase();phase=+b.dataset.go;set(phase)}))
  set(1)
  if(!reduce) loop()
}
function laneRow(l){
  const same=l.v===28
  const gap=l.gap?`<span class="vgap ${l.st}" style="${l.gap}"></span>`:''
  return `<div class="vlane"><span class="vwho">${l.who}</span><div class="vtrack"><span class="vghost${same?' same':''}" style="left:${l.left}%"><b>${l.v}</b></span>${gap}<span class="vdot ${l.st}" data-v="${l.v}" style="left:${l.left}%"><b>${l.v}</b></span></div><span class="vst"><span class="vchip s-${l.st}">${CHIP[l.st]}</span></span></div>`
}
function landingShell(main){
  const jumps=[['example','Example'],['what','What you get'],['how','How it works'],['next','Coming next']]
  const nav=jumps.map(([id,label])=>`<a href="#${id}" data-scroll="${id}">${label}</a>`).join('')
  const more=[['#/watch','Walkthrough'],['#/how','How it works'],['#/pricing','Pricing'],['#/about','About'],['#/company','Open the demo'],['#/company','Try it with sample data']]
  return `<div class="mkt v20"><header class="sitebar"><div class="v20wrap v20bar"><a class="brand" href="#/" aria-label="Concord home">${lockup(20)}</a><nav class="sitenav v20links" aria-label="Primary">${nav}</nav><div class="v20cta">${leadCta('v20btn sm')}</div><button class="siteburger" type="button" data-navtoggle aria-expanded="false" aria-label="Open menu">${BURGER}</button></div><div class="sitemenu" hidden><nav aria-label="Mobile">${nav}${more.map(([href,label])=>`<a href="${href}">${label}</a>`).join('')}</nav></div></header><div class="lp">${main}</div><footer class="sitefoot"><div class="v20wrap v20foot"><a class="brand" href="#/" aria-label="Concord home">${lockup(16)}</a><p class="vtl">Your teams build. <span>Concord keeps their answers aligned.</span></p><p class="vworks">Works with Claude and n8n.</p><nav class="sitefoot-nav" aria-label="Footer">${mktLinks('home')}<a class="sitein" href="#/company">Open the demo</a><a href="#/company">Try it with sample data</a></nav></div></footer></div>`
}
const VIZ1=['','r','','d','','','r','','d','','s','','','d','','r'].map(k=>`<i${k?` class="${k}"`:''}></i>`).join('')
export function landingPage(){
  const defs=[
    ['35',"Dana's agent",'Sales Ops','Claude','no login 21d OR &gt; 3 tickets'],
    ['42','Account health monitor','CS','Claude','tickets &gt; 5 OR CSAT &lt; 3.5'],
    ['17',"Tom's workflow",'CS','n8n','usage drop &gt; 40%, excl. under $10k'],
    ['28','Renewal radar','RevOps','Claude','usage + NPS + tickets, score &lt; 60'],
  ]
  const axis=[0,10,20,30,40,50].map((n,i)=>`<i style="left:${i*20}%">${n}</i>`).join('')
  return landingShell(`<header class="lhero" id="top"><div class="v20wrap">
<h1>Your people are building the same agents. <span>They're getting different answers.</span></h1>
<p class="lsub"><b>Concord finds where agents built for the same job disagree, shows you why, and helps you settle on one version.</b></p>
<details class="vmore"><summary>How it starts</summary><p>Anyone can build an agent in an afternoon. Two people build a customer health score agent, each defines it their own way, and the company ends up with two answers.</p></details>
<div class="vhero-row">${leadCta('v20btn')}<p class="vtrust"><span class="vlock">Read-only</span><span>Connects to Claude Enterprise and n8n with read-only access. Your teams keep building the way they do today.</span></p></div>
<div class="vdemo" id="example" data-phase="1" aria-label="Northwind example, example data">
<div class="vdemo-head"><div><div class="veye">Northwind · four agents</div><div class="vq">“How many accounts are at risk this quarter?”</div></div><span class="vtag">Example data</span></div>
<div class="vplot"><div class="vlanes"><div class="vofficial"><span>Official · 28</span></div>${LANES.map(laneRow).join('')}</div><div class="vaxis">${axis}</div></div>
<div class="vcap"><p id="cap">${PHASE_CAP[1]}</p><div class="vsteps" role="group" aria-label="Example steps"><button type="button" data-go="1" aria-pressed="true">01 Answers</button><button type="button" data-go="2" aria-pressed="false">02 Official</button><button type="button" data-go="3" aria-pressed="false">03 Confirm</button></div></div>
<details class="vmore"><summary>The four answers</summary><p>The official answer is 28, signed off by Sara Klein, Head of RevOps.</p><ul>${defs.map(r=>`<li><b>${r[1]}</b> · ${r[2]} · ${r[3]} · ${r[0]} · ${r[4]}</li>`).join('')}</ul></details>
</div></div></header>
<section class="vsec" id="problem"><div class="v20wrap"><div class="veye">The problem</div><h2>Same question. Different answers.</h2>
<div class="vprob"><article class="vpcard"><h3>Everyone picks their own definition.</h3><div class="vpills"><span>a personal spreadsheet</span><span>a ticket count</span><span>a usage drop</span><span>the warehouse score</span></div></article>
<article class="vpcard"><h3>Wrong numbers spread.</h3><div class="vflow"><span>forecasts</span><em>→</em><span>customer calls</span><em>→</em><span>board decks</span></div><p>They end up in forecasts, customer calls and board decks before anyone notices.</p></article></div></div></section>
<section class="vsec" id="what"><div class="v20wrap"><div class="veye">What you get</div>
<div class="vcards">
<article class="vcard"><div class="vviz v1" aria-hidden="true">${VIZ1}</div><div class="vk">01</div><h3>See every place it happens</h3><p>Every agent doing the same job, and where their answers differ.</p></article>
<article class="vcard"><div class="vviz v2" aria-hidden="true"><span>Definition</span><span>Data source</span><span>Instructions</span></div><div class="vk">02</div><h3>Know why it happens</h3><p>The definition, data source or instructions behind each answer.</p></article>
<article class="vcard"><div class="vviz v3" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="vk">03</div><h3>Fix it once</h3><p>The owner signs off one official version, and Concord confirms every agent follows it.</p></article>
</div>
<p class="vwho-line"><span class="veye">Who it's for</span> The people who own the numbers: the CFO, the head of RevOps and ops leaders.</p>
</div></section>
<section class="vsec" id="how"><div class="v20wrap"><div class="veye">How it works</div><h2>From different answers to one official version.</h2>
<div class="lsteps vstrip">
<div class="vstep"><div class="vbar"></div><div class="vk">01</div><h3>Find</h3><p>Concord checks your agents every day and groups the ones doing the same job.</p><span class="varrow" aria-hidden="true">→</span></div>
<div class="vstep"><div class="vbar"></div><div class="vk">02</div><h3>Show</h3><p>When their answers differ, the owner of that number sees each answer and why it differs.</p><span class="varrow" aria-hidden="true">→</span></div>
<div class="vstep"><div class="vbar"></div><div class="vk">03</div><h3>Decide</h3><p>The owner decides, builders fix.</p><details class="vmore"><summary>More</summary><p>The owner signs off one official version, and each builder updates their own agent.</p></details><span class="varrow" aria-hidden="true">→</span></div>
<div class="vstep"><div class="vbar"></div><div class="vk">04</div><h3>Confirm</h3><p>The next checks confirm every agent follows it, and Concord alerts the owner if one drifts.</p></div>
</div>
<div class="vextra">
<details class="vmore"><summary>Intentional differences</summary><p>If a team really does a different job, for example only counting contracts over $10k, the owner marks it as a valid variant and Concord stops flagging it.</p></details>
<details class="vmore"><summary>Setup</summary><p>Claude needs an Enterprise plan (Compliance API). n8n connects with an Owner or Admin API key. Scans run daily.</p></details>
</div></div></section>
<section class="vband" aria-label="Positioning"><div class="v20wrap"><div class="veye">Positioning</div><p><span>Security tools check whether an agent is safe.</span> ${Brand} checks whether your agents <b>agree</b>.</p></div></section>
<section id="next"><div class="v20wrap"><div class="vnext"><div class="vline"><span class="veye">Coming next</span> Today Concord compares number answers.</div><details class="vmore"><summary>What's next</summary><p>Next, it will compare written answers, like two support agents quoting different refund windows or two onboarding assistants giving different steps. Connecting the semantic layer you already use, such as dbt or Atlan, is also coming next.</p></details></div></div></section>
<section class="vfinal" id="hear"><div class="v20wrap"><h2>Want to hear more?</h2>${leadCta('v20btn')}</div></section>`)
}
export function howPage(){
  const steps=[
    ['01','Find','Concord checks your agents every day and groups the ones doing the same job.'],
    ['02','Show','When their answers differ, the owner of that number sees each answer and why it differs.'],
    ['03','Decide','The owner decides, builders fix. The owner signs off one official version, and each builder updates their own agent.'],
    ['04','Confirm','The next checks confirm every agent follows it, and Concord alerts the owner if one drifts.'],
  ]
  const notes=[
    ['Intentional differences','If a team really does a different job, for example only counting contracts over $10k, the owner marks it as a valid variant and Concord stops flagging it.'],
    ['Setup','Claude needs an Enterprise plan (Compliance API). n8n connects with an Owner or Admin API key. Scans run daily.'],
  ]
  return marketShell('how', `<section class="mhero"><span class="eyebrow">How it works</span><h1>From different answers to one official version.</h1></section>
<div class="msteps">${steps.map(s=>`<article class="card"><span class="lsn">${s[0]}</span><h2>${s[1]}</h2><p>${s[2]}</p></article>`).join('')}${notes.map(s=>`<article class="card"><h2>${s[0]}</h2><p>${s[1]}</p></article>`).join('')}</div>`)
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
  return marketShell('about', `<section class="mhero"><span class="eyebrow">About</span><h1>Every team should be working from the same version of the truth.</h1><p>Teams are building their own agents faster than anyone can keep track of. That's a good thing, until two agents built for the same job start giving people different answers. Concord exists to find those differences, show why they happen, and help the company settle on one version, while people keep building the way they do today.</p></section>`)
}

export function checklist(){
  const items=[['Connect Claude and n8n',OB.conn.claude&&OB.conn.n8n,'connect'],['Scan for agents',OB.scanned,'scan'],['Search a business term',OB.searched,'search'],['Resolve your first conflict',OB.resolved,'resolve']]
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
  if(d.scroll){e.preventDefault();document.getElementById(d.scroll)?.scrollIntoView({behavior:'smooth'});const bar=document.querySelector('.v20 .sitebar');const menu=bar?.querySelector('.sitemenu');if(menu&&!menu.hasAttribute('hidden')){menu.setAttribute('hidden','');const b=bar.querySelector('[data-navtoggle]');if(b){b.setAttribute('aria-expanded','false');b.setAttribute('aria-label','Open menu');b.innerHTML=BURGER}}return}
  if(d.reset!=null){C.reset();return}
  if(d.chkx!=null){OB.dismissed=true;save();Rerender();return}
  if(d.semcon!=null){C.S.semanticConnected=true;save();Rerender();return}
  if(d.obgo){if(t.disabled||!reach(d.obgo))return;stopScan();OB.step=d.obgo;save();if(location.hash!=='#/start')location.hash='#/start';else Rerender();scrollTo(0,0);return}
  if(d.obws!=null){OB.company=document.getElementById('f-company').value.trim()||'Northwind';OB.name=document.getElementById('f-name').value.trim()||'Sara Klein';OB.role=document.getElementById('f-role').value.trim()||M.SARA_ROLE;OB.size=document.getElementById('f-size').value;OB.step='connect';save();Rerender();return}
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
  if(d.obfinish!=null){OB.resolved=true;save();location.hash='#/company'}
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
