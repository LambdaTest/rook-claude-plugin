import { describe, expect, test } from 'claude-code/testing'

import { authOf, blockedText, checklistText, diskFacts, learned, NEEDS, readinessOf, setupLine, versionOf } from '../hooks/readiness'
import type { Io } from '../hooks/workspace'
import { AGENT_DIR, workspace } from './fixtures/workspace'

/** An `Io` over a map of files, listing directories the way `$.fs.list` does. */
function ioOver(files: Readonly<Record<string, string>>): Io {
  return {
    read: async path => files[path],
    list: async path => {
      const names = new Map<string, string>()

      for (const file of Object.keys(files)) {
        if (file.startsWith(`${path}/`)) {
          const rest = file.slice(path.length + 1)
          names.set(rest.split('/')[0]!, rest.includes('/') ? 'dir' : 'file')
        }
      }

      return [...names.entries()].map(([name, kind]) => ({ name, kind }))
    },
  }
}

const SIGNED_IN = { version: '0.1.0', auth: 'in' } as const
/** The settings file an older rook wrote: YAML where rook now reads JSON, nothing selected. */
const YAML_SETTINGS = "version: 1\ncreated: '2026-09-20T10:00:00.000Z'\nactive_entity: null\n"

const without = (files: Record<string, string>, part: string) => Object.fromEntries(Object.entries(files).filter(([path]) => !path.includes(part)))

