// Guided "Watch it live" mode: an employee builds an agent in Claude (left), Concord's backend reacts (right).
const sv=p=>`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`
const IC={zap:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',file:'<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5"/>',
layers:'<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',alert:'<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
cube:'<path d="m12 2 9 5v10l-9 5-9-5V7z"/><path d="m3 7 9 5 9-5M12 12v10"/>',link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
check:'<path d="m5 12 5 5 9-10"/>',flow:'<rect x="3" y="4" width="6" height="6" rx="1.5"/><rect x="15" y="14" width="6" height="6" rx="1.5"/><path d="M9 7h4a2 2 0 0 1 2 2v5"/>',
play:'<path d="M7 4v16l13-8z" fill="currentColor"/>',pause:'<path d="M7 4h3v16H7zM14 4h3v16h-3z" fill="currentColor"/>',next:'<path d="M5 4v16l11-8z" fill="currentColor"/><path d="M19 4v16"/>',
back:'<path d="M19 4v16L8 12z" fill="currentColor"/><path d="M5 4v16"/>',redo:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',spark:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>'}
const ic=n=>sv(IC[n])
const tag=p=>`<span class="ptag"><i style="background:${p==='Claude'?'#b8643f':'#c23a55'}"></i>Built in ${p}</span>`
const av=(ini,c)=>`<span class="dav" style="background:${c}">${ini}</span>`
const AG={dana:{n:'Q4 at-risk accounts',b:'Dana Ortiz',ini:'DO',d:'Sales Ops',c:'#fb923c',p:'Claude',ans:35,rule:'no login 21d OR > 3 open tickets',src:'Q4_accounts_dana.xlsx'},
maya:{n:'Account health monitor',b:'Maya Cohen',ini:'MC',d:'CS',c:'#4cc3ff',p:'Claude',ans:42,rule:'tickets_30d > 5 OR CSAT < 3.5',src:'Gainsight export (Mar)'},
tom:{n:'CSM weekly risk digest',b:'Tom Rivera',ini:'TR',d:'CS',c:'#4cc3ff',p:'n8n',ans:17,rule:'usage drop > 40%, excl. < $10k',src:'usage_daily'},
priya:{n:'Renewal radar',b:'Priya Shah',ini:'PS',d:'Sales',c:'#f5a524',p:'Claude',ans:28,rule:'0.5·usage + 0.3·NPS + 0.2·tickets < 60',src:'Health v2 (warehouse)'}}
const Q='How many accounts are at risk this quarter?'
const STEPS=[
{label:'Builds an agent',title:'Dana builds an agent, in Claude, in plain words',body:'Dana runs Sales Ops. She wants a weekly list of at-risk accounts, so she opens a new Claude Project and describes it. No new tool, no IT ticket.',dwell:1600,
 beats:[{t:'type',id:'u1',side:'chat',text:'I want an agent that lists our Q4 at-risk accounts every Monday, so my team can plan outreach.',wait:350},
 {t:'reply',id:'a1',side:'chat',think:900,wait:700},{t:'ev',id:'detect',side:'be',wait:2200}]},
{label:'Her definition',title:'She pastes her own definition and her own spreadsheet',body:'Concord reads the new agent\'s instructions and sources, read-only. It never edits anything in Claude. Note the source: a personal spreadsheet.',dwell:1600,
 beats:[{t:'type',id:'u2',side:'chat',text:'At-risk = no login in 21 days OR more than 3 open tickets. Use my sheet.',attach:true,wait:300},
 {t:'reply',id:'a2',side:'chat',think:800,wait:600},{t:'ev',id:'instr',side:'be',wait:1300},{t:'ev',id:'src',side:'be',wait:2200}]},
{label:'Gets an answer',title:'The agent answers: 35 accounts',body:'Dana gets a confident number. Meanwhile Concord recognises the job: three colleagues already built agents for exactly this, in Claude and in n8n.',dwell:1500,
 beats:[{t:'type',id:'u3',side:'chat',text:Q,wait:300},{t:'reply',id:'a3',side:'chat',think:1200,wait:900},{t:'ev',id:'match',side:'be',wait:2600}]},
{label:'Conflict',title:'Same question, four different answers',body:'Concord asks every Customer health agent the same question. 35, 42, 17, 28. That is the conflict, caught before anyone puts the wrong number in front of a customer or the board.',dwell:2200,
 beats:[{t:'ev',id:'ask',side:'be',wait:800},{t:'ev',id:'c_dana',side:'be',wait:450},{t:'ev',id:'c_maya',side:'be',wait:450},{t:'ev',id:'c_tom',side:'be',wait:450},{t:'ev',id:'c_priya',side:'be',wait:900},{t:'ev',id:'flag',side:'be',wait:2000}]},
{label:'Owner decides',title:'The owner picks the official definition',body:'The conflict goes to the person who owns the definition, not to IT. Sara Klein, Head of CS Ops, compares the versions and makes one official.',dwell:1800,
 beats:[{t:'ev',id:'route',side:'be',wait:1500},{t:'ev',id:'pick',side:'be',wait:1300},{t:'ev',id:'picked',side:'be',wait:2000}]},
{label:'Published',title:'Published as a shared building block',body:'Customer health v2 becomes an official block that any agent can call over MCP. One definition, one owner, versioned.',dwell:1600,
 beats:[{t:'ev',id:'publish',side:'be',wait:2400}]},
{label:'Dana rewired',title:'Dana\'s agent is rewired and gives the consistent answer',body:'Her agent now calls the official definition. Re-asked the same question, it answers 28, like everyone else. Dana did not have to change anything.',dwell:1800,
 beats:[{t:'ev',id:'rewire',side:'be',wait:1000},{t:'ev',id:'notice',side:'chat',wait:500},{t:'type',id:'u4',side:'chat',text:'Same question again: how many are at risk this quarter?',wait:300},{t:'reply',id:'a4',side:'chat',think:1100,wait:1100},{t:'ev',id:'reask',side:'be',wait:2000}]},
{label:'n8n too',title:'Automations too: Tom\'s n8n workflow follows',body:'The same block plugs into automations. Tom\'s n8n workflow and Maya\'s Claude Project are rewired. Every Customer health agent now agrees.',dwell:2400,
 beats:[{t:'ev',id:'n8n',side:'be',wait:2000},{t:'ev',id:'n8nswap',side:'be',wait:1400},{t:'ev',id:'maya',side:'be',wait:1100},{t:'ev',id:'agree',side:'be',wait:2200}]},
]
const W={step:-1,beat:0,prog:0,thinking:false,playing:false,speed:1,side:'chat',manual:false,timer:null,pend:false}
let onExplore=()=>{},root=null
const N=STEPS.length
function vis(){const s=new Set();STEPS.forEach((st,i)=>{if(i<W.step)st.beats.forEach(b=>s.add(b.id));else if(i===W.step)st.beats.slice(0,W.beat).forEach(b=>s.add(b.id))});if(W.step>=N)STEPS.forEach(st=>st.beats.forEach(b=>s.add(b.id)));return s}
function cur(){const st=STEPS[W.step];return st&&W.beat<st.beats.length?st.beats[W.beat]:null}
const later=(f,ms)=>{clearTimeout(W.timer);W.timer=setTimeout(f,ms/W.speed)}
function tick(){if(!W.playing)return;if(!document.getElementById('wv')){pause();return}
 const st=STEPS[W.step];if(!st)return;if(W.beat>=st.beats.length){W.pend=true;later(()=>{W.pend=false;go(W.step+1)},st.dwell);return}
 const b=st.beats[W.beat]
 if(b.t==='type'){if(W.prog<b.text.length){W.prog=Math.min(b.text.length,W.prog+2);draw();later(tick,34)}else{W.beat++;W.prog=0;draw();later(tick,b.wait)}}
 else if(b.t==='reply'){if(!W.thinking){W.thinking=true;draw();later(tick,b.think)}else{W.thinking=false;W.beat++;draw();later(tick,b.wait)}}
 else{W.beat++;draw();later(tick,b.wait)}}
