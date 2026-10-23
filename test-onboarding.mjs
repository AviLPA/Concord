// E2E: landing -> Get started -> connect both -> scan -> search -> resolve -> dashboard; landing -> Watch it live.
// Usage: node test-onboarding.mjs [baseUrl] [shotDir]   (needs `npm run preview` for the default base)
import {chromium} from 'playwright'
const BASE=process.argv[2]||'http://localhost:4173/',DIR=process.argv[3]||'/tmp/ob'
import fs from 'fs';fs.mkdirSync(DIR,{recursive:true})
const b=await chromium.launch();const errs=[];const log=(...a)=>console.log(...a)
async function run(n,vp,dsf){const ctx=await b.newContext({viewport:vp,deviceScaleFactor:dsf});const p=await ctx.newPage()
 p.on('pageerror',e=>errs.push(n+' '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(n+' console '+m.text())})
 const shot=async l=>p.screenshot({path:`${DIR}/${n}-${l}.png`});const over=async l=>{const o=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);if(o>0)errs.push(`${n} horizontal overflow ${o}px at ${l}`);if(await p.evaluate(()=>document.body.innerText.includes('${')))errs.push(`${n} raw template text at ${l}`)}
 await p.goto(BASE);await p.waitForTimeout(500);await shot('01-landing');await over('landing')
 const ctas=await p.$$eval('.lhero .lcta .btn',e=>e.map(x=>[x.textContent.trim(),Math.round(x.getBoundingClientRect().height)]));log(n,'hero CTAs',JSON.stringify(ctas))
 await p.evaluate(()=>scrollTo(0,document.body.scrollHeight));await p.waitForTimeout(300);await over('landing bottom')
 await p.evaluate(()=>scrollTo(0,0));await p.click('.lhero a[href="#/start"]');await p.waitForTimeout(400);await shot('02-workspace');await over('workspace')
 log(n,'guide:',await p.$eval('#obguide',e=>e.textContent.trim()))
 await p.fill('#f-company','Northwind');await p.click('[data-obws]');await p.waitForTimeout(300)
 await p.click('[data-connect=claude]');await p.waitForTimeout(400);await shot('03-connect-claude-modal');await p.click('[data-cauth]');await p.waitForSelector('.mok');await p.click('.mf [data-mclose]')
 await p.click('[data-connect=n8n]');await p.waitForTimeout(300);await p.click('[data-ntest]');await p.waitForTimeout(1300);await shot('04-connect-n8n-testing');await p.waitForSelector('[data-nsave]:not([disabled])');await p.click('[data-nsave]');await p.click('.mf [data-mclose]');await p.waitForTimeout(300)
 await shot('05-connected');log(n,'connected cards:',await p.$$eval('.icard.on',e=>e.length));await p.click('.obfoot [data-obgo=scan]');await p.waitForTimeout(300)
 await p.click('[data-scan]');await p.waitForTimeout(6500);await shot('06-scan-mid');await over('scan');const t0=Date.now();await p.waitForSelector('#toSearch:not([disabled])',{timeout:40000});log(n,'scan finished after',(6.5+(Date.now()-t0)/1000).toFixed(1)+'s','|',await p.$eval('#scanmsg',e=>e.textContent))
 await p.waitForTimeout(400);await shot('07-scan-done');await p.click('#toSearch');await p.waitForTimeout(300)
 await p.click('[data-sq="customer health"]');await p.waitForTimeout(500);await shot('08-search-customer-health');await over('search')
 log(n,'search "customer health":',await p.$$eval('.sg h3',e=>e.map(x=>x.textContent).join(', ')),'| answers',await p.$$eval('.sg .scn',e=>e.map(x=>x.textContent).join('/')))
 await p.fill('#sq','how much revenue do we have');await p.waitForTimeout(500);log(n,'free text "how much revenue do we have":',await p.$$eval('.sg h3',e=>e.map(x=>x.textContent).join(', ')))
 await p.fill('#sq','custmer helth');await p.waitForTimeout(500);log(n,'typo "custmer helth":',await p.$$eval('.sg h3',e=>e.map(x=>x.textContent).join(', ')))
 await p.fill('#sq','at risk accounts');await p.waitForTimeout(500);log(n,'free text "at risk accounts":',await p.$$eval('.sg h3',e=>e.map(x=>x.textContent).join(', ')))
 await p.click('[data-resolve=c1]');await p.waitForTimeout(400);await p.click('[data-rpick="2"]');await p.waitForTimeout(200);await shot('09-resolve-pick');await over('resolve')
 await p.click('[data-rnext]');await p.click('[data-rchip]');await p.waitForTimeout(200);await shot('10-resolve-reason');await p.click('[data-rpublish]');await p.waitForTimeout(300)
 await p.click('[data-rrewire]');await p.waitForTimeout(1700);await shot('11-resolve-rewiring');await p.waitForSelector('.rdone',{timeout:15000});await p.waitForTimeout(300);await shot('12-resolve-done')
 log(n,'after rewire answers',await p.$$eval('.rcn',e=>e.map(x=>x.textContent).join('/')),'| score',await p.$eval('.rvm b',e=>e.textContent),'| watch CTA',!!await p.$('.rdone ~ .rrow a[href="#/watch"], .rrow a[href="#/watch"]'))
 await p.click('[data-obfinish]');await p.waitForTimeout(600);await shot('13-dashboard');await over('dashboard')
 log(n,'dashboard KPIs',(await p.$$eval('.kpi .v',e=>e.map(x=>x.textContent))).join('/'),'score',await p.$eval('#gnum',e=>e.textContent),'checklist',await p.$eval('.chk',e=>e.querySelector('.chkh b').textContent+' '+e.querySelector('.chkh .mut').textContent))
 const nav=await p.$$eval('.side .nav',e=>e.map(x=>x.textContent.trim()));log(n,'sidebar first item:',nav[0],'| has Live build:',nav.some(x=>/Live build/.test(x)))
 // top bar search (desktop only, hidden on phone)
 if(vp.width>=820){await p.fill('#topq','refund');await p.press('#topq','Enter');await p.waitForTimeout(500);log(n,'top-bar search refund ->',await p.evaluate(()=>location.hash),await p.$$eval('.sg h3',e=>e.map(x=>x.textContent).join(', ')))}
 // persistence
 await p.reload();await p.waitForTimeout(500);await p.goto(BASE+'#/overview');await p.waitForTimeout(400);log(n,'after reload score',await p.$eval('#gnum',e=>e.textContent))
 // landing -> watch it live, full run at 2x
 await p.goto(BASE);await p.waitForTimeout(400);await p.click('.lhero a[href="#/watch"]');await p.waitForTimeout(500);await p.click('.wcard [data-w=toggle]');await p.click('[data-w=speed]');await p.click('[data-w=speed]')
 const w0=Date.now();await p.waitForSelector('.wrapc',{timeout:90000});log(n,'watch it live reached wrap-up in',((Date.now()-w0)/1000).toFixed(1)+'s at 2x');await p.click('.wrapc [data-w=explore]');await p.waitForTimeout(500);log(n,'watch explore KPIs',(await p.$$eval('.kpi .v',e=>e.map(x=>x.textContent))).join('/'))
 // reset
 await p.goto(BASE);await p.waitForTimeout(300);await p.click('[data-reset]');await p.waitForTimeout(800);await p.goto(BASE+'#/overview');await p.waitForTimeout(400);log(n,'after reset score',await p.$eval('#gnum',e=>e.textContent),'checklist',await p.$eval('.chk .chkh .mut',e=>e.textContent))
 await ctx.close()}
await run('desktop',{width:1280,height:800},1);await run('phone',{width:390,height:844},2)
log('ERRORS:',errs.length?errs:'none');await b.close()
