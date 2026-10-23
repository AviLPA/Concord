// Records the walkthrough with crisp CDP screencast frames. Usage: node video.mjs [desktop|phone]
import {chromium} from 'playwright'
import fs from 'fs'
const MODE=process.argv[2]||'desktop',PH=MODE==='phone'
const Z=PH?2:1.5,VP=PH?{width:780,height:1688}:{width:1920,height:1200},DSF=1
const DIR=`/tmp/frames-${MODE}`;fs.rmSync(DIR,{recursive:true,force:true});fs.mkdirSync(DIR)
const b=await chromium.launch();const ctx=await b.newContext({viewport:VP,deviceScaleFactor:DSF,hasTouch:false})
await ctx.addInitScript(([Z,PH])=>{addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent=`#fc{position:fixed;left:0;top:0;width:${22*Z}px;height:${22*Z}px;z-index:9999;pointer-events:none;transition:transform .8s cubic-bezier(.45,.05,.25,1)}
#fc svg{filter:drop-shadow(0 2px 4px rgba(0,0,0,.6))}.rip{position:fixed;width:40px;height:40px;margin:-20px 0 0 -20px;border-radius:50%;border:2px solid #9d90ff;background:rgba(124,108,255,.25);z-index:9998;pointer-events:none;animation:rp .6s ease-out forwards}@keyframes rp{from{transform:scale(.3);opacity:1}to{transform:scale(1.6);opacity:0}}
#cap{position:fixed;left:50%;bottom:${28*Z}px;transform:translateX(-50%) translateY(10px);z-index:9997;background:rgba(14,15,20,.94);border:1px solid rgba(255,255,255,.14);color:#fff;font:500 ${18*Z}px Inter,system-ui,sans-serif;padding:${12*Z}px ${20*Z}px;border-radius:${12*Z}px;opacity:0;transition:all .45s;box-shadow:0 12px 40px rgba(0,0,0,.5);width:max-content;max-width:86%;text-align:center;line-height:1.4}#cap.on{opacity:1;transform:translateX(-50%)}#cap b{color:#b3a9ff}`
document.head.append(s);const c=document.createElement('div');c.id='fc';c.innerHTML='<svg width="${22*Z}" height="${22*Z}" viewBox="0 0 24 24"><path d="M4 2l16 10-7 1.5L9.5 21z" fill="#fff" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/></svg>';c.style.transform=`translate(${innerWidth/2}px,${innerHeight/2}px)`;document.body.append(c);const k=document.createElement('div');k.id='cap';document.body.append(k);const a=document.getElementById('app');a.style.zoom=Z;document.documentElement.style.setProperty('--vh',innerHeight/Z+'px');if(PH){const x=document.createElement('style');x.textContent='.pill-demo{display:none}.g4{grid-template-columns:1fr 1fr}';document.head.append(x)}})},[Z,PH])
const p=await ctx.newPage();const W=ms=>p.waitForTimeout(ms)
const cdp=await ctx.newCDPSession(p);const frames=[];let n=0
cdp.on('Page.screencastFrame',async f=>{const file=`${DIR}/f${String(n++).padStart(5,'0')}.jpg`;fs.writeFileSync(file,Buffer.from(f.data,'base64'));frames.push([file,f.metadata.timestamp]);cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId}).catch(()=>{})})
const cap=async t=>{await p.evaluate(t=>{const c=document.getElementById('cap');c.classList.remove('on');setTimeout(()=>{c.innerHTML=t;if(t)c.classList.add('on')},t?250:0)},t);await W(300)}
const move=async(x,y)=>{await p.evaluate(([x,y])=>document.getElementById('fc').style.transform=`translate(${x}px,${y}px)`,[x,y]);await W(900)}
const click=async sel=>{const bb=await p.locator(sel).first().boundingBox();const x=bb.x+bb.width/2,y=bb.y+bb.height/2;await move(x,y);await p.evaluate(([x,y])=>{const r=document.createElement('div');r.className='rip';r.style.transform='';r.style.left=x+'px';r.style.top=y+'px';document.body.append(r);setTimeout(()=>r.remove(),700)},[x,y]);await p.mouse.click(x,y);await W(300)}
// keep a tiny ticking element so the screencast emits frames steadily even when the page is still
await p.goto('http://localhost:4173/#/overview');await W(400)
await p.evaluate(()=>{const d=document.createElement('div');d.style.cssText='position:fixed;right:0;bottom:0;width:1px;height:1px;z-index:99999;opacity:.01';document.body.append(d);let i=0;setInterval(()=>{d.style.background=(i++%2)?'#000':'#010101'},40)})
await cdp.send('Page.startScreencast',{format:'jpeg',quality:90,everyNthFrame:1})
await W(500)
await cap(PH?'Northwind builds agents in <b>Claude</b> and <b>n8n</b>.':'Northwind builds agents in 2 places, <b>Claude</b> and <b>n8n</b>. Concord sees them as one inventory.');await move(VP.width*0.4,VP.height*0.3);await W(2800)
await cap('Start here: watch someone build an agent, live.');await W(1200);await click('.hero [data-startwatch]');await cap('');await W(1500)
await click('.wcard [data-w=toggle]')
await p.waitForSelector('.wrapc',{timeout:120000});await W(2600)
await click('.wrapc [data-w=explore]');await cap('Back in the app: company score <b>53 → 68</b>. Concord re-read the agents. It did not edit them.');await W(3800)
if(PH){await p.evaluate(()=>scrollTo({top:1040,behavior:'smooth'}));await W(1800);await p.evaluate(()=>scrollTo({top:0,behavior:'smooth'}));await W(900)}
await p.goto('http://localhost:4173/#/conflicts/c1').catch(()=>{});await cap('The conflict is resolved, with every agent on the official definition.');await W(3600)
await cap('Security tools ask if an agent is safe.<br/><b>Concord asks if all your agents give the same answer.</b>');await W(4200);await cap('');await W(600)
await cdp.send('Page.stopScreencast');await W(300);await b.close()
// build concat list with real durations
let list='';for(let i=0;i<frames.length;i++){const d=i<frames.length-1?Math.max(0.001,frames[i+1][1]-frames[i][1]):0.5;list+=`file '${frames[i][0]}'\nduration ${d.toFixed(4)}\n`}
list+=`file '${frames.at(-1)[0]}'\n`;fs.writeFileSync(`${DIR}/list.txt`,list);console.log(MODE,'frames',frames.length,'span',(frames.at(-1)[1]-frames[0][1]).toFixed(1)+'s')
