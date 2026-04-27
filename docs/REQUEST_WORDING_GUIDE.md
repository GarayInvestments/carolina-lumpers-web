# Request Wording Guide

Use this quick guide when you want the assistant to do the right kind of investigation.

## Quick chooser

- Use **Analysis** when you want a broad breakdown of how something works and where risks are.
- Use **Review** when you want bugs/regressions prioritized by severity.
- Use **Audit** when you want a formal, systematic check against requirements/standards.
- Use **Flow Trace** when you want a step-by-step runtime path from event to outcome.
- Use **Root Cause Analysis (RCA)** when a bug already happened and you need the real underlying cause.
- Use **Impact Analysis** before a change to understand side effects.
- Use **Gap Analysis** to compare current behavior vs desired behavior.
- Use **Validation/Verification** to confirm behavior matches expected outcomes.

## Terms and differences

| Term | Best for | Typical output |
|---|---|---|
| Analysis | General understanding | Architecture/logic breakdown + findings |
| Review | Code quality/risk | Severity-ordered bugs and regressions |
| Audit | Formal completeness | Checklist-style pass/fail against criteria |
| Flow Trace | Runtime behavior | Step-by-step path and branch map |
| RCA | Incident debugging | Symptom -> cause chain + evidence |
| Impact Analysis | Change planning | What files/features/users are affected |
| Gap Analysis | Roadmap to target state | Current vs target + missing items |
| Validation | Confirmation | Pass/fail against expected behavior |

## Copy/paste request templates

### 1) Flow Trace + Gap Analysis (recommended for auth/W9 flows)
"Run a flow trace + gap analysis for login -> W9 check -> redirect. Show exact branches, storage keys used, backend actions called, and any mismatch with intended behavior."

### 2) Code Review focused on risk
"Do a review of the login and W9 redirect logic. Prioritize findings by severity, include file/line references, and list missing tests."

### 3) Root Cause Analysis for a specific bug
"Run RCA on why users with no W9 still reach dashboard. Provide symptom timeline, root cause, proof from code paths, and minimal fix."

### 4) Impact Analysis before making a change
"Run an impact analysis for changing W9 gating to allow only approved status. List all touched files, user-facing behavior changes, and migration risks."

### 5) Validation pass after a fix
"Validate the W9 login flow after changes. Confirm each status case: none, pending_admin_review, rejected, approved. Report pass/fail and residual risks."

## Useful add-ons to include in any request

- Scope: "Only in carolina-lumpers-web (not react-portal)."
- Output style: "Give findings first, then summary."
- Precision: "Include exact file/line references."
- Actionability: "Recommend minimal patch first."
- Testing: "List manual test cases and expected outcomes."

## Suggested wording for your common case

"Run a flow trace + gap analysis of login -> W9 status lookup -> redirect decision. Include localStorage/sessionStorage keys, API endpoints called, role-based exceptions, and exact conditions for w9Form vs dashboard."
