import { atom, read, update } from 'claude-code'
import type { CommandRunInput, EngineInterface, Register } from 'claude-code'

import type { RookCluster, RookConfirm, RookReadiness, RookRunView, RookScenarioRow, RookSnapshot, RookStepId, RookTab } from '../types'
import type { El } from './views/kit'
import { TabBar } from './views/tabs'
import { ConfirmBar } from './views/confirm'
import { SetupTab } from './views/setup'
// ── imports: progress
import { JobLanes } from './views/job'
import { featureEntries, jobFromDisk, jobFromLine, jobSpinnerText, lineSplitter, newJob, scenarioEntries, scenarioKeys } from './progress'
import type { DiskEntry } from './progress'
import type { RookJob } from '../types'
import type { Timer } from 'claude-code'
// ── end imports: progress

// ── imports: health
import { estimateOf, gapGroups, notesOf, plural, unverifiedPrompt, untilAborted } from './health'
import type { GapCause } from './health'
// ── end imports: health

// ── imports: runs tab
import { RunsTab } from './views/runs'
import { comparePair, compareText, diffRuns, historyOf, historySignature, ordered } from './history'
import type { RunDiff } from './history'
// ── end imports: runs tab

// ── imports: scenarios tab
import { ScenariosTab } from './views/scenarios'
import type { ScenarioDetail } from './views/scenarios'
import { FLAKY_DEFAULT, filterScenarios, flakyText, isFilter, parseFlakyArgs, readScenarios, regressionPrompt, toggled, withAll, withVerdicts } from './scenarios'
import type { ScenarioInfo } from './scenarios'
import { failureNote as scenarioFailureNote } from './format'
import { rowOf } from './workspace'
import type { RookStatus } from '../types'
// ── end imports: scenarios tab

// ── imports: setup tab
import { budgetRefusal, budgetText, CONNECTION_FILES, GENERATE_ESTIMATE, parseBudget, profileView, spentOf, syncArgs, syncStateOf, syncStateText, syncText, verifiedProfiles, wizardOf } from './setup'
import type { SyncState } from './setup'
import type { SetupPanel } from './views/setup'
// ── end imports: setup tab

// ── imports: band
import { changedSources, sourceStamps } from './sources'
import { mergeReach, reach } from './impact'
import type { Reach } from './impact'
import { tickedOf } from './format'
import { RetestBand } from './views/band'
// ── end imports: band

// ── imports: status line
import { elapsed as liveTime } from './format'
import { composeStatus, recentRuns } from './statusline'
import type { TrendPoint } from './statusline'
// ── end imports: status line

// ── imports: card
import type { RenderElement, RenderInput } from 'claude-code'
import { CARD_RUN_TOOL, CARD_TOOL, cardFacts, cardProgress, runIdOf } from './card'
import { RunProgressRow, VerdictCard } from './views/card'
// ── end imports: card

// ── imports: ci
import { parseCiArgs, previewText, WORKFLOW_PATH, workflowYaml, writtenText } from './ci'
import type { CiPlan, CiRequest } from './ci'
// ── end imports: ci

// ── imports: shared lens and drill-down
import { readEvidence, verdictHistory } from './evidence'
import type { RookLens } from '../types'
// ── end imports: shared lens and drill-down

// ── imports: drill-down
import { ScenarioDrillDown } from './views/detail'
import { detailModel } from './detail'
import type { DetailActionId, DetailModel } from './detail'
import { bugReportPrompt, fixAgentPrompt, fixProfilePrompt, fixScenarioPrompt } from './prompts'
import type { PromptAbout } from './prompts'
import type { RookEvidence } from '../types'
import type { ScenarioInfo as DrillScenarioInfo } from './scenarios'
// ── end imports: drill-down

// ── imports: home
import { ChangeView, ReleaseView } from './views/home'
import { blockersReportPrompt, costOf, coverageOf, fixChangePrompt, gapsInstruction, isGreenRun, isStaleVerdict, lastGreenOf, notYoursLine, ownedOf, readFeatures, regressionsOf, releaseOf } from './home'
import type { ChangedFile, HomeFeature, HomeInput, HomeRow } from './home'
import { changedSince, runStartMs, verdictsBefore } from './changes'
import { historyRuns } from './evidence'
// ── end imports: home

// ── imports: trends
import { TrendsTab } from './views/trends'
import { heatGrid, heatMessageOf, previousRunId, TAB_KEYS, trendRuns, versusPrevious } from './trends'
import type { TrendRun } from './trends'
// ── end imports: trends

// ── imports: live
import { freshnessText, isInFlight, isOwnRun, justJudged, liveHeadline, nextLive, runBandText } from './live'
import type { LiveState } from './live'
import { etaMs } from './statusline'
import { LiveBlock, NewFailBand, RunBand } from './views/live'
// ── end imports: live

// ── imports: keys
import { listingKey, nextStep, scanRepo, START_PROMPTS, startSteps } from './repo'
import type { StartAction, StartFacts } from './repo'
import { FreshStart, KeysHint, NextStep } from './views/fresh'
import { LENS_LABEL } from './views/tabs'
import type { SettingRow } from './views/setup'
import type { RookRepoFound } from '../types'
// ── end imports: keys
import {
  agentsText,
  balanceText,
  balanceWarning,
  clip,
  clusterNote,
  curateText,
  creditsPerScenario,
  duration,
  excerpt,
  exploreText,
  failureContext,
  failureNote,
  gapText,
  generateText,
  isExplained,
  isReporting,
  metricsLine,
  orderedClusters,
  profilesText,
  profileTestText,
  progressBar,
  projectsText,
  rcaLine,
  reasonText,
  REPORTING,
  retestPrompt,
  runSummary,
  runsText,
  scenariosText,
  spinnerText,
  statusText,
  unlooked,
} from './format'
import { assess, declaredVariables, isRunCommand } from './guard'
import { indexAgent, relativeTo } from './impact'
import { authOf, blockedText, blockerOf, checklistText, diskFacts, learned, NEEDS, readinessOf, setupLine, versionOf } from './readiness'
import type { CliFacts } from './readiness'
import type { AgentIndex } from './impact'
import {
  agentUseArgs,
  allowRulesOf,
  balanceOf,
  CLI_ENV,
  curateArgs,
  exploreArgs,
  failureOf,
  generateArgs,
  jsonOf,
  parseAgentList,
  parseExploreFlags,
  parseGenerateFlags,
  parseRunFlags,
  profileArgs,
  projectArgs,
  rcaOutcome,
  reportRcaArgs,
  runArgs,
} from './rook'
import type { Approval, CliResult, ExploreRequest, GenerateRequest, ProfileRequest, ProjectRequest, RunRequest } from './rook'
import { agentIdsOf, changesIn, countsOf, currentVerdicts, locate, projectDirName, readRun, ROOT, RUN_ID, runIds, runsElsewhere, runSummaries, scenarioSignature } from './workspace'
import type { Io, Located, RowCache } from './workspace'

/**
 * rook inside Claude Code.
 *
 *  1. Tools the model calls — `run`, `report`, `status`, `scenarios`,
 *     `generate` — so Claude can test the agent it is building, read rook's
 *     evidence and root-cause clusters back, and write scenarios for it;
 *     `project`, `explore`, `profile_test` so a repository with no rook
 *     setup gets one without leaving Claude Code.
 *  2. A live pane: every scenario's latest verdict, the run in flight lane by
 *     lane, clusters with rook's remedies, failures you can open, and what
 *     nobody looked at. The turn's spinner carries the run's progress too.
 *  3. A band above the prompt when Claude edits a file the agent is built
 *     from: which scenarios touch it, and a button to re-test them.
 *  4. Failures of a run started elsewhere handed to Claude as context.
 *  5. A status line score over every scenario's latest verdict, with what the
 *     latest run fixed or regressed.
 *  6. `/rook` — pane, status, report, explain, run, scenarios, agent,
 *     generate, project, explore, profile, ui, confirm-prod.
 *  7. A guard that refuses runs against a production-looking target until
 *     the person confirms.
 *  8. Depth: `report --rca` on a finished run, agent switching, scenario
 *     curation (`agent`, `curate` tools), and the credit balance.
 *  9. A setup checklist (installed, signed in, project, agent, scenarios,
 *     profile) wherever rook would refuse, with the one next step.
 *
 * Everything rook-side goes through the published CLI contract (`--json`
 * documents) and the documented `.testmuai/rook/` layout. The mod holds no
 * prompts and no keys: rook's controller supplies those.
 */

const PANE = 'rook'
const POLL_MS = 3_000
const CONFIRM_MS = 15 * 60_000
const VIEWER_START_MS = 15_000

const snapshotAtom = atom({ plugin: 'rook', key: 'snapshot' } as const, null)
const staleAtom = atom({ plugin: 'rook', key: 'stale' } as const, null)
const runningAtom = atom({ plugin: 'rook', key: 'running' } as const, null)
const confirmedAtom = atom({ plugin: 'rook', key: 'prodConfirmed' } as const, null)
const seenAtom = atom({ plugin: 'rook', key: 'seenFinished' } as const, null)
const bandHiddenAtom = atom({ plugin: 'rook', key: 'isBandHidden' } as const, false)
const expandedAtom = atom({ plugin: 'rook', key: 'expanded' } as const, null)
const viewerAtom = atom({ plugin: 'rook', key: 'viewerUrl' } as const, null)
const tickAtom = atom({ plugin: 'rook', key: 'tick' } as const, 0)
const lastErrorAtom = atom({ plugin: 'rook', key: 'lastError' } as const, null)
const agentsAtom = atom({ plugin: 'rook', key: 'agents' } as const, [])
const balanceAtom = atom({ plugin: 'rook', key: 'balance' } as const, null)
const explainingAtom = atom({ plugin: 'rook', key: 'explaining' } as const, null)
const tabAtom = atom({ plugin: 'rook', key: 'tab' } as const, 'health')
const confirmAtom = atom({ plugin: 'rook', key: 'confirm' } as const, null)

// ── atoms: progress
const jobAtom = atom({ plugin: 'rook', key: 'job' } as const, null)
// ── end atoms: progress

// ── atoms: health
// ── end atoms: health

// ── atoms: runs tab
const historyAtom = atom({ plugin: 'rook', key: 'history' } as const, null)
const compareAtom = atom({ plugin: 'rook', key: 'compare' } as const, [])
const runOpenAtom = atom({ plugin: 'rook', key: 'runOpen' } as const, null)
const runDiffAtom = atom({ plugin: 'rook', key: 'runDiff' } as const, null)
// ── end atoms: runs tab

// ── atoms: scenarios tab
const selectedAtom = atom({ plugin: 'rook', key: 'selected' } as const, [])
const filterAtom = atom({ plugin: 'rook', key: 'filter' } as const, 'all')
const draftAtom = atom({ plugin: 'rook', key: 'draft' } as const, '')
const flakyAtom = atom({ plugin: 'rook', key: 'flaky' } as const, {})
const flakyPriorAtom = atom({ plugin: 'rook', key: 'flakyPrior' } as const, {})
const scenarioDetailAtom = atom({ plugin: 'rook', key: 'scenarioDetail' } as const, null)
// ── end atoms: scenarios tab

// ── atoms: setup tab
const budgetAtom = atom({ plugin: 'rook', key: 'budget' } as const, null)
const syncAtom = atom({ plugin: 'rook', key: 'sync' } as const, null)
// ── end atoms: setup tab

// ── atoms: band
const untickedAtom = atom({ plugin: 'rook', key: 'unticked' } as const, [])
const bandOpenAtom = atom({ plugin: 'rook', key: 'isBandOpen' } as const, false)
// ── end atoms: band

// ── atoms: status line
// ── end atoms: status line

// ── atoms: card
// ── end atoms: card

// ── atoms: ci
// ── end atoms: ci

// ── atoms: shared lens and drill-down
const lensAtom = atom({ plugin: 'rook', key: 'lens' } as const, 'qe')
const detailAtom = atom({ plugin: 'rook', key: 'detail' } as const, null)
const evidenceAtom = atom({ plugin: 'rook', key: 'evidence' } as const, null)
const verdictsAtom = atom({ plugin: 'rook', key: 'verdicts' } as const, [])
// ── end atoms: shared lens and drill-down

// ── atoms: drill-down
// ── end atoms: drill-down

// ── atoms: home
// ── end atoms: home

// ── atoms: trends
const runVersusAtom = atom({ plugin: 'rook', key: 'runVersus' } as const, null)
// ── end atoms: trends

// ── atoms: live
const liveAtom = atom({ plugin: 'rook', key: 'live' } as const, null)
// ── end atoms: live

// ── atoms: keys
// ── end atoms: keys

// The plugin's own tools as exact patterns: the engine's tool table is laid
// when the mod loads, before session.start registers them.
const RUN_TOOL = /^mcp__rook__run$/
const REPORT_TOOL = /^mcp__rook__report$/
const STATUS_TOOL = /^mcp__rook__status$/
const SCENARIOS_TOOL = /^mcp__rook__scenarios$/
const RUNS_TOOL = /^mcp__rook__runs$/
const GENERATE_TOOL = /^mcp__rook__generate$/
const PROJECT_TOOL = /^mcp__rook__project$/
const EXPLORE_TOOL = /^mcp__rook__explore$/
const PROFILE_TOOL = /^mcp__rook__profile_test$/
const AGENT_TOOL = /^mcp__rook__agent$/
const CURATE_TOOL = /^mcp__rook__curate$/
// ── tool patterns: runs tab
const COMPARE_TOOL = /^mcp__rook__compare$/
// ── end tool patterns: runs tab
// ── tool patterns: setup tab
const SYNC_TOOL = /^mcp__rook__sync$/
// ── end tool patterns: setup tab
// ── tool patterns: ci
const CI_TOOL = /^mcp__rook__ci$/
// ── end tool patterns: ci
/** Every tool that writes a file; MultiEdit exists on some builds only. */
const EDIT_TOOLS = /^(Edit|Write|MultiEdit|NotebookEdit)$/

const USAGE = [
  '/rook                 open the live verdict pane',
  '/rook tab health|runs|scenarios|setup   open the pane on a tab',
  '/rook status          agents, scenarios and sync state',
  '/rook scenarios       every scenario with its latest verdict',
  '/rook runs [N]        the agent\'s runs on disk, newest first (default 20)',
  '/rook scenarios exclude|include SC-001 [SC-002 …]   leave scenarios out of runs, or bring them back',
  '/rook agent [list|use <id>]   the project\'s agents; switch the active one',
  '/rook report [run]    the latest (or named) run: clusters, verdicts, gaps, credits',
  "/rook explain [run]   hand the run's failures (and rook's remedies) to Claude as fix context",
  '/rook report|explain [run] --rca   have rook explain the clusters first, without calling the agent',
  '          (free if this agent version was explained already, otherwise it costs credits)',
  '/rook run [--only SC-001,SC-002] [--class …] [--category …] [--tag …] [--profile …] [--name …]',
  '          [--concurrency 1-8] [--resume <run>] [--run <run> --phases collect,judge] [--test] [--rca] [-- <instruction>]',
  '/rook generate [--total N] [--class …] [--category …] [--force] [-- <what to cover>]',
  '/rook project [list|use <id>|create <name>]  the rook project this workspace records to',
  "/rook explore [--force] [-- <instruction>]   read this repository: find the agents, write their features",
  '/rook profile [list|use <id>|test [id] [-- <goal>]]  how rook reaches the agent (add one: ! rook profile add …)',
  '/rook compare [base] [head]  what changed between two runs, per scenario (default: the two newest finished runs)',
  '/rook flaky SC-001 [N]   re-run one scenario N times in a row (default 3, 2-10) and say whether the verdicts disagree',
  '          (spends credits each run)',
  '/rook sync            record this project upstream (rook sync): every agent, one write. No credits; needs a plan with Rook cloud',
  '/rook budget [<credits>|off|status]   cap what runs and generates may spend this session',
  '/rook ci [write] [--force] [--strict]   preview (or write) .github/workflows/rook.yml: rook as a pull-request check',
  '/rook ui              open the on-disk results viewer (rook ui --local)',
  '/rook confirm-prod [profile]  allow runs against a production-looking target for 15 minutes',
  '',
  "Runs, generate, explore and profile test approve rook's own tool calls with --yes, unless allowRules is set in /config.",
].join('\n')

/** The options and the caches of one load of the module; what a drawing reads lives in $.state. */
type Ctx = {
  bin: string
  paneMode: string
  isStatusLine: boolean
  isRetestBand: boolean
  isFailureContext: boolean
  isProdGuard: boolean
  prodPatterns: string
  approval: Approval
  cwd: string
  located: Located | undefined
  agentIndex: AgentIndex | undefined
  isPolling: boolean
  isPrimed: boolean
  /** Set when something changed that the settled check cannot see (new scenarios). */
  isDirty: boolean
  /** The scenario and feature files as last indexed, to notice changes made elsewhere. */
  indexSignature: string | undefined
  /** The `rook ui --local` child, while it serves. */
  viewer: AbortController | undefined
  rows: RowCache
  /** Installed and signed in, as the CLI last said: probed at start and when they block, not every poll. */
  cli: CliFacts
  /** The agent's runs list as the Runs tab last read it, to skip re-reading when nothing changed. */
  historySignature?: string
  /** Runs the person cancelled (`<agent dir>#<run id>`, kept in `$.store`): shown as stopped, though rook left them unfinished. */
  cancelled?: Set<string>
  /** Modification times of the agent's tracked sources at the last poll, keyed by agent directory. */
  sourceStamps?: { agentDir: string; stamps: Map<string, number> }
  /** The status line's recent finished runs, re-read only when the runs on disk change. */
  statusTrend?: { key: string; points: TrendPoint[] }
  /** Ends the background run the person started (pane, /rook run), for its Cancel. */
  runAbort?: AbortController
  /** The agent's scenario files as last read for the Scenarios tab, keyed by agent directory and index signature. */
  scenarioList?: { key: string; list: ScenarioInfo[] }
  /** The `lens` option: who the pane leads for until the person toggles it (the toggle is kept in $.store). */
  lensDefault: RookLens
  /** The runs the verdict history was last read from, to skip re-reading when nothing changed. */
  verdictSignature?: string
  /** When this session started: the change's baseline when no run was green. */
  sessionStartedAt?: number
  /** Minutes since the snapshot last changed, as the pane header last drew them. */
  freshMinute?: number
  /** Verdict statuses by file path, for the history: a verdict is written once. */
  verdictCache?: Map<string, RookStatus>
  /** feature: keys — the fresh-repo scan and the settings /config would not keep. */
  keys?: KeysCache
}

/** Claude Code labels a plugin's toast with its name: drop rook's own prefix so it reads once. */
function toastText(text: string): string {
  return text.replace(/^rook:\s*/, '')
}

function textOption(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback
}

