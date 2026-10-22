# Sandbox Draft PR publisher adapter — prototype

The function `publishSandboxDraft` accepts an **injected** GitHub client, an independently pinned local Git repository and a one-shot authorization object. It calls `planSandboxDraftPR` and `validateChanges`, independently checks a mockable remote state multiple times, creates blobs/tree/commit, validates a remote compare, then creates one branch and a Draft PR.

Tests (no network or credentials): `node --test prototype/*.test.mjs`. A read-only GitHub Actions CI workflow in this repository already runs the prototype test suite on PR changes.

**NOT READY FOR TRUSTED LIVE USE:** The injected client and authorization are assumptions, not verified by this module. No client adapter with GitHub REST token permissions has been implemented; a fake caller can lie about remote state and authorization. No durable protected one-shot receipt is issued here. GitHub API branch/PR operations are not atomic, and partial failure can leave a branch without a PR. Creating blobs/commits has side effects; these cannot be rolled back by this module. The Git comparison currently proves changed paths/status, while the commit objects and their provenance remain the responsibility of the trusted adapter. There is no secret scanning guarantee, AST audit, sandboxed execution or hard spend limit. The source-code regex is NOT a security boundary.

Before any real invocation: (1) implement a tightly scoped GitHub client restricted to the public lab; (2) verify remote Git commit/blob data and branch/PR identity, not client claims; (3) enforce atomic immutable receipt reservation before mutation and safe failure handling; (4) externally authorize each attempt; (5) retain human-only merge and prohibit deployment and private-repository access.

The code is **not** wired into Actions or Codex. Existing automation remains disabled, and private `reca-digital/demo` is untouched.