function go(i){clearTimeout(W.timer);W.pend=false;W.thinking=false;W.prog=0;W.manual=false
 if(i>=N){W.step=N;W.playing=false;draw();return} W.step=Math.max(0,i);W.beat=W.playing?0:STEPS[W.step].beats.length;draw();if(W.playing)later(tick,450)}
function play(){if(W.step>=N||W.step<0){W.playing=true;go(0);return}W.playing=true;draw();tick()}
function pause(){W.playing=false;clearTimeout(W.timer);W.thinking=false;draw()}
// ---------- chat (left) ----------
function chatItems(V){const it=[],c=cur(),A=(id,h)=>it.push({k:id,h})
 const um=(id,txt,extra='')=>A(id,`<div class="cm u"><div class="cb">${txt}${extra}</div>${av('DO','#fb923c')}</div>`)
 const am=(id,h)=>A(id,`<div class="cm a"><span class="cav">${ic('spark')}</span><div class="cb">${h}</div></div>`)
 A('hello',`<div class="chello"><b>Q4 at-risk accounts</b><span>New Project · Dana Ortiz · Sales Ops</span></div>`)
 if(V.has('u1'))um('u1',STEPS[0].beats[0].text)
 if(V.has('a1'))am('a1','Happy to set that up. How do you define an <b>at-risk</b> account, and where should I pull the data from?')
 if(V.has('u2'))um('u2',STEPS[1].beats[0].text,`<div class="att">${ic('file')}<div><b>Q4_accounts_dana.xlsx</b><span>Spreadsheet · 312 rows · uploaded just now</span></div></div>`)
 if(V.has('a2'))am('a2','Got it. I saved your definition to this Project\'s instructions and added <b>Q4_accounts_dana.xlsx</b> as its source. Ask me anything.')
 if(V.has('u3'))um('u3',Q)
 if(V.has('a3'))am('a3',`<div class="big">35 accounts</div>are at risk this quarter, using your rule (no login in 21 days or more than 3 open tickets).<div class="mini"><span>Brightline Foods</span><span>Altamira Health</span><span>Keeler Logistics</span><span class="dim">+32 more</span></div>`)
 if(V.has('notice'))A('notice',`<div class="cnote">${ic('link')}<span>Workspace update: this Project now uses Northwind's official <b>Customer health v2</b> definition.</span></div>`)
 if(V.has('u4'))um('u4',STEPS[6].beats[2].text)
 if(V.has('a4'))am('a4',`<div class="big ok">28 accounts</div>are at risk this quarter, using Northwind's official Customer health definition (usage, NPS and support tickets).<div class="mini"><span>Brightline Foods</span><span>Altamira Health</span><span>Orbit Freight</span><span class="dim">+25 more</span></div>`)
 if(c&&c.t==='reply'&&W.thinking)A('think',`<div class="cm a"><span class="cav">${ic('spark')}</span><div class="cb typing"><span></span><span></span><span></span></div></div>`)
 return it}
