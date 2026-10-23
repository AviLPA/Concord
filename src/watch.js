// Guided "Watch it live". Three acts, same numbers as the shared model.
// Concord reads chats and logs. Sara picks one answer. Builders apply it.
// Nothing here runs or edits an agent.
import * as M from './model.js'
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
const ACT={1:'The problem',2:'The fix',3:'It sticks'}
const SAID=[
  {id:'n35', name:"Dana's agent", ini:'DO', c:'#EAF3F9', n:35, rule:'A personal spreadsheet'},
  {id:'n42', name:'Account health monitor', ini:'CS', c:'#82B9D9', n:42, rule:'A ticket count'},
  {id:'n17', name:"Tom's workflow", ini:'TR', c:'#82B9D9', n:17, rule:'Usage drop over 40%'},
  {id:'n28', name:'Renewal radar', ini:'RR', c:'#58A2CD', n:28, rule:'A combined score'},
]
const STEPS=[
{act:1, label:'Four numbers', left:'said', leftTitle:"What the team's agents said",
 title:'Last week they gave four different numbers',
 body:'35, 42, 17, and 28. Concord read their chats and logs. It did not run anything.',
 know:'Those numbers were already in Claude chats and one n8n run log. Concord did not ask the question.',
 dwell:4200,
 beats:[
  {t:'ev', id:'n35', side:'be', wait:450},
  {t:'ev', id:'n42', side:'be', wait:450},
  {t:'ev', id:'n17', side:'be', wait:450},
  {t:'ev', id:'n28', side:'be', wait:500},
 ]},
{act:1, label:'Four rules', left:'said', leftTitle:"What the team's agents said",
 title:'Each agent uses a different rule',
 body:'A personal spreadsheet. A ticket count. A usage drop over 40%. A combined score.',
 know:"The rules were read from each agent's instructions. Dana's source is her own spreadsheet.",
 dwell:4800,
 beats:[{t:'ev', id:'rules', side:'be', wait:700}]},
{act:2, label:'Sara picks', left:'said', leftTitle:"What the team's agents said",
 title:'Sara picks one official answer',
 body:'She owns this number. She chooses the renewal agent’s rule. The answer is 28.',
 know:'Sara could write her own or import a certified metric. Choosing one does not edit the agents.',
 dwell:5000,
 beats:[
  {t:'ev', id:'choose', side:'be', wait:800},
  {t:'ev', id:'picked', side:'be', wait:700},
 ]},
{act:3, label:'Dana builds', left:'build', leftTitle:'What Dana sees in Claude',
 title:'Dana starts a new agent',
 body:'She needs an at-risk list. Claude offers the official answer before she pastes her spreadsheet.',
 know:'Concord is available where she builds, so the official answer shows up first. It does not run the agent.',
 dwell:3200,
 beats:[
  {t:'type', id:'u1', side:'chat', text:'I need an at-risk list for this quarter.', wait:280},
  {t:'reply', id:'a1', side:'chat', think:600, wait:900},
  {t:'type', id:'u2', side:'chat', text:'Use the official answer.', wait:220},
  {t:'reply', id:'a2', side:'chat', think:600, wait:500},
 ]},
{act:3, label:'They apply it', left:'n8n', leftTitle:"Tom's n8n workflow",
 title:'The others apply it themselves',
 body:'Each builder gets one suggestion. Day 1 Dana, Day 3 the CS owner, Day 6 Tom.',
 know:'Concord cannot change Tom’s workflow. He clicks Apply. The Slack post stays as it is. Concord checks by reading it again.',
 dwell:4600,
 beats:[
  {t:'ev', id:'vdana', side:'be', wait:900},
  {t:'ev', id:'vcs', side:'be', wait:900},
  {t:'ev', id:'tomapply', side:'chat', wait:400},
  {t:'ev', id:'vtom', side:'be', wait:900},
 ]},
{act:3, label:'All say 28', left:'said', leftTitle:"What the team's agents said",
 title:'Now every agent says 28',
 body:'The four answers match. This job is 100.',
 know:'Concord checked by reading each agent again. It did not run them, and it did not edit them.',
 dwell:4800,
 beats:[{t:'ev', id:'agree', side:'be', wait:800}]},
]
const W={step:-1,beat:0,prog:0,thinking:false,playing:false,speed:1,side:'be',manual:false,timer:null}
let onExplore=()=>{}, root=null
const N=STEPS.length
const ACT_GAP=1400
function localVis(){
  const s=new Set()
  const i=W.step>=N?N-1:W.step
  if(i<0) return s
  const upto=W.step>=N?STEPS[i].beats.length:W.beat
  STEPS[i].beats.slice(0,upto).forEach(b=>s.add(b.id))
  return s
}
function cur(){const st=STEPS[W.step];return st&&W.beat<st.beats.length?st.beats[W.beat]:null}
const later=(f,ms)=>{clearTimeout(W.timer);W.timer=setTimeout(f,ms/W.speed)}
function tick(){if(!W.playing)return;if(!document.getElementById('wv')){pause();return}
 const st=STEPS[W.step];if(!st)return
 if(W.beat>=st.beats.length){
  const next=STEPS[W.step+1]
  const gap=next&&next.act!==st.act?ACT_GAP:0
  later(()=>go(W.step+1),st.dwell+gap);return
 }
 const b=st.beats[W.beat]
 if(b.t==='type'){if(W.prog<b.text.length){W.prog=Math.min(b.text.length,W.prog+2);draw();later(tick,34)}else{W.beat++;W.prog=0;draw();later(tick,b.wait)}}
 else if(b.t==='reply'){if(!W.thinking){W.thinking=true;draw();later(tick,b.think)}else{W.thinking=false;W.beat++;draw();later(tick,b.wait)}}
 else{W.beat++;draw();later(tick,b.wait)}}
