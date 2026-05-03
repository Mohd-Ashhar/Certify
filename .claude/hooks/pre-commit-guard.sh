#!/bin/bash
# PreToolUse hook on Bash — blocks `git commit` if lint or i18n audit fails.
# Reads Claude Code hook JSON from stdin; emits a permissionDecision JSON to deny.

set -uo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Only act on `git commit` invocations. Leave everything else alone.
if [[ ! "$COMMAND" =~ (^|[[:space:]\;\&\|\(])git[[:space:]]+commit([[:space:]]|$) ]]; then
  exit 0
fi

# Skip hook recursion: if we're being invoked because the model is RUNNING the
# guard manually, don't re-run lint inside lint.
if [[ "$COMMAND" == *"npm run lint"* || "$COMMAND" == *"audit.mjs"* ]]; then
  exit 0
fi

cd "$PROJECT_DIR" || exit 0

# Lint: advisory-only by default. Set CERTIFYCX_BLOCK_ON_LINT=1 to make it a hard
# block (recommended once the repo's existing lint errors are cleaned up).
LINT_OUT=$(npm run lint --silent 2>&1)
LINT_RC=$?

# i18n audit: hard block. Drift here is a real regression.
I18N_OUT=$(node .claude/skills/i18n-audit/audit.mjs 2>&1)
I18N_RC=$?

LINT_BLOCKS=${CERTIFYCX_BLOCK_ON_LINT:-0}

SHOULD_BLOCK=0
REASON="Pre-commit guard blocked the commit."

if [[ $I18N_RC -ne 0 ]]; then
  SHOULD_BLOCK=1
  REASON+=" i18n audit found drift — run \`node .claude/skills/i18n-audit/audit.mjs\` to see findings."
fi

if [[ $LINT_RC -ne 0 && $LINT_BLOCKS -eq 1 ]]; then
  SHOULD_BLOCK=1
  REASON+=" Lint failed — run \`npm run lint\` to see findings."
fi

# Always print lint status to stderr so the model sees it on the next turn,
# even when not blocking. Helps catch new lint regressions introduced this session.
if [[ $LINT_RC -ne 0 && $LINT_BLOCKS -ne 1 ]]; then
  echo "[pre-commit hook] WARNING: npm run lint exited $LINT_RC — pre-existing errors present. Set CERTIFYCX_BLOCK_ON_LINT=1 to make this blocking once the repo is clean." >&2
fi

if [[ $SHOULD_BLOCK -eq 1 ]]; then
  REASON+=" Fix and retry the commit."
  jq -n --arg reason "$REASON" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
fi

exit 0