// ---------- backend (right) ----------
function adopt(V){return V.has('agree')||V.has('maya')?4:V.has('n8nswap')?3:V.has('rewire')?2:V.has('publish')?1:0}
function compare(V){const cols=[['dana','c_dana'],['maya','c_maya'],['tom','c_tom'],['priya','c_priya']].filter(c=>V.has(c[1]))
 const fixed=k=>k==='priya'?V.has('publish'):k==='dana'?V.has('rewire'):k==='tom'?V.has('n8nswap'):k==='maya'?V.has('maya'):false
 return `<div class="cmp">${cols.map(([k])=>{const a=AG[k],f=fixed(k);return `<div class="cc ${f?'ok':''} ${k==='dana'?'new':''}"><div class="cch">${av(a.ini,a.c)}<div><b>${a.b.split(' ')[0]}</b><span class="mtag"><i style="background:${a.p==='Claude'?'#b8643f':'#c23a55'}"></i>${a.p}</span></div></div><div class="ccn">${f?28:a.ans}</div><div class="ccr">${f?'official · Customer health v2':a.rule}</div></div>`}).join('')}</div>`}
function beItems(V){const it=[],A=(k,ico,tone,title,sub,card='')=>it.push({k,h:`<div class="ev ${tone}"><span class="evi">${ic(ico)}</span><div class="evb"><div class="evt">${title}</div>${sub?`<div class="evs">${sub}</div>`:''}${card}</div></div>`})
 A('watch','eye','mut','Watching 2 places, read-only','Claude via Compliance API · n8n via REST API · 47 agents in inventory')
 if(V.has('detect'))A('detect','zap','acc','New agent detected in Claude','',`<div class="bc row">${av('DO','#fb923c')}<div><b>Q4 at-risk accounts</b><span>Dana Ortiz · Sales Ops · created just now</span></div>${tag('Claude')}</div>`)
 if(V.has('instr'))A('instr','eye','','Read instructions','read-only · nothing changed in Claude',`<div class="bcode"><span class="k">at_risk</span> = last_login > 21 days<br/>&nbsp;&nbsp;OR open_tickets > 3</div>`)
 if(V.has('src'))A('src','file','warn','Read source: Q4_accounts_dana.xlsx','',`<span class="chip c-warn"><i></i>Personal spreadsheet · not a governed source</span>`)
 if(V.has('match'))A('match','layers','acc','Matched to job: Customer health','3 existing agents already do this job',`<div class="bc list">${['dana','maya','tom','priya'].map(k=>{const a=AG[k];return `<div class="li">${av(a.ini,a.c)}<div><b>${a.n}</b><span class="lis">${a.b} · ${a.d} ${tag(a.p)}</span></div>${k==='dana'?'<span class="chip c-acc">New</span>':''}</div>`}).join('')}</div>`)
 if(V.has('ask'))A('ask','zap','','Asked all 4 agents the same question',`"${Q}"`,V.has('c_dana')?compare(V):'')
 if(V.has('flag'))A('flag','alert','bad','Conflict flagged: Customer health, 4 definitions','',`<div class="flagrow"><span class="chip c-bad"><i></i>4 agents · 4 answers</span><span class="chip c-mut">$1.9M ARR in disputed accounts</span></div>`)
 if(V.has('route'))A('route','user','','Routed to the owner: Sara Klein','Head of CS Ops · owns Customer health · notified by email and in Concord',`<div class="bc row">${av('SK','#f59e0b')}<div><b>Sara Klein</b><span>"New conflict needs your call: Customer health"</span></div><span class="chip c-info"><i></i>Notified</span></div>`)
 if(V.has('pick'))A('pick','check','','Sara compares the versions','',`<div class="bc pick">${['priya','maya','tom','dana'].map(k=>{const a=AG[k],on=k==='priya'&&V.has('picked');return `<div class="po ${on?'on':''}"><span class="rad"></span><div><b>${a.rule}</b><span>${a.n} · ${a.b.split(' ')[0]} · ${a.ans}</span></div></div>`}).join('')}${V.has('picked')?`<div class="pnote">${ic('check')} <b>Made official by Sara Klein</b> · "Most complete signal, and it's what CS reports to the board."</div>`:''}</div>`)
 if(V.has('publish'))A('publish','cube','ok','Published official block: Customer health v2','MCP · owner Sara Klein · version 2',`<div class="bcode"><span class="k">concord.customer_health</span>(account)<br/>&nbsp;&nbsp;→ { score, at_risk }<br/><span class="c">// score = 0.5·usage + 0.3·NPS + 0.2·tickets; at_risk = score &lt; 60</span></div>`)
 if(V.has('rewire'))A('rewire','link','ok','Dana\'s agent rewired','"Q4 at-risk accounts" now calls concord.customer_health v2')
 if(V.has('reask'))A('reask','check','ok','Re-asked the same question: 28','Was 35 · now matches the official definition',`<span class="chip c-ok"><i></i>Consistent</span>`)
 if(V.has('n8n'))A('n8n','flow','','Tom\'s n8n workflow: "CSM weekly risk digest"','Runs every Monday · posts to #cs-risk',`<div class="flow">${['Every Monday','Fetch usage_daily',V.has('n8nswap')?'AI step → concord.customer_health v2':'AI step: usage drop > 40%','Post to #cs-risk'].map((s,i)=>`<div class="fn ${i===2?(V.has('n8nswap')?'ok':'hot'):''}">${s}</div>`).join('<span class="fa">→</span>')}</div>`)
 if(V.has('n8nswap'))A('n8nswap','link','ok','Tom\'s workflow rewired','The AI step now calls the official block. Nothing else in the workflow changed.')
 if(V.has('maya'))A('maya','link','ok','Maya\'s agent rewired','"Account health monitor" now calls concord.customer_health v2')
 if(V.has('agree'))A('agree','check','ok','All 4 agents agree: 28 at-risk accounts','Conflict resolved · consistency score 71 → 86',`<span class="chip c-ok"><i></i>Resolved</span>`)
 return it}
