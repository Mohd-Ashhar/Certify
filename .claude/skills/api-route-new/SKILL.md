---
name: api-route-new
description: Scaffold a new api/<name>.js handler for CertifyCX with JWT verification baked in. Use when adding any new serverless API route. Closes the documented auth gap by default.
---

# /api-route-new

Scaffold a new serverless handler under [api/](api/). The default scaffold includes Supabase JWT verification — the gap the existing handlers have. Use this for every new route so the codebase stops accumulating that pattern.

## Args

User typically invokes as `/api-route-new <name> [--public]`. If missing, ask:
1. What's the route name? (becomes `api/<name>.js`, served at `/api/<name>`)
2. Which HTTP method(s)? (default: POST)
3. Required role(s) — super_admin / regional_admin / auditor / certification_body / client / any-authenticated / public?
4. One-line description of what it does.

`--public` skips the JWT check (e.g. self-signup, webhooks). Confirm explicitly with the user before scaffolding without auth.

## Steps

1. Confirm `api/<name>.js` does not exist. If it does, stop.

2. Read [api/create-user.js](api/create-user.js) once to match the project's import + handler style (so the scaffold doesn't drift from existing files).

3. Write `api/<name>.js` using the **authenticated template** below by default:

```js
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// <one-line description of what this route does>
export default async function handler(req, res) {
  if (req.method !== '<METHOD>') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ---- 1. Authenticate the caller via Supabase JWT ----
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
  if (userErr || !userData?.user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  const callerId = userData.user.id;

  // ---- 2. Authorize: load the caller's profile and check role ----
  const { data: profile, error: profileErr } = await supabaseAdmin
    .from('profiles')
    .select('role, region, approval_status')
    .eq('id', callerId)
    .maybeSingle();
  if (profileErr || !profile) {
    return res.status(403).json({ error: 'Profile not found' });
  }

  const allowedRoles = [/* TODO: e.g. 'super_admin', 'regional_admin' */];
  if (allowedRoles.length && !allowedRoles.includes(profile.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  // ---- 3. Validate inputs from req.body ----
  // TODO: validate required fields and types before any DB write.

  try {
    // ---- 4. Do the thing ----
    // TODO: implement the route's actual logic here.

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('<name> error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
```

   Replace `<METHOD>` and `<name>` placeholders with the user's answers. Pre-fill `allowedRoles` from the user's role answer.

4. For a `--public` route, omit steps 1 and 2 and add a comment at the top of the handler explaining why public is acceptable (self-signup, webhook signature verification, etc.). For Stripe webhooks, include `stripe.webhooks.constructEvent` signature verification instead of JWT.

5. Tell the user:
   - File created at `api/<name>.js`
   - Where to add the corresponding `fetch` call from `src/` (typically using `import.meta.env` and the user's Supabase session token via `supabase.auth.getSession()`)
   - Reminder that the local dev server (Vite) auto-routes `/api/<name>` via the plugin in `vite.config.js` — no registration needed
   - That the route will be picked up by `api-security-reviewer` on next edit

## Don't

- Don't omit the auth block "for now" — that's exactly the pattern this skill exists to break.
- Don't put any service-role logic in `src/`. The whole reason for `api/*` is that the service-role key never reaches the browser.
- Don't add fields to `profiles` / `applications` from this skill; that's a migration job (`supabase-migration-author` agent).
