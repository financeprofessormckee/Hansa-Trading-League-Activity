/* Economic concepts: David Friedman. Development: Eric McKee. */
(function () {
  'use strict';
  var M = window.HansaModel, V = window.HansaView, state = M.initial(), draft = M.draft(), preview = null;
  function el(id) { return document.getElementById(id); }
  function status(message) { el('status').textContent = message; }
  function clearChecks() { Object.keys(M.prompts).forEach(function (id) { el('feedback-' + id).textContent = ''; el('feedback-' + id).className = ''; el('feedback-' + id).hidden = false; }); }
  function clearErrors() {
    document.querySelectorAll('[aria-invalid]').forEach(function (e) { e.removeAttribute('aria-invalid'); });
    document.querySelectorAll('#plan-section .error').forEach(function (e) { e.textContent = ''; e.hidden = true; });
  }
  function showErrors(errors, focus) {
    var first = null;
    Object.keys(errors).forEach(function (key) {
      var control = el(key), message = el(key + '-error');
      if (control && message) { control.setAttribute('aria-invalid', 'true'); message.textContent = errors[key]; message.hidden = false; if (!first) first = control; }
      else { el('plan-error').textContent = errors[key]; el('plan-error').hidden = false; if (!first) first = el('plan-error'); }
    });
    if (focus && first) first.focus();
  }
  function invalidate() {
    preview = null; el('execute').disabled = true; el('preview-hint').textContent = state.turn === 6 ? 'Session complete.' : 'Preview your current plan before executing.';
    V.results(null); V.comparisons(null); clearErrors(); clearChecks(); status('');
  }
  function render(focus) {
    V.summary(state); V.world(state, draft); V.planner(state, draft); V.history(state);
    if (focus && el(focus) && !el(focus).disabled) el(focus).focus();
  }
  function load(fixture, message, focus) {
    state = fixture.state; draft = fixture.draft; invalidate(); render(focus);
    Object.keys(M.prompts).forEach(function (id) { el('answer-' + id).value = ''; }); status(message);
  }
  function doPreview() {
    clearErrors(); clearChecks();
    var p = M.preview(state, draft);
    if (!p.valid) { el('preview-hint').textContent = 'Correct the marked controls, then preview again.'; preview = null; el('execute').disabled = true; V.results(null); showErrors(p.errors, true); status('Preview unavailable. Correct the marked controls; the session has not changed.'); return; }
    preview = p; V.results(p); el('execute').disabled = !p.canExecute;
    el('preview-hint').textContent = p.canExecute ? 'Preview ready. Executing consumes this turn’s output.' : 'Revise refused invitations before executing.';
    if (p.rejected.length) {
      var errors = {}; p.rejected.forEach(function (id) { errors['candidate-' + id] = 'This proposed consumption does not beat autarky. Revise the plan or remove this invitation.'; }); showErrors(errors, false);
    }
    status(p.rejected.length ? 'Preview calculated. ' + V.list(p.rejected) + ' refuses; execution is blocked.' : p.departed.length ? 'Preview calculated. Loss warning: ' + V.list(p.departed) + ' will leave after execution.' : 'Preview calculated. Proposed gain: ' + V.fmt(p.score) + ' utility units. Review the city outcomes below.');
  }
  el('scenario').addEventListener('change', function () { load({ state: M.initial(this.value), draft: M.draft() }, 'New economy loaded. Session restarted.'); });
  el('restart').addEventListener('click', function () { load({ state: M.initial(state.scenario), draft: M.draft() }, 'Session restarted. Alder is the first member.'); });
  el('example').addEventListener('click', function () { load(M.fixture('trade'), 'Worked example loaded in a new session. Preview to compare both cities with autarky.', 'plan-heading'); });
  el('production-controls').addEventListener('input', function (event) {
    var id = event.target.id;
    if (id.indexOf('share-') === 0) { draft.shares[M.ids.indexOf(id.slice(6))] = event.target.value; invalidate(); V.budgets(state, draft); }
  });
  el('production-controls').addEventListener('click', function (event) {
    var button = event.target.closest('button[data-share]');
    if (!button || button.disabled || state.turn === 6) return;
    var id = button.dataset.city, value = Number(button.dataset.share);
    draft.shares[M.ids.indexOf(id)] = value; el('share-' + id).value = value; invalidate(); V.budgets(state, draft);
    status(M.name(id) + ' grain share set to ' + value + ' percent. Preview the revised plan.');
  });
  el('production-controls').addEventListener('change', function (event) {
    var id = event.target.id;
    if (id.indexOf('candidate-') !== 0) return;
    var city = id.slice(10);
    if (event.target.checked) draft.candidates.push(city);
    else { draft.candidates = draft.candidates.filter(function (c) { return c !== city; }); draft.shares[M.ids.indexOf(city)] = 50; draft.shipments = draft.shipments.filter(function (r) { return r.from !== city && r.to !== city; }); }
    invalidate(); render(id); status(M.name(city) + (draft.candidates.includes(city) ? ' is proposed for invitation, not yet a member.' : ' invitation removed, including its connected shipments.'));
  });
  function shipmentEdit(event) {
    var match = /^shipment-(\d+)-(from|to|good|amount)$/.exec(event.target.id);
    if (!match || !draft.shipments[Number(match[1])]) return;
    draft.shipments[Number(match[1])][match[2]] = event.target.value; invalidate(); V.budgets(state, draft);
  }
  el('shipments-controls').addEventListener('input', shipmentEdit);
  el('shipments-controls').addEventListener('change', shipmentEdit);
  el('shipments-controls').addEventListener('click', function (event) {
    var match = /^remove-shipment-(\d+)$/.exec(event.target.id);
    if (!match || state.turn === 6) return;
    var index = Number(match[1]); draft.shipments.splice(index, 1); invalidate();
    V.planner(state, draft); var focus = draft.shipments.length ? 'shipment-' + Math.min(index, draft.shipments.length - 1) + '-from' : 'add-shipment'; el(focus).focus(); status('Shipment removed. Preview the revised plan.');
  });
  el('add-shipment').addEventListener('click', function () {
    var active = M.ids.filter(function (id) { return state.members.includes(id) || draft.candidates.includes(id); });
    if (active.length < 2 || draft.shipments.length >= 24 || state.turn === 6) return;
    draft.shipments.push({ from: active[0], to: active[1], good: 'grain', amount: 0 }); invalidate(); V.planner(state, draft);
    el('shipment-' + (draft.shipments.length - 1) + '-from').focus(); status('Shipment row added. Choose cities, a good, and a quantity.');
  });
  el('preview').addEventListener('click', doPreview);
  el('execute').addEventListener('click', function () {
    if (!preview || !preview.canExecute || state.turn === 6) return;
    var result = M.execute(state, draft);
    if (!result.ok) { invalidate(); doPreview(); return; }
    state = result.state; draft = result.draft; invalidate(); render(); V.results(result.result, true);
    status('Turn ' + state.turn + ' completed. Gain: ' + V.fmt(result.result.score) + ' utility units. ' + (result.result.departed.length ? V.list(result.result.departed) + ' left; production reset to autarky and shipments cleared. ' : state.turn < 6 ? 'The plan is retained for the next turn. ' : '') + (state.turn === 6 ? 'Session complete.' : 'Fresh labor is available; no goods were stored.'));
    el(state.turn === 6 ? 'restart' : 'preview').focus();
  });
  el('compare-economies').addEventListener('click', function () {
    if (state.turn === 6) return;
    V.comparisons(window.HansaLearning.compare(state, draft));
    el('comparison-heading').focus(); status('Same-plan comparison ready. The current economy, plan, score, and turn have not changed.');
  });
  el('download-record').addEventListener('click', function () {
    if (!state.history.length) return;
    var url = URL.createObjectURL(new Blob([window.HansaLearning.csv(state)], { type: 'text/csv;charset=utf-8' }));
    var link = document.createElement('a'); link.href = url; link.download = 'hansa-' + state.scenario + '-turn-' + state.turn + '.csv';
    document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    status('League record downloaded as CSV. Values use full calculation precision.');
  });
  V.comparisons(null);
  V.prompts();
  Object.keys(M.prompts).forEach(function (id) {
    el('load-' + id).addEventListener('click', function () { load(M.fixture(id), 'Exercise loaded in a new session. Preview its plan before checking your answer.', 'plan-heading'); });
    el('answer-' + id).addEventListener('change', function () { clearChecks(); });
    el('check-' + id).addEventListener('click', function () {
      var check = M.checkPrompt(id, state, draft, !!preview, el('answer-' + id).value);
      el('feedback-' + id).textContent = (check.ok ? 'Correct. ' : '') + check.message;
      el('feedback-' + id).className = check.ok ? 'success' : 'error'; status((check.ok ? 'Correct. ' : '') + check.message);
    });
  });
  render();
})();