// ---------- rendering ----------
function sync(el,items){const ch=[...el.children];let i=0;while(i<ch.length&&i<items.length&&ch[i].dataset.k===items[i].k)i++
 ch.slice(i).forEach(c=>c.remove())
 items.forEach((it,j)=>{let n=el.children[j];if(n){if(n._h!==it.h){n.innerHTML=it.h;n._h=it.h;n.classList.remove('flash');void n.offsetWidth;n.classList.add('flash')}}else{n=document.createElement('div');n.dataset.k=it.k;n.className='wi';n.innerHTML=it.h;n._h=it.h;el.appendChild(n);el._new=true}})}
const setH=(el,h)=>{if(el&&el._h!==h){el.innerHTML=h;el._h=h}}
function draw(){root=document.getElementById('wv');if(!root)return;const V=vis(),c=cur(),st=STEPS[W.step]
 if(!W.manual){const last=c||(st&&st.beats[st.beats.length-1]);if(last)W.side=last.side}
 root.dataset.side=W.side;root.dataset.state=W.step<0?'intro':W.step>=N?'done':'run'
 setH(root.querySelector('.wv-steps'),STEPS.map((s,i)=>`<button class="ws-i ${i<W.step?'done':i===W.step?'on':''}" data-wgo="${i}" title="${s.label}"><span class="wn">${i<W.step||W.step>=N?'✓':i+1}</span><span class="wl">${s.label}</span></button>`).join(''))
 const pct=W.step<0?0:W.step>=N?100:((W.step+(st?W.beat/st.beats.length:0))/N*100)
 root.querySelector('.wv-prog span').style.width=pct+'%'
 setH(root.querySelector('.wv-cap'),W.step<0?`<div class="wk">Guided demo · about 60 seconds</div><div class="wt">Watch an employee build an agent, and see what Concord sees</div><div class="wb">Press play. On the left, Dana builds an agent in Claude. On the right, Concord's backend reacts in real time.</div>`:W.step>=N?`<div class="wk">Done</div><div class="wt">Four agents, one answer</div><div class="wb">Concord found agents built by different people, in Claude and in n8n, doing the same job differently, and brought them onto one official definition.</div>`:`<div class="wk">Step ${W.step+1} of ${N} · ${st.label}</div><div class="wt">${st.title}</div><div class="wb">${st.body}</div>`)
 setH(root.querySelector('.wv-btns'),`<button class="wc" data-w="back" ${W.step<=0?'disabled':''} title="Previous step">${ic('back')}</button><button class="wc main" data-w="toggle" title="${W.playing?'Pause':'Play'}">${W.playing?ic('pause'):ic('play')}<span>${W.playing?'Pause':W.step<0?'Start':W.step>=N?'Replay':'Play'}</span></button><button class="wc" data-w="next" ${W.step>=N?'disabled':''} title="Next step">${ic('next')}</button><button class="wc" data-w="restart" title="Restart">${ic('redo')}</button><button class="wc spd" data-w="speed" title="Playback speed">${W.speed}×</button>`)
 // tabs
 const lastC=[...V].length;setH(root.querySelector('.wv-tabs'),`<button data-wside="chat" class="${W.side==='chat'?'on':''}">Dana's chat${c&&c.side==='chat'&&W.side!=='chat'?'<i></i>':''}</button><button data-wside="be" class="${W.side==='be'?'on':''}">Concord backend${c&&c.side==='be'&&W.side!=='be'?'<i></i>':''}</button>`)
 const ch=root.querySelector('.cmsgs'),be=root.querySelector('.elog');sync(ch,chatItems(V));sync(be,beItems(V))
 const comp=root.querySelector('.ccomp-t');const typing=c&&c.t==='type';comp.innerHTML=typing?c.text.slice(0,W.prog).replace(/</g,'&lt;')+'<span class="caret"></span>':'<span class="ph">Reply to Claude…</span>'
 root.querySelector('.ccomp').classList.toggle('active',!!typing);root.querySelector('.ccomp .attp').style.display=typing&&c.attach&&W.prog>c.text.length*0.6?'flex':'none'
 for(const el of [ch,be]){if(el._new||typing){el.scrollTo({top:el.scrollHeight,behavior:W.playing?'smooth':'auto'});el._new=false}}
 const n=adopt(V);root.querySelector('.am-bar span').style.width=n/4*100+'%';setH(root.querySelector('.am-t'),V.has('publish')?`<b>Customer health v2</b> adoption <b>${n}/4</b>`:V.has('flag')?'<b>Customer health</b> · no official definition yet':'<b>Customer health</b> · '+(V.has('match')?'4 agents':'3 agents'))
 setH(root.querySelector('.am-s'),`Consistency <b class="${n?'up':''}">${71+[0,4,8,12,15][n]}</b>`)
 const ov=root.querySelector('.wv-over');setH(ov,W.step<0?intro():W.step>=N?wrap():'')}
