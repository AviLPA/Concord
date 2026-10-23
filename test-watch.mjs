import {chromium} from 'playwright'
const b=await chromium.launch();const errs=[]
async function run(name,vp,dsf){const p=await b.newPage({viewport:vp,deviceScaleFactor:dsf});p.on('pageerror',e=>errs.push(name+': '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(name+' console: '+m.text())})
 await p.goto('http://localhost:4173/#/overview');await p.waitForTimeout(500);await p.screenshot({path:`/tmp/t-${name}-0-home.png`})
 await p.click('.hero [data-startwatch]');await p.waitForTimeout(500);await p.screenshot({path:`/tmp/t-${name}-1-intro.png`})
 await p.click('.wcard [data-w=toggle]');
 const t0=Date.now();const marks=[[4500,'1b-step1'],[9000,'2-step2'],[22000,'3-step4'],[33000,'4-step5'],[50000,'5-step7'],[60000,'6-step8']]
 for(const [ms,l] of marks){await p.waitForTimeout(ms-(Date.now()-t0));const st=await p.$eval('.wk',e=>e.textContent);console.log(name,l,(Date.now()-t0)/1000,st);await p.screenshot({path:`/tmp/t-${name}-${l}.png`})}
 await p.waitForSelector('.wrapc',{timeout:40000});console.log(name,'wrap at',(Date.now()-t0)/1000);await p.waitForTimeout(600);await p.screenshot({path:`/tmp/t-${name}-7-wrap.png`})
 // controls: restart, pause, next, back
 await p.click('.wrapc [data-w=restart]');await p.waitForTimeout(1500);await p.click('[data-w=toggle]');const s1=await p.$eval('.wk',e=>e.textContent);
 await p.click('[data-w=next]');await p.click('[data-w=next]');await p.click('[data-w=next]');const s2=await p.$eval('.wk',e=>e.textContent);const n2=await p.$$eval('.elog .wi',e=>e.length)
 await p.click('[data-w=back]');const s3=await p.$eval('.wk',e=>e.textContent);await p.click('[data-w=speed]');const sp=await p.$eval('.spd',e=>e.textContent)
 console.log(name,'controls',s1,'|',s2,n2,'events |',s3,'| speed',sp)
 if(vp.width<820){await p.click('[data-wside=chat]');await p.waitForTimeout(300);const v=await p.$eval('.wchat',e=>getComputedStyle(e).display);console.log(name,'tab chat display',v)}
 for(let i=0;i<10;i++)await p.click('[data-w=next]').catch(()=>{});await p.waitForSelector('.wrapc');await p.click('[data-w=explore]');await p.waitForTimeout(800)
 const k=await p.$$eval('.kpi .v',e=>e.map(x=>x.textContent));const g=await p.$eval('#gnum',e=>e.textContent);console.log(name,'after explore KPIs',k,'score',g)
 await p.screenshot({path:`/tmp/t-${name}-8-explored.png`})
 await p.goto('http://localhost:4173/#/conflicts/c1');await p.waitForTimeout(400);await p.screenshot({path:`/tmp/t-${name}-9-c1.png`})
 const ov=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth);console.log(name,'horizontal overflow',ov)
 await p.close()}
await run('d',{width:1280,height:800},1);await run('m',{width:390,height:844},2)
console.log('ERRORS',errs);await b.close()
