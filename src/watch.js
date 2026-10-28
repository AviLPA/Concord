// Click-through walkthrough. Three acts, same numbers as the shared model.
// Concord reads chats and logs. Sara picks one answer. Builders apply it.
// Nothing here runs or edits an agent.
import {mark, status} from './brand.js'
const sv=p=>`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`
const IC={zap:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',file:'<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5"/>',
layers:'<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',alert:'<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
cube:'<path d="m12 2 9 5v10l-9 5-9-5V7z"/><path d="m3 7 9 5 9-5M12 12v10"/>',link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
check:'<path d="m5 12 5 5 9-10"/>',flow:'<rect x="3" y="4" width="6" height="6" rx="1.5"/><rect x="15" y="14" width="6" height="6" rx="1.5"/><path d="M9 7h4a2 2 0 0 1 2 2v5"/>',
play:'<path d="M7 4v16l13-8z" fill="currentColor"/>',pause:'<path d="M7 4h3v16H7zM14 4h3v16h-3z" fill="currentColor"/>',next:'<path d="M5 4v16l11-8z" fill="currentColor"/><path d="M19 4v16"/>',
back:'<path d="M19 4v16L8 12z" fill="currentColor"/><path d="M5 4v16"/>',redo:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',spark:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>'}
const ic=n=>sv(IC[n])
const av=(ini,c)=>`<span class="dav" style="background:${c};color:var(--on-sync)">${ini}</span>`
const Q='How many accounts are at risk?'
const SAID=[
  {id:'n35', name:"Dana's agent", who:'Dana · Sales Ops · Claude', seen:true, ini:'DO', c:'#ABD1E6', n:35, rule:'A personal spreadsheet'},
  {id:'n42', name:'Account health monitor', who:'CS team lead · CS · Claude', ini:'CS', c:'#82B9D9', n:42, rule:'A ticket count'},
  {id:'n17', name:"Tom's n8n workflow", short:"Tom's workflow", who:'Tom · CS Ops · n8n', ini:'TR', c:'#82B9D9', n:17, rule:'Usage drop over 40%'},
  {id:'n28', name:'Renewal radar', short:'Renewal radar', who:'RevOps · Claude', ini:'RR', c:'#58A2CD', n:28, rule:'Warehouse score'},
]
const NEXT=['the nightly scan','four answers',"Sara's alert",'Sara decides','daily scans','the ending']
const ALERT='4 answers: 35, 42, 17, 28'
const ALERT_FULL='4 agents are answering "How many accounts are at risk?" differently: Dana\'s agent 35, Account health monitor 42, Tom\'s workflow 17, Renewal radar 28. Pick the official answer.'
const BUILDERS=[{id:'b35',to:'Dana',ini:'DO',c:'#ABD1E6',agent:"Dana's agent",n:35},{id:'b42',to:'CS team lead',ini:'CS',c:'#82B9D9',agent:'Account health monitor',n:42},{id:'b17',to:'Tom',ini:'TR',c:'#82B9D9',agent:"Tom's workflow",n:17},{id:'b28',to:'RevOps',ini:'RR',c:'#58A2CD',agent:'Renewal radar',n:28}]
const NOTE1='Your agent is one of 4 giving different answers to this question.'
const NOTE2="Your agent doesn't match the official answer (28). Nothing in your agent was changed."

