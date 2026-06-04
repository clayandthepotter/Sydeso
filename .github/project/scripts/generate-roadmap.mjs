import fs from 'node:fs';
import path from 'node:path';
import { getRepoContext, githubRequest } from './helpers.mjs';

const { owner, name } = getRepoContext();
const outputPath = path.join(process.cwd(), 'docs', 'product', 'roadmap.md');
const phases = [
  ['phase:p1', 'P1 Real App Foundation'],
  ['phase:p2', 'P2 Artifact System'],
  ['phase:p3', 'P3 Workflow Engine'],
  ['phase:p4', 'P4 Agent Orchestration'],
  ['phase:p5', 'P5 Runner Protocol'],
  ['phase:p6', 'P6 Development Execution'],
  ['phase:p7', 'P7 Automated QA'],
  ['phase:p8', 'P8 Remediation Loop'],
  ['phase:p9', 'P9 Human Review and Ready'],
  ['phase:p10', 'P10 Productionization'],
];

async function fetchIssues() {
  const issues = [];
  let page = 1;

  while (true) {
    const batch = await githubRequest(
      `https://api.github.com/repos/${owner}/${name}/issues?state=all&per_page=100&page=${page}`,
    );
    if (!batch.length) break;
    issues.push(...batch.filter(issue => !issue.pull_request));
    page += 1;
  }

  return issues;
}

const issues = await fetchIssues();
const now = new Date().toISOString().slice(0, 10);
const lines = [
  '# Product - Public Roadmap',
  '',
  'Version: generated',
  'Status: Generated from GitHub Issues',
  'Owner: Product',
  `Last Updated: ${now}`,
  '',
  '---',
  '',
  '## Purpose',
  '',
  'This roadmap is generated from live GitHub Issues and labels.',
  '',
  'GitHub Issues and GitHub Projects are the definitive execution trackers.',
  '',
  '`TODO.md` remains the in-repo mirror/index.',
  '',
  '---',
  '',
  '## Product Direction',
  '',
  'Sydeso is a state-driven, AI-native software delivery platform that transforms concepts into verified production outcomes.',
  '',
  '---',
  '',
  '## Roadmap by Phase',
  '',
];

for (const [label, title] of phases) {
  const phaseIssues = issues.filter(issue => issue.labels.some(item => item.name === label));
  lines.push(`### ${title}`, '');

  if (!phaseIssues.length) {
    lines.push('- No tracked issues yet.', '');
    continue;
  }

  for (const issue of phaseIssues) {
    const state = issue.state === 'closed' ? 'done' : 'open';
    lines.push(`- [${state}] [#${issue.number} ${issue.title}](${issue.html_url})`);
  }

  lines.push('');
}

const unphased = issues.filter(issue => !issue.labels.some(label => label.name.startsWith('phase:p')));
lines.push('---', '', '## Unphased / Cross-Cutting', '');

if (!unphased.length) {
  lines.push('- No tracked issues yet.', '');
} else {
  for (const issue of unphased) {
    const state = issue.state === 'closed' ? 'done' : 'open';
    lines.push(`- [${state}] [#${issue.number} ${issue.title}](${issue.html_url})`);
  }
  lines.push('');
}

fs.writeFileSync(outputPath, `${lines.join('\n')}\n`);
console.log(`Generated ${outputPath}`);
