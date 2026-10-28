import './style.css'
import {watchPage,mountWatch} from './watch.js'
import {OB,initOB,landingPage,howPage,pricingPage,aboutPage,onboardPage,searchBox,resolveView,checklist,mountOB,mountLanding,timelineMarkup,marketShell} from './onboard.js'
import {bindLead, paintLead, closeLead} from './lead.js'
import * as M from './model.js'
import {status, tag, lockup, mark, Brand} from './brand.js'

const $=s=>document.querySelector(s)
const esc=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))
const initials=n=>n.trim().split(/\s+/).map(x=>x[0]||'').join('').slice(0,2).toUpperCase()
const I={
home:'<path d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
bot:'<rect x="4" y="7" width="16" height="12" rx="3"/><path d="M12 3v4M9 12h.01M15 12h.01M9 16h6"/>',
layers:'<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
alert:'<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
cube:'<path d="m12 2 9 5v10l-9 5-9-5V7z"/><path d="m3 7 9 5 9-5M12 12v10"/>',
plug:'<path d="M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0zM12 18v4"/>',
gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0"/>',
check:'<path d="m5 12 5 5 9-10"/>',menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',x:'<path d="M6 6l12 12M18 6 6 18"/>',
chev:'<path d="m8 10 4 4 4-4"/>',play:'<path d="M7 4v16l13-8z" fill="currentColor"/>',lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
}
const ic=(n,s=16)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${I[n]}</svg>`
const {AGENTS,CONF,BLOCKS,TOOLS,DC}=M
const tool=k=>`<span class="ptag"><i style="background:${TOOLS[k].c}"></i>Built in ${TOOLS[k].n}</span>`
const dav=a=>`<span class="dav" style="background:${DC[a.dept]||'#9AABB3'};color:var(--on-sync)">${initials(a.b)}</span>`
const S=Object.assign(M.emptyState(),{route:'overview',agent:null,conflict:null,filter:'all',toast:null,scoreOpen:false,semanticConnected:false})
const parts=()=>M.companyParts(S)
const openN=()=>M.openConflicts(S).length
const highN=()=>M.openConflicts(S).filter(c=>c.sev==='bad').length

const NAV=[['watch','Use case','play'],['overview','Overview','home'],['agents','Agents','bot'],['jobs','Jobs & overlap','layers'],['conflicts','Inconsistencies','alert'],['blocks','Official answers','cube'],['integrations','Integrations','plug']]
const TITLES={search:'Search',resolve:'Resolve conflict',start:'Setup'}
function shell(inner){
  const title=(NAV.find(n=>n[0]===S.route)||[0,TITLES[S.route]||''])[1]
  const p=parts()
  return `<div class="shell"><aside class="side" id="side"><div class="ws"><div><b>${esc(OB.company)}</b><small>Live n8n · example jobs</small></div></div>
