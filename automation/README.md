# RECA Control Lab — synthetic automation pilot

Status: **DISABLED / NO ACTIONS / NO API CALLS**.

This is a **public** experimental repository. Never place private RECA Digital code, patches, credentials, customer data, incident reports, or internal configuration here.

## Boundaries
- The production/private repository `reca-digital/demo` is out of scope.
- Only synthetic documentation tasks are permitted.
- No automated merge or deployment.
- Codex execution and billing require separate owner approval.
- A normal ChatGPT conversation does not automatically receive GitHub event notifications.

## Planned pilot
1. Create one synthetic Issue in this repository.
2. Approve it explicitly.
3. A future, separately authorized workflow runs Codex in an isolated environment and produces only `docs/pilot.md`.
4. Publisher opens one Draft PR into a nonproduction branch.
5. A manually requested ChatGPT review writes one GitHub comment, followed by at most one correction.

## Before enabling anything
- Enforce branch protection on the public repository's default branch and configuration branch; ensure automation credentials cannot bypass.
- Review GitHub Actions, installed apps, hooks, deploy previews, and inherited secrets.
- Fix rerun checks in **all jobs**: gate, model, publisher; block job reruns from causing additional model calls.
- Pin approved action and CLI versions and choose a compatible model.
- Configure a dedicated restricted API project/key, cost controls and accepted spending exposure.
- Independently verify runner permissions and deny production repo access.
- Require explicit owner approval for activation and the very first run.

There are no executable workflows in this setup branch. See `automation/policy.json`.
