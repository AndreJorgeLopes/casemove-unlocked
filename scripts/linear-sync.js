#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync, spawnSync } = require('child_process');
const readline = require('readline');

const args = parseArgs(process.argv.slice(2));
const mode = args.mode || 'manual';

const repoRoot = getRepoRoot();
const sessionPath = path.join(repoRoot, '.sisyphus', 'linear-session.json');
const session = readSession(sessionPath);

const LINEAR_API_KEY = process.env.LINEAR_API_KEY || session.apiKey;
const LINEAR_PROJECT_ID = process.env.LINEAR_PROJECT_ID || session.projectId;
const LINEAR_TEAM_ID = process.env.LINEAR_TEAM_ID || session.teamId;
const LINEAR_ASSIGNEE_ID = process.env.LINEAR_ASSIGNEE_ID || session.assigneeId;

const AUTO_NEXT = process.env.LINEAR_AUTO_NEXT !== '0';

main().catch((error) => {
  console.error('[linear-sync] error:', error.message || error);
  process.exitCode = 1;
});

async function main() {
  if (mode === 'init') {
    await runInit();
    return;
  }

  if (!LINEAR_API_KEY) {
    logSkip('LINEAR_API_KEY is missing. Run `npm run linear:init`.');
    return;
  }

  if (mode === 'ci-pr') {
    await syncFromCiEvent();
    return;
  }

  if (!hasGh()) {
    logSkip('gh is not available.');
    return;
  }

  const branch = git('rev-parse --abbrev-ref HEAD');
  const pr = getPrForBranch();

  if (pr) {
    await syncIssueWithPr(pr);
  } else if (mode === 'post-push') {
    await maybeCreatePr(branch);
  }

  if (AUTO_NEXT && pr && pr.state === 'MERGED') {
    await handleMergedPr(pr);
  }
}

async function runInit() {
  const existing = readSession(sessionPath);
  const next = { ...existing };

  if (!process.stdin.isTTY) {
    console.error('[linear-sync] init requires a TTY.');
    process.exitCode = 1;
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  if (!next.apiKey) {
    next.apiKey = await ask(rl, 'Linear API key: ');
  }

  if (!next.apiKey) {
    rl.close();
    console.error('[linear-sync] API key is required.');
    process.exitCode = 1;
    return;
  }

  const teams = await listTeams(next.apiKey);
  const team = await chooseFromList(
    rl,
    'Select a team',
    teams,
    (item) => `${item.name} (${item.key})`,
  );

  const projects = await listProjects(next.apiKey, team?.id);
  const project = await chooseFromList(
    rl,
    'Select a project',
    projects,
    (item) => `${item.name}${item.state ? ` [${item.state}]` : ''}`,
  );

  const users = await listUsers(next.apiKey, team?.id);
  const assignee = await chooseFromList(
    rl,
    'Select an assignee (owner)',
    users,
    (item) => item.name,
  );

  next.teamId = team?.id || next.teamId;
  next.projectId = project?.id || next.projectId;
  next.assigneeId = assignee?.id || next.assigneeId;

  rl.close();

  writeSession(sessionPath, next);
  console.log('[linear-sync] session config saved.');
}

async function syncFromCiEvent() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !fs.existsSync(eventPath)) {
    logSkip('GITHUB_EVENT_PATH is missing.');
    return;
  }

  const payload = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
  const pr = payload.pull_request;
  if (!pr) {
    logSkip('No pull_request payload.');
    return;
  }

  const identifier = extractIdentifier(`${pr.title} ${pr.head?.ref || ''}`);
  if (!identifier) {
    logSkip('No Linear issue identifier found in PR title or branch.');
    return;
  }

  const issue = await findIssueByIdentifier(identifier);
  if (!issue) {
    logSkip(`Linear issue ${identifier} not found.`);
    return;
  }

  await addPrComment(issue.id, {
    url: pr.html_url,
    state: pr.merged ? 'MERGED' : pr.state.toUpperCase(),
    title: pr.title,
    branch: pr.head?.ref || '',
    base: pr.base?.ref || '',
  });
}

async function syncIssueWithPr(pr) {
  const identifier = extractIdentifier(`${pr.title} ${pr.headRefName}`);
  if (!identifier) {
    logSkip('No Linear issue identifier found in PR title or branch.');
    return;
  }

  const issue = await findIssueByIdentifier(identifier);
  if (!issue) {
    logSkip(`Linear issue ${identifier} not found.`);
    return;
  }

  await addPrComment(issue.id, {
    url: pr.url,
    state: pr.state,
    title: pr.title,
    branch: pr.headRefName,
    base: pr.baseRefName,
  });

  updateSession(sessionPath, {
    projectId: issue.project?.id || LINEAR_PROJECT_ID,
    teamId: issue.team?.id || LINEAR_TEAM_ID,
    assigneeId: issue.assignee?.id || LINEAR_ASSIGNEE_ID,
    currentIssueId: issue.id,
    currentIssueIdentifier: issue.identifier,
    currentBranch: pr.headRefName,
    currentPrUrl: pr.url,
  });
}

