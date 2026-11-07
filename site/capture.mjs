// Regenerates the product screenshots used by the showcase site (site/assets/product/).
// Requires `npm run preview` on :4173 and `npx playwright install chromium`.
import {chromium} from 'playwright'
const D=new URL('./assets/product/',import.meta.url).pathname,U=process.argv[2]||'http://localhost:4173/app/'
const b=await chromium.launch()
const d=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1.5})
const shot=(n)=>d.screenshot({path:D+n+'.jpg',type:'jpeg',quality:84})
await d.goto(U);await d.evaluate(()=>localStorage.clear());await d.reload();await d.waitForTimeout(500)
await d.goto(U+'#/start');await d.waitForTimeout(400);await d.click('[data-obws]');await d.waitForTimeout(300)
await d.click('[data-connect=n8n]');await d.waitForTimeout(300);await d.click('[data-ntest]');await d.waitForSelector('[data-nsave]:not([disabled])');await d.click('[data-nsave]');await d.click('.mf [data-mclose]')
await d.click('[data-connect=claude]');await d.waitForTimeout(500);await d.click('[data-cauth]');await d.waitForSelector('.mok');await d.click('.mf [data-mclose]')
await d.click('.obfoot [data-obgo=scan]');await d.waitForTimeout(300);await d.click('[data-scan]');await d.waitForTimeout(9000);await shot('scan')
await d.waitForSelector('#toSearch:not([disabled])',{timeout:40000});await d.click('#toSearch');await d.waitForTimeout(300);await d.click('[data-sq="customer health"]');await d.waitForTimeout(600);await shot('search')
await d.click('[data-resolve=c1]');await d.waitForTimeout(400);await d.click('[data-rpick="2"]');await d.click('[data-rnext]');await d.click('[data-rchip]');await d.waitForTimeout(300)
await d.click('[data-rpublish]');await d.waitForTimeout(300);await d.click('[data-rrewire]');await d.waitForSelector('.rdone',{timeout:15000});await d.waitForTimeout(600);await shot('resolve-converged')
await b.close()