${NAV.map(([r,l,i])=>`<a class="nav ${S.route===r?'on':''}" href="#/${r}" data-nav="${r}">${ic(i)}${l}${r==='conflicts'?`<span class="ct r">${openN()}</span>`:r==='agents'?`<span class="ct">${AGENTS.length}</span>`:r==='watch'?'<span class="newb">Start here</span>':''}</a>`).join('')}
<div class="sec">Workspace</div><a class="nav ${S.route==='start'?'on':''}" href="#/start">${ic('check')}Setup guide</a><a class="nav" href="#/integrations">${ic('gear')}Settings</a><button class="nav navbtn" data-reset>${ic('x')}Restart demo</button>
<div class="sidefoot"><div style="display:flex;align-items:center;gap:8px;color:var(--tx)">${ic('lock',14)}<span>Read-only: never runs or edits agents.</span></div></div></aside>
<div class="main"><header class="top"><button class="iconbtn burger" id="burger">${ic('menu')}</button><a class="brand" href="#/" aria-label="concord, home">${lockup(20)}</a><a class="backsite" href="#/">Back to site</a><div class="crumb"></div>
${S.route!=='watch'?`<a class="topcta" href="#/watch">${ic('play',11)}<span>Use case</span></a>`:''}<label class="search">${ic('search',14)}<input id="topq" placeholder="Search a business term, e.g. customer health" value="${S.route==='search'?esc(S.q||''):''}"/><kbd>↵</kbd></label><button class="iconbtn">${ic('bell')}</button><div class="av" title="${esc(OB.name)} · ${esc(OB.role)}">${initials(OB.name)}</div></header>${inner}</div></div>
${S.toast?`<div class="toast">${ic('check')}${esc(S.toast)}</div>`:''}`}

function gauge(v){const r=70,c=Math.PI*r,p=v/100*c;return `<svg viewBox="0 0 180 110" width="100%" style="max-width:260px">
<path d="M20 95 A70 70 0 0 1 160 95" fill="none" stroke="var(--line)" stroke-width="13" stroke-linecap="round"/><path d="M20 95 A70 70 0 0 1 160 95" fill="none" stroke="var(--sync)" stroke-width="13" stroke-linecap="round" stroke-dasharray="${p} ${c}"/>
<text x="90" y="82" text-anchor="middle" fill="var(--text)" font-size="34" font-weight="700" font-family="Geist Mono, ui-monospace, monospace" id="gnum">${v}</text><text x="90" y="101" text-anchor="middle" fill="var(--text-muted)" font-size="10" font-family="Geist Mono, ui-monospace, monospace">out of 100</text></svg>`}
function chart(score){const d=[...M.HIST];if(score!==M.HIST.at(-1))d.push(score);const W=560,H=170,mn=40,mx=100,X=i=>20+i*(W-40)/(d.length-1),Y=v=>H-20-(v-mn)/(mx-mn)*(H-40)
const pts=d.map((v,i)=>`${X(i)},${Y(v)}`).join(' ');const months=['Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Now']
return `<svg viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="none" style="height:190px">
${[50,60,70,80,90].map(v=>`<line x1="20" x2="${W-20}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)" stroke-dasharray="3 4"/><text x="${W-4}" y="${Y(v)+3}" fill="var(--text-muted)" font-size="9" text-anchor="end" font-family="Geist Mono, ui-monospace, monospace">${v}</text>`).join('')}
<polyline points="${pts}" fill="none" stroke="var(--agent)" stroke-width="2.2" stroke-linejoin="round"/>
${d.map((v,i)=>`<text x="${X(i)}" y="${H-4}" fill="var(--text-muted)" font-size="9" text-anchor="middle" font-family="Geist Mono, ui-monospace, monospace">${months[i]||''}</text>`).join('')}
<circle cx="${X(d.length-1)}" cy="${Y(d.at(-1))}" r="4.5" fill="${score>M.INITIAL.score?'var(--sync)':'var(--agent)'}" stroke="var(--bg)" stroke-width="2"/></svg>`}

const STMAP={ok:['sync','Consistent'],conflict:['conflict','Inconsistent'],stale:['risk','At risk'],orphan:['risk','At risk'],variant:['sync','Valid variant'],suggested:['drift','Drift detected'],adopted:['sync','Consistent']}
const rowKind=st=>({ok:'sync',conflict:'conflict',stale:'risk',orphan:'risk',variant:'sync',suggested:'drift',adopted:'sync'}[st]||'unknown')
const statusChip=(st,opt)=>STMAP[st]?status(STMAP[st][0],STMAP[st][1],opt):''

function acts(){const items=[]
  if(S.resolved.c1==='official'){
    const plan=M.adoptionPlan(CONF[0],S)
    items.push(['ok','check',`<b>${esc(OB.name)}</b> published <b>Customer health v2</b>. ${plan.verifiedNeed.length}/${plan.need.length} builders verified by re-reading.`,'now'])
  }else if(S.resolved.c1==='variant'){
    items.push(['ok','check',`<b>${esc(OB.name)}</b> marked Customer health as a different job. Removed from the conflict count.`,'now'])
  }else items.push(['bad','!','Customer health answers on record differ: <b>35, 42, 17, 28</b>. Nothing was run.','2d'])
  items.push(['warn','~','<b>Refund macro</b> still cites Refund policy 2024.','3d'],
    ['ok','✓','<b>Noa Friedman</b> published Discount approval v3. 3 of 4 agents already match it.','3w'],
    ['mut','○','<b>Security questionnaire drafter</b> has no owner.','3w'])
  return items}
const icc={ok:'background:var(--status-in-sync-tint);color:var(--sync-text)',bad:'background:var(--status-conflict-tint);color:var(--status-conflict-text)',warn:'background:var(--status-risk-tint);color:var(--status-risk-text)',acc:'background:var(--raised);color:var(--agent-text)',mut:'background:var(--raised);color:var(--text-muted)'}

function scoreBox(p){
  const delta=p.score-M.INITIAL.score
  const ch=p.rows.find(r=>r.job==='Customer health')
  return `<div class="card"><div class="hd"><h3>Consistency score</h3><button class="scorehow" data-scoreinfo>${S.scoreOpen?'Hide breakdown':'How this is calculated'}</button></div>
