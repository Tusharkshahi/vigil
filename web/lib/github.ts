export interface GithubRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  updated_at: string;
  default_branch: string;
}

export interface RepoScanResult {
  repo: GithubRepo;
  deps: Record<string, string> | null; // null = no package.json
  error?: string;
}

function makeHeaders(token?: string): HeadersInit {
  const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function fetchUserRepos(
  username: string,
  token?: string
): Promise<GithubRepo[]> {
  const perPage = token ? 50 : 20;
  const url = `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=${perPage}&sort=updated&type=owner`;
  const res = await fetch(url, { headers: makeHeaders(token) });

  if (res.status === 404) throw new Error(`GitHub user "${username}" not found`);
  if (res.status === 403) throw new Error('GitHub rate limit hit — add a Personal Access Token to continue');
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);

  return res.json();
}

export async function fetchOrgRepos(
  org: string,
  token?: string
): Promise<GithubRepo[]> {
  const perPage = token ? 50 : 20;
  const url = `https://api.github.com/orgs/${encodeURIComponent(org)}/repos?per_page=${perPage}&sort=updated&type=public`;
  const res = await fetch(url, { headers: makeHeaders(token) });

  if (res.status === 404) {
    // fall back to user
    return fetchUserRepos(org, token);
  }
  if (res.status === 403) throw new Error('GitHub rate limit hit — add a Personal Access Token to continue');
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);

  return res.json();
}

export async function fetchPackageJson(
  fullName: string,
  branch: string,
  token?: string
): Promise<Record<string, string> | null> {
  const url = `https://api.github.com/repos/${fullName}/contents/package.json?ref=${branch}`;
  const res = await fetch(url, { headers: makeHeaders(token) });

  if (res.status === 404) return null;
  if (!res.ok) return null;

  const data = await res.json();
  if (data.encoding !== 'base64' || !data.content) return null;

  try {
    const decoded = atob(data.content.replace(/\n/g, ''));
    const parsed = JSON.parse(decoded);
    return {
      ...(parsed.dependencies ?? {}),
      ...(parsed.devDependencies ?? {}),
    };
  } catch {
    return null;
  }
}
