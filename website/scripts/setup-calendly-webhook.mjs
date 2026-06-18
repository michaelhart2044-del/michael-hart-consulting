/**
 * Calendly webhook setup helper (Option B).
 *
 * Usage (PowerShell — you provide the token; never commit it):
 *   $env:CALENDLY_PAT = "your_personal_access_token"
 *   node scripts/setup-calendly-webhook.mjs
 *
 * Required PAT scopes (create at https://developer.calendly.com/):
 *   users:read, webhooks:read, webhooks:write, scheduled_events:read
 *
 * Optional:
 *   $env:CALENDLY_WEBHOOK_SIGNING_KEY = "your-chosen-secret"  # else script generates one
 *   $env:WEBHOOK_CALLBACK_URL = "https://www.michaelhartconsulting.com/api/webhooks/calendly"
 */

const PAT = process.env.CALENDLY_PAT?.trim();
const CALLBACK_URL =
  process.env.WEBHOOK_CALLBACK_URL?.trim() ||
  'https://www.michaelhartconsulting.com/api/webhooks/calendly';

if (!PAT) {
  console.error('Missing CALENDLY_PAT. Set your Calendly Personal Access Token in the environment.');
  console.error('Create one at: https://developer.calendly.com/');
  process.exit(1);
}

function randomSigningKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Buffer.from(bytes).toString('base64url');
}

async function api(path, options = {}) {
  const res = await fetch(`https://api.calendly.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${PAT}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: res.status, ok: res.ok, json };
}

async function main() {
  console.log('=== Calendly webhook setup ===\n');

  const me = await api('/users/me');
  if (!me.ok) {
    console.error('GET /users/me failed:', me.status, me.json);
    console.error('\nCommon fixes:');
    console.error('- Token expired — create a new Personal Access Token');
    console.error('- Token needs scopes: users:read, webhooks:read, webhooks:write, scheduled_events:read');
    process.exit(1);
  }

  const user = me.json?.resource;
  const orgUri = user?.current_organization;
  const userUri = user?.uri;

  console.log('User:', user?.name || user?.email);
  console.log('Organization URI:', orgUri || '(none)');
  console.log('User URI:', userUri || '(none)');
  console.log('Callback URL:', CALLBACK_URL);
  console.log('');

  if (!orgUri) {
    console.error('No current_organization on your Calendly user. Use user scope instead or upgrade account.');
    process.exit(1);
  }

  const list = await api(
    `/webhook_subscriptions?organization=${encodeURIComponent(orgUri)}&scope=organization&count=100`,
  );

  if (list.ok && list.json?.collection?.length) {
    console.log('Existing webhook subscriptions:');
    for (const sub of list.json.collection) {
      console.log(`  - ${sub.state} | ${sub.callback_url} | ${(sub.events || []).join(', ')}`);
      console.log(`    uri: ${sub.uri}`);
    }
    console.log('');

    for (const sub of list.json.collection) {
      if (sub.callback_url !== CALLBACK_URL) continue;
      if (sub.state === 'active') {
        console.log('An ACTIVE subscription already points to your callback URL.');
        console.log('If webhooks still fail, the signing key may not match Vercel env.');
        console.log('Delete this subscription and re-run to set a fresh signing_key.\n');
        continue;
      }
      const uuid = sub.uri?.split('/').pop();
      if (!uuid) continue;
      console.log(`Removing ${sub.state} subscription for this URL (${uuid})...`);
      const del = await api(`/webhook_subscriptions/${uuid}`, { method: 'DELETE' });
      if (del.ok || del.status === 204) {
        console.log('  Deleted.\n');
      } else {
        console.warn('  Delete failed:', del.status, del.json);
      }
    }
  } else if (!list.ok) {
    console.warn('Could not list subscriptions:', list.status, list.json);
  }

  const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY?.trim() || randomSigningKey();

  console.log('Creating webhook subscription (organization scope)...');
  const create = await api('/webhook_subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      url: CALLBACK_URL,
      events: ['invitee.created', 'invitee.canceled'],
      organization: orgUri,
      scope: 'organization',
      signing_key: signingKey,
    }),
  });

  if (!create.ok) {
    console.error('POST /webhook_subscriptions failed:', create.status);
    console.error(JSON.stringify(create.json, null, 2));
    console.error('\nCommon fixes:');
    console.error('- Duplicate URL: delete old subscription first');
    console.error('- Try scope "user" with user URI if solo account (see script comments)');
    console.error('- Add scheduled_events:read scope (required for invitee.created/canceled)');
    console.error('- Ensure webhooks:write on your PAT');
    console.error('- Delete disabled/duplicate subscriptions for the same callback URL');
    process.exit(1);
  }

  console.log('\nSuccess! Webhook subscription created.');
  console.log('Subscription URI:', create.json?.resource?.uri);
  console.log('\n--- ADD TO VERCEL (Production + Preview) ---');
  console.log('Variable name:  CALENDLY_WEBHOOK_SIGNING_KEY');
  console.log('Variable value: (copy exactly, no quotes)');
  console.log('');
  console.log(signingKey);
  console.log('');
  console.log('Then redeploy. Check /admin → Calendly panel → Signing key: Configured');
  console.log('Book a test event or use admin simulator to verify.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
