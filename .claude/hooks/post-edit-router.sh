#!/bin/bash
# PostToolUse hook for Edit/Write — routes based on the file path that was changed.
# Receives the standard Claude Code hook JSON on stdin.

set -uo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# i18n locale changes — run audit and surface findings
if [[ "$FILE_PATH" == *"/src/i18n/locales/"*".json" ]]; then
  echo "[i18n hook] locale file changed — running audit"
  if ! node "$PROJECT_DIR/.claude/skills/i18n-audit/audit.mjs"; then
    echo "[i18n hook] findings above. Consider invoking the i18n-sync-checker subagent if these look unintentional."
  fi
fi

# api/ handler changes — remind to run security review
if [[ "$FILE_PATH" =~ /api/[^/]+\.js$ ]]; then
  echo "[api hook] $FILE_PATH changed — invoke api-security-reviewer subagent before committing (Task tool, subagent_type: api-security-reviewer)."
fi

# RBAC source changes — remind to run rbac auditor
if [[ "$FILE_PATH" == *"/src/utils/roles.js" ]]; then
  echo "[rbac hook] roles.js changed — invoke rbac-auditor subagent before committing (Task tool, subagent_type: rbac-auditor)."
fi

# Application lifecycle hot-spot — remind to run lifecycle validator
if [[ "$FILE_PATH" == *"/src/pages/admin/ApplicationDetails.jsx" ]]; then
  echo "[lifecycle hook] ApplicationDetails changed — invoke cert-lifecycle-validator subagent before committing."
fi

exit 0
