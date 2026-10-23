import {chromium} from 'playwright'
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:2})
const U='http://localhost:4173/#/';const D='/workspace/concord-shots/'
await p.goto(U+'overview');await p.waitForTimeout(500);await p.screenshot({path:D+'01-overview.png'})
await p.goto(U+'conflicts/c1');await p.waitForTimeout(400);await p.screenshot({path:D+'02-conflict-diff.png'})
await p.click('#mkoff');await p.waitForTimeout(4500);await p.screenshot({path:D+'03-conflict-resolved.png'})
await p.goto(U+'live');await p.click('#lplay');await p.waitForTimeout(11000);await p.screenshot({path:D+'04-live-build.png'})
await p.goto(U+'agents');await p.click('tr[data-agent="0"]');await p.waitForTimeout(400);await p.screenshot({path:'/tmp/agents.png'})
for(const r of ['jobs','blocks','integrations']){await p.goto(U+r);await p.waitForTimeout(300);await p.screenshot({path:`/tmp/${r}.png`})}
const m=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});await m.goto(U+'overview');await m.waitForTimeout(400);await m.screenshot({path:'/tmp/mob.png'})
await m.goto(U+'conflicts/c2');await m.waitForTimeout(400);await m.screenshot({path:'/tmp/mob2.png'})
await b.close()