async function handleMergedPr(pr) {
  const identifier = extractIdentifier(`${pr.title} ${pr.headRefName}`);
  if (!identifier) {
    logSkip('No Linear issue identifier found for merged PR.');
    return;
  }

  const issue = await findIssueByIdentifier(identifier);
  if (!issue) {
    logSkip(`Linear issue ${identifier} not found.`);
    return;
  }

  const nextTitle =
    process.env.LINEAR_NEXT_TITLE || `Follow-up: ${issue.title}`;
  const nextIssue = await createFollowUpIssue(issue, nextTitle);
  if (!nextIssue) {
    return;
  }

  const baseBranch = pr.baseRefName || getDefaultBranch();
  const newBranch = createNewBranch(nextIssue.identifier, baseBranch);
  if (!newBranch) {
    return;
  }

  updateSession(sessionPath, {
    projectId: issue.project?.id || LINEAR_PROJECT_ID,
    teamId: issue.team?.id || LINEAR_TEAM_ID,
    assigneeId: issue.assignee?.id || LINEAR_ASSIGNEE_ID,
    currentIssueId: nextIssue.id,
    currentIssueIdentifier: nextIssue.identifier,
    currentBranch: newBranch,
    currentPrUrl: null,
  });

  await maybeCreatePr(newBranch);
}

async function createFollowUpIssue(issue, title) {
  const input = {
    title,
    teamId: issue.team?.id || LINEAR_TEAM_ID,
    projectId: issue.project?.id || LINEAR_PROJECT_ID,
    assigneeId: issue.assignee?.id || LINEAR_ASSIGNEE_ID,
    description: `Auto-created after merge of ${issue.identifier}.`,
  };

  if (!input.teamId || !input.projectId || !input.assigneeId) {
    logSkip('Missing team/project/assignee for follow-up issue creation.');
    return null;
  }

  const result = await linearRequest(
    `mutation IssueCreate($input: IssueCreateInput!) {\n` +
      `  issueCreate(input: $input) {\n` +
      `    issue { id identifier title }\n` +
      `  }\n` +
      `}`,
    { input },
  );

  return result?.issueCreate?.issue || null;
}

async function maybeCreatePr(branch) {
  if (!hasGh()) {
    return;
  }

  const existing = getPrForBranch();
  if (existing) {
    return;
  }

  const baseBranch = getDefaultBranch();
  const aheadCount = Number(git(`rev-list --count ${baseBranch}..${branch}`));
  if (!aheadCount) {
    logSkip('No commits ahead of base. PR creation deferred.');
    return;
  }

  const identifier =
    session.currentIssueIdentifier || extractIdentifier(branch);
  const issueTitle = identifier
    ? `${identifier} follow-up`
    : `Follow-up ${branch}`;
  const prTitle = identifier ? `${identifier} ${issueTitle}` : issueTitle;

  try {
    gh(
      `pr create --title ${shellQuote(prTitle)} --body ${shellQuote('Auto-created PR.')} --base ${shellQuote(
        baseBranch,
      )} --head ${shellQuote(branch)}`,
    );
  } catch (error) {
    logSkip('Failed to create PR.');
  }
}

function createNewBranch(identifier, baseBranch) {
  if (!identifier) {
    logSkip('Missing identifier for new branch.');
    return null;
  }

  let branch = `linear/${identifier}`;
  let suffix = 1;

  while (branchExists(branch)) {
    suffix += 1;
    branch = `linear/${identifier}-${suffix}`;
  }

  try {
    git(`checkout ${shellQuote(baseBranch)}`);
    git(`checkout -b ${shellQuote(branch)}`);
    return branch;
  } catch (error) {
    logSkip('Failed to create branch.');
    return null;
  }
}

function getPrForBranch() {
  try {
    const output = gh(
      'pr view --json number,state,mergedAt,url,title,headRefName,baseRefName --jq .',
    );
    const pr = JSON.parse(output);
    return {
      number: pr.number,
      state: pr.mergedAt ? 'MERGED' : (pr.state || '').toUpperCase(),
      url: pr.url,
      title: pr.title,
      headRefName: pr.headRefName,
      baseRefName: pr.baseRefName,
    };
  } catch (error) {
    return null;
  }
}

function getDefaultBranch() {
  try {
    const ref = git('symbolic-ref --short refs/remotes/origin/HEAD');
    return ref.replace('origin/', '');
  } catch (error) {
    return 'main';
  }
}

