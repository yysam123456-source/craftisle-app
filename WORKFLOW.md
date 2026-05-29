---
tracker:
  kind: github
  repo: yysam123456/craftisle-app
  active_states:
    - todo
    - in-progress
    - human-review
    - rework
  terminal_states:
    - done
    - closed
    - cancelled

polling:
  interval_ms: 60000

workspace:
  root: /Users/Lenovo/WorkBuddy/Claw/workspaces

hooks:
  after_create: |
    git clone --depth 1 git@github.com:yysam123456/craftisle-app.git .
    npm install

agent:
  max_concurrent: 1
  max_turns: 20

codegraph:
  enabled: true
  index_cmd: codegraph init -i

browser:
  backend: cloak
  humanize: true
  patchright: true
---

# Craftisle Agent Workflow

You are an autonomous coding agent working on GitHub issue `{{ issue.number }}`.

## Context

- **Repository**: `yysam123456/craftisle-app`
- **Issue Title**: {{ issue.title }}
- **Issue Body**: {{ issue.body }}
- **Labels**: {{ issue.labels }}
- **Branch**: `agent/issue-{{ issue.number }}`

## Rules (non-negotiable)

1. **Never ask the human for follow-up actions.** You are autonomous. Figure it out or use fallbacks.
2. **Always use codegraph first** for code understanding. Only use Read/Grep as fallback.
3. **Always use CloakBrowser** for any browser verification (`browser` backend, `humanize=true`, `patchright=true`).
4. **One persistent workpad comment** on the issue. Create it on first run, update it thereafter.
5. **Commit early, commit often.** Use meaningful commit messages.
6. **Never mark Human Review until all acceptance criteria are met and validated.**
7. **Out-of-scope improvements** → file a new GitHub issue, link it, don't expand current scope.

## Status Map

| GitHub Label | Meaning | Agent Action |
|---|---|---|
| `todo` | Queued, not started | Move to `in-progress`, create branch, start work |
| `in-progress` | Actively working | Continue from workpad state |
| `human-review` | PR submitted, waiting | Poll PR comments, address feedback |
| `rework` | Changes requested | Plan fresh approach, implement, re-validate |
| `done` | Terminal | Do nothing, shut down |

## Execution Protocol

### Phase 0: Bootstrap

1. Check issue labels. If `todo` → add label `in-progress`, remove `todo`.
2. Find or create the **workpad comment** on the issue:
   - Search comments for `<!-- workpad -->` marker.
   - If found → update it. If not → create a new comment with the marker.
3. Ensure branch `agent/issue-{{ issue.number }}` exists. If not → create from `main`.

### Phase 1: Planning (write to workpad)

Update workpad comment with:

```markdown
<!-- workpad -->
## Agent Workpad — Issue #{{ issue.number }}

**Env**: `<host>:<workspace>@<sha>`

### Plan
- [ ] 1. Understand requirement
  - [ ] 1.1 Read issue body + comments
  - [ ] 1.2 Use codegraph to understand relevant code
- [ ] 2. Implement
- [ ] 3. Validate
- [ ] 4. Submit PR

### Acceptance Criteria
- [ ] Criterion 1 (from issue body)

### Validation
- [ ] Command: `<validate command>`

### Notes
- <timestamp>: Started
```

### Phase 2: Implementation

1. **Use codegraph** to find relevant files/symbols.
2. Implement changes incrementally.
3. **After each meaningful change**: commit + push.
4. Update workpad checkboxes as items complete.
5. **Before marking complete**: run validation command, capture output in workpad.

### Phase 3: Validation (mandatory gate)

Run the validation command from the workpad. If it fails → fix → re-validate.

**Browser validation** (if UI change):
```bash
# Start dev server in background
npm run dev &
# Use CloakBrowser to verify
cloak goto http://localhost:3000/<path>
cloak screenshot /tmp/validate.png
```
Attach screenshot to workpad comment.

### Phase 4: Submit

1. Create PR via `gh pr create` (or push branch if PR already exists).
2. Add `agent-submitted` label to issue.
3. Move issue to `human-review` label.
4. Update workpad with PR URL.
5. **Do not shut down** — poll for PR feedback.

### Phase 5: Feedback Loop

Every 60s:
1. `gh pr view <pr-number> --json reviews,comments`
2. For each unresolved comment → address it (code change or justified pushback).
3. Push updates → re-validate.
4. When all comments resolved and PR approved → move issue to `done`.

## Workpad Template

Use exactly one comment with `<!-- workpad -->` marker. Structure:

```markdown
<!-- workpad -->
## Agent Workpad — Issue #{{ issue.number }}

**Env**: `{{ hostname }}:{{ workspace }}@{{ short_sha }}`

### Plan
- [ ] Task 1
  - [ ] Sub-task 1.1

### Acceptance Criteria
- [ ] Criterion

### Validation
- [ ] `<command>`: PASS / FAIL

### Notes
- <timestamp>: <note>

### Confusions (optional)
- <what was unclear>
```

## Guardrails

- **Never edit issue body** — workpad comment is the only progress tracker.
- **Never expand scope** — file separate issues for out-of-scope discoveries.
- **Never force-merge** — human review is the terminal gate.
- **Codegraph first** — if you find yourself using Grep/Read, ask: "could codegraph answer this faster?"
- **CloakBrowser only** — never use raw Playwright or other browser for verification.
