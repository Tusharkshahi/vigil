import { CollectorConfig } from '../types';

/**
 * Registry of Scraper Studio collectors.
 * IDs are populated after `bdata scraper create` and stored in the .env file.
 * They are stable — the same ID survives self-healing runs.
 */

export const COLLECTORS: Record<string, CollectorConfig> = {
  githubReleases: {
    id: process.env.GH_RELEASES_COLLECTOR_ID ?? '',
    name: 'github-releases',
    targetPattern: 'https://github.com/{org}/{repo}/releases',
    schemaPath: 'schemas/release.schema.json',
  },
  vendorChangelog: {
    id: process.env.VENDOR_CHANGELOG_COLLECTOR_ID ?? '',
    name: 'vendor-changelog',
    targetPattern: 'https://vercel.com/changelog',
    schemaPath: 'schemas/changelog.schema.json',
  },
  npmReleases: {
    id: process.env.NPM_RELEASES_COLLECTOR_ID ?? '',
    name: 'npm-releases',
    targetPattern: 'https://www.npmjs.com/package/{pkg}?activeTab=versions',
    schemaPath: 'schemas/release.schema.json',
  },
};

/**
 * Map a package name to a target URL for the github-releases scraper.
 * Covers the most common packages. Extendable.
 */
export const GITHUB_REPO_MAP: Record<string, string> = {
  react: 'https://github.com/facebook/react/releases',
  nextjs: 'https://github.com/vercel/next.js/releases',
  next: 'https://github.com/vercel/next.js/releases',
  typescript: 'https://github.com/microsoft/TypeScript/releases',
  vite: 'https://github.com/vitejs/vite/releases',
  vitest: 'https://github.com/vitest-dev/vitest/releases',
  prisma: 'https://github.com/prisma/prisma/releases',
  express: 'https://github.com/expressjs/express/releases',
  tailwindcss: 'https://github.com/tailwindlabs/tailwindcss/releases',
  eslint: 'https://github.com/eslint/eslint/releases',
  prettier: 'https://github.com/prettier/prettier/releases',
  webpack: 'https://github.com/webpack/webpack/releases',
  esbuild: 'https://github.com/evanw/esbuild/releases',
  turbopack: 'https://github.com/vercel/turbo/releases',
  astro: 'https://github.com/withastro/astro/releases',
  svelte: 'https://github.com/sveltejs/svelte/releases',
  vue: 'https://github.com/vuejs/core/releases',
  angular: 'https://github.com/angular/angular/releases',
  nest: 'https://github.com/nestjs/nest/releases',
  nestjs: 'https://github.com/nestjs/nest/releases',
  drizzle: 'https://github.com/drizzle-team/drizzle-orm/releases',
  axios: 'https://github.com/axios/axios/releases',
  zod: 'https://github.com/colinhacks/zod/releases',
  trpc: 'https://github.com/trpc/trpc/releases',
  kubernetes: 'https://github.com/kubernetes/kubernetes/releases',
  terraform: 'https://github.com/hashicorp/terraform/releases',
  docker: 'https://github.com/docker/cli/releases',
};

export function getGithubUrl(pkg: string): string | null {
  return GITHUB_REPO_MAP[pkg.toLowerCase()] ?? null;
}

export function getNpmUrl(pkg: string): string {
  return `https://www.npmjs.com/package/${pkg}?activeTab=versions`;
}
