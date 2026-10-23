import {chromium} from 'playwright'
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:800},recordVideo:{dir:'/tmp/vid',size:{width:1280,height:800}}})
await ctx.addInitScript(()=>{addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent=`#fc{position:fixed;left:0;top:0;width:22px;height:22px;z-index:9999;pointer-events:none;transition:transform .9s cubic-bezier(.45,.05,.25,1)}
#fc svg{filter:drop-shadow(0 2px 4px rgba(0,0,0,.6))}.rip{position:fixed;width:40px;height:40px;margin:-20px 0 0 -20px;border-radius:50%;border:2px solid #9d90ff;background:rgba(124,108,255,.25);z-index:9998;pointer-events:none;animation:rp .6s ease-out forwards}@keyframes rp{from{transform:scale(.3);opacity:1}to{transform:scale(1.6);opacity:0}}
#cap{position:fixed;left:50%;bottom:34px;transform:translateX(-50%) translateY(10px);z-index:9997;background:rgba(14,15,20,.92);border:1px solid rgba(255,255,255,.12);color:#fff;font:500 19px Inter,system-ui,sans-serif;padding:12px 22px;border-radius:12px;opacity:0;transition:all .45s;box-shadow:0 12px 40px rgba(0,0,0,.5);max-width:80%;text-align:center;backdrop-filter:blur(8px)}#cap.on{opacity:1;transform:translateX(-50%)}#cap b{color:#b3a9ff}`
document.head.append(s);const c=document.createElement('div');c.id='fc';c.innerHTML='<svg width="22" height="22" viewBox="0 0 24 24"><path d="M4 2l16 10-7 1.5L9.5 21z" fill="#fff" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/></svg>';c.style.transform='translate(640px,400px)';document.body.append(c);const k=document.createElement('div');k.id='cap';document.body.append(k)})})
const p=await ctx.newPage();const W=ms=>p.waitForTimeout(ms);let pos=[640,400]
const cap=async t=>{await p.evaluate(t=>{const c=document.getElementById('cap');c.classList.remove('on');setTimeout(()=>{c.innerHTML=t;if(t)c.classList.add('on')},t?250:0)},t);await W(300)}
const move=async(x,y)=>{await p.evaluate(([x,y])=>document.getElementById('fc').style.transform=`translate(${x}px,${y}px)`,[x,y]);pos=[x,y];await W(1000)}
const click=async sel=>{const bb=await p.locator(sel).first().boundingBox();const x=bb.x+bb.width/2,y=bb.y+bb.height/2;await move(x,y);await p.evaluate(([x,y])=>{const r=document.createElement('div');r.className='rip';r.style.left=x+'px';r.style.top=y+'px';document.body.append(r);setTimeout(()=>r.remove(),700)},[x,y]);await p.mouse.click(x,y);await W(250)}
const scroll=async(sel,to)=>{await p.evaluate(([s,to])=>{const e=s?document.querySelector(s):document.scrollingElement;e.scrollTo({top:to,behavior:'smooth'})},[sel,to]);await W(1200)}
await p.goto('http://localhost:4173/#/overview');await W(800)
await cap('<b>Northwind</b> builds agents in 2 places, <b>Claude</b> and <b>n8n</b>. Concord sees all 47 as one inventory.');await move(300,150);await W(2500)
await cap('The <b>consistency score</b>: how often agents doing the same job give the same answer.');await move(290,300);await W(3200)
await cap('9 agents have no owner. 7 conflicts are open.');await move(900,140);await W(2500)
await click('a.nav[data-nav="conflicts"]');await cap('Each conflict is routed to an owner. Here: <b>Customer health, 3 definitions</b>.');await W(2800)
await move(820,115);await cap('Asked the same question, the agents disagree: <b>42 vs 17 vs 28</b> customers.');await W(3500)
await move(520,330);await W(700);await move(900,330);await W(1600)
await cap('Agents built in Claude and n8n, by different people, doing the same job differently.');await move(560,290);await W(3000)
await cap('Impact: <b>$1.9M ARR</b> sits in accounts the agents can\'t agree on.');await move(520,440);await W(2800)
await cap('Sara, the owner, picks the official version.');await click('#mkoff');await W(600)
await cap('Published as <b>Customer health v2</b>. Every agent rewires to it over MCP.');await W(3400)
await cap('<b>Answers converge: 28, 28, 28.</b>');await move(640,260);await W(2600)
await click('a.nav[data-nav="overview"]');await cap('The consistency score jumps <b>71 → 86</b>.');await move(280,300);await W(3600)
await click('a.nav[data-nav="blocks"]');await cap('Owners see adoption and rewire status for every official block.');await move(760,200);await W(3200)
await click('a.nav[data-nav="live"]');await cap('Now the key moment. Dana in Marketing builds an agent in <b>Claude</b>.');await W(1500)
await click('#lplay');await W(2200);await cap('Behind the scenes, Concord recognizes the job and finds 3 overlapping agents…');await move(800,250);await W(2600)
await cap('…and builds Dana\'s agent on the <b>official Customer health v2</b> block.');await move(800,320);await W(3000)
await cap('Dana never sees Concord. Her agent answers <b>28</b>, like everyone else\'s.');await move(390,240);await W(3800)
await click('a.nav[data-nav="agents"]');await cap('Every agent, wherever it was built, in one inventory.');await click('tr[data-agent="0"]');await W(2600)
await click('.drawer .iconbtn');await click('a.nav[data-nav="overview"]')
await cap('Security tools ask if an agent is safe.<br/><b>Concord asks if all your agents give the same answer.</b>');await move(640,330);await W(5500)
await cap('');await W(800)
const v=p.video();await ctx.close();await v.saveAs('/tmp/raw.webm');await b.close()
