// High-res screenshots of landing + hands-on onboarding. Requires `npm run preview` on :4173.
import {chromium} from 'playwright'
const D='/workspace/concord-shots/',U='http://localhost:4173/'
const b=await chromium.launch()
const d=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:2})
await d.goto(U);await d.evaluate(()=>localStorage.clear());await d.reload();await d.waitForTimeout(600);await d.screenshot({path:D+'10-landing-desktop.png'})
const m=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:3})
await m.goto(U);await m.waitForTimeout(600);await m.screenshot({path:D+'11-landing-phone.png'})
await d.goto(U+'#/start');await d.waitForTimeout(400);await d.click('[data-obws]');await d.waitForTimeout(300)
await d.click('[data-connect=n8n]');await d.waitForTimeout(300);await d.click('[data-ntest]');await d.waitForSelector('[data-nsave]:not([disabled])');await d.waitForTimeout(300);await d.screenshot({path:D+'12-connect-n8n-modal.png'});await d.click('[data-nsave]');await d.waitForSelector('.modal',{state:'detached'})
await d.click('[data-connect=claude]');await d.waitForTimeout(500);await d.screenshot({path:D+'13-connect-claude-consent.png'});await d.click('[data-cauth]');await d.waitForSelector('.modal',{state:'detached'})
await d.click('.obfoot [data-obgo=scan]');await d.waitForTimeout(300);await d.click('[data-scan]');await d.waitForTimeout(7600);await d.screenshot({path:D+'14-scan-mid-run.png'})
await d.waitForSelector('#toSearch:not([disabled])',{timeout:40000});await d.click('#toSearch');await d.waitForTimeout(300);await d.click('[data-sq="customer health"]');await d.waitForTimeout(500);await d.screenshot({path:D+'15-search-results.png'})
await d.click('[data-resolve=c1]');await d.waitForTimeout(400);await d.click('[data-rwrite]');await d.click('[data-rsem=dbt]');await d.waitForTimeout(200);await d.screenshot({path:D+'16-resolve-sources.png'})
await d.click('[data-rpick="3"]');await d.click('[data-rnext]');await d.click('[data-rchip]');await d.click('[data-rpublish]');await d.waitForTimeout(300);await d.click('[data-rsuggest]');await d.waitForSelector('.rdone',{timeout:15000});await d.waitForTimeout(500);await d.screenshot({path:D+'17-resolve-adopted.png'})
await d.click('[data-obfinish]');await d.waitForTimeout(700);await d.screenshot({path:D+'18-dashboard-after-onboarding.png'})
await m.goto(U+'#/search/customer%20health');await m.waitForTimeout(600);await m.screenshot({path:D+'19-search-phone.png'})
await b.close()
