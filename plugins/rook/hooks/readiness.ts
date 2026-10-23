import type { RookReadiness, RookReadyStep, RookStepId } from '../types'
import { activeAgentOf, agentIdsOf, isProjectDir, projectDirName, projectIdOf, ROOT, SCENARIO_ID } from './workspace'
import type { Io } from './workspace'

/**
 * Whether rook can do anything here yet, as the ordered checklist a first
 * session walks: rook installed, signed in, a project selected, an agent,
 * scenarios, a profile. Every refusal the mod gives names the first unticked
 * step and the exact next action, so `/rook status`, `/rook scenarios`, a pane
 * button and Claude's own tool call all say the same thing.
 *
 * The disk half is read on every poll: a few lists and two small files. What
 * only the CLI knows (installed, signed in) is probed at session start and
 * again when a step it decides is the one blocking, or rook refuses with a
 * remedy that names it — never every poll, since `rook auth status` is a
 * network call.
 */

/** What only the CLI can say. Undefined means not probed yet: not a reason to refuse. */
export type CliFacts = {
  /** `rook --version`'s number ('' when it printed none); null when the binary would not run. */
  version?: string | null
  /** `out` only on rook's own word (`rook auth status` exit 1, or a `login` remedy). */
  auth?: 'in' | 'out' | 'unknown'
  /** The settings.json text rook refused with `pick_project`: the disk names a project rook does not accept. */
  projectRefused?: string
}

export type DiskFacts = {
  /** `.testmuai/rook/` exists: a repository rook has been pointed at. */
  hasWorkspace: boolean
  settingsText?: string
  projectId?: string
  /** The selected project's name from its project.yaml, when rook has written one. */
  projectName?: string
  agents: string[]
  /** The agent rook would act on: the one `active` names, or the only one. */
  agentId?: string
  scenarios: number
  profiles: string[]
  /** The profile a run would use: the one `profiles/active` names, or the only one. */
  profileId?: string
}

/** Each step's short form for the status line. */
const SHORT: Record<RookStepId, string> = {
  installed: 'install rook',
  signed_in: 'sign in',
  project: 'select a project',
  agent: 'explore the agent',
  scenarios: 'generate scenarios',
  profile: 'add a profile',
}

/** What each action needs before rook will take it (rook's own gate table: explore needs a project, generate an active agent). */
export const NEEDS: Record<'run' | 'generate' | 'status' | 'explore' | 'profileTest', readonly RookStepId[]> = {
  run: ['installed', 'signed_in', 'project', 'agent', 'scenarios', 'profile'],
  generate: ['installed', 'signed_in', 'project', 'agent'],
  status: ['installed', 'signed_in', 'project'],
  // explore is what writes the agent, so it cannot need one
  explore: ['installed', 'signed_in', 'project'],
  // a profile test calls the agent once: no scenarios needed, and it may name a profile that is not the active one
  profileTest: ['installed', 'signed_in', 'project', 'agent'],
}

const names = async (io: Io, path: string, kind: string): Promise<string[]> =>
  (await io.list(path).catch(() => [])).filter(entry => entry.kind === kind).map(entry => entry.name)

