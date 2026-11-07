// Ask Meridian: the three same-team questions side by side, where they split, ask, and rescan.
// Usage: node test-meridian.mjs [baseUrl]
import {chromium} from 'playwright'
const ROOT=(process.argv[2]||'http://localhost:4173/').replace(/\/?$/,'/')
const BASE=new URL('app/', ROOT).href
const SITE=ROOT
const b=await chromium.launch();const errs=[]
const fail=m=>{errs.push(m);console.error('FAIL',m)}
const assert=(ok,m)=>{if(!ok)fail(m)}
const finals=p=>p.$$eval('#co-view .co-col .co-final',els=>els.map(e=>e.textContent.trim()))
async function run(name,vp){
 const ctx=await b.newContext({viewport:vp,deviceScaleFactor:1});const p=await ctx.newPage()
 p.on('pageerror',e=>fail(name+': '+e.message));p.on('console',m=>{if(m.type()==='error')fail(name+' console: '+m.text())})
 await p.goto(BASE+'#/overview');await p.evaluate(()=>sessionStorage.clear())
 if(vp.width<820) await p.click('#burger')
 await p.click('a.nav[href="#/company"]');await p.waitForSelector('#company')
 assert(await p.title()==='Concord · Ask Meridian', name+' title')
 const tabs=await p.$$eval('.co-tab b',els=>els.map(e=>e.textContent))
 assert(tabs.join('|')==="What's our qualified pipeline for this quarter?|How are inbound SQLs trending this quarter?|Which clients are active?", name+' tabs '+tabs.join('|'))
 assert(await p.locator('#co-view').count()===1, name+' sales trio open on arrival')
 assert((await p.getAttribute('[data-pick="q.sales.pipeline"]','aria-selected'))==='true', name+' sales tab on')

 await p.click('[data-pick="q.marketing.sqls"]');await p.waitForSelector('#co-view')
 const owners=await p.$$eval('#co-view .co-colh b',els=>els.map(e=>e.textContent))
 assert(owners.join('|')==="Ines Duarte's agent|Theo Brandt's agent|Carmen Liu's agent", name+' marketing trio '+owners.join('|'))
 const badges=await p.$$eval('#co-view .co-col .co-badge',els=>els.map(e=>e.textContent))
 assert(badges.join('|')==='Live spreadsheet|Google Sheet copy|Note / words only', name+' badges '+badges.join('|'))
 const f=await finals(p)
 assert(f[0].startsWith('Down 22%')&&f[1].startsWith('Up 28%')&&f[2].startsWith('Up ~35%'), name+' marketing finals')
 assert((await p.textContent('#co-view h3.co-h')).startsWith('Three different answers'), name+' three answers')
 const chips=await p.$$eval('.co-split .co-chip',els=>els.map(e=>e.textContent))
 assert(chips.join('|')==='Split starts here|Gap carries through|Gap carries through', name+' split chips '+chips.join('|'))
 assert(await p.locator('.co-split.is-open .co-splitcell').count()===3, name+' source row open')
 await p.click('.co-splith[data-role=trend]')
 assert(/\+28%/.test(await p.textContent('.co-split.is-open')), name+' trend row opens')

 await p.click('[data-pick="q.company.clients"]')
 const cchips=await p.$$eval('.co-split .co-chip',els=>els.map(e=>e.textContent))
 assert(cchips[0]==='Same step'&&cchips[1]==='Split starts here', name+' clients split at qualify '+cchips.join('|'))
 assert(/All 4 CS agents/.test(await p.textContent('.co-all summary')), name+' clients full cluster')

 await p.fill('#coq','how much qualified pipeline do we have this quarter');await p.click('#co-form button[type=submit]')
 await p.waitForTimeout(200)
 assert((await p.getAttribute('[data-pick="q.sales.pipeline"]','aria-selected'))==='true', name+' ask selects sales')
 let s=await finals(p)
 assert(s.join('|')==='$2,213,000|$2,063,000|$2,400,000', name+' sales trio '+s.join('|'))
 await p.click('.co-all summary')
 assert(await p.locator('.co-all .co-answer').count()===10, name+' all ten sales answers')

 await p.click('[data-flag=qualifyStageMin][data-value="4"]')
 assert((await finals(p))[0]==='$2,213,000', name+' flag alone does not move numbers')
 assert(/Rescan reruns/.test(await p.textContent('.co-pending')), name+' pending note')
 await p.click('[data-rescan]')
 s=await finals(p)
 assert(s[0]==='$1,435,000'&&s[1]==='$1,075,000', name+' rescan '+s.join('|'))
 await p.reload();await p.waitForSelector('#company')
 await p.click('[data-pick="q.sales.pipeline"]')
 assert((await finals(p))[0]==='$1,435,000', name+' flags survive reload')
 await p.click('[data-flag-reset]')
 assert((await finals(p))[0]==='$2,213,000', name+' reset flags')

 await p.fill('#coq','hello there');await p.click('#co-form button[type=submit]')
 assert(await p.locator('.co-missbox').count()===1, name+' no-match reply')

 await p.goto(SITE);await p.waitForSelector('.hero')
 assert(/Concord: one official answer/.test(await p.title()), name+' homepage is the showcase '+await p.title())
 assert(await p.locator('#app').count()===0, name+' homepage is not the app')
 assert(await p.locator('.navcta a.btn.mint').getAttribute('href')==='/app/#/company', name+' showcase open-demo href')
 assert((await p.locator('.navcta a.btn.mint').innerText()).trim()==='Open the demo', name+' one nav CTA')
 assert((await p.$$eval('a',els=>els.map(e=>e.textContent.trim()).filter(t=>/watch it live|try it with sample data/i.test(t)))).length===0, name+' leftover CTAs')
 assert((await p.$$eval('.ctas a.btn.mint',els=>els.map(e=>e.getAttribute('href')))).every(h=>h==='/app/#/company'), name+' showcase demo hrefs')
 await p.click('.navcta a.btn.mint');await p.waitForSelector('#company')
 assert(await p.title()==='Concord · Ask Meridian', name+' showcase button opens Ask Meridian')
 assert(await p.locator('#co-view').count()===1, name+' showcase lands on the trio')

 const ov=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth)
 assert(ov<=1, name+' horizontal overflow '+ov)
 await ctx.close()}
await run('d',{width:1280,height:800});await run('m',{width:390,height:844})
console.log('ERRORS',errs.length?errs:'none');await b.close()
if(errs.length) process.exit(1)