<div class="bd scorewrap" id="scorewrap"><div style="text-align:center">${gauge(p.score)}
<div class="scoreline" id="scoreline">${p.maj} of ${p.n} agents on shared jobs match</div>
<p class="scorewhy">${esc(M.SCORE_COMPANY)}</p>
<div style="margin-top:6px">${tag((delta>0?`+${delta} pts`:'+'+(M.HIST.at(-1)-M.HIST[0])+' pts in 12 months')+(ch&&ch.score===100?' · Customer health is 100':''))}</div>
${S.scoreOpen?`<div class="scorepop"><p>${esc(M.SCORE_COMPANY)}</p><p class="scorewhy">${esc(M.SCORE_JOB)}</p>${p.rows.map(r=>`<div class="srow"><span>${r.job}</span><b>${r.score==null?'—':r.score}</b><span class="mut">${r.count<2?'left out':r.majority+' of '+r.count+' agree'}</span></div>`).join('')}<div class="srow tot"><span>Company</span><b>${p.score}</b><span class="mut">${p.maj} of ${p.n}</span></div></div>`:''}
</div><div>${chart(p.score)}</div></div></div>`}

function overview(){
  const p=parts(), cl=AGENTS.filter(a=>a.tool==='claude').length
  const dep=M.deptConflicts(S), max=Math.max(1,...dep.map(d=>d[1]))
  const jobs=p.rows.filter(r=>r.count>=2)
  const hr=+new Intl.DateTimeFormat('en-GB',{hour:'numeric',hourCycle:'h23',timeZone:'Asia/Jerusalem'}).format(new Date())
  const greet=hr<5||hr>=18?'Good evening':hr<12?'Good morning':'Good afternoon'
  const N=openN(), live=BLOCKS.filter(b=>M.blockLive(b,S)).length
  const top=M.openConflicts(S)[0]
  const topCard=top?(()=>{const cols=top.cols.map(c=>AGENTS[c.a]);const vals=new Set(cols.map(a=>a.ans));return `<div class="card topc"><div class="hd"><h3>${esc(top.q)}</h3>${status('conflict',`${cols.length} agents, ${vals.size} answers`)}<a class="r" href="#/conflicts/${top.id}">Open inconsistency →</a></div><div class="topr">${top.cols.map((c,k)=>{const a=AGENTS[c.a];const off=top.official&&k===top.win;return `<div class="tra${off?' off':''}"><span class="mono n">${esc(a.ans)}</span><b>${esc(a.n)}</b>${off?'<span class="mut">Official version</span>':''}</div>`}).join('')}</div></div>`})():''
  return `<div class="page ovp"><div class="ovh"><div><div class="greet">${greet}, ${esc(OB.name.split(' ')[0])}</div><h1>${N} questions are getting different answers across your teams</h1><p class="sub">Concord reads your Claude and n8n agents. It never runs or edits them.</p></div><a class="btn p" href="#/conflicts">Review inconsistencies</a></div>
<div class="grid g4" style="margin-bottom:14px">
<div class="card kpi"><div class="l">${ic('bot',14)}Agents scanned</div><div class="v">${AGENTS.length}</div><div class="d">${cl} in Claude · ${AGENTS.length-cl} in n8n</div></div>
<div class="card kpi"><div class="l">${ic('layers',14)}Shared questions</div><div class="v">${jobs.length}</div><div class="d">Jobs answered by 2+ agents</div></div>
<div class="card kpi kbad"><div class="l">${ic('alert',14)}Inconsistent</div><div class="v" id="kopen">${N}</div><div class="d">${highN()?`<span class="dn">${highN()} high severity</span>`:'<span class="up">No high severity left</span>'}</div></div>
<div class="card kpi"><div class="l">${ic('cube',14)}Official answers</div><div class="v">${live}</div><div class="d">${BLOCKS.length-live} drafts</div></div></div>
${topCard}<div class="chkc">${checklist()}</div>
<div class="grid g2" style="margin-bottom:14px">${scoreBox(p)}
<div class="card"><div class="hd"><h3>Recent activity</h3><span class="r">All</span></div><ul class="feed">${acts().slice(0,5).map(a=>`<li><span class="ic" style="${icc[a[0]]}">${a[1]==='check'?ic('check',12):a[1]}</span><div>${a[2]}</div><span class="t">${a[3]}</span></li>`).join('')}</ul></div></div>
<div class="grid dash3"><div class="card"><div class="hd"><h3>Inconsistencies by owner</h3></div><div class="bd" style="padding-top:6px">${dep.map(([n,v])=>`<div class="dept"><span class="mut">${n}</span><div class="bar"><span style="width:${v/max*100}%"></span></div><b style="text-align:right">${v}</b></div>`).join('')}</div></div>
<div class="card"><div class="hd"><h3>Shared jobs</h3><a class="r" href="#/jobs">View all</a></div><div class="bd sjbd"><p class="scorewhy">${esc(M.SCORE_JOB)}</p>${jobs.map(j=>{const pres=M.jobPresentation(j.job,S);return `<div class="sj"><b>${esc(j.job)}</b><span class="n">${j.count} agents</span><span class="end"><b class="mono">${j.score}</b>${status(pres.kind,pres.label)}</span></div>`}).join('')}</div></div>
<div class="card"><div class="hd"><h3>Official answers</h3><a class="r" href="#/blocks">Library</a></div><div class="bd">${BLOCKS.slice(0,4).map(b=>{const c=M.conflictByJob(b.job);const live=M.blockLive(b,S);const plan=c&&live?M.adoptionPlan(c,S):null;const t=M.tally(b.job,S);const label=plan?`${plan.verifiedNeed.length}/${plan.need.length} suggestions verified`:t.count?`${t.majority}/${t.count} match`:'—';const pct=plan&&plan.need.length?plan.verifiedNeed.length/plan.need.length*100:t.count?t.majority/t.count*100:0;return `<div style="margin:6px 0 12px"><div style="display:flex;justify-content:space-between;margin-bottom:6px"><span>${b.n} <span class="dim">${b.v}</span></span><span class="mut">${live?label:'Draft'}</span></div><div class="bar"><span style="width:${live?pct:0}%"></span></div></div>`}).join('')}</div></div></div></div>`}

function agentsPg(){
  const fl=S.filter
  const list=AGENTS.map((a,i)=>({a,i})).filter(({a,i})=>fl==='all'||(fl==='orphan'?a.own==='Unassigned':fl==='adopted'?(M.agentStatus(i,S)==='adopted'||a.onBlock):M.agentStatus(i,S)===fl))
  const f=[['all','All '+AGENTS.length],['conflict','Conflict'],['stale','Stale source'],['orphan','No owner'],['suggested','Suggestion sent'],['adopted','On a block']]
  return `<div class="page"><div class="hrow"><div><h1>Agents</h1><p class="sub">${AGENTS.length} agents read from Claude and n8n. Private live scan · example jobs. Answers are real n8n executions.</p></div></div>
