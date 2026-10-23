// Click-through walkthrough. Three acts, same numbers as the shared model.
// Concord reads chats and logs. Sara picks one answer. Builders apply it.
// Nothing here runs or edits an agent.
import {status, mark} from './brand.js'
const sv=p=>`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`
const IC={zap:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',file:'<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5"/>',
layers:'<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',alert:'<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
cube:'<path d="m12 2 9 5v10l-9 5-9-5V7z"/><path d="m3 7 9 5 9-5M12 12v10"/>',link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
check:'<path d="m5 12 5 5 9-10"/>',flow:'<rect x="3" y="4" width="6" height="6" rx="1.5"/><rect x="15" y="14" width="6" height="6" rx="1.5"/><path d="M9 7h4a2 2 0 0 1 2 2v5"/>',
play:'<path d="M7 4v16l13-8z" fill="currentColor"/>',pause:'<path d="M7 4h3v16H7zM14 4h3v16h-3z" fill="currentColor"/>',next:'<path d="M5 4v16l11-8z" fill="currentColor"/><path d="M19 4v16"/>',
back:'<path d="M19 4v16L8 12z" fill="currentColor"/><path d="M5 4v16"/>',redo:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',spark:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>'}
const ic=n=>sv(IC[n])
const av=(ini,c)=>`<span class="dav" style="background:${c};color:var(--on-sync)">${ini}</span>`
const ACT={1:'They build',2:'The scan',3:'It sticks'}
const Q='How many accounts are at risk?'
const SAID=[
  {id:'n35', name:"Dana's agent", who:'Dana · Sales Ops · Claude', seen:true, ini:'DO', c:'#ABD1E6', n:35, rule:'A personal spreadsheet'},
  {id:'n42', name:'Account health monitor', who:'CS team lead · CS · Claude', ini:'CS', c:'#82B9D9', n:42, rule:'A ticket count'},
  {id:'n17', name:"Tom's n8n workflow", short:"Tom's workflow", who:'Tom · CS Ops · n8n', ini:'TR', c:'#82B9D9', n:17, rule:'Usage drop over 40%'},
  {id:'n28', name:'Renewal radar', short:'Renewal radar', who:'RevOps · Claude', ini:'RR', c:'#58A2CD', n:28, rule:'Warehouse score'},
]
const NEXT=['the nightly scan','four answers',"Sara's alert",'Sara decides','daily scans','the ending']
const ALERT='Customer health: 4 agents, 4 different answers (35, 42, 17, 28)'
const STEPS=[
{act:1, label:'Dana builds', left:'build', leftTitle:"Dana's Claude project",
 title:'Dana builds a Q4 at-risk agent and uses it',
 body:'She asks how many accounts are at risk. The answer is 35. Concord does not interrupt her.',
 know:'Concord is not in this chat. It finds a new agent on the next scheduled scan, after the agent has been used.',
 dwell:4500,
 beats:[
  {t:'type', id:'u1', side:'chat', text:Q, wait:280},
  {t:'reply', id:'a1', side:'chat', think:550, wait:700},
 ]},
{act:2, label:'Night scan', left:'build', leftTitle:"Dana's Claude project",
 title:"That night's scan finds Dana's agent",
 body:'Scans are scheduled, not instant. They run daily. This one matches the job: Customer health.',
 know:'The scan reads the agent list, the instructions, and the answer already in the chat. It does not run the agent.',
 dwell:5200,
 beats:[{t:'ev', id:'found', side:'be', wait:700}]},
{act:2, label:'Four answers', left:'build', leftTitle:"Dana's Claude project",
 title:'The same scan finds four different answers',
 body:"Dana's 35 is the one we just saw. Three other agents at Northwind answer the same question. Different definitions, different sources.",
 know:'The other three answers were already on record. Concord compared them. It did not ask anyone.',
 dwell:5200,
 beats:[
  {t:'ev', id:'n35', side:'be', wait:420},
  {t:'ev', id:'n42', side:'be', wait:420},
  {t:'ev', id:'n17', side:'be', wait:420},
  {t:'ev', id:'n28', side:'be', wait:500},
 ]},
{act:2, label:"Sara's alert", left:'alert', leftTitle:"Sara's alert",
 title:'Sara gets the alert',
 body:ALERT+'. It shows up in Slack, and as an item in Concord.',
 know:'Sara Klein, Head of RevOps, owns this number. The alert goes to her, not into Dana’s chat.',
 dwell:5000,
 beats:[
  {t:'ev', id:'slack', side:'chat', wait:700},
  {t:'ev', id:'inbox', side:'chat', wait:600},
 ]},
{act:3, label:'Sara decides', left:'sara', leftTitle:"Sara's view in Concord",
 title:'Sara marks the correct answer',
 body:'She picks 28, the warehouse score. Concord sends each builder a note on what to change. Concord doesn’t change anyone’s agent.',
 know:'She could also mark a valid variant, write her own answer, or import one. Marking one does not edit the agents.',
 dwell:5600,
 beats:[
  {t:'ev', id:'choose', side:'chat', wait:700},
  {t:'ev', id:'picked', side:'chat', wait:700},
  {t:'ev', id:'noted', side:'chat', wait:600},
 ]},
{act:3, label:'Daily scans', left:'days', leftTitle:'Daily scans',
 title:'The next scans check that it stuck',
 body:'Day 1 Dana updates. Day 3 Tom updates his workflow. Day 5 the Account health monitor still says 42, so Concord alerts again. The CS team lead updates it after that.',
 know:'Each builder edits their own agent. Concord checks the following scheduled scans, and alerts again if something is still off or drifts later.',
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
 W.step=i;W.beat=0;draw();later(tick,180)}
function leftMode(){
  if(W.step<0||W.step>=N) return 'said'
  const st=STEPS[W.step]
  const seen=st.beats.slice(0,W.beat)
  for(let i=seen.length-1;i>=0;i--) if(seen[i].left) return seen[i].left
  return st.left
}
function shownStep(){return W.step>=N?N-1:Math.max(0,W.step)}

function alertCard(){
  return `<div class="alertc"><div class="alertk">Notification to Sara Klein</div><div class="alertfrom">Slack · #revops</div><b>${ALERT}</b><span>From Concord · nightly scan</span></div>`
}
function dayList(V){
  const rows=[
    ['Day 1','Dana updated her agent',V.has('d1'),''],
    ['Day 3','Tom updated his workflow himself',V.has('d3'),''],
    ['Day 5','Account health monitor still says 42. Concord alerted again.',V.has('d5'),'off'],
    ['Next scan',V.has('agree')?'The CS team lead updated it. Every agent says 28.':'Waiting on the next scan.',V.has('agree'),''],
  ]
  return `<div class="days">${rows.map(([d,w,on,k])=>`<div class="day ${on?'on':''} ${on&&k==='off'&&!V.has('agree')?'off':''}"><b>${d}</b><span>${w}</span></div>`).join('')}</div>`
}
function chatItems(V){
  const it=[], c=cur(), mode=leftMode(), step=shownStep()
  const A=(id,h)=>it.push({k:id,h})
  const um=(id,txt)=>A(id,`<div class="cm u"><div class="cb">${txt}</div>${av('DO','#ABD1E6')}</div>`)
  const am=(id,h)=>A(id,`<div class="cm a"><span class="cav">${ic('spark')}</span><div class="cb">${h}</div></div>`)
  if(mode==='n8n'){
    const applied=V.has('d3')||V.has('agree')
    A('n8nhead',`<div class="chello"><b>CSM weekly risk digest</b><span>Tom's n8n workflow · he edits it himself</span></div>`)
    A('suggest',`<div class="cnote">${ic('link')}<span>Note from Sara: use the warehouse score, 28. Tom makes the edit. Concord doesn't change anyone's agent.</span></div>`)
    const nodes=[['Every Monday',''],['Get usage',''],[applied?'Warehouse score · 28':'Usage drop over 40%',applied?'ok':'hot'],['Post to #cs-risk','stay']]
    A('flow',`<div class="flow">${nodes.map(([s,cl],i)=>`<div class="fn ${cl}">${s}${cl==='stay'?'<small>unchanged</small>':''}</div>${i<nodes.length-1?'<span class="fa">→</span>':''}`).join('')}</div>`)
    if(applied) A('applied',`<div class="cnote">${ic('check')}<span>Tom updated it on day 3. The Slack post is unchanged.</span></div>`)
    return it
  }
  if(mode==='alert'){
    A('hello',`<div class="chello"><b>Sara Klein · Head of RevOps</b><span>This is a notification. She is not in Dana's chat.</span></div>`)
    if(V.has('slack')||step>3) A('slack',alertCard())
    return it
  }
  if(mode==='sara'){
    const picked=V.has('picked')
    const opts=SAID.map(a=>`<div class="opt ${picked&&a.id==='n28'?'on':''}"><span class="rad"></span><b>${a.rule}</b><em>${a.n}</em></div>`).join('')
    A('hello',`<div class="chello"><b>Sara Klein · Head of RevOps</b><span>She owns this number. She is marking it here.</span></div>`)
    A('pick',`<div class="opts">${opts}</div>${picked?'<div class="picked28"><div class="numxl ok">28</div><span>Warehouse score</span></div>':''}`)
    if(V.has('noted')) A('noted',`<div class="cnote">${ic('check')}<span>Notes sent to each builder. Concord doesn't change anyone's agent.</span></div>`)
    return it
  }
  if(mode==='days'){
    A('hello',`<div class="chello"><b>After Sara marked 28</b><span>The following scans watch for who updated.</span></div>`)
    A('days',dayList(V))
    return it
  }
  if(mode==='build'){
    const asked=step>0||V.has('u1')
    const answered=step>0||V.has('a1')
    A('hello',`<div class="chello"><b>Q4 at-risk agent</b><span>Dana's Claude project</span></div>`)
    if(asked) um('u1',Q)
    if(answered) am('a1',`<div class="big${step===1?' linked':''}">35</div>Accounts at risk this quarter.`)
    if(step===2) A('fournote',`<div class="cnote">Dana's agent is one of four.</div>`)
    if(step===0&&c&&c.t==='reply'&&W.thinking) A('think',`<div class="cm a"><span class="cav">${ic('spark')}</span><div class="cb typing"><span></span><span></span><span></span></div></div>`)
    return it
  }
  return []
}
function answerCards(list){
  return `<div class="cmp">${list.map(a=>`<div class="cc${a.seen?' seen':''}"><div class="ccn">${a.n}</div><div class="cch">${av(a.ini,a.c)}<div class="ccmeta"><b>${a.name}</b><span class="ccwho">${a.who}</span></div></div><div class="ccrule">${a.rule}</div>${a.seen?'<div class="ccseen">Just seen</div>':''}</div>`).join('')}</div>`
}
function numberCards(ok){
  return `<div class="cmp${ok?' settle':''}">${SAID.map(a=>`<div class="cc ${ok?'ok':''}"><div class="ccn">${ok?28:a.n}</div><div class="cch">${av(a.ini,a.c)}<b>${a.short||a.name}</b></div></div>`).join('')}</div>`
}
function beItems(V){
  const it=[], step=shownStep()
  const A=(k,ico,tone,title,sub,card='')=>it.push({k,h:`<div class="ev ${tone}"><span class="evi">${ic(ico)}</span><div class="evb"><div class="evt">${title}</div>${sub?`<div class="evs">${sub}</div>`:''}${card}</div></div>`})
  if(step===0){
    A('quiet','eye','mut','Nothing from Concord','Dana is just using her agent. The next scan is tonight. Scans are daily by default.')
  }else if(step===1){
    if(V.has('found')) A('found','eye','ok','New agent found',"Dana's Q4 at-risk agent. Job matched: Customer health.",`<div class="sameq"><div class="samek">Same answer as the last step</div><div class="sameask">${Q}</div><div class="samen">35</div><b>Dana's agent answered 35</b></div><div class="scanlog"><div class="on">Nightly scan · daily by default</div><div class="on">New agent · Dana's Q4 at-risk agent</div><div class="on">Job matched · Customer health</div></div>`)
  }else if(step===2){
    const cards=SAID.filter(a=>V.has(a.id))
    if(cards.length) A('nums','layers','','3 other agents at Northwind answer the same question',"Dana's 35 is the one we just saw.",answerCards(cards))
  }else if(step===3){
    if(V.has('slack')) A('sent','alert','','Alert sent to Sara',ALERT)
    if(V.has('inbox')) A('inbox','check','ok','Also waiting in Concord','Sara can open it when she is ready.')
  }else if(step===4){
    if(V.has('picked')) A('marked','check','ok','Official answer is 28','The warehouse score. Nothing was edited.')
    if(V.has('noted')) A('notes','link','','Notes sent to Dana, Tom, and the CS team lead',"What differs, and what to change. Concord doesn't change anyone's agent.")
  }else if(step===5){
    if(V.has('d1')) A('days','eye',V.has('agree')?'ok':'','Daily scans',V.has('agree')?'This job is 100. Daily monitoring is still running.':'Checking who updated. Concord does not edit the agents.',dayList(V)+(V.has('agree')?numberCards(true)+`<div class="flagrow">${status('sync','In sync')}</div>`:''))
  }
  return it
}
function sync(el,items){const ch=[...el.children];let i=0;while(i<ch.length&&i<items.length&&ch[i].dataset.k===items[i].k)i++
 ch.slice(i).forEach(c=>c.remove());items.forEach((it,j)=>{let n=el.children[j];if(n){if(n._h!==it.h){n.innerHTML=it.h;n._h=it.h}}else{n=document.createElement('div');n.dataset.k=it.k;n.className='wi';n.innerHTML=it.h;n._h=it.h;el.appendChild(n);el._new=true}})}
const setH=(el,h)=>{if(el&&el._h!==h){el.innerHTML=h;el._h=h}}
function caption(){
  if(W.step<0) return `<div class="wk">Walkthrough</div><div class="wt">Build anything. Concord scans, then alerts.</div><div class="wb">Click Next through each step. Dana gets 35. That night's scan alerts Sara. She marks 28, and later scans check.</div>`
  if(W.step>=N) return `<div class="wk">Done</div><div class="wt">Every agent says 28</div><div class="wb">Daily scans are still running. Concord alerts again if something drifts.</div>`
  const st=STEPS[W.step]
  return `<div class="wk">Act ${st.act} · ${ACT[st.act]} · ${st.label}</div><div class="wt">${st.title}</div><div class="wb">${st.body}</div><details class="wknow"><summary>How Concord knows</summary><p>${st.know}</p></details>`
}
function draw(){
  root=document.getElementById('wv');if(!root)return
  const V=localVis(),c=cur(),st=STEPS[W.step],mode=leftMode()
  if(!W.manual){const last=c||(st&&st.beats[st.beats.length-1]);if(last&&last.side)W.side=last.side;else W.side=mode==='build'||mode==='n8n'||mode==='alert'||mode==='sara'?'chat':'be'}
  root.dataset.side=W.side;root.dataset.left=mode;root.dataset.state=W.step<0?'intro':W.step>=N?'done':'run'
  setH(root.querySelector('.wv-steps'),STEPS.map((s,i)=>`<button class="ws-i ${i<W.step?'done':i===W.step?'on':''}" data-wgo="${i}" title="${s.label}"><span class="wn">${i<W.step||W.step>=N?'✓':i+1}</span><span class="wl">${s.label}</span></button>`).join(''))
  const pct=W.step<0?0:W.step>=N?100:((W.step+(st?W.beat/st.beats.length:0))/N*100)
  root.querySelector('.wv-prog span').style.width=pct+'%'
  setH(root.querySelector('.wv-cap'),caption())
  const atEnd=W.step>=N
  const nextLabel=W.step<0?'Start the walkthrough':atEnd?'Done':`Next: ${NEXT[W.step]}`
  setH(root.querySelector('.wv-btns'),`<button class="btn" data-w="back" ${W.step<=0?'disabled':''}>Back</button><button class="btn p wnext" data-w="${W.step<0?'start':'next'}" ${atEnd?'disabled':''}>${nextLabel}</button>`)
  const leftTab={n8n:"Tom's workflow",build:'Dana in Claude',alert:"Sara's alert",sara:"Sara's view",days:'Daily scans'}[mode]||'What they said'
  setH(root.querySelector('.wv-tabs'),`<button data-wside="chat" class="${W.side==='chat'?'on':''}">${leftTab}${c&&c.side==='chat'&&W.side!=='chat'?'<i></i>':''}</button><button data-wside="be" class="${W.side==='be'?'on':''}">What Concord sees${c&&c.side==='be'&&W.side!=='be'?'<i></i>':''}</button>`)
  const actN=st?st.act:W.step>=N?3:1
  const titles={said:[ic('layers'),'What the agents said'],build:[ic('spark'),"Dana's Claude project"],alert:[ic('alert'),"Sara's alert"],sara:[ic('user'),"Sara's view in Concord"],days:[ic('eye'),'Daily scans'],n8n:[ic('flow'),"Tom's n8n workflow"]}
  const hd=titles[mode]||titles.said
  const who=mode==='n8n'?av('TR','#82B9D9'):mode==='build'?av('DO','#ABD1E6'):mode==='sara'||mode==='alert'?av('SK','#3FE0A1'):''
  setH(root.querySelector('.wleft-hd'),`<span class="cav">${hd[0]}</span><div class="wleft-titles"><div class="wact">Act ${actN} · ${ACT[actN]}</div><h3>${hd[1]}</h3></div>${who?`<span class="r">${who}</span>`:''}`)
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
  const head=V.has('agree')||W.step>=N?`<b>Every agent says 28</b>`:W.step===5?`<b>Daily scans</b>`:W.step===4?`<b>Official answer 28</b>`:W.step===3?`<b>Alert sent to Sara</b>`:W.step===2?`<b>Four different answers</b>`:W.step===1?`<b>New agent found</b>`:`<b>No alert yet</b>`
  setH(root.querySelector('.am-t'),head)
  setH(root.querySelector('.am-s'),`Daily`)
  setH(root.querySelector('.wv-over'),W.step<0?intro():W.step>=N?wrap():'')
}
function intro(){return `<div class="wcard"><div class="wbadge">Walkthrough</div><h2>Build anything. Concord scans, then alerts.</h2><p>Dana gets 35. That night's scan alerts Sara. She marks 28, and later scans check.</p><div class="wsteps2"><span>1 · Dana uses it</span><span>2 · The scan alerts Sara</span><span>3 · Daily scans check</span></div><button class="btn p big" data-w="start">Start the walkthrough</button><div class="dim" style="margin-top:10px;font-size:12px">Click Next. Nothing moves on by itself.</div></div>`}
function wrap(){return `<div class="wcard wrapc"><div class="wbadge ok">${ic('check')} Every agent says 28</div><h2>Every agent says 28</h2><div class="ba"><div class="b4"><div class="bal">That night</div><div class="bav">35 · 42 · 17 · 28</div><div class="bas">Sara got the alert</div></div><div class="barr">→</div><div class="b4 after"><div class="bal">Now</div><div class="bav">28</div><div class="bas">This job is 100</div></div></div><p>Dana updated on day 1. Tom updated his workflow on day 3. On day 5 the Account health monitor still said 42, so Concord alerted again. The CS team lead updated it and matched last. Daily scans are still running.</p><div class="wacts"><button class="btn p big" data-w="explore">Explore the full app →</button><button class="btn big" data-w="restart">Walk through again</button></div></div>`}
export function watchPage(alreadyDecided){
  return `<div class="page wpage"><div id="wv" class="wv" data-side="be" data-left="said">
<div class="wv-head"><div><h1>Walkthrough</h1><p class="sub" style="margin:0">Click Next through each step. Dana uses an agent. That night's scan alerts Sara. Builders fix it themselves.</p></div><span class="tag">Click-through · demo data</span></div>
${alreadyDecided?'<div class="wbanner">Customer health is already decided in this workspace. This story will not overwrite that decision.</div>':''}
<div class="wv-steps"></div><div class="wv-prog"><span></span></div>
<div class="wv-narr"><div class="wv-cap"></div><div class="wv-btns"></div></div>
<div class="wv-tabs"></div>
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
