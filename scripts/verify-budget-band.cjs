// scripts/verify-budget-band.cjs
// Standalone JS port of computeBudgetBand for verification.
// Mirror src/features/companies/lib/budget-band.ts exactly.

function computeBudgetBand(spendUsd, capUsd, thresholdPct) {
  if (capUsd == null || capUsd <= 0) {
    return { band: 'unconfigured', pct: 0, rawPct: 0 }
  }
  const rawPct = (spendUsd / capUsd) * 100
  const pct = Math.min(100, Math.max(0, rawPct))
  const t1 = thresholdPct ?? 80
  let band
  if (rawPct < t1) band = 'normal'
  else if (rawPct < 95) band = 'standard'
  else if (rawPct < 97) band = 'economy'
  else band = 'exhausted'
  return { band, pct, rawPct }
}

const cases = [
  // thresholdPct verildiğinde birinci eşik kayar
  { args: [69, 100, 70], expect: 'normal',    msg: 'spend<t1 → normal' },
  { args: [70, 100, 70], expect: 'standard',  msg: 'spend>=t1 → standard' },
  { args: [94, 100, 70], expect: 'standard',  msg: 'spend<95 → hala standard' },
  { args: [95, 100, 70], expect: 'economy',   msg: '95 sabit' },
  { args: [97, 100, 70], expect: 'exhausted', msg: '97 sabit' },

  // thresholdPct undefined → Sprint 2 davranışı korunur (regression guard)
  { args: [79, 100],     expect: 'normal',    msg: 'default<80 → normal' },
  { args: [80, 100],     expect: 'standard',  msg: 'default>=80 → standard' },
  { args: [95, 100],     expect: 'economy',   msg: 'default 95' },
  { args: [97, 100],     expect: 'exhausted', msg: 'default 97' },

  // edge: thresholdPct=80 (default ile aynı) → Sprint 2 ile aynı
  { args: [80, 100, 80], expect: 'standard',  msg: 'explicit 80 == undefined' },

  // unconfigured
  { args: [50, null],    expect: 'unconfigured', msg: 'null cap' },
  { args: [50, 0],       expect: 'unconfigured', msg: 'zero cap' },
]

let pass = 0, fail = 0
for (const c of cases) {
  const result = computeBudgetBand(...c.args)
  const ok = result.band === c.expect
  if (ok) { pass++ } else { fail++; console.error(`FAIL: ${c.msg} — got ${result.band}, expected ${c.expect}`) }
}
console.log(`${pass}/${pass + fail} cases passed`)
process.exit(fail === 0 ? 0 : 1)
