---
name: pokemon-session-wrapup
description: "Ends a Kepler Pokemon Chart work session: verifies cache bumps, runs the headless suite, updates the README, writes the next numbered checkpoint, commits, and deploys by merging to main. Project-specific to kepler-pokemon-chart, and the only sanctioned way to push this repo."
disable-model-invocation: false
user-invocable: true
---

# Session Wrap-up — Kepler Pokémon Chart

Use at the end of a working session to verify quality, document state, and
deploy. This is the **only** place a push to GitHub is allowed.

Repo root: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
Dev branch: `prototype/pokemon-badge-collection` · Production branch: `main`

Work through the steps in order. Stop and ask if a **gate** fails.

---

## 1. Preflight

1. `git branch --show-current` — expect `prototype/pokemon-badge-collection`.
   **Gate:** if you are on `main`, stop. Never wrap up directly from production.
2. `git status --short` — review what changed this session. Note any file you
   did not touch yourself and mention it before staging.

## 2. Verify cache invalidation

**Gate.** If any `.js` or `.css` file changed this session, both of these must
have been bumped. If either was missed, fix it now before testing.

1. `CACHE_NAME` in `service-worker.js` (`poke-chart-cache-vNNN`).
2. The `?v=` query strings in `index.html` (`style.css?v=`, `app.js?v=`).
3. If a **new** module file was added, confirm it is also listed in
   `ASSETS_TO_CACHE` in `service-worker.js`.

## 3. Audit test numbering

`grep` is blocked as a shell command in this environment, so use:

```bash
node -e "const m=[...require('fs').readFileSync('tests.js','utf8').matchAll(/Running Test Case (\d+)/g)].map(x=>+x[1]);const s=[...m].sort((a,b)=>a-b);const d=[...new Set(s.filter((v,i)=>s[i+1]===v))];console.log('blocks:'+m.length,'unique:'+new Set(m).size,'dupes:'+(d.join(',')||'none'))"
```

`dupes:12` is expected (`Test Case 12` / `12 part 2` — one feature, two phases).
**Gate:** any other duplicate. Before renumbering, grep `docs/` and let existing
documentation decide which test keeps the original number.

## 4. Run the headless suite

The runner does **not** start a web server. Check first, start if needed:

```bash
curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8000/index.html
# if not 200:
python3 -m http.server 8000   # background
```

Then:

```bash
node run_headless_tests.js
```

**Gate:** must be 100% green. Expect ~17–25s; investigate if it exceeds ~60s or
hangs. Do not proceed to commit with a failing suite.

## 5. Update the README

Update `README.md` only if this session changed user-visible behaviour:

- New features that need documenting.
- Removed features whose instructions are now stale.
- Changed setup, passwords, ports, or dependencies.

Skip it for pure refactors and internal fixes.

## 6. Write the next checkpoint

### Determine the number correctly

```bash
ls docs/checkpoint_*.md | sort -V | tail -1
```

> [!IMPORTANT]
> Use **numeric** sort. `ls | tail -1` sorts lexically and returns
> `checkpoint_9.md`, which would make you write `checkpoint_10.md` **over an
> existing file**. Parse the number as an integer, take the max, add one, then
> confirm `docs/checkpoint_<N>.md` does not already exist before writing.

### Structure

Follow the house format exactly — the session-start protocol reads these
sections by name.

```markdown
# CHECKPOINT <N>

This document contains a complete, chronological record of user requests, system
configurations, version progress, and active schema definitions for the
application. **Use this block to initialize your next pair-programming session.**

---

## 1. Outstanding User Requests

- [x] **<Request>**: what was asked, what was done, quoting the user where useful.
- [ ] **<Deferred request>**: why it was deferred.

### Known Follow-ups / Nice-to-haves
- [ ] <Deferred item, known wart, or deliberate non-fix — with the reasoning.>

<!-- REQUIRED. The next session reads this section by name. If there is genuinely
     nothing, write "- None." rather than omitting the heading. -->

---

## 2. User & Project Metadata

*   **Repository Location**: `/usr/local/google/home/crsjain/kepler-pokemon-chart`
*   **Active Branch**: `prototype/pokemon-badge-collection`
*   **Production Branch**: `main`
*   **Target Audience**: Kepler (7yo) & Lyra (5yo)
*   **Current Version**: `vX.Y.Z` / Service Worker cache `poke-chart-cache-vNNN` /
    Asset tags `style.css?v=X.Y`, `app.js?v=X.Y`
*   **Admin Password**: `"zxcv"`
*   **Local Server URL**: `http://localhost:8000/` (or `http://crsjain.c.googlers.com:8000/`)
*   **Git Policy**: Committed to `prototype/pokemon-badge-collection`, merged to
    `main`. No mid-session pushes.
*   **Audio/Volume Settings**: <if changed>
*   **Test Suite**: <N> blocks, <N> unique numbers. Run via `node run_headless_tests.js` (~Ns).

---

## 3. Active V<N> State Schema

```javascript
<the current state object from state.js, including any fields added this session>
```

<Note explicitly whether the schema changed and whether a migration was needed.>

---

## 4. Work Accomplished

### <Themed subsection per major change>
* **`<file>`**: what changed and why.

---

## 5. Files and Code

### Created Files
* [`path`](file:///absolute/path): purpose.

### Edited Files
* [`path`](file:///absolute/path): summary of changes.

---

## 6. Validation Instructions

1. <Step-by-step manual verification the user can follow.>
2. **Automated Suite**: run `node run_headless_tests.js`; verify 100% pass.
```

## 7. Commit

1. `git status` — review before staging. Do not stage files you did not touch
   without flagging them.
2. `git add -A` (the new checkpoint in `docs/` is included).
3. Commit with a descriptive message:
   ```bash
   git commit -m "feat: <summary of work> and checkpoint <N>"
   ```
   If a false-positive secret scan blocks it, retry with `--no-verify` and say so.

## 8. Deploy

```bash
git push origin prototype/pokemon-badge-collection
git checkout main
git merge prototype/pokemon-badge-collection
git push origin main      # triggers GitHub Pages
git checkout prototype/pokemon-badge-collection
```

**Gate:** if the merge is not a clean fast-forward, stop and ask rather than
resolving conflicts on `main`.

Always return to the dev branch at the end, and confirm with
`git branch --show-current`.

## 9. Report

- ✅ Tests: pass count + wall-clock
- 📦 Cache: SW version and asset tags after bumping
- 📄 Checkpoint: path to the new file
- 🚀 Deploy: confirmation that `main` was pushed and you are back on the dev branch
