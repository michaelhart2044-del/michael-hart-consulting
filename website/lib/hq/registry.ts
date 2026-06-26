import type { HqRegistry } from '@/lib/hq/types';
import registry from '@/lib/hq/hq-projects.json';

export function getHqRegistry(): HqRegistry {
  return registry as HqRegistry;
}

export function getHqProjectsByTier(tier: 'core' | 'venture') {
  return getHqRegistry().projects.filter((p) => p.tier === tier);
}
