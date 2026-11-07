// Records the hands-on onboarding (landing -> connect -> scan -> search -> resolve -> dashboard).
// Usage: node video-onboarding.mjs [desktop|phone]  then encode with the ffmpeg line printed at the end. Needs `npm run preview` on :4173.
import {chromium} from 'playwright'
import fs from 'fs'
const MODE=process.argv[2]||'desktop',PH=MODE==='phone',U='http://localhost:4173/app/'
const Z=PH?2:1.5,VP=PH?{width:780,height:1688}:{width:1920,height:1200}
const DIR=`/tmp/obframes-${MODE}`;fs.rmSync(DIR,{recursive:true,force:true});fs.mkdirSync(DIR)
const b=await chromium.launch();const ctx=await b.newContext({viewport:VP,deviceScaleFactor:1})
await ctx.addInitScript(([Z,PH])=>{addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent=`#fc{position:fixed;left:0;top:0;width:${22*Z}px;height:${22*Z}px;z-index:9999;pointer-events:none;transition:transform .6s cubic-bezier(.45,.05,.25,1)}
#fc svg{filter:drop-shadow(0 2px 4px rgba(0,0,0,.6))}.rip{position:fixed;width:40px;height:40px;margin:-20px 0 0 -20px;border-radius:50%;border:2px solid #9d90ff;background:rgba(124,108,255,.25);z-index:9998;pointer-events:none;animation:rp .6s ease-out forwards}@keyframes rp{from{transform:scale(.3);opacity:1}to{transform:scale(1.6);opacity:0}}
body{padding-bottom:${110*Z}px}#cap{pointer-events:none;position:fixed;left:50%;bottom:${28*Z}px;transform:translateX(-50%) translateY(10px);z-index:9997;background:rgba(14,15,20,.95);border:1px solid rgba(255,255,255,.16);color:#fff;font:500 ${(PH?15:18)*Z}px Inter,system-ui,sans-serif;padding:${12*Z}px ${20*Z}px;border-radius:${12*Z}px;opacity:0;transition:all .45s;box-shadow:0 12px 40px rgba(0,0,0,.5);width:max-content;max-width:88%;text-align:center;line-height:1.4}#cap.on{opacity:1;transform:translateX(-50%)}#cap b{color:#b3a9ff}`
document.head.append(s);const c=document.createElement('div');c.id='fc';c.innerHTML=`<svg width="${22*Z}" height="${22*Z}" viewBox="0 0 24 24"><path d="M4 2l16 10-7 1.5L9.5 21z" fill="#fff" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/></svg>`;c.style.transform=`translate(${innerWidth/2}px,${innerHeight/2}px)`;document.body.append(c);const k=document.createElement('div');k.id='cap';document.body.append(k);document.getElementById('app').style.zoom=Z;document.documentElement.style.setProperty('--vh',innerHeight/Z+'px');document.documentElement.style.setProperty('--vw',innerWidth/Z+'px')
// #app is zoomed, so make width media queries see the zoomed (CSS) width: scale their px values by Z
const done=new WeakSet(),fix=()=>{for(const sh of document.styleSheets){let rs;try{rs=sh.cssRules}catch(e){continue}for(const r of rs){if(r instanceof CSSMediaRule&&!done.has(r)&&/width/.test(r.media.mediaText)){done.add(r);r.media.mediaText=r.media.mediaText.replace(/(\d+(?:\.\d+)?)px/g,(m,n)=>n*Z+'px')}}}};fix();addEventListener('load',fix)})},[Z,PH])
const p=await ctx.newPage();const F=0.75,W=ms=>p.waitForTimeout(ms*F)  // F: global pacing factor
const cdp=await ctx.newCDPSession(p);const frames=[];let n=0
cdp.on('Page.screencastFrame',async f=>{const file=`${DIR}/f${String(n++).padStart(5,'0')}.jpg`;fs.writeFileSync(file,Buffer.from(f.data,'base64'));frames.push([file,f.metadata.timestamp]);cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId}).catch(()=>{})})
const cap=async t=>{await p.evaluate(t=>{const c=document.getElementById('cap');c.classList.remove('on');setTimeout(()=>{c.innerHTML=t;if(t)c.classList.add('on')},t?250:0)},t);await W(300)}
const move=async(x,y)=>{await p.evaluate(([x,y])=>document.getElementById('fc').style.transform=`translate(${x}px,${y}px)`,[x,y]);await W(850)}
const scrollY=async(y,ms=900)=>{await p.evaluate(y=>scrollTo({top:y,behavior:'smooth'}),y);await W(ms)}
// smooth-scroll an element into the comfortable middle band of the screen (caption sits at the bottom)
const ensure=async sel=>{const r=await p.evaluate(sel=>{const e=document.querySelector(sel);const b=e.getBoundingClientRect();return{t:b.top,b:b.bottom,h:innerHeight,y:scrollY}},sel);if(r.t<90||r.b>r.h*0.78){await scrollY(Math.max(0,r.y+r.t-r.h*0.35))}}
const click=async sel=>{await p.waitForSelector(sel);await ensure(sel);const bb=await p.locator(sel).first().boundingBox();const x=bb.x+bb.width/2,y=bb.y+bb.height/2;await move(x,y);await p.evaluate(([x,y])=>{const r=document.createElement('div');r.className='rip';r.style.left=x+'px';r.style.top=y+'px';document.body.append(r);setTimeout(()=>r.remove(),700)},[x,y]);await p.mouse.click(x,y);await W(300)}
const type=async(sel,t)=>{await click(sel);await p.fill(sel,'');await p.locator(sel).pressSequentially(t,{delay:55});await W(400)}
await p.goto(U);await p.evaluate(()=>localStorage.clear());await p.reload();await W(700)
await p.evaluate(()=>{const d=document.createElement('div');d.style.cssText='position:fixed;right:0;bottom:0;width:1px;height:1px;z-index:99999;opacity:.01';document.body.append(d);let i=0;setInterval(()=>{d.style.background=(i++%2)?'#000':'#010101'},40)})
await cdp.send('Page.startScreencast',{format:'jpeg',quality:90,everyNthFrame:1});await W(400)
// 1. landing
await move(VP.width*0.55,VP.height*0.35);await cap('Employees build agents in <b>Claude</b> and <b>n8n</b>. Concord makes agents doing the same job give the same answer.');await W(3600)
const H=await p.evaluate(()=>innerHeight);const sec=async s=>p.evaluate(s=>{const e=document.querySelector(s);return e?e.getBoundingClientRect().top+scrollY-40:0},s)
await cap('');await scrollY(await sec('#product'),1300);await cap('The problem: four agents, one question, four answers.');await W(2600)
await scrollY(await sec('#how'),1300);await cap('How it works: connect read-only, map, catch conflicts, the owner decides.');await W(2800)
await cap('');await scrollY(0,1300);await cap('Let\'s do it hands-on. <b>Get started.</b>');await W(800)
await click('.lhero a[href="#/start"]');await W(900)
// 2. workspace
await cap('Create the workspace. Prefilled with the fictional Northwind.');await W(1600);await click('[data-obws]');await W(900)
// 3. connect
await cap('Connect Claude with the <b>Compliance API</b>: a read-only key from the Primary Owner.');await click('[data-connect=claude]');await W(2600)
await click('[data-cauth]');await p.waitForSelector('.modal',{state:'detached',timeout:5000});await W(500)
await cap('Connect n8n with an API key, then test the connection.');await click('[data-connect=n8n]');await W(1400);await click('[data-ntest]')
await p.waitForSelector('[data-nsave]:not([disabled])');await W(900);await click('[data-nsave]');await p.waitForSelector('.modal',{state:'detached',timeout:4000});await W(700)
await cap('Both tools connected, read-only. Concord never writes to them.');await W(1600);await click('.obfoot [data-obgo=scan]');await W(800)
// 4. scan
await cap('Scan: Concord discovers every agent and groups them by the job they do.');await click('[data-scan]');await W(PH?3500:5000)
if(PH){await scrollY(await sec('#jobs'),1200);await W(3200)}
await p.waitForSelector('#toSearch:not([disabled])',{timeout:40000});await cap('<b>20 agents, 8 jobs, 6 conflicts.</b> Read from instructions and logs. No agent was run.');await W(PH?1500:2200)
if(PH){await scrollY(await sec('#confl'),1200);await W(1800)}
await click('#toSearch');await W(800)
// 5. search
await cap('Search with a plain question...');await type('#sq','how much revenue do we have');await W(2200)
await cap('...or a business term, even with typos. Every agent doing that job, side by side.');await type('#sq','custmer helth');await W(2400)
if(PH){await scrollY(await sec('.sg'),1100);await W(2000)}
// 6. resolve
await cap('As the owner, resolve it.');await click('[data-resolve=c1]');await W(1100)
await cap('Compare the definitions. Write your own, import one, or mark a valid variant.');await click('[data-rpick="3"]');await W(1300);await click('[data-rnext]');await W(700)
await cap('Add a reason. Builders will see it.');await click('[data-rchip]');await W(1100)
await cap('Publish it as an official block over <b>MCP</b>.');await click('[data-rpublish]');await W(1600)
await cap('Send the suggested change. Builders apply it. Concord re-reads.');await click('[data-rsuggest]');await W(1000);if(PH)await scrollY(0,900)
await p.waitForSelector('.rdone',{timeout:15000});await W(500);await cap('Every agent now says <b>28</b>. This job is <b>100</b>. Company score <b>53 → 68</b>.');await W(PH?1200:2400)
if(PH){await ensure('.rdone');await W(1300)}
// 7. dashboard
await click('[data-obfinish]');await W(700);await cap('The dashboard reflects what you did. Checklist done.');await W(3000)
await cap('Next: the <b>Walkthrough</b>, one click at a time.');await move(...await p.evaluate(()=>{const e=[...document.querySelectorAll('a[href="#/watch"]')].find(x=>x.offsetParent&&x.getBoundingClientRect().top>0);const b=e.getBoundingClientRect();return[b.x+b.width/2,b.y+b.height/2]}));await W(2600)
await cap('Security tools ask if an agent is safe.<br/><b>Concord asks if all your agents give the same answer.</b>');await W(3800);await cap('');await W(500)
await cdp.send('Page.stopScreencast');await W(300);await b.close()
let list='';for(let i=0;i<frames.length;i++){const d=i<frames.length-1?Math.max(0.001,frames[i+1][1]-frames[i][1]):0.5;list+=`file '${frames[i][0]}'\nduration ${d.toFixed(4)}\n`}
list+=`file '${frames.at(-1)[0]}'\n`;fs.writeFileSync(`${DIR}/list.txt`,list);console.log(MODE,'frames',frames.length,'span',(frames.at(-1)[1]-frames[0][1]).toFixed(1)+'s')
