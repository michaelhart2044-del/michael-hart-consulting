/**
 * Calendly event slugs — must match lib/site.ts booking URLs exactly.
 * Both meetings are Teams-based.
 */
export const CALENDLY_EVENT_SLUGS = {
  consult30: '30min', // Initial Consultation
  comprehensive60: 'comprehensive-process-review-roadmap', // Comprehensive Process Review & Roadmap
} as const;

export type CalendlyMeetingKind = keyof typeof CALENDLY_EVENT_SLUGS;

const SLUG_TO_KIND: Record<string, CalendlyMeetingKind> = {
  [CALENDLY_EVENT_SLUGS.consult30]: 'consult30',
  [CALENDLY_EVENT_SLUGS.comprehensive60]: 'comprehensive60',
};

/** Extract trailing slug from a Calendly event_type URI or scheduling URL path. */
export function extractCalendlyEventSlug(eventTypeUriOrPath: string): string | null {
  const raw = (eventTypeUriOrPath || '').trim();
  if (!raw) return null;

  try {
    const pathname = raw.startsWith('http') ? new URL(raw).pathname : raw;
    const segment = pathname.replace(/\/+$/, '').split('/').filter(Boolean).pop();
    return segment || null;
  } catch {
    const segment = raw.replace(/\/+$/, '').split('/').filter(Boolean).pop();
    return segment || null;
  }
}

/** Map a Calendly event slug to our internal meeting kind. Returns null if unknown. */
export function classifyCalendlySlug(slug: string): CalendlyMeetingKind | null {
  return SLUG_TO_KIND[slug] ?? null;
}

export function isConsult30Slug(slug: string): boolean {
  return slug === CALENDLY_EVENT_SLUGS.consult30;
}

export function isComprehensive60Slug(slug: string): boolean {
  return slug === CALENDLY_EVENT_SLUGS.comprehensive60;
}

const KNOWN_SLUG_VALUES = Object.values(CALENDLY_EVENT_SLUGS);

function slugFromScheduledDuration(scheduled: Record<string, unknown> | undefined): string | null {
  if (!scheduled?.start_time || !scheduled?.end_time) return null;
  const start = new Date(String(scheduled.start_time)).getTime();
  const end = new Date(String(scheduled.end_time)).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;

  const minutes = Math.round((end - start) / 60_000);
  if (minutes >= 25 && minutes <= 35) return CALENDLY_EVENT_SLUGS.consult30;
  if (minutes >= 55 && minutes <= 75) return CALENDLY_EVENT_SLUGS.comprehensive60;
  return null;
}

/**
 * Resolve event slug from a Calendly webhook body.
 * Tries expanded event_type.slug, URI path segments, known slug strings in JSON,
 * public Calendly URL paths, then meeting duration as fallback.
 */
export function resolveSlugFromWebhookPayload(root: unknown): string | null {
  if (!root || typeof root !== 'object') return null;

  const envelope = root as { payload?: Record<string, unknown> };
  const payload = envelope.payload ?? (root as Record<string, unknown>);
  const scheduled = payload.scheduled_event as Record<string, unknown> | undefined;

  const eventType = scheduled?.event_type;
  if (eventType && typeof eventType === 'object' && eventType !== null) {
    const slug = String((eventType as { slug?: string }).slug || '');
    if (slug && classifyCalendlySlug(slug)) return slug;
  }

  const uriCandidates: string[] = [];
  if (typeof eventType === 'string') uriCandidates.push(eventType);
  if (typeof scheduled?.uri === 'string') uriCandidates.push(scheduled.uri);
  if (typeof payload.uri === 'string') uriCandidates.push(payload.uri);
  if (typeof payload.event === 'string') uriCandidates.push(payload.event);

  for (const candidate of uriCandidates) {
    const slug = extractCalendlyEventSlug(candidate);
    if (slug && classifyCalendlySlug(slug)) return slug;
  }

  const json = JSON.stringify(root);
  for (const slug of KNOWN_SLUG_VALUES) {
    if (json.includes(`/${slug}`)) return slug;
  }

  const calendlyPathMatch = json.match(/calendly\.com\/[^/"']+\/([a-z0-9-]+)/i);
  if (calendlyPathMatch?.[1] && classifyCalendlySlug(calendlyPathMatch[1])) {
    return calendlyPathMatch[1];
  }

  return slugFromScheduledDuration(scheduled);
}