const STEPS=[
{label:'Dana builds', left:'build',
 title:'Dana asks her agent',
 body:'She asks the question and gets 35.',
 dwell:4500,
 beats:[
  {t:'type', id:'u1', side:'chat', text:Q, wait:280},
  {t:'reply', id:'a1', side:'chat', think:550, wait:700},
 ]},
{label:'Night scan', left:'build',
 title:'The nightly scan runs',
 body:"It finds Dana's agent on Customer health.",
 dwell:5200,
 beats:[{t:'ev', id:'found', side:'be', wait:700}]},
{label:'Four answers', left:'build',
 title:'Four agents, one question, four answers.',
 body:"Dana isn't the only one. Three other people built agents for the same job, and each one answers differently.",
 dwell:5200,
 beats:[
  {t:'ev', id:'n35', side:'be', wait:420},
  {t:'ev', id:'n42', side:'be', wait:420},
  {t:'ev', id:'n17', side:'be', wait:420},
  {t:'ev', id:'n28', side:'be', wait:500},
 ]},
{label:"Sara's alert", left:'alert',
 title:'Sara gets the alert',
 body:'One alert lands with Sara. Each builder gets a note.',
 dwell:5000,
 beats:[
  {t:'ev', id:'j35', side:'be', wait:300},
  {t:'ev', id:'j42', side:'be', wait:300},
  {t:'ev', id:'j17', side:'be', wait:300},
  {t:'ev', id:'j28', side:'be', wait:400},
  {t:'ev', id:'slack', side:'be', wait:600},
  {t:'ev', id:'b35', side:'be', wait:350},
  {t:'ev', id:'b42', side:'be', wait:350},
  {t:'ev', id:'b17', side:'be', wait:350},
  {t:'ev', id:'b28', side:'be', wait:500},
 ]},
{label:'Sara decides', left:'sara',
 title:'Sara marks 28',
 body:'She signs off 28 as the official answer.',
 dwell:5600,
 beats:[
  {t:'ev', id:'choose', side:'chat', wait:700},
  {t:'ev', id:'picked', side:'chat', wait:700},
  {t:'ev', id:'m35', side:'be', wait:450},
  {t:'ev', id:'m42', side:'be', wait:450},
  {t:'ev', id:'m17', side:'be', wait:450},
  {t:'ev', id:'noted', side:'chat', wait:600},
 ]},
{label:'Daily scans', left:'n8n',
 title:'Daily scans check',
 body:'Three agents moved to 28. One still said 42. Day 6, all four in sync.',
 dwell:5600,
 beats:[
  {t:'ev', id:'d1', side:'be', wait:800},
  {t:'ev', id:'d3', side:'chat', left:'n8n', wait:900},
  {t:'ev', id:'d5', side:'be', wait:900},
  {t:'ev', id:'agree', side:'be', wait:800},
 ]},
]
const W={step:-1,beat:0,prog:0,thinking:false,side:'be',manual:false,timer:null}
let onExplore=()=>{}, root=null
const N=STEPS.length
function localVis(){
  const s=new Set()
  const i=W.step>=N?N-1:W.step
  if(i<0) return s
  const upto=W.step>=N?STEPS[i].beats.length:W.beat
  STEPS[i].beats.slice(0,upto).forEach(b=>s.add(b.id))
  return s
}
function cur(){const st=STEPS[W.step];return st&&W.beat<st.beats.length?st.beats[W.beat]:null}
const later=(f,ms)=>{clearTimeout(W.timer);W.timer=setTimeout(f,ms)}
function tick(){if(!document.getElementById('wv')){clearTimeout(W.timer);return}
 const st=STEPS[W.step];if(!st||W.beat>=st.beats.length)return
 const b=st.beats[W.beat]
 if(b.t==='type'){if(W.prog<b.text.length){W.prog=Math.min(b.text.length,W.prog+2);draw();later(tick,34)}else{W.beat++;W.prog=0;draw();later(tick,b.wait)}}
 else if(b.t==='reply'){if(!W.thinking){W.thinking=true;draw();later(tick,b.think)}else{W.thinking=false;W.beat++;draw();later(tick,b.wait)}}
 else{W.beat++;draw();later(tick,b.wait)}}
function settle(i){clearTimeout(W.timer);W.thinking=false;W.prog=0;W.manual=false
 if(i<0){W.step=-1;draw();return}
 if(i>=N){W.step=N;draw();return}
 W.step=i;W.beat=STEPS[i].beats.length;draw()}
function enter(i){clearTimeout(W.timer);W.thinking=false;W.prog=0;W.manual=false
 if(i>=N){W.step=N;draw();return}
 if(i<0){W.step=-1;draw();return}
 W.step=i
 if(payoffNow(i)){W.beat=STEPS[i].beats.length;draw();return}
 W.beat=0;draw();later(tick,180)}
function leftMode(){
  if(W.step<0||W.step>=N) return 'said'
  const st=STEPS[W.step]
  const seen=st.beats.slice(0,W.beat)
  for(let i=seen.length-1;i>=0;i--) if(seen[i].left) return seen[i].left
  return st.left
}
function shownStep(){return W.step>=N?N-1:Math.max(0,W.step)}

