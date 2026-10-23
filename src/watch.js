// Guided "Watch it live". Scripted story, same numbers as the shared model.
// Concord reads history, Sara publishes, Dana is offered the block while she builds,
// and Tom applies the suggestion himself. Nothing here runs or edits an agent.
import * as M from './model.js'
import {status, mark, Brand} from './brand.js'
const sv=p=>`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`
const IC={zap:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',file:'<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5"/>',
layers:'<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',alert:'<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
cube:'<path d="m12 2 9 5v10l-9 5-9-5V7z"/><path d="m3 7 9 5 9-5M12 12v10"/>',link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
check:'<path d="m5 12 5 5 9-10"/>',flow:'<rect x="3" y="4" width="6" height="6" rx="1.5"/><rect x="15" y="14" width="6" height="6" rx="1.5"/><path d="M9 7h4a2 2 0 0 1 2 2v5"/>',
play:'<path d="M7 4v16l13-8z" fill="currentColor"/>',pause:'<path d="M7 4h3v16H7zM14 4h3v16h-3z" fill="currentColor"/>',next:'<path d="M5 4v16l11-8z" fill="currentColor"/><path d="M19 4v16"/>',
back:'<path d="M19 4v16L8 12z" fill="currentColor"/><path d="M5 4v16"/>',redo:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',spark:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>'}
const ic=n=>sv(IC[n])
const tag=p=>`<span class="ptag"><i style="background:${p==='Claude'?'#82B9D9':'#58A2CD'}"></i>Built in ${p}</span>`
const av=(ini,c)=>`<span class="dav" style="background:${c};color:var(--on-sync)">${ini}</span>`
const AG={
  dana:{k:'dana',i:0,n:'Q4 at-risk accounts',b:'Dana',ini:'DO',d:'Sales Ops',c:'#EAF3F9',p:'Claude',ans:35,rule:'no login 21d OR > 3 open tickets'},
  maya:{k:'maya',i:1,n:'Account health monitor',b:'Maya',ini:'MC',d:'CS',c:'#82B9D9',p:'Claude',ans:42,rule:'tickets > 5 OR CSAT < 3.5'},
  tom:{k:'tom',i:2,n:'CSM weekly risk digest',b:'Tom',ini:'TR',d:'CS',c:'#82B9D9',p:'n8n',ans:17,rule:'usage drop > 40%, excl. under $10k'},
  priya:{k:'priya',i:3,n:'Renewal radar',b:'Priya',ini:'PS',d:'Sales',c:'#58A2CD',p:'Claude',ans:28,rule:'0.5·usage + 0.3·NPS + 0.2·tickets < 60'},
}
const ORDER=['dana','maya','tom','priya']
const Q='How many accounts are at risk this quarter?'
const STEPS=[
{label:'On record',left:'history',title:'The answers are already on record',body:'Concord is reading Claude through the Compliance API and n8n through its REST API. It does not ask anyone a question, and it does not run an agent.',dwell:1700,
 beats:[{t:'ev',id:'watch',side:'be',wait:900},{t:'ev',id:'blind',side:'be',wait:1100},{t:'ev',id:'hist',side:'chat',wait:1400}]},
{label:'35 · 42 · 17 · 28',left:'history',title:'Last week they told people four different numbers',body:'Dana’s chat said 35. Maya’s said 42. Tom’s Monday run said 17, and that run posted to #cs-risk. Priya’s said 28. Concord only read the logs.',dwell:2100,
 beats:[{t:'ev',id:'c_dana',side:'be',wait:520},{t:'ev',id:'c_maya',side:'be',wait:520},{t:'ev',id:'c_tom',side:'be',wait:700},{t:'ev',id:'c_priya',side:'be',wait:800},{t:'ev',id:'slack',side:'be',wait:1300}]},
{label:'Definitions',left:'history',title:'The disagreement is in the definitions',body:'Pulled from project instructions, a knowledge file, and workflow JSON. Dana’s source is a personal spreadsheet. This is not a test run.',dwell:1700,
 beats:[{t:'ev',id:'defs',side:'be',wait:1100},{t:'ev',id:'sheet',side:'be',wait:1200}]},
{label:'Conflict',left:'history',title:'Same job, four definitions',body:'Customer health is flagged for Sara Klein, Head of RevOps. The conflict goes to the person who owns the number, not to IT.',dwell:1700,
 beats:[{t:'ev',id:'flag',side:'be',wait:900},{t:'ev',id:'route',side:'be',wait:1400}]},
{label:'Sara decides',left:'history',title:'Sara publishes one official definition',body:'She picks Priya’s warehouse score. She could have written her own, or imported it from dbt, Atlan, or Qontext. Publishing does not edit Claude or n8n.',dwell:1900,
 beats:[{t:'ev',id:'pick',side:'be',wait:1000},{t:'ev',id:'picked',side:'be',wait:1100},{t:'ev',id:'publish',side:'be',wait:1000},{t:'ev',id:'sent',side:'be',wait:1200}]},
{label:'Dana builds',left:'build',title:'The official definition shows up before the spreadsheet',body:'Concord is an org-wide MCP connector. Dana starts to rebuild her agent. Claude offers Customer health v2 before she pastes the sheet.',dwell:1600,
 beats:[{t:'type',id:'u5',side:'chat',text:'I want to rebuild the at-risk list off my spreadsheet.',wait:350},
  {t:'reply',id:'a5',side:'chat',think:1100,wait:700},
  {t:'type',id:'u6',side:'chat',text:'Use the official definition.',wait:300},
  {t:'reply',id:'a6',side:'chat',think:1000,wait:900}]},
{label:'Re-read',left:'build',title:'Concord re-reads her project and verifies',body:'Her instructions now call the block, because she accepted it. That is day 1. Maya and Tom still have the suggestion.',dwell:1500,
 beats:[{t:'ev',id:'vdana',side:'be',wait:1100},{t:'ev',id:'waiting',side:'be',wait:1100}]},
{label:'Tom applies',left:'n8n',title:'Tom changes his own workflow',body:'Concord cannot edit n8n. Tom opens the workflow and applies the suggestion. The AI step calls the block. The Slack post is untouched. Maya did the same on day 3. Concord re-reads the workflow JSON.',dwell:2200,
 beats:[{t:'ev',id:'tomui',side:'chat',wait:800},{t:'ev',id:'vmaya',side:'be',wait:1000},{t:'ev',id:'tomapply',side:'chat',wait:1100},{t:'ev',id:'vtom',side:'be',wait:900},{t:'ev',id:'agree',side:'be',wait:1400}]},
]
const W={step:-1,beat:0,prog:0,thinking:false,playing:false,speed:1,side:'chat',manual:false,timer:null}
let onExplore=()=>{}, already=()=>false, root=null
const N=STEPS.length
function vis(){const s=new Set();STEPS.forEach((st,i)=>{if(i<W.step)st.beats.forEach(b=>s.add(b.id));else if(i===W.step)st.beats.slice(0,W.beat).forEach(b=>s.add(b.id))});if(W.step>=N)STEPS.forEach(st=>st.beats.forEach(b=>s.add(b.id)));return s}
function cur(){const st=STEPS[W.step];return st&&W.beat<st.beats.length?st.beats[W.beat]:null}
const later=(f,ms)=>{clearTimeout(W.timer);W.timer=setTimeout(f,ms/W.speed)}
function tick(){if(!W.playing)return;if(!document.getElementById('wv')){pause();return}
 const st=STEPS[W.step];if(!st)return
 if(W.beat>=st.beats.length){later(()=>go(W.step+1),st.dwell);return}
 const b=st.beats[W.beat]
 if(b.t==='type'){if(W.prog<b.text.length){W.prog=Math.min(b.text.length,W.prog+2);draw();later(tick,34)}else{W.beat++;W.prog=0;draw();later(tick,b.wait)}}
 else if(b.t==='reply'){if(!W.thinking){W.thinking=true;draw();later(tick,b.think)}else{W.thinking=false;W.beat++;draw();later(tick,b.wait)}}
 else{W.beat++;draw();later(tick,b.wait)}}
