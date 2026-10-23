// Landing page, hands-on onboarding (workspace -> connect -> scan -> search -> resolve), search and resolve components.
let C=null // context from main.js
export const OB={step:'workspace',company:'Northwind',name:'Sara Klein',role:'Head of RevOps',conn:{claude:false,n8n:false},scanned:false,searched:false,resolved:false,cid:'c1',q:'',dismissed:false,edits:{}}
export function initOB(ctx){C=ctx}
const esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))
const ini=n=>n.trim().split(/\s+/).map(x=>x[0]||'').join('').slice(0,2).toUpperCase()||'?'
const save=()=>C.save()
const SYN={'Customer health':['customer health','health','churn','at risk','at-risk','risk','renewal','csat','nps','healthy'],'ARR':['arr','revenue','recurring','annual','mrr','bookings'],'Discount approval':['discount','discounts','pricing','quote','approval','approve','deal desk'],'Refund policy':['refund','refunds','return','returns','money back']}
const STOP=new Set('how many much what which who is are the a an our we do does of for to in on this that it be can with my me show list give all any per'.split(' '))
function lev(a,b){if(Math.abs(a.length-b.length)>2)return 9;const d=[...Array(b.length+1).keys()];for(let i=1;i<=a.length;i++){let p=d[0];d[0]=i;for(let j=1;j<=b.length;j++){const t=d[j];d[j]=Math.min(d[j]+1,d[j-1]+1,p+(a[i-1]===b[j-1]?0:1));p=t}}return d[b.length]}
// ---------- agent helpers ----------
const conflictFor=job=>C.CONF.find(c=>c.job===job&&c.cols.length)
function colOf(i){for(const c of C.CONF)for(const [k,col] of c.cols.entries())if(col.a===i)return {c,col,k};return null}
function defOf(i){const a=C.agents[i],x=colOf(i);if(x){if(C.S.resolved[x.c.id]){const e=OB.edits[x.c.id];return e?e.split('\n'):x.c.cols[x.c.win].logic.map(l=>l[1])}return x.col.logic.map(l=>l[1])}
 const c=conflictFor(a.job);if(c&&C.S.resolved[c.id])return ['calls concord.'+a.job.toLowerCase().replace(/ /g,'_')+'()'];return ['source = '+a.src]}
function ansOf(i){const x=colOf(i);if(!x)return null;return C.S.resolved[x.c.id]?x.c.cols[x.c.win].ans:x.col.ans}
// ---------- search ----------
export function search(q){q=(q||'').toLowerCase().trim();if(!q)return [];const toks=q.split(/[^a-z0-9%$.-]+/).filter(t=>t.length>1&&!STOP.has(t));const sc=new Map()
 const jobsHit=Object.entries(SYN).filter(([j,ws])=>ws.some(w=>q.includes(w)||toks.some(t=>t.length>=4&&w.length>=4&&lev(t,w)<=(w.length>=7?2:1))))
 C.agents.forEach((a,i)=>{const text=[a.n,a.job,a.src,a.b,a.dept,...defOf(i)].join(' ').toLowerCase();const words=text.split(/[^a-z0-9%$]+/);let s=0
  for(const t of toks){if(text.includes(t))s+=2;else if(t.length>=4&&words.some(w=>w.length>=3&&lev(t,w)<=(t.length>=7?2:1)))s+=1}
  if(jobsHit.some(([j])=>j===a.job))s+=6;if(s>0)sc.set(i,s)})
 const groups={};for(const [i,s] of sc){const j=C.agents[i].job;(groups[j]=groups[j]||{job:j,ids:[],score:0}).ids.push(i);groups[j].score=Math.max(groups[j].score,s)}
 // include every agent of a matched job, not only the matching ones
 for(const g of Object.values(groups))g.ids=C.agents.map((a,i)=>a.job===g.job?i:-1).filter(i=>i>=0)
 return Object.values(groups).sort((a,b)=>b.score-a.score||b.ids.length-a.ids.length).slice(0,6)}
const CHIPS=['customer health','ARR','discount','refund','how many accounts are at risk?','pipeline']
export function searchBox(q,big=true){return `<div class="sbox ${big?'big':''}"><span class="sbi">${C.ic('search',big?18:15)}</span><input id="sq" autocomplete="off" placeholder="Search a business term or question, e.g. customer health, ARR, refund…" value="${esc(q||'')}"/>${q?'<button class="sclr" data-sclear title="Clear">×</button>':''}</div>
<div class="schips"><span class="dim">Try:</span>${CHIPS.map(c=>`<button class="schip" data-sq="${esc(c)}">${esc(c)}</button>`).join('')}</div><div id="sres">${results(q)}</div>`}
function results(q){if(!q||!q.trim())return `<div class="sempty">${C.ic('search',20)}<div><b>Search across every agent, in Claude and n8n</b><span>Type a business term or a question. Concord shows every agent doing that job, who built it, its definition and its answer, side by side.</span></div></div>`
 const R=search(q);if(!R.length)return `<div class="sempty"><div><b>No agents match "${esc(q)}"</b><span>Try a job like customer health, ARR, discount or refund.</span></div></div>`
 return `<div class="smeta">${R.reduce((n,g)=>n+g.ids.length,0)} agents in ${R.length} job${R.length>1?'s':''} match "${esc(q)}"</div>`+R.map(group).join('')}
