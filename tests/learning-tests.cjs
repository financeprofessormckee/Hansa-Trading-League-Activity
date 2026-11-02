'use strict';
const assert = require('node:assert/strict');
const M = require('../js/model.js'), L = require('../js/learning.js');
let checks = 0;
function eq(a, b, why) { checks++; assert.deepEqual(a, b, why); }
function ok(value, why) { checks++; assert.ok(value, why); }
// Same physically feasible plan: cheap transport benefits both cities; expensive
// transport makes both lose. Production instructions and membership stay fixed.
const f = M.fixture('transport');
const before = JSON.stringify(f);
const cases = L.compare(f.state, f.draft);
eq(JSON.stringify(f), before, 'Comparison cannot mutate the live session or draft');
eq(cases.map(c => c.scenario), ['inexpensive', 'expensive', 'equal'], 'All economies compared');
for (const c of cases) {
  ok(c.result.valid, 'Small-shipment control is feasible in all economies');
  eq(c.result.plan, M.preview(f.state, f.draft).plan, 'Comparison holds the complete plan fixed');
}
ok(cases[0].result.canExecute && cases[0].result.rows[0].gain > 0, 'Cheap exchange has mutual gains');
eq(cases[1].result.rejected, ['birch'], 'Expensive exchange refused');
const independentCostlyUtility = 2 * Math.sqrt(32.5 * 31.25);
ok(Math.abs(cases[1].result.rows[0].utility - independentCostlyUtility) < 1e-10, 'Counterfactual matches independent accounting');
eq(cases[2].result.rejected, ['birch'], 'Equal opportunity costs do not create mutual gains');
eq(cases[2].result.rows[1].baseline, 2 * Math.sqrt(25) * Math.sqrt(12.5), 'Each scenario uses its own autarky baseline');
const worked = M.fixture('trade');
const large = L.compare(worked.state, worked.draft);
ok(large[0].result.canExecute, 'Original worked exchange is executable');
eq(large[1].result.valid, false, 'High transport can make the same shipments impossible');
eq(large[2].result.valid, false, 'Changed productivity can make exports exceed output');
for (const c of large.slice(1)) ok(!Object.hasOwn(c.result, 'score'), 'Impossible plan has no scored outcome');
worked.draft.shipments[0].amount = '';
for (const c of L.compare(worked.state, worked.draft)) eq(c.result.valid, false, 'Blank quantity is not treated as zero');
let { state, draft } = M.fixture('trade');
for (let i = 0; i < 6; i++) ({ state, draft } = M.execute(state, draft));
const snapshot = JSON.stringify(state), text = L.csv(state);
eq(JSON.stringify(state), snapshot, 'Export does not mutate history');
ok(text.endsWith('\r\n'), 'CSV uses CRLF records');
const rows = text.trim().split('\r\n').map(line => line.slice(1, -1).split('","'));
eq(rows.length, 25, 'One header plus all four cities for every completed turn');
eq(rows[0].length, 25, 'Accounting fields and membership fields exported');
for (const row of rows.slice(1)) eq(row.length, rows[0].length, 'Every CSV row has the same schema');
const index = name => rows[0].indexOf(name);
const firstAlder = rows[1], firstBirch = rows[2], firstCedar = rows[3], lastAlder = rows[21];
eq(firstAlder[index('grain_produced')], '95', 'Exported production matches independent worked accounting');
eq(firstAlder[index('grain_consumed')], '45', 'Exported retained grain is correct');
eq(firstBirch[index('joined')], 'true', 'Admission recorded only on first turn');
eq(rows[6][index('joined')], 'false', 'Existing member is not recorded as a newcomer');
eq(firstCedar[index('grain_share_percent')], '50', 'Outsiders use actual autarky allocation');
eq(Number(lastAlder[index('cumulative_city_gain')]), state.cumulative[0], 'Exported city gains reconcile');
eq(Number(lastAlder[index('cumulative_score')]), state.score, 'Export preserves full-precision score');
// A loss and an empty league are valid records too.
const lossState = M.initial(), lossPlan = M.draft(); lossPlan.shares[0] = 100;
const loss = M.execute(lossState, lossPlan).state;
ok(L.csv(loss).includes('"true","false","true","false"'), 'Departure is exported, not silently omitted');
console.log(`Hansa learning tools: ${checks} checks, 0 failures.`);
