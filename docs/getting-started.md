# Getting started

This guide covers the two situations you will be in:

- **[Case A: a repository with no rook tests yet](#case-a-a-repository-with-no-rook-tests-yet)**: no `.testmuai/rook/` folder. You set rook up from inside Claude Code.
- **[Case B: a repository that already has rook tests](#case-b-a-repository-that-already-has-rook-tests)**: `.testmuai/rook/` already holds scenarios and runs, made by you, a teammate or CI.

[![Walkthrough video: every stage in one Claude Code session](media/walkthrough-poster.png)](media/rook-plugin-walkthrough.mp4)

*[Watch the setup walkthrough](media/rook-plugin-walkthrough.mp4) (Case A, from an empty repository to a fix), [v0.2 in 4 minutes](media/rook-plugin-v2-walkthrough.mp4), and [v0.3 in 6 minutes](media/rook-plugin-v3-walkthrough.mp4) (the side pane for QEs and developers: every case, live) (Case B: the tabs, a confirmed run, the verdict card, the re-test bar, Cancel, budget and CI).*

## Before either case

1. Install the rook CLI and sign in:
   ```bash
   brew install lambdatest/rook/rook     # or: npm install -g @testmuai/rook
   rook login                            # add --oauth if no browser opens
   ```
2. Install the plugin. Inside Claude Code:
   ```
   /plugin marketplace add LambdaTest/rook-claude-plugin
   /plugin install rook@rook-claude-plugin
   ```
   Restart Claude Code once.
3. **Start Claude Code in your agent's repository.** The plugin reads `.testmuai/rook/` from the directory the session starts in, the same way rook does. In a new folder, accept the trust prompt and restart: plugins do not load in untrusted folders.

---

## Case A: a repository with no rook tests yet

Outside a rook workspace, the plugin stays quiet: no pane, no status line, no edit tracking. It wakes up when you type `/rook` or ask Claude about rook.

### 1. See what is missing

Type `/rook`. The pane opens with a setup checklist and one next step:

```
rook · setup
✓ rook installed
✓ signed in
✗ no project selected
✗ no agent yet
✗ no scenarios
✗ no profile
Next: type /rook project to see your projects and /rook project use <id> to pick one, or ask Claude to set rook up.
```

The same next step shows in the status line, so you always know where you are.

### 2. Create or pick a project

> *"Set up rook for this repo: create a rook project named Northstar Bank."*

Claude calls the plugin's `project` tool, creates the project and selects it. To use an existing project instead: `/rook project` lists them, `/rook project use <id>` selects one. This step costs no credits.

![Stage 1: project created, checklist ticked](media/1-project.png)

### 3. Explore the code

> *"Explore this repository with rook. The agent entry is src/agent.ts and PRD.md defines the required behaviour."*

Claude calls `explore` (`rook explore .`). rook reads the code, finds the agent and writes its **features**, the behaviours your scenarios will test. It takes a few minutes and spends credits (about 10 for a small agent).

**Name the entry file.** rook finds agents by their model calls. If your agent gets its model through a parameter or a shared helper, rook can miss it and report *"found no agent"*. Pointing at the file fixes that.

![Stage 2: one agent, 8 features](media/2-explore.png)

### 4. Generate scenarios

> *"Write about 6 rook scenarios for this agent, functional and adversarial."*

Claude calls `generate`. rook plans per feature and writes scenario files: happy paths, boundaries, prompt injection, data exfiltration, jailbreaks. The pane counts them as *never run*. This is the slowest step (several minutes) and spends credits. Add `force` to rewrite scenarios that rook considers current.

![Stage 3: 7 scenarios written](media/3-generate.png)

### 5. Add a profile, yourself

A profile tells rook how to reach your agent: a URL, a command or hook scripts. Only you know those details, so **Claude asks you to type this one**:

```
! rook profile add http --from connection.md
```

`connection.md` can be a curl command, an API spec or plain notes. rook writes a runner script, calls the agent once and keeps the profile only if the agent answered. If it prints `needs SOME_TOKEN`, set the value once with `! rook env set '{"SOME_TOKEN":"…"}'`. rook stores it outside the repository.

![Stage 4: profile verified](media/4-profile-add.png)

Then let Claude check it with one call to the agent:

> *"Test the http profile once with the rook profile_test tool."*

![Stage 4: profile test](media/4-profile-test.png)

### 6. Run

> *"Run all the rook scenarios as a local test run, then tell me what failed and why."*

Claude calls `run` and Claude Code asks your permission first: **a run calls your real agent and spends credits.** While it runs, each scenario gets a lane in the pane with its phase (`starting`, `execute`, `judging`) and elapsed time. The spinner shows `rook 3/7 · SC-004 execute · 1m12s`.

The result comes back as **Pass**, **Fail** or **Unable to Verify**, never mixed up. *What nobody looked at* lists what rook could not check, and why.

![Stage 5: 4 Pass, 0 Fail, 3 Unable to Verify](media/5-run.png)

### 7. Fix and re-test

> *"SC-001 never reached a verdict. Find why in the rook evidence and fix the cause in the agent source."*

Claude reads the run's evidence, finds the cause and edits the agent. The moment it edits a file the agent is built from, a bar appears above the prompt:

```
◆ rook  Agent changed since last run: source/shared/engine.mjs · all 7 scenarios may be affected · ~80.73 credits  [ Re-test ]  [ Dismiss ]
```

Press **Re-test**, or ask Claude to re-run only the scenarios it touched.

![Stage 6: fix and re-test bar](media/6-fix-retest.png)

Setup is now done. From here on you are in Case B.

---

## Case B: a repository that already has rook tests

Open Claude Code in the repository. The plugin finds `.testmuai/rook/` and reads everything already there; nothing is re-run.

### What you see straight away

- **The pane** opens by itself on a terminal at least 144 columns wide. Otherwise type `/rook`.
- **Agent health across all runs.** Each scenario shows its *newest* verdict, from whichever run judged it last. A two-scenario re-test yesterday does not hide the full run from last week. Scenarios no run has judged yet are counted as *never run*.
- **The latest run**: counts, pass rate, credits, duration, root-cause clusters, failed scenarios and *what nobody looked at*.
- **The status line**: `rook ✓41 ✗2 ?3 · 2 gaps · ↑1 fixed ↓1 regressed`. Fixed and regressed compare each scenario with its own previous verdict.

### Find your way around existing work

| You want to… | Do this |
|---|---|
| See every run on disk | `/rook runs` (or `/rook runs 50`), or ask Claude: it has a `runs` tool |
| Read an older run, free | `/rook report <run-id>` |
| Know *why* a run failed | `/rook report <run-id> --rca`, or **Explain with rca** in the pane. rook explains each cluster (cause, whose fault, files, proposed diff) without calling the agent again |
| Hand the failures to Claude | `/rook explain`, or open a cluster or failure in the pane and press **Fix this with Claude** |
| See which scenarios exist | `/rook scenarios`. Leave one out of runs with `/rook scenarios exclude SC-007` |
| Switch agent | The pane offers a switch when the project has more than one, or `/rook agent use <id>` |
| See what changed between two runs | **Runs** tab → open a run → **Compare with…**, or `/rook compare` |
| Run a handful of scenarios | **Scenarios** tab → filter, tick them, **Run selected** (you confirm the credit estimate first) |
| Check whether a scenario is flaky | Open it in the **Scenarios** tab → **Re-run 3×**, or `/rook flaky SC-004` |
| Turn a failure into a regression test | Open the failing scenario → **Turn into regression test**: Claude writes one with the generate tool |
| Fix an "Unable to Verify" | **Health** tab → *What nobody looked at* → **Fix with Claude** on its group, then **Re-test these** |
| Record the project upstream | **Setup** tab → **Sync upstream**, or `/rook sync` (no credits; needs a plan with Rook cloud) |
| Cap spending for this session | `/rook budget 50`; `/rook budget off` lifts it |
| Run rook on every pull request | `/rook ci` to preview the workflow and the secrets it needs, `/rook ci write` to write it |
| Read a request, response or evidence file | **Evidence viewer** in the pane, or `/rook ui` |

### Things the plugin handles for you

- **Runs in other project folders.** rook reads only the selected project. When the selected project has no runs but another folder under `.testmuai/rook/projects/` does, the pane says so in yellow. Select that project with `/rook project use <id>`, or run here.
- **Work done outside the session.** Scenarios a teammate generates in another terminal show up on the next poll. A run you start in another terminal is noticed when it finishes, and if it failed, Claude gets the clusters and failing evidence without any copy-pasting.
- **Production targets.** If a profile looks like it points at production (`prod`, `production`, `live` in its endpoint or variables), runs are refused until **you** type `/rook confirm-prod`.

### The daily loop

1. Ask Claude to change the agent: *"tighten the refund guardrail"*.
2. Claude edits the code, and the re-test bar names the scenarios that file affects, with the estimated cost.
3. Press **Re-test**, or ask Claude to re-test what it touched. Prefer specific scenario ids: every run spends credits.
4. Read the verdicts. Fix and repeat.

---

## Credits, at a glance

| Step | Credits | Calls your agent |
|---|---|---|
| `/rook`, `status`, `scenarios`, `runs`, `report` | none | no |
| project list / use / create | none | no |
| explore | yes (≈10) | no |
| generate | yes, the most (≈120–550) | no |
| profile add | yes (≈160) | **yes, once** |
| profile test | yes (≈110) | **yes, once** |
| run | yes (≈12 per scenario) | **yes** |
| report with rca | yes, unless that agent version was explained already | no |

Figures are from the walkthrough; yours depend on the agent and rook's pricing. The pane header shows your balance.

## If something goes wrong

See [Troubleshooting in the user guide](user-guide.md#troubleshooting).
