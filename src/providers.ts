import type { BenchmarkConfig } from './types.js';

/**
 * All provider benchmark configurations.
 *
 * Each provider is benchmarked through the main `computesdk` package.
 * All providers also require COMPUTESDK_API_KEY (checked globally in the runner).
 */

export const providers: BenchmarkConfig[] = [
  {
    name: 'e2b',
    requiredEnvVars: ['E2B_API_KEY'],
    envToConfig: { E2B_API_KEY: 'apiKey' },
  },
  {
    name: 'vercel',
    requiredEnvVars: ['VERCEL_TOKEN', 'VERCEL_TEAM_ID', 'VERCEL_PROJECT_ID'],
    envToConfig: { VERCEL_TOKEN: 'token', VERCEL_TEAM_ID: 'teamId', VERCEL_PROJECT_ID: 'projectId' },
  },
  {
    name: 'blaxel',
    requiredEnvVars: ['BL_API_KEY', 'BL_WORKSPACE'],
    envToConfig: { BL_API_KEY: 'apiKey', BL_WORKSPACE: 'workspace' },
  },
  {
    name: 'modal',
    requiredEnvVars: ['MODAL_TOKEN_ID', 'MODAL_TOKEN_SECRET'],
    envToConfig: { MODAL_TOKEN_ID: 'tokenId', MODAL_TOKEN_SECRET: 'tokenSecret' },
  },
  {
    name: 'daytona',
    requiredEnvVars: ['DAYTONA_API_KEY'],
    envToConfig: { DAYTONA_API_KEY: 'apiKey' },
  },
  {
    name: 'namespace',
    requiredEnvVars: ['NSC_TOKEN'],
    envToConfig: { NSC_TOKEN: 'token' },
  },
  {
    name: 'railway',
    requiredEnvVars: ['RAILWAY_API_KEY', 'RAILWAY_PROJECT_ID', 'RAILWAY_ENVIRONMENT_ID'],
    envToConfig: { RAILWAY_API_KEY: 'apiToken', RAILWAY_PROJECT_ID: 'projectId', RAILWAY_ENVIRONMENT_ID: 'environmentId' },
  },
  {
    name: 'render',
    requiredEnvVars: ['RENDER_API_KEY', 'RENDER_OWNER_ID'],
    envToConfig: { RENDER_API_KEY: 'apiKey', RENDER_OWNER_ID: 'ownerId' },
  },
];