<div class="card" style="overflow:hidden"><div class="filters">${f.map(([k,l])=>`<button class="fbtn ${fl===k?'on':''}" data-f="${k}">${l}</button>`).join('')}</div>
<div class="tw"><table><thead><tr><th>Agent</th><th>Job</th><th>Built in</th><th>Builder</th><th>Owner</th><th>Source</th><th>Updated</th><th>Status</th></tr></thead><tbody>
${list.map(({a,i})=>{const st=M.agentStatus(i,S);return `<tr class="k-${rowKind(st)}" data-agent="${i}"><td><b style="font-weight:500">${esc(a.n)}</b></td><td class="mut">${esc(a.job)}</td><td>${tool(a.tool)}</td><td>${esc(a.b)}<span class="dim"> · ${esc(a.dept)}</span></td><td class="${a.own==='Unassigned'?'dim':''}">${esc(a.own)}</td><td class="mut">${esc(a.src)}</td><td class="mut">${esc(a.up)} ago</td><td>${statusChip(st,{subtle:true})}</td></tr>`}).join('')}
</tbody></table></div></div></div>${S.agent!=null?drawer(S.agent):''}`}
function drawer(i){
  const a=AGENTS[i], blk=BLOCKS.find(b=>b.job===a.job), st=M.agentStatus(i,S)
  const on=st==='adopted'||a.onBlock
  const lines=M.effectiveDef(i,S)
  return `<div class="drawer-bg" data-close></div><div class="drawer"><div class="dh"><span class="tdot" style="background:${TOOLS[a.tool].c};width:34px;height:34px;border-radius:9px;display:grid;place-items:center;font-weight:700;font-size:12px;color:var(--on-sync)">${TOOLS[a.tool].a}</span><div><h1 style="font-size:17px">${esc(a.n)}</h1><div class="mut">Built by ${esc(a.b)} · ${esc(a.dept)} · in ${TOOLS[a.tool].n}</div></div><button class="iconbtn" style="margin-left:auto" data-close>${ic('x')}</button></div>