function intro(){return `<div class="wcard"><div class="wbadge">${ic('play')} Watch it live</div><h2>Watch an employee build an agent, and see what Concord sees</h2><p>Dana in Sales Ops builds a "Q4 at-risk accounts" agent in Claude. Three colleagues already built agents for the same job. Watch Concord catch the conflict and fix it, live.</p><div class="wsteps2"><span>${ic('spark')} Left: Dana's chat in Claude</span><span>${ic('eye')} Right: Concord's backend</span></div><button class="btn p big" data-w="toggle">${ic('play')} Start · about 60s</button><div class="dim" style="margin-top:10px;font-size:12px">Pause, step back or skip anytime.</div></div>`}
function wrap(){return `<div class="wcard wrapc"><div class="wbadge ok">${ic('check')} Conflict resolved</div><h2>Every agent now agrees</h2><div class="ba"><div class="b4"><div class="bal">Before</div><div class="bav">4 agents<br/>4 answers</div><div class="bas">35 · 42 · 17 · 28 at-risk accounts</div></div><div class="barr">→</div><div class="b4 after"><div class="bal">After</div><div class="bav">1 official definition</div><div class="bas">Every agent says 28 · score 71 → 86</div></div></div><p>Dana never left Claude. Tom never opened his n8n workflow. Sara made one decision.</p><div class="wacts"><button class="btn p big" data-w="explore">Explore the full app →</button><button class="btn big" data-w="restart">${ic('redo')} Watch again</button></div></div>`}
export function watchPage(){return `<div class="page wpage"><div id="wv" class="wv" data-side="chat">
<div class="wv-head"><div><h1>Watch it live</h1><p class="sub" style="margin:0">How people build agents at Northwind, and what Concord sees behind the scenes.</p></div><span class="chip c-acc wlive"><i></i>Live simulation · demo data</span></div>
<div class="wv-steps"></div><div class="wv-prog"><span></span></div>
<div class="wv-narr"><div class="wv-cap"></div><div class="wv-btns"></div></div>
<div class="wv-tabs"></div>
<div class="wv-split"><section class="card wchat"><div class="hd"><span class="cav">${ic('spark')}</span><h3>Q4 at-risk accounts</h3>${tag('Claude')}<span class="r">${av('DO','#fb923c')}</span></div><div class="cmsgs"></div><div class="ccomp"><div class="attp">${ic('file')} Q4_accounts_dana.xlsx</div><div class="ccomp-t"></div><button class="csend" tabindex="-1">↑</button></div></section>
<section class="card wbe"><div class="hd"><span class="logo" style="width:20px;height:20px;font-size:10px">C</span><h3>Concord, behind the scenes</h3><span class="r am-s"></span></div><div class="am"><div class="am-t"></div><div class="am-bar"><span></span></div></div><div class="elog"></div></section>
<div class="wv-over"></div></div></div></div>`}
export function mountWatch(cb){onExplore=cb;requestAnimationFrame(()=>{draw();if(W.playing)tick()})}
export function startWatch(){W.playing=true;go(0)}
document.addEventListener('click',e=>{const t=e.target.closest('[data-w],[data-wgo],[data-wside]');if(!t||!document.getElementById('wv'))return
 if(t.dataset.wside){W.side=t.dataset.wside;W.manual=true;draw();document.querySelectorAll('.cmsgs,.elog').forEach(el=>el.scrollTop=el.scrollHeight);return}
 if(t.dataset.wgo!=null){go(+t.dataset.wgo);return}
 const a=t.dataset.w
 if(a==='toggle')W.playing?pause():play();else if(a==='next'){go(W.step+1)}else if(a==='back'){go(W.step-1)}else if(a==='restart'){W.playing=true;go(0)}
 else if(a==='speed'){const sp=[1,1.5,2,0.75];W.speed=sp[(sp.indexOf(W.speed)+1)%sp.length];draw()}else if(a==='explore'){onExplore()}})
document.addEventListener('keydown',e=>{if(!document.getElementById('wv')||e.target.tagName==='INPUT')return;if(e.key===' '){e.preventDefault();W.playing?pause():play()}else if(e.key==='ArrowRight')go(W.step+1);else if(e.key==='ArrowLeft')go(W.step-1)})
export const watchState=W
