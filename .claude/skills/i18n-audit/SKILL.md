---
name: i18n-audit
description: Audit en/es/ar locale files for missing keys, empty values, and likely-untranslated entries. Use when the user wants a one-shot drift report across all three locales.
---

# /i18n-audit

Diff the three CertifyCX locale files at [src/i18n/locales/](src/i18n/locales/) and emit a single report.

## Steps

1. Run the helper script:

   ```bash
   node .claude/skills/i18n-audit/audit.mjs
   ```

   If the script fails or doesn't exist, fall back to reading each locale file and computing the diff inline (use Bash with a Node one-liner via `node -e`).

2. The script outputs:
   - Keys present in `en.json` but missing in `es.json`
   - Keys present in `en.json` but missing in `ar.json`
   - Keys present in `es.json` or `ar.json` but NOT in `en.json` (extras / leftovers)
   - Empty string values in any file
   - Values in `es.json` / `ar.json` that are byte-identical to the English value (likely untranslated)

3. Summarize the output in chat. Don't dump hundreds of keys — show counts by category and the first ~10 examples per category. Tell the user how to see the full output (`node .claude/skills/i18n-audit/audit.mjs --full` or similar).

4. If everything is clean, say `i18n OK — N keys, all locales in sync`.

## Don't

- Don't fix anything in this skill — it's audit-only. If the user wants to fix missing keys, suggest `/i18n-add <key>` for each.
- Don't filter out `[DRAFT] `-prefixed values from the "likely untranslated" check — those should be flagged as unfinished work.
