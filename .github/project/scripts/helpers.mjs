import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

export const projectRoot = process.cwd();
export const projectDir = path.join(projectRoot, '.github', 'project');

export function readYaml(relativePath) {
  return yaml.load(fs.readFileSync(path.join(projectRoot, relativePath), 'utf8'));
}

export function listYamlFiles(relativeDir) {
  const dir = path.join(projectRoot, relativeDir);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
    .map(file => path.join(relativeDir, file));
}

export function getRepoContext() {
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo || !repo.includes('/')) {
    throw new Error('GITHUB_REPOSITORY must be set as owner/repo.');
  }
  const [owner, name] = repo.split('/');
  return { owner, name, repo };
}

export function getToken() {
  const token = process.env.GH_PROJECTS_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN or GH_PROJECTS_TOKEN is required.');
  }
  return token;
}

export function isDryRun() {
  return process.argv.includes('--dry-run') || process.env.DRY_RUN === '1';
}

export async function githubRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${getToken()}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${options.method ?? 'GET'} ${url} failed: ${response.status} ${body}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function graphql(query, variables = {}) {
  const response = await githubRequest('https://api.github.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });

  if (response.errors?.length) {
    throw new Error(JSON.stringify(response.errors, null, 2));
  }

  return response.data;
}

export function managedBlock(id, body) {
  return `<!-- managed:sydeso-project:${id}:start -->\n${body.trim()}\n\n<!-- managed:sydeso-project:${id}:end -->`;
}

export function mergeManagedBlock(existingBody, id, newBlock) {
  const start = `<!-- managed:sydeso-project:${id}:start -->`;
  const end = `<!-- managed:sydeso-project:${id}:end -->`;
  const body = existingBody ?? '';
  const startIndex = body.indexOf(start);
  const endIndex = body.indexOf(end);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    return newBlock;
  }

  return `${body.slice(0, startIndex)}${newBlock}${body.slice(endIndex + end.length)}`.trim();
}

export function formatIssueBody(issue) {
  const metadata = [
    '---',
    `Managed ID: ${issue.id}`,
    `Area: ${issue.fields?.Area ?? 'unset'}`,
    `Phase: ${issue.fields?.Phase ?? 'unset'}`,
    `Priority: ${issue.fields?.Priority ?? 'unset'}`,
    '---',
  ].join('\n');

  return `${issue.body?.trim() ?? ''}\n\n${metadata}`;
}