function go(i){clearTimeout(W.timer);W.thinking=false;W.prog=0;W.manual=false
 if(i>=N){W.step=N;W.playing=false;draw();return}
 W.step=Math.max(0,i);W.beat=W.playing?0:STEPS[W.step].beats.length;draw();if(W.playing)later(tick,450)}
function play(){if(W.step>=N||W.step<0){W.playing=true;go(0);return}W.playing=true;draw();tick()}
function pause(){W.playing=false;clearTimeout(W.timer);W.thinking=false;draw()}
function leftMode(){if(W.step<0)return 'history';if(W.step>=N)return 'n8n';return STEPS[W.step].left}
function counts(V){return V.has('vtom')||V.has('agree')?3:V.has('vmaya')?2:V.has('vdana')?1:0}
function scores(n){const s=M.storyState(n);return {company:M.companyParts(s).score, job:M.jobScore('Customer health',s)}}

function chatItems(V){
  const it=[],c=cur(),mode=leftMode(),A=(id,h)=>it.push({k:id,h})
  const um=(id,txt)=>A(id,`<div class="cm u"><div class="cb">${txt}</div>${av('DO','#EAF3F9')}</div>`)
  const am=(id,h)=>A(id,`<div class="cm a"><span class="cav">${ic('spark')}</span><div class="cb">${h}</div></div>`)
  if(mode==='n8n'){
    const applied=V.has('tomapply')||V.has('vtom')||V.has('agree')
    A('n8nhead',`<div class="chello"><b>CSM weekly risk digest</b><span>Tom Rivera · n8n · he is applying a suggestion</span></div>`)
    A('suggest',`<div class="cnote">${ic('link')}<span>Suggested change from Sara Klein · Customer health v2. Tom applies it. Concord cannot edit this workflow.</span></div>`)
    A('flow',`<div class="flow">${['Every Monday','Fetch usage_daily',applied?'AI step → concord.customer_health v2':'AI step: usage drop > 40%','Post to #cs-risk'].map((s,i)=>`<div class="fn ${i===2?(applied?'ok':'hot'):''}">${s}</div>`).join('<span class="fa">→</span>')}</div>`)
    if(applied) A('applied',`<div class="cnote">${ic('check')}<span>Tom clicked Apply. The AI step now calls the block. The Slack post is untouched. Concord will re-read the workflow JSON.</span></div>`)
    return it
  }
  if(mode==='build'){
    A('hello',`<div class="chello"><b>Q4 at-risk accounts</b><span>Dana is editing the project · Claude · Concord MCP is connected</span></div>`)
    if(V.has('u5')) um('u5',STEPS[5].beats[0].text)
    if(V.has('a5')) am('a5',`Northwind already has an official <b>Customer health v2</b> definition, owned by Sara Klein, Head of RevOps. Use that instead of a personal spreadsheet?<div class="mini"><span>score &lt; 60</span><span>usage + NPS + tickets</span><span>recorded answer 28</span></div>`)
    if(V.has('u6')) um('u6',STEPS[5].beats[2].text)
    if(V.has('a6')) am('a6',`<div class="big ok">Added to this project’s instructions</div>I did not run a new count. The answer on record for that definition is <b>28</b>. Concord can re-read these instructions to verify.`)
    if(c&&c.t==='reply'&&W.thinking) A('think',`<div class="cm a"><span class="cav">${ic('spark')}</span><div class="cb typing"><span></span><span></span><span></span></div></div>`)
    return it
  }
  A('hello',`<div class="chello"><b>Q4 at-risk accounts · chat history</b><span>Read through the Compliance API · not a live message</span></div>`)
  if(V.has('hist')){
    um('hu',Q)
    am('ha',`<div class="big">35 accounts</div>are at risk this quarter, using Dana’s spreadsheet rule. <span class="dim">Recorded Thursday. Concord did not send this.</span>`)
  }
  return it
}
function compare(V){
  const cols=ORDER.filter(k=>V.has('c_'+k))
  const fixed=k=>k==='priya'?V.has('publish'):k==='dana'?V.has('vdana'):k==='maya'?V.has('vmaya'):k==='tom'?V.has('vtom'):false
  return `<div class="cmp">${cols.map(k=>{const a=AG[k],f=fixed(k);return `<div class="cc ${f?'ok':''}"><div class="cch">${av(a.ini,a.c)}<div><b>${a.b}</b><span class="mtag"><i style="background:${a.p==='Claude'?'#82B9D9':'#58A2CD'}"></i>${a.p}</span></div></div><div class="ccn">${f?28:a.ans}</div><div class="ccr">${f?'official · Customer health v2':a.rule}</div></div>`}).join('')}</div>`
}
function beItems(V){
  const it=[],A=(k,ico,tone,title,sub,card='')=>it.push({k,h:`<div class="ev ${tone}"><span class="evi">${ic(ico)}</span><div class="evb"><div class="evt">${title}</div>${sub?`<div class="evs">${sub}</div>`:''}${card}</div></div>`})
  const n=counts(V), sc=scores(n)
  A('watch','eye','mut','Watching 2 places, read-only',`Compliance API · n8n REST API · ${M.AGENTS.length} agents · company score ${M.INITIAL.score}`)
  if(V.has('blind')) A('blind','alert','warn','Blind spot',M.BLIND)
  if(V.has('hist')) A('hist','file','acc','Read Dana’s chat history','Compliance API · Thursday · “35 accounts”. Concord did not send the message.',`<div class="bcode"><span class="k">at_risk</span> = no login in 21 days<br/>&nbsp;&nbsp;OR open_tickets &gt; 3<br/><span class="c">// knowledge file: Q4_accounts_dana.xlsx</span></div>`)
  if(V.has('c_dana')) A('nums','layers','','Answers already on record',`“${Q}” · from chats and one n8n execution`,compare(V))
  if(V.has('slack')) A('slack','alert','warn','Tom’s run posted to #cs-risk','That already happened on Monday. Concord never triggers the webhook. n8n has no execute endpoint Concord will call.')
  if(V.has('defs')) A('defs','eye','','Definitions, side by side','Instructions, a knowledge file, and workflow JSON.',`<div class="bc list">${ORDER.map(k=>{const a=AG[k];return `<div class="li">${av(a.ini,a.c)}<div><b>${a.rule}</b><span class="lis">${a.n} · ${a.b} ${tag(a.p)}</span></div></div>`}).join('')}</div>`)
  if(V.has('sheet')) A('sheet','file','warn','Dana’s source is a personal spreadsheet','Q4_accounts_dana.xlsx · not a governed source')
  if(V.has('flag')) A('flag','alert','bad','Conflict: Customer health, 4 definitions','35 · 42 · 17 · 28. Same job. Not a test run.',`<div class="flagrow">${status('conflict','Conflict')}<span class="tag">$1.9M ARR in disputed accounts</span></div>`)
  if(V.has('route')) A('route','user','','Routed to Sara Klein','Head of RevOps · owns Customer health',`<div class="bc row">${av('SK','#ABD1E6')}<div><b>Sara Klein</b><span>Head of RevOps · “Customer health needs your call.”</span></div>${status('review','Needs sign-off')}</div>`)
  if(V.has('pick')) A('pick','check','','Sara compares the versions','She can also write her own, or import the certified metric.',`<div class="bc pick">${['priya','maya','tom','dana'].map(k=>{const a=AG[k],on=k==='priya'&&V.has('picked');return `<div class="po ${on?'on':''}"><span class="rad"></span><div><b>${a.rule}</b><span>${a.n} · ${a.b} · ${a.ans}</span></div></div>`}).join('')}${V.has('picked')?`<div class="pnote">${ic('check')} <b>Made official by Sara Klein</b> · “Most complete signal, and it matches what we report to the board.”</div>`:''}</div>`)
  if(V.has('publish')) A('publish','cube','ok','Published Customer health v2','MCP · owner Sara Klein · nothing in Claude or n8n was edited',`<div class="bcode"><span class="k">concord.customer_health</span>()<br/>&nbsp;&nbsp;→ { score, at_risk } · recorded answer 28<br/><span class="c">// at_risk = score &lt; 60 · usage, NPS, tickets</span></div>`)
  if(V.has('sent')) A('sent','link','','Suggested changes sent · 0/3','Slack and email to Dana, Maya, and Tom. Priya already matches. They apply the change. Concord does not.')
  if(V.has('vdana')) A('vdana','check','ok','Day 1 · Dana verified · 1/3','She accepted the block while building. Concord re-read her project instructions.')
  if(V.has('waiting')) A('waiting','user','','Maya and Tom still have the suggestion','Adoption is a timeline, not a switch. Company score is '+sc.company+'. It moves only when a builder applies the change.')
  if(V.has('vmaya')) A('vmaya','check','ok','Day 3 · Maya verified · 2/3','Maya applied the suggestion in Claude. Concord re-read the project instructions.')
  if(V.has('vtom')) A('vtom','check','ok','Day 6 · Tom verified · 3/3','Tom applied it in n8n. Concord re-read the workflow JSON. The Slack step is unchanged.')
  if(V.has('agree')) A('agree','check','ok','Customer health is 100','All four definitions now point at the block. The number on record is 28.',`<div class="flagrow">${status('sync','In sync')}<span class="tag">35 · 42 · 17 · 28 → 28</span><span class="tag">Company ${M.INITIAL.score} → ${sc.company}</span></div>`)
  return it
}
function sync(el,items){const ch=[...el.children];let i=0;while(i<ch.length&&i<items.length&&ch[i].dataset.k===items[i].k)i++
 ch.slice(i).forEach(c=>c.remove());items.forEach((it,j)=>{let n=el.children[j];if(n){if(n._h!==it.h){n.innerHTML=it.h;n._h=it.h}}else{n=document.createElement('div');n.dataset.k=it.k;n.className='wi';n.innerHTML=it.h;n._h=it.h;el.appendChild(n);el._new=true}})}