function flagOption(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

/** Paths rooted at the session's directory: a relative path would follow the process's, which need not be it. */
function ioOf($: EngineInterface, ctx: Ctx): Io {
  const at = (path: string) => (path.startsWith('/') || ctx.cwd === '' ? path : `${ctx.cwd.replace(/\/$/, '')}/${path}`)

  return {
    read: path =>
      $.fs.read(at(path)).then(
        text => (typeof text === 'string' ? text : undefined),
        () => undefined,
      ),
    list: path => $.fs.list(at(path)).catch(() => []),
  }
}

// ── the rook CLI ─────────────────────────────────────────────────────────────

/** A short rook command (status): bounded wait, whole output. */
async function rookJson($: EngineInterface, ctx: Ctx, args: string[]): Promise<CliResult> {
  try {
    const ran = await $.process.run([ctx.bin, ...args], { env: CLI_ENV, stdin: '', timeoutMs: 60_000, ...(ctx.cwd !== '' && { cwd: ctx.cwd }) })

    return { exitCode: ran.exitCode, doc: jsonOf(ran.stdout), stderr: ran.stderr, stdout: ran.stdout }
  } catch (error) {
    return { exitCode: 1, doc: undefined, stderr: `could not run ${ctx.bin}: ${String(error)}` }
  }
}

/**
 * A run can outlast `process.run`'s ten-minute ceiling, so it is streamed: the
 * child lives as long as the loop reading it, and `signal` ends both.
 */
async function rookRun(
  $: EngineInterface,
  ctx: Ctx,
  argv: string[],
  signal?: AbortSignal,
  env: Record<string, string> = {},
  onLine?: (line: string) => void,
): Promise<CliResult> {
  const stream = $.process.spawn({ argv: [ctx.bin, ...argv], env: { ...CLI_ENV, ...env }, input: '', ...(ctx.cwd !== '' && { cwd: ctx.cwd }) })
  const iterator = stream[Symbol.asyncIterator]()
  let stdout = ''
  let stderr = ''
  // Whole lines as they arrive, each stream split on its own: progress for a caller that draws it.
  const lines = onLine === undefined ? undefined : { stdout: lineSplitter(onLine), stderr: lineSplitter(onLine) }

  for (;;) {
    if (signal?.aborted) {
      await iterator.return?.(undefined as never)

      return { exitCode: 130, doc: undefined, stderr: `${stderr}\ninterrupted` }
    }

    const step = await untilAborted(iterator.next(), signal)

    if (step === undefined) {
      void iterator.return?.(undefined as never)?.catch(() => undefined)

      return { exitCode: 130, doc: undefined, stderr: `${stderr}\ninterrupted` }
    }

    if (step.done) {
      const ended = step.value as { code: number | null } | undefined
      lines?.stdout.flush()
      lines?.stderr.flush()

      return { exitCode: ended?.code ?? 1, doc: jsonOf(stdout), stderr, stdout }
    }

    lines?.[step.value.stream === 'stdout' ? 'stdout' : 'stderr'].push(step.value.text)

    if (step.value.stream === 'stdout') {
      stdout += step.value.text
    } else {
      stderr = (stderr + step.value.text).slice(-20_000)
    }
  }
}

// ── reading the workspace ────────────────────────────────────────────────────

async function where($: EngineInterface, ctx: Ctx): Promise<Located | undefined> {
  ctx.located = await locate(ioOf($, ctx))

  return ctx.located
}

// 5 · the status line
async function showStatus($: EngineInterface, ctx: Ctx): Promise<void> {
  // Every poll ends here: the run in flight and the one that landed are folded in first, line or not.
  const live = await liveTrack($, ctx)

  if (!ctx.isStatusLine) {
    return
  }

  const snapshot = await read($, snapshotAtom)

  // A workspace that cannot run yet says which step is missing; outside one, nothing.
  const line = composeStatus({
    lens: await read($, lensAtom),
    live,
    verdicts: await read($, verdictsAtom),
    rowAt: rowAtOf(ctx),
    ...(sourceStampsNow(ctx) !== undefined && { stamps: sourceStampsNow(ctx)! }),
    snapshot,
    running: await read($, runningAtom),
    stale: await read($, staleAtom),
    balance: await read($, balanceAtom),
    budget: await read($, budgetAtom),
    job: await read($, jobAtom),
    trend: await statusTrend($, ctx, snapshot),
    setup: setupLine(snapshot?.readiness),
    now: await $.clock.now(),
  })

  $.ui.status(line)
}

// ── readiness ────────────────────────────────────────────────────────────────

/** Ask the CLI what only it knows: installed, signed in. Two short calls, never on the poll. */
async function probe($: EngineInterface, ctx: Ctx): Promise<void> {
  const run = (args: string[]) =>
    $.process.run([ctx.bin, ...args], { env: CLI_ENV, stdin: '', timeoutMs: 20_000, ...(ctx.cwd !== '' && { cwd: ctx.cwd }) }).catch(() => undefined)
  const version = await run(['--version'])
  const installed = version === undefined ? null : versionOf(version.exitCode, version.stdout)

  if (installed === null) {
    ctx.cli = { ...ctx.cli, version: null }

    return
  }

  const auth = await run(['auth', 'status'])

  ctx.cli = { ...ctx.cli, version: installed, auth: auth === undefined ? 'unknown' : authOf(auth.exitCode, `${auth.stdout}\n${auth.stderr}`) }
}

async function readinessNow($: EngineInterface, ctx: Ctx): Promise<RookReadiness | undefined> {
  await poll($, ctx)

  return (await read($, snapshotAtom))?.readiness
}

/**
 * Why an action cannot be taken yet, in the checklist's words, or undefined.
 * A step the CLI decides is probed again before refusing: the person may have
 * run `! rook login` since.
 */
async function setupBlock($: EngineInterface, ctx: Ctx, need: readonly RookStepId[], doing: string): Promise<string | undefined> {
  let readiness = await readinessNow($, ctx)
  const step = blockerOf(readiness, need)

  if (step?.id === 'installed' || step?.id === 'signed_in') {
    await probe($, ctx)
    readiness = await readinessNow($, ctx)
  }

  return blockedText(readiness, need, doing)
}

/** A failed rook command that names a setup step (a remedy code, a missing binary) updates the checklist. */
async function learn($: EngineInterface, ctx: Ctx, result: CliResult): Promise<RookReadiness | undefined> {
  const next = learned(ctx.cli, await diskFacts(ioOf($, ctx)), result)

  if (next === undefined) {
    return undefined
  }

  ctx.cli = next

  return readinessNow($, ctx)
}

/** A failure with the setup step it revealed, when it revealed one. */
async function explained($: EngineInterface, ctx: Ctx, result: CliResult, problem: string, need: readonly RookStepId[], doing: string): Promise<string> {
  const blocked = blockedText(await learn($, ctx, result), need, doing)

  return blocked === undefined ? problem : `${problem}\n${blocked}`
}

/** "Check again" in the pane's checklist. */
async function recheck($: EngineInterface, ctx: Ctx): Promise<void> {
  ctx.cli = { ...ctx.cli, projectRefused: undefined }
  await probe($, ctx)
  await poll($, ctx)
}

async function poll($: EngineInterface, ctx: Ctx): Promise<void> {
  if (ctx.isPolling) {
    return
  }

  ctx.isPolling = true

  try {
    const io = ioOf($, ctx)
    const readiness = readinessOf(await diskFacts(io), ctx.cli)
    const loc = await where($, ctx)
    const before = await read($, snapshotAtom)

    if (loc === undefined) {
      // No agent to read: the snapshot carries only the checklist, and what the repository holds that rook could start from.
      const repoFound = await repoFoundNow($, ctx)
      const bare: RookSnapshot = { current: [], neverRun: 0, checkedAt: await $.clock.now(), readiness, repoFound }

      if (JSON.stringify({ ...before, checkedAt: 0 }) !== JSON.stringify({ ...bare, checkedAt: 0 })) {
        await update($, snapshotAtom, () => bare)
      }

      return
    }

    await syncAgents($, ctx, loc)
    await watchSources($, ctx, loc)

    // Scenarios or features changed outside this session (rook generate in a
    // terminal, an exclude): re-read the index and redraw.
    const signature = `${loc.agentDir}#${await scenarioSignature(io, loc.agentDir)}`

    if (ctx.indexSignature !== signature) {
      if (ctx.indexSignature !== undefined) {
        ctx.agentIndex = undefined
        ctx.isDirty = true
      }

      ctx.indexSignature = signature
    }

    const ids = await runIds(io, loc.agentDir)
    const latestId = ids[0]
    const isSettled =
      !ctx.isDirty && before?.agentId === loc.agentId && before.latest?.runId === latestId && before.latest?.finished === true

    // `! rook env set` changes no workspace file: read the names each poll so the pane and the line follow it.
    const unsetVariables = await unsetOfActive($, ctx, loc)

    if (isSettled) {
      if (JSON.stringify(before.readiness) !== JSON.stringify(readiness) || JSON.stringify(before.unsetVariables ?? []) !== JSON.stringify(unsetVariables)) {
        await update($, snapshotAtom, snapshot => (snapshot === null ? null : { ...snapshot, readiness, unsetVariables }))
      }

      return
    }

    ctx.isDirty = false

    const read0 = latestId === undefined ? undefined : await readRun(io, loc.agentDir, latestId, ctx.rows)
    const latest = read0 === undefined ? undefined : await liveOrStopped($, ctx, loc, read0)
    const index = ctx.agentIndex ?? (await indexAgent(io, loc.agentDir))
    ctx.agentIndex = index
    const current = await currentVerdicts(io, loc.agentDir, ids, ctx.rows, new Set(index.scenarios.map(scenario => scenario.id)))
    const judged = new Set(current.map(row => row.id))
    const profileId = (await io.read(`${loc.agentDir}/profiles/active`))?.trim()
    const snapshot: RookSnapshot = {
      agentId: loc.agentId,
      ...(profileId !== undefined && profileId !== '' && { profileId }),
      ...(latest !== undefined && { latest }),
      current,
      neverRun: index.scenarios.filter(scenario => !judged.has(scenario.id)).length,
      runCount: ids.length,
      // Only looked for when this project has no runs: it explains an empty pane.
      ...(ids.length === 0 && { elsewhere: await runsElsewhere(io, loc.projectDir) }),
      checkedAt: await $.clock.now(),
      readiness,
      unsetVariables,
    }

    if (JSON.stringify({ ...before, checkedAt: 0 }) !== JSON.stringify({ ...snapshot, checkedAt: 0 })) {
      await update($, snapshotAtom, () => snapshot)
    }

    // Elapsed times in the lanes and the spinner move while anything is in flight.
    if (latest !== undefined && !latest.finished) {
      await update($, tickAtom, () => snapshot.checkedAt)
    }

    if (latest?.finished && latest.stopped !== true) {
      // An agent seen for the first time (a workspace that appeared, `rook agent
      // use`) brings its history with it: its latest run is not news.
      await finished($, ctx, loc, latest, before?.agentId !== loc.agentId)
    }
  } finally {
    await refreshHistory($, ctx)
    await refreshVerdicts($, ctx)
    await redrawEachMinute($, ctx)
    ctx.isPolling = false
    await showStatus($, ctx)
  }
}

// 4 · failures of a run started elsewhere
/** A run reached report.yaml. Report it once, and never one from before this session. */
async function finished($: EngineInterface, ctx: Ctx, loc: Located, run: RookRunView, isNewAgent: boolean): Promise<void> {
  if ((await read($, seenAtom)) === run.runId) {
    return
  }

  await update($, seenAtom, () => run.runId)

  if (!ctx.isPrimed || isNewAgent) {
    return
  }

  if ((await read($, staleAtom)) !== null) {
    await update($, staleAtom, () => null)
  }

  if ((await read($, runningAtom))?.source === 'tool') {
    return // the tool's own result carries the verdicts
  }

  const { pass, fail, unverifiable } = run.counts
  $.ui.toast(toastText(`rook: run ${run.runId} finished — ${pass} Pass · ${fail} Fail · ${unverifiable} Unable to Verify`))

  if (ctx.isFailureContext && fail > 0) {
    const text = `<rook-run-result>\n${failureContext(run, loc.agentDir, loc.agentId)}\n</rook-run-result>`

    await $.session.append({ message: { type: 'user', content: [{ type: 'text', text }] } }).catch(() => undefined)
  }
}

// ── 7 · production guard ─────────────────────────────────────────────────────

/** The active profile's declared variables that rook's env store has no value for here: names only. */
/** The header's "updated Nm ago" moves once a minute even when nothing else changes. */
async function redrawEachMinute($: EngineInterface, ctx: Ctx): Promise<void> {
  const checkedAt = (await read($, snapshotAtom))?.checkedAt

  if (checkedAt === undefined) {
    return
  }

  const minute = Math.floor(Math.max(0, (await $.clock.now()) - checkedAt) / 60_000)

  if (minute !== ctx.freshMinute) {
    ctx.freshMinute = minute
    await update($, tickAtom, () => checkedAt + minute)
  }
}

async function unsetOfActive($: EngineInterface, ctx: Ctx, loc: Located): Promise<string[]> {
  const io = ioOf($, ctx)
  const active = (await io.read(`${loc.agentDir}/profiles/active`))?.trim()

  if (active === undefined || active === '' || !/^[\w.][\w.-]{0,63}$/.test(active)) {
    return []
  }

  const declared = declaredVariables((await io.read(`${loc.agentDir}/profiles/${active}.yaml`)) ?? '')
  const set = await variableValues($, ctx, declared)

  return declared.filter(name => set[name] === undefined)
}

async function variableValues($: EngineInterface, ctx: Ctx, names: readonly string[]): Promise<Record<string, string>> {
  const values: Record<string, string> = {}

  if (names.length === 0) {
    return values
  }

  const home = (await $.env.get('ROOK_HOME')) ?? `${(await $.env.get('HOME')) ?? ''}/.testmuai/rook`
  let stored: Record<string, unknown> = {}

  try {
    const envFile = JSON.parse((await ioOf($, ctx).read(`${home}/env.json`)) ?? '{}') as { projects?: Record<string, Record<string, unknown>> }
    stored = envFile.projects?.[ctx.cwd] ?? {}
  } catch {
    stored = {}
  }

  // `rook env set` keeps the values here, keyed by the directory rook ran in.
  // rook takes its workspace from the working directory with no upward
  // search, so that is this session's directory too. The shell's own environment is not
  // read, since a module may only read variables it names literally.
  for (const name of names) {
    const value = stored[name]

    if (typeof value === 'string') {
      values[name] = value
    }
  }

  return values
}

/** Why a run must not start now, or undefined when it may. */
/** The profile a run would use: the one named, or the agent's active one. */
async function profileOf($: EngineInterface, ctx: Ctx, profileRef?: string): Promise<{ loc: Located; profileId: string } | undefined> {
  const loc = ctx.located ?? (await where($, ctx))

  if (loc === undefined) {
    return undefined
  }

  const profileId = profileRef ?? (await ioOf($, ctx).read(`${loc.agentDir}/profiles/active`))?.trim()

  return profileId === undefined || !/^[\w.][\w.-]{0,63}$/.test(profileId) ? undefined : { loc, profileId }
}

async function prodBlock($: EngineInterface, ctx: Ctx, profileRef?: string): Promise<string | undefined> {
  if (!ctx.isProdGuard) {
    return undefined
  }

  const target = await profileOf($, ctx, profileRef)

  if (target === undefined) {
    return undefined
  }

  const { loc, profileId } = target
  const confirmed = await read($, confirmedAtom)

  // A confirmation covers the directory and profile it was given for, nothing else.
  if (confirmed !== null && confirmed.cwd === ctx.cwd && confirmed.profile === profileId && confirmed.until > (await $.clock.now())) {
    return undefined
  }

  const io = ioOf($, ctx)

  const profileText = await io.read(`${loc.agentDir}/profiles/${profileId}.yaml`)

  if (profileText === undefined) {
    return undefined
  }

  const verdict = assess(profileText, await variableValues($, ctx, declaredVariables(profileText)), ctx.prodPatterns)

  return verdict.isRisky
    ? `rook: profile "${profileId}" looks like it targets production (${verdict.reasons.join('; ')}). ` +
        "The agent's writes are real and rook cannot roll them back. Point the profile at staging, " +
        `or ask the person to type /rook confirm-prod ${profileId} to allow runs with it for 15 minutes.`
    : undefined
}

// ── running ──────────────────────────────────────────────────────────────────

async function backgroundRun($: EngineInterface, ctx: Ctx, argv: string[], signal?: AbortSignal): Promise<void> {
  try {
    const result = await rookRun($, ctx, argv, signal)
    const problem = failureOf(result)

    if (signal?.aborted) {
      $.ui.toast(toastText('rook: run cancelled'))
    } else if (problem !== undefined) {
      // A toast vanishes; the pane keeps the failure until the next run starts.
      const text = await explained($, ctx, result, `run failed: ${problem}`, NEEDS.run, 'run')

      const at = await $.clock.now()

      await update($, lastErrorAtom, () => ({ source: 'run', text, at }))
      $.ui.toast(toastText(`rook: ${clip(text, 200)}`))
    }
  } catch (error) {
    const text = `could not start ${ctx.bin} — ${clip(String(error), 120)}`

    const at = await $.clock.now()

    await update($, lastErrorAtom, () => ({ source: 'run', text, at }))
    $.ui.toast(toastText(`rook: ${text}`))
  } finally {
    if (signal !== undefined && ctx.runAbort?.signal === signal) {
      ctx.runAbort = undefined
    }

    await update($, runningAtom, () => null)
    await poll($, ctx)
    await refreshBalance($, ctx)
  }
}

/** A run the person started (pane button, /rook run): in the background, reported when it lands. */
async function startRun($: EngineInterface, ctx: Ctx, request: RunRequest, source: 'command' | 'pane'): Promise<string> {
  if ((await read($, runningAtom)) !== null) {
    return 'rook: a run is already in progress.'
  }

  const args = runArgs(request, ctx.approval)

  if ('error' in args) {
    return `rook: ${args.error}`
  }

  const unready = await setupBlock($, ctx, NEEDS.run, 'run')

  if (unready !== undefined) {
    return `rook: ${unready}`
  }

  const blocked = (await prodBlock($, ctx, request.profile)) ?? (await budgetBlock($, ctx, 'run', request.only?.length))

  if (blocked !== undefined) {
    return blocked
  }

  const label = request.only ? request.only.join(', ') : 'all runnable scenarios'

  const startedAt = await $.clock.now()

  await update($, runningAtom, () => ({ startedAt, label, source }))
  await update($, lastErrorAtom, () => null)
  await showStatus($, ctx)
  const abort = new AbortController()

  ctx.runAbort = abort
  $.clock.after(0, () => backgroundRun($, ctx, args.argv, abort.signal))

  return `rook: running ${label} in the background. Progress shows in the pane and the status line.`
}

// 1 · the model's run: inline, so the verdicts come back as the tool's result
async function toolRun($: EngineInterface, ctx: Ctx, request: RunRequest, signal: AbortSignal): Promise<{ result: string } | { deny: string }> {
  if ((await read($, runningAtom)) !== null) {
    return { deny: 'rook: a run is already in progress; wait for it, then read it with the rook report tool.' }
  }

  const args = runArgs(request, ctx.approval)

  if ('error' in args) {
    return { deny: `rook: ${args.error}` }
  }

  const unready = await setupBlock($, ctx, NEEDS.run, 'run')

  if (unready !== undefined) {
    return { deny: `rook ${unready}` }
  }

  const blocked = (await prodBlock($, ctx, request.profile)) ?? (await budgetBlock($, ctx, 'run', request.only?.length))

  if (blocked !== undefined) {
    return { deny: blocked }
  }

  const startedAt = await $.clock.now()

  await update($, runningAtom, () => ({ startedAt, label: request.only?.join(', ') ?? 'all', source: 'tool' }))
  await update($, lastErrorAtom, () => null)
  await showStatus($, ctx)

  // Claude asked, not the person: the pane seats only where there is room for
  // an unasked one. The spinner carries the progress everywhere else.
  if (ctx.paneMode !== 'off') {
    void openPane($).catch(() => undefined)
  }

  try {
    const result = await rookRun($, ctx, args.argv, signal)
    const problem = failureOf(result)
    const doc = result.doc as { run_id?: string; halted?: boolean; credits?: number } | undefined
    const runId = doc?.run_id

    if (problem !== undefined && runId === undefined) {
      return { result: await explained($, ctx, result, `rook run did not complete: ${problem}`, NEEDS.run, 'run') }
    }

    const loc = ctx.located ?? (await where($, ctx))

    if (runId === undefined || loc === undefined || !RUN_ID.test(runId)) {
      return { result: `rook run finished, but returned no run id to read.${problem ? ` ${problem}` : ''}` }
    }

    await update($, seenAtom, () => runId)
    const run = await readRun(ioOf($, ctx), loc.agentDir, runId, ctx.rows)

    if (run === undefined) {
      return { result: `rook run ${runId} finished, but ${loc.agentDir}/runs/${runId}/ could not be read.` }
    }

    if ((await read($, staleAtom)) !== null) {
      await update($, staleAtom, () => null)
    }

    const halted = doc?.halted ? '\nThe run HALTED before finishing: treat it as incomplete, not as a full suite.' : ''
    const short = balanceWarning(await refreshBalance($, ctx), creditsPerScenario(run), run.counts.fail > 0 ? run.counts.fail : run.done)

    return { result: runSummary(run, loc.agentDir, loc.agentId, doc?.credits) + halted + (short === undefined ? '' : `\n${short}`) }
  } finally {
    await update($, runningAtom, () => null)
    await poll($, ctx)
  }
}

async function reportText($: EngineInterface, ctx: Ctx, runRef: string | undefined): Promise<{ text: string; context?: string }> {
  const loc = await where($, ctx)

  if (loc === undefined) {
    const readiness = await readinessNow($, ctx)

    return { text: readiness === undefined ? 'no rook agent in this directory.' : checklistText(readiness) }
  }

  if (runRef !== undefined && !RUN_ID.test(runRef)) {
    return { text: `rook: "${clip(runRef, 40)}" is not a run id (2026-09-28T15-54-56Z form).` }
  }

  const io = ioOf($, ctx)
  const ids = await runIds(io, loc.agentDir)
  const runId = runRef ?? ids[0]

  if (runId === undefined || !ids.includes(runId)) {
    return { text: runRef ? `rook: no run ${runRef} for agent ${loc.agentId}.` : `rook: agent ${loc.agentId} has no runs yet.` }
  }

  const run = await readRun(io, loc.agentDir, runId, ctx.rows)

  if (run === undefined) {
    return { text: `rook: run ${runId} has no run.yaml.` }
  }

  if (!run.finished) {
    return { text: `rook: run ${runId} is still running — ${run.done}/${run.planned} judged, ${run.counts.fail} failing so far.` }
  }

  const summary = runSummary(run, loc.agentDir, loc.agentId, run.credits)

  return { text: summary, ...(run.counts.fail > 0 && { context: failureContext(run, loc.agentDir, loc.agentId) }) }
}

async function statusReply($: EngineInterface, ctx: Ctx): Promise<string> {
  // `rook status` refuses without a project; the checklist is the better answer then.
  if ((await setupBlock($, ctx, NEEDS.status, 'read status')) !== undefined) {
    const readiness = await read($, snapshotAtom)

    return readiness?.readiness === undefined ? 'status is not available yet.' : checklistText(readiness.readiness)
  }

  const status = await rookJson($, ctx, ['status', '--json'])
  const problem = failureOf(status)

  if (status.doc === undefined || problem !== undefined) {
    const learnt = await learn($, ctx, status)

    return learnt === undefined ? `status failed: ${problem ?? 'no output'}` : checklistText(learnt)
  }

  return statusText(status.doc)
}

/** Every scenario with its latest verdict: rook's list, or the files on disk when rook cannot answer. */
/** The agent's runs, newest first, from run.yaml and report.yaml: no CLI call, no credits. */
async function runsReply($: EngineInterface, ctx: Ctx, limit: number): Promise<string> {
  const blocked = await setupBlock($, ctx, ['agent'], 'list runs')
  const loc = await where($, ctx)

  if (blocked !== undefined || loc === undefined) {
    return `rook: ${blocked ?? "can't list runs yet: no agent here."}`
  }

  const io = ioOf($, ctx)
  const ids = await runIds(io, loc.agentDir)

  return runsText(loc.agentId, await runSummaries(io, loc.agentDir, ids, limit), ids.length)
}

async function scenariosReply($: EngineInterface, ctx: Ctx): Promise<string> {
  await poll($, ctx)
  const snapshot = await read($, snapshotAtom)
  const current = snapshot?.current ?? []
  // Without a project rook only refuses: read the files on disk straight away.
  const listed = blockerOf(snapshot?.readiness, NEEDS.status) === undefined ? await rookJson($, ctx, ['scenarios', 'list', '--json']) : undefined

  if (listed !== undefined && listed.doc !== undefined && failureOf(listed) === undefined) {
    return scenariosText(listed.doc, current)
  }

  const loc = ctx.located ?? (await where($, ctx))

  if (loc === undefined) {
    const readiness = await readinessNow($, ctx)

    return readiness === undefined ? 'no rook agent in this directory.' : checklistText(readiness)
  }

  const index = ctx.agentIndex ?? (await indexAgent(ioOf($, ctx), loc.agentDir))
  ctx.agentIndex = index
  if (listed !== undefined) {
    await learn($, ctx, listed)
  }

  const unready = await setupBlock($, ctx, NEEDS.run, 'run them')

  return (
    scenariosText({ agent_id: loc.agentId, total: index.scenarios.length, scenarios: index.scenarios.map(s => ({ scenario_id: s.id, title: s.title, feature_id: s.featureId })) }, current) +
    (listed === undefined ? '\n(from the files on disk)' : `\n(from the files on disk: rook scenarios list failed — ${clip(failureOf(listed) ?? 'no output', 160)})`) +
    (unready === undefined ? '' : `\n${unready}`)
  )
}

/** `rook generate`, streamed like a run: it reads the code and writes scenarios, which takes minutes. */
async function generateRun($: EngineInterface, ctx: Ctx, request: GenerateRequest, signal?: AbortSignal, source: NonNullable<RookJob['source']> = 'tool'): Promise<string> {
  const args = generateArgs(request, ctx.approval)

  if ('error' in args) {
    return `rook: ${args.error}`
  }

  const unready = (await setupBlock($, ctx, NEEDS.generate, 'generate scenarios')) ?? (await budgetBlock($, ctx, 'generate'))

  if (unready !== undefined) {
    return `rook: ${unready.replace(/^rook:\s*/, '')}`
  }

  const job = await jobBegin($, ctx, 'generate', jobLabel(ctx, 'generate', request.instruction), source)

  try {
    const result = await rookRun($, ctx, args.argv, signal, {}, line => jobLine($, job, line))
    const problem = failureOf(result)

    return problem !== undefined && (result.doc === undefined || (result.doc as { ok?: unknown }).ok === false)
      ? await explained($, ctx, result, `rook generate did not complete: ${problem}`, NEEDS.generate, 'generate scenarios')
      : generateText(result.doc, result.stdout ?? '') + (problem ? `\n${problem}` : '')
  } finally {
    await jobEnd($, job)
    ctx.agentIndex = undefined // the scenario set changed
    ctx.isDirty = true
    await poll($, ctx)
    await refreshBalance($, ctx)
  }
}

/**
 * `rook ui --local`: rook's read-only viewer over what is on disk, with each
 * scenario's request, response and evidence files. It serves until the child
 * ends, so the child lives as long as the loop reading it.
 */
async function startViewer($: EngineInterface, ctx: Ctx): Promise<string> {
  const known = await read($, viewerAtom)

  if (known !== null && ctx.viewer !== undefined) {
    return known
  }

  const stop = new AbortController()
  ctx.viewer = stop
  const stream = $.process.spawn({ argv: [ctx.bin, 'ui', '--local', '--no-open'], env: CLI_ENV, input: '', ...(ctx.cwd !== '' && { cwd: ctx.cwd }) })
  const iterator = stream[Symbol.asyncIterator]()
  let said = ''

  // A rook that prints no address (a prompt, a lock) must not hold the command forever.
  let isLate = false
  const late = new Promise<{ done: true; value: undefined }>(resolve =>
    $.clock.after(VIEWER_START_MS, () => {
      isLate = true
      resolve({ done: true, value: undefined })
    }),
  )
  const url = await (async () => {
    for (;;) {
      const step = await Promise.race([iterator.next(), late])

      if (step.done) {
        return undefined
      }

      said = (said + step.value.text).slice(-4000)
      const found = /http:\/\/(127\.0\.0\.1|localhost):\d+\/?/.exec(said)

      if (found) {
        return found[0]
      }
    }
  })()

  if (url === undefined) {
    ctx.viewer = undefined
    // Ended, not awaited: a child stuck where it cannot be interrupted must not hold the command either.
    void Promise.resolve(iterator.return?.(undefined as never)).catch(() => undefined)

    const last = said.trim() ? ` — ${clip(said.trim().split('\n').pop() ?? '', 160)}` : ''

    return isLate ? `rook: the viewer printed no address within ${VIEWER_START_MS / 1000}s${last}` : `rook: the viewer did not start${last}`
  }

  await update($, viewerAtom, () => url)

  // Keep reading so the child keeps serving; forget the address when it ends.
  void (async () => {
    try {
      while (!stop.signal.aborted && !(await iterator.next()).done) {
        // drained
      }
    } finally {
      await iterator.return?.(undefined as never)
      if (ctx.viewer === stop) {
        ctx.viewer = undefined
        await update($, viewerAtom, () => null)
      }
    }
  })().catch(() => undefined) // a reload ends the child and this module with it

  return url
}

// ── 3 · re-test after edits ──────────────────────────────────────────────────

async function noted($: EngineInterface, ctx: Ctx, path: string): Promise<void> {
  const rel = relativeTo(ctx.cwd, path)

  if (rel === undefined) {
    return
  }

  if (rel.startsWith('.testmuai/')) {
    ctx.agentIndex = undefined // scenarios or features were rewritten

    return
  }

  const loc = ctx.located ?? (await where($, ctx))

  if (loc === undefined) {
    return
  }

  const io = ioOf($, ctx)
  const index = ctx.agentIndex ?? (await indexAgent(io, loc.agentDir))
  ctx.agentIndex = index
  const stale = await read($, staleAtom)
  const files = [...new Set([...(stale?.files ?? []), rel])]
  // Each file is read again: what it defines may have changed with this edit.
  const reaches = (await Promise.all(files.map(file => reach(index, file, path => io.read(path))))).filter((r): r is Reach => r !== undefined)

  if (reaches.length === 0) {
    return
  }

  const impact = mergeReach(index, reaches)
  const since = await $.clock.now()
  const rate = creditsPerScenario((await read($, snapshotAtom))?.latest)
  const estimate = rate === undefined ? undefined : rate * impact.scenarios.length

  await update($, staleAtom, () => ({
    files: impact.files,
    scenarios: impact.scenarios,
    isWholeAgent: impact.isWholeAgent,
    ...(impact.reason !== undefined && { reason: impact.reason }),
    ...(estimate !== undefined && { estimate }),
    since,
  }))

  if (stale === null) {
    await update($, untickedAtom, () => []) // a new band starts with every scenario ticked
    await update($, bandOpenAtom, () => false)
  }

  await update($, bandHiddenAtom, () => false)
  await showStatus($, ctx)
}

/**
 * Edits Claude's Edit tool never saw: a shell command, the person's editor,
 * another terminal. Each poll stamps the agent's tracked sources; a file that
 * appeared or changed since the last poll goes to `noted`, like an edit would.
 * The first poll for an agent only takes the baseline.
 */
async function watchSources($: EngineInterface, ctx: Ctx, loc: Located): Promise<void> {
  if (!ctx.isRetestBand) {
    return
  }

  const io = ioOf($, ctx)
  const index = ctx.agentIndex ?? (await indexAgent(io, loc.agentDir))
  ctx.agentIndex = index
  const stamps = await sourceStamps(io, index.tracks)
  const before = ctx.sourceStamps?.agentDir === loc.agentDir ? ctx.sourceStamps.stamps : undefined

  ctx.sourceStamps = { agentDir: loc.agentDir, stamps }

  if (before === undefined) {
    return
  }

  for (const rel of changedSources(before, stamps)) {
    await noted($, ctx, `${ctx.cwd.replace(/\/$/, '')}/${rel}`).catch(() => undefined)
  }
}

async function fixWithClaude($: EngineInterface, ctx: Ctx, run: RookRunView): Promise<void> {
  const loc = ctx.located ?? (await where($, ctx))

  if (loc !== undefined) {
    await $.prompt.submit({ text: `${failureContext(run, loc.agentDir, loc.agentId)}\n\nFix these failures.` })
  }
}

/** One cluster or one failed scenario, handed to Claude from the pane. */
async function fixOne($: EngineInterface, ctx: Ctx, run: RookRunView, id: string): Promise<void> {
  const loc = ctx.located ?? (await where($, ctx))

  if (loc === undefined) {
    return
  }

  const runDir = `${loc.agentDir}/runs/${run.runId}`
  const rows = new Map(run.rows.map(row => [row.id, row]))
  const cluster = run.clusters.find(c => c.id === id)
  const row = rows.get(id)
  const note = cluster ? clusterNote(cluster, rows, runDir) : row ? failureNote(row, `${runDir}/scenarios/${row.id}/verdict.yaml`) : undefined

  if (note !== undefined) {
    await $.prompt.submit({
      text: `rook run ${run.runId} against agent ${loc.agentId}:\n${note}\n\nFix this. If the evidence shows the criterion is wrong rather than the agent, say so. Then re-test with the rook run tool, passing only the scenario ids involved.`,
    })
  }
}

/** The band's Re-test: only the ticked scenarios. */
async function retest($: EngineInterface): Promise<void> {
  const stale = await read($, staleAtom)
  const unticked = await read($, untickedAtom)

  if (stale !== null && stale.scenarios.length > 0 && tickedOf(stale, unticked).length === 0) {
    $.ui.toast(toastText('rook: tick at least one scenario to re-test'))

    return
  }

  await update($, bandHiddenAtom, () => true)

  if (stale !== null) {
    await $.prompt.submit({ text: retestPrompt(stale, unticked) })
  }
}

/** `/rook generate`: in the background, its failure kept in the pane as well as toasted. */
/** `rook generate: 0 scenario files written`: rook ran and wrote nothing. */
const wroteNothing = (text: string): boolean => /^rook generate: 0 scenario files? written/.test(text)

/** What to do when generate wrote nothing because explore found no features to write against. */
const nothingHint = (text: string): string =>
  wroteNothing(text) && /no features/.test(text)
    ? '\nExplore found no features in this agent, so there is nothing to write scenarios against. Explore again and say what the agent does: /rook explore --force -- <what it does, its tools and users>.'
    : ''

async function backgroundGenerate($: EngineInterface, ctx: Ctx, request: GenerateRequest): Promise<void> {
  await update($, lastErrorAtom, () => null)
  const text = await generateRun($, ctx, request, undefined, 'background').catch(error => `rook generate failed: ${String(error)}`)

  // What was written always opens "rook generate: N scenario files written"; anything else failed.
  // Nothing written is a failure too: a toast alone leaves the setup step unexplained.
  if (!text.startsWith('rook generate:') || wroteNothing(text)) {
    const at = await $.clock.now()

    await update($, lastErrorAtom, () => ({ source: 'generate', text: text.replace(/^rook(?::\s*|\s+)/, '') + nothingHint(text), at }))
  }

  $.ui.toast(toastText(clip(text, 300)))
}

async function paneRun($: EngineInterface, ctx: Ctx, request: RunRequest): Promise<void> {
  $.ui.toast(toastText(await startRun($, ctx, request, 'pane')))
}

async function probeThenPoll($: EngineInterface, ctx: Ctx): Promise<void> {
  await probe($, ctx)
  await poll($, ctx)
}

// ── the module ───────────────────────────────────────────────────────────────

// 6 · /rook
async function rookCommand($: EngineInterface, ctx: Ctx, e: CommandRunInput): Promise<{ text: string; context?: string[] }> {
  const [sub = 'pane', ...rest] = e.args.trim().split(/\s+/).filter(Boolean)
  const tail = e.args.trim().slice(sub.length).trim()

  switch (sub) {
    case 'pane':
    case 'open': {
      const opened = await openPane($, { focus: true })

      // Printing the command's reply can hand the keys back to the prompt; ask again once it has.
      $.clock.after(150, () => openPane($, { focus: true }).then(() => undefined, () => undefined))
      const readiness = await readinessNow($, ctx)
      const setup = readiness?.next === undefined ? '' : `\n${checklistText(readiness)}`

      return { text: (opened.isPlaced ? 'pane opened.' : `pane is waiting: ${opened.reason}`) + setup }
    }
    case 'tab': {
      const tab = rest[0] as RookTab | undefined

      if (tab !== 'health' && tab !== 'runs' && tab !== 'scenarios' && tab !== 'setup' && tab !== 'trends') {
        return { text: 'rook: tab health, runs, scenarios, trends or setup.' }
      }

      await openPane($, { focus: true, tab })

      return { text: `${tab} tab open.` }
    }
    case 'compare':
      return { text: await compareReply($, ctx, rest) }
    case 'flaky':
      return { text: await flakyReply($, ctx, rest) }
    case 'sync':
      return { text: await syncReply($, ctx) }
    case 'budget':
      return { text: await budgetReply($, ctx, rest) }
    case 'ci':
      return { text: await ciReply($, ctx, rest) }
    case 'status':
      return { text: await statusReply($, ctx) }
    case 'runs':
      return { text: await runsReply($, ctx, rest[0] !== undefined && /^\d{1,3}$/.test(rest[0]) ? Math.min(100, Math.max(1, Number(rest[0]))) : 20) }
    case 'scenarios':
      return { text: rest[0] === undefined || rest[0] === 'list' ? await scenariosReply($, ctx) : await curateReply($, ctx, rest[0], rest.slice(1).join(',').split(',').filter(Boolean)) }
    case 'agent':
    case 'agents':
      return { text: rest[0] === 'use' ? await switchAgent($, ctx, rest[1]) : await agentsReply($, ctx) }
    case 'report':
      if (rest.includes('--rca')) {
        return { text: await startExplain($, ctx, rest.find(word => word !== '--rca'), false) }
      }

      return { text: (await reportText($, ctx, rest[0])).text }
    case 'explain': {
      if (rest.includes('--rca')) {
        return { text: await startExplain($, ctx, rest.find(word => word !== '--rca'), true) }
      }

      const { text, context } = await reportText($, ctx, rest[0])

      return context === undefined
        ? { text: `${text}\n\nNothing failed, so there is nothing to explain.` }
        : { text: "rook: handed the failure clusters, rook's remedies and the evidence to Claude.", context: [context] }
    }
    case 'run': {
      const request = parseRunFlags(tail)

      return { text: 'error' in request ? `rook: ${request.error}` : await startRun($, ctx, request, 'command') }
    }
    case 'generate': {
      const request = parseGenerateFlags(tail)

      if ('error' in request) {
        return { text: `rook: ${request.error}` }
      }

      const unready = await setupBlock($, ctx, NEEDS.generate, 'generate scenarios')

      if (unready !== undefined) {
        return { text: unready }
      }

      $.clock.after(0, () => backgroundGenerate($, ctx, request))

      return { text: 'generating scenarios in the background. A toast says when they are written; /rook scenarios lists them.' }
    }
    case 'project': {
      const [action = 'list', ...words] = rest

      if (action !== 'list' && action !== 'use' && action !== 'create') {
        return { text: 'rook: /rook project [list|use <id>|create <name>]' }
      }

      return { text: await projectReply($, ctx, action === 'use' ? { action, id: words[0] ?? '' } : action === 'create' ? { action, name: words.join(' ') } : { action }) }
    }
    case 'explore': {
      const request = parseExploreFlags(tail)

      if ('error' in request) {
        return { text: `rook: ${request.error}` }
      }

      const unready = await setupBlock($, ctx, NEEDS.explore, 'explore this repository')

      if (unready !== undefined) {
        return { text: unready }
      }

      $.clock.after(0, async () => $.ui.toast(toastText(clip(await exploreRun($, ctx, request, undefined, 'background').catch(error => `rook explore failed: ${String(error)}`), 300))))

      return { text: 'rook: exploring this repository in the background (minutes, spends credits). A toast says what it found; the pane picks the agent up.' }
    }
    case 'profile': {
      const [action = 'list', id] = rest
      const after = tail.slice(action.length).trim()
      const dashes = after.search(/(^|\s)--(\s|$)/)
      const goal = dashes < 0 ? '' : after.slice(dashes).replace(/^\s*--/, '').trim()

      if (action === 'add') {
        return { text: 'rook: profile add asks for connection details: type `! rook profile add <name> --from connection.md` (or --command \'<how the agent starts>\').' }
      }

      if (action !== 'list' && action !== 'use' && action !== 'test') {
        return { text: 'rook: /rook profile [list|use <id>|test [id] [-- <goal>]]' }
      }

      const request: ProfileRequest = { action, ...(id !== undefined && id !== '--' && { profile: id }), ...(goal !== '' && { goal }) }

      if (action !== 'test') {
        const answer = await profileReply($, ctx, request)

        return { text: 'deny' in answer ? answer.deny : answer.result }
      }

      // Checked before going to the background, so a refusal shows here and not in a toast.
      const args = profileArgs(request, ctx.approval)
      const unready = 'error' in args ? undefined : await setupBlock($, ctx, NEEDS.profileTest, 'test a profile')
      const blocked = 'error' in args ? `rook: ${args.error}` : unready !== undefined ? `rook: ${unready}` : await prodBlock($, ctx, request.profile)

      if (blocked !== undefined) {
        return { text: blocked }
      }

      $.clock.after(0, async () => {
        const answer = await profileReply($, ctx, request).catch(error => ({ deny: `rook profile test failed: ${String(error)}` }))

        $.ui.toast(toastText(clip('deny' in answer ? answer.deny : answer.result, 300)))
      })

      return { text: `rook: testing ${request.profile ?? 'the active profile'} in the background: one call to the agent. A toast says what came back.` }
    }
    case 'ui':
    case 'viewer': {
      const url = await startViewer($, ctx)

      return { text: url.startsWith('http') ? `viewer: ${url} (read only: scenarios, runs, request/response and evidence files)` : url }
    }
    case 'confirm-prod': {
      if (e.origin.kind !== 'composer') {
        return { text: 'rook: confirm-prod must be typed by the person at the prompt.' }
      }

      // The profile a refusal named, or the active one.
      const target = await profileOf($, ctx, rest[0])

      if (target === undefined) {
        return {
          text: rest[0] === undefined ? 'rook: no rook workspace with an active profile here; nothing to confirm.' : `rook: "${clip(rest[0], 64)}" is not a profile id.`,
        }
      }

      const until = (await $.clock.now()) + CONFIRM_MS

      await update($, confirmedAtom, () => ({ cwd: ctx.cwd, profile: target.profileId, until }))

      return {
        text:
          `rook: runs with profile "${target.profileId}" in this directory are allowed for the next 15 minutes, ` +
          "even though its target looks like production. Its writes are real and rook cannot roll them back.",
      }
    }
    default:
      return { text: USAGE }
  }
}

// ── setup from inside Claude Code: project, explore, profile ────────────────

/** `rook project`, `project use <id>`, `project create <name>`: no credits, no agent call. */
async function projectReply($: EngineInterface, ctx: Ctx, request: ProjectRequest): Promise<string> {
  const args = projectArgs(request)

  if ('error' in args) {
    return `rook: ${args.error}`
  }

  if (args.argv[1] === '--json') {
    let listed = await rookJson($, ctx, args.argv)

    // A rook from before `project --json` refuses the flag; its plain listing carries the same rows.
    if (listed.doc === undefined && /unknown option/i.test(listed.stderr)) {
      listed = await rookJson($, ctx, ['project'])
    }

    const problem = failureOf(listed)

    return problem === undefined ? projectsText(listed.doc, listed.stdout ?? '') : `rook project failed: ${problem}`
  }

  const ran = await rookJson($, ctx, args.argv)
  const problem = failureOf(ran)

  ctx.isDirty = true
  await poll($, ctx)

  return problem === undefined ? `rook: ${clip(ran.stdout?.trim() || 'done', 300)}` : `rook project ${args.argv[1]} failed: ${problem}`
}

/**
 * `rook explore .`, streamed like a run: it reads the codebase and writes
 * agents and features, which takes minutes and spends credits. A workspace
 * that did not exist may afterwards, so the pane is re-read from scratch.
 */
/** The agents rook has written for the selected project, with their feature counts: what explore actually produced. */
async function agentsOnDisk($: EngineInterface, ctx: Ctx): Promise<{ id: string; features: number }[]> {
  const io = ioOf($, ctx)
  const facts = await diskFacts(io)
  const projects = await io.list(`${ROOT}/projects`).catch(() => [])
  const project = projectDirName(projects.filter(entry => entry.kind === 'dir').map(entry => entry.name), facts.projectId)

  if (project === undefined) {
    return []
  }

  const projectDir = `${ROOT}/projects/${project}`
  const found: { id: string; features: number }[] = []

  for (const id of await agentIdsOf(io, projectDir)) {
    const features = (await io.list(`${projectDir}/agents/${id}/features`).catch(() => [])).filter(entry => entry.name.endsWith('.yaml')).length
    found.push({ id, features })
  }

  return found
}

async function exploreRun($: EngineInterface, ctx: Ctx, request: ExploreRequest, signal?: AbortSignal, source: NonNullable<RookJob['source']> = 'tool'): Promise<string> {
  const args = exploreArgs(request, ctx.approval)

  if ('error' in args) {
    return `rook: ${args.error}`
  }

  const unready = await setupBlock($, ctx, NEEDS.explore, 'explore this repository')

  if (unready !== undefined) {
    return `rook: ${unready}`
  }

  const job = await jobBegin($, ctx, 'explore', jobLabel(ctx, 'explore', request.instruction), source)

  try {
    const result = await rookRun($, ctx, args.argv, signal, {}, line => jobLine($, job, line))

    if (result.exitCode !== 0) {
      const problem = failureOf(result) ?? `rook exited ${result.exitCode}`

      return `rook explore did not complete: ${problem}${/project/i.test(problem) ? ' (the rook project tool lists and selects projects)' : ''}`
    }

    return exploreText(result.stdout ?? '', await agentsOnDisk($, ctx))
  } finally {
    await jobEnd($, job)
    ctx.agentIndex = undefined // agents and features were written
    ctx.isDirty = true
    await poll($, ctx)
  }
}

/**
 * State directories for a profile test. `rook profile test` hands the scripts
 * none (a run does), so a profile that keeps its session in ROOK_STATE_DIR
 * failed with "ROOK_STATE_DIR is required" before reaching the agent. rook
 * passes its own environment to the scripts and sets these only when it has
 * one, so a run still uses its own per-scenario directory. A fresh pair per
 * test, under the system temp directory: no session carries from one test to
 * the next, and nothing collects in the repository.
 */
async function probeStateEnv($: EngineInterface): Promise<Record<string, string>> {
  const base = `${((await $.env.get('TMPDIR')) ?? '/tmp').replace(/\/$/, '')}/rook-profile-test-${await $.clock.now()}`

  return { ROOK_STATE_DIR: `${base}/state`, ROOK_RUN_STATE_DIR: `${base}/run-state` }
}

/**
 * `rook profile` (list), `profile use <id>`, `profile test [id]`. A test calls
 * the real agent through the profile, so the production guard applies to the
 * profile being tested.
 */
async function profileReply($: EngineInterface, ctx: Ctx, request: ProfileRequest, signal?: AbortSignal): Promise<{ result: string } | { deny: string }> {
  const args = profileArgs(request, ctx.approval)

  if ('error' in args) {
    return { deny: `rook: ${args.error}` }
  }

  if (args.argv[1] === undefined) {
    const listed = await rookJson($, ctx, args.argv)

    return { result: listed.exitCode === 0 ? profilesText(listed.stdout ?? '') : `rook profile failed: ${failureOf(listed) ?? `rook exited ${listed.exitCode}`}` }
  }

  if (args.argv[1] === 'use') {
    const ran = await rookJson($, ctx, args.argv)

    ctx.isDirty = true
    await poll($, ctx)

    return { result: ran.exitCode === 0 ? `rook: ${clip(ran.stdout?.trim() || 'done', 200)}` : `rook profile use failed: ${failureOf(ran) ?? `rook exited ${ran.exitCode}`}` }
  }

  const blocked = (await setupBlock($, ctx, NEEDS.profileTest, 'test a profile')) ?? (await prodBlock($, ctx, request.profile))

  if (blocked !== undefined) {
    return { deny: blocked.startsWith('rook') ? blocked : `rook: ${blocked}` }
  }

  try {
    const result = await rookRun($, ctx, args.argv, signal, await probeStateEnv($))

    return { result: profileTestText(request.profile, result.exitCode, result.stdout ?? '', result.stderr) }
  } finally {
    ctx.isDirty = true // a profile that answered is verified, and may have become the active one
    await poll($, ctx)
  }
}


// ── depth: rca on a finished run, agents, curation, the balance ─────────────

/** `rook plan --json`: credits left. Fetched at session start and after anything that spends, never per poll. */
async function refreshBalance($: EngineInterface, ctx: Ctx): Promise<number | null> {
  const plan = await rookJson($, ctx, ['plan', '--json'])
  const balance = failureOf(plan) === undefined ? (balanceOf(plan.doc) ?? null) : null

  if ((await read($, balanceAtom)) !== balance) {
    await update($, balanceAtom, () => balance)
    await showStatus($, ctx)
  }

  return balance
}

/** The project's agent ids for the pane: rook's own directory names, re-listed with each poll's locate. */
async function syncAgents($: EngineInterface, ctx: Ctx, loc: Located): Promise<void> {
  const ids = await agentIdsOf(ioOf($, ctx), loc.projectDir)

  if (String(await read($, agentsAtom)) !== String(ids)) {
    await update($, agentsAtom, () => ids)
  }
}

/** The run a --rca would explain (the named one, or the latest), or why there is nothing to spend on. */
async function explainable($: EngineInterface, ctx: Ctx, runRef: string | undefined): Promise<{ runId: string } | { refusal: string }> {
  // Explaining reads the run's evidence and rook's controller: it needs a project and an agent, not a profile.
  const blocked = await setupBlock($, ctx, NEEDS.generate, 'explain a run')
  const loc = await where($, ctx)

  if (blocked !== undefined || loc === undefined) {
    return { refusal: `rook: ${blocked ?? "can't explain a run yet: no agent here."}` }
  }

  if (runRef !== undefined && !RUN_ID.test(runRef)) {
    return { refusal: `rook: "${clip(runRef, 40)}" is not a run id (2026-09-28T15-54-56Z form).` }
  }

  const io = ioOf($, ctx)
  const ids = await runIds(io, loc.agentDir)
  const runId = runRef ?? ids[0]
  const run = runId === undefined || !ids.includes(runId) ? undefined : await readRun(io, loc.agentDir, runId, ctx.rows)

  if (runId === undefined || run === undefined) {
    return { refusal: runRef ? `rook: no run ${runRef} for agent ${loc.agentId}.` : `rook: agent ${loc.agentId} has no runs yet.` }
  }

  if (!run.finished) {
    return { refusal: `rook: run ${runId} has not finished; it can be explained once its report is written.` }
  }

  if (run.counts.fail === 0 && run.clusters.length === 0) {
    return { refusal: `rook: run ${runId} has no failures or clusters to explain; nothing was spent.` }
  }

  if (run.clusters.length > 0 && run.clusters.every(isExplained)) {
    return { refusal: `rook: every cluster of run ${runId} is explained already; nothing was spent. The rook report tool (without rca) reads it.` }
  }

  return { runId }
}

/**
 * `rook report <run> --rca`, streamed like a run (the explainer reads code
 * and can take minutes), then the run re-read from disk: report.yaml's
 * clusters with their causes, and remedies/CL-xx.md. The caller has set
 * `explaining`; this clears it.
 */
async function explainRca($: EngineInterface, ctx: Ctx, runId: string, signal?: AbortSignal): Promise<{ text: string; context?: string }> {
  try {
    const args = reportRcaArgs(runId, ctx.approval)

    if ('error' in args) {
      return { text: `rook: ${args.error}` }
    }

    const result = await rookRun($, ctx, args.argv, signal)
    const problem = failureOf(result)

    if (problem !== undefined) {
      return { text: `rook report --rca did not complete: ${problem}` }
    }

    ctx.isDirty = true // the latest run's clusters changed under a settled snapshot
    await poll($, ctx)
    const head = rcaLine(runId, rcaOutcome(result.stdout ?? ''))
    const report = await reportText($, ctx, runId)

    return { text: `${head}\n${report.text}`, ...(report.context !== undefined && { context: `${head}\n${report.context}` }) }
  } finally {
    await update($, explainingAtom, () => null)
    await refreshBalance($, ctx)
  }
}

/** The model's --rca: inline, so the explained clusters come back as the report tool's result. */
async function toolExplain($: EngineInterface, ctx: Ctx, runRef: string | undefined, signal: AbortSignal): Promise<string> {
  if ((await read($, explainingAtom)) !== null) {
    return 'rook: rook is already explaining a run; wait for it, then read it with the rook report tool.'
  }

  const target = await explainable($, ctx, runRef)

  if ('refusal' in target) {
    return target.refusal
  }

  await update($, explainingAtom, () => target.runId)
  const { text, context } = await explainRca($, ctx, target.runId, signal)

  return context ?? text
}

/** An --rca the person asked for (pane, /rook): in the background; `isHandedOver` gives Claude the result as context. */
async function startExplain($: EngineInterface, ctx: Ctx, runRef: string | undefined, isHandedOver: boolean): Promise<string> {
  if ((await read($, explainingAtom)) !== null) {
    return 'rook: rook is already explaining a run.'
  }

  const target = await explainable($, ctx, runRef)

  if ('refusal' in target) {
    return target.refusal
  }

  await update($, explainingAtom, () => target.runId)
  $.clock.after(0, () => backgroundExplain($, ctx, target.runId, isHandedOver))

  return (
    `rook: explaining run ${target.runId} in the background. The agent is not called again; ` +
    'it is free if this agent version was explained already, otherwise it costs credits. The pane shows the causes and remedies when it lands.'
  )
}

async function backgroundExplain($: EngineInterface, ctx: Ctx, runId: string, isHandedOver: boolean): Promise<void> {
  const answer = await explainRca($, ctx, runId).catch(error => ({ text: `rook report --rca failed: ${String(error)}`, context: undefined }))

  $.ui.toast(toastText(clip(answer.text.split('\n')[0] ?? '', 200)))

  if (isHandedOver && answer.context !== undefined) {
    const text = `<rook-run-result>\n${answer.context}\n</rook-run-result>`

    await $.session.append({ message: { type: 'user', content: [{ type: 'text', text }] } }).catch(() => undefined)
  }
}

async function paneExplain($: EngineInterface, ctx: Ctx, runId: string): Promise<void> {
  $.ui.toast(toastText(await startExplain($, ctx, runId, false)))
}

/** `rook agent` (prose: `* id  name`), or the agent directories on disk when rook cannot answer. */
async function agentList($: EngineInterface, ctx: Ctx): Promise<{ id: string; name: string; isActive: boolean }[]> {
  const listed = await rookJson($, ctx, ['agent'])
  const parsed = listed.exitCode === 0 ? parseAgentList(listed.stdout ?? '') : []
  const loc = parsed.length > 0 ? undefined : (ctx.located ?? (await where($, ctx)))

  return loc === undefined ? parsed : (await agentIdsOf(ioOf($, ctx), loc.projectDir)).map(id => ({ id, name: id, isActive: id === loc.agentId }))
}

async function agentsReply($: EngineInterface, ctx: Ctx): Promise<string> {
  return agentsText(await agentList($, ctx))
}

/** `rook agent use <id>`, then everything the mod knew about the old agent is let go and re-read. */
async function switchAgent($: EngineInterface, ctx: Ctx, id: string | undefined): Promise<string> {
  const args = agentUseArgs(id)

  if ('error' in args) {
    return `rook: ${args.error}`
  }

  if ((await read($, runningAtom)) !== null || (await read($, explainingAtom)) !== null) {
    return 'rook: rook is busy with the current agent; switch once it finishes.'
  }

  const known = await agentList($, ctx)
  const agent = known.find(a => a.id === id)

  if (known.length > 0 && agent === undefined) {
    return `rook: no agent ${id} in this project. Agents: ${known.map(a => a.id).join(', ')}.`
  }

  if (agent?.isActive) {
    return `rook: ${id} is already the active agent.`
  }

  const ran = await rookJson($, ctx, args.argv)

  if (ran.exitCode !== 0) {
    return `rook agent use failed: ${failureOf(ran) ?? 'no output'}`
  }

  ctx.agentIndex = undefined
  ctx.located = undefined
  ctx.isDirty = true

  if ((await read($, staleAtom)) !== null) {
    await update($, staleAtom, () => null) // the band named the old agent's scenarios
  }

  await update($, expandedAtom, () => null)
  await poll($, ctx)

  return `rook: ${id} is now the active agent. Runs, scenarios and reports follow it.`
}

async function paneSwitch($: EngineInterface, ctx: Ctx, id: string): Promise<void> {
  $.ui.toast(toastText(await switchAgent($, ctx, id)))
}

/** `rook scenarios exclude|include <ids> --json`; the scenario set is re-read after. */
async function curateReply($: EngineInterface, ctx: Ctx, verb: string, ids: string[]): Promise<string> {
  const args = curateArgs(verb, ids)

  if ('error' in args) {
    return `rook: ${args.error}`
  }

  const ran = await rookJson($, ctx, args.argv)
  const problem = failureOf(ran)

  if (problem !== undefined) {
    return `rook scenarios ${verb} failed: ${problem}`
  }

  ctx.agentIndex = undefined
  ctx.isDirty = true
  await poll($, ctx)

  return curateText(ran.doc)
}

// ── shared: tabs and the confirm bar ─────────────────────────────────────────

/** A tab is a place to go: it closes the drill-down, which would otherwise stay over every tab. */
async function setTab($: EngineInterface, tab: RookTab): Promise<void> {
  await update($, tabAtom, () => tab)
  await update($, detailAtom, () => null)
  await update($, evidenceAtom, () => null)
}

/**
 * Keep the keys in the pane after the pressed button goes away (Back, a tab,
 * the confirm bar): the ring lands on the always-drawn view switch instead of
 * dropping to the prompt, so the next key still reaches the pane.
 */
async function keepFocus($: EngineInterface): Promise<void> {
  await $.ui.focus({ requestId: PANE, key: 'lens' }).catch(() => undefined)
}

// ── shared: lens, focus and the drill-down ───────────────────────────────────

const LENS_KEY = 'lens'

/** Body rows the pane asks for inline: when the person opened it, and when rook did. */
const PANE_ROWS_ASKED = 30
const PANE_ROWS = 18

/**
 * Open the pane. `focus` when the person asked for it (`/rook`, a band's or a
 * card's Open): keys go to the pane at once and Esc returns to the prompt.
 * Never when rook opens it on its own (session start, Claude's run): it must
 * not take the person's typing. `tab` switches first.
 */
async function openPane($: EngineInterface, opts: { focus?: boolean; tab?: RookTab } = {}) {
  if (opts.tab !== undefined) {
    await setTab($, opts.tab)
  }

  // Inline, a pane gets a third of the terminal unless it asks: the views need more to show a list and
  // its detail. Asked for, it takes more room; opened by rook, a little more than a third. A size the
  // person dragged the pane to still wins.
  return $.ui.open({ id: PANE, title: 'rook', rows: opts.focus === true ? PANE_ROWS_ASKED : PANE_ROWS, ...(opts.focus === true && { focus: true }) })
}

/** The lens the person last chose, else the `lens` option. Read once per session start. */
async function loadLens($: EngineInterface, ctx: Ctx): Promise<void> {
  const stored = await $.store.get(LENS_KEY).catch(() => undefined)

  await update($, lensAtom, () => (stored === 'qe' || stored === 'dev' ? stored : ctx.lensDefault))
}

async function setLens($: EngineInterface, lens: RookLens): Promise<void> {
  await update($, lensAtom, () => lens)
  await $.store.set(LENS_KEY, lens).catch(() => undefined)
}

async function toggleLens($: EngineInterface): Promise<void> {
  await setLens($, (await read($, lensAtom)) === 'qe' ? 'dev' : 'qe')
}

/** Show one scenario of one run in the drill-down, from any list in any tab. Reads its evidence once. */
async function openDetail($: EngineInterface, ctx: Ctx, runId: string, id: string): Promise<void> {
  const loc = ctx.located

  await update($, detailAtom, () => ({ runId, id }))
  await update($, evidenceAtom, () => null)

  if (loc !== undefined) {
    const evidence = await readEvidence(ioOf($, ctx), loc.agentDir, runId, id).catch(() => undefined)

    // The person may have opened another one while this was read.
    if ((await read($, detailAtom))?.id === id) {
      await update($, evidenceAtom, () => evidence ?? null)
    }
  }
}

/** The agent's tracked source files and their modification times as of the last poll (hooks/changes.ts `changedSince`). */
function sourceStampsNow(ctx: Ctx): ReadonlyMap<string, number> | undefined {
  return ctx.sourceStamps !== undefined && ctx.sourceStamps.agentDir === ctx.located?.agentDir ? ctx.sourceStamps.stamps : undefined
}

async function closeDetail($: EngineInterface): Promise<void> {
  await update($, detailAtom, () => null)
  await update($, evidenceAtom, () => null)
  await keepFocus($)
}

/** Each scenario's newest verdicts across runs: re-read only when the agent's runs changed. Called at the end of every poll. */
async function refreshVerdicts($: EngineInterface, ctx: Ctx): Promise<void> {
  try {
    const loc = ctx.located

    if (loc === undefined) {
      return
    }

    const io = ioOf($, ctx)
    const ids = await runIds(io, loc.agentDir)
    const latest = (await read($, snapshotAtom))?.latest
    const signature = `${loc.agentDir}#${ids.slice(0, 12).join(',')}#${latest?.runId === ids[0] ? latest?.done : ''}`

    if (signature === ctx.verdictSignature) {
      return
    }

    ctx.verdictSignature = signature
    ctx.verdictCache ??= new Map()
    const verdicts = await verdictHistory(io, loc.agentDir, ids, undefined, ctx.verdictCache)

    await update($, verdictsAtom, () => verdicts)
  } catch {
    ctx.verdictSignature = undefined
  }
}

/** Park a credit-spending action in the pane until the person confirms it. */
async function askConfirm($: EngineInterface, confirm: RookConfirm): Promise<void> {
  await update($, confirmAtom, () => confirm)
}

/** The pane's Confirm: replay the parked action. */
async function confirmNow($: EngineInterface, ctx: Ctx): Promise<void> {
  const confirm = await read($, confirmAtom)

  await update($, confirmAtom, () => null)

  if (confirm?.action === 'run') {
    await paneRun($, ctx, confirm.only === undefined ? {} : { only: confirm.only })
  } else if (confirm?.action === 'generate') {
    const request: GenerateRequest = {
      ...(confirm.instruction !== undefined && { instruction: confirm.instruction }),
      ...(confirm.total !== undefined && { total: confirm.total }),
      ...(confirm.force === true && { force: true }),
    }

    $.ui.toast(toastText('rook: generating scenarios in the background.'))
    $.clock.after(0, () => backgroundGenerate($, ctx, request))
  } else if (confirm?.action === 'flaky') {
    $.ui.toast(toastText(await flakyStart($, ctx, confirm.id, confirm.times, 'pane')))
  } else if (confirm?.action === 'profile-test') {
    await paneProfileTest($, ctx, confirm.profile)
  } else if (confirm?.action === 'explore') {
    exploreConfirmed($, ctx, confirm.instruction)
  }
}

// ══ feature: progress (generate / explore lanes) ═════════════════════════════

/** How often a job's elapsed time redraws and the disk is looked at. */
const JOB_TICK_MS = 1_000

/**
 * The job this load is watching: what was on disk when it started, which
 * feature each touched scenario file belongs to, and its timer. One job is
 * drawn at a time; a second one started meanwhile takes the lanes over.
 */
type JobWatch = { job: RookJob; agentDir?: string; before: Set<string>; owners: Map<string, string | undefined>; timer?: Timer; isLooking: boolean }

let jobWatch: JobWatch | undefined

/** Sets `jobAtom` for a generate or explore about to start, and starts watching the disk for it. */
async function jobBegin($: EngineInterface, ctx: Ctx, kind: RookJob['kind'], label: string, source: NonNullable<RookJob['source']>): Promise<JobWatch> {
  const now = await $.clock.now()
  const io = ioOf($, ctx)
  const agentDir = kind === 'generate' ? (ctx.located ?? (await where($, ctx)))?.agentDir : undefined
  const keys = kind === 'generate' ? (agentDir === undefined ? [] : await scenarioKeys(io, agentDir)) : (await featureEntries(io)).map(entry => entry.key)
  const watch: JobWatch = { job: newJob(kind, label, now, source), ...(agentDir !== undefined && { agentDir }), before: new Set(keys), owners: new Map(), isLooking: false }

  jobWatch?.timer?.cancel()
  jobWatch = watch
  await update($, jobAtom, () => watch.job)
  watch.timer = $.clock.every(JOB_TICK_MS, () => jobLook($, ctx, watch))

  return watch
}

/** One line rook printed, folded into the job it belongs to. */
async function jobLine($: EngineInterface, watch: JobWatch, line: string): Promise<void> {
  // Called unawaited from the stream loop: nothing here may reject.
  try {
    const now = await $.clock.now()

    if (jobWatch === watch) {
      watch.job = jobFromLine(watch.job, line, now)
      await update($, jobAtom, () => watch.job)
    }
  } catch {
    // a line that could not be drawn is only a line
  }
}

/** Each tick: what the disk says was written, and the elapsed time moved on. */
async function jobLook($: EngineInterface, ctx: Ctx, watch: JobWatch): Promise<void> {
  if (jobWatch !== watch || watch.isLooking) {
    return
  }

  watch.isLooking = true

  try {
    const io = ioOf($, ctx)
    const entries =
      watch.job.kind === 'generate'
        ? watch.agentDir === undefined
          ? []
          : await scenarioEntries(io, watch.agentDir, watch.before, watch.job.startedAt, watch.owners)
        : await featureEntries(io)
    const now = await $.clock.now()

    if (jobWatch === watch) {
      watch.job = jobFromDisk(watch.job, watch.before, entries, now)
      await update($, jobAtom, () => watch.job)
      await update($, tickAtom, () => now)
    }
  } finally {
    watch.isLooking = false
  }
}

/** The command ended, however it ended: the lanes go. */
async function jobEnd($: EngineInterface, watch: JobWatch): Promise<void> {
  watch.timer?.cancel()

  if (jobWatch === watch) {
    jobWatch = undefined
    await update($, jobAtom, () => null)
  }
}

/**
 * The stored job, if this load is the one running it. `$.state` outlives a
 * reload and the watcher does not, so a job left behind by a reload mid-run
 * would otherwise be drawn forever.
 */
function liveJob(job: RookJob | null): RookJob | null {
  return jobWatch === undefined ? null : job
}

/** What the lanes are titled: the agent, and the instruction when there is one. */
function jobLabel(ctx: Ctx, kind: RookJob['kind'], instruction: string | undefined): string {
  const what = kind === 'generate' ? `scenarios for ${ctx.located?.agentId ?? 'the active agent'}` : 'this repository'

  return instruction === undefined || instruction.trim() === '' ? what : `${what} — ${clip(instruction, 60)}`
}
// ══ end feature: progress ════════════════════════════════════════════════════

// ══ feature: health (Unable to Verify fixer, cancel, run confirm) ════════════

/** The pane's Cancel on a run the person started: the child ends, backgroundRun clears the rest and says so. */
/** Nothing has written to an unfinished run for this long: rook is not running it any more. */
const STOPPED_MS = 10 * 60_000
/** `$.store` key: the runs the person cancelled, `<agent dir>#<run id>`, newest last. */
const CANCELLED_KEY = 'cancelledRuns'

/**
 * An unfinished run this session is not running is over when the person
 * cancelled it, or when nothing has written to its folder for STOPPED_MS
 * (rook was killed: a quit, a crash). A run in another terminal keeps writing,
 * so it stays live. An unknown time (0) is never taken as idle.
 */
async function liveOrStopped($: EngineInterface, ctx: Ctx, loc: Located, run: RookRunView): Promise<RookRunView> {
  if (run.finished || (await read($, runningAtom)) !== null) {
    return run
  }

  const stopped: RookRunView = { ...run, finished: true, stopped: true, lanes: [] }

  // Cancels outlive the session that pressed Cancel: a new one must not call the run live.
  ctx.cancelled ??= new Set(((await $.store.get(CANCELLED_KEY).catch(() => undefined)) as string[] | undefined) ?? [])

  if (ctx.cancelled.has(`${loc.agentDir}#${run.runId}`)) {
    return stopped
  }

  const io = ioOf($, ctx)
  const dir = `${loc.agentDir}/runs/${run.runId}`
  const times = [...(await io.list(dir)), ...(await io.list(`${dir}/scenarios`))].map(entry => entry.mtimeMs ?? 0)
  const newest = Math.max(0, ...times)

  return newest > 0 && (await $.clock.now()) - newest > STOPPED_MS ? stopped : run
}

async function cancelRun($: EngineInterface, ctx: Ctx): Promise<void> {
  const running = await read($, runningAtom)

  if (running === null || running.source === 'tool') {
    return
  }

  // rook leaves the run folder unfinished: remember it, so the pane says stopped rather than running.
  const inFlight = (await read($, snapshotAtom))?.latest
  const loc = ctx.located

  if (inFlight !== undefined && !inFlight.finished && loc !== undefined) {
    ctx.cancelled ??= new Set(((await $.store.get(CANCELLED_KEY).catch(() => undefined)) as string[] | undefined) ?? [])
    ctx.cancelled.add(`${loc.agentDir}#${inFlight.runId}`)
    await $.store.set(CANCELLED_KEY, [...ctx.cancelled].slice(-50)).catch(() => undefined)
  }

  if (ctx.runAbort !== undefined) {
    ctx.runAbort.abort()

    return
  }

  // Nothing of this load is running it (a reload ended the child): clear what says it is.
  await update($, runningAtom, () => null)
  $.ui.toast(toastText('rook: run cancelled'))
}

/** One group of "what nobody looked at" handed to Claude: make the evidence observable, keep the criteria. */
async function fixUnverified($: EngineInterface, ctx: Ctx, run: RookRunView, cause: GapCause): Promise<void> {
  const loc = ctx.located ?? (await where($, ctx))
  const group = gapGroups(unlooked(run)).find(g => g.cause === cause)

  if (loc === undefined || group === undefined) {
    return
  }

  const profile = await profileOf($, ctx)
  const profileText = profile === undefined ? undefined : await ioOf($, ctx).read(`${loc.agentDir}/profiles/${profile.profileId}.yaml`)

  await $.prompt.submit({
    text: unverifiedPrompt({
      runId: run.runId,
      agentId: loc.agentId,
      agentDir: loc.agentDir,
      group,
      ...(profile !== undefined && profileText !== undefined && { profileId: profile.profileId, profileText }),
    }),
  })
}

/** Park a run of these scenarios behind the confirm bar, with what it would cost. */
async function confirmRun($: EngineInterface, run: RookRunView | undefined, label: string, only?: string[], count = only?.length ?? 0): Promise<void> {
  await askConfirm($, { action: 'run', label, ...(only !== undefined && { only }), ...estimateOf(creditsPerScenario(run), count) })
}
// ══ end feature: health ══════════════════════════════════════════════════════

// ══ feature: runs tab (history, compare) ═════════════════════════════════════

/** The Runs tab's list: re-read only when the agent's runs on disk changed. Called at the end of every poll. */
async function refreshHistory($: EngineInterface, ctx: Ctx): Promise<void> {
  try {
    const loc = ctx.located

    if (loc === undefined) {
      if (ctx.historySignature !== undefined) {
        ctx.historySignature = undefined
        await update($, historyAtom, () => null)
      }

      return
    }

    const io = ioOf($, ctx)
    const ids = await runIds(io, loc.agentDir)
    const latest = (await read($, snapshotAtom))?.latest
    const signature = historySignature(loc.agentDir, ids, latest?.runId === ids[0] && latest?.finished === true)

    if (signature === ctx.historySignature) {
      return
    }

    ctx.historySignature = signature
    const history = await historyOf(io, loc.agentDir, ids)

    await update($, historyAtom, () => history)
  } catch {
    ctx.historySignature = undefined // read again next poll
  }
}

/** Two runs of the agent, diffed scenario by scenario; the two newest finished runs by default. */
async function diffOf($: EngineInterface, ctx: Ctx, loc: Located, baseRef?: string, headRef?: string): Promise<RunDiff | { error: string }> {
  const io = ioOf($, ctx)
  const ids = await runIds(io, loc.agentDir)
  const pool = baseRef === undefined && headRef === undefined ? (await historyOf(io, loc.agentDir, ids, 2)).map(run => run.runId) : ids
  const pair = comparePair(pool, baseRef, headRef)

  if ('error' in pair) {
    return pair
  }

  const base = await readRun(io, loc.agentDir, pair.base, ctx.rows)
  const head = await readRun(io, loc.agentDir, pair.head, ctx.rows)

  if (base === undefined || head === undefined) {
    return { error: `run ${base === undefined ? pair.base : pair.head} has no run.yaml.` }
  }

  return diffRuns(base, head)
}

/** The diff as text, for `/rook compare` and the compare tool: disk only, no credits. */
async function compareRuns($: EngineInterface, ctx: Ctx, baseRef: string | undefined, headRef: string | undefined): Promise<string> {
  const blocked = await setupBlock($, ctx, ['agent'], 'compare runs')
  const loc = await where($, ctx)

  if (blocked !== undefined || loc === undefined) {
    return `rook: ${blocked ?? "can't compare runs yet: no agent here."}`
  }

  const bad = [baseRef, headRef].find(ref => ref !== undefined && !RUN_ID.test(ref))

  if (bad !== undefined) {
    return `rook: "${clip(bad, 40)}" is not a run id (2026-09-28T15-54-56Z form).`
  }

  const diff = await diffOf($, ctx, loc, baseRef, headRef)

  return 'error' in diff ? `rook: ${diff.error}` : compareText(loc.agentId, diff)
}

/** `/rook compare [base] [head]`. */
async function compareReply($: EngineInterface, ctx: Ctx, args: string[]): Promise<string> {
  if (args.length > 2) {
    return 'rook: compare [base run] [head run]; with none, the two newest finished runs.'
  }

  return compareRuns($, ctx, args[0], args[1])
}

/** The Runs tab opens a run: read from disk once, kept until Back. */
async function openRun($: EngineInterface, ctx: Ctx, runId: string): Promise<void> {
  const loc = ctx.located ?? (await where($, ctx))
  const run = loc === undefined ? undefined : await readRun(ioOf($, ctx), loc.agentDir, runId, ctx.rows)

  if (run === undefined) {
    $.ui.toast(toastText(`rook: run ${runId} could not be read.`))

    return
  }

  await update($, runOpenAtom, () => run)
  await refreshRunVersus($, ctx, run)
}

async function closeRun($: EngineInterface): Promise<void> {
  await update($, runOpenAtom, () => null)
  await update($, runVersusAtom, () => null)
}

/** "Report to Claude": the opened run's failures (or its summary) as a prompt. */
async function reportRun($: EngineInterface, ctx: Ctx): Promise<void> {
  const run = await read($, runOpenAtom)
  const loc = ctx.located ?? (await where($, ctx))

  if (run === null || loc === undefined) {
    return
  }

  if (run.counts.fail > 0) {
    await fixWithClaude($, ctx, run)

    return
  }

  await $.prompt.submit({ text: `${runSummary(run, loc.agentDir, loc.agentId)}

Nothing failed in this run. Say whether anything above needs attention.` })
}

/** "Explain with rca" on the opened run. */
async function explainRun($: EngineInterface, ctx: Ctx): Promise<void> {
  const run = await read($, runOpenAtom)

  if (run !== null) {
    await paneExplain($, ctx, run.runId)
  }
}

/** "Compare with…": the opened run is the first of two; the list then picks the second. */
async function compareWith($: EngineInterface): Promise<void> {
  const run = await read($, runOpenAtom)

  if (run !== null) {
    await update($, runDiffAtom, () => null)
    await update($, compareAtom, () => [run.runId])
  }
}

/** A run picked in the list: the second of two diffs them, older as base. */
async function pickRun($: EngineInterface, ctx: Ctx, runId: string): Promise<void> {
  const picked = await read($, compareAtom)

  if (picked.length !== 1 || picked[0] === runId) {
    await update($, compareAtom, () => [runId])

    return
  }

  const [base, head] = ordered(picked[0]!, runId)
  const loc = ctx.located ?? (await where($, ctx))
  const diff = loc === undefined ? { error: 'no agent here.' } : await diffOf($, ctx, loc, base, head)

  if ('error' in diff) {
    $.ui.toast(toastText(`rook: ${diff.error}`))

    return
  }

  await update($, runDiffAtom, () => diff)
  await update($, compareAtom, () => [base, head])
}

/** Cancel a pick (back to the opened run), or leave a comparison (back to the list). */
async function clearCompare($: EngineInterface): Promise<void> {
  if ((await read($, compareAtom)).length === 2) {
    await update($, runOpenAtom, () => null)
  }

  await update($, compareAtom, () => [])
  await update($, runDiffAtom, () => null)
}

// ══ end feature: runs tab ════════════════════════════════════════════════════

// ══ feature: scenarios tab (filter, select, detail, flaky, generate box) ═════

/** The agent's scenario files, read once per change of the scenario set (the poll's index signature), not per drawing. */
async function scenarioList($: EngineInterface, ctx: Ctx): Promise<ScenarioInfo[]> {
  const loc = ctx.located

  if (loc === undefined) {
    return []
  }

  const key = `${loc.agentDir}#${ctx.indexSignature ?? ''}`

  if (ctx.scenarioList?.key === key) {
    return ctx.scenarioList.list
  }

  const list = await readScenarios(ioOf($, ctx), loc.agentDir)
  ctx.scenarioList = { key, list }

  return list
}

/** A scenario's verdict in one run, from the row cache or its verdict.yaml. */
async function scenarioVerdict($: EngineInterface, ctx: Ctx, id: string, runId: string): Promise<{ row?: RookScenarioRow; verdictPath?: string }> {
  const loc = ctx.located ?? (await where($, ctx))

  if (loc === undefined) {
    return {}
  }

  const verdictPath = `${loc.agentDir}/runs/${runId}/scenarios/${id}/verdict.yaml`
  const cached = ctx.rows.get(`${runId}/${id}`)

  if (cached !== undefined) {
    return { row: cached, verdictPath }
  }

  const text = await ioOf($, ctx).read(verdictPath)
  const row = text === undefined ? undefined : rowOf(id, text, undefined)

  return row === undefined ? { verdictPath } : { row, verdictPath }
}

/**
 * A row opens the scenario drill-down on its newest verdict. One never run
 * has no evidence yet: it still unfolds to its file's goal and criteria.
 */
async function scenarioOpen($: EngineInterface, ctx: Ctx, id: string): Promise<void> {
  const current = (await read($, snapshotAtom))?.current.find(row => row.id === id)

  if (current === undefined) {
    await update($, scenarioDetailAtom, was => (was === id ? null : id))

    return
  }

  await update($, scenarioDetailAtom, () => null)
  await openDetail($, ctx, current.runId, id)
}

async function scenarioRunSelected($: EngineInterface): Promise<void> {
  const selected = await read($, selectedAtom)

  if (selected.length === 0) {
    return
  }

  const rate = creditsPerScenario((await read($, snapshotAtom))?.latest)
  const label = `Run ${selected.length} selected scenario${selected.length === 1 ? '' : 's'}: ${clip(selected.join(', '), 80)}`

  await askConfirm($, { action: 'run', only: selected, label, ...(rate !== undefined && { credits: rate * selected.length }) })
}

/** Exclude or include the selected scenarios (rook scenarios exclude|include): no credits, no confirm. */
async function scenarioCurate($: EngineInterface, ctx: Ctx, verb: 'exclude' | 'include'): Promise<void> {
  const selected = await read($, selectedAtom)

  if (selected.length === 0) {
    return
  }

  const text = await curateReply($, ctx, verb, selected)

  ctx.scenarioList = undefined // the files changed under the same names
  await update($, selectedAtom, () => [])
  $.ui.toast(toastText(text.startsWith('rook') ? text : `rook: ${text}`))
}

/** One failing scenario handed to Claude, whichever run its newest verdict is from. */
async function scenarioFix($: EngineInterface, ctx: Ctx, id: string): Promise<void> {
  const loc = ctx.located ?? (await where($, ctx))
  const current = (await read($, snapshotAtom))?.current.find(row => row.id === id)

  if (loc === undefined || current === undefined) {
    return
  }

  const { row, verdictPath } = await scenarioVerdict($, ctx, id, current.runId)

  if (row === undefined || verdictPath === undefined) {
    return
  }

  await $.prompt.submit({
    text:
      `rook run ${current.runId} against agent ${loc.agentId}:\n${scenarioFailureNote(row, verdictPath)}\n\n` +
      `Fix this. If the evidence shows the criterion is wrong rather than the agent, say so. Then re-test with the rook run tool, passing only ${id}.`,
  })
}

/** Ask Claude to pin a failure as a regression scenario of its feature, with the rook generate tool. */
async function scenarioRegression($: EngineInterface, ctx: Ctx, id: string): Promise<void> {
  const info = (await scenarioList($, ctx)).find(s => s.id === id)
  const current = (await read($, snapshotAtom))?.current.find(row => row.id === id)

  if (info === undefined) {
    return
  }

  const verdict = current === undefined ? {} : await scenarioVerdict($, ctx, id, current.runId)

  await $.prompt.submit({ text: regressionPrompt(info, verdict.row, verdict.verdictPath) })
}

async function scenarioAskFlaky($: EngineInterface, id: string): Promise<void> {
  const rate = creditsPerScenario((await read($, snapshotAtom))?.latest)

  await askConfirm($, {
    action: 'flaky',
    id,
    times: FLAKY_DEFAULT,
    label: `Re-run ${id} ${FLAKY_DEFAULT}× in a row (flaky check)`,
    ...(rate !== undefined && { credits: rate * FLAKY_DEFAULT }),
  })
}

/** The generate box: Enter passes the text, the button reads the draft. */
async function scenarioGenerate($: EngineInterface, text?: string): Promise<void> {
  if (text !== undefined) {
    await update($, draftAtom, () => text)
  }

  const instruction = (text ?? (await read($, draftAtom))).trim()

  if (instruction === '') {
    $.ui.toast(toastText('rook: type what the new scenarios should cover first.'))

    return
  }

  await askConfirm($, { action: 'generate', instruction: instruction.slice(0, 2000), label: `Generate scenarios: ${clip(instruction, 80)}` })
}

/**
 * A flaky check: one scenario run `times` times one after another, in the
 * background, under the one-run-at-a-time rule. Each verdict lands in
 * `flaky[id]`; verdicts that disagree mark the scenario flaky.
 */
async function flakyStart($: EngineInterface, ctx: Ctx, id: string, times: number, source: 'command' | 'pane'): Promise<string> {
  if ((await read($, runningAtom)) !== null) {
    return 'rook: a run is already in progress.'
  }

  const args = runArgs({ only: [id], name: `flaky check ${id}` }, ctx.approval)

  if ('error' in args) {
    return `rook: ${args.error}`
  }

  const unready = await setupBlock($, ctx, NEEDS.run, 'run')

  if (unready !== undefined) {
    return `rook: ${unready}`
  }

  const blocked = (await prodBlock($, ctx)) ?? (await budgetBlock($, ctx, 'run'))

  if (blocked !== undefined) {
    return blocked
  }

  const startedAt = await $.clock.now()

  await update($, runningAtom, () => ({ startedAt, label: `${id} ×${times} (flaky check)`, source }))
  await update($, lastErrorAtom, () => null)
  // Its newest earlier verdict counts too: Pass before, then Fail twice, is flaky.
  const prior = (await read($, snapshotAtom))?.current.find(row => row.id === id)?.status

  await update($, flakyAtom, flaky => ({ ...flaky, [id]: [] }))
  await update($, flakyPriorAtom, priors => {
    const { [id]: _, ...rest } = priors

    return prior === undefined ? rest : { ...rest, [id]: prior }
  })
  await showStatus($, ctx)
  $.clock.after(0, () => flakyLoop($, ctx, id, times, args.argv, prior))

  return `rook: re-running ${id} ${times} times in a row in the background. The Scenarios tab marks it flaky if the verdicts disagree.`
}

async function flakyLoop($: EngineInterface, ctx: Ctx, id: string, times: number, argv: string[], prior?: RookStatus): Promise<void> {
  const verdicts: RookStatus[] = []
  let problem: string | undefined

  try {
    for (let at = 0; at < times; at += 1) {
      const blocked = at === 0 ? undefined : await budgetBlock($, ctx, 'run')

      if (blocked !== undefined) {
        problem = blocked
        break
      }

      const result = await rookRun($, ctx, argv)
      const loc = ctx.located ?? (await where($, ctx))
      const said = (result.doc as { run_id?: unknown } | undefined)?.run_id
      const runId = typeof said === 'string' && RUN_ID.test(said) ? said : loc === undefined ? undefined : (await runIds(ioOf($, ctx), loc.agentDir))[0]

      if (runId !== undefined) {
        await update($, seenAtom, () => runId) // reported here, not as a run that finished elsewhere
      }

      const status = runId === undefined ? undefined : (await scenarioVerdict($, ctx, id, runId)).row?.status

      if (status === undefined) {
        problem = failureOf(result) ?? `run ${at + 1} left no verdict for ${id}`
        break
      }

      verdicts.push(status)
      await update($, flakyAtom, flaky => ({ ...flaky, [id]: [...verdicts] }))
    }
  } catch (error) {
    problem = `could not start ${ctx.bin} — ${clip(String(error), 120)}`
  } finally {
    await update($, runningAtom, () => null)
    await poll($, ctx)
    await refreshBalance($, ctx)
  }

  if (problem !== undefined) {
    const at = await $.clock.now()

    await update($, lastErrorAtom, () => ({ source: 'run', text: `flaky check of ${id}: ${clip(problem!, 400)}`, at }))
  }

  $.ui.toast(toastText(`rook: ${flakyText(id, verdicts, times, prior)}`))
}

/** `/rook flaky <id> [times]`. */
async function flakyReply($: EngineInterface, ctx: Ctx, args: string[]): Promise<string> {
  const parsed = parseFlakyArgs(args)

  return 'error' in parsed ? `rook: ${parsed.error}` : flakyStart($, ctx, parsed.id, parsed.times, 'command')
}

// ══ end feature: scenarios tab ═══════════════════════════════════════════════

// ══ feature: setup tab (profile wizard, sync, budget) ════════════════════════

/**
 * Refuses a run or generate that the session's credit budget would not cover;
 * undefined when allowed. Spent is the balance when the budget was set minus
 * the balance now (`rook plan`), so it counts spending from a terminal too.
 * A run's estimate is the latest run's credits per scenario times `count`
 * (the scenarios asked for, or every scenario), else the latest run's credits.
 */
async function budgetBlock($: EngineInterface, ctx: Ctx, kind: 'run' | 'generate', count?: number): Promise<string | undefined> {
  const budget = await read($, budgetAtom)

  if (budget === null) {
    return undefined
  }

  const spent = spentOf(budget, await refreshBalance($, ctx))

  if (spent !== budget.spent) {
    await update($, budgetAtom, now => (now === null ? null : { ...now, spent }))
  }

  const latest = (await read($, snapshotAtom))?.latest
  // A cancelled or running latest run has no credits yet: price it at the newest finished run's rate.
  const recent = (await read($, historyAtom))?.find(run => run.credits !== undefined && run.planned > 0)
  const rate = creditsPerScenario(latest) ?? (recent === undefined ? undefined : recent.credits! / recent.planned)
  const planned = count ?? ctx.agentIndex?.scenarios.length ?? latest?.planned
  const estimate =
    kind === 'generate' ? GENERATE_ESTIMATE : rate !== undefined && planned !== undefined && planned > 0 ? rate * planned : latest?.finished ? latest.credits : undefined

  return budgetRefusal({ ...budget, spent }, kind, estimate)
}

/** `/rook budget <credits>|off|status`. */
async function budgetReply($: EngineInterface, ctx: Ctx, args: string[]): Promise<string> {
  const parsed = parseBudget(args)

  if (typeof parsed === 'object' && parsed !== null) {
    return `rook: ${parsed.error}`
  }

  if (parsed === null) {
    await update($, budgetAtom, () => null)

    return 'rook: budget off. Runs and generates are limited only by the credit balance.'
  }

  const balance = await refreshBalance($, ctx)
  const before = await read($, budgetAtom)

  if (parsed === undefined) {
    if (before === null) {
      return `rook: ${budgetText(null, balance)}`
    }

    const spent = spentOf(before, balance)
    await update($, budgetAtom, now => (now === null ? null : { ...now, spent }))

    return `rook: ${budgetText({ ...before, spent }, balance)}`
  }

  // A raise keeps counting from when the budget was first set.
  const startBalance = before?.startBalance ?? (balance === null ? undefined : balance)
  const next = { limit: parsed, spent: 0, ...(startBalance !== undefined && { startBalance }) }
  const budget = { ...next, spent: spentOf(next, balance) }

  await update($, budgetAtom, () => budget)

  return `rook: ${budgetText(budget, balance)}. Runs and generates that would go past it are refused.`
}

/** `rook status --json` as the Setup tab's sync state, or why it could not be read. */
async function syncStatus($: EngineInterface, ctx: Ctx): Promise<SyncState | { failed: string }> {
  const status = await rookJson($, ctx, ['status', '--json'])
  const problem = failureOf(status)

  return status.doc === undefined || problem !== undefined ? { failed: `rook status failed: ${problem ?? 'no output'}` } : syncStateOf(status.doc, await $.clock.now())
}

/** "Check sync state": `rook status --json`, no credits. */
async function checkSync($: EngineInterface, ctx: Ctx): Promise<string> {
  const blocked = await setupBlock($, ctx, NEEDS.status, 'read sync state')

  if (blocked !== undefined) {
    await update($, syncAtom, now => ({ checkedAt: now?.checkedAt ?? 0, offline: now?.offline ?? false, agents: now?.agents ?? [], error: blocked }))

    return `rook: ${blocked}`
  }

  const state = await syncStatus($, ctx)

  if ('failed' in state) {
    await update($, syncAtom, now => ({ checkedAt: now?.checkedAt ?? 0, offline: now?.offline ?? false, agents: now?.agents ?? [], error: state.failed }))

    return state.failed
  }

  await update($, syncAtom, () => state)

  return syncStateText(state)
}

/**
 * `/rook sync`, the pane's Sync upstream and the sync tool: `rook sync`
 * records the project (every agent, or `agent`) upstream as one write, then
 * `rook status --json` says where it stands. No credits: rook sends what is on
 * disk to rook-api and calls no model and not the agent.
 */
async function syncReply($: EngineInterface, ctx: Ctx, agent?: string): Promise<string> {
  const args = syncArgs(agent)

  if ('error' in args) {
    return `rook: ${args.error}`
  }

  const blocked = await setupBlock($, ctx, NEEDS.profileTest, 'sync')

  if (blocked !== undefined) {
    return `rook: ${blocked}`
  }

  const before = await read($, syncAtom)

  if (before?.isSyncing === true) {
    return 'rook: a sync is already in progress.'
  }

  await update($, syncAtom, now => ({ checkedAt: now?.checkedAt ?? 0, offline: now?.offline ?? false, agents: now?.agents ?? [], isSyncing: true }))

  let text: string
  let isFailed = false

  try {
    const result = await rookRun($, ctx, args.argv)

    isFailed = result.exitCode !== 0
    text = syncText(result.exitCode, result.stdout ?? '', result.stderr)

    if (isFailed) {
      text = await explained($, ctx, result, text, NEEDS.profileTest, 'sync')
    }
  } catch (error) {
    isFailed = true
    text = `rook sync failed: could not start ${ctx.bin} — ${clip(String(error), 120)}`
  }

  const state = await syncStatus($, ctx)
  const head = text.split('\n')[0] ?? ''

  await update($, syncAtom, now => ({
    ...('failed' in state ? { checkedAt: now?.checkedAt ?? 0, offline: now?.offline ?? false, agents: now?.agents ?? [] } : state),
    ...(isFailed ? { error: head } : { said: head }),
  }))
  ctx.isDirty = true
  await poll($, ctx)

  return 'failed' in state ? `${text}\n${state.failed}` : `${text}\n${syncStateText(state)}`
}

async function paneSync($: EngineInterface, ctx: Ctx): Promise<void> {
  $.ui.toast(toastText(clip(await syncReply($, ctx), 300)))
}

async function paneCheckSync($: EngineInterface, ctx: Ctx): Promise<void> {
  await checkSync($, ctx)
}

async function paneUseProfile($: EngineInterface, ctx: Ctx, id: string): Promise<void> {
  const answer = await profileReply($, ctx, { action: 'use', profile: id })

  $.ui.toast(toastText(clip('deny' in answer ? answer.deny : answer.result, 200)))
}

/** The Setup tab's Test: one call to the agent spends credits, so it waits behind the Confirm bar. */
async function askProfileTest($: EngineInterface, id: string): Promise<void> {
  await askConfirm($, { action: 'profile-test', profile: id, label: `Test profile ${id}: one call to your agent` })
}

/** The confirmed profile test, in the background like `/rook profile test`. Called from confirmNow. */
async function paneProfileTest($: EngineInterface, ctx: Ctx, profile: string | undefined): Promise<void> {
  const request: ProfileRequest = { action: 'test', ...(profile !== undefined && { profile }) }

  $.ui.toast(toastText(`rook: testing ${profile ?? 'the active profile'}: one call to the agent. A toast says what came back.`))
  $.clock.after(0, async () => {
    const answer = await profileReply($, ctx, request).catch(error => ({ deny: `rook profile test failed: ${String(error)}` }))

    $.ui.toast(toastText(clip('deny' in answer ? answer.deny : answer.result, 300)))
    // The tab reads verified from state.json while drawing: draw it again now that rook wrote it.
    $.ui.invalidate('ui.render')
  })
}

/**
 * What the Setup tab shows past the checklist, read from disk while drawing:
 * the active agent's profiles, which are verified (`state.json`), which of
 * their variables rook's env store has (names only), and a connection file in
 * the repository root for the wizard.
 */
async function setupPanel($: EngineInterface, ctx: Ctx, canAct: boolean): Promise<SetupPanel | undefined> {
  const loc = ctx.located ?? (await where($, ctx))

  if (loc === undefined) {
    return undefined
  }

  const io = ioOf($, ctx)
  const ids = (await io.list(`${loc.agentDir}/profiles`))
    .filter(entry => entry.kind === 'file' && entry.name.endsWith('.yaml'))
    .map(entry => entry.name.replace(/\.yaml$/, ''))
    .filter(id => /^[\w.][\w.-]{0,63}$/.test(id))
  const texts = new Map<string, string>()

  for (const id of ids) {
    texts.set(id, (await io.read(`${loc.agentDir}/profiles/${id}.yaml`)) ?? '')
  }

  const named = (await io.read(`${loc.agentDir}/profiles/active`))?.trim()
  const activeId = named !== undefined && ids.includes(named) ? named : ids.length === 1 ? ids[0] : undefined
  const verified = verifiedProfiles(await io.read(`${loc.agentDir}/state.json`))
  // Only the names leave variableValues here: a value is never drawn.
  const isSet = new Set(Object.keys(await variableValues($, ctx, [...new Set([...texts.values()].flatMap(text => declaredVariables(text)))])))
  const profiles = ids.map(id => profileView(id, texts.get(id) ?? '', id === activeId, verified.has(id), isSet))
  let connectionFile: string | undefined

  for (const name of CONNECTION_FILES) {
    if ((await io.read(name)) !== undefined) {
      connectionFile = name
      break
    }
  }

  return {
    profiles,
    wizard: wizardOf(profiles, connectionFile),
    budgetLine: budgetText(await read($, budgetAtom), await read($, balanceAtom)),
    sync: await read($, syncAtom),
    canAct,
    settings: settingRows(ctx, await read($, lensAtom)),
    hasBudget: (await read($, budgetAtom)) !== null,
  }
}

// ══ end feature: setup tab ═══════════════════════════════════════════════════

// ══ feature: band (precise re-test) ══════════════════════════════════════════

/** A band toggle: untick a scenario to leave it out of Re-test, tick it to bring it back. */
async function toggleTicked($: EngineInterface, id: string): Promise<void> {
  await update($, untickedAtom, ids => (ids.includes(id) ? ids.filter(other => other !== id) : [...ids, id]))
}

/** The band's Details: the affected scenarios, each with why it was picked. */
async function toggleBandOpen($: EngineInterface): Promise<void> {
  await update($, bandOpenAtom, isOpen => !isOpen)
}

// ══ end feature: band ════════════════════════════════════════════════════════

// ══ feature: status line ═════════════════════════════════════════════════════

/** The trend and ETA's recent finished runs, cached in ctx until the runs on disk change. */
async function statusTrend($: EngineInterface, ctx: Ctx, snapshot: RookSnapshot | null): Promise<TrendPoint[]> {
  const loc = ctx.located

  if (snapshot === null || loc === undefined || snapshot.agentId !== loc.agentId) {
    return []
  }

  const key = `${loc.agentDir}#${snapshot.runCount ?? 0}#${snapshot.latest?.runId ?? ''}#${snapshot.latest?.finished === true}`

  if (ctx.statusTrend?.key !== key) {
    const io = ioOf($, ctx)

    ctx.statusTrend = { key, points: await recentRuns(io, loc.agentDir, await runIds(io, loc.agentDir)) }
  }

  return ctx.statusTrend.points
}
// ══ end feature: status line ═════════════════════════════════════════════════

// ══ feature: card (transcript verdict card) ══════════════════════════════════

/** The run a tool result names, read from disk; undefined when it cannot be read. */
async function cardRun($: EngineInterface, ctx: Ctx, runId: string): Promise<RookRunView | undefined> {
  const loc = ctx.located ?? (await where($, ctx))

  return loc === undefined ? undefined : readRun(ioOf($, ctx), loc.agentDir, runId, ctx.rows).catch(() => undefined)
}

/** The card's Open in pane: the Health tab, the pane open with the keys (the person asked for it). */
async function cardOpen($: EngineInterface): Promise<void> {
  await openPane($, { focus: true, tab: 'health' }).catch(() => undefined)
}

/** The card's Fix with Claude: the run's failures, read afresh from disk, handed to Claude. */
async function cardFix($: EngineInterface, ctx: Ctx, runId: string): Promise<void> {
  const run = await cardRun($, ctx, runId)

  if (run !== undefined && run.counts.fail > 0) {
    await fixWithClaude($, ctx, run)
  }
}

/** A finished run's tool result drawn as a card; the engine's own block where anything is missing. */
async function cardRender($: EngineInterface, ctx: Ctx, e: RenderInput<'ToolResult'>): Promise<RenderElement | undefined> {
  if (e.props.isErrored) {
    return undefined
  }

  const runId = runIdOf(e.props.output)
  const run = runId === undefined ? undefined : await cardRun($, ctx, runId)

  if (runId === undefined || run === undefined || !run.finished) {
    return undefined
  }

  const resolved = $.ui.resolve(e) as unknown as Partial<El>

  if (resolved.Box === undefined || resolved.Text === undefined || resolved.Button === undefined) {
    return undefined
  }

  return <VerdictCard el={resolved as El} card={cardFacts(run)} onOpen={() => cardOpen($)} onFix={() => cardFix($, ctx, runId)} />
}

/** The run tool's own row while Claude's run is in flight: judged so far and the lanes. */
async function cardProgressRender($: EngineInterface, e: RenderInput<'ToolUse'>): Promise<RenderElement | undefined> {
  if (!e.props.isRunning) {
    return undefined
  }

  const running = await read($, runningAtom)
  const run = (await read($, snapshotAtom))?.latest

  if (running?.source !== 'tool' || run === undefined || run.finished) {
    return undefined
  }

  await read($, tickAtom)
  const resolved = $.ui.resolve(e) as unknown as Partial<El>

  if (resolved.Box === undefined || resolved.Text === undefined) {
    return undefined
  }

  return <RunProgressRow el={resolved as El} progress={cardProgress(run)} />
}
// ══ end feature: card ════════════════════════════════════════════════════════

// ══ feature: ci ══════════════════════════════════════════════════════════════

/** `/rook ci`: write a CI workflow that runs rook on pull requests. */
async function ciReply($: EngineInterface, ctx: Ctx, args: string[]): Promise<string> {
  const request = parseCiArgs(args)

  return 'error' in request ? `rook: ${request.error}` : ciAnswer($, ctx, request)
}

/** What the workflow needs from this workspace: the active profile's variable names, the installed build. Never a value. */
async function ciPlan($: EngineInterface, ctx: Ctx, request: CiRequest): Promise<CiPlan | undefined> {
  const loc = ctx.located ?? (await where($, ctx))

  if (loc === undefined) {
    return undefined
  }

  const target = await profileOf($, ctx)
  const profileText = target === undefined ? undefined : await ioOf($, ctx).read(`${loc.agentDir}/profiles/${target.profileId}.yaml`)
  // `rook --version`: a semver pins the npm install in CI; a build's commit does not, and CI installs latest.
  const version = await $.process
    .run([ctx.bin, '--version'], { env: CLI_ENV, stdin: '', timeoutMs: 10_000 })
    .then(ran => (ran.exitCode === 0 ? /\b\d+\.\d+\.\d+(?:[-+][\w.-]+)?\b/.exec(ran.stdout)?.[0] : undefined))
    .catch(() => undefined)

  return {
    ...(target !== undefined && profileText !== undefined && { profileId: target.profileId }),
    variables: profileText === undefined ? [] : declaredVariables(profileText),
    ...(version !== undefined && { version }),
    allowRules: ctx.approval.allowRules,
    failOnUnverifiable: request.failOnUnverifiable,
  }
}

/** Preview, or write the workflow when asked and nothing is there (or `force`). Shared by /rook ci and the ci tool. */
async function ciAnswer($: EngineInterface, ctx: Ctx, request: CiRequest): Promise<string> {
  const plan = await ciPlan($, ctx, request)

  if (plan === undefined) {
    return 'rook: no rook workspace here. /rook ci writes a workflow for the agent set up in this directory (/rook explore sets one up).'
  }

  const yaml = workflowYaml(plan)
  const path = ctx.cwd === '' ? WORKFLOW_PATH : `${ctx.cwd.replace(/\/$/, '')}/${WORKFLOW_PATH}`
  const exists = await $.fs.exists(path).catch(() => false)

  if (!request.write) {
    return previewText(plan, yaml, exists)
  }

  if (exists && !request.force) {
    return `rook: ${WORKFLOW_PATH} exists already and was left as it is. /rook ci shows what would replace it; /rook ci write --force replaces it.`
  }

  try {
    await $.fs.write(path, yaml)
  } catch (error) {
    return `rook: could not write ${WORKFLOW_PATH}: ${clip(String(error), 200)}`
  }

  return writtenText(plan)
}

// ══ end feature: ci ══════════════════════════════════════════════════════════

// ══ feature: drill-down (scenario evidence, owner actions, prompts) ══════════

/** What the drill-down shows and its actions act on, from state already read. Reads only: the render hook calls it too. */
type DrillState = {
  model: DetailModel
  info?: DrillScenarioInfo
  about: PromptAbout
  /** The same scenario's verdict in the run before, for the cost comparison. */
  rowBefore?: { runId: string; row: RookScenarioRow }
}

async function drillState($: EngineInterface, ctx: Ctx, detail: { runId: string; id: string }, evidence: RookEvidence | null, canRun: boolean): Promise<DrillState> {
  const { id, runId } = detail
  const snapshot = await read($, snapshotAtom)
  const verdicts = await read($, verdictsAtom)
  const prior = (await read($, flakyPriorAtom))[id]
  const checked = (await read($, flakyAtom))[id] ?? []
  const { row } = await scenarioVerdict($, ctx, id, runId)
  const info = (await scenarioList($, ctx)).find(s => s.id === id)
  const latest = snapshot?.latest
  const model = detailModel({
    id,
    runId,
    lens: await read($, lensAtom),
    evidence,
    row,
    verdicts,
    clusters: latest?.runId === runId ? latest.clusters : [],
    stamps: sourceStampsNow(ctx),
    checked: checked.length === 0 || prior === undefined ? checked : [prior, ...checked],
    canRun,
  })
  // The history ends at this run when it holds it; otherwise this run is newer than anything it holds.
  const previous = model.history.at(model.history.at(-1)?.runId === runId ? -2 : -1)?.runId
  const before = previous === undefined ? undefined : (await scenarioVerdict($, ctx, id, previous)).row
  const agentDir = ctx.located?.agentDir
  const profileId = snapshot?.profileId

  return {
    model,
    ...(info !== undefined && { info }),
    ...(previous !== undefined && before !== undefined && { rowBefore: { runId: previous, row: before } }),
    about: {
      ...(snapshot?.agentId !== undefined && { agentId: snapshot.agentId }),
      ...(profileId !== undefined && { profileId }),
      ...(info?.class !== undefined && { cls: info.class }),
      ...(row?.compromised === true && { compromised: true }),
      ...(agentDir !== undefined && { scenarioPath: `${agentDir}/scenarios/${id}.yaml` }),
      ...(agentDir !== undefined && profileId !== undefined && { profilePath: `${agentDir}/profiles/${profileId}.yaml` }),
    },
  }
}

/** One of the drill-down's actions: a prompt to Claude, or a credit-spending one parked in the confirm bar. */
async function drillAction($: EngineInterface, ctx: Ctx, action: DetailActionId): Promise<void> {
  const detail = await read($, detailAtom)
  const evidence = await read($, evidenceAtom)

  if (detail === null) {
    return
  }

  const { id } = detail

  if (action === 'rerun3') {
    await scenarioAskFlaky($, id)

    return
  }

  if (action === 'retest') {
    const rate = creditsPerScenario((await read($, snapshotAtom))?.latest)

    await askConfirm($, { action: 'run', only: [id], label: `Re-test ${id}`, ...(rate !== undefined && { credits: rate }) })

    return
  }

  if (action === 'regression') {
    await scenarioRegression($, ctx, id)

    return
  }

  const state = await drillState($, ctx, detail, evidence, true)

  if (action === 'testProfile') {
    const profile = state.about.profileId

    await askConfirm($, { action: 'profile-test', ...(profile !== undefined && { profile }), label: `Test profile ${profile ?? '(active)'}: one call to your agent` })

    return
  }

  const owner = state.model.owner

  if (evidence === null || owner === undefined) {
    return
  }

  const { changed } = state.model
  const text =
    action === 'bug'
      ? bugReportPrompt(evidence, owner, changed, state.about)
      : action === 'fixAgent'
        ? fixAgentPrompt(evidence, owner, changed, state.about)
        : action === 'fixProfile'
          ? fixProfilePrompt(evidence, owner, state.about)
          : fixScenarioPrompt(evidence, owner, state.about, action === 'sharpen' ? 'sharpen' : action === 'tighten' ? 'tighten' : 'fix')

  await $.prompt.submit({ text })
}

// ══ end feature: drill-down ══════════════════════════════════════════════════

// ══ feature: home (Release for QE, My change for dev) ════════════════════════

/**
 * What the first tab reads that the poll does not keep: the feature files (per
 * change of the scenario set) and what each edited file reaches (per change of
 * the edits). Caches, not state: a drawing reads them, never writes an atom.
 */
const homeCache: { features?: { key: string; list: HomeFeature[] }; reach?: { key: string; reaches: Map<string, Reach | undefined> } } = {}

async function homeFeatures($: EngineInterface, ctx: Ctx): Promise<HomeFeature[]> {
  const loc = ctx.located

  if (loc === undefined) {
    return []
  }

  const key = `${loc.agentDir}#${ctx.indexSignature ?? ''}`

  if (homeCache.features?.key !== key) {
    homeCache.features = { key, list: await readFeatures(ioOf($, ctx), loc.agentDir) }
  }

  return homeCache.features.list
}

/** Every scenario's newest verdict as a full row: the latest run's own, else the row cache or its verdict.yaml. */
async function homeRows($: EngineInterface, ctx: Ctx, snapshot: RookSnapshot): Promise<HomeRow[]> {
  const latest = snapshot.latest
  const rows: HomeRow[] = []

  for (const current of snapshot.current) {
    const own = latest?.runId === current.runId ? latest.rows.find(row => row.id === current.id) : undefined
    const row = own ?? (await scenarioVerdict($, ctx, current.id, current.runId)).row

    if (row !== undefined) {
      rows.push({ ...row, title: row.title || current.title, runId: current.runId })
    }
  }

  return rows
}

async function homeInput($: EngineInterface, ctx: Ctx, snapshot: RookSnapshot): Promise<HomeInput> {
  return {
    rows: await homeRows($, ctx, snapshot),
    ...(snapshot.latest !== undefined && { latest: snapshot.latest }),
    verdicts: await read($, verdictsAtom),
    scenarios: await scenarioList($, ctx),
    features: await homeFeatures($, ctx),
  }
}

/** Tracked files edited since the last green run (and those the band saw edited), each with the scenarios it reaches. */
async function homeChanged($: EngineInterface, ctx: Ctx, lastGreen: string | undefined, rows: readonly HomeRow[]): Promise<ChangedFile[]> {
  const loc = ctx.located

  if (loc === undefined) {
    return []
  }

  const stale = await read($, staleAtom)
  // With no green run to measure from, the change is what was edited since this session started.
  const since = lastGreen === undefined ? ctx.sessionStartedAt : runStartMs(lastGreen)
  const edits = new Map(changedSince(sourceStampsNow(ctx), since).map(f => [f.path, f.mtimeMs]))

  for (const file of stale?.files ?? []) {
    if (!edits.has(file)) {
      edits.set(file, stale!.since)
    }
  }

  if (edits.size === 0) {
    return []
  }

  const io = ioOf($, ctx)
  const key = `${loc.agentDir}#${ctx.indexSignature ?? ''}#${[...edits].map(([path, at]) => `${path}@${at}`).join(',')}`

  if (homeCache.reach?.key !== key) {
    const index = ctx.agentIndex ?? (await indexAgent(io, loc.agentDir))
    const reaches = new Map<string, Reach | undefined>()

    for (const path of edits.keys()) {
      reaches.set(path, await reach(index, path, file => io.read(file)).catch(() => undefined))
    }

    homeCache.reach = { key, reaches }
  }

  const reaches = homeCache.reach.reaches
  const staleIds = new Set(stale?.scenarios.map(s => s.id) ?? [])
  const byId = new Map(rows.map(row => [row.id, row]))

  return [...edits]
    .sort((a, b) => b[1] - a[1])
    .map(([path, mtimeMs]) => {
      const reached = reaches.get(path)

      return {
        path,
        mtimeMs,
        scenarios: (reached?.scenarios ?? []).map(s => {
          const row = byId.get(s.id)

          return { id: s.id, ...(row !== undefined && { status: row.status }), isStale: isStaleVerdict(row?.runId, mtimeMs, staleIds, s.id) }
        }),
        ...(reached?.reason !== undefined && { reason: reached.reason }),
      }
    })
}

/** Everything My change shows and acts on. */
async function homeChange($: EngineInterface, ctx: Ctx, snapshot: RookSnapshot) {
  const input = await homeInput($, ctx, snapshot)
  const owned = ownedOf(input)
  const lastGreen = lastGreenOf(input.verdicts)
  const regressions = regressionsOf(owned, input.verdicts, lastGreen)
  const changed = await homeChanged($, ctx, lastGreen, input.rows)
  const latest = snapshot.latest
  const runs = historyRuns(input.verdicts)
  const at = latest === undefined ? -1 : runs.indexOf(latest.runId)
  const previousRunId = at > 0 ? runs[at - 1] : undefined
  const before: RookScenarioRow[] = []

  if (previousRunId !== undefined) {
    for (const h of input.verdicts.filter(v => v.runs.some(r => r.runId === previousRunId))) {
      const row = (await scenarioVerdict($, ctx, h.id, previousRunId)).row

      if (row !== undefined) {
        before.push(row)
      }
    }
  }

  const stale = await read($, staleAtom)
  const affected = [...new Set([...changed.flatMap(f => f.scenarios.map(s => s.id)), ...(stale?.scenarios.map(s => s.id) ?? [])])]
  const notYours = notYoursLine(owned)

  const regressed = new Set(regressions.map(o => o.id))

  return {
    ...(lastGreen !== undefined && { lastGreen, isGreen: isGreenRun(input.verdicts, lastGreen) }),
    regressions,
    stillFailing: owned.filter(o => o.owner === 'agent' && !regressed.has(o.id)),
    changed,
    cost: costOf(latest?.rows ?? [], before),
    ...(previousRunId !== undefined && { previousRunId }),
    ...(notYours !== undefined && { notYours }),
    affected,
  }
}

/** Draft bug reports for the blockers [d]: Claude writes them from the evidence alone. */
async function homeDraft($: EngineInterface, ctx: Ctx): Promise<void> {
  const loc = ctx.located ?? (await where($, ctx))
  const snapshot = await read($, snapshotAtom)

  if (loc === undefined || snapshot === null) {
    return
  }

  const release = releaseOf(await homeInput($, ctx, snapshot))

  if (release.blockers.length > 0) {
    await $.prompt.submit({ text: blockersReportPrompt({ agentId: loc.agentId, agentDir: loc.agentDir, blockers: release.blockers }) })
  }
}

/** Generate for gaps [n]: through the generate confirm, naming the features no scenario covers. */
async function homeGenerate($: EngineInterface, ctx: Ctx): Promise<void> {
  if (ctx.located === undefined) {
    return
  }

  const gaps = coverageOf(await homeFeatures($, ctx), await scenarioList($, ctx)).gaps

  if (gaps.length > 0) {
    await askConfirm($, {
      action: 'generate',
      instruction: gapsInstruction(gaps).slice(0, 2000),
      label: `Generate scenarios for ${plural(gaps.length, 'uncovered feature')}: ${clip(gaps.map(f => f.id).join(', '), 60)}`,
    })
  }
}

/** Fix N with Claude [x]: the regressions' evidence and the files changed since the last green run. */
async function homeFix($: EngineInterface, ctx: Ctx): Promise<void> {
  const loc = ctx.located ?? (await where($, ctx))
  const snapshot = await read($, snapshotAtom)

  if (loc === undefined || snapshot === null) {
    return
  }

  const change = await homeChange($, ctx, snapshot)

  if (change.regressions.length > 0) {
    await $.prompt.submit({ text: fixChangePrompt({ agentId: loc.agentId, agentDir: loc.agentDir, ...change }) })
  }
}

/** Re-test stale/affected [a]: the run confirm with only the scenarios the edits reach. */
async function homeRetest($: EngineInterface, ctx: Ctx): Promise<void> {
  const snapshot = await read($, snapshotAtom)

  if (snapshot === null) {
    return
  }

  const { affected } = await homeChange($, ctx, snapshot)

  if (affected.length > 0) {
    await confirmRun($, snapshot.latest, `Re-test ${plural(affected.length, 'affected scenario')}`, affected)
  }
}

// ══ end feature: home ════════════════════════════════════════════════════════

// ══ feature: trends (heat grid, runs per scenario) ═══════════════════════════

/** Each finished run's pass rate, trusted pass rate and tokens, read once per run (a finished run never changes). */
const trendCache = new Map<string, TrendRun>()

/** The Trends tab's runs: the newest finished runs from the Runs tab's history, oldest first. Reads disk once per run. */
async function trendRunsNow($: EngineInterface, ctx: Ctx): Promise<TrendRun[]> {
  const loc = ctx.located
  const history = await read($, historyAtom)

  if (loc === undefined || history === null) {
    return []
  }

  return trendRuns(ioOf($, ctx), loc.agentDir, history, ctx.rows, trendCache).catch(() => [])
}

/** The opened run against the finished run listed before it: set when the Runs tab opens a run. */
async function refreshRunVersus($: EngineInterface, ctx: Ctx, run: RookRunView): Promise<void> {
  const loc = ctx.located ?? (await where($, ctx))
  const previous = previousRunId(await read($, historyAtom), run.runId)
  const verdicts = await read($, verdictsAtom)
  // Each scenario against its own verdict before this run, as the status line and Trends count it:
  // the run listed before may not have judged the same scenarios.
  const before = run.rows.flatMap(row => {
    const was = verdictsBefore(verdicts, row.id, run.runId).at(-1)

    return was === undefined ? [] : [{ id: row.id, status: was }]
  })

  await update($, runVersusAtom, () =>
    loc === undefined || (previous === undefined && before.length === 0) ? null : { runId: run.runId, previous: previous ?? '', ...versusPrevious(before, run.rows) },
  )
}

/** What the heat grid posted: a cell opens that verdict in the drill-down; a key it does not use is the pane's hotkey. */
async function heatMessage($: EngineInterface, ctx: Ctx, data: unknown): Promise<void> {
  const message = heatMessageOf(data)

  if (message?.type === 'pick') {
    await openDetail($, ctx, message.runId, message.id)
  } else if (message?.type === 'key') {
    const tab = TAB_KEYS[message.key]

    if (tab !== undefined) {
      await setTab($, tab)
    } else if (message.key === 'l') {
      await toggleLens($)
    }
  }
}

// ══ end feature: trends ══════════════════════════════════════════════════════

// ══ feature: live (run band, streamed results, stale verdicts, status line) ══

/** Fold the latest poll into `live`: whose run is in flight, its verdicts' order, a landing and its new failures. */
async function liveTrack($: EngineInterface, ctx: Ctx): Promise<LiveState | null> {
  const snapshot = await read($, snapshotAtom)
  const prev = await read($, liveAtom)
  const next = nextLive(prev, {
    ...(snapshot?.agentId !== undefined && { agentId: snapshot.agentId }),
    ...(snapshot?.latest !== undefined && { latest: snapshot.latest }),
    current: snapshot?.current ?? [],
    running: await read($, runningAtom),
    isPrimed: ctx.isPrimed,
    now: await $.clock.now(),
  })

  if (next !== prev) {
    await update($, liveAtom, () => next)
  }

  return next
}

/** A scenario's row as a run judged it, when this load has read it. */
function rowAtOf(ctx: Ctx): (runId: string, id: string) => RookScenarioRow | undefined {
  return (runId, id) => ctx.rows.get(`${runId}/${id}`)
}

/** The run band's and the new-failure band's Open: the pane, focused, on its first tab. */
async function liveOpen($: EngineInterface): Promise<void> {
  await openPane($, { focus: true, tab: 'health' }).catch(() => undefined)
}

/** The new-failure band's Dismiss. */
async function liveDismiss($: EngineInterface): Promise<void> {
  await update($, liveAtom, s => {
    if (s === null || s.newFail === undefined) {
      return s
    }

    const { newFail: _gone, ...rest } = s

    return rest
  })
}

/** The band above the prompt for a run in flight, or a run from elsewhere that broke what passed; undefined for neither. */
async function liveBand($: EngineInterface, ctx: Ctx, e: RenderInput<'AbovePrompt'>): Promise<RenderElement | undefined> {
  const running = await read($, runningAtom)
  const run = (await read($, snapshotAtom))?.latest
  const el = $.ui.resolve(e) as unknown as El

  if (running !== null || (run !== undefined && !run.finished)) {
    await read($, tickAtom)

    return (
      <RunBand
        el={el}
        text={runBandText(run?.finished ? undefined : run, running, await $.clock.now())}
        canCancel={running !== null && running.source !== 'tool'}
        onOpen={() => liveOpen($)}
        onCancel={() => cancelRun($, ctx)}
      />
    )
  }

  const newFail = (await read($, liveAtom))?.newFail

  return newFail === undefined ? undefined : <NewFailBand el={el} newFail={newFail} onOpen={() => liveOpen($)} onDismiss={() => liveDismiss($)} />
}
// ══ end feature: live ════════════════════════════════════════════════════════

// ══ feature: keys (focus, hotkeys, fresh repo, setup toggles) ════════════════

type KeysCache = {
  /** The last scan of a repository with no agent, keyed by its top-level listing. */
  repo?: { key: string; found: RookRepoFound[] }
  /** Settings /config refused to write: changed for this session only. */
  sessionOnly?: Set<SettingRow['id']>
}

/** What the repository holds that rook could start from: scanned again only when its top level changes. Called by poll with no agent. */
async function repoFoundNow($: EngineInterface, ctx: Ctx): Promise<RookRepoFound[]> {
  const io = ioOf($, ctx)
  const top = await io.list('.')
  const key = listingKey(top)
  const cache = (ctx.keys ??= {})

  if (cache.repo?.key !== key) {
    cache.repo = { key, found: await scanRepo(io, top).catch(() => []) }
  }

  return cache.repo.found
}

/** This session's folder name: what a project created from the guided start is called. */
function folderOf(ctx: Ctx): string {
  return ctx.cwd.split('/').filter(Boolean).at(-1) ?? ''
}

/**
 * An agent with no runs here (a workspace pulled from git): every step left
 * before the first run, the next one with its command and its button. Null
 * once it has run. Read while drawing; writes nothing.
 */
async function firstRunLead($: EngineInterface, ctx: Ctx, el: El, snapshot: RookSnapshot, lens: RookLens, canAct: boolean) {
  if ((snapshot.runCount ?? 0) > 0 || snapshot.latest !== undefined || (await read($, runningAtom)) !== null) {
    return null
  }

  const panel = await setupPanel($, ctx, canAct)
  const facts: StartFacts = {
    readiness: snapshot.readiness,
    found: ctx.keys?.repo?.found ?? [],
    lens,
    folder: folderOf(ctx),
    profiles: (panel?.profiles ?? []).map(profile => ({
      id: profile.id,
      isActive: profile.isActive,
      isVerified: profile.isVerified,
      unset: profile.variables.filter(variable => !variable.isSet).map(variable => variable.name),
    })),
    ...(panel?.wizard?.connectionFile !== undefined && { connectionFile: panel.wizard.connectionFile }),
    runCount: snapshot.runCount ?? 0,
    scenarios: snapshot.current.length + snapshot.neverRun,
  }
  const steps = startSteps(facts)

  return nextStep(steps) === undefined ? null : (
    <NextStep el={el} steps={steps} isListed title="Before the first run" canAct={canAct} onAction={action => startAction($, ctx, action)} />
  )
}

/** A guided-start button: the setup tool, command or prompt that takes the step. Credit-spending steps wait behind the confirm bar. */
async function startAction($: EngineInterface, ctx: Ctx, action: StartAction): Promise<void> {
  switch (action.kind) {
    case 'recheck':
      return recheck($, ctx)
    case 'create-project':
      $.ui.toast(toastText(clip(await projectReply($, ctx, { action: 'create', name: action.arg ?? folderOf(ctx) }), 300)))
      return
    case 'pick-project':
    case 'pick-agent':
    case 'connection':
      await $.prompt.submit({ text: START_PROMPTS[action.kind] })
      return
    case 'explore':
      return askConfirm($, {
        action: 'explore',
        label: "Explore this repository: rook reads the code and writes the agent's features",
        ...(action.arg !== undefined && { instruction: action.arg }),
      })
    case 'generate':
      return askConfirm($, { action: 'generate', label: action.label, ...(action.arg !== undefined && { instruction: action.arg }) })
    case 'add-profile':
    case 'fill-env': {
      // Only the person can run these (they ask for or hold secrets): the line goes in their prompt, not to rook.
      const filled = await $.prompt.fill({ text: action.arg ?? '' }).catch(() => undefined)

      $.ui.toast(toastText(filled?.isFilled === false ? `rook: type ${action.arg ?? ''}` : 'rook: the command is in the prompt. Esc to get there, then Enter.'))
      return
    }
    case 'use-profile':
      return paneUseProfile($, ctx, action.arg ?? '')
    case 'test-profile':
      return askProfileTest($, action.arg ?? '')
    case 'first-run':
      return askConfirm($, { action: 'run', label: action.label })
  }
}

/** The confirmed explore from the guided start: in the background, as /rook explore runs it. Called from confirmNow. */
function exploreConfirmed($: EngineInterface, ctx: Ctx, instruction: string | undefined): void {
  $.ui.toast(toastText('rook: exploring this repository in the background (minutes, spends credits). A toast says what it found.'))
  $.clock.after(0, async () =>
    $.ui.toast(
      toastText(clip(await exploreRun($, ctx, instruction === undefined ? {} : { instruction }, undefined, 'background').catch(error => `rook explore failed: ${String(error)}`), 300)),
    ),
  )
}

const PANE_MODES = ['auto', 'command', 'off'] as const
const onOff = (value: boolean): string => (value ? 'on' : 'off')

/** The Setup tab's settings: the options that change the pane and the session, each with its key and where a change is kept. */
function settingRows(ctx: Ctx, lens: RookLens): SettingRow[] {
  const scope = (id: SettingRow['id']): SettingRow['scope'] => (ctx.keys?.sessionOnly?.has(id) ? 'this session' : 'kept')

  return [
    { id: 'pane', label: 'Pane opens', value: ctx.paneMode === 'auto' ? 'auto (at session start)' : ctx.paneMode === 'command' ? 'on /rook only' : 'off', scope: scope('pane'), hotkey: '6' },
    { id: 'retestBand', label: 'Re-test band', value: onOff(ctx.isRetestBand), scope: scope('retestBand'), hotkey: '7' },
    { id: 'failureContext', label: 'Failures as context', value: onOff(ctx.isFailureContext), scope: scope('failureContext'), hotkey: '8' },
    // A guard against writes to production is turned off deliberately: Enter on it, never a stray key.
    { id: 'prodGuard', label: 'Production guard', value: onOff(ctx.isProdGuard), scope: scope('prodGuard'), note: 'no key: Enter on it to change' },
    { id: 'lens', label: 'Pane view', value: LENS_LABEL[lens], scope: 'kept', note: 'l switches it' },
  ]
}

/**
 * A Setup tab setting: the lens through the shared toggle; the rest written
 * to the plugin's own /config row (`rook.<field>`), and applied to this load
 * at once. When /config refuses, the change holds for this session only, and
 * the row says so.
 */
async function toggleSetting($: EngineInterface, ctx: Ctx, id: SettingRow['id']): Promise<void> {
  if (id === 'lens') {
    return toggleLens($)
  }

  let value: string | boolean

  if (id === 'pane') {
    value = PANE_MODES[(PANE_MODES.indexOf(ctx.paneMode as (typeof PANE_MODES)[number]) + 1) % PANE_MODES.length]!
    ctx.paneMode = value
  } else if (id === 'retestBand') {
    value = ctx.isRetestBand = !ctx.isRetestBand
  } else if (id === 'failureContext') {
    value = ctx.isFailureContext = !ctx.isFailureContext
  } else {
    value = ctx.isProdGuard = !ctx.isProdGuard
  }

  const set = await $.config.set({ key: `rook.${id}`, value }).catch(error => ({ deny: String(error) }))
  const sessionOnly = ((ctx.keys ??= {}).sessionOnly ??= new Set())

  if (set.deny === undefined) {
    sessionOnly.delete(id)
  } else {
    sessionOnly.add(id)
    $.ui.toast(toastText(`rook: changed for this session only; /config did not keep it (${clip(set.deny, 120)}).`))
  }

  $.ui.invalidate('ui.render')
}

/** The Setup tab's budget box and Budget off: /rook budget, its answer as a toast. */
async function paneBudget($: EngineInterface, ctx: Ctx, args: string[]): Promise<void> {
  $.ui.toast(toastText(await budgetReply($, ctx, args)))
}

// ══ end feature: keys ════════════════════════════════════════════════════════

const APPROVALS_NOTE =
  "rook's own tool calls during the command (reading the agent's code, running its commands) are approved with --yes, " +
  'unless the person set allowRules, in which case only those are approved and rook declines the rest.'

const RUN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    only: {
      type: 'array',
      items: { type: 'string', pattern: '^SC-\\d{3,6}$' },
      minItems: 1,
      maxItems: 200,
      description: 'Scenario ids to run, e.g. ["SC-004"]. The rook scenarios tool lists them.',
    },
    class: { type: 'string', enum: ['functional', 'non-functional', 'adversarial'] },
    category: { type: 'string', pattern: '^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$', description: 'One rook category, e.g. prompt_injection' },
    tags: { type: 'array', items: { type: 'string', pattern: '^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$' }, minItems: 1, maxItems: 20, description: 'Scenario tags' },
    profile: { type: 'string', pattern: '^[\\w.-]{1,64}$', description: 'Which profile to call the agent through (local, staging…). Default: the active one' },
    name: { type: 'string', maxLength: 120, description: 'A label for the run' },
    concurrency: { type: 'integer', minimum: 1, maximum: 8, description: 'Scenarios in flight at once' },
    resume: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}Z(-\\d+)?$', description: 'Carry finished work from this run into a new one' },
    continueRun: {
      type: 'string',
      pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}Z(-\\d+)?$',
      description: 'Continue this run in place, running only `phases` (for evidence that lands later)',
    },
    phases: { type: 'array', items: { type: 'string', enum: ['prepare', 'open', 'execute', 'close', 'collect', 'judge'] }, minItems: 1, maxItems: 6 },
    test: { type: 'boolean', description: 'Keep the run local: not synced upstream' },
    rca: { type: 'boolean', description: 'Also explain failure clusters: cause, whose fault, and a proposed diff. Costs more credits' },
    instruction: { type: 'string', maxLength: 2000, description: "Free text for rook's run planner, e.g. 'only the refund paths'" },
  },
} as const