export async function diskFacts(io: Io): Promise<DiskFacts> {
  const settingsText = await io.read(`${ROOT}/settings.json`)
  const projects = await names(io, `${ROOT}/projects`, 'dir')
  const hasWorkspace = settingsText !== undefined || projects.length > 0
  let projectId: string | undefined

  // rook reads the pointer as JSON; an older workspace wrote YAML there
  // (`active_entity: null`), which rook answers with "no project selected".
  try {
    projectId = settingsText === undefined ? undefined : projectIdOf(JSON.parse(settingsText))
  } catch {
    projectId = undefined
  }

  // The project directory the mod reads results from: the selected one, or the
  // only one. Results stay readable even when rook would refuse to run.
  const project = projectDirName(projects, projectId)
  const facts: DiskFacts = { hasWorkspace, ...(settingsText !== undefined && { settingsText }), ...(projectId !== undefined && { projectId }), agents: [], scenarios: 0, profiles: [] }

  if (project === undefined) {
    return facts
  }

  const projectDir = `${ROOT}/projects/${project}`
  const projectName = /^name:\s*(.+?)\s*$/m.exec((await io.read(`${projectDir}/project.yaml`)) ?? '')?.[1]?.replace(/^(['"])(.*)\1$/, '$2')

  if (projectName !== undefined && projectId !== undefined && isProjectDir(project, projectId)) {
    facts.projectName = projectName
  }

  const agents = await agentIdsOf(io, `${projectDir}`)
  const agentId = activeAgentOf(agents, (await io.read(`${projectDir}/active`))?.trim())

  if (agentId === undefined) {
    return { ...facts, agents }
  }

  const agentDir = `${projectDir}/agents/${agentId}`
  const scenarios = (await names(io, `${agentDir}/scenarios`, 'file')).filter(name => SCENARIO_ID.test(name.replace(/\.yaml$/, '')) && name.endsWith('.yaml')).length
  const profiles = (await names(io, `${agentDir}/profiles`, 'file')).filter(name => name.endsWith('.yaml')).map(name => name.replace(/\.yaml$/, ''))
  const activeProfile = (await io.read(`${agentDir}/profiles/active`))?.trim()
  // Same rule as the agent: rook auto-selects a lone (verified) profile.
  const profileId = activeProfile !== undefined && profiles.includes(activeProfile) ? activeProfile : profiles.length === 1 ? profiles[0] : undefined

  return { ...facts, agents, agentId, scenarios, profiles, ...(profileId !== undefined && { profileId }) }
}

const oneOf = (ids: readonly string[]) => (ids.length === 0 ? '' : ` — one of ${ids.slice(0, 6).join(', ')}${ids.length > 6 ? ', …' : ''}`)

export function readinessOf(disk: DiskFacts, cli: CliFacts): RookReadiness {
  const isProject = disk.projectId !== undefined && (cli.projectRefused === undefined || cli.projectRefused !== disk.settingsText)
  const steps: RookReadyStep[] = [
    cli.version === null
      ? { id: 'installed', label: 'rook not found', ok: false, hint: 'install it with `! npm install -g @testmuai/rook` (any OS) or `! brew install lambdatest/rook/rook`, or set rookPath in /config' }
      : { id: 'installed', label: cli.version ? `rook ${cli.version}` : 'rook installed', ok: true },
    cli.auth === 'out'
      ? { id: 'signed_in', label: 'not signed in', ok: false, hint: 'run `! rook login` (it opens a browser)' }
      : { id: 'signed_in', label: cli.auth === 'in' ? 'signed in' : 'sign-in not checked', ok: true },
    isProject
      ? { id: 'project', label: `project ${disk.projectName ?? disk.projectId}`, ok: true }
      : {
          id: 'project',
          label: disk.projectId === undefined ? 'no project selected' : `project ${disk.projectId} is not accepted by rook`,
          ok: false,
          hint: 'type `/rook project` to see your projects and `/rook project use <id>` to pick one, or ask Claude to set rook up',
        },
    disk.agentId !== undefined
      ? { id: 'agent', label: `agent ${disk.agentId}`, ok: true }
      : disk.agents.length === 0
        ? { id: 'agent', label: 'no agent yet', ok: false, hint: 'ask Claude to explore the repo with rook, or type `/rook explore` (it reads the code and spends credits)' }
        : { id: 'agent', label: `no active agent (${disk.agents.length} on disk)`, ok: false, hint: `type \`/rook agent use <id>\`${oneOf(disk.agents)}` },
    disk.scenarios > 0
      ? { id: 'scenarios', label: `${disk.scenarios} scenario${disk.scenarios === 1 ? '' : 's'}`, ok: true }
      : { id: 'scenarios', label: 'no scenarios', ok: false, hint: 'ask Claude to write scenarios, or type `/rook generate` (spends credits)' },
    disk.profileId !== undefined
      ? { id: 'profile', label: `profile ${disk.profileId}`, ok: true }
      : disk.profiles.length === 0
        ? { id: 'profile', label: 'no profile', ok: false, hint: 'run `! rook profile add <name>` yourself (it asks questions)' }
        : { id: 'profile', label: 'no active profile', ok: false, hint: `type \`/rook profile use <id>\`${oneOf(disk.profiles)}` },
  ]
  const next = steps.find(step => !step.ok)?.hint

  return { steps, hasWorkspace: disk.hasWorkspace, ...(next !== undefined && { next }) }
}

/** The first step an action needs that is not ticked. */
export const blockerOf = (readiness: RookReadiness | undefined, need: readonly RookStepId[]): RookReadyStep | undefined =>
  readiness?.steps.find(step => !step.ok && need.includes(step.id))

/** A refusal: what is missing and the next action. Never starts with "rook": Claude Code labels command output with it already. */
export function blockedText(readiness: RookReadiness | undefined, need: readonly RookStepId[], doing: string): string | undefined {
  const step = blockerOf(readiness, need)

  return step === undefined ? undefined : `can't ${doing} yet: ${step.label}. Next: ${step.hint ?? 'see /rook'}.`
}

/** The whole checklist, for `/rook`, `/rook status` and the tools when nothing can run. */
export function checklistText(readiness: RookReadiness): string {
  const next = readiness.steps.find(step => !step.ok)

  return [
    next === undefined ? 'setup complete:' : 'setup is not finished:',
    ...readiness.steps.map(step => `  ${step.ok ? '✓' : '✗'} ${step.label}`),
    ...(next === undefined ? [] : [`Next: ${next.hint ?? 'see /rook'}.`]),
  ].join('\n')
}

/** `setup: sign in` while a rook workspace is not ready to run; nothing anywhere else. */
export function setupLine(readiness: RookReadiness | undefined): string | undefined {
  const step = readiness?.hasWorkspace ? readiness.steps.find(s => !s.ok) : undefined

  return step === undefined ? undefined : `setup: ${SHORT[step.id]}`
}

/** `rook --version`: the number, '' when it printed none, null when it did not run. */
export const versionOf = (exitCode: number, stdout: string): string | null =>
  exitCode === 0 ? (/\d+\.\d+\.\d+[\w.+-]*/.exec(stdout)?.[0] ?? '') : null

/**
 * `rook auth status` has no `--json`; its exit code and sentence are the
 * contract. Exit 1 naming `rook login` is signed out, expired or revoked;
 * exit 0 is signed in, except "cannot reach rook-api", which says nothing
 * about the token; anything else (a server error) is unknown.
 */
export function authOf(exitCode: number, text: string): 'in' | 'out' | 'unknown' {
  if (exitCode === 0) {
    return /cannot reach/i.test(text) ? 'unknown' : 'in'
  }

  return /rook login/.test(text) ? 'out' : 'unknown'
}

/**
 * What a failed rook command teaches about readiness: rook's `remedy` code,
 * or a binary that would not start. Returns the facts with it applied, or
 * undefined when it says nothing new.
 */
export function learned(cli: CliFacts, disk: DiskFacts, failure: { doc: unknown; stderr: string }): CliFacts | undefined {
  const remedy = (failure.doc as { remedy?: unknown } | undefined)?.remedy

  if (failure.stderr.startsWith('could not run ')) {
    return cli.version === null ? undefined : { ...cli, version: null }
  }

  if (remedy === 'login') {
    return cli.auth === 'out' ? undefined : { ...cli, auth: 'out' }
  }

  if ((remedy === 'pick_project' || remedy === 'create_project') && disk.settingsText !== undefined) {
    return cli.projectRefused === disk.settingsText ? undefined : { ...cli, projectRefused: disk.settingsText }
  }

  return undefined
}