function group(g){const c=conflictFor(g.job),res=c&&C.S.resolved[c.id],inCols=c?c.cols.map(k=>k.a):[],rest=g.ids.filter(i=>!inCols.includes(i))
 const answers=c?[...new Set(c.cols.map(k=>res?c.cols[c.win].ans:k.ans))]:[]
 const tools=[...new Set(g.ids.map(i=>C.agents[i].tool))].map(t=>C.TOOLS[t].n).join(' and ')
 return `<section class="sg card"><div class="sgh"><div><h3>${g.job}</h3><div class="mut">${g.ids.length} agents · built in ${tools}${c?` · asked: "${esc(c.q)}"`:''}</div></div>
 <div class="sga">${c?(res?`<span class="chip c-ok"><i></i>All agree · official ${g.job} block</span>`:`<span class="chip c-bad"><i></i>${c.cols.length} agents · ${answers.length} different answers</span><button class="btn p" data-resolve="${c.id}">Resolve as owner →</button>`):'<span class="chip c-ok"><i></i>No conflict found</span>'}</div></div>
 ${c?`<div class="sgrid" style="--n:${c.cols.length}">${c.cols.map(k=>{const a=C.agents[k.a];return `<div class="sc ${res?'ok':'bad'}"><div class="sch">${C.dav(a)}<div><b>${a.n}</b><span>${a.b} · ${a.dept}</span></div></div>${C.tool(a.tool)}<div class="scn">${res?c.cols[c.win].ans:k.ans}</div><div class="scl">${defOf(k.a).map(esc).join('<br/>')}</div></div>`}).join('')}</div>`:''}
 ${rest.length?`<div class="srest">${c?'<div class="lbl" style="margin:0 0 4px">Also doing this job</div>':''}${rest.map(i=>{const a=C.agents[i];return `<div class="sr">${C.dav(a)}<div class="srn"><b>${a.n}</b><span>${a.b} · ${a.dept}</span></div>${C.tool(a.tool)}<code>${esc(defOf(i)[0])}</code></div>`}).join('')}</div>`:''}</section>`}
// ---------- resolve ----------
const RS={}
const rs=cid=>RS[cid]||(RS[cid]={stage:C.S.resolved[cid]?4:0,pick:C.S.resolved[cid]?C.CONF.find(c=>c.id===cid).win:null,edit:false,text:'',reason:'',k:0,score:null})
export function resolveView(cid,inOB){const c=C.CONF.find(x=>x.id===cid);if(!c||!c.cols.length)return '<p class="mut">Nothing to resolve here.</p>';const R=rs(cid),n=c.cols.length
 const st=R.stage,picked=R.pick!=null,cur=k=>st>=3&&(st===4||k<R.k)
 const off=picked?c.cols[R.pick]:null,offAns=off?off.ans:''
 const blockName=`${c.job} ${({c1:'v2',c2:'v4',c3:'v4',c4:'2026.2'})[c.id]||'v2'}`
 const score=R.score??C.scoreFor()
 return `<div class="rv" data-cid="${cid}"><div class="rvh"><div><div class="lbl" style="margin:0 0 4px">Resolve as owner · ${esc(OB.name)}</div><h2>${c.t}</h2><div class="mut">Same question asked to every agent: <b class="tx">"${esc(c.q)}"</b></div></div>
 <div class="rvm"><div><span class="mut">Consistency</span><b class="${score>71?'up':''}">${score}</b></div><div><span class="mut">Adoption</span><b>${st>=3?(st===4?n:R.k):0}/${n}</b></div></div></div>
 <div class="rsteps">${['Compare & pick','Reason & publish','Notify & rewire'].map((s,i)=>{const d=i===0?st>=1:i===1?st>=2:st===4,on=i===0?st===0:i===1?st===1:st>=2&&st<4;return `<span class="${d?'done':on?'on':''}"><i>${d?'✓':i+1}</i>${s}</span>`}).join('<b></b>')}</div>
 <div class="rcards" style="--n:${n}">${c.cols.map((k,i)=>{const a=C.agents[k.a],isOff=R.pick===i,sw=cur(i);const lines=sw?(R.text?R.text.split('\n'):off.logic.map(l=>l[1])):k.logic.map(l=>l[1])
  return `<div class="rc ${isOff?'pick':''} ${sw?'sw':''}" ${st===0?`data-rpick="${i}"`:''}><div class="rch">${C.dav(a)}<div><b>${a.n}</b><span>${a.b} · ${a.dept}</span></div>${st===0?`<span class="rad ${isOff?'on':''}"></span>`:isOff?'<span class="chip c-ok"><i></i>Official</span>':sw?'<span class="chip c-acc"><i></i>Rewired</span>':''}</div>${C.tool(a.tool)}
  <div class="rcn ${sw?'ok':''}">${sw?offAns:k.ans}</div><div class="rcl">${lines.map(esc).join('<br/>')}</div>${st===0?`<div class="rcp">${isOff?'Selected as official':'Make this official'}</div>`:''}</div>`}).join('')}</div>
 <div class="rpanel">${st===0?`<div class="rrow"><span class="mut">${picked?`<b class="tx">${C.agents[c.cols[R.pick].a].n}</b>'s definition will become official.`:'Pick the definition that should be official. Click a card.'}</span><span style="flex:1"></span>${picked?`<button class="btn" data-redit>${R.edit?'Use as is':'Edit definition'}</button>`:''}<button class="btn p" data-rnext ${picked?'':'disabled'}>Continue</button></div>${R.edit&&picked?`<textarea id="rdef" rows="4">${esc(R.text||off.logic.map(l=>l[1]).join('\n'))}</textarea>`:''}`
 :st===1?`<label class="lbl" for="rreason" style="display:block">Why is this the official definition? Builders will see this.</label><input id="rreason" placeholder="e.g. Most complete signal, and it matches what we report to the board" value="${esc(R.reason)}"/><div class="schips" style="margin-top:8px"><span class="dim">Suggestions:</span>${['Most complete signal, matches board reporting','Uses the governed warehouse source','Current policy, the old source is outdated'].map(s=>`<button class="schip" data-rchip="${esc(s)}">${s}</button>`).join('')}</div>
   <div class="rrow" style="margin-top:12px"><button class="btn" data-rback>← Back</button><span style="flex:1"></span><button class="btn p" data-rpublish ${R.reason.trim()?'':'disabled'}>${C.ic('cube',14)} Publish as official block</button></div>`
 :`<div class="rblock">${C.ic('cube',18)}<div><b>${blockName} · published</b><span>MCP · concord.${c.job.toLowerCase().replace(/ /g,'_')} · owner ${esc(OB.name)} · "${esc(R.reason)}"</span></div><span class="chip c-ok"><i></i>Live</span></div>
   ${st===2?`<div class="rrow" style="margin-top:12px"><span class="mut">${n} agents still use their own logic. Notify the builders and switch them to the official block.</span><span style="flex:1"></span><button class="btn p" data-rrewire>Notify builders & rewire</button></div>`
   :st===3?`<div class="rrow" style="margin-top:12px"><span class="mut">Rewiring agents over MCP… ${R.k}/${n}</span><div class="bar" style="flex:1;max-width:260px"><span style="width:${R.k/n*100}%"></span></div></div>`
   :`<div class="rdone">${C.ic('check',18)}<div><b>Every agent now answers ${esc(offAns)}</b><span>Builders were notified. Their agents call the official block; nothing else changed in Claude or n8n.</span></div></div>
   <div class="rrow" style="margin-top:12px;flex-wrap:wrap">${inOB?`<button class="btn p" data-obfinish>Go to dashboard →</button><a class="btn wbtn" href="#/watch">${C.ic('play',12)} Watch how it works when an employee builds a new agent</a>`:`<a class="btn p" href="#/overview">Back to dashboard</a><a class="btn" href="#/search/">Search again</a>`}</div>`}`}</div></div>`}
