import { getRepoContext, githubRequest, isDryRun, readYaml } from './helpers.mjs';

const { owner, name } = getRepoContext();
const config = readYaml('.github/project/labels.yml');
const dryRun = isDryRun();

for (const label of config.labels ?? []) {
  const encoded = encodeURIComponent(label.name);
  const payload = {
    name: label.name,
    color: String(label.color).replace(/^#/, ''),
    description: label.description ?? '',
  };

  try {
    await githubRequest(`https://api.github.com/repos/${owner}/${name}/labels/${encoded}`, {
      method: 'GET',
    });

    console.log(`${dryRun ? '[dry-run] ' : ''}update label ${label.name}`);
    if (!dryRun) {
      await githubRequest(`https://api.github.com/repos/${owner}/${name}/labels/${encoded}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
  } catch (error) {
    if (!String(error.message).includes('404')) throw error;

    console.log(`${dryRun ? '[dry-run] ' : ''}create label ${label.name}`);
    if (!dryRun) {
      await githubRequest(`https://api.github.com/repos/${owner}/${name}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
  }
}