<section><div class="kv"><span>Status</span><span>${statusChip(st)}</span><span>Job</span><span>${esc(a.job)}</span><span>Owner</span><span>${esc(a.own)}</span><span>Recorded answer</span><span>${esc(M.effectiveAnswer(i,S))}</span><span>Weekly users</span><span>${a.users}</span><span>Last read</span><span>${esc(a.up)} ago</span></div></section>
<section><div class="lbl">${a.tool==='claude'?'Project instructions · Compliance API':'Workflow JSON · n8n REST API'}</div><div class="code">${esc(lines.join('\n'))}</div>
${a.tool==='claude'?`<p class="blind">${ic('alert',14)} ${esc(M.BLIND)}</p>`:`<p class="blind">${ic('alert',14)} ${esc(M.N8N_NOTE)}</p>`}
<p class="dim" style="margin:8px 0 0">${esc(a.evidence)}</p></section>
<section><div class="lbl">Official answer</div>${blk?`<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--line);border-radius:10px">${ic('cube')}<div><b>${esc(blk.n)} ${esc(blk.v)}</b><div class="mut" style="font-size:12px">Owner ${esc(blk.own)}</div></div><span style="margin-left:auto">${on?status('sync','In sync'):M.blockLive(blk,S)?status('drift','Drift detected'):status('unknown','Not checked')}</span></div>`:'<span class="mut">No official answer for this job yet.</span>'}</section></div>`}

function venn(n,col){const pos=n>=4?[[-40,-14],[40,-14],[-40,22],[40,22]]:n===3?[[-34,-12],[34,-12],[0,24]]:[[-28,0],[28,0]]
return `<svg viewBox="-110 -75 220 150" class="venn" width="100%">${pos.slice(0,Math.max(n,2)).map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="46" fill="${col[i%col.length]||'#9AABB3'}" fill-opacity=".28" stroke="${col[i%col.length]||'#9AABB3'}" stroke-opacity=".9"/>`).join('')}<text x="0" y="5" text-anchor="middle" fill="var(--text)" font-size="11" font-weight="600">${n<2?'one agent':'shared job'}</text></svg>`}
function jobs(){
  return `<div class="page"><div class="hrow"><div><h1>Jobs & overlap</h1><p class="sub">Agents grouped by the job they do. A job scores 100 when the agents still in it agree. Colors are the builder’s department.</p></div></div>
<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">${M.JOB_ORDER.map(job=>{
  const ids=M.jobIds(job), score=M.jobScore(job,S)
  const pres=M.jobPresentation(job,S), kind=pres.kind, label=pres.label
  return `<div class="card job k-${kind}"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><h4>${esc(job)}</h4><span class="mut">${ids.length} agent${ids.length>1?'s':''}</span><span style="margin-left:auto;display:inline-flex;gap:8px;align-items:center">${score==null?'':`<b class="mono">${score}</b>`}${status(kind,label)}</span></div>
${score==null?'':`<p class="scorewhy">${esc(M.SCORE_JOB)}</p>`}
${venn(ids.length, ids.map(i=>DC[AGENTS[i].dept]))}${ids.map(i=>`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid var(--line)">${dav(AGENTS[i])}<span>${esc(AGENTS[i].n)}<span class="dim" style="display:block;font-size:11px">${esc(AGENTS[i].b)} · ${esc(AGENTS[i].dept)} · ${esc(M.effectiveAnswer(i,S))}</span></span><span style="margin-left:auto">${tool(AGENTS[i].tool)}</span></div>`).join('')}</div>`}).join('')}</div></div>`}

const sevc={bad:'var(--status-conflict-fill)',warn:'var(--status-risk-fill)',info:'var(--status-review-fill)'}
function conflicts(){
  const c=CONF.find(x=>x.id===S.conflict)
  return `<div class="inbox ${c?'has':''}"><div class="ilist"><div style="padding:16px;border-bottom:1px solid var(--line)"><h1 style="font-size:16px">Inconsistencies</h1><div class="mut">${openN()} open · same job, different definition</div></div>
${CONF.map(x=>{const open=M.isOpen(x,S), vars=(S.variants[x.id]||[]).length
  return `<a class="it ${S.conflict===x.id?'on':''}" href="#/conflicts/${x.id}"><div class="tt"><span class="sev" style="background:${open?sevc[x.sev]:'var(--sync)'}"></span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(x.t)}</span></div><div class="ds">${esc(x.d)}</div><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">${tag(esc(x.type))}${S.resolved[x.id]==='official'?status('sync','In sync'):''}${S.resolved[x.id]==='variant'?status('sync','Valid variant'):''}${vars&&S.resolved[x.id]!=='variant'?status('sync',vars+' variant'):''}<span class="dim" style="margin-left:auto;font-size:11px">${esc(x.owner)} · ${esc(x.age)}</span></div></a>`}).join('')}</div>
<div class="detail">${c?cdetail(c):'<div class="mut" style="padding:60px;text-align:center">Select a conflict</div>'}</div></div>`}
function cdetail(c){
  const res=S.resolved[c.id], plan=M.adoptionPlan(c,S)
  const active=c.cols.filter(col=>!M.isVariant(c.id,col.a,S))
  return `<a class="btn" href="#/conflicts" style="margin-bottom:12px;display:${innerWidth<820?'inline-flex':'none'}">← Back</a>
