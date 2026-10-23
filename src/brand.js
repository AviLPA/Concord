// Wordmark is live text. Change BRAND to rename every lockup.
export const BRAND = 'concord'
export const Brand = BRAND.charAt(0).toUpperCase() + BRAND.slice(1)

const ICO = {
  sync: '<circle cx="8" cy="8" r="6.6"/><path d="M5 8.2l2.1 2.1 4-4.3"/>',
  review: '<circle cx="8" cy="8" r="6.6"/><path d="M8 4.6v3.6l2.4 1.5"/>',
  risk: '<path d="M8 1.8l6.6 11.6H1.4z"/><path d="M8 6.2v3.2"/><circle cx="8" cy="11.4" r=".6" fill="currentColor" stroke="currentColor"/>',
  drift: '<path d="M1.6 10.5h5.2l5.6-5.6"/><path d="M8.6 4.9h3.8v3.8"/>',
  conflict: '<circle cx="8" cy="8" r="6.6"/><path d="M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8"/>',
  unknown: '<circle cx="8" cy="8" r="6.6" stroke-dasharray="2.6 2.4"/><circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none"/>',
}

export function sIcon(k, size = 14) {
  return `<svg class="sico" width="${size}" height="${size}" viewBox="0 0 16 16" aria-hidden="true">${ICO[k] || ''}</svg>`
}

export function status(k, label, opt = {}) {
  const cls = ['st', 'st-' + k, opt.subtle ? 'subtle' : '', opt.big ? 'big' : ''].filter(Boolean).join(' ')
  return `<span class="${cls}">${sIcon(k, opt.big ? 16 : 14)}<span>${label}</span></span>`
}

export function tag(text) {
  return `<span class="tag">${text}</span>`
}

export function mark(h = 20) {
  const w = Math.round(h * 16) / 10
  return `<svg class="mark" width="${w}" height="${h}" viewBox="0 0 32 20" aria-hidden="true"><line x1="1" y1="10" x2="31" y2="10"/><circle cx="5" cy="10" r="3.2"/><circle cx="12" cy="10" r="3.2"/><circle cx="19" cy="10" r="3.2"/><circle class="sync" cx="26.5" cy="10" r="3.2"/></svg>`
}

export function lockup(h = 20) {
  return `<span class="lockup" style="--mh:${h}px">${mark(h)}<b class="wordmark">${BRAND}</b></span>`
}
