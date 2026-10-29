const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const nav = $('#nav')
const onScroll = () => nav.classList.toggle('scrolled', scrollY > 12)
addEventListener('scroll', onScroll, { passive: true })
onScroll()

for (const el of $$('.reveal')) {
  const sibs = $$(':scope > .reveal', el.parentElement)
  if (sibs.length > 1) el.style.setProperty('--d', `${sibs.indexOf(el) * 0.1}s`)
}
const io = new IntersectionObserver((entries) => {
  for (const en of entries) if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target) }
}, { threshold: 0.15 })
$$('.reveal').forEach((el) => io.observe(el))

// Statement: words light up as the line scrolls through the viewport.
const statement = $('#statement')
const wrapWords = (node) => {
  for (const child of [...node.childNodes]) {
    if (child.nodeType === 3) {
      const frag = document.createDocumentFragment()
      child.textContent.split(/(\s+)/).forEach((t) => {
        if (!t.trim()) return frag.append(t)
        const s = document.createElement('span'); s.className = 'w'; s.textContent = t; frag.append(s)
      })
      child.replaceWith(frag)
    } else wrapWords(child)
  }
}
if (!reduced) {
  wrapWords(statement)
  const words = $$('.w', statement)
  const light = () => {
    const r = statement.getBoundingClientRect()
    const p = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (innerHeight * 0.5)))
    const n = Math.round(p * words.length)
    words.forEach((w, i) => w.classList.toggle('lit', i < n))
  }
  addEventListener('scroll', light, { passive: true })
  light()
}

// How it works: tabs auto-advance while the section is visible; hover pauses.
const how = $('#how'), tabs = $$('.tab'), shots = $$('.screen img')
const DUR = 6000
let cur = 0, timer = null, remaining = DUR, startedAt = 0
const show = (i) => {
  cur = i
  tabs.forEach((t, j) => { t.classList.toggle('on', j === i); t.setAttribute('aria-selected', j === i) })
  shots.forEach((s, j) => s.classList.toggle('on', j === i))
  const bar = $('.bar', tabs[i]); bar.style.animation = 'none'; bar.offsetWidth; bar.style.animation = ''
  remaining = DUR; schedule()
}
const schedule = () => {
  clearTimeout(timer)
  if (reduced || how.classList.contains('paused') || !how.dataset.visible) return
  startedAt = performance.now()
  timer = setTimeout(() => show((cur + 1) % tabs.length), remaining)
}
tabs.forEach((t, i) => t.addEventListener('click', () => show(i)))
how.addEventListener('mouseenter', () => { how.classList.add('paused'); clearTimeout(timer); remaining -= performance.now() - startedAt })
how.addEventListener('mouseleave', () => { how.classList.remove('paused'); schedule() })
new IntersectionObserver(([en]) => {
  if (en.isIntersecting && !how.dataset.visible) { how.dataset.visible = '1'; show(cur) }
}, { threshold: 0.3 }).observe(how)
how.style.setProperty('--dur', `${DUR}ms`)
if (reduced) $$('.bar').forEach((b) => (b.style.width = '0'))

// Hero: three conflicting answers converge to the official 28.
const card = $('#card'), verdict = $('#verdict'), items = $$('.agents li', card)
const FINAL = 28
const tween = (el, from, to, dur) => new Promise((res) => {
  const t0 = performance.now()
  const tick = (t) => {
    const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3)
    el.textContent = Math.round(from + (to - from) * e)
    p < 1 ? requestAnimationFrame(tick) : res()
  }
  requestAnimationFrame(tick)
})
const resolved = () => { card.classList.add('done'); verdict.textContent = 'Resolved · 1 answer' }

async function heroLoop() {
  while (true) {
    card.classList.remove('done')
    verdict.textContent = 'Conflict · 4 answers'
    items.forEach((li) => { li.classList.remove('ok'); $('strong', li).textContent = li.dataset.from })
    await sleep(3200)
    for (const li of items.filter((li) => !li.classList.contains('official'))) {
      li.classList.add('bump')
      await tween($('strong', li), +li.dataset.from, FINAL, 700)
      li.classList.remove('bump'); li.classList.add('ok')
      await sleep(180)
    }
    resolved()
    await sleep(4200)
  }
}
if (reduced) { items.forEach((li) => { li.classList.add('ok'); $('strong', li).textContent = FINAL }); resolved() }
else heroLoop()

// Same-question section: the Sales churn-score conflict resolves once on scroll.
const sameRow = $('#compare .row.main'), sameVerdict = $('#sameVerdict')
const resolveSame = () => { sameRow.classList.add('resolved'); sameVerdict.textContent = 'Resolved · 1 answer' }
if (reduced) {
  $$('.vals b', sameRow).forEach((b) => (b.textContent = FINAL))
  resolveSame()
} else {
  new IntersectionObserver(async ([en], obs) => {
    if (!en.isIntersecting) return
    obs.disconnect()
    await sleep(1800)
    for (const b of $$('.vals b', sameRow)) { await tween(b, +b.dataset.from, FINAL, 600); await sleep(120) }
    resolveSame()
  }, { threshold: 0.5 }).observe(sameRow)
}
