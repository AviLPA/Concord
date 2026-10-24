// Lead form, both modes. No endpoint: contact CTAs are disabled "Coming soon" and the form is absent.
// Endpoint set: those CTAs open the form, and the thank-you appears only after a successful POST.
import {spawn} from 'node:child_process'
import {chromium} from 'playwright'
import {fileURLToPath} from 'node:url'

const ROOT = fileURLToPath(new URL('.', import.meta.url))
const VITE = fileURLToPath(new URL('./node_modules/vite/bin/vite.js', import.meta.url))
const ENDPOINT = 'http://127.0.0.1:9/api/lead'
const errs = []
const fail = m => {errs.push(m); console.error('FAIL', m)}
const assert = (ok, m) => {if(!ok) fail(m)}

function startVite(port, endpoint){
  const env = {...process.env}
  delete env.VITE_LEAD_ENDPOINT
  if(endpoint) env.VITE_LEAD_ENDPOINT = endpoint
  const child = spawn(process.execPath, [VITE, '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
    cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'],
  })
  let buf = ''
  const ready = new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('vite ' + port + ' timed out\n' + buf)), 40000)
    const on = chunk => {
      buf += chunk.toString()
      if(/Local:\s+http/i.test(buf)){clearTimeout(t); resolve('http://127.0.0.1:' + port + '/')}
    }
    child.stdout.on('data', on)
    child.stderr.on('data', on)
    child.on('exit', code => {clearTimeout(t); reject(new Error('vite ' + port + ' exited ' + code + '\n' + buf))})
  })
  return {child, ready}
}
function stop(child){if(child && !child.killed) child.kill('SIGTERM')}

async function overflow(page){
  return page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
}
async function box(page, sel){
  return page.locator(sel).boundingBox()
}

async function unsetMode(browser){
  const {child, ready} = startVite(4175, '')
  try{
    const base = await ready
    for(const vp of [{width:1280, height:800, name:'desktop'}, {width:390, height:844, name:'phone'}]){
      const ctx = await browser.newContext({viewport:vp})
      const page = await ctx.newPage()
      page.on('pageerror', e => fail('unset ' + vp.name + ' ' + e.message))
      await page.goto(base + '#/pricing')
      await page.waitForSelector('[data-lead-cta]')
      const ctas = page.locator('[data-lead-cta]')
      const labels = await ctas.allInnerTexts()
      assert(labels.length === 2 && labels.every(t => t.trim() === 'Coming soon'), vp.name + ' coming soon ' + labels.join('|'))
      assert(await page.locator('[data-lead-cta]:disabled').count() === 2, vp.name + ' CTAs disabled')
      assert(await page.locator('[data-lead], #lead-form, .modal.lead, .lead-ok').count() === 0, vp.name + ' form in DOM')
      await page.evaluate(() => document.querySelector('[data-lead-cta]')?.click())
      await page.waitForTimeout(150)
      assert(await page.locator('.modal.lead, .lead-ok').count() === 0, vp.name + ' click opened the form')
      assert(!/Thanks, we got it/.test(await page.evaluate(() => document.body.innerText)), vp.name + ' fake success')
      assert(await overflow(page) <= 1, vp.name + ' pricing overflow ' + await overflow(page))
      for(const hash of ['#/', '#/how', '#/about', '#/watch']){
        await page.goto(base + hash)
        await page.waitForTimeout(200)
        assert(await page.locator('#lead-form, .lead-ok, [data-lead]').count() === 0, vp.name + ' ' + hash + ' shows the form')
        assert(!/Thanks, we got it/.test(await page.evaluate(() => document.body.innerText)), vp.name + ' ' + hash + ' fake success')
      }
      await ctx.close()
    }
  }finally{stop(child)}
}

async function openFromEveryCta(page){
  const n = await page.locator('[data-lead-cta]').count()
  assert(n >= 1, 'no contact CTAs')
  for(let i = 0; i < n; i++){
    const btn = page.locator('[data-lead-cta]').nth(i)
    assert((await btn.innerText()).trim() === 'Want to hear more?', 'CTA label ' + await btn.innerText())
    assert(await btn.isEnabled(), 'CTA disabled while endpoint is set')
    await btn.click()
    await page.waitForSelector('#lead-form')
    assert(await page.locator('.lead-ok').count() === 0, 'success before submit')
    await page.click('button[data-lead-close]')
    await page.waitForSelector('#lead-form', {state:'detached'})
  }
}