<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">${c.sev==='bad'?status('conflict','Conflict'):c.sev==='warn'?status('risk','At risk'):status('review','Needs sign-off')}${tag(esc(c.type))}<span class="dim">${active.length} definitions still in this conflict${(S.variants[c.id]||[]).length?` · ${(S.variants[c.id]||[]).length} marked as a valid variant`:''}</span></div>
<h1 style="margin-top:10px">${esc(c.t)}</h1>
<p class="sub" style="margin-top:6px">${esc(c.note)}</p>
<div class="q">${ic('search',15)}<div><span class="mut">Question already in the logs</span><b>“${esc(c.q)}”</b></div></div>
<div class="cols" style="grid-template-columns:repeat(${c.cols.length},1fr)">${c.cols.map(col=>{
  const a=AGENTS[col.a], variant=M.isVariant(c.id,col.a,S), ans=M.effectiveAnswer(col.a,S)
  return `<div class="col ${variant?'var':''}"><div class="ch"><b>${esc(a.n)}</b><div style="display:flex;flex-direction:column;gap:6px;align-items:flex-start"><span class="mut">${esc(a.b)} · ${esc(a.dept)}</span>${tool(a.tool)}</div></div>
<div class="ans"><div class="lbl" style="margin:0 0 2px">Answer on record</div><div class="n ${variant?'dim':res==='official'&&ans===plan.ans?'ok':''}">${esc(ans)}</div><div class="mut">${esc(a.evidence)}</div></div>
<div class="lg">${M.effectiveDef(col.a,S).map(l=>`<span>${esc(l)}</span>`).join('')}</div>
<div class="cf">${variant?status('sync','Valid variant'):res?(a.ans===plan.ans&&!S.verified.includes(col.a)?status('sync','In sync'):M.agentStatus(col.a,S)==='adopted'?status('sync','In sync'):status('drift','Drift detected')):`<button class="btn" data-variant="${c.id}:${col.a}">Different job / valid variant</button>`}</div></div>`}).join('')}</div>
${res==='official'?`<div class="lbl" style="margin-top:18px">Adoption</div><p class="mut">Builders apply the suggestion. Concord re-reads instructions and workflow JSON. It does not edit the agent.</p>${timelineMarkup(c.id)}`:`<div class="lbl" style="margin-top:20px">Impact estimate</div><div class="impact"><div><span class="mut">Revenue at stake</span><b>${esc(c.impact[0])}</b><span class="dim">${esc(c.impact[1])}</span></div><div><span class="mut">Agents</span><b>${esc(c.imp2[0])}</b><span class="dim">${esc(c.imp2[1])}</span></div><div><span class="mut">On record</span><b>${esc(c.imp3[0])}</b><span class="dim">${esc(c.imp3[1])}</span></div></div>`}
<div class="actions" style="margin-top:16px">${res?`<a class="btn" href="#/blocks">View official answers</a>`:`<button class="btn" data-variant="${c.id}:job">Different job / valid variant</button><a class="btn p" href="#/resolve/${c.id}">${ic('check',13)} Resolve this conflict</a>`}</div>`}

function blocks(){
  return `<div class="page"><div class="hrow"><div><h1>Official answers</h1><p class="sub">Owner-approved definitions. Connecting dbt or Atlan is coming next.</p></div></div>
<div class="card"><div class="tw" style="max-height:none"><table><thead><tr><th>Answer</th><th>Version</th><th>Owner</th><th>On this definition</th><th>Suggestions</th><th>Updated</th></tr></thead><tbody>
${BLOCKS.map(b=>{const c=M.conflictByJob(b.job), live=M.blockLive(b,S), t=M.tally(b.job,S), plan=c?M.adoptionPlan(c,S):null
  const sugg=plan&&live&&plan.need.length?`${plan.verifiedNeed.length}/${plan.need.length} verified`:'—'
  return `<tr class="k-${live?'sync':'unknown'}"><td><span style="display:inline-flex;gap:8px;align-items:center">${ic('cube',15)}<b style="font-weight:500">${esc(b.n)}</b></span></td><td>${tag(esc(b.v)+(live?'':' · draft'))}</td><td>${esc(b.own)}</td>
<td class="mut">${t.count?`${t.majority}/${t.count} match`+(M.jobScore(b.job,S)===100?' · 100':''):'—'}</td><td class="mut">${sugg}</td><td class="mut">${live&&b.id==='c1'&&S.resolved.c1?'Just now':esc(b.upd)}</td></tr>`}).join('')}
</tbody></table></div></div>
${CONF.filter(c=>S.resolved[c.id]==='official').map(c=>`<div class="card" style="margin-top:14px"><div class="hd"><h3>${esc(c.job)} · published</h3><span class="r">Verified by re-reading</span></div><div class="bd">${timelineMarkup(c.id)}${c.cols.map(col=>{const a=AGENTS[col.a];return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)">${dav(a)}<span>${esc(a.n)}</span><span class="dim">${esc(a.b)}</span>${tool(a.tool)}<span style="margin-left:auto">${statusChip(M.agentStatus(col.a,S))}</span></div>`}).join('')}</div></div>`).join('')}
</div>`}

