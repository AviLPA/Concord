// Lead form. No endpoint: every CTA is a disabled Coming soon button and the form never opens.
// Endpoint set: the same CTAs open the form. Thank-you only after a real 2xx. Any other result is an error.
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
      if(/Local:\s+http/i.test(buf)){clearTimeout(t); resolve('http://127.0.0.1:' + port + '/app/')}
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

async function openFromEveryCta(page){
  const n = await page.locator('[data-lead-cta]').count()
  assert(n >= 1, 'no contact CTAs')
  for(let i = 0; i < n; i++){
    const btn = page.locator('[data-lead-cta]').nth(i)
    assert((await btn.innerText()).trim() === 'Want to hear more?', 'CTA label ' + await btn.innerText())
    assert(await btn.isEnabled(), 'CTA disabled')
    await btn.click()
    await page.waitForSelector('#lead-form')
    const formText = await page.locator('.modal.lead').innerText()
    assert(formText.includes("Tell us a little about your team and we'll be in touch."), 'intro')
    assert(formText.includes('Where your teams build agents'), 'platforms')
    assert(formText.includes("Anything you'd like us to know?"), 'note')
    assert(await page.locator('.lead-ok').count() === 0, 'success before submit')
    await page.click('button[data-lead-close]')
    await page.waitForSelector('#lead-form', {state:'detached'})
  }
}

async function assertNoAudit(page){
  const text = await page.evaluate(() => document.body.innerText)
  assert(!/Start with a free consistency audit/.test(text), 'free audit phrase still on the page')
}

async function assertComingSoon(page, where){
  const n = await page.locator('[data-lead-cta]').count()
  assert(await page.locator('[data-lead]').count() === 0, where + ' still has a form opener')
  for(let i = 0; i < n; i++){
    const btn = page.locator('[data-lead-cta]').nth(i)
    assert((await btn.innerText()).trim() === 'Coming soon', where + ' CTA ' + await btn.innerText())
    assert(await btn.isDisabled(), where + ' CTA is enabled')
  }
  if(n) await page.locator('[data-lead-cta]').first().evaluate(el => el.click())
  await page.waitForTimeout(50)
  const text = await page.evaluate(() => document.body.innerText)
  assert(await page.locator('#lead-form').count() === 0, where + ' form opened')
  assert(await page.locator('.lead-ok').count() === 0, where + ' fake success')
  assert(!text.includes("Thanks, we got it."), where + ' thank-you without a request')
}

async function unsetMode(browser){
  const {child, ready} = startVite(4175, '')
  try{
    const base = await ready
    const desktop = await browser.newContext({viewport:{width:1280, height:800}})
    const page = await desktop.newPage()
    const logs = []
    const posts = []
    page.on('console', m => {if(m.type() === 'log') logs.push(m.text())})
    page.on('request', req => {if(req.method() === 'POST') posts.push(req.url())})
    page.on('pageerror', e => fail('unset desktop ' + e.message))
    for(const hash of ['#/pricing', '#/how', '#/about', '#/watch']){
      await page.goto(base + hash)
      await page.waitForTimeout(200)
      await assertNoAudit(page)
      await assertComingSoon(page, 'unset ' + hash)
      assert(await overflow(page) <= 1, 'unset desktop overflow ' + hash + ' ' + await overflow(page))
    }
    await page.goto(base + '#/how')
    assert(await page.locator('[data-lead-cta]').count() === 0, 'how CTA count')
    await page.goto(base + '#/pricing')
    assert(await page.locator('[data-lead-cta]').count() === 3, 'pricing CTA count')
    assert(posts.length === 0, 'unset mode posted')
    assert(!logs.some(l => /@/.test(l)), 'unset mode logged a payload')
    await desktop.close()

    const phone = await browser.newContext({viewport:{width:390, height:844}})
    const p = await phone.newPage()
    p.on('pageerror', e => fail('unset phone ' + e.message))
    await p.goto(base + '#/pricing')
    await p.waitForSelector('[data-lead-cta]')
    await assertComingSoon(p, 'unset phone pricing')
    await p.goto(base + '#/pricing')
    await assertComingSoon(p, 'unset phone pricing')
    assert(await overflow(p) <= 1, '390 page overflow ' + await overflow(p))
    await phone.close()
  }finally{stop(child)}
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
    for(const hash of ['#/', '#/pricing']){
      await page.goto(base + hash)
      await page.waitForSelector('[data-lead-cta]')
      await openFromEveryCta(page)
    }
    await page.goto(base + '#/')
    assert(await page.locator('[data-lead-cta]').count() === 3, 'set landing CTA count')
    await page.goto(base + '#/pricing')
    assert(await page.locator('[data-lead-cta]').count() === 3, 'set pricing CTA count')
    await page.click('[data-lead]')
    await page.waitForSelector('#lead-form')
    const modal = await box(page, '.modal.lead')
    assert(modal && modal.width < 1280 - 40 && modal.x > 20, 'desktop modal ' + JSON.stringify(modal))
    assert(await page.locator('#lead-form [name=website]').count() === 1, 'honeypot')
    assert(await page.locator('#lead-form input[type=checkbox]').count() === 3, 'platform checkboxes')

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
    assert(await page.locator('.lead-ok').count() === 0, 'invalid email success')

    await page.locator('[name=website]').evaluate(el => {el.value = 'https://spam.example'})
    await page.fill('[name=email]', 'ada@northwind.example')
    await page.click('#lead-form button[type=submit]')
    await page.waitForFunction(() => /try again/i.test(document.querySelector('#lead-err')?.textContent || ''))
    assert(posts.length === 0, 'honeypot posted')
    assert(await page.locator('.lead-ok').count() === 0, 'honeypot success')
    await page.locator('[name=website]').evaluate(el => {el.value = ''})

    await page.fill('[name=role]', 'Head of RevOps')
    await page.check('[name=platform][value="Other"]')
    await page.fill('[name=note]', 'Comparing refund answers next')
    await page.click('#lead-form button[type=submit]')
    await page.waitForTimeout(250)
    assert(posts.length === 1, 'request not sent ' + posts.length)
    assert(await page.locator('.lead-ok').count() === 0, 'success before the response')
    release()
    await page.waitForFunction(() => /try again/i.test(document.querySelector('#lead-err')?.textContent || ''))
    assert(/try again/i.test(await page.locator('#lead-err').innerText()), 'failure asks to try again')
    assert(await page.locator('.lead-ok').count() === 0, 'failure still thanks the visitor')
    assert(await page.inputValue('[name=name]') === 'Ada Lovelace', 'fields kept for retry')
    const sent = posts[0]
    assert(sent.method === 'POST', 'method ' + sent.method)
    assert(JSON.stringify(Object.keys(sent.body).sort()) === JSON.stringify(['company','email','name','note','platforms','role']), 'payload keys ' + Object.keys(sent.body))
    assert(sent.body.email === 'ada@northwind.example' && sent.body.note === 'Comparing refund answers next', 'payload values')
    assert(JSON.stringify(sent.body.platforms) === JSON.stringify(['Other']), 'payload platforms')

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
    assert(full && full.x <= 1 && full.y <= 1 && full.width >= 389 && full.height >= 843, 'set phone fullscreen ' + JSON.stringify(full))
    assert(await overflow(p) <= 1, 'set 390 form overflow ' + await overflow(p))
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
