<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/assets/rook-mascot-dark.gif">
  <img src=".github/assets/rook-mascot-light.gif" alt="rook, the chess-piece mascot" width="150">
</picture>

# rook for Claude Code

**Claude builds your agent. rook tests it. Same terminal.**

[![rook](https://img.shields.io/npm/v/@testmuai/rook?label=rook&color=cb3837)](https://www.npmjs.com/package/@testmuai/rook)
[![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-d97757)](#install)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)

[Install](#install) · [Getting started](docs/getting-started.md) · [User guide](docs/user-guide.md) · [rook CLI](https://github.com/LambdaTest/rook) · [Documentation](https://www.testmuai.com/support/docs/agent-assurance-overview/?utm_source=github&utm_medium=listing&utm_campaign=marketplace)

<sub>Built by <a href="https://www.testmuai.com/agent-assurance/?utm_source=github&utm_medium=listing&utm_campaign=marketplace">TestMu AI</a> (formerly LambdaTest)</sub>

</div>

A Claude Code plugin for [rook](https://github.com/LambdaTest/rook), TestMu AI's agent-assurance CLI. While Claude writes or changes your AI agent, this plugin lets Claude set rook up, run rook's scenarios against the agent, read the verdicts and the evidence, and fix what failed. You watch the results in a live pane.

[![Watch rook for Claude Code v0.3: the side pane for QEs and developers, in real sessions](docs/media/walkthrough-v3-poster.png)](docs/media/rook-plugin-v3-walkthrough.mp4)

*▶ [Watch v0.3 in 6 minutes](docs/media/rook-plugin-v3-walkthrough.mp4): five real sessions with the side pane docked: a repo rook has never seen, a repo pulled with rook tests but never run, the QE's Release view and drill-down with a bug report from evidence, a developer's fix and re-test, and edits and runs from another terminal flagged live. Earlier: [v0.2 in 4 minutes](docs/media/rook-plugin-v2-walkthrough.mp4): the published plugin in a real Claude Code session against a real rook project: the four tabs, fixing an Unable to Verify, the re-test bar, Run all with confirm and Cancel, budget and CI. Setting rook up from an empty repository is in [the setup walkthrough](docs/media/rook-plugin-walkthrough.mp4).*

## Start here

| Your repository | What happens | Guide |
|---|---|---|
| **Has no rook tests yet** (no `.testmuai/rook/`) | Type `/rook` for a setup checklist, or ask Claude to *"set rook up for this repo"*. Claude creates the project, explores the code and writes scenarios; you add the profile with one `!` command; then Claude runs and fixes. | [Case A](docs/getting-started.md#case-a-a-repository-with-no-rook-tests-yet) |
| **Already has rook tests** | Open Claude Code there. The pane reads every scenario and run already on disk (nothing is re-run), shows each scenario's newest verdict, and Claude can read, explain and re-test from history. | [Case B](docs/getting-started.md#case-b-a-repository-that-already-has-rook-tests) |

More: [Getting started](docs/getting-started.md) (with screenshots) · [User guide](docs/user-guide.md) · [Explainer](docs/explainer.html) (plain words, diagrams) · [How the plugin reads rook](plugins/rook/README.md)

```
┌ rook · commercecare · profile commerce-hooks ────────────┐
│ agent  ✓ 18  ✗ 2  ? 1  3 never run                      │
│ latest: hardened matrix · 2026-09-28T15-44-25Z           │
│ ██████████████████████████████ 4/4 done                  │
│ ✓ 0 Pass  ✗ 2 Fail  ? 2 Unable to Verify                 │
│ pass rate 0% · 18.4 credits · 4m12s                      │
│ ↓ regressed SC-003                                       │
│ Refund guardrail broke under a manager-approval claim    │
│ Clusters                                                 │
│ ▾ CL-01 [compromised] policy violated in F-001 (2) · remedy │
│     cause: the refund tool trusts a claim in the turn    │
│     fault: agent · high confidence                       │
│     Remedy  ```diff … ```                                │
│     [ Fix this with Claude ]                             │
│ What nobody looked at                                    │
│ ? SC-001 (rook could not observe it) tool calls not seen │
│ Next                                                     │
│ · Add a ledger read to the profile hooks                 │
│ [ Run all ] [ Re-run failed ] [ Fix with Claude ] [ Evidence viewer ] │
└──────────────────────────────────────────────────────────┘
```

*(A mock-up; your terminal's colours and width will differ.)*

## Features

1. **Claude runs rook.** Claude gets fourteen tools: `run`, `report`, `status`, `scenarios`, `runs`, `compare`, `curate`, `generate`, `agent`, `sync` and `ci`, plus the setup tools `project`, `explore` and `profile_test`. After changing your agent's prompt, tools or code, Claude picks the scenarios it touched (`scenarios` lists them with their latest verdicts) and re-tests them. It gets back Pass / Fail / Unable to Verify for each one, with failures **grouped into rook's root-cause clusters**. With `rca`, each cluster carries rook's cause, whose fault it is (agent, scenario or harness), the files to open and **the proposed diff** from `remedies/CL-xx.md`. It also gets each failing criterion with expected vs achieved and quoted evidence, rook's narrative and its next steps.
2. **A pane with four tabs.** **Health** (verdicts, clusters, and *what nobody looked at* grouped by cause with a fix and a re-test), **Runs** (history; compare two runs), **Scenarios** (filter, select, run selected, flaky checks, turn a failure into a regression test, generate more) and **Setup** (profiles, variables set or unset, a profile wizard, sync, budget). Anything that spends credits waits in a confirm bar with an estimate. Generate and explore show live lanes. Claude's run results show as a verdict card in the transcript.
   **Live verdict pane.** Shows every scenario's **latest verdict across runs**, so a two-scenario re-test doesn't stand in for the whole agent. While a run is going, each scenario gets a lane with its phase and elapsed time. After a run you get the clusters, failed scenarios you can **open to their criteria and evidence** and hand to Claude one at a time, *what nobody looked at* in plain words, and rook's next steps. **Evidence viewer** starts `rook ui --local` and links to it.
3. **Progress where you're looking.** While Claude waits on a run, the turn's spinner shows `rook 3/8 · SC-004 execute · 1m12s`, at any terminal width.
4. **Re-test prompt.** When Claude edits a file your agent is built from, a bar above the prompt names the scenarios that file affects and estimates the cost at the last run's rate. It has a **Re-test** button.
5. **Failures as context.** When a run you started in another terminal finishes with failures, Claude receives the clusters and the failing evidence automatically.
6. **Status line score.** For example `rook ✓41 ✗2 ?3 · 2 gaps · ↑1 fixed ↓1 regressed`, or `rook ▸ 12/48 · SC-013 judging` while a run is in progress. Fixed and regressed are counted per scenario against that scenario's previous verdict, never between runs of different scope.
7. **Run history.** `/rook runs` and the `runs` tool list every run on disk; agent health looks as far back as it needs to; scenarios added outside the session show up on the next poll.
8. **Setup from inside Claude Code.** In a repository with no rook workspace, `/rook` shows a six-step checklist (installed, signed in, project, agent, scenarios, profile) with the one next action, also in the status line. Claude can create the project, explore the code, write scenarios and test the profile. Adding the profile stays yours, because only you have the connection details.
9. **`/rook` commands.** `pane`, `status`, `scenarios`, `runs`, `report`, `explain`, `run`, `generate`, `explore`, `project`, `agent`, `profile`, `ui`, `confirm-prod` and `help`.
10. **Production guard.** Blocks rook runs against a target that looks like production, including a profile named in the run, until **you** type `/rook confirm-prod`. Your agent's writes are real, and rook cannot undo them.
11. **CI and a budget.** `/rook ci` previews (and `/rook ci write` writes) a GitHub Actions workflow that runs rook on pull requests and fails on Fail verdicts. `/rook budget 50` caps what runs and generates may spend this session.

## Requirements

- **Claude Code 2.1.288 or newer.** The plugin is built on Claude Code's function-hooks API, which is in early access.
- **The rook CLI on your `PATH`:**
  ```bash
  brew install lambdatest/rook/rook
  # or: npm install -g @testmuai/rook
  # or: curl -fsSL https://raw.githubusercontent.com/LambdaTest/rook/main/install.sh | bash
  ```
- **Signed in to rook:** `rook login` (add `--oauth` if no browser opens).
- **No rook workspace needed up front.** The plugin walks you through it ([Case A](docs/getting-started.md#case-a-a-repository-with-no-rook-tests-yet)). If you prefer the terminal: `rook explore .`, `rook generate` and `rook profile add`, as in [rook's five-minute guide](https://github.com/LambdaTest/rook#five-minutes).

## Install

### From GitHub (recommended)

Inside Claude Code:

```
/plugin marketplace add LambdaTest/rook-claude-plugin
/plugin install rook@rook-claude-plugin
```

Restart Claude Code once so the plugin loads.

### From a clone

```bash
git clone https://github.com/LambdaTest/rook-claude-plugin.git ~/rook-claude-plugin
cd ~/path/to/your-agent-repo
claude --plugin-dir ~/rook-claude-plugin/plugins/rook
```

To load it in every session without the flag, add this to `~/.claude/settings.json`:

```json
{ "env": { "CLAUDE_CODE_PLUGIN_DIRS": "~/rook-claude-plugin/plugins/rook" } }
```

## How to use it

Start Claude Code **in your agent's repository**, the folder that contains (or will contain) `.testmuai/rook/`. The plugin reads rook's files from the directory the session starts in, the same way rook does.

| You want to… | Do this |
|---|---|
| See the latest results | `/rook`. The pane also opens by itself on terminals at least 144 columns wide. |
| Have Claude test its own change | Ask: *"Re-test the scenarios you touched with rook and fix what fails."* |
| Hand a run's failures to Claude | `/rook explain` (latest run) or `/rook explain 2026-09-28T15-44-25Z`, or open a cluster or failure in the pane and press **Fix this with Claude** |
| Have rook explain the failures | Ask Claude to re-run with `rca`, or `/rook run --only SC-003 --rca`. Each cluster then gets a cause, a fault and a proposed diff |
| Run rook yourself, in the background | `/rook run --only SC-003,SC-018` · `/rook run --class adversarial --test` · `/rook run --profile local --tag smoke -- only the refund paths` |
| Continue a run whose evidence lands later | `/rook run --run 2026-09-28T15-44-25Z --phases collect,judge`, or `--resume <run>` to carry its work into a new run |
| Write scenarios for a new capability | Ask Claude, or `/rook generate --total 10 -- the returns flow`. If rook's features don't describe the capability yet, run `rook explore .` first |
| Set rook up in a new repository | `/rook project use <id>` (or `create <name>`), `/rook explore`, `/rook generate`, then `! rook profile add <name> --from connection.md` and `/rook profile test`. Or ask Claude to do it |
| See which scenarios exist | `/rook scenarios`, or ask Claude to use the rook `scenarios` tool |
| Read a request, response or evidence file | `/rook ui`, or **Evidence viewer** in the pane: rook's read-only on-disk viewer |
| Read a run without spending credits | `/rook report`, or ask Claude to use the rook `report` tool |
| Check sync state and agents | `/rook status` |
| Run against a target that looks like production | Point the profile at staging. If you really mean it, type `/rook confirm-prod` (or `/rook confirm-prod <profile>` for a profile the run names), which allows that profile in this directory for 15 minutes. |

### A typical loop

1. Ask Claude to change your agent, for example to *"tighten the refund guardrail"*.
2. Claude edits `src/tools.mjs`. The bar shows **Agent changed since last run: src/tools.mjs · 2 scenarios touch it**.
3. Press **Re-test**, or ask Claude to. Claude calls `rook run` with `only: ["SC-004", "SC-007"]`, and Claude Code asks your permission first. The spinner and the pane's lanes show each scenario's phase while it runs.
4. The verdicts come back grouped by cluster with evidence, for example: *"achieved: the agent called issue_refund for $500 after a manager-approval claim"*. With `rca`, rook's proposed diff comes with them. Claude fixes the agent and re-tests.
5. The pane and status line update as each verdict lands. The status line counts what the run fixed and what it regressed.

### Things to know

- **Each `run` calls your real agent and spends rook credits.** Claude Code asks your permission before every call to the `run` tool. Prefer `only` with specific scenario ids.
- **Unable to Verify is not Fail.** The plugin keeps them separate everywhere, as rook does.
- **rook's own tool calls are approved with `--yes`.** When the plugin runs `rook run` or `rook generate`, rook's explorer, planner and judge may read your code or run commands. Set `allowRules` to approve only the rules you list (passed as `--allow`); rook declines everything else.
- **rook's remedies are proposals.** Claude is told to check a proposed diff against the code before applying it, and to say so when rook blames the scenario rather than the agent.
- **The production guard is a speed bump, not a sandbox.** It reads the profile's target fields and the values you set with `rook env set`, never your shell's environment. It never shows a variable's value.
- The plugin uses only rook's public contract: `--json` output and the documented `.testmuai/rook/` file layout. It holds no prompts and no keys.

## Settings

Change them in `/config`, or under `pluginConfigs.rook` in your settings file.

| Option | Default | |
|---|---|---|
| `rookPath` | `rook` | The CLI to run |
| `pane` | `auto` | `auto` · `command` (open only on `/rook`) · `off` |
| `statusLine` | `true` | Score in the status line |
| `retestBand` | `true` | Re-test bar after Claude edits the agent |
| `failureContext` | `true` | Hand failures of runs started elsewhere to Claude |
| `prodGuard` | `true` | Block production-looking targets until confirmed |
| `prodPatterns` | `prod,production,live` | Whole words that mark a target as production |
| `allowRules` | *(empty)* | rook tool-call approvals, separated by `;`, e.g. `bash(npm test); bash(git *)@explore`. Empty means `--yes` |

## Development

```bash
cd plugins/rook
claude plugin validate .   # what the module hooks and calls; what the engine would refuse
claude plugin test .       # logic, pane and bar on terminal and desktop, tools, guard, /rook
```

See [`plugins/rook/README.md`](plugins/rook/README.md) for how the plugin reads rook's files and what the production guard checks.

**Where changes go.** Open pull requests against [`LambdaTest/rook-claude-plugin`](https://github.com/LambdaTest/rook-claude-plugin). Merging to `main` publishes the plugin, and `main` needs one approving review. Raise `version` in `plugins/rook/.claude-plugin/plugin.json` with every change users should get: Claude Code caches the plugin by version, so a change merged without a bump never reaches existing installs.

## License

Apache-2.0, like rook. rook and TestMu AI are trademarks of their owners; this plugin is an independent integration.
