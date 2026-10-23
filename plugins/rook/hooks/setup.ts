import type { RookBudget } from '../types'
import { clip, credits } from './format'
import { declaredVariables } from './guard'
import { isMap, parseMap, str } from './yaml'
import type { YamlValue } from './yaml'

/**
 * The Setup tab's pure half: profiles as the tab shows them, the profile
 * wizard's commands, `rook sync` / `rook status --json` read back, and the
 * session's credit budget. Nothing here takes `$`.
 *
 * Variable VALUES never enter this module: callers hand over the names that
 * are set, and every view says set or unset, nothing more. A variable a
 * profile declares may be a credential.
 */

/** The five points rook runs a profile's scripts at, in run order (rook's `HOOK_PHASES`). */
export const PROFILE_STEPS = [
  { id: 'prepare', what: 'get ready once per scenario: log in, mint a token' },
  { id: 'open', what: 'start a session or conversation' },
  { id: 'execute', what: 'send one turn and return the reply (the only required step)' },
  { id: 'close', what: 'release what open took' },
  { id: 'collect', what: 'fetch traces or logs once the turn has landed' },
] as const

export type ProfileVariable = { name: string; isSet: boolean }

export type ProfileView = {
  id: string
  name: string
  isActive: boolean
  isVerified: boolean
  /** Where the profile reaches the agent: an endpoint, a command, or the execute script. */
  target: string
  /** The steps the profile defines scripts for. */
  steps: string[]
  variables: ProfileVariable[]
}

/** `hooks.execute` is a path or `{ script: path }`. */
const scriptOf = (value: YamlValue | undefined): string | undefined => (isMap(value) ? str(value.script) : str(value))

/** One profile file, as the tab lists it. `setNames` are the variables rook's env store has a value for. */
export function profileView(id: string, text: string, isActive: boolean, isVerified: boolean, setNames: ReadonlySet<string>): ProfileView {
  const doc = parseMap(text)
  const target = isMap(doc.target) ? doc.target : {}
  const hooks = isMap(doc.hooks) ? doc.hooks : {}
  const execute = scriptOf(hooks.execute)
  const where =
    str(target.endpoint) ?? str(target.url) ?? str(target.base_url) ?? str(target.command) ?? str(target.server) ?? str(target.domain) ?? (execute === undefined ? undefined : `script ${execute}`)

  return {
    id,
    name: str(doc.name) ?? id,
    isActive,
    isVerified,
    target: where === undefined ? 'no target found' : clip(where, 120),
    steps: PROFILE_STEPS.map(step => step.id).filter(step => hooks[step] !== undefined && hooks[step] !== null),
    variables: [...new Set(declaredVariables(text))].map(name => ({ name, isSet: setNames.has(name) })),
  }
}

/** `state.json`'s `verified_profiles`: rook records there that a profile reached the agent from this machine. */
export function verifiedProfiles(stateText: string | undefined): Set<string> {
  try {
    const state = JSON.parse(stateText ?? '{}') as { verified_profiles?: Record<string, unknown> }

    return new Set(Object.keys(state.verified_profiles ?? {}).filter(id => Boolean(state.verified_profiles?.[id])))
  } catch {
    return new Set()
  }
}

/** Repository-root files `rook profile add --from` reads well, best first. */
export const CONNECTION_FILES = ['connection.md', 'openapi.yaml', 'openapi.yml', 'openapi.json', 'README.md'] as const

export type Wizard = {
  /** Why the wizard shows: no profile, not verified, variables unset. */
  reason: string
  /** The repository file found to author a profile from, if any. */
  connectionFile?: string
  /** The steps the profile in question defines, when there is one. */
  defined?: string[]
  /** Exact lines to type at the prompt, in order. */
  commands: { text: string; why: string }[]
}

/** A JSON string for a shell's single quotes: the name only, the value a placeholder for the person to fill. */
export const envSetCommand = (name: string): string => `! rook env set '{"${name}":"…"}'`

export const profileAddCommand = (file: string | undefined, name = 'http'): string =>
  file === undefined ? `! rook profile add ${name} --from connection.md` : `! rook profile add ${name} --from ${file}`

/**
 * What the person must do before rook can reach the agent, or undefined when
 * the active profile is verified and every variable it declares is set.
 */
