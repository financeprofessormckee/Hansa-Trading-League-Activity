/* Economic concepts: David Friedman. Development: Eric McKee. */
(function (root) {
  'use strict';
  var M = root.HansaModel;
  function esc(v) { return String(v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(v) { if (v !== 0 && Math.abs(v) < 0.000001) return v.toExponential(6); return v.toLocaleString('en-US', { maximumFractionDigits: 6 }); }
  function signed(v) { return (v > 0 ? '+' : '') + fmt(v); }
  function list(ids) { return ids.length ? ids.map(M.name).join(', ') : 'None'; }
  function decision(r, executed, blocked) {
    if (blocked && r.active) return r.status === 'Member: leaves after this turn' ? 'Member: would leave; proposal blocked' : r.status + ' (not executed)';
    if (!executed) return r.status;
    if (r.status === 'Candidate: joins this turn') return 'Joined this turn';
    if (r.status === 'Member: leaves after this turn') return 'Left after this turn';
    if (r.status === 'Member: stays') return 'Stayed in league';
    return r.status;
  }
  function gain(v) { return '<span class="' + (v < -M.EPS ? 'loss' : v > M.EPS ? 'success' : '') + '">' + signed(v) + '</span>'; }
  function table(id, caption, headings, body, cls) {
    return '<div class="table-scroll" id="' + id + '-scroll" tabindex="0" role="region" aria-label="' + esc(caption) + ', scroll horizontally if needed"><table id="' + id + '" class="' + (cls || '') + '"><caption>' + esc(caption) + '</caption><thead><tr>' + headings.map(function (h) { return '<th scope="col">' + h + '</th>'; }).join('') + '</tr></thead><tbody>' + body + '</tbody></table></div>';
  }
  function td(v) { return '<td class="num">' + fmt(v) + '</td>'; }
  function error(id) { return '<span id="' + id + '-error" class="error" hidden></span>'; }
  function select(id, values, value, description) {
    return '<select id="' + id + '" aria-describedby="' + description + ' ' + id + '-error">' + values.map(function (v) {
      return '<option value="' + esc(v[0]) + '"' + (v[0] === value ? ' selected' : '') + '>' + esc(v[1]) + '</option>';
    }).join('') + '</select>' + error(id);
  }
  function summary(s) {
    document.getElementById('turn-label').textContent = s.turn === 6 ? 'Six turns complete' : 'Turn ' + (s.turn + 1) + ' of 6';
    document.getElementById('score-label').textContent = signed(s.score) + ' utility units';
    document.getElementById('members-label').textContent = list(s.members) + ' · ' + s.members.length + ' of 4 cities';
    document.getElementById('scenario').value = s.scenario;
    document.getElementById('turn-progress').innerHTML = Array.from({ length: 6 }, function (_, i) { return '<li class="' + (i < s.turn ? 'complete' : i === s.turn ? 'current' : '') + '"' + (i === s.turn ? ' aria-current="step"' : '') + '><span aria-hidden="true">' + (i + 1) + '</span><span class="sr-only">Turn ' + (i + 1) + (i < s.turn ? ' completed' : i === s.turn ? ' current' : ' upcoming') + '</span></li>'; }).join('');
  }
  function world(s, d) {
    var positions = [[90, 90], [300, 90], [510, 90], [300, 265]], edges = [[0, 1], [1, 2], [0, 2], [0, 3], [1, 3], [2, 3]];
    var svg = '<svg viewBox="0 0 600 350" role="img" aria-labelledby="map-title map-description"><title id="map-title">The four-city trading network</title><desc id="map-description">Water connects Alder to Birch and Birch to Cedar. All other pairs connect by land. Direct route costs are listed in the route table; membership is listed in the production cards.</desc>';
    edges.forEach(function (pair) {
      var a = positions[pair[0]], b = positions[pair[1]], r = M.route(s.scenario, M.ids[pair[0]], M.ids[pair[1]]);
      var path = pair[0] === 0 && pair[1] === 2 ? 'M90 90 Q300 -65 510 90' : 'M' + a.join(' ') + ' L' + b.join(' ');
      var planned = d.shipments.some(function (shipment) { return Number(shipment.amount) > 0 && [M.ids[pair[0]], M.ids[pair[1]]].includes(shipment.from) && [M.ids[pair[0]], M.ids[pair[1]]].includes(shipment.to) && shipment.from !== shipment.to; });
      svg += '<path d="' + path + '" fill="none" stroke="' + (r.kind === 'Water' ? '#1a5a9e' : '#595959') + '" stroke-width="' + (planned ? 7 : 2) + '" stroke-dasharray="' + (r.kind === 'Water' ? '12 5' : '3 5') + '"/>';
    });
    M.ids.forEach(function (id, i) {
      var p = positions[i], member = s.members.includes(id), candidate = d.candidates.includes(id);
      svg += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="26" fill="' + (member ? '#5c0025' : '#fff') + '" stroke="' + (candidate ? '#1a5a9e' : '#5c0025') + '" stroke-width="3"/><text x="' + p[0] + '" y="' + (p[1] + 7) + '" text-anchor="middle" font-size="20" font-weight="700" fill="' + (member ? '#fff' : '#5c0025') + '">' + (i + 1) + '</text><rect x="' + (p[0] - 60) + '" y="' + (p[1] + 30) + '" width="120" height="45" fill="#fff"/><text x="' + p[0] + '" y="' + (p[1] + 48) + '" text-anchor="middle" font-size="20" fill="#2a2a2a">' + M.name(id) + '</text><text x="' + p[0] + '" y="' + (p[1] + 68) + '" text-anchor="middle" font-size="15" fill="#595959">' + (member ? 'Member' : candidate ? 'Invited' : 'Outside') + '</text>';
    });
    svg += '</svg>';
    document.getElementById('map-panel').innerHTML = svg + '<p><strong>Dashed blue:</strong> water. <strong>Dotted gray:</strong> land. Every route works in both directions. Heavy lines mark planned cargo, not executed trade.</p><p>This schematic is illustrative; shipments use the direct connection, never a path through another city.</p>';
    var costRows = M.ids.map(function (id, i) { var c = M.scenarios[s.scenario].costs[i]; return '<tr><th scope="row">' + M.name(id) + '</th>' + td(c[0]) + td(c[1]) + td(c[0] / c[1]) + td(M.autarky(s.scenario, id).utility) + '</tr>'; }).join('');
    document.getElementById('costs-panel').innerHTML = table('costs-table', 'Production costs and autarky', ['City', 'Labor / grain', 'Labor / cloth', 'Cloth forgone / grain', 'Autarky utility'], costRows) + '<p class="muted">Opportunity cost: making one more grain gives up this much cloth, before transport. Compare relative costs, not just productivity.</p>';
    var routeRows = edges.map(function (pair) { var a = M.ids[pair[0]], b = M.ids[pair[1]], r = M.route(s.scenario, a, b); return '<tr><th scope="row">' + M.name(a) + ' ↔ ' + M.name(b) + '</th><td>' + r.kind + '</td>' + td(r.cost) + '</tr>'; }).join('');
    document.getElementById('routes-panel').innerHTML = table('routes-table', 'Transport paid by the exporter', ['Direct route', 'Type', 'Labor / unit'], routeRows);
  }
  function planner(s, d) {
    document.getElementById('production-controls').innerHTML = M.ids.map(function (id, i) {
      var member = s.members.includes(id), candidate = d.candidates.includes(id), active = member || candidate;
      var disabled = !active || s.turn === 6 ? ' disabled' : '', c = M.scenarios[s.scenario].costs[i];
      return '<article class="city-card ' + (member ? 'member' : candidate ? 'candidate' : '') + '"><div class="city-title"><span class="city-number" aria-hidden="true">' + (i + 1) + '</span><h3>' + M.name(id) + '</h3></div>' +
        (member ? '<p class="membership-badge">League member</p>' : '<label class="invite-label" for="candidate-' + id + '"><input id="candidate-' + id + '" type="checkbox"' + (candidate ? ' checked' : '') + (s.turn === 6 ? ' disabled' : '') + ' aria-describedby="production-help candidate-' + id + '-error">Invite ' + M.name(id) + '</label>' + error('candidate-' + id)) +
        '<dl class="city-costs"><div><dt>Labor / grain</dt><dd>' + fmt(c[0]) + '</dd></div><div><dt>Labor / cloth</dt><dd>' + fmt(c[1]) + '</dd></div></dl>' +
        '<p class="opportunity">1 grain costs <strong>' + fmt(c[0] / c[1]) + ' cloth</strong> forgone.</p>' +
        '<label for="share-' + id + '"><span class="sr-only">' + M.name(id) + ' </span>Grain labor share (%)</label><input id="share-' + id + '" type="number" min="0" max="100" step="any" value="' + esc(d.shares[i]) + '" aria-describedby="production-help share-' + id + '-error"' + disabled + '>' + error('share-' + id) +
        '<div class="share-presets" role="group" aria-label="Production presets for ' + M.name(id) + '">' + [[0, 'Cloth'], [50, 'Half'], [100, 'Grain']].map(function (preset) {
          return '<button type="button" data-city="' + id + '" data-share="' + preset[0] + '" aria-label="Set ' + M.name(id) + ' grain labor share to ' + preset[0] + ' percent"' + disabled + '>' + preset[1] + '</button>';
        }).join('') + '</div><div class="city-budget" id="budget-' + id + '"></div></article>';
    }).join('');
    var active = M.ids.filter(function (id) { return s.members.includes(id) || d.candidates.includes(id); });
    if (!d.shipments.length) document.getElementById('shipments-controls').innerHTML = '<p class="notice">No cargo scheduled. ' + (active.length >= 2 ? 'Add shipments to exchange grain and cloth.' : 'Invite at least one other city to arrange an exchange.') + '</p>';
    else {
      var cityOptions = active.map(function (id) { return [id, M.name(id)]; });
      document.getElementById('shipments-controls').innerHTML = '<div class="manifest">' + d.shipments.map(function (r, i) {
        var k = 'shipment-' + i + '-';
        return '<fieldset class="shipment-card"' + (s.turn === 6 ? ' disabled' : '') + '><legend>Shipment ' + (i + 1) + '</legend><div class="shipment-fields">' +
          '<div><label for="' + k + 'from">Exporter<span class="sr-only"> for shipment ' + (i + 1) + '</span></label>' + select(k + 'from', cityOptions, r.from, 'shipment-help') + '</div>' +
          '<div><label for="' + k + 'to">Importer<span class="sr-only"> for shipment ' + (i + 1) + '</span></label>' + select(k + 'to', cityOptions, r.to, 'shipment-help') + '</div>' +
          '<div><label for="' + k + 'good">Good<span class="sr-only"> for shipment ' + (i + 1) + '</span></label>' + select(k + 'good', [['grain', 'Grain'], ['cloth', 'Cloth']], r.good, 'shipment-help') + '</div>' +
          '<div><label for="' + k + 'amount">Quantity<span class="sr-only"> for shipment ' + (i + 1) + '</span></label><input id="' + k + 'amount" type="number" min="0" max="200" step="any" value="' + esc(r.amount) + '" aria-describedby="shipment-help ' + k + 'amount-error">' + error(k + 'amount') + '</div></div>' +
          '<div class="shipment-footer"><p id="route-note-' + i + '" class="muted"></p><button id="remove-shipment-' + i + '" type="button" aria-label="Remove shipment ' + (i + 1) + '">Remove</button></div></fieldset>';
      }).join('') + '</div>';
    }
    document.getElementById('add-shipment').disabled = active.length < 2 || d.shipments.length >= 24 || s.turn === 6;
    document.getElementById('preview').disabled = s.turn === 6;
    document.getElementById('compare-economies').disabled = s.turn === 6;
    budgets(s, d);
  }
  function budgets(s, d) {
    world(s, d);
    // A draft calculation is a planning aid, never approval to execute a turn.
    var p = M.preview(s, d), summary = document.getElementById('draft-health');
    summary.textContent = s.turn === 6 ? 'The six-turn ledger is complete. Download your record or start a new experiment.' : !p.valid ?
      'This draft needs attention. Preview to locate the errors: ' + Array.from(new Set(Object.values(p.errors))).join(' ') :
      p.rejected.length ? 'Production is feasible. ' + list(p.rejected) + ' would refuse. Preview to inspect each city’s consumption.' :
      p.departed.length ? 'Production is feasible, but ' + list(p.departed) + ' would leave after a loss. Preview before executing.' :
      'Production is feasible. Preview to review gains and membership before executing.';
    summary.className = !p.valid && s.turn !== 6 ? 'draft-health invalid-draft' : 'draft-health';
    M.ids.forEach(function (id, i) {
      var target = document.getElementById('budget-' + id), active = s.members.includes(id) || d.candidates.includes(id);
      if (!target) return;
      if (!active) { target.innerHTML = '<p>Outside the league</p><p>Autarky utility: <strong>' + fmt(M.autarky(s.scenario, id).utility) + '</strong></p>'; return; }
      if (!p.valid) { target.innerHTML = '<p>' + (s.turn === 6 ? 'Session complete. See the ledger below.' : 'Budget unavailable until the draft is physically valid.') + '</p>'; return; }
      var r = p.rows[i];
      target.innerHTML = '<div class="labor-bar" aria-hidden="true"><span class="bar-transport" style="width:' + Math.min(100, r.transport) + '%"></span><span class="bar-grain" style="width:' + Math.max(0, r.labor[0]) + '%"></span><span class="bar-cloth" style="width:' + Math.max(0, r.labor[1]) + '%"></span></div>' +
        '<dl class="budget-numbers"><div><dt>Transport labor</dt><dd>' + fmt(r.transport) + '</dd></div><div><dt>Grain labor</dt><dd>' + fmt(r.labor[0]) + '</dd></div><div><dt>Cloth labor</dt><dd>' + fmt(r.labor[1]) + '</dd></div></dl>' +
        '<p>Produces <strong>' + fmt(r.production[0]) + ' grain</strong> and <strong>' + fmt(r.production[1]) + ' cloth</strong>.</p>';
    });
    d.shipments.forEach(function (r, i) {
      var target = document.getElementById('route-note-' + i); if (!target) return;
      if (!M.ids.includes(r.from) || !M.ids.includes(r.to) || r.from === r.to) { target.textContent = 'Choose two different participating cities.'; return; }
      var route = M.route(s.scenario, r.from, r.to), amount = Number(r.amount);
      var validAmount = String(r.amount).trim() !== '' && Number.isFinite(amount) && amount >= 0 && amount <= 200;
      target.textContent = route.kind + ' · ' + fmt(route.cost) + ' labor / unit' + (validAmount ? ' · ' + M.name(r.from) + ' pays ' + fmt(amount * route.cost) + ' labor' : ' · Enter a quantity from 0 to 200.');
    });
  }
  function council(p, executed) {
    var target = document.getElementById('council-panel');
    if (!p) { target.innerHTML = ''; return; }
    target.innerHTML = '<div class="verdict-grid">' + p.rows.map(function (r) {
      return '<article class="verdict-card"><h3>' + M.name(r.id) + '</h3><p class="verdict-gain">' + gain(r.gain) + '</p><p class="muted">utility above autarky</p><dl class="budget-numbers"><div><dt>Consumption utility</dt><dd>' + fmt(r.utility) + '</dd></div><div><dt>Autarky baseline</dt><dd>' + fmt(r.baseline) + '</dd></div></dl><p class="verdict-decision">' + esc(decision(r, executed, p.rejected.length > 0)) + '</p></article>';
    }).join('') + '</div>';
  }
  function comparisons(items) {
    var target = document.getElementById('comparison-panel');
    if (!items) { target.innerHTML = '<p class="muted">Compare a draft to see how transport and relative production costs affect the same proposal. This does not spend a turn or change your economy.</p>'; return; }
    target.innerHTML = '<div class="comparison-grid">' + items.map(function (item) {
      var p = item.result, title = M.scenarios[item.scenario].name;
      var html = '<article class="comparison-card"><h3>' + title + '</h3>';
      if (!p.valid) return html + '<p class="comparison-state loss">Physically infeasible</p><ul>' + Array.from(new Set(Object.values(p.errors))).map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul><p>No gain is assigned to an impossible plan.</p></article>';
      html += '<p class="comparison-state">' + (p.rejected.length ? 'Invitation refused' : p.departed.length ? 'Executable, with departures' : 'Executable') + '</p><p class="comparison-score">' + gain(p.score) + '</p><p class="muted">' + (p.rejected.length ? 'Hypothetical gain; execution blocked' : 'Proposed turn gain') + '</p><dl class="budget-numbers">';
      p.rows.forEach(function (r) { html += '<div><dt>' + M.name(r.id) + '</dt><dd>' + gain(r.gain) + '</dd></div>'; });
      return html + '</dl><p>Refuses: ' + list(p.rejected) + '.</p><p>' + (p.rejected.length ? 'Would leave if executed: ' : 'Leaves after execution: ') + list(p.departed) + '.</p></article>';
    }).join('') + '</div><p class="comparison-note">These are gains relative to each economy’s own autarky baseline. The equal-cost economy changes productivity as well as relative costs; it is not a pure transport experiment. An infeasible plan is not evidence that all trade is impossible.</p>';
  }
  function results(p, executed) {
    document.getElementById('results-section').hidden = !p;
    council(p, executed);
    if (!p) return;
    document.getElementById('results-heading').textContent = executed ? 'Last completed turn' : 'Turn preview';
    var words = (executed ? 'Turn gain: ' : 'Proposed turn gain: ') + signed(p.score) + ' utility units. ';
    if (p.rejected.length) words += 'Refused invitations: ' + list(p.rejected) + '. Nobody joins and no shipments execute until every invitation is acceptable. ';
    else words += (executed ? 'Joined: ' : 'Would join: ') + list(p.admitted) + '. ';
    if (p.departed.length && p.rejected.length) words += 'If this plan could execute, ' + list(p.departed) + ' would leave after taking a loss. No membership changes have occurred.';
    else if (p.departed.length) words += executed ? list(p.departed) + ' left after this turn; their losses count toward your score.' : 'Loss warning: ' + list(p.departed) + ' will leave after this turn. These losses count toward your score.';
    else words += 'No departures.';
    document.getElementById('preview-summary').textContent = words;
    var outcomeRows = p.rows.map(function (r) { return '<tr><th scope="row">' + M.name(r.id) + '</th>' + td(r.consumption[0]) + td(r.consumption[1]) + td(r.utility) + td(r.baseline) + '<td class="num">' + gain(r.gain) + '</td><td>' + decision(r, executed, p.rejected.length > 0) + '</td></tr>'; }).join('');
    var laborRows = p.rows.map(function (r) { return '<tr><th scope="row">' + M.name(r.id) + '</th>' + td(r.transport) + td(r.labor[0]) + td(r.labor[1]) + td(r.production[0]) + td(r.production[1]) + '</tr>'; }).join('');
    var flowRows = p.rows.map(function (r) { return '<tr><th scope="row">' + M.name(r.id) + '</th>' + td(r.imports[0]) + td(r.exports[0]) + td(r.imports[1]) + td(r.exports[1]) + '</tr>'; }).join('');
    document.getElementById('results-panel').innerHTML = table('outcomes-table', 'Consumption, utility and membership', ['City', 'Grain consumed', 'Cloth consumed', 'Utility', 'Autarky', 'Gain / loss', 'Decision'], outcomeRows, 'results-table') +
      table('labor-table', 'Labor use and production', ['City', 'Transport labor', 'Grain labor', 'Cloth labor', 'Grain output', 'Cloth output'], laborRows, 'results-table') +
      table('flows-table', 'Imports and exports', ['City', 'Grain imported', 'Grain exported', 'Cloth imported', 'Cloth exported'], flowRows);
    if (p.rows.some(function (r) { return r.gain !== 0 && Math.abs(r.gain) < 0.000001; })) {
      var note = document.createElement('p'); note.textContent = 'Tiny differences are shown in scientific notation. Membership uses an absolute tolerance of 0.000000001 utility units, so a tiny signed difference may be classified as equal.';
      document.getElementById('results-panel').appendChild(note);
    }
  }
  function history(s) {
    document.getElementById('history-section').hidden = !s.history.length;
    document.getElementById('download-record').disabled = !s.history.length;
    document.getElementById('final-summary').textContent = s.turn === 6 ? 'Session complete. Total gains: ' + signed(s.score) + ' utility units. Final league: ' + list(s.members) + '. Restart or load an exercise to explore another plan.' : 'Every completed turn is recorded below. Keeping a plan keeps instructions, not inventories.';
    var turnRows = s.history.map(function (h) { return '<tr><th scope="row">' + h.turn + '</th><td class="num">' + gain(h.score) + '</td><td class="num">' + gain(h.total) + '</td><td>' + list(h.admitted) + '</td><td>' + list(h.departed) + '</td><td>' + list(h.membersAfter) + '</td></tr>'; }).join('');
    var cityRows = M.ids.map(function (id, i) { var last = s.history.length ? s.history[s.history.length - 1].rows[i] : null;
      return '<tr><th scope="row">' + M.name(id) + '</th><td class="num">' + gain(s.cumulative[i]) + '</td>' + (last ? td(last.consumption[0]) + td(last.consumption[1]) + td(last.utility) : '<td>—</td><td>—</td><td>—</td>') + '<td>' + (s.members.includes(id) ? 'Member' : 'Outside') + '</td></tr>'; }).join('');
    var detailRows = s.history.map(function (h) { return h.rows.map(function (r) {
      return '<tr><th scope="row">' + h.turn + ' · ' + M.name(r.id) + '</th>' + td(r.consumption[0]) + td(r.consumption[1]) + td(r.utility) + '<td class="num">' + gain(r.gain) + '</td><td>' + decision(r, true, false) + '</td></tr>';
    }).join(''); }).join('');
    document.getElementById('history-panel').innerHTML = table('history-table', 'Turn scores and membership changes', ['Turn', 'Gain / loss', 'Cumulative', 'Joined', 'Left', 'League after turn'], turnRows) +
      table('city-history-table', 'Cumulative city gains and latest consumption', ['City', 'Cumulative gain', 'Latest grain', 'Latest cloth', 'Latest utility', 'Membership'], cityRows, 'results-table') +
      '<details><summary>Consumption and utility for every completed turn</summary>' + table('history-detail-table', 'All completed city outcomes', ['Turn · city', 'Grain', 'Cloth', 'Utility', 'Gain / loss', 'Decision'], detailRows, 'results-table') + '</details>';
  }
  function prompts() {
    document.getElementById('prompt-controls').innerHTML = Object.keys(M.prompts).map(function (id) { var p = M.prompts[id];
      return '<div class="prompt"><h3>' + p.title + '</h3><p>' + p.question + '</p><div class="prompt-actions"><button id="load-' + id + '" type="button">Load exercise ' + (Object.keys(M.prompts).indexOf(id) + 1) + '</button><div class="prompt-choice"><label for="answer-' + id + '">Your answer<span class="sr-only"> for exercise ' + (Object.keys(M.prompts).indexOf(id) + 1) + '</span></label><select id="answer-' + id + '"><option value="">Choose an answer</option>' + p.options.map(function (o) { return '<option value="' + o[0] + '">' + esc(o[1]) + '</option>'; }).join('') + '</select></div><button id="check-' + id + '" type="button" aria-label="Check answer for exercise ' + (Object.keys(M.prompts).indexOf(id) + 1) + '">Check answer</button></div><p id="feedback-' + id + '"></p></div>';
    }).join('');
  }
  root.HansaView = { fmt: fmt, list: list, summary: summary, world: world, planner: planner, results: results, history: history, prompts: prompts, budgets: budgets, comparisons: comparisons };
})(typeof self !== 'undefined' ? self : this);