function rerenderR(){const el=document.querySelector('.rv');if(!el)return;const cid=el.dataset.cid,inOB=!!document.querySelector('.ob');el.outerHTML=resolveView(cid,inOB);guide()}
function rewire(cid){const c=C.CONF.find(x=>x.id===cid),R=rs(cid),n=c.cols.length,from=C.scoreFor()
 const to=C.scoreAfter(cid);R.stage=3;R.k=0;R.score=from;rerenderR()
 const t=()=>{if(!document.querySelector(`.rv[data-cid="${cid}"]`)){finish();return}R.k++;R.score=Math.round(from+(to-from)*R.k/n);rerenderR();if(R.k<n)setTimeout(t,850);else setTimeout(finish,500)}
 const finish=()=>{if(R.stage===4)return;C.commit(cid,R.pick,R.edit&&R.text?R.text:null);R.stage=4;R.score=null;if(document.querySelector('.ob')){OB.resolved=true;save()}rerenderR()}
 setTimeout(t,700)}
// ---------- onboarding ----------
const STEPS=[['workspace','Workspace'],['connect','Connect'],['scan','Scan'],['search','Search'],['resolve','Resolve']]
const reach=s=>({workspace:true,connect:OB.step!=='workspace',scan:OB.conn.claude&&OB.conn.n8n,search:OB.scanned,resolve:OB.searched||OB.resolved}[s])
let modal=null,mstate={}
function guideText(){const s=OB.step
 if(s==='workspace')return 'Check your workspace details, then click <b>Create workspace</b>.'
 if(s==='connect')return !OB.conn.claude?'Click <b>Connect</b> on the Claude card to authorize read-only access.':!OB.conn.n8n?'Now connect n8n: click <b>Connect</b> on the n8n card.':'Both tools connected. Click <b>Continue to scan</b>.'
 if(s==='scan')return OB.scanned?'Scan complete. Click <b>Continue to search</b>.':SC.running?'Scanning… Concord is reading every agent, read-only.':'Click <b>Start scan</b> to discover every agent in Claude and n8n.'
 if(s==='search'){const q=(document.getElementById('sq')||{}).value??OB.q;return !q?'Search a business term. Try clicking <b>customer health</b>.':search(q).some(g=>{const c=conflictFor(g.job);return c&&!C.S.resolved[c.id]})?'These agents disagree. Click <b>Resolve as owner</b> on a result.':'Try another term, like <b>ARR</b>, <b>discount</b> or your own question.'}
 if(s==='resolve'){const R=rs(OB.cid);return ['Pick the definition that should be official. Click a card.','Add a short reason, then click <b>Publish as official block</b>.','Click <b>Notify builders & rewire</b> to switch every agent over.','Rewiring agents… watch the answers converge.','Done. Go to the dashboard, or watch how it works when an employee builds a new agent.'][R.stage]}
 return ''}