function alertCard(){
  return `<div class="alertc"><div class="alertk">Notification to Sara Klein</div><div class="alertfrom">Slack · #revops</div><b>${ALERT_FULL}</b><span>From Concord · nightly scan</span></div>`
}
function timeline(V){
  const rows=[
    ["Day 1 · Dana's agent now 28",V.has('d1')],
    ["Day 3 · Tom's workflow now 28",V.has('d3')],
    ['Day 5 · Account health monitor still 42, so Concord re-alerts',V.has('d5')],
    ['Day 6 · CS team lead fixes it, all four 28',V.has('agree')],
  ]
  return `<div class="tl4">${rows.map(([t,on])=>`<span class="${on?'on':''}"><i></i>${t}</span>`).join('')}</div>`
}
function chatItems(V){
  const it=[], c=cur(), mode=leftMode(), step=shownStep()
  const A=(id,h)=>it.push({k:id,h})
  const um=(id,txt)=>A(id,`<div class="cm u"><div class="cb">${txt}</div>${av('DO','#ABD1E6')}</div>`)
  const am=(id,h)=>A(id,`<div class="cm a"><span class="cav">${ic('spark')}</span><div class="cb">${h}</div></div>`)
  if(mode==='n8n'){
    const applied=V.has('d3')||V.has('agree')
    A('n8nhead',`<div class="chello"><b>Tom's n8n workflow</b><span>He edits it himself.</span></div>`)
    A('suggest',`<div class="cnote">${ic('link')}<span>Note from Sara: warehouse score, 28.</span></div>`)
    const nodes=[['Monday',''],['Get usage',''],[applied?'Warehouse score · 28':'Usage drop over 40%',applied?'ok':'hot'],['#cs-risk','stay']]
    A('flow',`<div class="flow">${nodes.map(([s,cl],i)=>`<div class="fn ${cl}">${s}${cl==='stay'?'<small>unchanged</small>':''}</div>${i<nodes.length-1?'<span class="fa">→</span>':''}`).join('')}</div>`)
    if(applied) A('applied',`<div class="cnote">${ic('check')}<span>Tom updated it on day 3.</span></div>`)
    return it
  }
  if(mode==='alert'){
    A('hello',`<div class="chello"><b>Sara Klein · Head of RevOps</b></div>`)
    if(V.has('slack')||step>3) A('slack',alertCard())
    return it
  }
  if(mode==='sara'){
    const picked=V.has('picked')
    const opts=SAID.map(a=>`<div class="opt ${picked&&a.id==='n28'?'on':''}"><span class="rad"></span><b>${a.rule}</b><em>${a.n}</em></div>`).join('')
    A('hello',`<div class="chello"><b>Sara Klein · Head of RevOps</b></div>`)
    A('pick',`<div class="opts">${opts}</div>${picked?'<div class="picked28"><div class="numxl ok">28</div><span>Warehouse score</span></div>':''}`)
    if(V.has('noted')) A('noted',`<div class="cnote">${ic('check')}<span>Notes sent to each builder.</span></div>`)
    return it
  }
  if(mode==='days'){
    A('days',timeline(V))
    return it
  }
  if(mode==='build'){
    const asked=step>0||V.has('u1')
    const answered=step>0||V.has('a1')
    A('hello',`<div class="chello"><b>Q4 at-risk agent</b><span>Dana's Claude project</span></div>`)
    if(asked) um('u1',Q)
    if(answered) am('a1',`<div class="big${step===1?' linked':''}">35</div>Accounts at risk.`)
    if(step===2) A('fournote',`<div class="cnote">Dana's agent is one of four.</div>`)
    if(step===0&&c&&c.t==='reply'&&W.thinking) A('think',`<div class="cm a"><span class="cav">${ic('spark')}</span><div class="cb typing"><span></span><span></span><span></span></div></div>`)
    return it
  }
  return []
}
function answerCards(list){
  return `<div class="sameq4"><div class="sq4k">Same question, asked of 4 agents built by 4 people.</div><div class="sq4q">“${Q}”</div></div><div class="cmp cmp4">${list.map(a=>`<div class="cc${a.seen?' seen':''}">${a.seen?'<div class="ccseen here">You are here</div>':''}<div class="ccn">${a.n}</div><div class="ccline"><b>${a.short||a.name}</b> <span class="ccwho">Built by ${a.who}</span></div></div>`).join('')}</div>`
}
function noteCards(list,txt){
  return `<div class="bnotes">${list.map(b=>`<div class="bnote"><div class="bnh">${av(b.ini,b.c)}<b>To ${b.to}</b><span>${b.agent} · ${b.n}</span></div><p>${txt}</p></div>`).join('')}</div>`
}
function joinCards(V){
  const on=BUILDERS.filter(b=>V.has('j'+b.n))
  const landed=V.has('slack')
  return `<div class="join4${landed?' landed':''}"><div class="j4row">${BUILDERS.map(b=>`<div class="j4c${V.has('j'+b.n)?' on':''}">${av(b.ini,b.c)}<b>${b.agent}</b><em>${b.n}</em></div>`).join('')}</div><div class="j4lines">${BUILDERS.map(b=>`<i class="${V.has('j'+b.n)?'on':''}"></i>`).join('')}</div><div class="j4alert${landed?' on':''}">${landed?`<div class="alertk">Slack · #revops · to Sara Klein</div><b>${ALERT_FULL}</b>`:'<span>Joining into one alert…</span>'}</div></div>`
}
function numberCards(ok){
  return `<div class="cmp${ok?' settle':''}">${SAID.map(a=>`<div class="cc${ok?' ok':''}"><div class="ccn">${ok?28:a.n}</div><div class="cch">${av(a.ini,a.c)}<b>${a.short||a.name}</b></div></div>`).join('')}</div>`
}
function beItems(V){
  const it=[], step=shownStep()
  const A=(k,ico,tone,title,sub,card='')=>it.push({k,h:`<div class="ev ${tone}"><span class="evi">${ic(ico)}</span><div class="evb"><div class="evt">${title}</div>${sub?`<div class="evs">${sub}</div>`:''}${card}</div></div>`})
  if(step===0){
    A('quiet','eye','','Next scan is tonight','The scan runs daily.')
  }else if(step===1){
    if(V.has('found')) A('found','eye','','New agent found','Customer health.',`<div class="sameq"><div class="samek">No change since the last step</div><div class="sameask">${Q}</div><div class="samen">35</div><b>Dana's agent answered 35</b></div>`)
  }else if(step===2){
    const cards=SAID.filter(a=>V.has(a.id))
    if(cards.length) A('nums','layers','','Four answers','',answerCards(cards))
  }else if(step===3){
    if(V.has('j35')) A('join','alert','','One alert for Sara','',joinCards(V))
    const got=BUILDERS.filter(b=>V.has(b.id))
    if(got.length) A('bn1','link','','Notes to each builder','',noteCards(got,NOTE1))
  }else if(step===4){
    if(V.has('picked')) A('marked','check','','Official answer is 28','Warehouse score.')
    const mis=BUILDERS.filter(b=>b.n!==28&&V.has('m'+b.n))
    if(mis.length) A('bn2','link','','Notes to the builders who don\'t match','',noteCards(mis,NOTE2))
  }else if(step===5){
    if(V.has('d1')) A('days','eye','','',V.has('agree')?'':'Checking who updated.',timeline(V)+(V.has('agree')?numberCards(true)+`<div class="tlchip">${status('sync','In sync')}</div>`:''))
  }
  return it
}
function sync(el,items){const ch=[...el.children];let i=0;while(i<ch.length&&i<items.length&&ch[i].dataset.k===items[i].k)i++
 ch.slice(i).forEach(c=>c.remove());items.forEach((it,j)=>{let n=el.children[j];if(n){if(n._h!==it.h){n.innerHTML=it.h;n._h=it.h}}else{n=document.createElement('div');n.dataset.k=it.k;n.className='wi';n.innerHTML=it.h;n._h=it.h;el.appendChild(n);el._new=true}})}
