# Automatic executor — owner-controlled preparation

**State: NOT ACTIVATED.** This setup branch contains an inert YAML template, not an executable workflow. No GitHub Actions or OpenAI API usage has been authorized.

## Boundary
This public repository stores synthetic examples only. The executor must never receive content or credentials from private `reca-digital/demo`. The ChatGPT/Codex/Claude installations may separately have broad repository access; those installation privileges **must not be passed** to a runner. The runner's default `GITHUB_TOKEN` is scoped to this control repository.

## Before any first automated run
1. Confirm ruleset `Protect main and sandbox` stays active and cannot be bypassed by workflow identities.
2. Select exactly one **synthetic** Issue and pin its numeric ID, approved body SHA-256, and allowed GitHub approver ID.
3. Approve a full implementation of admission + one-use reservation + narrowly-scoped publisher. The current inert YAML is only a scaffold, and must not be used for actual model work.
4. Include `github.run_attempt == 1` and `RECA_AUTO_ENABLED == 'true'` in **every** job that invokes a model or publishes output. Prevent re-running only failed jobs without a fresh gate.
5. A model job must have no repository write token/checkout/production credentials. Publisher must accept just one validated UTF-8 Markdown document in `docs/pilot.md`, never a model-specified command/path or patch.
6. Pin exact SHA of every third-party Action and exact compatible Codex CLI/model versions. Separate environment-scoped OpenAI API key belongs to this **synthetic-only** workflow; do not use Desktop session auth.
7. Enforce a single execution and one revision, bounded job duration and owner-approved potential expense. Time limits **are not** a hard USD spending cap.
8. Explicitly authorize adding a workflow file to protected default branch through an approved PR. Adding it only in this setup branch will not trigger `issues.labeled`.
9. Require separate owner approval before setting `RECA_AUTO_ENABLED=true` and applying the `codex-approved` label.

## Review path
The existing chat can read the resulting PR when asked but **does not automatically wake up** on GitHub events. First reviewer is manually invoked. Event-driven reviewer would need a separate authorized handler.

## Current exit
Ready for review of setup approach; **NOT READY TO RUN**. Do not merge, deploy, activate, or call paid APIs.