async function findIssueByIdentifier(identifier) {
  const result = await linearRequest(
    `query IssueByIdentifier($identifier: String!) {\n` +
      `  issues(filter: { identifier: { eq: $identifier } }) {\n` +
      `    nodes { id identifier title team { id } project { id } assignee { id } }\n` +
      `  }\n` +
      `}`,
    { identifier },
  );

  return result?.issues?.nodes?.[0] || null;
}

async function addPrComment(issueId, details) {
  const body = [
    'PR update',
    `- URL: ${details.url}`,
    `- State: ${details.state}`,
    `- Title: ${details.title}`,
    `- Branch: ${details.branch}`,
    `- Base: ${details.base}`,
  ].join('\n');

  await linearRequest(
    `mutation CommentCreate($input: CommentCreateInput!) {\n` +
      `  commentCreate(input: $input) {\n` +
      `    comment { id }\n` +
      `  }\n` +
      `}`,
    { input: { issueId, body } },
  );
}

function linearRequest(query, variables) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ query, variables });
    const req = https.request(
      {
        hostname: 'api.linear.app',
        path: '/graphql',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          Authorization: LINEAR_API_KEY,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.errors?.length) {
              reject(new Error(json.errors[0]?.message || 'Linear API error'));
              return;
            }
            resolve(json.data || {});
          } catch (error) {
            reject(error);
          }
        });
      },
    );

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function updateSession(filePath, updates) {
  const next = { ...readSession(filePath), ...updates };
  writeSession(filePath, next);
}

function readSession(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeSession(filePath, data) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function extractIdentifier(text) {
  const match = text.match(/[A-Z]{2,10}-\d+/);
  return match ? match[0] : null;
}

function hasGh() {
  const result = spawnSync('gh', ['--version'], { stdio: 'ignore' });
  return result.status === 0;
}

function git(command) {
  return execSync(`git ${command}`, { encoding: 'utf8' }).trim();
}

function gh(command) {
  return execSync(`gh ${command}`, { encoding: 'utf8' }).trim();
}

function branchExists(branch) {
  const result = spawnSync('git', [
    'show-ref',
    '--verify',
    '--quiet',
    `refs/heads/${branch}`,
  ]);
  return result.status === 0;
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

function logSkip(message) {
  console.warn(`[linear-sync] ${message}`);
}

function getRepoRoot() {
  try {
    return execSync('git rev-parse --show-toplevel', {
      encoding: 'utf8',
    }).trim();
  } catch {
    return process.cwd();
  }
}

function parseArgs(argv) {
  return argv.reduce((acc, arg) => {
    if (arg.startsWith('--mode=')) {
      acc.mode = arg.split('=')[1];
    }
    return acc;
  }, {});
}

function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function listTeams(apiKey) {
  const result = await linearRequestWithKey(
    apiKey,
    `query Teams { teams { nodes { id name key } } }`,
    {},
  );
  return result?.teams?.nodes || [];
}

async function listProjects(apiKey, teamId) {
  const result = await linearRequestWithKey(
    apiKey,
    `query Projects($teamId: String) {\n` +
      `  projects(filter: { team: { id: { eq: $teamId } } }) {\n` +
      `    nodes { id name state }\n` +
      `  }\n` +
      `}`,
    { teamId: teamId || null },
  );
  return result?.projects?.nodes || [];
}

async function listUsers(apiKey, teamId) {
  const result = await linearRequestWithKey(
    apiKey,
    `query Users($teamId: String) {\n` +
      `  users(filter: { team: { id: { eq: $teamId } } }) {\n` +
      `    nodes { id name email }\n` +
      `  }\n` +
      `}`,
    { teamId: teamId || null },
  );
  return result?.users?.nodes || [];
}

async function chooseFromList(rl, title, items, formatItem) {
  if (!items.length) {
    console.warn(`[linear-sync] ${title}: no options found.`);
    return null;
  }

  console.log(`\n${title}`);
  items.forEach((item, index) => {
    console.log(`${index + 1}. ${formatItem(item)}`);
  });

  while (true) {
    const answer = await ask(rl, 'Enter number: ');
    const choice = Number(answer);
    if (Number.isInteger(choice) && choice >= 1 && choice <= items.length) {
      return items[choice - 1];
    }
    console.log('Invalid selection.');
  }
}

function linearRequestWithKey(apiKey, query, variables) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ query, variables });
    const req = https.request(
      {
        hostname: 'api.linear.app',
        path: '/graphql',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          Authorization: apiKey,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.errors?.length) {
              reject(new Error(json.errors[0]?.message || 'Linear API error'));
              return;
            }
            resolve(json.data || {});
          } catch (error) {
            reject(error);
          }
        });
      },
    );

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}
