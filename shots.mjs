// High-res screenshots of key screens. Requires `npm run preview` on :4173.
import {chromium} from 'playwright'
const D='/workspace/concord-shots/',U='http://localhost:4173/#/'
const b=await chromium.launch()
const at=async(p,step)=>{await p.goto(U+'watch');await p.waitForTimeout(300);if(!await p.$('.wcard [data-w=start]')){await p.reload();await p.waitForTimeout(600)}await p.click(`[data-wgo="${step}"]`);await p.waitForTimeout(400)}
const d=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:2})
await d.goto(U+'overview');await d.waitForTimeout(500);await d.screenshot({path:D+'01-overview-watch-cta.png'})
await at(d,1);await d.screenshot({path:D+'02-watch-live-answers-desktop.png'})
await at(d,5);await d.screenshot({path:D+'03-watch-live-dana-desktop.png'})
await at(d,7);await d.screenshot({path:D+'04-watch-live-tom-desktop.png'})
const m=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:3})
await at(m,1);await m.click('[data-wside=chat]');await m.waitForTimeout(500);await m.screenshot({path:D+'05-watch-live-chat-phone.png'})
await at(m,3);await m.click('[data-wside=be]');await m.waitForTimeout(500);await m.screenshot({path:D+'06-watch-live-backend-phone.png'})
await b.close()