export function guide(){const g=document.getElementById('obguide');if(g)g.innerHTML=`<span class="gdot"></span><span><b class="gk">Next:</b> ${guideText()}</span>`}
export function onboardPage(){const s=OB.step
 return `<div class="ob"><header class="obh"><a class="brand" href="#/">${logo()}<b>Concord</b></a><span class="obws">${esc(OB.company||'Your company')}</span>
 <nav class="obsteps">${STEPS.map(([k,l],i)=>{const idx=STEPS.findIndex(x=>x[0]===s),done=i<idx||(k==='resolve'&&OB.resolved);return `<button class="${k===s?'on':''} ${done?'done':''}" data-obgo="${k}" ${reach(k)?'':'disabled'}><i>${done?'✓':i+1}</i><span>${l}</span></button>`}).join('')}</nav>
 <div class="obr"><a class="obwatch" href="#/watch">${C.ic('play',11)}<span>Watch it live</span></a><a class="obskip" href="#/overview">Skip to app</a></div></header>
 <div class="obguide" id="obguide"></div><main class="obm">${({workspace:wsStep,connect:connStep,scan:scanStep,search:searchStep,resolve:()=>resolveView(OB.cid,true)})[s]()}</main>${modal?modalHTML():''}</div>`}
const logo=()=>`<svg width="24" height="24" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#6d5efc"/><circle cx="12" cy="16" r="6" fill="none" stroke="#fff" stroke-width="2.5"/><circle cx="20" cy="16" r="6" fill="none" stroke="#fff" stroke-width="2.5"/></svg>`
function wsStep(){return `<div class="obgrid"><div class="card obcard"><h1>Create your workspace</h1><p class="sub">This is a sandbox with fictional data. Nothing leaves your browser.</p>
 <label class="fl">Company name<input id="f-company" value="${esc(OB.company)}"/></label><div class="frow"><label class="fl">Your name<input id="f-name" value="${esc(OB.name)}"/></label><label class="fl">Your role<input id="f-role" value="${esc(OB.role)}"/></label></div>
 <label class="fl">Company size<select id="f-size"><option>201–500 people</option><option>51–200 people</option><option>501–2,000 people</option></select></label>
 <button class="btn p big" data-obws style="margin-top:8px">Create workspace →</button></div>
 <div class="obside"><div class="lbl">What happens next</div>${[['plug','Connect','Claude and n8n, read-only. Concord never writes to your tools.'],['bot','Scan','Concord discovers every agent and groups them by the job they do.'],['search','Search','Ask about a business term and see every agent\'s answer side by side.'],['check','Resolve','Pick the official definition and watch every agent agree.']].map(([i,t,d],k)=>`<div class="obs"><span>${k+1}</span><div><b>${t}</b><p>${d}</p></div></div>`).join('')}</div></div>`}
function connStep(){const cl=C.agents.filter(a=>a.tool==='claude').length,n8=C.agents.length-cl
 const card=(k,name,desc,count,unit)=>{const on=OB.conn[k];return `<div class="card icard ${on?'on':''}"><div class="ich"><span class="tile" style="background:${C.TOOLS[k].c}">${C.TOOLS[k].a}</span><div><b>${name}</b><span>${desc}</span></div></div>
  ${on?`<div class="ion">${C.ic('check',14)} Connected · read-only · <b>${count} ${unit} visible</b></div>`:`<div class="mut" style="font-size:12px">${C.ic('lock',11)} Read-only access</div><button class="btn p" data-connect="${k}">Connect</button>`}</div>`}
 return `<div class="obwide"><h1>Connect where your teams build agents</h1><p class="sub">Read-only. Concord reads agents, instructions and sources. It never creates, edits or deletes anything in your tools.</p>
 <div class="igrid">${card('claude','Claude','Claude Enterprise · Projects and agents',cl,'Projects')}${card('n8n','n8n','Workflows with AI steps',n8,'workflows')}
 ${['ChatGPT Enterprise','Microsoft Copilot Studio','Google Gemini','Zapier'].map(n=>`<div class="card icard soon"><div class="ich"><span class="tile g">${n[0]}</span><div><b>${n}</b><span>Coming soon</span></div></div><span class="chip c-mut">Coming soon</span></div>`).join('')}</div>
 <div class="obfoot"><span class="mut">${OB.conn.claude&&OB.conn.n8n?'Both connected.':'Connect both tools to continue.'}</span><button class="btn p big" data-obgo="scan" ${OB.conn.claude&&OB.conn.n8n?'':'disabled'}>Continue to scan →</button></div></div>`}
