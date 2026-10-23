# rook for Claude Code

**Claude builds your agent. rook tests it. Same terminal.**

A Claude Code mod for [rook](https://github.com/LambdaTest/rook), TestMu AI's agent-assurance CLI. It puts rook's verdicts where your agent is being written. Claude can run the scenarios, read rook's evidence and fix what failed, and you watch it happen in a live pane.

> **New here?** Watch [v0.3 in 6 minutes](../../docs/media/rook-plugin-v3-walkthrough.mp4), [v0.2 in 4 minutes](../../docs/media/rook-plugin-v2-walkthrough.mp4) and the [setup walkthrough](../../docs/media/rook-plugin-walkthrough.mp4) and read [Getting started](../../docs/getting-started.md): one path for a repository with no rook tests, one for a repository that has them.

> Status: early access, like Claude Code's function-hooks API it is built on. Requires Claude Code 2.1.288 or newer and the rook CLI on `PATH` (`npm install -g @testmuai/rook`, or `brew install lambdatest/rook/rook` on macOS and Linux).

## What it does

| | |
|---|---|
| **Claude runs rook** | Fourteen tools in all. The core five: `run` (execute scenarios, get verdicts back), `report` (read a finished run from disk, no credits), `status`, `scenarios` (every scenario with its latest verdict, so Claude picks `only` without guessing) and `generate` (write scenarios). Failures come back grouped into rook's clusters. With `rca`, each cluster has its cause, fault, files and the proposed diff from `remedies/CL-xx.md`, followed by rook's narrative and next steps. `run` also takes `tags`, `profile`, `concurrency`, `resume`, `continueRun` + `phases`, and a free-text `instruction`. |
| **Setup inside Claude Code** | Three more tools for a repository with no rook setup: `project` (list, `use` or `create` the rook project), `explore` (`rook explore .`: find the agents, write their features; spends credits, takes minutes) and `profile_test` (list profiles, `use` one, or `test` one: a single call to the agent, under the production guard). Adding a profile needs your connection details, so Claude asks you to type `! rook profile add <name> --from connection.md` yourself. |
| **Pane tabs** | **Health** (below), **Runs** (finished runs with counts, pass rate, credits and duration; open one for **Report to Claude**, **Explain with rca**, **Compare with…**; pick two to see per scenario what was fixed, regressed, new, missing or still failing), **Scenarios** (filter all · failing · unable to verify · never run · functional · adversarial; select and **Run selected**, **Exclude/Include selected**; open one for its goal, criteria and latest verdict with **Fix this with Claude**, **Turn into regression test** and **Re-run 3×**, which marks it **flaky** when verdicts disagree; a box to generate new scenarios), **Setup** (the checklist; each profile with verified state, target and its variables set or unset in rook's env store, never their values; **Use**, **Test**; a profile wizard with the exact `! rook profile add …` and `! rook env set …` lines; **Sync upstream**; the session budget). `/rook tab <name>` opens one. |
| **Confirm before spending** | **Run all**, **Re-run failed**, **Re-test these**, **Run selected**, **Re-run 3×**, profile **Test** and the generate box park in a confirm bar with a credit estimate (the latest run's credits per scenario) until you press **Confirm**. A run started from the pane or `/rook run` has **Cancel**. |
| **Verdict card** | When Claude runs or reports a rook run, the transcript shows a card instead of the plain result: Pass / Fail / Unable to Verify, pass rate, credits, duration, the top clusters or failures, **Open in pane** and **Fix with Claude**. While Claude's run is in flight, its tool row shows how many scenarios are judged. Claude still reads the same result text. |
| **Live progress for generate and explore** | A lane per feature (generate: planned → writing → done, with scenarios written / planned) or per agent (explore), read from rook's `--verbose` output and from the files it writes; the spinner shows the same when Claude called the tool, e.g. `rook generate · F-003 writing · 3/7 · 2m10s`. |
| **History** | The `runs` tool and `/rook runs [N]` list the agent's runs on disk, newest first (size, Pass / Fail / Unable to Verify, credits, local test runs), so Claude can name an older run for `report` or its `rca` option. Each scenario's latest verdict looks back over the newest 30 runs, and keeps looking up to 300 for scenarios those did not judge. Scenarios or features changed outside the session (`rook generate` in another terminal) are picked up on the next poll. When the selected project has no runs but another project folder here does, the pane says where they are. |
| **Depth** | `report` with `rca: true` runs `rook report <run> --rca` on a finished run: rook explains its clusters without calling the agent again (free when that agent version was explained already, otherwise it costs credits); the pane's **Explain with rca** does the same. `agent` lists the project's agents and switches with `use` (the pane offers the switch when there is more than one). `curate` excludes or includes scenarios; delete is left to the terminal. The pane header and `status` show the credit balance (`rook plan`), and a run's result warns when it will not cover the re-test. |
| **Two views: QE and Developer** | The first tab follows who is looking (the `lens` option, or **l** in the pane, kept between sessions). **Release** (QE): ship or not, with pass rate beside *trusted* pass rate (passes with a forbidden hit, a criterion passed at Low confidence or under 100% compliance do not count); **Blockers** (agent bugs to file) with each scenario's last verdicts; **Verdicts to check** (passed-but, judge unsure, profile broke); **Suite health** (scenarios that never passed, flaky ones) and coverage gaps by feature; **Draft bug reports**, **Generate for gaps**. **My change** (Developer): the tracked files edited since the last green run, each with the scenarios it reaches and ⧗ on verdicts older than the edit; what the change broke, with the failing criterion; what it cost in tokens and latency (like for like); what is not your code; **Fix with Claude**, **Re-test affected**. rook's clusters and *What nobody looked at* stay in both. |
| **Who acts on a verdict** | Every non-passing scenario is marked **agent bug**, **scenario wrong** (never passed in 4 runs), **profile broke** (a hook failed or no reply was recorded), **judge unsure** (could not check) or **passed, but…**, from the evidence on disk; rook's own root-cause fault wins when `--rca` explained it. The main button follows the mark. |
| **Scenario drill-down** | Any scenario in any tab opens one screen: why it has that mark, the files changed since it last passed, the profile's hooks as a timeline with the failed one marked, the conversation with the turns the judge quoted marked, every criterion with its confidence (weak passes flagged), its history and its cost. A QE sees criteria first and **Draft bug report**; a developer sees changed files and the conversation first and **Fix with Claude**. Prompts carry only what the evidence shows, with the file paths. |
| **Trends** | Scenarios × recent runs as a grid (hover, click or arrows and Enter on terminals that support it; a text grid elsewhere): flaky, regressed, never passed and fixed at a glance. Pass rate, trusted pass rate and tokens per run. |
| **Live** | A run in flight shows above every tab: progress, time left, the lanes, and each verdict as it lands (open any of them). The band above the prompt follows the run with **Open** and **Cancel**. A run from another terminal or CI that lands with a new failure keeps a band until dismissed. Edits made by Claude, the shell or an editor mark the affected verdicts stale within one poll. |
| **Keyboard** | `/rook`, a band's **Open** and the card's **Open in pane** give the pane the keys; when rook opens it on its own it does not take your typing. Every action has a key (shown at the pane's foot); Esc returns to the prompt. |
| **Health tab** | *(the first tab, as Release or My change)* Clusters and failed scenarios open to their criteria, evidence and remedy. *What nobody looked at* groups each gap by cause (agent never answered, tool calls nobody reported, not observable, undecidable, passed with parts unchecked) with the remedy, **Fix with Claude** and **Re-test these N**. |
| **Spinner progress** | While Claude waits on a run, the turn's spinner shows `rook 3/8 · SC-004 execute · 1m12s`, so progress is visible even where the pane can't dock. |
| **Re-test prompt** | When Claude edits a file the agent is built from (`agent.yaml` → `source.tracks`), a band above the prompt names the scenarios it may affect: those whose features cite the file; for shared code no feature cites, those whose features cite a file importing it, or whose expected tool calls and text name what the file defines. It says how it chose, and falls back to the whole agent saying why. Each scenario is a toggle with its cost; **Details** lists why each matched; **Re-test N** asks Claude to run only the ticked ones. |
| **Failures as context** | If you start a run in another terminal, the mod notices when it finishes. If anything failed, Claude gets the clusters and failing criteria without any copy-pasting. |
| **Status line** | Picks what matters now. A fresh repo: `not set up · next: select a project · found agent + PRD`. Pulled but never run: `21 scenarios · never run · next: test the profile`. Running: `◐ 5/12 ✗1 · SC-006 execute 12s · ETA 3m`. Just finished (10 minutes): `✓ 11/12 2m ago · fixed SC-004 · ✗ SC-009`. Idle for a QE: `✓7 ✗3 ?2 58% (42% trusted) ▂▄▅▆ · 2 blockers · 1 flaky`; for a developer: `2 regressed since green · Δ3 files · 2 stale · tokens +11%`. Low credits and the session budget are added when there is room; on a narrow line the less important parts drop first. |
| **More tools** | `compare` (two runs from disk, no credits), `sync` (record the project upstream with `rook sync`, no credits, needs a plan with Rook cloud; `check` reads the state only) and `ci` (preview or write a GitHub Actions workflow). |
| **CI** | `/rook ci` previews `.github/workflows/rook.yml`: on pull requests it installs rook from npm (`@testmuai/rook`, your version or `latest`), signs in from a `ROOK_AUTH` secret, sets the profile's variables from secrets of the same names, runs `rook run --test --json` on the functional scenarios (or `ROOK_ONLY`), uploads the run folder and fails on Fail verdicts (rook's exit code is 0 either way, so it reads the report). Unable to Verify fails the job only with `--strict`. `/rook ci write` writes it and never overwrites without `--force`. |
| **Budget** | `/rook budget 50` caps what runs and generates may spend this session, measured from the credit balance; one that would go past it is refused. `/rook budget off` lifts it. |
| **`/rook`** | `pane` · `status` · `scenarios [exclude <ids>]` · `scenarios [include <ids>]` · `agent [use <id>]` · `report [run] [--rca]` · `explain [run] [--rca]` · `run [--only …] [--class …] [--category …] [--tag …] [--profile …] [--name …] [--concurrency N] [--resume <run>] [--run <run> --phases …] [--test] [--rca] [-- instruction]` · `generate [--total N] [--class …] [--category …] [--force] [-- what to cover]` · `tab health\|runs\|scenarios\|setup\|trends` · `compare [base] [head]` · `flaky <id> [N]` · `sync` · `budget [<credits>\|off\|status]` · `ci [write] [--force] [--strict]` · `ui` · `confirm-prod [profile]` · `help` |
| **`/rook` setup** | `project [list\|use <id>\|create <name>]` · `explore [--force] [-- instruction]` · `profile [list\|use <id>\|test [id] [-- goal]]` |
| **Production guard** | Refuses `rook run` (from Claude's shell or the tool, for the active profile or the one the run names) while the profile's target looks like production, until **you** type `/rook confirm-prod`. That opens a 15-minute window. The agent's writes are real and rook cannot roll them back. |

It keeps rook's vocabulary. **Unable to Verify is not Fail**: it is counted and shown separately, and failure notes to Claude say so.

## Install

From GitHub, inside Claude Code:

```
/plugin marketplace add LambdaTest/rook-claude-plugin
/plugin install rook@rook-claude-plugin
```

Or from a clone, for one session: `claude --plugin-dir <clone>/plugins/rook`.

Open Claude Code in your agent's repository. With a rook workspace (`.testmuai/rook/`) the pane opens by itself when the terminal is wide enough to dock it; otherwise type `/rook`. Without one, the status line says what rook found in the repository (agent code, a requirements document, a connection file, CI) and the next setup step; `/rook` shows the checklist with a button for that step.

## Options

Set them in `/config` or under `pluginConfigs.rook` in settings.

| Option | Default | |
|---|---|---|
| `rookPath` | `rook` | The CLI to run: a name on `PATH` or an absolute path |
| `pane` | `auto` | `auto` opens the pane in a rook workspace; `command` opens it only on `/rook`; `off` never opens it |
| `lens` | `qe` | Who the first tab leads for: `qe` (Release) or `dev` (My change); **l** in the pane switches and is kept |
| `statusLine` | `true` | Show the score in the status line |
| `retestBand` | `true` | Track edits to the agent and offer a re-test |
| `failureContext` | `true` | Hand failures of runs started elsewhere to Claude |
| `prodGuard` | `true` | Refuse runs against a production-looking target until confirmed |
| `prodPatterns` | `prod,production,live` | Whole words that mark a target as production |
| `allowRules` | *(empty)* | rook's own tool calls during `run` and `generate` are approved with `--yes`; list rules (`;`-separated) to pass `--allow` for each instead, and rook declines the rest |

## What this plugin runs, reads and sends

The plugin itself makes no network requests and holds no keys. Everything below is visible with `claude plugin validate .` (its `hooks:` and `calls:` lines).

**Runs**
- The `rook` CLI (or the path you set in `rookPath`), in the session's directory. When a session starts it runs `rook --version`, `rook auth status` and `rook plan --json` (credits left), and runs `plan` again after anything that spends credits. The pane's refresh reads files only. `rook run`, `generate`, `explore`, `report --rca` and `profile test` run only when you or Claude ask, and Claude Code asks your permission before Claude calls a tool that spends credits.
- `rook ui --local --no-open`, only when you open the evidence viewer: rook's read-only viewer, served on localhost.
- `rook generate` and `rook explore` with `--verbose`, so the pane can draw progress; rook writes those lines to stderr.
- `rook sync` and `rook status --json` when you press **Sync upstream** or **Check sync state**, type `/rook sync`, or Claude calls the `sync` tool. Sync records the project's features, scenarios and profiles with TestMu AI's rook service; it spends no credits. It needs an Agent Assurance plan with Rook cloud: on Starter, rook refuses it with an upgrade link and runs stay on this machine.
- `rook --version` when you preview a CI workflow, to pin its `npm install -g @testmuai/rook` to your version (or `latest`).
- `rook plan --json` before each run or generate while a session budget is set.

**What rook does when it runs** (rook's behaviour, not the plugin's): it sends your agent's code, features and scenarios to TestMu AI's rook service to explore, plan and judge, and it calls **your agent** through the profile you configured. A run's actions on your agent are real.

**Reads**
- `.testmuai/rook/` in the session's directory: settings, scenarios, features, profiles, runs, verdicts and remedies.
- `~/.testmuai/rook/env.json` (rook's variable store, written by `rook env set`), for the production guard only. It reads the values of the variables the active profile declares, checks them for production markers and never shows, stores or sends a value.
- The `TMPDIR` environment variable, to place profile-test state folders.

**Writes**
- `.github/workflows/rook.yml`, only when you type `/rook ci write` or Claude calls the `ci` tool with `write`, and never over an existing file without `--force` / `force`. Nothing else in your repository: rook writes `.testmuai/rook/` itself.
- A fresh `rook-profile-test-<time>/` folder under the system temp directory for each profile test it starts, passed to rook as `ROOK_STATE_DIR` / `ROOK_RUN_STATE_DIR`.

**Inside the session**
- **Tools and command:** it adds the rook tools (`mcp__rook__*`) and the `/rook` command.
- **Production guard:** it watches Claude's `Bash` calls only to refuse a `rook run` against a production-looking target until you type `/rook confirm-prod`. It never approves a tool call.
- **Re-test band:** it watches Claude's file edits only to offer a re-test of the scenarios an edited file affects.
- **Prompts it sends:** it submits a prompt to Claude only when you press a pane, band or card button such as **Re-test**, **Fix with Claude** or **Turn into regression test**.
- **Transcript:** it redraws the result row of its own `run` and `report` tools as a verdict card. The text Claude reads is unchanged.
- **Messages it adds:** it adds a run's failures to the conversation when a run started elsewhere finishes with failures. Turn this off with `failureContext`.

## How it talks to rook

Only through rook's published contract:

- The CLI's `--json` documents: `rook run --json`, `rook generate --json`, `rook status --json`, `rook scenarios list --json`, `rook scenarios exclude|include --json`, `rook plan --json`, plus `rook ui --local --no-open` for the viewer's address. `rook agent` and `rook report --rca` answer in prose, so the mod reads the agent list from it (or the agent directories) and re-reads the explained run from disk.
- For setup: `rook project --json` (or the plain `rook project` listing of an older rook), `rook project use|create`, `rook explore . --json`, `rook profile`, `rook profile use|test`. explore and profile test print prose even with `--json`, so the mod reads their closing lines. An older rook also answers `generate --json` with a prose line (`7 scenario(s) written, 0 already current, 553.12 credits`); the mod reads that line instead of reporting nothing written.
- The documented `.testmuai/rook/` layout: `run.yaml`, `report.yaml` (written last, so its presence means finished; its `clusters`, `narrative` and `next`), `remedies/<cluster>.md`, and `scenarios/<id>/verdict.yaml`. A scenario folder with no verdict yet is in flight. Its phase comes from `hooks.json`, `request.json` and `response.json`.

The mod holds no prompts and no model keys. It passes rook only validated flags:
- scenario ids in `SC-001` form
- the known classes and phases
- one-word categories and tags
- profile ids
- run ids in rook's form
- concurrency from 1 to 8
- printable names and rules that cannot start with `-`

A free-text instruction goes after `--`. Anything else is refused before `argv` is built.

**Profile tests and state.** `rook profile test` does not give a profile's scripts the state directory a run does, so a profile that keeps its session in `ROOK_STATE_DIR` fails it with "ROOK_STATE_DIR is required". The mod sets a fresh `ROOK_STATE_DIR` / `ROOK_RUN_STATE_DIR` under the system temp directory for each profile test it starts. rook passes its own environment to the scripts and sets these itself during a run, so runs keep their per-scenario directories.

## What the production guard reads, and what it does not

It reads the active profile's `target.endpoint`, `domain`, `command`, `server`, `url` and `base_url`, plus `hook_env`. It also reads the values of the variables the profile declares under `env`, taken from rook's own store (`~/.testmuai/rook/env.json`, written by `rook env set`).

A refusal names the field or variable and the marker word. It **never** includes the value, because a declared variable may be a credential. `localhost` and `127.0.0.1` targets are never flagged.

It does **not** read your shell's environment. A target whose only production marker is a variable exported in your shell will not be caught.

It is a speed bump, not a sandbox, and it does not make a run safe. Point your profiles at staging.

## Development

```
claude plugin validate .   # what the module hooks and calls; what the engine would refuse
claude plugin test .       # logic, pane and band on terminal and desktop, tools, guard, /rook
```

The YAML reader handles the subset rook writes. It was checked against 3,949 real rook files and matched PyYAML on all of them, apart from trailing whitespace inside long descriptions. Its run totals were also checked against `rook report --json` on 52 real runs, with no mismatches.

Apache-2.0, like rook.
