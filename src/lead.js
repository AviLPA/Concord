// Contact form. POSTs JSON to VITE_LEAD_ENDPOINT when that is set.
// TODO: persist the lead when VITE_LEAD_ENDPOINT is unset. Storage is wired separately; until then, log the payload and show success.
const raw = import.meta.env.VITE_LEAD_ENDPOINT
export const LEAD_ENDPOINT = typeof raw === 'string' ? raw.trim() : ''
export const leadReady = () => LEAD_ENDPOINT.length > 0

const esc = s => String(s ?? '').replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PLATFORMS = ['Claude', 'n8n', 'Other']
const empty = () => ({name:'', email:'', company:'', role:'', platforms:[], note:''})

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

export function leadCta(extra = ''){
  const cls = ['btn', extra].filter(Boolean).join(' ')
  return `<button type="button" class="${cls}" data-lead data-lead-cta>Want to hear more?</button>`
}

function checks(){
  return PLATFORMS.map(p => `<label class="lead-check"><input type="checkbox" name="platform" value="${p}" ${fields.platforms.includes(p) ? 'checked' : ''}/>${p}</label>`).join('')
}

function formHTML(){
  return `<p>Tell us a little about your team and we'll be in touch.</p>
<form id="lead-form" novalidate>
<div class="hp" aria-hidden="true"><label>Leave blank<input name="website" tabindex="-1" autocomplete="off"/></label></div>
<label class="fl">Name<input name="name" autocomplete="name" required value="${esc(fields.name)}"/></label>
<label class="fl">Work email<input name="email" type="email" autocomplete="email" inputmode="email" required value="${esc(fields.email)}"/></label>
<label class="fl">Company<input name="company" autocomplete="organization" required value="${esc(fields.company)}"/></label>
<label class="fl">Role<input name="role" autocomplete="organization-title" value="${esc(fields.role)}"/></label>
<fieldset class="fl lead-plats"><legend>Where your teams build agents</legend>${checks()}</fieldset>
<label class="fl">Anything you'd like us to know?<textarea name="note" rows="4">${esc(fields.note)}</textarea></label>
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
  if(!open || !root) return
  root.insertAdjacentHTML('beforeend', html())
}

function payloadOf(fields){
  return {
    name: fields.name,
    email: fields.email,
    company: fields.company,
    role: fields.role,
    platforms: fields.platforms,
    note: fields.note,
  }
}

export function bindLead(render){
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape' && open){closeLead(); render()}
  })
  document.addEventListener('click', e => {
    if(e.target.closest('[data-lead]')){
      e.preventDefault()
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
    if(sending || done) return
    const fd = new FormData(form)
    fields = {
      name: String(fd.get('name') || '').trim(),
      email: String(fd.get('email') || '').trim(),
      company: String(fd.get('company') || '').trim(),
      role: String(fd.get('role') || '').trim(),
      platforms: fd.getAll('platform').map(String).filter(v => PLATFORMS.includes(v)),
      note: String(fd.get('note') || '').trim(),
    }
    const website = String(fd.get('website') || '').trim()
    if(website){
      error = 'Something went wrong. Please try again.'
      render()
      return
    }
    if(!fields.name || !fields.email || !fields.company){
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
    const payload = payloadOf(fields)
    error = ''
    if(!leadReady()){
      // TODO: persist the lead when VITE_LEAD_ENDPOINT is unset.
      console.log(JSON.stringify(payload))
      if(gen !== sendGen) return
      done = true
      render()
      return
    }
    sending = true
    render()
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