const setH=(el,h)=>{if(el&&el._h!==h){el.innerHTML=h;el._h=h}}
function draw(){
  root=document.getElementById('wv');if(!root)return
  const V=vis(),c=cur(),st=STEPS[W.step],mode=leftMode()
  if(!W.manual){const last=c||(st&&st.beats[st.beats.length-1]);if(last)W.side=last.side}
  root.dataset.side=W.side;root.dataset.left=mode;root.dataset.state=W.step<0?'intro':W.step>=N?'done':'run'
  setH(root.querySelector('.wv-steps'),STEPS.map((s,i)=>`<button class="ws-i ${i<W.step?'done':i===W.step?'on':''}" data-wgo="${i}" title="${s.label}"><span class="wn">${i<W.step||W.step>=N?'✓':i+1}</span><span class="wl">${s.label}</span></button>`).join(''))
  const pct=W.step<0?0:W.step>=N?100:((W.step+(st?W.beat/st.beats.length:0))/N*100)
  root.querySelector('.wv-prog span').style.width=pct+'%'
  setH(root.querySelector('.wv-cap'),W.step<0?`<div class="wk">Guided demo · about a minute</div><div class="wt">Watch an employee build an agent, and see what Concord sees</div><div class="wb">On the left, Dana’s Claude project. On the right, Concord reading. No agent is run.</div>`:W.step>=N?`<div class="wk">Done</div><div class="wt">One definition. The number is 28.</div><div class="wb">Sara published it. Dana took it while she was building. Maya and Tom applied it themselves. Concord re-read them.</div>`:`<div class="wk">Step ${W.step+1} of ${N} · ${st.label}</div><div class="wt">${st.title}</div><div class="wb">${st.body}</div>`)
  setH(root.querySelector('.wv-btns'),`<button class="wc" data-w="back" ${W.step<=0?'disabled':''} title="Previous step">${ic('back')}</button><button class="wc main" data-w="toggle" title="${W.playing?'Pause':'Play'}">${W.playing?ic('pause'):ic('play')}<span>${W.playing?'Pause':W.step<0?'Start':W.step>=N?'Replay':'Play'}</span></button><button class="wc" data-w="next" ${W.step>=N?'disabled':''} title="Next step">${ic('next')}</button><button class="wc" data-w="restart" title="Restart">${ic('redo')}</button><button class="wc spd" data-w="speed" title="Playback speed">${W.speed}×</button>`)
  setH(root.querySelector('.wv-tabs'),`<button data-wside="chat" class="${W.side==='chat'?'on':''}">${mode==='n8n'?'Tom in n8n':mode==='build'?'Dana building':'Chat history'}${c&&c.side==='chat'&&W.side!=='chat'?'<i></i>':''}</button><button data-wside="be" class="${W.side==='be'?'on':''}">Concord${c&&c.side==='be'&&W.side!=='be'?'<i></i>':''}</button>`)
  const titles={history:[ic('file'),'Chat history · read-only',tag('Claude')],build:[ic('spark'),'Q4 at-risk accounts',tag('Claude')],n8n:[ic('flow'),'Tom’s workflow',tag('n8n')]}
  const hd=titles[mode]
  setH(root.querySelector('.wleft-hd'),`<span class="cav">${hd[0]}</span><h3>${hd[1]}</h3>${hd[2]}<span class="r">${mode==='n8n'?av('TR','#82B9D9'):av('DO','#EAF3F9')}</span>`)
  const ch=root.querySelector('.cmsgs'),be=root.querySelector('.elog')
  sync(ch,chatItems(V));sync(be,beItems(V))
  const comp=root.querySelector('.ccomp-t'),typing=mode==='build'&&c&&c.t==='type'
  comp.innerHTML=typing?c.text.slice(0,W.prog).replace(/</g,'&lt;')+'<span class="caret"></span>':mode==='build'?'<span class="ph">Message Claude…</span>':mode==='n8n'?'<span class="ph">Tom edits this. Concord cannot.</span>':'<span class="ph">Read-only · Concord is not sending this</span>'
  root.querySelector('.ccomp').classList.toggle('active',!!typing)
  for(const el of [ch,be]){if(el._new||typing){el.scrollTo({top:el.scrollHeight,behavior:W.playing?'smooth':'auto'});el._new=false}}
  const n=counts(V),sc=scores(W.step>=4||V.has('publish')||V.has('sent')?n:-1)
  root.querySelector('.am-bar span').style.width=(V.has('sent')||n?n/3*100:0)+'%'
  setH(root.querySelector('.am-t'),V.has('agree')?`<b>Customer health is ${sc.job}</b>`:V.has('sent')||n?`<b>Suggestions ${n}/3</b> verified`:`<b>Customer health</b> · ${V.has('c_priya')?'4 answers on record':M.AGENTS.length+' agents'}`)
  setH(root.querySelector('.am-s'),`Company <b class="${sc.company>M.INITIAL.score?'up':''}">${sc.company}</b>`)
  setH(root.querySelector('.wv-over'),W.step<0?intro():W.step>=N?wrap(sc):'')
}
function intro(){return `<div class="wcard"><div class="wbadge">${ic('play')} Watch it live</div><h2>Watch an employee build an agent, and see what Concord sees</h2><p>Four agents already answered 35, 42, 17, and 28. Sara makes one definition official. Dana is offered it before she pastes her spreadsheet. Tom applies the change himself.</p><div class="wsteps2"><span>${ic('spark')} Left: Claude, then Tom’s n8n</span><span>${ic('eye')} Right: Concord, read-only</span></div><button class="btn p big" data-w="toggle">${ic('play')} Start · about a minute</button><div class="dim" style="margin-top:10px;font-size:12px">Pause, step back, or skip anytime.</div></div>`}
function wrap(sc){return `<div class="wcard wrapc"><div class="wbadge ok">${ic('check')} Customer health is 100</div><h2>The number on record is 28</h2><div class="ba"><div class="b4"><div class="bal">On record</div><div class="bav">4 answers</div><div class="bas">35 · 42 · 17 · 28</div></div><div class="barr">→</div><div class="b4 after"><div class="bal">After</div><div class="bav">This job is 100</div><div class="bas">Every agent says 28 · company ${M.INITIAL.score} → ${sc.company}</div></div></div><p>Dana took the official definition while she was building. Maya and Tom applied the suggested change. Concord re-read their instructions and Tom’s workflow. It never ran an agent, and it never edited one.</p><div class="wacts"><button class="btn p big" data-w="explore">Explore the full app →</button><button class="btn big" data-w="restart">${ic('redo')} Watch again</button></div></div>`}
export function watchPage(alreadyDecided){
  return `<div class="page wpage"><div id="wv" class="wv" data-side="chat" data-left="history">
<div class="wv-head"><div><h1>Watch it live</h1><p class="sub" style="margin:0">How a conflict gets caught, decided, and prevented the next time someone builds.</p></div><span class="tag">Guided story · demo data</span></div>
${alreadyDecided?'<div class="wbanner">Customer health is already decided in this workspace. This story will not overwrite that decision.</div>':''}
<div class="wv-steps"></div><div class="wv-prog"><span></span></div>
<div class="wv-narr"><div class="wv-cap"></div><div class="wv-btns"></div></div>
<div class="wv-tabs"></div>
<div class="wv-split"><section class="card wchat"><div class="hd wleft-hd"></div><div class="cmsgs"></div><div class="ccomp"><div class="ccomp-t"></div><button class="csend" tabindex="-1">↑</button></div></section>
<section class="card wbe"><div class="hd">${mark(16)}<h3>${Brand}, behind the scenes</h3><span class="r am-s"></span></div><div class="am"><div class="am-t"></div><div class="am-bar"><span></span></div></div><div class="elog"></div></section>
<div class="wv-over"></div></div></div></div>`}
export function mountWatch(opts){onExplore=opts.onExplore||opts;already=opts.already||(()=>false);requestAnimationFrame(()=>{draw();if(W.playing)tick()})}
export function startWatch(){W.playing=true;go(0)}
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-w],[data-wgo],[data-wside]')
  if(!t||!document.getElementById('wv'))return
  if(t.dataset.wside){W.side=t.dataset.wside;W.manual=true;draw();return}
  if(t.dataset.wgo!=null){W.playing=false;clearTimeout(W.timer);go(+t.dataset.wgo);return}
  const a=t.dataset.w
  if(a==='toggle') W.playing?pause():play()
  else if(a==='next'){W.playing=false;clearTimeout(W.timer);go(W.step+1)}
  else if(a==='back'){W.playing=false;clearTimeout(W.timer);go(W.step-1)}
  else if(a==='restart'){W.playing=true;go(0)}
  else if(a==='speed'){const sp=[1,1.5,2,0.75];W.speed=sp[(sp.indexOf(W.speed)+1)%sp.length];draw()}
  else if(a==='explore') onExplore()
})
document.addEventListener('keydown',e=>{if(!document.getElementById('wv')||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.key===' '){e.preventDefault();W.playing?pause():play()}else if(e.key==='ArrowRight'){W.playing=false;go(W.step+1)}else if(e.key==='ArrowLeft'){W.playing=false;go(W.step-1)}})
export const watchState=W
