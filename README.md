# Hansa

**[Click Here to Launch the Interactive Activity](https://financeprofessormckee.github.io/Hansa-Trading-League-Activity/)**

> **Status:** v1 prototype under review with David Friedman. Not yet accessibility-audited
> for teaching release.

Build a trading league through comparative advantage, transport costs, and voluntary membership. Four cities make grain and cloth. Students invite cities into a league, set each city's production mix, and plan direct shipments. Newcomers join only if they beat their best no-trade outcome. Six turns are scored on cumulative gains over autarky.

## Educator Guide: Classroom Integration

This activity is a browser adaptation of Proposal 27 in David Friedman's
[Living Paper](http://daviddfriedman.com/Living_Paper/living_paper.htm) catalog of teaching programs
([original program descriptions](http://daviddfriedman.com/Living_Paper/Program_Descriptions/program_descriptions.htm)).

### The Economic Model

* **Production and trade:** labor split between grain and cloth; exporters pay transport labor.
* **Voluntary membership:** every newcomer must beat autarky; members may take a loss and then leave.
* **Scenarios:** cheap transport, expensive transport, and equal opportunity costs, plus a worked example and four self-checks.

The full model, its adaptations from Friedman's description, and acceptance cases are in
[SPECIFICATION.md](SPECIFICATION.md). The recorded source brief is in [DESIGN.md](DESIGN.md).

### Running it locally

Open `index.html` in a browser. There's no build step, installation, or server, and
everything is local. Model tests run with Node: `node tests/model-tests.cjs`.

### Proposed review improvements

See [REVIEW.md](REVIEW.md) for findings, scope, and validation. The optional
browser regression suite requires Node 20 or later: `npm ci`, then
`npx playwright install chromium`, then `npm test`. `npm run test:model` needs
no browser. `HANSA_CHROMIUM_PATH` can select an existing Chromium executable.
These are developer tools only; students still open `index.html` directly.

### License and Citation

The source code for this web application is licensed under the [MIT License](LICENSE). You
are free to use, modify, and distribute the software, consistent with the Living Paper's
request that code based on Friedman's proposals remain open source.

The economic concepts are David Friedman's. The West Texas A&M University name, seal, and
branding assets are not covered by the license and do not imply institutional endorsement
of derivative works. If you use or adapt this activity, please cite this repository.

---
*Economic concepts: [David Friedman](http://daviddfriedman.com/Living_Paper/living_paper.htm). Development: [Eric McKee](https://github.com/financeprofessormckee),
Paul and Virginia Engler College of Business, West Texas A&M University.*

Historical Hansa work: Tom Courtney, with a later Java rewrite by Mikel Evins (credited on the Living Paper index; their code was not used here).