function integ(){
  const cl=AGENTS.filter(a=>a.tool==='claude').length, n8=AGENTS.length-cl
  return `<div class="page"><div class="hrow"><div><h1>Integrations</h1><p class="sub">Read-only. Concord inventories agents and reads instructions, knowledge files, workflow JSON, and answers already given. It never runs or edits an agent.</p></div></div>
<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(320px,1fr))">
<div class="card integ"><div style="display:flex;gap:12px;align-items:center"><span class="tdot tile cl" style="background:${TOOLS.claude.c}">C</span><div><b>Claude</b><div class="mut">${cl} projects</div></div><span style="margin-left:auto">${status('sync','In sync')}</span></div>
<div class="kv"><span>Access</span><span>${tag(ic('lock',11)+' Read-only')}</span><span>Connected via</span><span>Compliance API</span><span>Key</span><span>Read-only key created by the Primary Owner</span><span>Reads</span><span class="mut">Projects, instructions, knowledge files, and chats linked to a project</span><span>Blind spot</span><span class="mut">${esc(M.BLIND)}</span><span>Last sync</span><span>2 min ago</span></div></div>
<div class="card integ"><div style="display:flex;gap:12px;align-items:center"><span class="tdot tile n8" style="background:${TOOLS.n8n.c}">n</span><div><b>n8n</b><div class="mut">${n8} workflows</div></div><span style="margin-left:auto">${status('sync','In sync')}</span></div>
<div class="kv"><span>Access</span><span>${tag(ic('lock',11)+' Read-only')}</span><span>Connected via</span><span>REST API</span><span>Key</span><span>Owner or Admin</span><span>Reads</span><span class="mut">Workflow JSON and execution history (30 days on this Pro plan)</span><span>Does not</span><span class="mut">${esc(M.N8N_NOTE)}</span><span>Last sync</span><span>4 min ago</span></div></div>
<div class="card integ"><div style="display:flex;gap:12px;align-items:center"><span class="tdot tile sem">S</span><div><b>dbt or Atlan · Coming next</b></div></div></div>
<p class="mut">Connecting the semantic layer you already use is coming next.</p>
</div></div>`}

