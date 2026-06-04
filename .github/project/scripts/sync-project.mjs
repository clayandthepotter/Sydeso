import { getRepoContext, graphql, isDryRun, readYaml } from './helpers.mjs';

const { owner, name } = getRepoContext();
const config = readYaml('.github/project/project.yml');
const dryRun = isDryRun();

const repoData = await graphql(
  `query($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      id
      projectsV2(first: 50) {
        nodes {
          id
          number
          title
          fields(first: 100) {
            nodes {
              ... on ProjectV2FieldCommon {
                id
                name
                dataType
              }
              ... on ProjectV2SingleSelectField {
                id
                name
                dataType
                options { id name }
              }
            }
          }
        }
      }
    }
    repositoryOwner(login: $owner) { id }
  }`,
  { owner, name },
);

let project = repoData.repository.projectsV2.nodes.find(node => node.title === config.project.title);

if (!project) {
  console.log(`${dryRun ? '[dry-run] ' : ''}create project ${config.project.title}`);
  if (!dryRun) {
    const created = await graphql(
      `mutation($ownerId: ID!, $title: String!) {
        createProjectV2(input: { ownerId: $ownerId, title: $title }) {
          projectV2 { id number title fields(first: 100) { nodes { ... on ProjectV2FieldCommon { id name dataType } } } }
        }
      }`,
      { ownerId: repoData.repositoryOwner.id, title: config.project.title },
    );
    project = created.createProjectV2.projectV2;

    try {
      await graphql(
        `mutation($projectId: ID!, $repositoryId: ID!) {
          linkProjectV2ToRepository(input: { projectId: $projectId, repositoryId: $repositoryId }) {
            repository { id }
          }
        }`,
        { projectId: project.id, repositoryId: repoData.repository.id },
      );
      console.log(`linked project ${config.project.title} to ${owner}/${name}`);
    } catch (error) {
      console.log(`project link skipped: ${error.message}`);
    }
  }
}

if (!project) {
  console.log('dry-run complete before field sync');
  process.exit(0);
}

const existingFields = new Map((project.fields?.nodes ?? []).map(field => [field.name, field]));

for (const field of config.fields ?? []) {
  if (existingFields.has(field.name)) {
    console.log(`field exists ${field.name}`);
    continue;
  }

  if (field.type !== 'single_select') {
    console.log(`skip unsupported field type ${field.name}: ${field.type}`);
    continue;
  }

  console.log(`${dryRun ? '[dry-run] ' : ''}create field ${field.name}`);
  if (!dryRun) {
    await graphql(
      `mutation($projectId: ID!, $name: String!, $options: [ProjectV2SingleSelectFieldOptionInput!]!) {
        createProjectV2Field(input: { projectId: $projectId, dataType: SINGLE_SELECT, name: $name, singleSelectOptions: $options }) {
          projectV2Field { ... on ProjectV2FieldCommon { id name } }
        }
      }`,
      {
        projectId: project.id,
        name: field.name,
        options: field.options.map(option => ({ name: option, color: 'GRAY' })),
      },
    );
  }
}

if (config.views?.length) {
  console.log('Project view configuration is documented in .github/project/project.yml. GitHub does not currently expose stable workflow-friendly view mutation coverage in this script; configure views manually in the Project UI if needed.');
}