export function wizardOf(profiles: readonly ProfileView[], connectionFile: string | undefined): Wizard | undefined {
  const active = profiles.find(profile => profile.isActive)
  const add = {
    text: profileAddCommand(connectionFile),
    why:
      connectionFile === undefined
        ? 'first write connection.md in the repository root: a curl that reaches the agent, a spec, or notes. rook writes the scripts from it (spends credits)'
        : `rook reads ${connectionFile} and writes the scripts (spends credits)`,
  }
  const byCommand = { text: "! rook profile add local --command '<how the agent starts>'", why: 'or, for an agent you start as a process' }

  if (profiles.length === 0) {
    return { reason: 'no profile yet: rook does not know how to reach the agent', ...(connectionFile !== undefined && { connectionFile }), commands: [add, byCommand] }
  }

  if (active === undefined) {
    return {
      reason: 'no active profile',
      ...(connectionFile !== undefined && { connectionFile }),
      commands: profiles.map(profile => ({ text: `/rook profile use ${profile.id}`, why: profile.isVerified ? 'verified' : 'not verified yet' })),
    }
  }

  const unset = active.variables.filter(variable => !variable.isSet)

  if (active.isVerified && unset.length === 0) {
    return undefined
  }

  const commands = [
    ...unset.map(variable => ({ text: envSetCommand(variable.name), why: `${variable.name} is declared by ${active.id} and not set in rook's env store` })),
    ...(active.isVerified ? [] : [{ text: `/rook profile test ${active.id}`, why: 'one call to the agent; a profile that answers is verified (spends credits)' }]),
  ]

  return {
    reason: [active.isVerified ? undefined : `${active.id} is not verified`, unset.length > 0 ? `${unset.length} variable${unset.length === 1 ? '' : 's'} unset` : undefined]
      .filter(Boolean)
      .join(' · '),
    ...(connectionFile !== undefined && { connectionFile }),
    defined: active.steps,
    commands,
  }
}

// ── sync ─────────────────────────────────────────────────────────────────────

export type SyncAgent = { id: string; tree: string; version?: number; upstream?: number; changes: string[]; owedRuns: number }

export type SyncState = { checkedAt: number; offline: boolean; agents: SyncAgent[]; said?: string; error?: string; isSyncing?: boolean }

/** `rook status --json`'s `tree`, as what to do. */
export const TREE_WORDS: Record<string, string> = {
  clean: 'up to date',
  ahead: 'local work not recorded upstream',
  unsynced: 'never recorded upstream',
  behind: 'upstream has moved',
  diverged: 'somebody else moved first — reconcile before syncing',
  unknown: 'upstream not checked (offline)',
}

export const treeWords = (tree: string): string => TREE_WORDS[tree] ?? tree

/** Whether `rook sync` would do something for this agent. */
export const needsSync = (tree: string): boolean => tree === 'ahead' || tree === 'unsynced'

type Drift = { added?: unknown; changed?: unknown; removed?: unknown }

const driftLines = (label: string, drift: Drift | undefined): string[] =>
  (['added', 'changed', 'removed'] as const).flatMap(verb => {
    const ids = Array.isArray(drift?.[verb]) ? (drift[verb] as unknown[]).map(String) : []

    return ids.length === 0 ? [] : [`${ids.length} ${label}${ids.length === 1 ? '' : 's'} ${verb}: ${ids.slice(0, 6).join(', ')}${ids.length > 6 ? ', …' : ''}`]
  })

/** `rook status --json`: per agent, where it stands against upstream and what moved. */
export function syncStateOf(doc: unknown, checkedAt: number): SyncState {
  type Agent = {
    local_id?: string
    tree?: string
    local_version_number?: number
    upstream_version_number?: number
    features?: Drift
    scenarios?: Drift
    profiles?: Drift
    owed_runs?: number
  }
  const status = doc as { offline?: boolean; agents?: Agent[] } | undefined
  const agents = Array.isArray(status?.agents) ? status.agents : []

  return {
    checkedAt,
    offline: status?.offline === true,
    agents: agents.map(agent => ({
      id: agent.local_id ?? '?',
      tree: agent.tree ?? 'unknown',
      ...(typeof agent.local_version_number === 'number' && { version: agent.local_version_number }),
      ...(typeof agent.upstream_version_number === 'number' && { upstream: agent.upstream_version_number }),
      changes: [...driftLines('feature', agent.features), ...driftLines('scenario', agent.scenarios), ...driftLines('profile', agent.profiles)],
      owedRuns: typeof agent.owed_runs === 'number' ? agent.owed_runs : 0,
    })),
  }
}

/** `rook sync` argv. `--json` is accepted, but rook 5be0db96's sync still prints prose, so it is not asked for. */
export function syncArgs(agent?: unknown): { argv: string[] } | { error: string } {
  if (agent === undefined) {
    return { argv: ['sync'] }
  }

  return typeof agent === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(agent) ? { argv: ['sync', '--agent', agent] } : { error: `"${clip(String(agent), 40)}" is not an agent id` }
}

