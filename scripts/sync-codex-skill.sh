#!/usr/bin/env bash
# Copy the rook skill from LambdaTest/rook into the Codex plugin.
#
#   scripts/sync-codex-skill.sh [REF]          update codex/rook/skills/rook from REF
#   scripts/sync-codex-skill.sh --check [REF]  exit 1 if the copy differs from REF
#
# REF is a branch, tag or commit of LambdaTest/rook (default: main). The skill's
# canonical copy is skill-installer/skills/ there; this plugin carries it unchanged
# and records the source commit in codex/skill-source.txt.
set -euo pipefail

repo_url="${ROOK_SKILL_REPO:-https://github.com/LambdaTest/rook.git}"
src_path="skill-installer/skills"
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
dest="$root/codex/rook/skills/rook"
record="$root/codex/skill-source.txt"

check=0
if [[ "${1:-}" == "--check" ]]; then
  check=1
  shift
fi
ref="${1:-main}"

tmp="$(mktemp -d)"
trap 'rm -r -f -- "$tmp"' EXIT

git -C "$tmp" init -q
git -C "$tmp" remote add origin "$repo_url"
git -C "$tmp" fetch -q --depth 1 --filter=blob:none origin "$ref"
git -C "$tmp" sparse-checkout set --no-cone "/$src_path/"
git -C "$tmp" checkout -q FETCH_HEAD
sha="$(git -C "$tmp" rev-parse HEAD)"

if [[ ! -f "$tmp/$src_path/SKILL.md" ]]; then
  echo "error: $src_path/SKILL.md not found at $ref ($sha)" >&2
  exit 2
fi

if [[ "$check" == 1 ]]; then
  if diff -r "$tmp/$src_path" "$dest" >/dev/null; then
    echo "codex/rook/skills/rook matches LambdaTest/rook $sha"
    exit 0
  fi
  echo "codex/rook/skills/rook differs from LambdaTest/rook $sha; run scripts/sync-codex-skill.sh $ref" >&2
  diff -r "$tmp/$src_path" "$dest" >&2 || true
  exit 1
fi

if [[ -d "$dest" ]]; then
  rm -r -- "$dest"
fi
mkdir -p "$dest"
cp -R "$tmp/$src_path/." "$dest/"
printf 'LambdaTest/rook %s %s/\n' "$sha" "$src_path" >"$record"
echo "copied $src_path from LambdaTest/rook $sha"
echo "raise version in codex/rook/.codex-plugin/plugin.json if the skill changed"