export const register: Register = (on, options) => {
  const ctx: Ctx = {
    bin: textOption(options.rookPath, 'rook'),
    paneMode: textOption(options.pane, 'auto'),
    isStatusLine: flagOption(options.statusLine, true),
    isRetestBand: flagOption(options.retestBand, true),
    isFailureContext: flagOption(options.failureContext, true),
    isProdGuard: flagOption(options.prodGuard, true),
    prodPatterns: textOption(options.prodPatterns, 'prod,production,live'),
    approval: { allowRules: allowRulesOf(textOption(options.allowRules, '')) },
    lensDefault: textOption(options.lens, 'qe') === 'dev' ? 'dev' : 'qe',
    cwd: '',
    located: undefined,
    agentIndex: undefined,
    isPolling: false,
    isPrimed: false,
    isDirty: false,
    indexSignature: undefined,
    viewer: undefined,
    rows: new Map(),
    cli: {},
  }

  on('session.start', async ($, e, next) => {
    const started = await next(e)
    ctx.cwd = e.cwd

    // session.start fires again on a hot reload, which kills any child the
    // previous load spawned: a run it marked as in flight is not anymore, nor
    // is the viewer it started.
    if ((await read($, runningAtom)) !== null) {
      await update($, runningAtom, () => null)
    }

    if ((await read($, viewerAtom)) !== null) {
      await update($, viewerAtom, () => null)
    }

    if ((await read($, explainingAtom)) !== null) {
      await update($, explainingAtom, () => null)
    }

    await $.command.register({
      name: 'rook',
      description:
        'rook agent testing: pane, tab, status, runs, compare, scenarios, flaky, agent, report, explain, run, generate, project, explore, profile, sync, budget, ci, ui, confirm-prod',
      argumentHint:
        '[pane|tab <name>|status|runs|compare|scenarios [exclude|include]|flaky <id>|agent [use]|report|explain [--rca]|run|generate|project|explore|profile|sync|budget|ci|ui|confirm-prod|help]',
    })
    await $.tool.register({
      name: 'run',
      description:
        'Run rook (TestMu AI agent assurance) scenarios against the agent under test in this workspace and return the verdicts: ' +
        'Pass / Fail / Unable to Verify per scenario, failures grouped into root-cause clusters (with cause, whose fault, and a proposed diff when rca ran), ' +
        'failing criteria with expected vs achieved and quoted evidence, and what nobody could verify. ' +
        "Use it after changing the agent's prompt, tools or code. It invokes the real agent (its writes are real) and spends rook credits, " +
        'so prefer `only` with the scenario ids you touched (the rook scenarios tool lists them). Unable to Verify is not Fail. A run can take minutes. ' +
        APPROVALS_NOTE,
      inputSchema: RUN_SCHEMA,
    })
    await $.tool.register({
      name: 'report',
      description:
        "Read a finished rook run from disk (no credits, no agent call): failures grouped into clusters with rook's causes and remedies, " +
        "failing criteria with rook's evidence, verification gaps, rook's next steps, credits. Defaults to the latest run. " +
        'With rca: true, rook first explains the run\'s clusters (cause, whose fault, a proposed diff) from the evidence it already has, ' +
        'without calling the agent again: free when this agent version was explained already, otherwise it costs credits and takes minutes. ' +
        APPROVALS_NOTE,
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          run_id: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}Z(-\\d+)?$' },
          rca: { type: 'boolean', description: 'Have rook explain the clusters first (rook report --rca). Costs credits unless already explained at this agent version' },
        },
      },
    })
    await $.tool.register({
      name: 'status',
      description: "rook's view of this workspace: the project's agents, scenario counts, sync state, unfinished runs. No credits.",
      inputSchema: { type: 'object', additionalProperties: false, properties: {} },
    })
    await $.tool.register({
      name: 'scenarios',
      description:
        "Every rook scenario of the agent under test: id, feature, class, category, title, its latest verdict, and whether it is excluded or cannot run. No credits. Use it to choose `only` for the rook run tool.",
      inputSchema: { type: 'object', additionalProperties: false, properties: {} },
    })
    await $.tool.register({
      name: 'runs',
      description:
        "The agent's runs on disk, newest first: run id, name, size, Pass / Fail / Unable to Verify, credits, and whether it was a local test run. No credits. Use it to find a run id for the rook report tool (and its rca option).",
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: { limit: { type: 'integer', minimum: 1, maximum: 100, description: 'How many of the newest runs (default 20)' } },
      },
    })
    await $.tool.register({
      name: 'agent',
      description:
        "The rook project's agents, the active one marked (rook agent). With `use`, make another agent active (rook agent use): " +
        'runs, scenarios and reports then follow it. No credits.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: { use: { type: 'string', pattern: '^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$', description: 'The agent id to make active' } },
      },
    })
    await $.tool.register({
      name: 'curate',
      description:
        'Leave rook scenarios out of runs (exclude) or bring them back (include). Excluded scenarios stay on disk; nothing is deleted. ' +
        'No credits. The rook scenarios tool shows which are excluded.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['action', 'ids'],
        properties: {
          action: { type: 'string', enum: ['exclude', 'include'] },
          ids: { type: 'array', items: { type: 'string', pattern: '^SC-\\d{3,6}$' }, minItems: 1, maxItems: 200, description: 'Scenario ids, e.g. ["SC-004"]' },
        },
      },
    })
    await $.tool.register({
      name: 'generate',
      description:
        "Write rook scenarios for the agent under test (rook generate): rook reads the agent's features and writes scenarios for those that are new or changed. " +
        'Spends credits and takes minutes; it does not call the agent. Use `instruction` to say what to cover, `force` to re-derive every feature. ' +
        "If the agent gained a capability rook's features do not describe yet, the person needs to run `rook explore .` first. " +
        APPROVALS_NOTE,
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          total: { type: 'integer', minimum: 1, maximum: 500, description: 'About how many scenarios in total' },
          classes: { type: 'array', items: { type: 'string', enum: ['functional', 'non-functional', 'adversarial'] }, minItems: 1, maxItems: 3 },
          categories: { type: 'array', items: { type: 'string', pattern: '^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$' }, minItems: 1, maxItems: 20 },
          force: { type: 'boolean', description: "Re-derive every feature's scenarios, whatever the pins say" },
          instruction: { type: 'string', maxLength: 2000, description: 'What the scenarios should cover' },
        },
      },
    })
    await $.tool.register({
      name: 'project',
      description:
        'List, select or create the rook (TestMu AI agent assurance) project this workspace records to. explore, generate and runs need one selected: ' +
        'use this when rook says no project is selected. action list (the default) shows ids and names with the active one marked; ' +
        'use selects one by id; create makes one and selects it — only when the person asked for a new project, with the name they gave. No credits.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          action: { type: 'string', enum: ['list', 'use', 'create'] },
          id: { type: 'string', pattern: '^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$', description: 'For use: the project id from the list' },
          name: { type: 'string', minLength: 1, maxLength: 120, description: 'For create: the project name' },
        },
      },
    })
    await $.tool.register({
      name: 'explore',
      description:
        "Set rook up for the agent in this repository (rook explore .): rook reads the codebase, finds the agents and writes each one's features under .testmuai/rook/. " +
        "Use it in a repository with no rook workspace, and again when the agent gained capabilities rook's features do not describe. " +
        'Needs a selected project (the rook project tool). Spends credits and takes minutes; it does not call the agent. ' +
        'Use `instruction` to say where the agent lives or what to focus on, `force` to re-derive every agent. ' +
        'Afterwards the rook generate tool writes scenarios, and the person adds a profile so rook can reach the agent. ' +
        APPROVALS_NOTE,
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          force: { type: 'boolean', description: 'Re-derive every agent, whatever the hashes say' },
          instruction: { type: 'string', maxLength: 2000, description: "Where the agent lives or what to look for, e.g. 'the support bot under services/support'" },
        },
      },
    })
    await $.tool.register({
      name: 'profile_test',
      description:
        "rook profiles: how rook reaches the agent under test (local, staging…). action test (the default) calls the agent once through a profile — " +
        'the active one unless `profile` names another — and returns what came back; a profile that answers is marked verified. ' +
        'It invokes the real agent, so a production-looking profile is refused until the person confirms. ' +
        "action list shows the active agent's profiles; action use makes one active. " +
        'Do not try to ADD a profile: it needs connection details only the person has. Ask them to type ' +
        "`! rook profile add <name> --from connection.md` (a curl, a spec or notes) or `! rook profile add <name> --command '<how the agent starts>'`. " +
        APPROVALS_NOTE,
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          action: { type: 'string', enum: ['test', 'list', 'use'] },
          profile: { type: 'string', pattern: '^[\\w.-]{1,64}$', description: 'Profile id. For test: default the active one. Required for use' },
          goal: { type: 'string', maxLength: 500, description: "For test: what to send the agent. Default: 'Say hello and nothing else.'" },
        },
      },
    })

    // ── tool registrations: runs tab
    await $.tool.register({
      name: 'compare',
      description:
        'Compare two rook runs of the agent under test, reading only the files on disk (no credits, no rook CLI call, no agent call). ' +
        'Per scenario: fixed (Fail or Unable to Verify → Pass), regressed (Pass → Fail or Unable to Verify), new in head, missing from head, still failing; ' +
        'plus the Pass / Fail / Unable to Verify, pass-rate and credits deltas. Defaults to the two newest finished runs; ' +
        'with only base, head is the newest run; with only head, base is the run before it. The rook runs tool lists run ids.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          base: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}Z(-\\d+)?$', description: 'The earlier run id' },
          head: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}Z(-\\d+)?$', description: 'The later run id' },
        },
      },
    })
    // ── end tool registrations: runs tab

    // ── tool registrations: setup tab
    await $.tool.register({
      name: 'sync',
      description:
        'Record this rook project upstream (rook sync): every agent\'s features, scenarios and profiles as one write, or one agent with `agent`. ' +
        'explore and generate write on disk only, and a run needs what it tests recorded, so sync after them when rook says the tree is not recorded. ' +
        'Returns what was recorded and where each agent now stands. With check: true it only reports the sync state (rook status) and writes nothing. ' +
        'No credits: it calls no model and not the agent. ' +
        'It needs an Agent Assurance plan with Rook cloud: on one without, such as Starter, rook refuses it (upgrade_plan) with an upgrade link and a run goes on this machine only, so pass the link on rather than retrying.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          agent: { type: 'string', pattern: '^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$', description: 'Only this agent. Default: every agent on disk' },
          check: { type: 'boolean', description: 'Only report the sync state; record nothing' },
        },
      },
    })
    // ── end tool registrations: setup tab

    // ── tool registrations: ci
    await $.tool.register({
      name: 'ci',
      description:
        `Make rook a pull-request check: a GitHub Actions workflow (${WORKFLOW_PATH}) that installs rook, signs in from repository secrets, ` +
        "runs the agent's functional scenarios (or the ROOK_ONLY ids) with rook run --test --json, uploads the run folder, and fails on Fail verdicts " +
        '(Unable to Verify too when fail_on_unverifiable). Without write it previews: the path, the secret names the person must add, and the YAML. ' +
        'With write it writes the file, unless one exists (force replaces it). No credits, no agent call. Secret values never go in the file: ' +
        'tell the person which secrets to add; do not ask them for the values.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          write: { type: 'boolean', description: 'Write the workflow file; default false (preview only)' },
          force: { type: 'boolean', description: 'With write: replace an existing workflow file' },
          fail_on_unverifiable: { type: 'boolean', description: 'Fail the check on Unable to Verify as well as on Fail' },
        },
      },
    })
    // ── end tool registrations: ci

    await poll($, ctx)
    ctx.isPrimed = true
    $.clock.every(POLL_MS, () => poll($, ctx))
    // Installed and signed in are asked once, off the start path: `rook auth status` is a network call.
    $.clock.after(0, async () => {
      // After the install probe, so a missing rook costs one failed call, not two.
      await probeThenPoll($, ctx)
      if (ctx.cli.version !== null) {
        await refreshBalance($, ctx)
      }
    })

    await loadLens($, ctx)
    ctx.sessionStartedAt = await $.clock.now()

    if (ctx.paneMode === 'auto' && ctx.located !== undefined) {
      void openPane($)
    }

    return started
  })

  // 1 · tools the model calls
  on('tool.call', { tool: RUN_TOOL }, ($, e, next) => {
    const input = e as unknown as RunRequest
    const keys = ['only', 'class', 'category', 'tags', 'profile', 'name', 'concurrency', 'resume', 'continueRun', 'phases', 'instruction'] as const
    const request: RunRequest = {
      ...Object.fromEntries(keys.filter(key => input[key] !== undefined).map(key => [key, input[key]])),
      ...(input.test === true && { test: true }),
      ...(input.rca === true && { rca: true }),
    }

    return toolRun($, ctx, request, next.signal)
  })

  on('tool.call', { tool: REPORT_TOOL }, async ($, e, next) => {
    const { run_id: runId, rca } = e as unknown as { run_id?: unknown; rca?: unknown }

    if (rca === true) {
      return { result: await toolExplain($, ctx, typeof runId === 'string' ? runId : undefined, next.signal) }
    }

    const { text, context } = await reportText($, ctx, typeof runId === 'string' ? runId : undefined)

    return { result: context ?? text }
  })

  on('tool.call', { tool: STATUS_TOOL }, async $ => {
    const snapshot = await read($, snapshotAtom)
    const latest = snapshot?.latest
    const health = snapshot && snapshot.current.length > 0 ? countsOf(snapshot.current) : undefined
    const tail = [
      latest
        ? `Latest run ${latest.runId}: ${latest.finished ? 'finished' : `running ${latest.done}/${latest.planned}`} · ` +
          `${latest.counts.pass} Pass · ${latest.counts.fail} Fail · ${latest.counts.unverifiable} Unable to Verify`
        : undefined,
      health
        ? `Every scenario's latest verdict: ${health.pass} Pass · ${health.fail} Fail · ${health.unverifiable} Unable to Verify` +
          `${snapshot!.neverRun > 0 ? ` · ${snapshot!.neverRun} never run` : ''}`
        : undefined,
    ].filter(Boolean)
    const balance = balanceText(await refreshBalance($, ctx))

    return { result: [await statusReply($, ctx), ...tail, ...(balance === undefined ? [] : [`Credit balance: ${balance}`])].join('\n') }
  })

  on('tool.call', { tool: SCENARIOS_TOOL }, async $ => ({ result: await scenariosReply($, ctx) }))

  on('tool.call', { tool: RUNS_TOOL }, async ($, e) => {
    const limit = (e as unknown as { limit?: unknown }).limit

    return { result: await runsReply($, ctx, typeof limit === 'number' && Number.isInteger(limit) ? Math.min(100, Math.max(1, limit)) : 20) }
  })

  on('tool.call', { tool: AGENT_TOOL }, async ($, e) => {
    const use = (e as unknown as { use?: unknown }).use

    return { result: use === undefined ? await agentsReply($, ctx) : await switchAgent($, ctx, typeof use === 'string' ? use : String(use)) }
  })

  on('tool.call', { tool: CURATE_TOOL }, async ($, e) => {
    const { action, ids } = e as unknown as { action?: unknown; ids?: unknown }

    return { result: await curateReply($, ctx, String(action), Array.isArray(ids) ? ids.map(String) : []) }
  })

  on('tool.call', { tool: GENERATE_TOOL }, async ($, e, next) => {
    const input = e as unknown as GenerateRequest
    const keys = ['total', 'classes', 'categories', 'instruction'] as const
    const request: GenerateRequest = {
      ...Object.fromEntries(keys.filter(key => input[key] !== undefined).map(key => [key, input[key]])),
      ...(input.force === true && { force: true }),
    }

    return { result: await generateRun($, ctx, request, next.signal) }
  })

  on('tool.call', { tool: PROJECT_TOOL }, async ($, e) => {
    const input = e as unknown as ProjectRequest
    const request: ProjectRequest = {
      ...(input.action !== undefined && { action: input.action }),
      ...(input.id !== undefined && { id: input.id }),
      ...(input.name !== undefined && { name: input.name }),
    }

    return { result: await projectReply($, ctx, request) }
  })

  on('tool.call', { tool: EXPLORE_TOOL }, async ($, e, next) => {
    const input = e as unknown as ExploreRequest
    const request: ExploreRequest = {
      ...(input.instruction !== undefined && { instruction: input.instruction }),
      ...(input.force === true && { force: true }),
    }

    return { result: await exploreRun($, ctx, request, next.signal) }
  })

  on('tool.call', { tool: PROFILE_TOOL }, async ($, e, next) => {
    const input = e as unknown as ProfileRequest
    const request: ProfileRequest = {
      ...(input.action !== undefined && { action: input.action }),
      ...(input.profile !== undefined && { profile: input.profile }),
      ...(input.goal !== undefined && { goal: input.goal }),
    }

    return profileReply($, ctx, request, next.signal)
  })

  // ── tool handlers: runs tab
  on('tool.call', { tool: COMPARE_TOOL }, async ($, e) => {
    const { base, head } = e as unknown as { base?: unknown; head?: unknown }

    return { result: await compareRuns($, ctx, typeof base === 'string' ? base : undefined, typeof head === 'string' ? head : undefined) }
  })
  // ── end tool handlers: runs tab

  // ── tool handlers: setup tab
  on('tool.call', { tool: SYNC_TOOL }, async ($, e) => {
    const { agent, check } = e as unknown as { agent?: unknown; check?: unknown }

    if (check === true) {
      return { result: await checkSync($, ctx) }
    }

    return { result: await syncReply($, ctx, agent === undefined ? undefined : String(agent)) }
  })
  // ── end tool handlers: setup tab

  // ── tool handlers: ci
  on('tool.call', { tool: CI_TOOL }, async ($, e) => {
    const { write, force, fail_on_unverifiable: strict } = e as unknown as { write?: unknown; force?: unknown; fail_on_unverifiable?: unknown }

    return { result: await ciAnswer($, ctx, { write: write === true, force: force === true, failOnUnverifiable: strict === true }) }
  })
  // ── end tool handlers: ci

  // 7 · production guard over the model's shell
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    if (!isRunCommand(e.command)) {
      return next(e)
    }

    const blocked = await prodBlock($, ctx, /--profile[= ]([\w.-]+)/.exec(e.command)?.[1])

    return blocked === undefined ? next(e) : { deny: blocked }
  })

  // 3 · edits to the agent under test
  on('tool.call', { tool: EDIT_TOOLS }, async ($, e, next) => {
    const ran = await next(e)
    const input = e as unknown as { file_path?: unknown; notebook_path?: unknown }
    const path = typeof input.file_path === 'string' ? input.file_path : typeof input.notebook_path === 'string' ? input.notebook_path : undefined

    if (ctx.isRetestBand && path !== undefined && ran.deny === undefined && ran.isError !== true) {
      await noted($, ctx, path).catch(() => undefined)
    }

    return ran
  })

  // 6 · /rook — Claude Code labels a command's output with the plugin's name already.
  on('command.run', { command: 'rook' }, async ($, e) => {
    const answer = await rookCommand($, ctx, e)

    // "rook: …" and "rook status failed" alike would read "rook: rook …".
    return { ...answer, text: answer.text.replace(/^rook(?::\s*|\s+)/, '') }
  })

  // ── message hooks: trends
  // The Trends tab's heat grid: a picked cell opens the drill-down; keys it hands back are the pane's hotkeys.
  on('ui.message', async ($, e, next) => {
    if (!e.module.includes('heat.client')) {
      return next(e)
    }

    await heatMessage($, ctx, e.data)

    return {}
  })
  // ── end message hooks: trends

  // ── render hooks: card
  // The model reads the result text unchanged; these draw it differently, and hand back the engine's own row when they cannot.
  on('ui.render', { component: 'ToolResult', props: { tool: CARD_TOOL } }, async ($, e, next) => (await cardRender($, ctx, e)) ?? next(e))
  on('ui.render', { component: 'ToolUse', props: { tool: CARD_RUN_TOOL } }, async ($, e, next) => (await cardProgressRender($, e)) ?? next(e))
  // ── end render hooks: card

  // 2 · the turn's spinner: where Claude's rook run is, at any terminal width
  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    const running = await read($, runningAtom)

    if (running === null || running.source !== 'tool') {
      // Claude waiting on a generate or explore: where it is, instead of the word.
      const job = liveJob(await read($, jobAtom))

      if (job === null || job.source !== 'tool') {
        return next(e)
      }

      await read($, tickAtom)

      return next({ ...e, props: { ...e.props, message: jobSpinnerText(job, await $.clock.now()) } })
    }

    await read($, tickAtom)
    const run = (await read($, snapshotAtom))?.latest
    const message = spinnerText(run?.finished ? undefined : run, running, await $.clock.now())

    return next({ ...e, props: { ...e.props, message } })
  })

  // 2 · the live pane
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const resolved = $.ui.resolve(e)
    const { Box, Text, Button, Link, Markdown } = resolved
    const el = resolved as unknown as El
    const snapshot = await read($, snapshotAtom)
    const running = await read($, runningAtom)
    const expanded = await read($, expandedAtom)
    const viewerUrl = await read($, viewerAtom)
    const lastError = await read($, lastErrorAtom)
    const agents = await read($, agentsAtom)
    const balance = balanceText(await read($, balanceAtom))
    const explaining = await read($, explainingAtom)
    const tab = await read($, tabAtom)
    const confirm = await read($, confirmAtom)
    const lens = await read($, lensAtom)
    const detail = await read($, detailAtom)
    await read($, tickAtom)
    const now = await $.clock.now()
    const width = Math.max(20, e.props.bodyColumns)

    // ── pane seam: progress
    const job = liveJob(await read($, jobAtom))
    const jobView = job === null ? null : <JobLanes el={el} job={job} now={now} width={width} />
    // ── end pane seam: progress

    const confirmView =
      confirm === null ? null : (
        <ConfirmBar
          el={el}
          confirm={confirm}
          onConfirm={async () => {
            await confirmNow($, ctx)
            await keepFocus($)
          }}
          onCancel={async () => {
            await update($, confirmAtom, () => null)
            await keepFocus($)
          }}
        />
      )
    const readiness = snapshot?.readiness
    const failedBefore = lastError !== null && (
      <Box key="last-error">
        <Text color="red" wrap="wrap">
          last {lastError.source} failed: {clip(lastError.text.replace(/^run failed: /, ''), 600)}
        </Text>
      </Box>
    )

    // No agent to show: what the repository holds, the setup checklist, the next step's button.
    if (snapshot === null || snapshot.agentId === undefined) {
      return (
        <Box flexDirection="column">
          <FreshStart
            el={el}
            hasWorkspace={readiness?.hasWorkspace ?? true}
            found={snapshot?.repoFound}
            steps={startSteps({ readiness, found: snapshot?.repoFound ?? [], lens, folder: folderOf(ctx) })}
            canAct={running === null && job === null && confirm === null}
            onAction={action => startAction($, ctx, action)}
            checklist={<SetupTab el={el} readiness={readiness} onRecheck={() => recheck($, ctx)} />}
          />
          {failedBefore}
          {jobView}
          {confirmView}
          {e.props.isFocused && <KeysHint el={el} isSetupOnly />}
        </Box>
      )
    }

    // ── pane seam: live (the run in flight above every tab, the header's freshness)
    const live = await read($, liveAtom)
    const liveRun = snapshot.latest !== undefined && !snapshot.latest.finished ? snapshot.latest : undefined
    const freshness = freshnessText(isInFlight(snapshot, running, job !== null), snapshot.checkedAt, now)
    let liveView: unknown = null

    if (running !== null || liveRun !== undefined) {
      const eta = liveRun === undefined ? undefined : etaMs(liveRun, running, now, ctx.statusTrend?.points ?? [])

      liveView = (
        <LiveBlock
          el={el}
          headline={liveHeadline({ ...(liveRun !== undefined && { run: liveRun }), running, isOwn: liveRun !== undefined && isOwnRun(live, liveRun.runId), now, ...(eta !== undefined && { eta }) })}
          lanes={liveRun?.lanes ?? []}
          judged={liveRun === undefined ? [] : justJudged({ run: liveRun, live, verdicts: await read($, verdictsAtom), stale: await read($, staleAtom) })}
          now={now}
          width={width}
          canCancel={running !== null && running.source !== 'tool'}
          onOpen={id => (liveRun === undefined ? undefined : openDetail($, ctx, liveRun.runId, id))}
          onCancel={() => cancelRun($, ctx)}
        />
      )
    }
    // ── end pane seam: live
    // ── pane seam: keys
    // An agent never run here (pulled from git): the one missing piece and its button lead the Release and Setup tabs.
    const lead = tab === 'health' || tab === 'setup' ? await firstRunLead($, ctx, el, snapshot, lens, running === null && explaining === null && confirm === null) : null
    // ── end pane seam: keys

    const header = (
      <Text bold wrap="truncate-end">
        rook · {snapshot.agentId ?? ''}
        {snapshot.profileId ? <Text dimColor> · profile {snapshot.profileId}</Text> : ''}
        {balance !== undefined ? <Text dimColor> · {balance}</Text> : ''}
        {freshness !== undefined ? <Text color={freshness.startsWith('●') ? 'green' : undefined} dimColor={!freshness.startsWith('●')}> · {freshness}</Text> : ''}
      </Text>
    )
    // Claude Code docks panes and draws Client charts only in its fullscreen layout; on the main
    // screen the pane sits inline and the Trends grid is text. Say how to get the side pane.
    const inlineHint =
      e.props.placement === 'inline' ? (
        <Box key="inline-hint">
          <Text color="yellow" wrap="wrap">
            Inline above the prompt. For the side pane and clickable charts, type /tui fullscreen (Claude Code restarts and resumes this session).
          </Text>
        </Box>
      ) : null
    const frame = (body: unknown) => (
      <Box flexDirection="column">
        {header}
        {inlineHint}
        <TabBar el={el} tab={tab} lens={lens} onTab={async next => { await setTab($, next); await keepFocus($) }} onLens={() => toggleLens($)} />
        {failedBefore}
        {jobView}
        {confirmView}
        {/* ── pane seam: live */}
        {liveView as never}
        {lead}
        {body as never}

      </Box>
    )

    // ── pane seam: drill-down
    // The scenario drill-down replaces any tab's body while open; Back closes it.
    if (detail !== null) {
      const evidence = await read($, evidenceAtom)
      const canRun = running === null && blockedText(readiness, NEEDS.run, 'run') === undefined
      const drill = await drillState($, ctx, detail, evidence, canRun)
      const { model } = drill
      const before = drill.rowBefore

      return frame(
        <ScenarioDrillDown
          el={el}
          id={detail.id}
          runId={detail.runId}
          evidence={evidence}
          {...(drill.info?.title !== undefined && { title: drill.info.title })}
          {...(model.owner !== undefined && { owner: model.owner })}
          sections={model.sections}
          history={model.history}
          isRegressed={model.isRegressed}
          isFlaky={model.isFlaky}
          tags={[drill.info?.class, drill.info?.category, evidence?.featureId ?? drill.info?.featureId].filter((t): t is string => t !== undefined)}
          changed={model.changed}
          {...(before !== undefined && {
            costBefore: {
              runId: before.runId,
              ...(before.row.turns !== undefined && { turns: before.row.turns }),
              ...(before.row.tokens !== undefined && { tokens: before.row.tokens }),
              ...(before.row.latencyMs !== undefined && { latencyMs: before.row.latencyMs }),
            },
          })}
          actions={model.actions}
          now={now}
          width={width}
          onAction={action => drillAction($, ctx, action)}
          onBack={() => closeDetail($)}
        />,
      )
    }
    // ── end pane seam: drill-down

    // ── pane seam: trends
    if (tab === 'trends') {
      const grid = heatGrid(await read($, verdictsAtom))
      const runs = await trendRunsNow($, ctx)
      // Every table names Client, but only the terminal and the desktop draw one: elsewhere it is an empty fragment.
      const Client = (e.surface === 'terminal' || e.surface === 'desktop') && 'Client' in resolved ? resolved.Client : undefined
      const heat =
        Client === undefined || grid.rows.length === 0 ? null : (
          <Client key="trends-heat" module="./heat.client.tsx" props={{ runIds: grid.runIds, rows: grid.rows }} />
        )

      return frame(<TrendsTab el={el} grid={grid} runs={runs} heat={heat} onOpen={(runId, id) => openDetail($, ctx, runId, id)} />)
    }
    // ── end pane seam: trends

    // ── pane seam: runs tab
    if (tab === 'runs') {
      const history = await read($, historyAtom)
      const runOpen = await read($, runOpenAtom)
      const compare = await read($, compareAtom)
      const runDiff = await read($, runDiffAtom)
      const runVersus = await read($, runVersusAtom)

      return frame(
        <RunsTab
          el={el}
          history={history}
          open={runOpen}
          compare={compare}
          diff={runDiff}
          explaining={explaining}
          onOpen={runId => openRun($, ctx, runId)}
          onBack={() => closeRun($)}
          onReport={() => reportRun($, ctx)}
          onExplain={() => explainRun($, ctx)}
          onCompareWith={() => compareWith($)}
          onPick={runId => pickRun($, ctx, runId)}
          onClearCompare={() => clearCompare($)}
          versus={runVersus !== null && runVersus.runId === runOpen?.runId ? runVersus : null}
          onScenario={id => (runOpen === null ? undefined : openDetail($, ctx, runOpen.runId, id))}
        />,
      )
    }
    // ── end pane seam: runs tab

    // ── pane seam: scenarios tab
    if (tab === 'scenarios') {
      const filter = await read($, filterAtom)
      const selected = await read($, selectedAtom)
      const flaky = await read($, flakyAtom)
      const flakyPrior = await read($, flakyPriorAtom)
      const draft = await read($, draftAtom)
      const openId = await read($, scenarioDetailAtom)
      const views = withVerdicts(await scenarioList($, ctx), snapshot.current)
      const shown = filterScenarios(views, filter)
      const open = openId === null ? undefined : views.find(view => view.id === openId)
      const detail: ScenarioDetail | undefined =
        open === undefined ? undefined : { scenario: open, ...(open.runId === undefined ? {} : await scenarioVerdict($, ctx, open.id, open.runId)) }

      return frame(
        <ScenariosTab
          el={el}
          rows={shown}
          total={views.length}
          filter={filter}
          selected={selected}
          flaky={flaky}
          flakyPrior={flakyPrior}
          detail={detail}
          draft={draft}
          canRun={running === null && blockedText(readiness, NEEDS.run, 'run') === undefined}
          rate={creditsPerScenario(snapshot.latest)}
          width={width}
          onFilter={next => update($, filterAtom, () => (isFilter(next) ? next : 'all'))}
          onToggle={id => update($, selectedAtom, ids => toggled(ids, id))}
          onOpen={id => scenarioOpen($, ctx, id)}
          onSelectAll={() => update($, selectedAtom, ids => withAll(ids, shown.map(view => view.id)))}
          onClear={() => update($, selectedAtom, () => [])}
          onRunSelected={() => scenarioRunSelected($)}
          onCurate={verb => scenarioCurate($, ctx, verb)}
          onFix={id => scenarioFix($, ctx, id)}
          onRegression={id => scenarioRegression($, ctx, id)}
          onFlaky={id => scenarioAskFlaky($, id)}
          onDraft={text => update($, draftAtom, () => text)}
          onGenerate={text => scenarioGenerate($, text)}
        />,
      )
    }
    // ── end pane seam: scenarios tab

    // ── pane seam: setup tab
    if (tab === 'setup') {
      const panel = await setupPanel($, ctx, running === null && explaining === null)

      return frame(
        <SetupTab
          el={el}
          readiness={readiness}
          onRecheck={() => recheck($, ctx)}
          panel={panel}
          actions={{
            onUse: id => paneUseProfile($, ctx, id),
            onTest: id => askProfileTest($, id),
            onSync: () => paneSync($, ctx),
            onCheckSync: () => paneCheckSync($, ctx),
            onRefresh: () => $.ui.invalidate('ui.render'),
            onSetting: id => toggleSetting($, ctx, id),
            onBudget: text => paneBudget($, ctx, [text.trim()]),
            onBudgetOff: () => paneBudget($, ctx, ['off']),
          }}
        />,
      )
    }
    // ── end pane seam: setup tab

    // The Health tab. ── pane seam: health (owned by the health feature, through the end of this hook)
    // Release for a QE, My change for a developer (feature: home).
    // Results can be read while rook would refuse to run (no project selected, signed out…): say so, offer no run.
    const runBlock = blockedText(readiness, NEEDS.run, 'run')

    const run = snapshot.latest
    const failed = run?.rows.filter(row => row.status === 'Fail') ?? []
    const scenarioCount = snapshot.current.length + snapshot.neverRun
    // Scenarios whose newest verdict is a Fail, from whichever run: Re-run failed.
    const failing = [...new Set([...failed.map(row => row.id), ...snapshot.current.filter(row => row.status === 'Fail').map(row => row.id)])]
    // Runs need nothing in flight and a checklist that allows them; the agent switch below needs only the first.
    const canAct = running === null && runBlock === undefined
    const runLine =
      run === undefined
        ? undefined
        : `${run.name ? `${run.name} · ` : ''}${run.runId} · ${run.done}/${run.planned} ${run.stopped ? 'stopped' : run.finished ? 'done' : isReporting(run) ? REPORTING : 'running'}` +
          `${(snapshot.runCount ?? 0) > 1 ? ` · ${snapshot.runCount} runs (/rook runs)` : ''}`
    const common = {
      el,
      width,
      ...(runLine !== undefined && { runLine }),
      canAct,
      failing: failing.length,
      viewerUrl,
      onOpen: (runId: string, id: string) => openDetail($, ctx, runId, id),
      onRunAll: () => confirmRun($, run, scenarioCount > 0 ? `Run all ${plural(scenarioCount, 'scenario')}` : 'Run all scenarios', undefined, scenarioCount),
      onRerunFailed: () => confirmRun($, run, `Re-run ${plural(failing.length, 'failed scenario')}`, failing),
      onViewer: async () => $.ui.toast(toastText(await startViewer($, ctx))),
    }

    let body: unknown

    if ((run === undefined && (snapshot.runCount ?? 0) === 0) || (run !== undefined && !run.finished && ((await read($, historyAtom))?.length ?? 0) === 0)) {
      // Nothing finished yet (the first run is in flight above): no release call to make, no change to measure.
      body = null
    } else if (lens === 'dev') {
      const change = await homeChange($, ctx, snapshot)

      body = <ChangeView {...common} {...change} onFix={() => homeFix($, ctx)} onRetest={() => homeRetest($, ctx)} />
    } else {
      const release = releaseOf(await homeInput($, ctx, snapshot))
      const moved = changesIn(snapshot.current, run?.runId)

      body = (
        <ReleaseView
          {...common}
          release={release}
          counts={countsOf(snapshot.current)}
          neverRun={snapshot.neverRun}
          {...(run?.finished && { metrics: metricsLine(run) })}
          moved={{ fixed: moved.fixed.map(row => row.id), regressed: moved.regressed.map(row => row.id) }}
          {...(run?.headline !== undefined && { headline: run.headline })}
          next={run?.finished ? run.next : []}
          clusters={run?.finished ? orderedClusters(run).filter(cluster => cluster.kind !== 'unverifiable' || isExplained(cluster)) : []}
          runRows={run?.rows ?? []}
          expanded={expanded}
          explaining={explaining}
          gapGroups={run === undefined ? [] : gapGroups(unlooked(run))}
          onToggle={id => update($, expandedAtom, open => (open === id ? null : id))}
          onExplain={() => (run === undefined ? undefined : paneExplain($, ctx, run.runId))}
          onFixOne={id => (run === undefined ? undefined : fixOne($, ctx, run, id))}
          onFixGaps={cause => (run === undefined ? undefined : fixUnverified($, ctx, run, cause))}
          onRetestGaps={(_cause, ids) => confirmRun($, run, `Re-test ${plural(ids.length, 'scenario')}`, ids)}
          onDraft={() => homeDraft($, ctx)}
          onGenerate={() => homeGenerate($, ctx)}
        />
      )
    }

    return frame(
      <Box flexDirection="column">
        {agents.length > 1 && (
          <Box flexDirection="row" gap={1}>
            <Text dimColor>agents</Text>
            {agents.map(id =>
              id === snapshot.agentId ? (
                <Text key={`a-${id}`} bold>
                  ● {id}
                </Text>
              ) : running === null && explaining === null ? (
                <Button key={`agent-${id}`} label={`use ${id}`} onPress={() => paneSwitch($, ctx, id)} />
              ) : (
                <Text key={`a-${id}`} dimColor>
                  {id}
                </Text>
              ),
            )}
          </Box>
        )}
        {/* The first-run lead already says what is missing and offers the button. */}
        {runBlock !== undefined && lead === null && (
          <Box key="run-block">
            <Text color="yellow" wrap="wrap">
              ⚠ {runBlock}
            </Text>
          </Box>
        )}
        {run === undefined && (
          <Text dimColor>
            {snapshot.neverRun > 0 ? `${snapshot.neverRun} scenarios, none run yet.` : 'No runs yet.'}
            {runBlock === undefined ? ' Press Run all, or ask Claude to test the agent.' : ''}
          </Text>
        )}
        {run === undefined && (snapshot.elsewhere?.length ?? 0) > 0 && (
          <Box key="elsewhere">
            <Text color="yellow" wrap="wrap">
              {`${snapshot.elsewhere!.map(other => `${other.runs} run${other.runs === 1 ? '' : 's'} in ${other.project}`).join(', ')} on disk: rook reads only the selected project. ` +
                'To see them, select that project with /rook project use <id>, or run here.'}
            </Text>
          </Box>
        )}
        {body as never}
      </Box>
    )
  })

  // 3 · the re-test band
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) {
      return next(e)
    }

    // A run in flight, or a run from elsewhere that broke what passed, takes the band over (feature: live).
    const liveShown = await liveBand($, ctx, e)

    if (liveShown !== undefined) {
      return liveShown
    }

    if (!ctx.isRetestBand) {
      return next(e)
    }

    const stale = await read($, staleAtom)

    if (stale === null || (await read($, bandHiddenAtom))) {
      return next(e)
    }

    const unticked = await read($, untickedAtom)
    const isOpen = await read($, bandOpenAtom)

    return (
      <RetestBand
        el={$.ui.resolve(e)}
        stale={stale}
        unticked={unticked.filter(id => stale.scenarios.some(s => s.id === id))}
        isOpen={isOpen}
        columns={e.props.bodyColumns}
        onToggle={id => toggleTicked($, id)}
        onRetest={() => retest($)}
        onDetails={() => toggleBandOpen($)}
        onDismiss={() => update($, bandHiddenAtom, () => true)}
      />
    )
  })
}
