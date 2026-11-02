/* Economic concepts: David Friedman. Development: Eric McKee.
   Fresh deterministic browser adaptation; see SPECIFICATION.md. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HansaModel = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var EPS = 1e-9, IDS = ['alder', 'birch', 'cedar', 'dune'], NAMES = ['Alder', 'Birch', 'Cedar', 'Dune'];
  var GOODS = ['grain', 'cloth'];
  var SCENARIOS = {
    inexpensive: { name: 'Inexpensive transport', costs: [[1, 2], [2, 1], [2, 4], [1, 1]], factor: 1 },
    expensive: { name: 'Expensive transport', costs: [[1, 2], [2, 1], [2, 4], [1, 1]], factor: 15 },
    equal: { name: 'Equal opportunity costs', costs: [[1, 2], [2, 4], [3, 6], [0.5, 1]], factor: 1 }
  };
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function name(id) { return NAMES[IDS.indexOf(id)] || 'Unknown city'; }
  function knownScenario(id) { return Object.prototype.hasOwnProperty.call(SCENARIOS, id); }
  function route(scenario, from, to) {
    if (!knownScenario(scenario) || !IDS.includes(from) || !IDS.includes(to) || from === to) throw new RangeError('Invalid route.');
    var pair = [IDS.indexOf(from), IDS.indexOf(to)].sort().join('');
    var water = pair === '01' || pair === '12';
    return { kind: water ? 'Water' : 'Land', cost: (water ? 0.1 : 0.4) * SCENARIOS[scenario].factor };
  }
  function utility(g, c) { return 2 * Math.sqrt(g) * Math.sqrt(c); }
  function autarky(scenario, id) {
    if (!knownScenario(scenario) || !IDS.includes(id)) throw new RangeError('Invalid city/scenario.');
    var cost = SCENARIOS[scenario].costs[IDS.indexOf(id)];
    var production = [50 / cost[0], 50 / cost[1]];
    return { production: production, utility: utility(production[0], production[1]) };
  }
  function initial(scenario) {
    scenario = scenario || 'inexpensive';
    if (!knownScenario(scenario)) throw new RangeError('Unknown scenario.');
    return { scenario: scenario, turn: 0, members: ['alder'], score: 0, cumulative: [0, 0, 0, 0], history: [] };
  }
  function draft() { return { candidates: [], shares: [50, 50, 50, 50], shipments: [] }; }
  function validState(s) {
    return s && knownScenario(s.scenario) && Number.isInteger(s.turn) && s.turn >= 0 && s.turn <= 6 &&
      Array.isArray(s.members) && s.members.every(function (id) { return IDS.includes(id); }) && new Set(s.members).size === s.members.length &&
      typeof s.score === 'number' && Number.isFinite(s.score) && Array.isArray(s.cumulative) && s.cumulative.length === 4 &&
      s.cumulative.every(function (v) { return typeof v === 'number' && Number.isFinite(v); }) && Array.isArray(s.history) && s.history.length === s.turn;
  }
  function numeric(v, max) {
    return (typeof v === 'number' || typeof v === 'string') && String(v).trim() !== '' && Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) <= max;
  }
  function preview(s, d) {
    var errors = {}, fail = function () { return { valid: false, canExecute: false, errors: errors }; };
    if (!validState(s)) { errors.plan = 'Invalid session state. Restart the game.'; return fail(); }
    if (s.turn === 6) { errors.plan = 'Six turns are complete. Restart to play again.'; return fail(); }
    if (!d || !Array.isArray(d.candidates) || new Set(d.candidates).size !== d.candidates.length ||
      d.candidates.some(function (id) { return !IDS.includes(id) || s.members.includes(id); })) {
      errors.plan = 'Choose distinct cities outside the current league.'; return fail();
    }
    var active = IDS.filter(function (id) { return s.members.includes(id) || d.candidates.includes(id); });
    if (!Array.isArray(d.shares) || d.shares.length !== 4) { errors.plan = 'Supply four production shares.'; return fail(); }
    d.shares.forEach(function (v, i) { if (!numeric(v, 100)) errors['share-' + IDS[i]] = 'Enter a finite grain-production share from 0 to 100%.'; });
    if (!Array.isArray(d.shipments) || d.shipments.length > 24) { errors.plan = 'Use no more than 24 shipment rows.'; return fail(); }
    d.shipments.forEach(function (r, i) {
      var key = 'shipment-' + i + '-';
      if (!r || !active.includes(r.from)) errors[key + 'from'] = 'Choose a participating exporter.';
      if (!r || !active.includes(r.to)) errors[key + 'to'] = 'Choose a participating importer.';
      if (r && r.from === r.to) errors[key + 'to'] = 'Choose a different importing city.';
      if (!r || !GOODS.includes(r.good)) errors[key + 'good'] = 'Choose grain or cloth.';
      if (!r || !numeric(r.amount, 200)) errors[key + 'amount'] = 'Enter a finite quantity from 0 to 200 units.';
    });
    if (Object.keys(errors).length) return fail();
    var plan = { candidates: IDS.filter(function (id) { return d.candidates.includes(id); }), shares: d.shares.map(Number),
      shipments: d.shipments.map(function (r) { return { from: r.from, to: r.to, good: r.good, amount: Number(r.amount) }; }) };
    var rows = IDS.map(function (id) {
      var a = autarky(s.scenario, id);
      return { id: id, active: active.includes(id), baseline: a.utility, transport: 0, labor: [50, 50],
        production: a.production.slice(), imports: [0, 0], exports: [0, 0], consumption: a.production.slice(), utility: a.utility, gain: 0, status: 'Outside: autarky' };
    });
    plan.shipments.forEach(function (r) {
      var out = rows[IDS.indexOf(r.from)], inc = rows[IDS.indexOf(r.to)], g = GOODS.indexOf(r.good);
      out.transport += r.amount * route(s.scenario, r.from, r.to).cost;
      out.exports[g] += r.amount; inc.imports[g] += r.amount;
    });
    function shipmentErrors(id, good, message) {
      plan.shipments.forEach(function (r, i) { if (r.from === id && (!good || r.good === good)) errors['shipment-' + i + '-amount'] = message; });
    }
    rows.forEach(function (r, i) {
      if (!r.active) return;
      if (r.transport > 100 + EPS) {
        shipmentErrors(r.id, null, name(r.id) + ' needs more than 100 transport labor. Reduce its shipments.'); return;
      }
      var remaining = Math.max(0, 100 - r.transport), share = plan.shares[i] / 100;
      r.labor = [remaining * share, remaining * (1 - share)];
      r.production = r.labor.map(function (v, g) { return v / SCENARIOS[s.scenario].costs[i][g]; });
      GOODS.forEach(function (good, g) {
        if (r.exports[g] > r.production[g] + EPS) shipmentErrors(r.id, good, name(r.id) + ' exports more ' + good + ' than it produces. Adjust production or shipments.');
        r.consumption[g] = Math.max(0, r.production[g] + r.imports[g] - r.exports[g]);
      });
      r.utility = utility(r.consumption[0], r.consumption[1]); r.gain = r.utility - r.baseline;
      r.status = s.members.includes(r.id) ? (r.gain < -EPS ? 'Member: leaves after this turn' : 'Member: stays') : (r.gain > EPS ? 'Candidate: joins this turn' : 'Candidate: refuses');
    });
    if (Object.keys(errors).length) return fail();
    var candidates = rows.filter(function (r) { return plan.candidates.includes(r.id); });
    var refused = candidates.some(function (r) { return r.gain <= EPS; });
    if (refused) candidates.forEach(function (r) { if (r.gain > EPS) r.status = 'Candidate: eligible; proposal blocked'; });
    return { valid: true, canExecute: candidates.every(function (r) { return r.gain > EPS; }), errors: {}, plan: plan, rows: rows,
      admitted: candidates.filter(function (r) { return r.gain > EPS; }).map(function (r) { return r.id; }),
      rejected: candidates.filter(function (r) { return r.gain <= EPS; }).map(function (r) { return r.id; }),
      departed: rows.filter(function (r) { return s.members.includes(r.id) && r.gain < -EPS; }).map(function (r) { return r.id; }),
      score: rows.reduce(function (sum, r) { return sum + r.gain; }, 0) };
  }
  function execute(s, d) {
    var p = preview(s, d);
    if (!p.valid || !p.canExecute) return { ok: false, state: s, draft: d, result: p };
    var next = clone(s);
    next.turn += 1; next.score += p.score;
    next.cumulative = next.cumulative.map(function (v, i) { return v + p.rows[i].gain; });
    next.members = IDS.filter(function (id) { return (s.members.includes(id) || p.admitted.includes(id)) && !p.departed.includes(id); });
    next.history.push({ turn: next.turn, score: p.score, total: next.score, membersBefore: s.members.slice(), membersAfter: next.members.slice(),
      admitted: p.admitted.slice(), departed: p.departed.slice(), plan: clone(p.plan), rows: clone(p.rows) });
    var nd = p.departed.length ? draft() : clone(p.plan); nd.candidates = [];
    return { ok: true, state: next, draft: nd, result: p };
  }
  function shipment(from, to, good, amount) { return { from: from, to: to, good: good, amount: amount }; }
  function fixture(id) {
    var s = initial(id === 'transport' ? 'expensive' : id === 'equal' ? 'equal' : 'inexpensive'), d = draft();
    if (id === 'autarky') return { state: s, draft: d };
    if (!['trade', 'transport', 'equal'].includes(id)) throw new RangeError('Unknown exercise.');
    d.candidates = ['birch'];
    if (id !== 'transport') { d.shares[0] = 100; d.shares[1] = 0; }
    var g = id === 'trade' ? 50 : id === 'equal' ? 20 : 10, c = id === 'trade' ? 50 : 10;
    d.shipments = [shipment('alder', 'birch', 'grain', g), shipment('birch', 'alder', 'cloth', c)];
    return { state: s, draft: d };
  }
  var PROMPTS = {
    autarky: { title: '1. Find the autarky baseline', question: 'Why does Alder produce 50 grain but only 25 cloth with equal labor shares?', answer: 'cost',
      options: [['cost', 'Cloth needs more labor per unit'], ['equal', 'Equal labor means equal output'], ['trade', 'Alder already imports cloth']],
      explanation: 'Without trade, 50 labor in each good maximizes this balanced utility function. Different production costs give different quantities.' },
    trade: { title: '2. Discover mutual gains', question: 'Why can Alder and Birch both gain in this example?', answer: 'opportunity',
      options: [['opportunity', 'Different opportunity costs'], ['absolute', 'Only absolute advantage matters'], ['free', 'Transport uses no labor']],
      explanation: 'Alder gives up 0.5 cloth per grain; Birch gives up 2 cloth per grain. Each specializes, pays 5 transport labor, and reaches 94.868330 utility instead of 70.710678.' },
    transport: { title: '3. Count transportation costs', question: 'Why does Birch refuse this proposed league?', answer: 'loss',
      options: [['loss', 'Utility falls below autarky'], ['random', 'Membership is random'], ['quantity', 'Any imports guarantee a gain']],
      explanation: 'Each exporter uses 15 labor to ship 10 units. Balanced production and these shipments yield 63.737744 utility, below 70.710678. The entire proposal must be revised before execution.' },
    equal: { title: '4. Compare opportunity costs', question: 'Does specialization guarantee mutual gains when opportunity costs are equal?', answer: 'no',
      options: [['no', 'No; relative production costs are the same'], ['always', 'Yes; specialization always helps'], ['ignore', 'Transport costs do not matter']],
      explanation: 'All cities give up 0.5 cloth per grain in this scenario, despite different absolute productivity. This specialization plan lowers both utilities; Birch refuses.' }
  };
  function checkPrompt(id, s, d, hasPreview, answer) {
    if (!Object.prototype.hasOwnProperty.call(PROMPTS, id)) return { ok: false, message: 'Choose an exercise first.' };
    var f = fixture(id), p = preview(s, d), expected = preview(f.state, f.draft);
    if (!hasPreview || !p.valid || s.turn !== 0 || s.scenario !== f.state.scenario || JSON.stringify(s.members) !== JSON.stringify(f.state.members) ||
      JSON.stringify(p.plan) !== JSON.stringify(expected.plan)) return { ok: false, message: 'Load this exercise and preview its unchanged plan before checking your answer.' };
    if (answer !== PROMPTS[id].answer) return { ok: false, message: 'Reconsider the preview and try another answer.' };
    return { ok: true, message: PROMPTS[id].explanation };
  }
  function deepFreeze(obj) { Object.keys(obj).forEach(function (k) { if (obj[k] && typeof obj[k] === 'object') deepFreeze(obj[k]); }); return Object.freeze(obj); }
  return { EPS: EPS, ids: deepFreeze(IDS), names: deepFreeze(NAMES), goods: deepFreeze(GOODS), scenarios: deepFreeze(SCENARIOS), prompts: deepFreeze(PROMPTS),
    name: name, route: route, autarky: autarky, utility: utility, initial: initial, draft: draft, preview: preview, execute: execute, fixture: fixture, checkPrompt: checkPrompt };
});
