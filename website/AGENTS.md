<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project rules (Michael Hart Consulting)

## Env & secrets — NEVER TOUCH (highest priority)

**Permanent, non-negotiable. Overrides all other instructions.**

NEVER read, open, view, edit, overwrite, delete, or generate content for:

- `.env`, `.env.local`, `.env.*`
- `.env.example` with real values (placeholders only)

NEVER touch or output content from files containing API keys, passwords, secrets, tokens, cookie secrets, database credentials, or any sensitive configuration.

NEVER run `vercel env pull` or `vercel link` if it would touch env files.

If the user mentions `.env` or secrets, respond:

> Understood. I will never touch .env, .env.local or any secrets file. Here is the safe template instead:

Then show a dummy template with placeholders like `YOUR_API_KEY_HERE`. List required variable **names** only; the user edits their own files.
