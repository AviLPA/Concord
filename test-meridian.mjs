// Ask Meridian: ask the Sales question, read the cluster, flip a flag, rescan, and the company-wide picks.
// Usage: node test-meridian.mjs [baseUrl]
import {chromium} from 'playwright'
const BASE=process.argv[2]||'http://localhost:4173/'
const b=await chromium.launch();const errs=[]
const fail=m=>{errs.push(m);console.error('FAIL',m)}
const assert=(ok,m)=>{if(!ok)fail(m)}
const kpi=p=>p.$$eval('.co-kpis .v',els=>els.map(e=>e.textContent.trim()))
async function run(name,vp){
 const ctx=await b.newContext({viewport:vp,deviceScaleFactor:1});const p=await ctx.newPage()
 p.on('pageerror',e=>fail(name+': '+e.message));p.on('console',m=>{if(m.type()==='error')fail(name+' console: '+m.text())})
 await p.goto(BASE+'#/overview');await p.evaluate(()=>sessionStorage.clear())
 if(vp.width<820) await p.click('#burger')
 await p.click('a.nav[href="#/company"]');await p.waitForSelector('#company')
 assert(await p.title()==='Concord · Ask Meridian', name+' title')
 assert((await p.$eval('.co-hero b',e=>e.textContent))==="What's our qualified pipeline for this quarter?", name+' hero question')
 assert((await kpi(p)).join('/')==='20/4/$2,213,000/$2,063,000', name+' fresh KPIs '+(await kpi(p)).join('/'))
 assert(await p.locator('.co-more .schip').count()===3, name+' company-wide picks')

 await p.fill('#coq','how much qualified pipeline do we have this quarter');await p.click('#co-form button[type=submit]')
 await p.waitForSelector('#co-latest')
 const meta=await p.textContent('#co-latest .co-meta')
 assert(meta.startsWith('10 agents · 10 answers · 5 mid-path splits'), name+' cluster meta '+meta)
 const vals=await p.$$eval('#co-latest .co-aval',els=>els.map(e=>e.textContent))
 assert(vals.includes('$2,213,000')&&vals.includes('$2,400,000')&&vals.length===10, name+' ten finals')
 assert(/Dana Brooks/.test(await p.textContent('#co-latest .co-thin')), name+' instructions-only note')
 assert(await p.locator('#co-latest .co-mark-split').count()>=5, name+' split marks')

 await p.click('[data-flag=qualifyStageMin][data-value="4"]')
 assert((await kpi(p))[2]==='$2,213,000', name+' flag alone does not move numbers')
 assert(/Rescan reruns/.test(await p.textContent('.co-pending')), name+' pending note')
 await p.click('[data-rescan]')
 const k=await kpi(p)
 assert(k[2]==='$1,435,000'&&k[3]==='$1,075,000', name+' rescan KPIs '+k.join('/'))
 assert((await p.textContent('#co-latest .co-meta')).startsWith('10 agents · 9 answers'), name+' cluster rescanned')
 assert(/9 answers/.test(await p.textContent('.co-hero small')), name+' hero stat rescanned')

 await p.reload();await p.waitForSelector('#company')
 assert((await kpi(p))[2]==='$1,435,000', name+' flags survive reload')
 await p.click('[data-flag-reset]')
 assert((await kpi(p))[2]==='$2,213,000', name+' reset flags')

 await p.click('.co-more .schip >> nth=0');await p.waitForSelector('#co-latest')
 assert(/Which clients are active/.test(await p.textContent('#co-latest h2')), name+' clients cluster')
 await p.fill('#coq','hello there');await p.click('#co-form button[type=submit]')
 assert(await p.locator('.co-missbox').count()===1, name+' no-match reply')

 const ov=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth)
 assert(ov<=1, name+' horizontal overflow '+ov)
 await ctx.close()}
await run('d',{width:1280,height:800});await run('m',{width:390,height:844})
console.log('ERRORS',errs.length?errs:'none');await b.close()
if(errs.length) process.exit(1)