describe('readiness', () => {
  test('a ready workspace ticks every step, with what each found', async () => {
    const readiness = readinessOf(await diskFacts(ioOver(workspace())), SIGNED_IN)

    expect(readiness.steps.map(step => `${step.ok ? '✓' : '✗'} ${step.label}`)).toEqual([
      '✓ rook 0.1.0',
      '✓ signed in',
      '✓ project 01M0EXAMP1EPR0JECT0000000A',
      '✓ agent commercecare',
      '✓ 3 scenarios',
      '✓ profile commerce-http',
    ])
    expect(readiness.next).toBeUndefined()
    expect(readiness.hasWorkspace).toBe(true)
    expect(blockedText(readiness, NEEDS.run, 'run')).toBeUndefined()
    expect(setupLine(readiness)).toBeUndefined()
  })

  test('no workspace at all: a project is the first thing rook needs, and the status line stays silent', async () => {
    const readiness = readinessOf(await diskFacts(ioOver({ 'README.md': '# hi' })), SIGNED_IN)

    expect(readiness.hasWorkspace).toBe(false)
    expect(readiness.next).toBe('type `/rook project` to see your projects and `/rook project use <id>` to pick one, or ask Claude to set rook up')
    expect(readiness.steps.filter(step => !step.ok).map(step => step.id)).toEqual(['project', 'agent', 'scenarios', 'profile'])
    expect(setupLine(readiness)).toBeUndefined()
  })

  test('YAML settings with active_entity: null is no project selected, though the results are still on disk', async () => {
    const disk = await diskFacts(ioOver(workspace({ '.testmuai/rook/settings.json': YAML_SETTINGS })))
    const readiness = readinessOf(disk, SIGNED_IN)

    expect(disk.agentId).toBe('commercecare')
    expect(readiness.steps.find(step => step.id === 'project')).toMatchObject({ ok: false, label: 'no project selected' })
    expect(blockedText(readiness, NEEDS.run, 'run')).toBe(
      "can't run yet: no project selected. Next: type `/rook project` to see your projects and `/rook project use <id>` to pick one, or ask Claude to set rook up.",
    )
    expect(setupLine(readiness)).toBe('setup: select a project')
  })

  test('selections name the project too', async () => {
    const settings = JSON.stringify({ version: 2, selections: { prod: { project_id: '01M0EXAMP1EPR0JECT0000000A' } } })
    const readiness = readinessOf(await diskFacts(ioOver(workspace({ '.testmuai/rook/settings.json': settings }))), SIGNED_IN)

    expect(readiness.next).toBeUndefined()
  })

  test('an agent: none explored, several and none active', async () => {
    const none = readinessOf(await diskFacts(ioOver(without(workspace(), '/agents/'))), SIGNED_IN)

    expect(none.next).toBe('ask Claude to explore the repo with rook, or type `/rook explore` (it reads the code and spends credits)')

    const files = workspace({ [AGENT_DIR.replace('commercecare', 'billing') + '/agent.yaml']: 'id: billing\n' })
    delete files['.testmuai/rook/projects/shop--01M0EXAMP1EPR0JECT0000000A/active']
    const several = readinessOf(await diskFacts(ioOver(files)), SIGNED_IN)

    expect(several.steps.find(step => step.id === 'agent')).toMatchObject({ ok: false, label: 'no active agent (2 on disk)' })
    expect(several.next).toBe('type `/rook agent use <id>` — one of billing, commercecare')
  })

  test('scenarios, then a profile: generate, then add one (or pick one)', async () => {
    const bare = readinessOf(await diskFacts(ioOver(without(without(without(workspace(), '/scenarios/'), '/profiles/'), '/runs/'))), SIGNED_IN)

    expect(bare.next).toBe('ask Claude to write scenarios, or type `/rook generate` (spends credits)')
    expect(blockedText(bare, NEEDS.generate, 'generate scenarios')).toBeUndefined()
    expect(bare.steps.find(step => step.id === 'profile')?.hint).toBe('run `! rook profile add <name>` yourself (it asks questions)')

    const two = workspace({ [`${AGENT_DIR}/profiles/staging.yaml`]: 'id: staging\n' })
    delete two[`${AGENT_DIR}/profiles/active`]
    const unpicked = readinessOf(await diskFacts(ioOver(two)), SIGNED_IN)

    expect(unpicked.next).toBe('type `/rook profile use <id>` — one of commerce-http, staging')
  })

  test('CLI facts: not installed, signed out; unprobed is not a refusal', async () => {
    const disk = await diskFacts(ioOver(workspace()))

    expect(readinessOf(disk, {}).next).toBeUndefined()
    expect(readinessOf(disk, { version: null }).next).toBe('install it with `! npm install -g @testmuai/rook` (any OS) or `! brew install lambdatest/rook/rook`, or set rookPath in /config')
    expect(blockedText(readinessOf(disk, { version: '0.1.0', auth: 'out' }), NEEDS.status, 'read status')).toBe(
      "can't read status yet: not signed in. Next: run `! rook login` (it opens a browser).",
    )
    expect(setupLine(readinessOf(disk, { auth: 'out' }))).toBe('setup: sign in')
  })

  test('the checklist text marks each step and ends with the next action', async () => {
    const readiness = readinessOf(await diskFacts(ioOver({ '.testmuai/rook/settings.json': YAML_SETTINGS })), SIGNED_IN)

    expect(checklistText(readiness)).toBe(
      [
        'setup is not finished:',
        '  ✓ rook 0.1.0',
        '  ✓ signed in',
        '  ✗ no project selected',
        '  ✗ no agent yet',
        '  ✗ no scenarios',
        '  ✗ no profile',
        'Next: type `/rook project` to see your projects and `/rook project use <id>` to pick one, or ask Claude to set rook up.',
      ].join('\n'),
    )
  })

  test('probe outputs: rook --version and rook auth status', () => {
    expect(versionOf(0, 'rook 0.1.4\n')).toBe('0.1.4')
    expect(versionOf(0, 'dev\n')).toBe('')
    expect(versionOf(127, '')).toBeNull()
    expect(authOf(0, 'signed in as dev · Org · team')).toBe('in')
    expect(authOf(0, 'cannot reach rook-api to check the token')).toBe('unknown')
    expect(authOf(1, 'not signed in — run `rook login`')).toBe('out')
    expect(authOf(1, 'your session expired and could not be renewed — run `rook login`')).toBe('out')
    expect(authOf(1, 'rook-api answered but could not verify the token (HTTP 503) — try again shortly')).toBe('unknown')
  })

  test("rook's remedy codes and a missing binary teach the checklist", async () => {
    const disk = await diskFacts(ioOver(workspace()))

    expect(learned({}, disk, { doc: { ok: false, error: 'signed out', remedy: 'login' }, stderr: '' })).toEqual({ auth: 'out' })
    expect(learned({}, disk, { doc: undefined, stderr: 'could not run rook: ENOENT' })).toEqual({ version: null })
    expect(learned({}, disk, { doc: { ok: false, remedy: 'topup' }, stderr: '' })).toBeUndefined()

    // rook refusing the project the disk names: not selected, until settings.json changes
    const refused = learned({}, disk, { doc: { ok: false, error: 'no project selected', remedy: 'pick_project' }, stderr: '' })!

    expect(readinessOf(disk, refused).steps.find(step => step.id === 'project')?.ok).toBe(false)
    expect(readinessOf({ ...disk, settingsText: '{"active_project_id":"other"}' }, refused).steps.find(step => step.id === 'project')?.ok).toBe(true)
  })
})