function modalHTML(){const m=mstate
 if(modal==='claude')return `<div class="mbg" data-mclose></div><div class="modal" role="dialog"><div class="mh">${logo()}<span class="mx">⇄</span><span class="tile" style="background:#b8643f">C</span><button class="iconbtn" data-mclose style="margin-left:auto">${C.ic('x')}</button></div>
 <h2>Authorize Concord for your Claude organization</h2><p class="mut">Organization <b class="tx">${esc(OB.company)}</b> · you are signed in as ${esc(OB.name)} (Org admin)</p>
 ${m.done?`<div class="mok">${C.ic('check',18)}<div><b>Connected, read-only</b><span>${C.agents.filter(a=>a.tool==='claude').length} Projects visible to Concord.</span></div></div><div class="mf"><button class="btn p" data-mclose>Done</button></div>`:`
 <div class="scope"><div class="lbl">Concord will be able to</div>${['Read Projects and agents: names, owners, members','Read project instructions','Read connected sources and knowledge file names','Read usage metadata, not conversation content'].map(s=>`<div class="sc-y">${C.ic('check',14)}${s}<span class="chip c-mut">read</span></div>`).join('')}</div>
 <div class="scope"><div class="lbl">Concord will not be able to</div>${['Create, edit or delete Projects','Send messages or run agents','Change settings, members or permissions'].map(s=>`<div class="sc-n">${C.ic('x',14)}${s}</div>`).join('')}</div>
 <div class="mf"><button class="btn" data-mclose>Cancel</button><button class="btn p" data-cauth ${m.busy?'disabled':''}>${m.busy?'<span class="spin"></span> Authorizing…':'Authorize read-only access'}</button></div>`}</div>`
 const checks=['Reached northwind.app.n8n.cloud','API key accepted','Read-only scope confirmed: workflows:read, executions:read','Found '+(C.agents.filter(a=>a.tool==='n8n').length)+' workflows with AI steps']
 return `<div class="mbg" data-mclose></div><div class="modal" role="dialog"><div class="mh">${logo()}<span class="mx">⇄</span><span class="tile" style="background:#c23a55">n</span><button class="iconbtn" data-mclose style="margin-left:auto">${C.ic('x')}</button></div>
 <h2>Connect your n8n instance</h2><p class="mut">Use an API key with read-only access. Concord lists workflows and reads their AI steps; it never edits or runs them.</p>
 <label class="fl">Instance URL<input value="https://northwind.app.n8n.cloud" spellcheck="false"/></label><label class="fl">API key<input type="password" value="n8n_api_demo_7f3a92c1e4b8" spellcheck="false"/><small class="dim">Demo value. In n8n: Settings → n8n API → Create an API key.</small></label>
 ${m.testing?`<div class="tests">${checks.slice(0,m.k).map(s=>`<div>${C.ic('check',14)}${s}</div>`).join('')}${m.k<4?'<div class="mut"><span class="spin"></span> Testing…</div>':''}</div>`:''}
 ${m.done?`<div class="mok">${C.ic('check',18)}<div><b>Connected, read-only</b><span>${C.agents.filter(a=>a.tool==='n8n').length} workflows visible to Concord.</span></div></div><div class="mf"><button class="btn p" data-mclose>Done</button></div>`
 :`<div class="mf"><button class="btn" data-mclose>Cancel</button><button class="btn" data-ntest ${m.testing?'disabled':''}>Test connection</button><button class="btn p" data-nsave ${m.k>=4?'':'disabled'}>Save connection</button></div>`}</div>`}
// scan
const SC={running:false,timers:[]}
function scanStep(){const done=OB.scanned
 return `<div class="obwide"><h1>Scan for agents</h1><p class="sub">Concord reads every Claude Project and n8n workflow, read-only, then groups agents by the job they do and compares their answers.</p>
 <div class="scan"><div class="card sphases">${['Reading Claude Projects','Reading n8n workflows','Grouping agents by job','Comparing answers'].map((p,i)=>`<div class="ph" data-ph="${i}"><i></i><div><b>${p}</b><span></span></div></div>`).join('')}
 <div class="sbtn">${done?'':`<button class="btn p big" data-scan ${SC.running?'disabled':''}>${C.ic('search',14)} Start scan</button>`}</div></div>
 <div class="sright"><div class="scount"><div><b id="k-all">0</b><span>agents found</span></div><div><b id="k-cl">0</b><span>built in Claude</span></div><div><b id="k-n8">0</b><span>built in n8n</span></div><div><b id="k-jobs">0</b><span>jobs</span></div></div>
 <div class="card sfeed"><div class="lbl">Discovered agents</div><div id="feed" class="feedl"><div class="fempty">Agents will appear here as Concord finds them.</div></div></div>
 <div class="card sjobs"><div class="lbl">Jobs <span class="dim" id="jobsn"></span></div><div id="jobs" class="jchips"><span class="fempty">Agents doing the same job will be grouped here.</span></div></div>
 <div class="card sconf"><div class="lbl">Conflicts found</div><div id="confl" class="clist"><span class="fempty">Agents doing the same job but answering differently will show up here.</span></div></div></div></div>
 <div class="obfoot"><span class="mut" id="scanmsg">${done?'Scan complete.':''}</span>${!done&&SC.running?'<button class="btn" data-scanskip>Skip animation</button>':''}<button class="btn p big" data-obgo="search" id="toSearch" ${done?'':'disabled'}>Continue to search →</button></div></div>`}