function go(i){clearTimeout(W.timer);W.thinking=false;W.prog=0;W.manual=false
 if(i>=N){W.step=N;W.playing=false;draw();return}
 W.step=Math.max(0,i);W.beat=W.playing?0:STEPS[W.step].beats.length;draw();if(W.playing)later(tick,450)}
function play(){if(W.step>=N||W.step<0){W.playing=true;go(0);return}W.playing=true;draw();tick()}
function pause(){W.playing=false;clearTimeout(W.timer);W.thinking=false;draw()}
function leftMode(){if(W.step<0||W.step>=N)return 'said';return STEPS[W.step].left}
function shownStep(){return W.step>=N?N-1:Math.max(0,W.step)}
function counts(V){
  if(W.step>=N||W.step===5||V.has('agree')||V.has('vtom')) return 3
  if(V.has('vcs')) return 2
  if(V.has('vdana')) return 1
  return 0
}
function scores(n){const s=M.storyState(n);return {company:M.companyParts(s).score, job:M.jobScore('Customer health',s)}}
function beatText(id){for(const st of STEPS){const b=st.beats.find(x=>x.id===id);if(b)return b.text||''}return ''}

function saidItems(V){
  const step=shownStep()
  const rules=step>=1
  const won=V.has('picked')||step>2
  const all=step>=5||V.has('agree')
  const hello=all?['Now','Every agent says 28']:step===2?['Sara Klein · Head of RevOps','She owns this number']:step===1?['Four rules','Each agent uses a different one']:['Last week','What the agents told people']
  const shown=SAID.filter(a=>step>0||V.has(a.id))
  const cards=shown.map(a=>{
    const win=all||(won&&a.id==='n28')
    return `<div class="saidc ${win?'ok':''} ${won&&a.id==='n28'&&!all?'pick':''}">${av(a.ini,a.c)}<div class="saidn">${a.name}</div><div class="numxl ${win?'ok':''}">${all?28:a.n}</div>${rules?`<div class="saidr">${all?'Official answer':a.rule}</div>`:''}</div>`
  }).join('')
  const note=won&&!all?`<div class="cnote">${ic('check')}<span>Sara picked the combined score. The official answer is 28.</span></div>`:''
  return [{k:'hello',h:`<div class="chello"><b>${hello[0]}</b><span>${hello[1]}</span></div>`},{k:'board',h:`<div class="said">${cards}</div>${note}`}]
}
function chatItems(V){
  const it=[], c=cur(), mode=leftMode()
  const A=(id,h)=>it.push({k:id,h})
  const um=(id,txt)=>A(id,`<div class="cm u"><div class="cb">${txt}</div>${av('DO','#EAF3F9')}</div>`)
  const am=(id,h)=>A(id,`<div class="cm a"><span class="cav">${ic('spark')}</span><div class="cb">${h}</div></div>`)
  if(mode==='n8n'){
    const applied=V.has('tomapply')||V.has('vtom')
    A('n8nhead',`<div class="chello"><b>CSM weekly risk digest</b><span>Tom's workflow · he applies the suggestion</span></div>`)
    A('suggest',`<div class="cnote">${ic('link')}<span>Suggested change from Sara Klein. Tom applies it. Concord cannot edit this.</span></div>`)
    const nodes=[['Every Monday',''],['Get usage',''],[applied?'Official answer · 28':'Usage drop over 40%',applied?'ok':'hot'],['Post to #cs-risk','stay']]
    A('flow',`<div class="flow">${nodes.map(([s,cl],i)=>`<div class="fn ${cl}">${s}${cl==='stay'?'<small>unchanged</small>':''}</div>${i<nodes.length-1?'<span class="fa">→</span>':''}`).join('')}</div>`)
    if(applied) A('applied',`<div class="cnote">${ic('check')}<span>Tom applied it. The Slack post is unchanged.</span></div>`)
    return it
  }
  if(mode==='build'){
    A('hello',`<div class="chello"><b>New at-risk agent</b><span>Dana is building</span></div>`)
    if(V.has('u1')) um('u1',beatText('u1'))
    if(V.has('a1')) am('a1',`<div class="offer"><div class="numxl ok">28</div><div class="offerl">The official at-risk answer</div><div>Use it instead of your spreadsheet?</div></div>`)
    if(V.has('u2')) um('u2',beatText('u2'))
    if(V.has('a2')) am('a2',`<div class="big ok">Added.</div>The answer on record is 28.`)
    if(c&&c.t==='reply'&&W.thinking) A('think',`<div class="cm a"><span class="cav">${ic('spark')}</span><div class="cb typing"><span></span><span></span><span></span></div></div>`)
    return it
  }
  return saidItems(V)
}
function numberCards(ok){
  return `<div class="cmp">${SAID.map(a=>`<div class="cc ${ok?'ok':''}"><div class="ccn">${ok?28:a.n}</div><div class="cch">${av(a.ini,a.c)}<b>${a.name}</b></div></div>`).join('')}</div>`
}
function beItems(V){
  const it=[], step=shownStep()
  const A=(k,ico,tone,title,sub,card='')=>it.push({k,h:`<div class="ev ${tone}"><span class="evi">${ic(ico)}</span><div class="evb"><div class="evt">${title}</div>${sub?`<div class="evs">${sub}</div>`:''}${card}</div></div>`})
  if(step===0){
    const cards=SAID.filter(a=>V.has(a.id))
    if(cards.length) A('nums','layers','','Four different answers','Read from chats and logs. Nothing was run.',`<div class="cmp">${cards.map(a=>`<div class="cc"><div class="ccn">${a.n}</div><div class="cch">${av(a.ini,a.c)}<b>${a.name}</b></div></div>`).join('')}</div>`)
  }else if(step===1){
    if(V.has('rules')) A('rules','eye','','Why the numbers differ','One short rule each.',`<div class="rules">${SAID.map(a=>`<div class="rule"><em>${a.n}</em><b>${a.rule}</b><span>${a.name}</span></div>`).join('')}</div>`)
  }else if(step===2){
    if(V.has('choose')){
      const picked=V.has('picked')
      A('choose','user','','Sara Klein, Head of RevOps','She owns this number. She picks one rule.',`<div class="opts">${SAID.map(a=>`<div class="opt ${picked&&a.id==='n28'?'on':''}"><span class="rad"></span><b>${a.rule}</b><em>${a.n}</em></div>`).join('')}</div>${picked?'<div class="picked28"><div class="numxl ok">28</div><span>Official answer</span></div>':''}`)
    }
  }else if(step===3){
    if(V.has('u1')) A('dstart','spark','','Dana is building a new agent','She asked for an at-risk list.')
    if(V.has('a1')) A('doffer','check','ok', V.has('a2')?'Dana used the official answer':'Official answer offered first', V.has('a2')?'The answer on record is 28.':'Before any spreadsheet.', `<div class="picked28"><div class="numxl ok">28</div><span>${V.has('a2')?'On record':'Offered first'}</span></div>`)
  }else if(step===4){
    if(V.has('vdana')){
      const n=counts(V)
      const rows=[['Day 1','Dana',n>=1],['Day 3','CS owner',n>=2],['Day 6','Tom',n>=3]]
      A('adopt','check','ok', n>=3?'All three applied it':'They apply it themselves','One suggestion each. They click it themselves.',`<div class="adopt"><div class="adoptn">${n}<span>/3</span></div><ol>${rows.map(([d,w,on])=>`<li class="${on?'on':''}"><b>${d}</b> ${w}</li>`).join('')}</ol></div>`)
    }
  }else if(V.has('agree')){
    A('agree','check','ok','Everyone says 28','This job is 100.', numberCards(true)+`<div class="flagrow">${status('sync','In sync')}</div>`)
  }
  return it
}
function sync(el,items){const ch=[...el.children];let i=0;while(i<ch.length&&i<items.length&&ch[i].dataset.k===items[i].k)i++
 ch.slice(i).forEach(c=>c.remove());items.forEach((it,j)=>{let n=el.children[j];if(n){if(n._h!==it.h){n.innerHTML=it.h;n._h=it.h}}else{n=document.createElement('div');n.dataset.k=it.k;n.className='wi';n.innerHTML=it.h;n._h=it.h;el.appendChild(n);el._new=true}})}
