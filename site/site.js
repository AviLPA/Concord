const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const nav = $('#nav')
const onScroll = () => nav.classList.toggle('scrolled', scrollY > 24)
addEventListener('scroll', onScroll, { passive: true })
onScroll()

// Siblings that reveal together are staggered.
for (const el of $$('.reveal')) {
  const sibs = $$(':scope > .reveal', el.parentElement)
  if (sibs.length > 1) el.style.setProperty('--d', `${sibs.indexOf(el) * 0.08}s`)
}

function countUp(el) {
  const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0)
  const pre = el.dataset.prefix || '', suf = el.dataset.suffix || ''
  if (reduced) return (el.textContent = pre + to.toFixed(dec) + suf)
  const t0 = performance.now(), dur = 1400
  const tick = (t) => {
    const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3)
    el.textContent = pre + (to * e).toFixed(dec) + suf
    if (p < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

const io = new IntersectionObserver((entries) => {
  for (const en of entries) {
    if (!en.isIntersecting) continue
    en.target.classList.add('in')
    $$('[data-count]', en.target).forEach(countUp)
    io.unobserve(en.target)
  }
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' })
$$('.reveal').forEach((el) => io.observe(el))

// Product tour: the step nearest the viewport centre drives the sticky screen.
const steps = $$('.step'), shots = $$('.shots img'), bar = $('#tourbar')
const setStep = (i) => {
  steps.forEach((s, j) => s.classList.toggle('on', j === i))
  shots.forEach((s, j) => s.classList.toggle('on', j === i))
  bar.style.width = `${((i + 1) / steps.length) * 100}%`
}
const tourIo = new IntersectionObserver((entries) => {
  for (const en of entries) if (en.isIntersecting) setStep(+en.target.dataset.shot)
}, { rootMargin: '-45% 0px -45% 0px' })
steps.forEach((s) => tourIo.observe(s))
setStep(0)

// Hero: four different answers converge into one official answer.
const stage = $('#stage'), qtext = $('#qtext'), statusText = $('#statusText'), score = $('#score')
const agents = $$('.agent', stage)
const QUESTION = qtext.textContent
const FINAL = 28

function tweenNum(el, from, to, dur) {
  return new Promise((res) => {
    const t0 = performance.now()
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3)
      el.textContent = Math.round(from + (to - from) * e)
      p < 1 ? requestAnimationFrame(tick) : res()
    }
    requestAnimationFrame(tick)
  })
}

function finalState() {
  stage.className = 'stage reveal in s-answer s-publish s-done'
  agents.forEach((a) => { a.classList.add('ok'); $('.num', a).textContent = FINAL })
  statusText.textContent = '4 agents · 1 answer'
  score.textContent = 86
}

async function heroLoop() {
  while (true) {
    stage.classList.remove('s-answer', 's-flow', 's-publish', 's-done')
    agents.forEach((a) => { a.classList.remove('ok', 'bump'); $('.num', a).textContent = '··' })
    score.textContent = 71
    statusText.textContent = 'Asking 4 agents…'
    qtext.textContent = ''
    for (const ch of QUESTION) { qtext.textContent += ch; await sleep(28) }
    await sleep(400)
    stage.classList.add('s-answer')
    for (const a of agents) { $('.num', a).textContent = a.dataset.from; await sleep(260) }
    statusText.textContent = '4 agents · 4 answers'
    await sleep(1500)
    stage.classList.add('s-flow')
    statusText.textContent = 'Routed to owner · Sara Klein'
    await sleep(1700)
    stage.classList.add('s-publish')
    statusText.textContent = 'Customer health v2 · official'
    await sleep(900)
    for (const a of agents) {
      const n = $('.num', a)
      a.classList.add('bump')
      await tweenNum(n, +n.textContent, FINAL, 520)
      a.classList.remove('bump')
      a.classList.add('ok')
      await sleep(120)
    }
    stage.classList.add('s-done')
    statusText.textContent = '4 agents · 1 answer'
    await tweenNum(score, 71, 86, 900)
    await sleep(4200)
  }
}

reduced ? finalState() : heroLoop()
