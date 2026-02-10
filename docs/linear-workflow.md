# Linear Workflow

This project keeps Linear issues in sync with PR activity using a local git hook and a GitHub Action.

## Prerequisites

- GitHub CLI (`gh`) installed and authenticated.
- Linear API key available as `LINEAR_API_KEY`.

Optional (recommended) defaults:

- `LINEAR_PROJECT_ID`
- `LINEAR_TEAM_ID`
- `LINEAR_ASSIGNEE_ID` (issue owner)

## Initialize Session Settings

Run once per project to store defaults in `.sisyphus/linear-session.json`:

```bash
npm run linear:init
```

The prompt uses your API key to fetch teams, projects, and assignees so you can choose from a list.
The session file is ignored by git and used by hooks to avoid re-prompting.

## Hook Behavior

Hooks run via Husky:

- `post-push`: syncs PR updates to Linear and creates a PR if one is missing and there are commits ahead of base.
- `post-checkout` / `post-merge`: if the current PR is merged, creates a follow-up Linear issue and a new branch.

PR creation is deferred until the branch has commits ahead of base (a PR cannot be opened with no changes).

## GitHub Action

`.github/workflows/linear-sync.yml` updates Linear on PR events using `LINEAR_API_KEY`.

## Disable Automation

- Disable all hooks: `HUSKY=0`.
- Disable auto next-issue creation: `LINEAR_AUTO_NEXT=0`.

## Identifier Matching

Linear issues are matched by identifier in PR title or branch name (e.g., `AND-123`).