const setH=(el,h)=>{if(el&&el._h!==h){el.innerHTML=h;el._h=h}}
function caption(){
  if(W.step<0) return ''
  if(W.step>=N) return `<div class="wk">Done</div><div class="wt">All 4 agents agree: 28.</div><div class="wb">Daily scans keep checking.</div>`
  const st=STEPS[W.step]
  return `<div class="wk">Step ${W.step+1} of 6 · ${st.label}</div><div class="wt">${st.title}</div><div class="wb">${st.body}</div>`
}
function phone(){return !!(window.matchMedia&&window.matchMedia('(max-width:820px)').matches)}
function reduceMotion(){return !!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)}
function payoffNow(i){return (phone()||reduceMotion())&&(i===0||i===5)}
function draw(){
  root=document.getElementById('wv');if(!root)return
  const V=localVis(),c=cur(),st=STEPS[W.step],mode=leftMode()
  if(!W.manual){
    if(phone()) W.side=W.step<=1?'chat':'be'
    else {const last=c||(st&&st.beats[st.beats.length-1]);if(last&&last.side)W.side=last.side;else W.side=mode==='build'||mode==='n8n'||mode==='alert'||mode==='sara'?'chat':'be'}
  }
  root.dataset.side=W.side;root.dataset.left=mode;root.dataset.state=W.step<0?'intro':W.step>=N?'done':'run'
  setH(root.querySelector('.wv-steps'),STEPS.map((s,i)=>`<button class="ws-i ${i<W.step?'done':i===W.step?'on':''}" data-wgo="${i}" title="${s.label}"><span class="wn">${i<W.step||W.step>=N?'✓':i+1}</span><span class="wl">${s.label}</span></button>`).join(''))
  const pct=W.step<0?0:W.step>=N?100:((W.step+(st?W.beat/st.beats.length:0))/N*100)
  root.querySelector('.wv-prog span').style.width=pct+'%'
  setH(root.querySelector('.wv-cap'),caption())
  const atEnd=W.step>=N
  const nextTitle=W.step>=0&&!atEnd?NEXT[W.step]:''
  const nextLabel=W.step<0?'Start the use case':atEnd?'Done':phone()?'Next':`Next: ${NEXT[W.step]}`
  setH(root.querySelector('.wv-btns'),`<button class="btn" data-w="back" ${W.step<=0?'disabled':''}>Back</button><button class="btn p wnext" data-w="${W.step<0?'start':'next'}" ${atEnd?'disabled':''} ${nextTitle?`title="${nextTitle}"`:''}>${nextLabel}</button>`)
  const leftTab='Agent view'
  setH(root.querySelector('.wv-tabs'),`<button data-wside="be" class="${W.side==='be'?'on':''}">What Concord sees</button><button data-wside="chat" class="${W.side==='chat'?'on':''}">${leftTab}</button>`)
  const titles={said:[ic('layers'),'What the agents said'],build:[ic('spark'),"Dana's Claude project"],alert:[ic('alert'),"Sara's alert"],sara:[ic('user'),"Sara's view in Concord"],days:[ic('eye'),'Daily scans'],n8n:[ic('flow'),"Tom's n8n workflow"]}
  const hd=titles[mode]||titles.said
  const who=mode==='n8n'?av('TR','#82B9D9'):mode==='build'?av('DO','#ABD1E6'):mode==='sara'||mode==='alert'?av('SK','#3FE0A1'):''
  setH(root.querySelector('.wleft-hd'),`<span class="cav">${hd[0]}</span><div class="wleft-titles"><h3>${hd[1]}</h3></div>${who?`<span class="r">${who}</span>`:''}`)
  const ch=root.querySelector('.cmsgs'),be=root.querySelector('.elog')
  sync(ch,chatItems(V));sync(be,beItems(V))
  const chat=root.querySelector('.wchat')
  if(chat){chat.dataset.input=mode==='build'&&shownStep()===0?'on':'off';chat.dataset.fade=shownStep()===2?'on':'off'}
  const comp=root.querySelector('.ccomp-t'),typing=mode==='build'&&shownStep()===0&&c&&c.t==='type'
  if(comp) comp.innerHTML=typing?c.text.slice(0,W.prog).replace(/</g,'&lt;')+'<span class="caret"></span>':mode==='build'&&shownStep()===0?'<span class="ph">Message Claude…</span>':'<span class="ph">Read-only</span>'
  root.querySelector('.ccomp')?.classList.toggle('active',!!typing)
  for(const el of [ch,be]){if(el._new||typing){el.scrollTo({top:el.scrollHeight,behavior:'auto'});el._new=false}}
  const bar=root.querySelector('.am-bar')
  const scanning=W.step===1
  bar.hidden=!scanning
  if(scanning) bar.querySelector('span').style.width=(V.has('found')?100:0)+'%'
  const head=V.has('agree')||W.step>=N?`<b>Builders update. Daily scans confirm all four match.</b>`:W.step===5?`<b>Daily scans</b>`:W.step===4?`<b>Official answer 28</b>`:W.step===3?`<b>Alert sent to Sara</b>`:W.step===2?`<b>Four answers</b>`:W.step===1?`<b>New agent found</b>`:`<b>Next scan is tonight</b>`
  setH(root.querySelector('.am-t'),head)
  setH(root.querySelector('.am-s'),'')
  setH(root.querySelector('.wv-over'),W.step<0?intro():W.step>=N?wrap():'')
}
function intro(){return `<div class="wcard"><h2>Dana gets 35.</h2><p>A nightly scan alerts Sara. Later every agent says 28.</p><button class="btn p big" data-w="start">Start the use case</button></div>`}
function wrap(){return `<div class="wcard wrapc"><h2>All 4 agents agree: 28.</h2><div class="ba"><div class="b4"><div class="bal">That night</div><div class="bav">35 · 42 · 17 · 28</div><div class="bas">Sara got the alert</div></div><div class="barr">→</div><div class="b4 after"><div class="bal">Now</div><div class="bav numok">28</div><div class="bas">All 4 agents agree</div></div></div><p>The next daily scan shows one agent at 28 and one still at 42, so Concord re-alerts. On day 6 the builder fixes it. The job is in sync. Daily scans continue.</p><div class="wacts"><button class="btn p big" data-w="explore">Explore the full app</button><button class="btn big" data-w="restart">Walk through again</button></div></div>`}
export function watchPage(alreadyDecided){
  return `<div class="page wpage"><div id="wv" class="wv" data-side="be" data-left="said">
<div class="wv-head"><div><h1>Use case</h1><p class="sub" style="margin:0">Dana gets 35. A scan alerts Sara.</p></div></div>
${alreadyDecided?'<div class="wbanner">Customer health is already decided in this workspace. This story will not overwrite that decision.</div>':''}
<div class="wv-cap"></div>
<div class="wv-tabs"></div>
<div class="wv-dock"><div class="wv-steps"></div><div class="wv-prog"><span></span></div><div class="wv-btns"></div></div>
<div class="wv-split"><section class="card wchat" data-input="off"><div class="hd wleft-hd"></div><div class="cmsgs"></div><div class="ccomp"><div class="ccomp-t"></div><button class="csend" tabindex="-1">↑</button></div></section>
<section class="card wbe"><div class="hd">${mark(16)}<h3>What Concord sees</h3><span class="r am-s"></span></div><div class="am"><div class="am-t"></div><div class="am-bar"><span></span></div></div><div class="elog"></div></section>
<div class="wv-over"></div></div></div></div>`}
export function mountWatch(opts){onExplore=opts.onExplore||opts;requestAnimationFrame(()=>draw())}
export function startWatch(){enter(0)}
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-w],[data-wgo],[data-wside]')
  if(!t||!document.getElementById('wv'))return
  if(t.dataset.wside){W.side=t.dataset.wside;W.manual=true;draw();return}
  if(t.dataset.wgo!=null){settle(+t.dataset.wgo);return}
  const a=t.dataset.w
  if(a==='start') enter(0)
  else if(a==='next') enter(W.step+1)
  else if(a==='back'&&W.step>0) settle(W.step-1)
  else if(a==='restart') settle(-1)
  else if(a==='explore') onExplore()
})
document.addEventListener('keydown',e=>{if(!document.getElementById('wv')||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.key==='ArrowRight')enter(W.step+1);else if(e.key==='ArrowLeft'&&W.step>0)settle(W.step-1)})
export const watchState=W
