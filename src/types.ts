// Core domain types for Vigil

export interface Release {
  version: string;
  date: string;
  title: string;
  body: string;
  url: string;
  source: 'github' | 'vendor' | 'npm';
  package: string;
}

export interface BreakingChange {
  summary: string;
  type: 'breaking' | 'deprecated' | 'removed';
  raw: string;
}

export interface ChangeReport {
  package: string;
  version: string;
  date: string;
  url: string;
  breaking: BreakingChange[];
  deprecated: BreakingChange[];
  hasBreaking: boolean;
}

export interface CollectorConfig {
  id: string;
  name: string;
  targetPattern: string;
  schemaPath: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  nullFields: string[];
}

export interface HealAttempt {
  collectorId: string;
  prompt: string;
  timestamp: string;
  success: boolean;
  attempt: number;
}

export interface ScraperStatus {
  collectorId: string;
  name: string;
  healthy: boolean;
  lastRun: string | null;
  lastHeal: string | null;
  validationErrors: string[];
}

export interface Subscription {
  id: number;
  packages: string[];
  slackWebhook: string | null;
  discordWebhook: string | null;
  email: string | null;
  createdAt: string;
}
