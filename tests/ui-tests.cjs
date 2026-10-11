'use strict';
// Optional developer tooling; the activity itself remains dependency-free.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', mime[path.extname(file)] || 'text/plain'); res.end(data);
  });
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, ...(process.env.HANSA_CHROMIUM_PATH ? { executablePath: process.env.HANSA_CHROMIUM_PATH } : {}) });
  let checks = 0;
  function eq(actual, expected, why) { checks++; assert.deepEqual(actual, expected, why); }
  function ok(value, why) { checks++; assert.ok(value, why); }
  try {
    for (const url of [pathToFileURL(path.join(root, 'index.html')).href, `http://127.0.0.1:${server.address().port}/index.html`]) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(url);
      eq(await page.getByRole('spinbutton', { name: 'Alder Grain labor share (%)', exact: true }).count(), 1, 'Production controls identify the city');
      eq(await page.getByRole('combobox', { name: 'Your answer for exercise 4', exact: true }).count(), 1, 'Answers identify the exercise');
      eq(await page.getByRole('button', { name: 'Check answer for exercise 4', exact: true }).count(), 1, 'Check buttons identify the exercise');
      await page.locator('#example').click();
      eq(await page.evaluate(() => document.activeElement.id), 'plan-heading', 'Example loading focuses the plan');
      await page.locator('#preview').click();
      ok((await page.locator('#preview-summary').textContent()).includes('+48.315303'), 'Worked example has expected total gains');
      await page.locator('#execute').click();
      ok((await page.locator('#outcomes-table').textContent()).includes('Joined this turn'), 'Completed membership is in past tense');
      ok(!(await page.locator('#history-detail-table').textContent()).includes('joins this turn'), 'History does not promise a future admission');
      for (let turn = 2; turn <= 6; turn++) { await page.locator('#preview').click(); await page.locator('#execute').click(); }
      eq(await page.locator('#turn-label').textContent(), 'Six turns complete', 'Six-turn session completes');
      eq(await page.locator('#preview').isDisabled(), true, 'Seventh turn cannot be previewed');
      eq(await page.locator('#execute').isDisabled(), true, 'Seventh turn cannot execute');
      eq(await page.locator('#history-table tbody tr').count(), 6, 'All six outcomes recorded');
      if (await page.locator('#compare-economies').count()) {
        eq(await page.locator('#compare-economies').isDisabled(), true, 'Comparisons do not reopen a completed session');
        const downloaded = page.waitForEvent('download');
        await page.locator('#download-record').click();
        const csv = fs.readFileSync(await (await downloaded).path(), 'utf8');
        eq(csv.trim().split('\r\n').length, 25, 'CSV download contains every city in every completed turn');
        await page.locator('#load-transport').click();
        const before = await page.locator('#score-label').textContent();
        await page.locator('#compare-economies').click();
        eq(await page.locator('#execute').isDisabled(), true, 'Comparison does not substitute for explicit preview');
        eq(await page.locator('#comparison-panel .comparison-card').count(), 3, 'All three counterfactual economies shown');
        ok((await page.locator('#comparison-panel .comparison-card').nth(0).textContent()).includes('Executable'), 'Cheap control exchange is executable');
        ok((await page.locator('#comparison-panel .comparison-card').nth(1).textContent()).includes('Invitation refused'), 'Costly control exchange is refused');
        eq(await page.locator('#score-label').textContent(), before, 'Comparison awards no points');
        eq(await page.locator('#scenario').inputValue(), 'expensive', 'Comparison does not change the current economy');
        eq(await page.locator('#shipment-0-amount').inputValue(), '10', 'Comparison preserves shipment instructions');
        await page.locator('#share-alder').fill('55');
        eq(await page.locator('#comparison-panel .comparison-card').count(), 0, 'Edits invalidate old comparisons');
        await page.locator('#example').click();
        ok((await page.locator('#budget-alder').textContent()).includes('Produces 95 grain'), 'Live budget accounts for transport before production');
        await page.locator('#preview').click();
        await page.locator('#compare-economies').click();
        eq(await page.locator('#execute').isDisabled(), false, 'Comparison does not invalidate an unchanged explicit preview');
        eq(await page.locator('#comparison-panel .comparison-state').nth(1).textContent(), 'Physically infeasible', 'Impossible export is distinct from voluntary refusal');
        await page.locator('[data-city="alder"][data-share="50"]').click();
        eq(await page.locator('#share-alder').inputValue(), '50', 'Production preset updates the numeric control');
        eq(await page.locator('#execute').isDisabled(), true, 'Preset invalidates permission to execute');
        eq(await page.locator('#draft-health').isVisible(), true, 'Invalid budget remains visible through field error clearing');
      }
      await page.locator('#load-transport').click(); await page.locator('#preview').click();
      eq(await page.locator('#execute').isDisabled(), true, 'Refusal blocks execution');
      ok((await page.locator('#preview-summary').textContent()).includes('No membership changes have occurred'), 'Blocked departure stays conditional');
      ok(!(await page.locator('#outcomes-table').textContent()).includes('leaves after this turn'), 'Blocked proposal does not announce an actual departure');
      await page.locator('#answer-transport').selectOption('loss'); await page.locator('#check-transport').click();
      ok((await page.locator('#feedback-transport').textContent()).startsWith('Correct.'), 'Refused preview still supports a self-check');
      await page.locator('#shipment-0-amount').fill(''); await page.locator('#preview').click();
      eq(await page.evaluate(() => document.activeElement.id), 'shipment-0-amount', 'Invalid preview focuses its field');
      eq(await page.locator('#execute').isDisabled(), true, 'Invalid input cannot execute');
      ok((await page.locator('#preview-hint').textContent()).includes('Correct the marked controls'), 'Invalid preview explains how to recover');
      eq(await page.locator('#feedback-transport').textContent(), '', 'Editing invalidates self-check completion');
      await page.locator('#example').click(); await page.locator('#preview').click();
      for (const width of [1280, 640, 375, 320]) {
        await page.setViewportSize({ width, height: 900 });
        ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `No page overflow at ${width}px`);
      }
      if (await page.locator('#compare-economies').count()) {
        await page.locator('#compare-economies').click();
        ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Comparison reflows at 320px');
        ok(await page.locator('#shipments-controls').evaluate(e => e.scrollWidth <= e.clientWidth + 1), 'Manifest needs no horizontal scrolling at 320px');
      }
      await page.locator('#candidate-birch').uncheck();
      eq(await page.locator('[id^="shipment-"][id$="-amount"]').count(), 0, 'Uninviting removes connected shipments');
      eq(await page.evaluate(() => document.activeElement.id), 'candidate-birch', 'Structural edit retains focus');
      eq(await page.locator('#execute').isDisabled(), true, 'Structural edit invalidates preview');
      for (const [id, answer] of [['autarky', 'cost'], ['trade', 'opportunity'], ['equal', 'no']]) {
        await page.locator('#load-' + id).click(); await page.locator('#preview').click();
        await page.locator('#answer-' + id).selectOption(answer); await page.locator('#check-' + id).click();
        ok((await page.locator('#feedback-' + id).textContent()).startsWith('Correct.'), `${id} self-check works`);
      }
      eq(errors, [], 'No browser exceptions');
      await page.close();
    }
    console.log(`Hansa browser: ${checks} checks across file:// and HTTP, 0 failures.`);
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
