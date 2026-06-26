export type HqProjectTier = 'core' | 'venture';
export type HqProjectStatus = 'active' | 'planned' | 'paused';

export interface HqProject {
  id: string;
  name: string;
  emoji: string;
  tier: HqProjectTier;
  status: HqProjectStatus;
  path: string;
  purpose: string;
  repo?: string;
  formerNames?: string[];
}

export interface HqChecklistItem {
  id: string;
  label: string;
  hint?: string;
}

export interface HqExternalLink {
  id: string;
  label: string;
  url: string;
}

export interface HqRegistry {
  updated: string;
  businessRoot: string;
  projects: HqProject[];
  preLaunchChecklist?: HqChecklistItem[];
  externalLinks?: HqExternalLink[];
}
