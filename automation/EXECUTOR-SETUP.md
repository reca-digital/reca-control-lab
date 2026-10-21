# Automatic executor — disabled preparation

**NO-GO for execution. Review only.** Issue #4 work is confined to
`setup/automatic-executor`, Draft PR #3. The template stays outside
`.github/workflows`; policy remains disabled. No execution, keys, spending,
merge, deploy or production access is authorized.

## Implementation

- Each controller entry point (gate, model, publisher) independently rejects
  both local and live Actions run attempts other than 1. Job-level guards
  also reject reruns, including failed-job reruns that reuse a successful gate.
- Live admission checks the public repository, immutable code/workflow pins,
  trusted numeric actor/author 343788291, one exact approved Issue body SHA-256,
  and the sole label `synthetic-executor-approved`. Extra labels, edited bodies,
  other users/events, stale base/head commits and duplicates fail closed.
- The policy does not select any Issue. Issue #1 excludes execution and is not
  approval. Owner selection of a synthetic Issue and digest remains a blocker.
- Gate atomically creates a global annotated receipt tag before the worker.
  Separate fixed initial/correction names cap lifetime attempts at two.
  Claims bind run/attempt, input digest, controller, parent and review ID/digest.
  Collision or ambiguous failure stops permanently; receipts are never deleted,
  updated or reclaimed by this controller.
- Model rechecks live input/receipt on a fresh runner with read-only GitHub
  permissions. Its non-root container receives only request/output mounts and
  a future scoped provider key: no checkout, GitHub token, Actions runtime token,
  host home/socket or project credentials. Image/CLI/model/arguments are owner
  placeholders. Fixed argv is used; generated commands/patches are never run.
- Publisher validates only a regular UTF-8 `pilot.md` artifact from the current
  run (<=12,000 bytes). Controls, HTML, code fences, links and obvious key-like
  text are rejected. This is a conservative filter, not proof of semantic safety.
  The Git tree uses only `docs/pilot.md`; a one-file diff is checked before
  updating the fixed `pilot/automatic-synthetic-001` branch.
- The only created PR is Draft into `sandbox/reca-auto-control-setup`.
  Initial branch creation is create-only. The correction uses a non-force ref
  update with the expected head as sole parent. No protected target ref is
  written; no merge, bypass, branch protection change or follow-on task exists.
- Initial completion records the sole PR/head. One COMMENTED review by the
  trusted numeric user at that exact head can consume the correction. The
  live review must match event text and its reserved ID/digest. Other review
  states/users or moved heads stop. Publication is reserved before mutation;
  partial branch/PR/API failure burns the phase and needs human inspection.

## Blocking owner decisions before any separately authorized activation

1. Leave all approval flags false. Select and explicitly preapprove one
   synthetic Issue, exact UTF-8 digest and numeric identity. Confirm no
   inherited secrets or private/project access reach runners.
2. Pin reviewed controller code in both `policy.controller_sha` and variable
   `RECA_CONTROLLER_SHA`. Policy is loaded separately from the workflow commit
   at `github.sha`, rather than from the old controller checkout. After a
   later workflow/policy commit exists, pin it in `RECA_WORKFLOW_SHA`.
   This avoids a self-referential commit hash; variables require owner control.
3. Protect `reca-auto-exec-001-*` receipt tags against update/deletion, including
   by the automation identity. Preserve the active `Protect main and sandbox`
   ruleset without bypass. Confirm create-only pilot/receipt and Draft PR rights.
   Receipt immutability and runner permissions have not been runtime verified.
4. Select an immutable image digest, exact CLI/version, fixed arguments and
   compatible model. Adapter contract: read `/input/request.json`, write only
   `/output/pilot.md`, at most one model request, retries disabled, requested
   output <=1,500 tokens. Adapter request-count behavior is still unverified;
   the supervisor alone cannot enforce provider request counts.
5. Preload the image (`--pull=never`). Provision and independently verify
   `reca-synthetic-egress`: provider-only traffic, denying GitHub, private hosts,
   runner host, metadata and lateral access. A Docker network name is not an
   egress firewall. No network provisioning occurs here; its approval stays false.
6. Only after separate permission, replace the empty `SYNTHETIC_MODEL_KEY`
   slot with a synthetic-only provider credential in the model job alone.
   Never use Desktop authentication or broad project credentials.
7. Limits: two worker attempts maximum, 120 seconds each inside a four-minute
   job, <=12,000 output bytes and <=1,500 requested output tokens per attempt.
   Input/context tokens, retries, provider behavior and USD exposure remain
   unmeasured. Timeouts/token requests are not hard spending caps. Require
   provider-enforced quotas and explicitly accepted spending bounds.
8. Separately review pinned Actions, artifact provenance, Node/Docker/runner
   compatibility, isolation, receipt protection and every rerun variant before
   proposing activation through the normal protected-branch process.

## Verification

Syntax/static review only; no new tests or CI runs. Model/CLI placeholders,
runtime, provider request bounds, cost controls, tag protections and actual
network isolation are unverified. Every Action uses a full commit SHA.
**GO: review the disabled preparation. NO-GO: run, enable, merge or spend.**