function scanOrder(){const cl=[],n8=[];C.agents.forEach((a,i)=>(a.tool==='claude'?cl:n8).push(i));return [cl,n8]}
function jobList(){const m={};C.agents.forEach(a=>m[a.job]=(m[a.job]||0)+1);return Object.entries(m).sort((a,b)=>b[1]-a[1])}
function fillScan(full){const [cl,n8]=scanOrder(),J=jobList(),CF=C.CONF;const $=id=>document.getElementById(id);if(!$('feed'))return
 const row=i=>{const a=C.agents[i],d=document.createElement('div');d.className='frow';d.innerHTML=`${C.dav(a)}<div class="frn"><b>${a.n}</b><span>${a.b} · ${a.dept}</span></div>${C.tool(a.tool)}<span class="fj">${a.job}</span>`;return d}
 const ph=(i,state,txt)=>{const e=document.querySelector(`[data-ph="${i}"]`);if(!e)return;e.className='ph '+state;e.querySelector('span').textContent=txt||''}
 const counts=(c,n)=>{$('k-all').textContent=c+n;$('k-cl').textContent=c;$('k-n8').textContent=n}
 const feed=$('feed'),jobs=$('jobs'),confl=$('confl')
 const jobChip=([j,n])=>{const s=document.createElement('span');const cf=CF.find(c=>c.job===j);s.className='jc'+(cf&&!C.S.resolved[cf.id]?' bad':'');s.innerHTML=`${j} <b>${n}</b>`;return s}
 const confRow=c=>{const d=document.createElement('div');d.className='cr';d.innerHTML=`<span class="sev" style="background:${C.S.resolved[c.id]?'#3fcf8e':{bad:'#f2555a',warn:'#f5a524',info:'#4cc3ff'}[c.sev]}"></span><b>${c.t}</b><span class="mut">${c.cols.length?c.cols.length+' agents disagree':'needs review'}</span>`;return d}
 if(full){feed.innerHTML='';[...cl,...n8].forEach(i=>feed.appendChild(row(i)));counts(cl.length,n8.length);jobs.innerHTML='';J.forEach(j=>jobs.appendChild(jobChip(j)));$('k-jobs').textContent=J.length;$('jobsn').textContent=`· ${J.length}`;confl.innerHTML='';CF.forEach(c=>confl.appendChild(confRow(c)))
  ph(0,'done',cl.length+' Projects');ph(1,'done',n8.length+' workflows');ph(2,'done',J.length+' jobs');ph(3,'done',CF.length+' conflicts');feed.scrollTop=0;return}
 SC.running=true;const T=(f,ms)=>SC.timers.push(setTimeout(f,ms));let t=300,c=0,n=0
 T(()=>{feed.innerHTML='';ph(0,'on','reading…')},t)
 cl.forEach(i=>{t+=140;T(()=>{feed.appendChild(row(i));feed.scrollTop=feed.scrollHeight;counts(++c,n)},t)});t+=200;T(()=>{ph(0,'done',cl.length+' Projects');ph(1,'on','reading…')},t)
 n8.forEach(i=>{t+=140;T(()=>{feed.appendChild(row(i));feed.scrollTop=feed.scrollHeight;counts(c,++n)},t)});t+=300;T(()=>{ph(1,'done',n8.length+' workflows');ph(2,'on','grouping…');jobs.innerHTML=''},t)
 J.forEach((j,k)=>{t+=150;T(()=>{jobs.appendChild(jobChip(j));$('k-jobs').textContent=k+1;$('jobsn').textContent=`· ${k+1}`},t)});t+=300;T(()=>{ph(2,'done',J.length+' jobs');ph(3,'on','asking agents the same questions…');confl.innerHTML=''},t)
 CF.forEach(cf=>{t+=380;T(()=>confl.appendChild(confRow(cf)),t)});t+=400
 T(()=>{ph(3,'done',CF.length+' conflicts');SC.running=false;OB.scanned=true;save();$('scanmsg').innerHTML=`<b class="tx">Scan complete:</b> ${C.agents.length} agents, ${J.length} jobs, ${CF.length} conflicts.`;$('toSearch').disabled=false;const sk=document.querySelector('[data-scanskip]');if(sk)sk.remove();guide();const r=document.querySelector('[data-obgo="search"]');if(r)r.disabled=false;document.querySelectorAll('.obsteps [data-obgo=search]').forEach(b=>b.disabled=false)},t)}