function docTitle(raw){
  const key=(raw||'home').split('/')[0]||'home'
  if(key==='home') return "Your people are building the same agents. They're getting different answers."
  const names={how:'How it works',pricing:'Pricing',about:'About',watch:'Use case',live:'Use case',start:'Setup',search:'Search',resolve:'Resolve',overview:'Overview',agents:'Agents',jobs:'Jobs & overlap',conflicts:'Inconsistencies',blocks:'Official answers',integrations:'Integrations'}
  return 'Concord · '+(names[key]||'Overview')
}
function renderPage(){
  if(location.hash==='#/live') history.replaceState(null,'','#/watch')
  const raw=location.hash.replace(/^#\/?/,''), h=raw.split('/')
  const marketing=!raw||raw==='home'||raw==='how'||raw==='pricing'||raw==='about'||raw==='watch'
  document.body.classList.toggle('lpbody',marketing)
  document.title=docTitle(raw)
  if(!raw||raw==='home'){S.route='home';$('#app').innerHTML=landingPage();mountLanding();return}
  if(raw==='how'){S.route='how';$('#app').innerHTML=howPage();return}
  if(raw==='pricing'){S.route='pricing';$('#app').innerHTML=pricingPage();return}
  if(raw==='about'){S.route='about';$('#app').innerHTML=aboutPage();return}
  if(h[0]==='demo-admin'){location.replace('#/start');return}
  if(h[0]==='start'){S.route='start';$('#app').innerHTML=onboardPage();mountOB();return}
  if(h[0]==='search'){S.route='search';S.q=decodeURIComponent(h.slice(1).join('/')||'');$('#app').innerHTML=shell(`<div class="page spage"><h1>Search</h1><p class="sub">Every agent doing a job, in Claude and n8n, with the definition and the answer already on record.</p>${searchBox(S.q)}</div>`);return}
  if(h[0]==='resolve'){S.route='resolve';$('#app').innerHTML=shell(`<div class="page">${resolveView(h[1]||'c1',false)}</div>`);return}
  S.route=NAV.some(n=>n[0]===h[0])?h[0]:'overview'
  S.conflict=S.route==='conflicts'?(h[1]||(innerWidth>=820?CONF.find(c=>M.isOpen(c,S))?.id||CONF[0].id:null)):S.conflict
  if(S.route==='watch'){$('#app').innerHTML=marketShell('watch',watchPage(!!S.resolved.c1));mountWatch({onExplore:exploreAfterWatch,already:()=>!!S.resolved.c1});return}
  const pg={overview,agents:agentsPg,jobs,conflicts,blocks,integrations:integ}[S.route]()
  $('#app').innerHTML=shell(pg)
}
function render(){
  try{renderPage()}
  finally{const app=document.getElementById('app');if(app)paintLead(app)}
}
window.addEventListener('hashchange',()=>{S.agent=null;closeLead();render();scrollTo(0,0)})
function toast(t){S.toast=t;render();clearTimeout(toast._t);toast._t=setTimeout(()=>{S.toast=null;const el=$('.toast');if(el)el.remove()},2600)}

function publish(id, opts){
  if(S.resolved[id]==='official') {
    if(opts.reason) S.reasons[id]=opts.reason
    return
  }
  S.resolved[id]='official'
  if(opts.pick!=null) S.wins[id]=opts.pick
  S.origin[id]=opts.origin||'agent'
  if(opts.edit) S.edits[id]=opts.edit
  if(opts.semanticTool) S.semanticTool[id]=opts.semanticTool
  if(opts.customAns) S.customAns[id]=opts.customAns
  if(opts.publishBack) S.publishBack[id]=true
  if(opts.reason) S.reasons[id]=opts.reason
  save()
}
function markVariant(id, agentIndex){
  const c=CONF.find(x=>x.id===id); if(!c||S.resolved[id]==='official') return
  S.variants[id]=S.variants[id]||[]
  if(agentIndex==null){S.variants[id]=c.cols.map(col=>col.a);S.resolved[id]='variant'}
  else if(!S.variants[id].includes(agentIndex)) S.variants[id].push(agentIndex)
  if(!M.isOpen(c,S)) S.resolved[id]='variant'
  save()
}
function verify(i){if(!S.verified.includes(i)) S.verified.push(i);save()}
function save(){try{localStorage.setItem(M.LS_KEY,JSON.stringify({v:2,OB,resolved:S.resolved,variants:S.variants,wins:S.wins,edits:S.edits,origin:S.origin,semanticTool:S.semanticTool,customAns:S.customAns,publishBack:S.publishBack,verified:S.verified,suggested:S.suggested,reasons:S.reasons,semanticConnected:!!S.semanticConnected}))}catch(e){}}
const DEMO_RESTART_PASSWORD='concord-demo'
function doRestart(){try{localStorage.removeItem(M.LS_KEY)}catch(e){}location.hash='#/demo-admin';location.reload()}
function reset(){if(document.getElementById('rstm'))return
  const w=document.createElement('div');w.id='rstm';w.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:9999'
  w.innerHTML='<form style="background:#fff;color:#111;padding:20px;border-radius:12px;width:320px;max-width:90vw;font:14px system-ui;box-shadow:0 10px 40px rgba(0,0,0,.3)"><b style="font-size:16px">Restart demo</b><p style="margin:6px 0 10px;color:#555">Enter the demo password to clear progress and start over.</p><input id="rstpw" type="password" autocomplete="off" placeholder="Password" style="width:100%;box-sizing:border-box;padding:8px;border:1px solid #ccc;border-radius:8px"><div id="rsterr" style="color:#c0262d;min-height:18px;margin-top:6px;font-size:13px"></div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px"><button type="button" id="rstx" class="btn">Cancel</button><button type="submit" class="btn p">Restart</button></div></form>'
  document.body.appendChild(w);const i=w.querySelector('#rstpw');i.focus()
  const close=()=>w.remove()
  w.querySelector('#rstx').onclick=close;w.onclick=e=>{if(e.target===w)close()}
  w.querySelector('form').onsubmit=e=>{e.preventDefault();e.stopPropagation();if(i.value.trim()===DEMO_RESTART_PASSWORD)doRestart();else{w.querySelector('#rsterr').textContent='Wrong password. Demo not reset.';i.select()}}
}
function load(){
  let d=null;try{d=JSON.parse(localStorage.getItem(M.LS_KEY)||'null')}catch(e){}
  if(!d||d.v!==2) return
  Object.assign(OB,d.OB||{})
  for(const k of ['resolved','variants','wins','edits','origin','semanticTool','customAns','publishBack','reasons']) if(d[k]) S[k]=d[k]
  S.verified=d.verified||[]; S.suggested=d.suggested||[]; S.semanticConnected=!!d.semanticConnected
}
function exploreAfterWatch(){
  if(S.resolved.c1){location.hash='#/overview';S.toast='Opened the workspace. The story did not overwrite your decision.';render();setTimeout(()=>{S.toast=null;const el=$('.toast');if(el)el.remove()},3200);return}
  S.resolved.c1='official'; S.wins.c1=3; S.origin.c1='agent'
  S.reasons.c1='Most complete signal, and it matches what we report to the board.'
  if(!S.suggested.includes('c1')) S.suggested.push('c1')
  for(const i of [0,1,2]) if(!M.isVariant('c1',i,S)&&!S.verified.includes(i)) S.verified.push(i)
  save(); location.hash='#/overview'
  S.toast='Customer health is 100. Dana, Maya, and Tom were verified by re-reading.'
  render(); setTimeout(()=>{S.toast=null;const el=$('.toast');if(el)el.remove()},3200)
}
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-f],[data-agent],[data-close],[data-variant],[data-scoreinfo],[data-semcon],#burger')
  if(!t) return
  if(t.id==='burger'){$('#side').classList.toggle('open');return}
  if(t.dataset.scoreinfo!=null){S.scoreOpen=!S.scoreOpen;render();return}
  if(t.dataset.semcon!=null){S.semanticConnected=true;save();toast('Semantic layer connected, read-only');return}
  if(t.dataset.f){S.filter=t.dataset.f;render();return}
  if(t.dataset.agent){S.agent=+t.dataset.agent;render();return}
  if('close'in t.dataset){S.agent=null;render();return}
  if(t.dataset.variant){
    const [id,who]=t.dataset.variant.split(':')
    markVariant(id, who==='job'?null:+who)
    toast(who==='job'?'Marked as a different job. Removed from the conflict count.':'Marked as a valid variant. It no longer counts toward this conflict.')
  }
})
bindLead(render)
initOB({S,ic,tool,dav,save,reset,render,publish,markVariant,verify,toast})
load()
render()
