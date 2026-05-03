---
name: rbac-matrix
description: Print the current role × permission matrix derived from src/utils/roles.js. Use when the user wants a snapshot of who can do what — sanity check after RBAC edits, or for sharing with non-technical reviewers.
---

# /rbac-matrix

Generate a role × permission matrix from [src/utils/roles.js](src/utils/roles.js).

## Steps

1. Read [src/utils/roles.js](src/utils/roles.js).
2. Extract `PERMISSIONS` (the list of permission keys) and `ROLE_PERMISSIONS` (the per-role arrays).
3. Build a Markdown table with one row per permission and one column per role. Use ✓ for granted, blank for not granted.
4. Emit the table directly in chat. Group permissions by their section comments in the file (Dashboard, Companies, Certification Requests, Auditors, Certification Bodies, Reports, Users & Settings) — keep that grouping in the output.
5. Below the table, list `getCreatableRoles()` results for super_admin and regional_admin, since this is a frequent question that's easy to miss.
6. End with a one-line summary count: `<N> roles × <M> permissions, <K> total grants`.

## Notes

- Don't show runtime overrides from `CUSTOM_PERMISSION_OVERRIDES` — those live in the `custom_permissions` DB table and aren't visible from source. Mention this caveat in one line at the bottom.
- Don't edit any files. This skill is read-only.
- If the user wants the matrix saved (e.g. "save this to docs/"), ask before writing — by default just print it.
