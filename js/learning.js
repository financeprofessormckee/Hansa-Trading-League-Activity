/* Learning tools for Hansa. The economic rules remain in HansaModel. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./model.js'));
  else root.HansaLearning = factory(root.HansaModel);
})(typeof self !== 'undefined' ? self : this, function (M) {
  'use strict';
  function compare(state, draft) {
    // Only the scenario changes. Membership, turn, production shares and shipments
    // are held fixed; model.preview does not mutate either input or award points.
    return Object.keys(M.scenarios).map(function (id) {
      var counterfactual = Object.assign({}, state, { scenario: id });
      return { scenario: id, result: M.preview(counterfactual, draft) };
    });
  }
  function csv(state) {
    var headers = ['scenario', 'turn', 'city', 'grain_share_percent', 'transport_labor', 'grain_labor', 'cloth_labor',
      'grain_produced', 'cloth_produced', 'grain_imported', 'cloth_imported', 'grain_exported', 'cloth_exported',
      'grain_consumed', 'cloth_consumed', 'utility', 'autarky_utility', 'gain', 'cumulative_city_gain',
      'member_before', 'joined', 'left', 'member_after', 'turn_gain', 'cumulative_score'];
    var lines = [headers], cumulative = [0, 0, 0, 0];
    state.history.forEach(function (turn) {
      turn.rows.forEach(function (r, i) {
        cumulative[i] += r.gain;
        lines.push([state.scenario, turn.turn, M.name(r.id), r.active ? turn.plan.shares[i] : 50, r.transport,
          r.labor[0], r.labor[1], r.production[0], r.production[1], r.imports[0], r.imports[1], r.exports[0], r.exports[1],
          r.consumption[0], r.consumption[1], r.utility, r.baseline, r.gain, cumulative[i],
          turn.membersBefore.includes(r.id), turn.admitted.includes(r.id), turn.departed.includes(r.id),
          turn.membersAfter.includes(r.id), turn.score, turn.total]);
      });
    });
    return lines.map(function (row) { return row.map(function (value) {
      return '"' + String(value).replace(/"/g, '""') + '"';
    }).join(','); }).join('\r\n') + '\r\n';
  }
  return { compare: compare, csv: csv };
});
