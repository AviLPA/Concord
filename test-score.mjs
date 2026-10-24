// Unit test for the one consistency scorer. Loads the ESM model through Vite.
import {createServer} from 'vite'

const errs = []
const fail = m => {errs.push(m); console.error('FAIL', m)}
const assert = (ok, m) => {if(!ok) fail(m)}
const row = (parts, job) => parts.rows.find(r => r.job === job)

const server = await createServer({server:{middlewareMode:true}, appType:'custom', logLevel:'error'})
const M = await server.ssrLoadModule('/src/model.js')
try{
  assert(M.answerKey('28') === 'n:28', '28 key')
  assert(M.answerKey('28.4') === 'n:28' && M.answerKey('27.6') === 'n:28', 'round to 28')
  assert(M.answerKey('28.5') === 'n:29', 'round half up')
  assert(M.answerKey('$4.8M') === 's:$4.8M' && M.answerKey('3×') === 's:3×', 'non-numbers stay text')
  assert(M.answerKey('65') !== M.answerKey('70'), '65 and 70 differ')

  const fresh = M.scores(M.emptyState())
  assert(fresh.score === 53 && fresh.maj === 10 && fresh.n === 19, 'fresh consistency '+JSON.stringify({score:fresh.score, maj:fresh.maj, n:fresh.n}))
  assert(row(fresh, 'Customer health').score === 25, 'customer health fresh')
  assert(row(fresh, 'ARR').score === 33, 'arr')
  assert(row(fresh, 'Discount approval').score === 75, 'discount mode is Needs VP')
  assert(row(fresh, 'Refund policy').score === 50, 'refund')
  assert(row(fresh, 'Onboarding FAQ').score === 100, 'onboarding agrees')
  assert(row(fresh, 'Lead scoring').score === 50, 'lead')
  assert(row(fresh, 'Pipeline coverage').score === 50, 'pipeline')
  assert(row(fresh, 'Security questionnaire').score === null && row(fresh, 'Security questionnaire').count === 1, 'one agent is unscored')
  assert(M.jobScore('Customer health', M.emptyState()) === fresh.rows.find(r => r.job === 'Customer health').score, 'job score uses scores()')
  assert(M.companyParts(M.emptyState()).score === fresh.score, 'company score uses scores()')

  const published = M.storyState(0)
  assert(M.jobScore('Customer health', published) === 25, 'official 28 before adoption is 25')
  assert(M.scores(published).score === 53, 'company stays 53 until agents match')

  const synced = M.storyState(3)
  assert(M.jobScore('Customer health', synced) === 100, 'this job is 100')
  const done = M.scores(synced)
  assert(done.score === 68 && done.maj === 13 && done.n === 19, 'synced consistency '+JSON.stringify({score:done.score, maj:done.maj, n:done.n}))

  const minority = M.emptyState()
  minority.resolved.c3 = 'official'
  minority.wins.c3 = 1
  minority.origin.c3 = 'agent'
  assert(row(M.scores(minority), 'Discount approval').score === 25, 'official answer beats the most common one')

  const saved = [0, 1, 2, 3].map(i => M.AGENTS[i].ans)
  try{
    M.AGENTS[0].ans = '27.6'
    M.AGENTS[1].ans = '28.4'
    M.AGENTS[2].ans = '17'
    M.AGENTS[3].ans = '28'
    assert(M.jobScore('Customer health', M.emptyState()) === 75, 'rounded numbers count as the same answer')
  }finally{
    saved.forEach((ans, i) => {M.AGENTS[i].ans = ans})
  }
  assert(M.jobScore('Customer health', M.emptyState()) === 25, 'answers restored')

  assert(M.SCORE_COMPANY === 'How many of your agents agree, out of 100. Bigger jobs count more. 100 means every job is in sync.', 'company line')
  assert(M.SCORE_JOB === 'How many agents doing this job match the official answer, out of 100. 100 means they all agree.', 'job line')
}catch(e){
  fail(e.stack || e.message)
}finally{
  await server.close()
}
console.log('ERRORS:', errs.length ? errs : 'none')
if(errs.length) process.exit(1)
