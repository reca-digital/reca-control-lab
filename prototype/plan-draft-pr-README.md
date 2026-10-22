# Sandbox Draft PR planner (offline)

`plan-draft-pr.mjs` validates a local candidate commit through `verifyCommittedDiff` and returns a frozen, **non-executable** Draft PR plan. It only permits the public `reca-digital/reca-control-lab` repository and base `sandbox/reca-auto-control-setup`. The snapshot must assert an exact base SHA and that the proposed branch and PR are absent. It rejects different/private repositories, changed bases, duplicate branches/PRs, malformed Issue IDs and any unapproved Git diff.

Tests (Node.js 20+ and Git): `node --test prototype/*.test.mjs`.

**Important:** this is a planning function, NOT a GitHub publisher. Its `remote` snapshot is caller-supplied, therefore untrusted until retrieved and authenticated independently. It does not make network calls, create branches or PRs, reserve immutable receipt tags or authorize execution. A future publisher must query the remote GitHub API before and immediately prior to mutation, pin permissions and identities, verify one-shot receipts, use compare-and-swap style base checks, restrict credentials and create a **Draft** PR only in the isolated sandbox. No autonomous merge or deployment.

This addition does not change Actions, current policy, API secrets, tags, or the private `reca-digital/demo` repository. No model invocation is required.
