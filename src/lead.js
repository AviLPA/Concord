// Contact form. Rendered only when VITE_LEAD_ENDPOINT is set. No endpoint, no form, no success message.
const raw = import.meta.env.VITE_LEAD_ENDPOINT
export const LEAD_ENDPOINT = typeof raw === 'string' ? raw.trim() : ''
export const leadReady = () => LEAD_ENDPOINT.length > 0

const esc = s => String(s ?? '').replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const empty = () => ({name:'', email:'', company:'', hope:''})

let open = false
let done = false
let sending = false
let error = ''
let fields = empty()
let sendGen = 0

export function closeLead(){
  open = false
  done = false
  sending = false
  error = ''
  sendGen++
}

export function leadCta(){
  if(!leadReady()) return `<button type="button" class="btn" data-lead-cta disabled>Coming soon</button>`
  return `<button type="button" class="btn" data-lead data-lead-cta>Want to hear more?</button>`
}

function formHTML(){
  return `<p>Tell us a little about your team and we'll be in touch.</p>
<form id="lead-form" novalidate>
<div class="hp" aria-hidden="true"><label>Leave blank<input name="website" tabindex="-1" autocomplete="off"/></label></div>
<label class="fl">Name<input name="name" autocomplete="name" required value="${esc(fields.name)}"/></label>
<label class="fl">Work email<input name="email" type="email" autocomplete="email" inputmode="email" required value="${esc(fields.email)}"/></label>
<label class="fl">Company<input name="company" autocomplete="organization" required value="${esc(fields.company)}"/></label>
<label class="fl">What are you hoping Concord solves?<textarea name="hope" rows="4">${esc(fields.hope)}</textarea></label>
${error ? `<p class="lead-err" id="lead-err" role="alert">${esc(error)}</p>` : ''}
<div class="mf"><button class="btn p" type="submit" ${sending ? 'disabled' : ''}>Send</button></div>
</form>`
}

function html(){
  const body = done
    ? `<p class="lead-ok">Thanks, we got it. We'll be in touch soon.</p>`
    : formHTML()
  return `<div class="mbg" data-lead-close></div><div class="modal lead" role="dialog" aria-modal="true" aria-labelledby="lead-title"><div class="mh"><h2 id="lead-title">Want to hear more?</h2><button type="button" class="iconbtn" data-lead-close aria-label="Close" style="margin-left:auto">×</button></div>${body}</div>`
}

export function paintLead(root){
  if(!leadReady() || !open || !root) return
  root.insertAdjacentHTML('beforeend', html())
}

export function bindLead(render){
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape' && open){closeLead(); render()}
  })
  document.addEventListener('click', e => {
    if(e.target.closest('[data-lead]')){
      e.preventDefault()
      if(!leadReady()) return
      open = true
      done = false
      sending = false
      error = ''
      fields = empty()
      sendGen++
      render()
      return
    }
    if(e.target.closest('[data-lead-close]')){closeLead(); render()}
  })
  document.addEventListener('submit', async e => {
    const form = e.target
    if(!form || form.id !== 'lead-form') return
    e.preventDefault()
    if(!leadReady() || sending || done) return
    const fd = new FormData(form)
    fields = {
      name: String(fd.get('name') || '').trim(),
      email: String(fd.get('email') || '').trim(),
      company: String(fd.get('company') || '').trim(),
      hope: String(fd.get('hope') || '').trim(),
    }
    const website = String(fd.get('website') || '').trim()
    if(website){
      error = 'Something went wrong. Please try again.'
      render()
      return
    }
    if(!fields.name || !fields.company){
      error = 'Name, work email, and company are required.'
      render()
      return
    }
    if(!EMAIL.test(fields.email)){
      error = 'Enter a valid work email.'
      render()
      return
    }
    const gen = sendGen
    sending = true
    error = ''
    render()
    const payload = {name:fields.name, email:fields.email, company:fields.company, hope:fields.hope}
    try{
      const res = await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      })
      if(gen !== sendGen) return
      if(!res.ok) throw new Error('Lead request failed')
      done = true
      error = ''
    }catch{
      if(gen !== sendGen) return
      error = 'Something went wrong. Please try again.'
    }finally{
      if(gen === sendGen){sending = false; render()}
    }
  })
}
