---
name: i18n-add
description: Add a new i18n string with draft translations across en/es/ar in one shot. Use when the user wants to add a UI string and avoid the silent translation-drift bug of editing only en.json.
---

# /i18n-add

Add a new translation key to all three locale files at [src/i18n/locales/](src/i18n/locales/) — `en.json`, `es.json`, `ar.json` — in one consistent edit.

## Args

The user typically calls this as `/i18n-add <key.path> "<English text>"`. If args are missing, ask:
1. What is the key path? (e.g. `dashboard.welcomeBanner.title`)
2. What is the English text?
3. (Optional) Where will this string be used? Useful context for the Spanish/Arabic translation.

## Steps

1. Read all three locale files. Confirm the key path doesn't already exist; if it does, stop and ask whether to overwrite.

2. Insert the key into each file at the same nested location:
   - **en.json**: the user's exact English text.
   - **es.json**: a Spanish translation prefixed with `[DRAFT] ` so reviewers can grep for unverified strings.
   - **ar.json**: an Arabic translation prefixed with `[DRAFT] `. If the string contains LTR-embedded content (numbers, units, brand names), keep them in their natural order — do not mirror.

3. Edit each file using the Edit tool, preserving JSON formatting (2-space indent, trailing commas matching the existing style in that file).

4. After the edits, confirm to the user:
   - Files modified
   - Key path added
   - Note that ES/AR are marked `[DRAFT]` and should be reviewed before shipping
   - If the string is rendered in JSX, suggest the matching `t('<key.path>')` call and the file likely to consume it (search briefly with grep).

## Translation guidelines

- Match the tone of nearby keys in the same section. If surrounding strings are formal, keep formal.
- For UI strings, prefer concise translations — UI buttons are length-constrained.
- Don't translate technical terms that the codebase uses verbatim (e.g. "ISO 9001", "Stripe", "Supabase") — keep them as-is in all three locales.
- For Arabic, remember it is RTL. The string itself doesn't need direction marks; the layout is handled at the component level.

## Don't

- Don't add the key only to `en.json` — that's exactly the drift this skill prevents.
- Don't auto-trigger any subagent or hook; this skill is the one explicitly invoked.
- Don't generate JSX changes — only the locale files. Suggest, don't implement.