function stopScan(){SC.timers.forEach(clearTimeout);SC.timers=[];SC.running=false}
function searchStep(){return `<div class="obwide"><h1>Search across every agent</h1><p class="sub">Type a business term or a question. Concord shows every agent doing that job, in Claude and n8n, with its definition and answer side by side.</p>${searchBox(OB.q)}</div>`}
// ---------- landing ----------
export function landingPage(){const tile=(t,c)=>`<span class="tile ${c?'':'g'}" style="${c?`background:${c}`:''}">${t}</span>`
 return `<div class="lp"><header class="lph"><a class="brand" href="#/">${logo()}<b>Concord</b></a><nav class="lpn"><button data-scroll="product">Product</button><button data-scroll="how">How it works</button><a href="#/watch">Watch it live</a></nav><div class="lpr"><a class="lsign" href="#/overview">Sign in</a><a class="btn p" href="#/start">Get started</a></div></header>
 <section class="lhero"><div class="lht"><span class="eyebrow">Agent consistency for the whole company</span><h1>Agents doing the same job should give the same answer.</h1>
 <p class="lsub">Your employees build agents in Claude, n8n and more. Concord connects read-only, maps every agent, catches the ones that disagree, and lets the owner publish one official definition that every agent calls over MCP.</p>
 <div class="lcta"><a class="btn p xl" href="#/start">Get started →</a><a class="btn xl wbtn" href="#/watch">${C.ic('play',14)} Watch it live</a></div>
 <div class="lnote">Interactive demo with a fictional company. No sign-up. <span>Get started: run it yourself · Watch it live: see an employee build an agent, about a minute.</span></div></div>
 <div class="lmock card"><div class="mbar"><i></i><i></i><i></i><span>concord · search</span></div><div class="msearch">${C.ic('search',14)} customer health<span class="caret"></span></div>
 <div class="mrows">${[['MC','#4cc3ff','Account health monitor','Maya · CS','Claude','42'],['TR','#4cc3ff','CSM weekly risk digest','Tom · CS','n8n','17'],['PS','#f5a524','Renewal radar','Priya · Sales','Claude','28']].map(r=>`<div class="mrow"><span class="dav" style="background:${r[1]}">${r[0]}</span><div><b>${r[2]}</b><span>${r[3]}</span></div><span class="ptag"><i style="background:${r[4]==='Claude'?'#b8643f':'#c23a55'}"></i>Built in ${r[4]}</span><em>${r[5]}</em></div>`).join('')}</div>
 <div class="mfoot"><span class="chip c-bad"><i></i>3 agents · 3 answers</span><span class="btn p sm">Make official</span></div><div class="mcap">Illustration with demo data</div></div></section>
 <div class="lline">Security tools ask if an agent is safe. <b>Concord asks if all your agents give the same answer.</b></div>
 <section class="lsec" id="product"><div class="lsh"><span class="eyebrow">The problem</span><h2>Same job. Different answers.</h2><p>Teams build agents wherever they work. Four people build an at-risk-accounts agent, each with their own definition and source, and nobody can see that they disagree.</p></div>
 <div class="lprob"><div class="lq">${C.ic('search',15)} "How many accounts are at risk this quarter?"</div><div class="l4">${[['Dana','Sales Ops','Claude','35','no login 21d OR > 3 tickets'],['Maya','CS','Claude','42','tickets > 5 OR CSAT < 3.5'],['Tom','CS','n8n','17','usage drop > 40%'],['Priya','Sales','Claude','28','usage + NPS + tickets score']].map(r=>`<div class="lc"><div class="lcn">${r[3]}</div><b>${r[0]}'s agent</b><span>${r[1]} · built in ${r[2]}</span><code>${r[4]}</code></div>`).join('')}</div><div class="mcap">Example from the Northwind demo workspace (fictional).</div></div>
 <div class="l3">${[['Nobody sees the full inventory','Agents live in personal Projects and workflows across tools.'],['Definitions drift','Each builder picks their own rule and source, often a stale export.'],['The wrong number travels','Different answers reach customers, forecasts and the board.']].map(([t,d])=>`<div><b>${t}</b><p>${d}</p></div>`).join('')}</div></section>
 <section class="lsec" id="how"><div class="lsh"><span class="eyebrow">How it works</span><h2>From scattered agents to one official answer</h2></div>
 <div class="lsteps">${[['plug','Connect read-only','Claude via its admin API, n8n via its REST API. No write access.'],['bot','Map every agent','Every Project and workflow, who built it, its instructions and sources.'],['alert','Catch conflicts','Agents doing the same job are asked the same question; disagreements surface.'],['check','Owner decides','The conflict goes to the person who owns the definition, not to IT.'],['cube','Publish over MCP','The official definition becomes a shared block agents call.'],['layers','Track adoption','See every agent switch over and the answers converge.']].map(([i,t,d],k)=>`<div class="lstep"><span class="lsi">${C.ic(i,16)}</span><span class="lsn">${k+1}</span><b>${t}</b><p>${d}</p></div>`).join('')}</div></section>
 <section class="lsec"><div class="lsh"><span class="eyebrow">Integrations</span><h2>Works where your teams already build</h2></div>
 <div class="lint">${tile('C','#b8643f')}<div><b>Claude</b><span class="chip c-ok"><i></i>Available</span></div>${tile('n','#c23a55')}<div><b>n8n</b><span class="chip c-ok"><i></i>Available</span></div>${['ChatGPT Enterprise','Microsoft Copilot Studio','Google Gemini','Zapier'].map(n=>`${tile(n[0])}<div><b>${n}</b><span class="chip c-mut">Coming soon</span></div>`).join('')}</div></section>
 <section class="lsec"><div class="lsh"><span class="eyebrow">Built for</span><h2>The teams who own the answers</h2></div>
 <div class="l3 cards">${[['RevOps','Keep pipeline, ARR, discount and health definitions consistent across every agent sales and CS build.'],['Data & Analytics','Make the governed metric the one agents use, instead of a personal spreadsheet.'],['AI Center of Excellence','Let everyone build agents, and still know that agents doing the same job agree.']].map(([t,d])=>`<div class="card"><b>${t}</b><p>${d}</p></div>`).join('')}</div></section>
 <section class="lend card"><h2>See your agents' answers line up.</h2><p>Run the hands-on demo, or watch an employee build an agent first.</p><div class="lcta"><a class="btn p xl" href="#/start">Get started →</a><a class="btn xl wbtn" href="#/watch">${C.ic('play',14)} Watch it live</a></div></section>
 <footer class="lfoot"><span>© 2026 Concord (placeholder name) · Demo with fictional data</span><span><a href="#/overview">Sign in</a> · <button data-reset>Reset demo</button></span></footer></div>`}
// ---------- dashboard checklist ----------
export function checklist(){const items=[['Connect Claude and n8n',OB.conn.claude&&OB.conn.n8n,'connect'],['Scan for agents',OB.scanned,'scan'],['Search a business term',OB.searched,'search'],['Resolve your first conflict',OB.resolved,'resolve']]
 const n=items.filter(i=>i[1]).length;if(n===4&&OB.dismissed)return ''
 return `<div class="card chk"><div class="chkh"><div><b>${n===4?'You\'re set up':'Get set up'}</b><span class="mut">${n}/4 done</span></div><div class="bar" style="flex:1;max-width:200px"><span style="width:${n/4*100}%"></span></div>${n===4?'<button class="btn" data-chkx>Dismiss</button>':`<a class="btn p" href="#/start">Continue setup →</a>`}</div>
 <div class="chki">${items.map(([t,d,s])=>`<a href="#/start" data-obgoto="${s}" class="${d?'d':''}"><i>${d?'✓':''}</i>${t}</a>`).join('')}</div></div>`}
// ---------- mounting & events ----------
export function mountOB(){if(document.querySelector('.ob')){guide();if(OB.step==='scan'){if(OB.scanned)fillScan(true);else if(SC.running){stopScan();}}}
 const sq=document.getElementById('sq');if(sq&&!document.querySelector('.rv')){}}
document.addEventListener('input',e=>{const t=e.target
 if(t.id==='sq'){clearTimeout(t._d);t._d=setTimeout(()=>{runQ(t.value)},160)}
 else if(t.id==='rdef'){const cid=t.closest('.rv').dataset.cid;rs(cid).text=t.value}
 else if(t.id==='rreason'){const cid=t.closest('.rv').dataset.cid;rs(cid).reason=t.value;const b=document.querySelector('[data-rpublish]');if(b)b.disabled=!t.value.trim();guide()}})
function runQ(q){const r=document.getElementById('sres');if(!r)return;r.innerHTML=results(q);const inOB=!!document.querySelector('.ob');if(inOB){OB.q=q;if(q.trim()&&search(q).length){OB.searched=true}save();const b=document.querySelector('.obsteps [data-obgo=resolve]');if(b)b.disabled=!reach('resolve');guide()}
 const x=document.querySelector('.sclr');const box=document.querySelector('.sbox');if(q&&!x&&box){box.insertAdjacentHTML('beforeend','<button class="sclr" data-sclear title="Clear">×</button>')}else if(!q&&x)x.remove()}
document.addEventListener('keydown',e=>{if(e.target.id==='topq'&&e.key==='Enter'){location.hash='#/search/'+encodeURIComponent(e.target.value.trim())}})
document.addEventListener('click',e=>{const t=e.target.closest('[data-obgo],[data-obgoto],[data-obws],[data-connect],[data-mclose],[data-cauth],[data-ntest],[data-nsave],[data-scan],[data-scanskip],[data-sq],[data-sclear],[data-resolve],[data-rpick],[data-redit],[data-rnext],[data-rback],[data-rchip],[data-rpublish],[data-rrewire],[data-obfinish],[data-scroll],[data-reset],[data-chkx]');if(!t)return
 const d=t.dataset,R=()=>C.render()
 if(d.scroll){document.getElementById(d.scroll)?.scrollIntoView({behavior:'smooth'});return}
 if(d.reset!=null){C.reset();return}
 if(d.chkx!=null){OB.dismissed=true;save();R();return}
 if(d.obgoto){if(reach(d.obgoto)){OB.step=d.obgoto;save()}return}
 if(d.obgo){if(t.disabled)return;stopScan();OB.step=d.obgo;save();if(location.hash!=='#/start')location.hash='#/start';else R();scrollTo(0,0);return}
 if(d.obws!=null){OB.company=document.getElementById('f-company').value.trim()||'Northwind';OB.name=document.getElementById('f-name').value.trim()||'Sara Klein';OB.role=document.getElementById('f-role').value.trim()||'Head of RevOps';OB.step='connect';save();R();return}
 if(d.connect){modal=d.connect;mstate={};R();return}
 if(d.mclose!=null){if(modal&&mstate.done){OB.conn[modal]=true;save()}modal=null;R();return}
 if(d.cauth!=null){mstate.busy=true;R();setTimeout(()=>{mstate={done:true};OB.conn.claude=true;save();R()},1200);return}
 if(d.ntest!=null){mstate.testing=true;mstate.k=0;R();const step=()=>{mstate.k++;R();if(mstate.k<4)setTimeout(step,550)};setTimeout(step,400);return}
 if(d.nsave!=null){mstate.done=true;OB.conn.n8n=true;save();R();return}
 if(d.scan!=null){t.disabled=true;fillScan(false);guide();const f=document.querySelector('.obfoot');if(f&&!f.querySelector('[data-scanskip]'))f.querySelector('#toSearch').insertAdjacentHTML('beforebegin','<button class="btn" data-scanskip>Skip animation</button>');return}
 if(d.scanskip!=null){stopScan();OB.scanned=true;save();R();return}
 if(d.sq){const i=document.getElementById('sq');if(i){i.value=d.sq;runQ(d.sq);i.focus()}return}
 if(d.sclear!=null){const i=document.getElementById('sq');if(i){i.value='';runQ('');i.focus()}return}
 if(d.resolve){if(document.querySelector('.ob')){OB.cid=d.resolve;OB.step='resolve';save();R();scrollTo(0,0)}else location.hash='#/resolve/'+d.resolve;return}
 const rv=t.closest('.rv');if(!rv&&!d.obfinish)return;const cid=rv?rv.dataset.cid:null,Rs=cid?rs(cid):null
 if(d.rpick){Rs.pick=+d.rpick;Rs.text='';rerenderR();return}
 if(d.redit!=null){Rs.edit=!Rs.edit;if(!Rs.edit)Rs.text='';rerenderR();if(Rs.edit)document.getElementById('rdef')?.focus();return}
 if(d.rnext!=null){if(Rs.pick==null)return;Rs.stage=1;rerenderR();document.getElementById('rreason')?.focus();return}
 if(d.rback!=null){Rs.stage=0;rerenderR();return}
 if(d.rchip){Rs.reason=d.rchip;rerenderR();return}
 if(d.rpublish!=null){if(!Rs.reason.trim())return;Rs.stage=2;rerenderR();return}
 if(d.rrewire!=null){rewire(cid);return}
 if(d.obfinish!=null){OB.step='resolve';OB.resolved=true;save();location.hash='#/overview';return}})