async function setMode(browser){
  const {child, ready} = startVite(4176, ENDPOINT)
  try{
    const base = await ready
    const desktop = await browser.newContext({viewport:{width:1280, height:800}})
    const page = await desktop.newPage()
    const posts = []
    let release = () => {}
    let hold = new Promise(r => {release = r})
    await page.route(ENDPOINT, async route => {
      const body = route.request().postDataJSON()
      posts.push({method:route.request().method(), body})
      const n = posts.length
      const gate = hold
      await gate
      if(n === 1) await route.fulfill({status:500, contentType:'application/json', body:'{}'})
      else await route.fulfill({status:200, contentType:'application/json', body:'{}'})
    })
    page.on('pageerror', e => fail('set desktop ' + e.message))
    await page.goto(base + '#/pricing')
    await page.waitForSelector('[data-lead]')
    await openFromEveryCta(page)
    await page.click('[data-lead]')
    await page.waitForSelector('#lead-form')
    await page.waitForTimeout(300)
    const formText = await page.locator('#lead-form').innerText()
    assert(!/role/i.test(formText) && !/platform/i.test(formText), 'dropped fields still present')
    assert(await page.locator('#lead-form input[type=checkbox]').count() === 0, 'platform checkboxes')
    assert(formText.includes('What are you hoping Concord solves?'), 'optional question')
    assert(await page.locator('#lead-form [name=website]').count() === 1, 'honeypot')
    const modal = await box(page, '.modal.lead')
    assert(modal && modal.width < 1280 - 40 && modal.x > 20, 'desktop modal ' + JSON.stringify(modal))

    await page.click('#lead-form button[type=submit]')
    await page.waitForSelector('#lead-err')
    assert(/required/i.test(await page.locator('#lead-err').innerText()), 'empty validation')
    assert(posts.length === 0, 'empty submit posted')
    assert(await page.locator('.lead-ok').count() === 0, 'empty success')

    await page.fill('[name=name]', 'Ada Lovelace')
    await page.fill('[name=email]', 'not-an-email')
    await page.fill('[name=company]', 'Northwind')
    await page.click('#lead-form button[type=submit]')
    await page.waitForFunction(() => /valid work email/i.test(document.querySelector('#lead-err')?.textContent || ''))
    assert(posts.length === 0, 'invalid email posted')

    await page.locator('[name=website]').evaluate(el => {el.value = 'https://spam.example'})
    await page.fill('[name=email]', 'ada@northwind.example')
    await page.click('#lead-form button[type=submit]')
    await page.waitForFunction(() => /try again/i.test(document.querySelector('#lead-err')?.textContent || ''))
    assert(posts.length === 0, 'honeypot posted')
    assert(await page.locator('.lead-ok').count() === 0, 'honeypot success')

    await page.fill('[name=hope]', 'One answer for customer health')
    await page.click('#lead-form button[type=submit]')
    await page.waitForTimeout(250)
    assert(posts.length === 1, 'request not sent ' + posts.length)
    assert(await page.locator('.lead-ok').count() === 0, 'success before the response')
    release()
    await page.waitForSelector('#lead-err')
    assert(/try again/i.test(await page.locator('#lead-err').innerText()), 'failure asks to try again')
    assert(await page.locator('.lead-ok').count() === 0, 'failure still thanks the visitor')
    assert(await page.inputValue('[name=name]') === 'Ada Lovelace', 'fields kept for retry')
    const sent = posts[0]
    assert(sent.method === 'POST', 'method ' + sent.method)
    assert(JSON.stringify(Object.keys(sent.body).sort()) === JSON.stringify(['company','email','hope','name']), 'payload keys ' + Object.keys(sent.body))
    assert(sent.body.email === 'ada@northwind.example' && sent.body.hope === 'One answer for customer health', 'payload values')

    hold = new Promise(r => {release = r})
    await page.click('#lead-form button[type=submit]')
    await page.waitForTimeout(200)
    assert(posts.length === 2, 'retry not sent')
    assert(await page.locator('.lead-ok').count() === 0, 'retry success before response')
    release()
    await page.waitForSelector('.lead-ok')
    assert((await page.locator('.lead-ok').innerText()).trim() === "Thanks, we got it. We'll be in touch soon.", 'success copy')
    assert(await page.locator('#lead-form').count() === 0, 'form still open after success')
    await desktop.close()

    const phone = await browser.newContext({viewport:{width:390, height:844}})
    const p = await phone.newPage()
    p.on('pageerror', e => fail('set phone ' + e.message))
    await p.goto(base + '#/pricing')
    await p.click('[data-lead]')
    await p.waitForSelector('.modal.lead')
    const full = await box(p, '.modal.lead')
    assert(full && full.x <= 1 && full.y <= 1 && full.width >= 389 && full.height >= 843, 'phone fullscreen ' + JSON.stringify(full))
    const o = await overflow(p)
    assert(o <= 1, '390 form overflow ' + o)
    await p.click('button[data-lead-close]')
    await p.waitForSelector('.modal.lead', {state:'detached'})
    await phone.close()
  }finally{stop(child)}
}

const browser = await chromium.launch()
try{
  await unsetMode(browser)
  await setMode(browser)
}catch(e){
  fail(e.stack || e.message)
}finally{
  await browser.close()
}
console.log('ERRORS:', errs.length ? errs : 'none')
if(errs.length) process.exit(1)