const setH=(el,h)=>{if(el&&el._h!==h){el.innerHTML=h;el._h=h}}
function caption(){
  if(W.step<0) return `<div class="wk">Guided story · about a minute</div><div class="wt">Four answers, then one.</div><div class="wb">Last week, four agents gave 35, 42, 17, and 28. Sara picks one official answer. The next time Dana builds, she is offered it first.</div>`
  if(W.step>=N) return `<div class="wk">Done</div><div class="wt">Every agent says 28</div><div class="wb">Sara picked one answer. Dana was offered it while she built. Tom and the others applied it themselves.</div>`
  const st=STEPS[W.step]
  return `<div class="wk">Act ${st.act} · ${ACT[st.act]} · ${st.label}</div><div class="wt">${st.title}</div><div class="wb">${st.body}</div><details class="wknow"><summary>How Concord knows</summary><p>${st.know}</p></details>`
}
function draw(){
  root=document.getElementById('wv');if(!root)return
  const V=localVis(),c=cur(),st=STEPS[W.step],mode=leftMode()
  if(!W.manual){const last=c||(st&&st.beats[st.beats.length-1]);if(last&&last.side)W.side=last.side;else W.side=mode==='build'||mode==='n8n'?'chat':'be'}
  root.dataset.side=W.side;root.dataset.left=mode;root.dataset.state=W.step<0?'intro':W.step>=N?'done':'run'
  setH(root.querySelector('.wv-steps'),STEPS.map((s,i)=>`<button class="ws-i ${i<W.step?'done':i===W.step?'on':''}" data-wgo="${i}" title="${s.label}"><span class="wn">${i<W.step||W.step>=N?'✓':i+1}</span><span class="wl">${s.label}</span></button>`).join(''))
  const pct=W.step<0?0:W.step>=N?100:((W.step+(st?W.beat/st.beats.length:0))/N*100)
  root.querySelector('.wv-prog span').style.width=pct+'%'
  setH(root.querySelector('.wv-cap'),caption())
  setH(root.querySelector('.wv-btns'),`<button class="wc" data-w="back" ${W.step<=0?'disabled':''} title="Previous step">${ic('back')}</button><button class="wc main" data-w="toggle" title="${W.playing?'Pause':'Play'}">${W.playing?ic('pause'):ic('play')}<span>${W.playing?'Pause':W.step<0?'Start':W.step>=N?'Replay':'Play'}</span></button><button class="wc" data-w="next" ${W.step>=N?'disabled':''} title="Next step">${ic('next')}</button><button class="wc" data-w="restart" title="Restart">${ic('redo')}</button><button class="wc spd" data-w="speed" title="Playback speed">${W.speed}×</button>`)
  const leftTab=mode==='n8n'?"Tom's workflow":mode==='build'?'Dana in Claude':'What they said'
  setH(root.querySelector('.wv-tabs'),`<button data-wside="chat" class="${W.side==='chat'?'on':''}">${leftTab}${c&&c.side==='chat'&&W.side!=='chat'?'<i></i>':''}</button><button data-wside="be" class="${W.side==='be'?'on':''}">What Concord sees${c&&c.side==='be'&&W.side!=='be'?'<i></i>':''}</button>`)
  const actN=st?st.act:W.step>=N?3:1
  const titles={said:[ic('layers'),st?st.leftTitle:"What the team's agents said"],build:[ic('spark'),'What Dana sees in Claude'],n8n:[ic('flow'),"Tom's n8n workflow"]}
  const hd=titles[mode]
  const who=mode==='n8n'?av('TR','#82B9D9'):mode==='build'?av('DO','#EAF3F9'):''
  setH(root.querySelector('.wleft-hd'),`<span class="cav">${hd[0]}</span><div class="wleft-titles"><div class="wact">Act ${actN} · ${ACT[actN]}</div><h3>${hd[1]}</h3></div>${who?`<span class="r">${who}</span>`:''}`)
  const ch=root.querySelector('.cmsgs'),be=root.querySelector('.elog')
  sync(ch,chatItems(V));sync(be,beItems(V))
  const comp=root.querySelector('.ccomp-t'),typing=mode==='build'&&c&&c.t==='type'
  comp.innerHTML=typing?c.text.slice(0,W.prog).replace(/</g,'&lt;')+'<span class="caret"></span>':mode==='build'?'<span class="ph">Message Claude…</span>':mode==='n8n'?'<span class="ph">Tom edits this. Concord cannot.</span>':'<span class="ph">Read-only · Concord is not sending this</span>'
  root.querySelector('.ccomp').classList.toggle('active',!!typing)
  for(const el of [ch,be]){if(el._new||typing){el.scrollTo({top:el.scrollHeight,behavior:W.playing?'smooth':'auto'});el._new=false}}
  const n=counts(V), sc=scores(n>0?n:-1)
  root.querySelector('.am-bar span').style.width=(n?n/3*100:0)+'%'
  const head=W.step>=5||V.has('agree')?`<b>Customer health is ${sc.job}</b>`:n?`<b>Applied ${n}/3</b>`:W.step===3?`<b>Offered to Dana</b>`:W.step===2?`<b>Official answer 28</b>`:`<b>Four different answers</b>`
  setH(root.querySelector('.am-t'),head)
  setH(root.querySelector('.am-s'),`Company <b class="${sc.company>M.INITIAL.score?'up':''}">${sc.company}</b>`)
  setH(root.querySelector('.wv-over'),W.step<0?intro():W.step>=N?wrap(scores(3)):'')
}
function intro(){return `<div class="wcard"><div class="wbadge">${ic('play')} Watch it live</div><h2>Four answers, then one.</h2><p>Last week, four agents gave 35, 42, 17, and 28. Sara picks one official answer. The next time Dana builds, she is offered it first. Then the others apply it themselves.</p><div class="wsteps2"><span>1 · The four numbers</span><span>2 · Sara picks one</span><span>3 · It sticks</span></div><button class="btn p big" data-w="toggle">${ic('play')} Start · about a minute</button><div class="dim" style="margin-top:10px;font-size:12px">Pause, step back, or skip anytime.</div></div>`}
function wrap(sc){return `<div class="wcard wrapc"><div class="wbadge ok">${ic('check')} Every agent says 28</div><h2>Every agent says 28</h2><div class="ba"><div class="b4"><div class="bal">Last week</div><div class="bav">35 · 42 · 17 · 28</div><div class="bas">Four different answers</div></div><div class="barr">→</div><div class="b4 after"><div class="bal">Now</div><div class="bav">28</div><div class="bas">This job is 100 · company ${M.INITIAL.score} → ${sc.company}</div></div></div><p>Sara picked one answer. Dana was offered it while she built. Tom and the others applied it themselves.</p><div class="wacts"><button class="btn p big" data-w="explore">Explore the full app →</button><button class="btn big" data-w="restart">${ic('redo')} Watch again</button></div></div>`}
export function watchPage(alreadyDecided){
  return `<div class="page wpage"><div id="wv" class="wv" data-side="be" data-left="said">
<div class="wv-head"><div><h1>Watch it live</h1><p class="sub" style="margin:0">Four answers last week. Sara picks one. The next person to build is offered it first.</p></div><span class="tag">Guided story · demo data</span></div>
${alreadyDecided?'<div class="wbanner">Customer health is already decided in this workspace. This story will not overwrite that decision.</div>':''}
<div class="wv-steps"></div><div class="wv-prog"><span></span></div>
<div class="wv-narr"><div class="wv-cap"></div><div class="wv-btns"></div></div>
<div class="wv-tabs"></div>
<div class="wv-split"><section class="card wchat"><div class="hd wleft-hd"></div><div class="cmsgs"></div><div class="ccomp"><div class="ccomp-t"></div><button class="csend" tabindex="-1">↑</button></div></section>
<section class="card wbe"><div class="hd">${mark(16)}<h3>What Concord sees</h3><span class="r am-s"></span></div><div class="am"><div class="am-t"></div><div class="am-bar"><span></span></div></div><div class="elog"></div></section>
<div class="wv-over"></div></div></div></div>`}
export function mountWatch(opts){onExplore=opts.onExplore||opts;requestAnimationFrame(()=>{draw();if(W.playing)tick()})}
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
