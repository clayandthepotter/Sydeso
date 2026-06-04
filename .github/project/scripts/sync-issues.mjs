import {
  formatIssueBody,
  getRepoContext,
  githubRequest,
  graphql,
  isDryRun,
  listYamlFiles,
  managedBlock,
  mergeManagedBlock,
  readYaml,
} from './helpers.mjs';

const { owner, name, repo } = getRepoContext();
const dryRun = isDryRun();
const projectConfig = readYaml('.github/project/project.yml');
const issueFiles = listYamlFiles('.github/project/issues');

function normalizeIssues(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.issues)) return value.issues;
  return [value];
}

const issues = issueFiles.flatMap(file => normalizeIssues(readYaml(file)));

async function findManagedIssue(issueId) {
  const query = encodeURIComponent(`repo:${repo} "managed:sydeso-project:${issueId}:start" in:body`);
  const result = await githubRequest(`https://api.github.com/search/issues?q=${query}`);
  return result.items?.[0] ?? null;
}

async function upsertIssue(issue) {
  const block = managedBlock(issue.id, formatIssueBody(issue));
  const existing = await findManagedIssue(issue.id);
  const labels = issue.labels ?? [];

  if (!existing) {
    console.log(`${dryRun ? '[dry-run] ' : ''}create issue ${issue.title}`);
    if (dryRun) return null;
    return githubRequest(`https://api.github.com/repos/${owner}/${name}/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: issue.title,
        body: block,
        labels,
      }),
    });
  }

  const existingFull = await githubRequest(`https://api.github.com/repos/${owner}/${name}/issues/${existing.number}`);
  const nextBody = mergeManagedBlock(existingFull.body, issue.id, block);

  console.log(`${dryRun ? '[dry-run] ' : ''}update issue #${existing.number} ${issue.title}`);
  if (dryRun) return existingFull;

  return githubRequest(`https://api.github.com/repos/${owner}/${name}/issues/${existing.number}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: issue.title,
      body: nextBody,
      labels,
    }),
  });
}

async function getProject() {
  const data = await graphql(
    `query($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        projectsV2(first: 50) {
          nodes {
            id
            number
            title
            items(first: 100) { nodes { id content { ... on Issue { id number } } } }
            fields(first: 100) {
              nodes {
                ... on ProjectV2FieldCommon { id name dataType }
                ... on ProjectV2SingleSelectField { id name dataType options { id name } }
              }
            }
          }
        }
      }
    }`,
    { owner, name },
  );

  return data.repository.projectsV2.nodes.find(project => project.title === projectConfig.project.title) ?? null;
}

async function addIssueToProject(project, issue) {
  const existingItem = project.items.nodes.find(item => item.content?.id === issue.node_id);
  if (existingItem) return existingItem.id;

  console.log(`${dryRun ? '[dry-run] ' : ''}add issue #${issue.number} to project`);
  if (dryRun) return null;

  const result = await graphql(
    `mutation($projectId: ID!, $contentId: ID!) {
      addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
        item { id }
      }
    }`,
    { projectId: project.id, contentId: issue.node_id },
  );

  return result.addProjectV2ItemById.item.id;
}

async function setProjectFields(project, itemId, fieldValues) {
  if (!itemId || !fieldValues) return;

  const fields = new Map((project.fields.nodes ?? []).map(field => [field.name, field]));

  for (const [name, value] of Object.entries(fieldValues)) {
    const field = fields.get(name);
    if (!field) {
      console.log(`skip missing project field ${name}`);
      continue;
    }

    if (field.dataType !== 'SINGLE_SELECT') {
      console.log(`skip unsupported field ${name} type ${field.dataType}`);
      continue;
    }

    const option = field.options?.find(item => item.name === value);
    if (!option) {
      console.log(`skip missing option ${name}: ${value}`);
      continue;
    }

    console.log(`${dryRun ? '[dry-run] ' : ''}set field ${name}=${value}`);
    if (!dryRun) {
      await graphql(
        `mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
          updateProjectV2ItemFieldValue(input: {
            projectId: $projectId,
            itemId: $itemId,
            fieldId: $fieldId,
            value: { singleSelectOptionId: $optionId }
          }) {
            projectV2Item { id }
          }
        }`,
        { projectId: project.id, itemId, fieldId: field.id, optionId: option.id },
      );
    }
  }
}

const project = await getProject();
if (!project) {
  console.log(`Project "${projectConfig.project.title}" not found. Run sync-project first or create it in GitHub.`);
}

for (const issueDef of issues) {
  const issue = await upsertIssue(issueDef);
  if (project && issue) {
    const itemId = await addIssueToProject(project, issue);
    await setProjectFields(project, itemId, issueDef.fields);
  }
}