export const SYNC_NOTE =
  'explore and generate write on disk only; rook sync records the project upstream (every agent: features, scenarios, profiles) as one write. ' +
  'It calls no model and not the agent: no credits. It needs a plan with Rook cloud; on Starter rook refuses it and runs stay on this machine.'

/** What `rook sync` printed, in a few lines: the summary first. */
export function syncText(exitCode: number, stdout: string, stderr: string): string {
  const lines = `${stdout}\n${exitCode === 0 ? '' : stderr}`
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '' && !/^running…$/.test(line))
  const summary = lines.find(line => /agent\(s\) recorded|nothing to record|nothing moved|no agents on disk/.test(line))
  const rest = lines.filter(line => line !== summary).slice(0, 10)

  if (exitCode !== 0) {
    return [`rook sync failed: ${clip(rest.at(-1) ?? summary ?? `rook exited ${exitCode}`, 300)}`, ...rest.slice(0, -1).map(line => `  ${clip(line, 200)}`)].join('\n')
  }

  return [`rook sync: ${summary ?? 'done'}`, ...rest.map(line => `  ${clip(line, 200)}`), '(no credits: sync records what is on disk; it calls no model and not the agent)'].join('\n')
}

export function syncStateText(state: SyncState): string {
  return [
    state.offline ? 'sync state: could not reach upstream — whether it moved is unknown' : 'sync state:',
    ...state.agents.map(agent =>
      [
        `  ${agent.id}${agent.version === undefined ? ' never synced' : ` v${agent.version}`} · ${treeWords(agent.tree)}`,
        ...agent.changes.map(line => `    ${line}`),
        ...(agent.owedRuns > 0 ? [`    ${agent.owedRuns} run(s) not recorded upstream — rook runs sync`] : []),
      ].join('\n'),
    ),
  ].join('\n')
}

// ── budget ───────────────────────────────────────────────────────────────────

/** What a generate is assumed to cost when nothing better is known. */
export const GENERATE_ESTIMATE = 50

/** `/rook budget 50` → 50; `off` → null; `status` or nothing → undefined; anything else → an error. */
export function parseBudget(args: readonly string[]): number | null | undefined | { error: string } {
  const [word] = args

  if (word === undefined || word === 'status') {
    return undefined
  }

  if (word === 'off' || word === 'none' || word === 'clear') {
    return null
  }

  const limit = Number(word)

  return /^\d+(\.\d+)?$/.test(word) && limit > 0 && limit <= 1_000_000 ? limit : { error: 'budget takes a number of credits, off, or status: /rook budget 50' }
}

/** Credits spent since the budget was set: the balance then minus the balance now. */
export function spentOf(budget: RookBudget, balance: number | null | undefined): number {
  if (budget.startBalance === undefined || balance === null || balance === undefined) {
    return budget.spent
  }

  return Math.max(0, Math.round((budget.startBalance - balance) * 100) / 100)
}

/** Why a run or generate must not start under this budget, or undefined. */
export function budgetRefusal(budget: RookBudget | null, kind: 'run' | 'generate', estimate: number | undefined): string | undefined {
  if (budget === null) {
    return undefined
  }

  const left = Math.max(0, budget.limit - budget.spent)
  const off = 'Raise it with /rook budget <credits>, or lift it with /rook budget off.'
  const spent = `${credits(budget.spent)} of the session's ${credits(budget.limit)} budget spent`

  if (budget.spent >= budget.limit) {
    return `rook: budget reached — ${spent}, so this ${kind} was not started. ${off}`
  }

  if (estimate !== undefined && estimate > left) {
    return `rook: this ${kind} would take about ${credits(estimate)}, more than the ${credits(left)} left of the session's budget (${spent}), so it was not started. ${off}`
  }

  return undefined
}

export function budgetText(budget: RookBudget | null, balance: number | null | undefined): string {
  if (budget === null) {
    return `no budget set${balance === null || balance === undefined ? '' : ` · balance ${credits(balance)}`}. /rook budget <credits> caps what runs and generates may spend this session.`
  }

  return (
    `budget ${credits(budget.limit)} · ${credits(budget.spent)} spent · ${credits(Math.max(0, budget.limit - budget.spent))} left` +
    (balance === null || balance === undefined ? '' : ` · balance ${credits(balance)}`) +
    (budget.startBalance === undefined ? ' (the balance could not be read when it was set: spending is not tracked until it can)' : '')
  )
}
