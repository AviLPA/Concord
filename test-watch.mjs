// Walkthrough: click-through story, controls, and explore applying the shared store.
// Usage: node test-watch.mjs [baseUrl]
import {chromium} from 'playwright'
const BASE=process.argv[2]||'http://localhost:4173/'
const b=await chromium.launch();const errs=[]
const fail=m=>{errs.push(m);console.error('FAIL',m)}
const assert=(ok,m)=>{if(!ok)fail(m)}
async function run(name,vp){
 const ctx=await b.newContext({viewport:vp,deviceScaleFactor:1});const p=await ctx.newPage()
 p.on('pageerror',e=>fail(name+': '+e.message));p.on('console',m=>{if(m.type()==='error')fail(name+' console: '+m.text())})
 await p.goto(BASE);await p.evaluate(()=>localStorage.clear());await p.goto(BASE+'#/overview');await p.waitForTimeout(400)
 assert(await p.$eval('#gnum',e=>e.textContent)==='53', name+' fresh score')
 assert(await p.$eval('#kopen',e=>e.textContent)==='6', name+' fresh conflicts')
 await p.screenshot({path:`/tmp/t-${name}-0-home.png`})
 await p.click('.hero [data-startwatch]');await p.waitForTimeout(400);await p.screenshot({path:`/tmp/t-${name}-1-intro.png`})
 assert(await p.locator('.sitebar').count()===1, name+' watch stays on the site')
 assert(await p.locator('.sitefoot').count()===1, name+' watch footer')
 assert(await p.locator('.shell').count()===0, name+' watch has no app sidebar')
 assert((await p.$eval('.sitenav a.on',e=>e.textContent.trim()))==='Walkthrough', name+' watch nav active')
 const introText=await p.$eval('.wcard',e=>e.innerText)
 assert(!/employee build an agent/i.test(introText), name+' intro promise')
 assert(!/offered|paste/i.test(introText), name+' intro still offers while building')
 assert(introText.includes('35')&&introText.includes('Sara')&&introText.includes('Dana')&&introText.includes('28')&&/scan/i.test(introText)&&/alert/i.test(introText), name+' intro copy')
 assert(!/What you'll see/.test(introText), name+' intro card skipped')
 const introWords=(await p.$eval('.wcard p',e=>e.textContent.trim())).split(/\s+/).length
 assert(introWords<=25, name+' intro length '+introWords)
 assert(await p.locator('.ws-i').count()===6, name+' six steps')
 await p.click('.wcard [data-w=start]')
 await p.waitForFunction(()=>(document.querySelector('.wk')?.textContent||'').includes('Dana builds'),{timeout:8000})
 await p.waitForTimeout(3200)
 const stuck=await p.$eval('.wk',e=>e.textContent)
 const nxt=await p.$eval('[data-w=next]',e=>`${e.textContent} ${e.getAttribute('title')||''}`)
 assert(/Dana builds/.test(stuck), name+' auto-advanced '+stuck)
 assert(/nightly scan/i.test(nxt), name+' next label '+nxt)
 const back0=await p.$eval('[data-w=back]',e=>({d:e.disabled,o:getComputedStyle(e).opacity}))
 assert(back0.d&&parseFloat(back0.o)<1, name+' back looks disabled '+JSON.stringify(back0))
 if(vp.width>=1200){
  await p.setViewportSize({width:1440,height:900})
  await p.evaluate(()=>scrollTo(0,0))
  await p.waitForTimeout(60)
  const fit=await p.evaluate(()=>{const c=document.querySelector('.ccomp');const r=c.getBoundingClientRect();return {bottom:Math.round(r.bottom),top:Math.round(r.top),h:Math.round(r.height),ih:innerHeight,text:c.innerText}})
  assert(fit.h>30&&fit.bottom<=fit.ih+1&&fit.top>=0&&/Message Claude/.test(fit.text), name+' composer fits '+JSON.stringify(fit))
  await p.setViewportSize({width:vp.width,height:vp.height})
 }
 assert(await p.locator('[data-w=speed]').count()===0, name+' speed control remains')
 assert(await p.locator('[data-w=toggle]').count()===0, name+' play control remains')
 for(let i=0;i<8;i++){
  if(await p.locator('.wrapc').count()) break
  const n=p.locator('[data-w=next]')
  if(!await n.count()||await n.isDisabled()) break
  await n.click();await p.waitForTimeout(120)
 }
 await p.waitForSelector('.wrapc',{timeout:8000})
 await p.waitForTimeout(200);await p.screenshot({path:`/tmp/t-${name}-7-wrap.png`})
 const wrap=await p.$eval('.wrapc',e=>e.innerText)
 assert(wrap.includes('28')&&wrap.includes('35')&&/All 4 agents agree/i.test(wrap)&&/daily/i.test(wrap)&&wrap.includes('CS team lead'), name+' wrap '+wrap.slice(0,180))
 assert(!/rewir/i.test(wrap)&&!/asked all/i.test(wrap)&&!/offered|paste/i.test(wrap), name+' wrap claims a run or edit')
 assert(wrap.includes('Tom'), name+' wrap names Tom')
 const bad=/Maya|Priya|Compliance API|REST API|workflow JSON|MCP|re-read|block v2/i
 for(let i=0;i<6;i++){
  await p.click(`[data-wgo="${i}"]`);await p.waitForTimeout(80)
  const blob=await p.evaluate(()=>{const t=s=>document.querySelector(s)?.textContent||'';return [t('.wt'),t('.wb'),t('.wchat'),t('.elog'),t('.wleft-hd')].join('\n')})
  assert(!bad.test(blob), name+' step '+i+' jargon '+blob.slice(0,180))
  assert(!/the moment|instantly|real-time|real time/i.test(blob), name+' step '+i+' instant claim')
  assert(!/does not|doesn't|never/i.test(blob), name+' step '+i+' defensive line')
  assert(await p.locator('.wknow').count()===0, name+' no expander')
  const titleWords=(await p.$eval('.wt',e=>e.textContent.trim())).split(/\s+/).filter(Boolean)
  const bodyWords=(await p.$eval('.wb',e=>e.textContent.trim())).split(/\s+/).filter(Boolean)
  assert(titleWords.length<=6&&titleWords.length>0, name+' title words '+titleWords.join(' '))
  assert(bodyWords.length<=15&&bodyWords.length>0, name+' body words '+bodyWords.length+' '+bodyWords.join(' '))
  const ovStep=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth)
  assert(ovStep<=1, name+' step '+i+' overflow '+ovStep)
  if(vp.width>=1024&&i===0){
   const panels=await p.evaluate(()=>{
    const cols=getComputedStyle(document.querySelector('.wv-split')).gridTemplateColumns.split(' ').filter(Boolean)
    const chat=document.querySelector('.wchat').getBoundingClientRect()
    const be=document.querySelector('.wbe').getBoundingClientRect()
    const cap=document.querySelector('.wv-cap').getBoundingClientRect()
    const btns=document.querySelector('.wv-btns').getBoundingClientRect()
    return {cols:cols.length,side:be.left>=chat.right-2&&Math.abs(chat.top-be.top)<4,card:btns.width>40&&btns.left>=cap.left&&btns.right<=cap.right+1&&btns.top>=cap.top-1&&btns.bottom<=cap.bottom+1}
   })
   assert(panels.cols===2&&panels.side&&panels.card, name+' v14 desktop panels '+JSON.stringify(panels))
  }
  if(vp.width<820){
    const phoneFit=await p.evaluate(()=>{
      const side=document.querySelector('.wv').dataset.side
      const dock=document.querySelector('.wv-dock').getBoundingClientRect()
      const panel=document.querySelector(side==='chat'?'.wchat':'.wbe')
      const scroller=document.querySelector(side==='chat'?'.cmsgs':'.elog')
      const last=scroller?.lastElementChild
      const cap=document.querySelector('.wv-cap')?.innerText||''
      const words=(cap+' '+(panel?.innerText||'')).trim().split(/\s+/).filter(Boolean).length
      const page=document.documentElement.scrollHeight-innerHeight
      const inner=scroller?scroller.scrollHeight-scroller.clientHeight:0
      const contentBottom=last?last.getBoundingClientRect().bottom:(panel?panel.getBoundingClientRect().bottom:0)
      return {side,words,page,inner,dockH:Math.round(dock.height),dockTop:dock.top,contentBottom}
    })
    assert(phoneFit.side===(i<=1?'chat':'be'), name+' step '+i+' side '+phoneFit.side)
    assert(phoneFit.page<=2, name+' step '+i+' page scroll '+phoneFit.page)
    assert(phoneFit.inner<=2, name+' step '+i+' panel scroll '+phoneFit.inner)
    assert(phoneFit.contentBottom<=phoneFit.dockTop+1, name+' step '+i+' content below the bar '+Math.round(phoneFit.contentBottom)+'>'+Math.round(phoneFit.dockTop))
    assert(phoneFit.dockH>=68&&phoneFit.dockH<=80, name+' dock '+phoneFit.dockH)
    assert(phoneFit.words<=55, name+' step '+i+' words '+phoneFit.words)
    if(i===2||i===5){
      const cards=await p.evaluate(step=>{
        const dock=document.querySelector('.wv-dock').getBoundingClientRect().top
        const nodes=[...document.querySelectorAll(step===5?'.elog .cmp.settle .cc':'.elog .cc')]
        const chip=document.querySelector('.elog .st-sync')
        const box=el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,h:r.height,text:el.innerText}}
        return {dock,cards:nodes.map(box),chip:chip?box(chip):null}
      },i)
      assert(cards.cards.length>=4&&cards.cards.every(c=>c.h>16&&c.top>=48&&c.bottom<=cards.dock+1), name+' step '+i+' cards in view '+JSON.stringify(cards.cards.map(c=>Math.round(c.bottom))))
      if(i===5) assert(cards.chip&&cards.chip.h>10&&cards.chip.top>=48&&cards.chip.bottom<=cards.dock+1&&/In sync/.test(cards.chip.text), name+' in sync in view')
    }
    for(const side of ['chat','be']){
      await p.click(`[data-wside=${side}]`);await p.waitForTimeout(40)
      const ovSide=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth)
      assert(ovSide<=1, name+' step '+i+' '+side+' overflow '+ovSide)
    }
  }
  if(vp.width<820&&i===0) await p.click('[data-wside=chat]')
  const input=await p.$eval('.ccomp',e=>getComputedStyle(e).display)
  assert(input===(i===0?'flex':'none'), name+' step '+i+' composer '+input)
  if(vp.width<820&&i===0) await p.click('[data-wside=be]')
  assert(!/offered first|paste her|while building/i.test(blob), name+' step '+i+' build-time offer')
 }
 await p.click('[data-wgo="0"]')
 assert(await p.$eval('.am-bar',e=>e.hidden), name+' scan bar hidden before the scan')
 const ring=await p.$eval('.cm.u .dav',e=>getComputedStyle(e).boxShadow)
 assert(ring&&ring!=='none', name+' dana avatar ring')
 assert((await p.$eval('.wleft-hd h3',e=>e.textContent)).includes("Dana's Claude project"), name+' dana label')
 assert((await p.$eval('.wbe h3',e=>e.textContent)).trim()==='What Concord sees', name+' right label')
 await p.click('[data-wgo="1"]')
 assert(!(await p.$eval('.am-bar',e=>e.hidden)), name+' scan bar during the scan')
 const scan=await p.$eval('.elog',e=>e.textContent)
 assert(scan.includes('Customer health'), name+' scan matches the job')
 assert(scan.includes('How many accounts are at risk?'), name+' scan repeats the question')
 assert(scan.includes("Dana's agent answered 35"), name+' scan repeats 35 '+scan.slice(0,220))
 assert(scan.includes('Same answer as the last step'), name+' scan links to step 1')
 await p.click('[data-wgo="2"]')
 const four=await p.$eval('.elog',e=>e.innerText)
 assert(four.includes('Four answers'), name+' other agents heading')
 assert(four.includes('Just seen'), name+' dana marked just seen')
 assert(four.includes('Tom · CS Ops · n8n')&&four.includes('17'), name+' tom card '+four.slice(0,240))
 assert(four.includes('CS team lead · CS · Claude')&&four.includes('42'), name+' cs card')
 assert(four.includes('RevOps · Claude')&&four.includes('28')&&four.includes('Renewal radar')&&four.includes('Warehouse score'), name+' revops card')
 assert(!/RevOps warehouse score/.test(four), name+' old 28 name')
 assert(await p.locator('.elog .cc').count()>=4, name+' four cards')
 const left=await p.$eval('.wchat',e=>e.textContent)
 assert(left.includes("Dana's agent is one of four."), name+' one of four note')
 assert(left.includes('How many accounts are at risk?')&&left.includes('35'), name+' dana chat stays')
 assert(!left.includes('3 other agents')&&!left.includes('Account health monitor'), name+' left does not repeat the four')
 const fade=await p.$eval('.wchat .cm',e=>getComputedStyle(e).opacity)
 assert(parseFloat(fade)<0.7, name+' dana chat faded '+fade)
 assert((await p.locator('.elog .cc.seen').innerText()).includes('35'), name+' seen card is 35')
 await p.click('[data-wgo="3"]')
 assert((await p.$eval('.wleft-hd h3',e=>e.textContent)).includes("Sara's alert"), name+' alert label')
 assert((await p.$eval('.wchat',e=>e.textContent)).includes('Notification to Sara Klein'), name+' alert card')
 await p.click('[data-wgo="4"]')
 assert((await p.$eval('.wleft-hd h3',e=>e.textContent)).includes("Sara's view in Concord"), name+' sara label')
 assert((await p.$eval('.wchat',e=>e.textContent)).includes('28'), name+' sara marks 28')
 assert(!/does not|doesn't|never/i.test(await p.$eval('.wchat',e=>e.textContent)), name+' no defensive line')
 assert((await p.$eval('.elog',e=>e.textContent)).includes('CS team lead'), name+' notes name a role')
 await p.click('[data-wgo="5"]')
 const adopt=await p.$eval('.elog',e=>e.textContent)
 assert(adopt.includes('Day 1')&&adopt.indexOf('Day 1')<adopt.indexOf('Day 3')&&adopt.indexOf('Day 3')<adopt.indexOf('Day 5')&&!/Maya/.test(adopt), name+' day order '+adopt)
 assert((await p.$eval('.wb',e=>e.textContent)).trim()==='Builders update their agents. Daily scans confirm all four now say 28.', name+' step 6 header')
 const syncCards=await p.evaluate(()=>{
  const cards=[...document.querySelectorAll('.elog .cmp.settle .cc')]
  const flat=c=>c.replace(/\s/g,'')
  const red=/212,47,38|180,35,24|d42f26|b42318/i
  return {n:cards.length,nums:cards.map(el=>el.querySelector('.ccn').textContent.trim()),ok:cards.filter(el=>el.classList.contains('ok')).length,tops:cards.map(el=>flat(getComputedStyle(el).borderTopColor)),reds:cards.filter(el=>{const s=getComputedStyle(el);const n=getComputedStyle(el.querySelector('.ccn'));return [s.borderTopColor,s.borderRightColor,s.borderBottomColor,s.borderLeftColor,s.backgroundColor,n.color].some(c=>red.test(flat(c)))}).length}
 })
 assert(syncCards.n===4&&syncCards.ok===4&&syncCards.nums.every(n=>n==='28')&&syncCards.reds===0&&syncCards.tops.every(t=>t.includes('63,224,161')), name+' step 6 in-sync cards '+JSON.stringify(syncCards))
 assert((await p.$eval('.wleft-hd h3',e=>e.textContent)).includes("Tom's n8n workflow"), name+' tom label')
 assert((await p.$eval('.elog',e=>e.textContent)).includes('In sync'), name+' finale agreement')
 assert((await p.$eval('.elog',e=>e.textContent)).includes('28'), name+' finale answer')
 assert((await p.$eval('.elog',e=>e.textContent)).includes('Account health monitor'), name+' day 5 names the agent')
 assert((await p.$eval('.elog',e=>e.textContent)).includes('CS team lead'), name+' owner updated after the alert')
 await p.click('[data-w=next]');await p.waitForSelector('.wrapc');await p.click('[data-w=restart]');await p.waitForTimeout(200)
 assert(await p.locator('.wcard [data-w=start]').count()===1, name+' restart returns to the intro')
 await p.click('.wcard [data-w=start]')
 await p.waitForFunction(()=>(document.querySelector('.wk')?.textContent||'').includes('Dana builds'),{timeout:8000})
 await p.waitForTimeout(400)
 const s1=await p.$eval('.wk',e=>e.textContent)
 await p.click('[data-w=next]');await p.click('[data-w=next]');await p.click('[data-w=next]')
 await p.waitForFunction(()=>/Sara's alert/.test(document.querySelector('.wk')?.textContent||'')&&document.querySelectorAll('.elog .wi').length>=2,{timeout:8000})
 const s2=await p.$eval('.wk',e=>e.textContent);const n2=await p.locator('.elog .wi').count()
 await p.click('[data-w=back]');await p.waitForTimeout(80);const s3=await p.$eval('.wk',e=>e.textContent)
 console.log(name,'controls',s1.slice(0,40),'|',s2.slice(0,40),n2,'events |',s3.slice(0,40))
 assert(/Dana builds/.test(s1), name+' start step '+s1)
 assert(s1!==s2, name+' next did not change step')
 assert(s3!==s2, name+' back did not change step')
 assert(/Four answers/.test(s3), name+' back landed on '+s3.slice(0,80))
 assert(n2>=2, name+' events '+n2)
 if(vp.width<820){await p.click('[data-wside=chat]');await p.waitForTimeout(200)
  const v=await p.$eval('.wchat',e=>getComputedStyle(e).display);console.log(name,'tab chat display',v)
  assert(v!=='none', name+' phone chat tab')}
 for(let i=0;i<10;i++){if(await p.$eval('[data-w=next]',e=>e.disabled).catch(()=>true))break;await p.click('[data-w=next]')}
 await p.waitForSelector('.wrapc');await p.click('[data-w=explore]');await p.waitForTimeout(600)
 const k=await p.$$eval('.kpi .v',e=>e.map(x=>x.textContent.trim()));const g=await p.$eval('#gnum',e=>e.textContent)
 console.log(name,'after explore KPIs',k,'score',g)
 assert(k.join('/')==='20/2/5/2', name+' explore KPIs '+k.join('/'))
 assert(g==='68', name+' explore score '+g)
 const toast=await p.locator('.toast').innerText().catch(()=>'')
 assert(/verified by re-reading/.test(toast), name+' explore toast '+toast)
 await p.screenshot({path:`/tmp/t-${name}-8-explored.png`})
 await p.goto(BASE+'#/conflicts/c1');await p.waitForTimeout(400);await p.screenshot({path:`/tmp/t-${name}-9-c1.png`})
 const conflict=await p.evaluate(()=>document.body.innerText)
 assert(conflict.includes('Day 1')&&conflict.includes('Day 6')&&conflict.includes('Tom'), name+' adoption timeline')
 assert(!/rewir/i.test(conflict), name+' conflict page rewires')
 const ov=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth)
 assert(ov<=1, name+' horizontal overflow '+ov)
 await ctx.close()}
await run('d',{width:1280,height:800});await run('m',{width:390,height:844});await run('s',{width:360,height:740})
console.log('ERRORS',errs.length?errs:'none');await b.close()
if(errs.length) process.exit(1)
