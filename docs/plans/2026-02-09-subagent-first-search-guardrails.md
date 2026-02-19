# Subagent-First Search Guardrails Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prevent search/analysis failures by enforcing subagent-first workflows and avoiding repo-root Glob, without touching plugin configs.

**Architecture:** Update repo guidance (AGENTS.md) to codify safe search patterns and subagent usage. Validate that no Oh-My-OpenCode, Superpowers, or Vibe-Kanban integration files are modified.

**Tech Stack:** OpenCode tooling (Read/Grep/Bash), Markdown docs, repo config conventions.

---

### Task 1: Confirm plugin integration touchpoints

**Files:**

- Read: `.vscode/extensions.json`
- Read: `agents.md`
- Read: `AGENTS.md`
- Read: `.beads/export-state` (if present)

**Step 1: Read plugin-related files**

Use `Read` to confirm:

- `bloop.vibe-kanban` is only a VS Code recommendation.
- No repo-local config exists for Oh-My-OpenCode or Superpowers.

**Step 2: Record constraints**

Note: Do not modify plugin configs; only update AGENTS.md guidance.

### Task 2: Add search guardrails to AGENTS.md

**Files:**

- Modify: `AGENTS.md`

**Step 1: Add a new section "Agent Workflow Guardrails"**

Include rules:

- Prefer `task()` subagents for exploration; avoid background tasks unless forced.
- Avoid repo-root `Glob`; use `Read`, `Grep` scoped to directories, and `ls` for listing.
- Explicitly exclude `node_modules`, `dist`, and `out` from searches.
- Do not change plugin configs (`.vscode/extensions.json`, `.beads/*`, `.sisyphus/*`).

**Step 2: Keep formatting consistent**

Use Markdown bullets, follow existing style, no new tooling.

### Task 3: Verify no plugin integration files changed

**Files:**

- Check: `git status`

**Step 1: Confirm only AGENTS.md changed**

If other files changed, revert them unless explicitly requested.

### Task 4: Optional validation

**Step 1: Run quick search smoke test**

Run a scoped `Grep` against `src/` to ensure search tools are usable.

### Task 5: Commit (only if requested)

**Step 1: Stage docs**

`git add AGENTS.md docs/plans/2026-02-09-subagent-first-search-guardrails.md`

**Step 2: Commit**

`git commit -m "docs: add subagent-first search guardrails"`
