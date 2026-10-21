# Automatic executor — disabled preparation

**GO for review only; NO-GO for activation.** Issue #5 updates only
`setup/automatic-executor`, existing Draft PR #3. Policy stays `enabled:false`,
all approval flags false, Issue unselected, model unselected and key input empty.
The workflow remains `automation/workflow.yml.disabled`, outside
`.github/workflows`. No Actions, API/model calls, secrets, settings changes,
merge, deployment, new tests or task spawning are authorized by this work.

## Public synthetic architecture

Gate -> model -> publisher run on separate fresh GitHub-hosted Ubuntu 24.04
runners. No self-hosted runner, private checkout, account home, Desktop/ChatGPT
authentication, cache restore, inherited MCP configuration or private account
credentials may enter these jobs. Only public invented task data is allowed.

- Gate independently validates local/live run attempt 1, numeric actor/author
  343788291, public repository, immutable controller/workflow/base pins, exact
  approved Issue digest and sole `synthetic-executor-approved` label. Extra
  labels, edits, stale heads, unexpected events and duplicates stop.
- Gate reserves the initial/correction lifetime attempt by atomically creating
  an annotated `reca-auto-exec-001-<phase>-gate` tag BEFORE the model job.
  Claims bind run/attempt, Issue/digest, controller, parent and review ID/digest.
  Every job has its own first-run guard; model prepare/collect and publisher
  also recheck live run and admission. Failed-job reruns cannot reuse a gate.
- Model has only public-repository read permissions (contents, issues,
  pull-requests, actions); no repository write token. Its preflight serializes
  Issue/review/prior document as JSON to fixed `model-input/request.json`.
  These strings never enter a shell script, expression, CLI flag, output path,
  workflow output or configuration. The prompt is fixed trusted workflow text.
- Official Codex Action replaces the unsupported preprovisioned Docker network.
  It uses `safety-strategy: drop-sudo`, `permission-profile: ':read-only'`,
  `--ephemeral`, an initially empty explicit Codex home, and a two-minute step
  inside a four-minute model job. No legacy `sandbox` input or unsafe strategy.
  The public read token is not claimed to be absent from the runner. The future
  dedicated provider key goes ONLY through the Action's `openai-api-key` input,
  never a job-level environment variable, prompt, output, artifact or log.
- The final message is JSON, not a generated script or patch. A fixed schema
  requests exactly `path: docs/pilot.md` and string `content`. A trusted collector
  independently rejects extra keys, a different path, non-regular/linked files,
  invalid UTF-8 or a raw result above 24,000 bytes; it validates content and
  uploads only `model-output/pilot.md`, with no overwrite and one-day retention.
  Post-model steps only revalidate and serialize, with read-only job rights.
- Publisher uses a fresh runner and current-run named artifact; no provider
  secret. It independently validates one regular UTF-8 Markdown file, at most
  12,000 bytes, rejecting controls, HTML, code, links and obvious key-like text.
  Schema/prompt filters do not prove semantic safety. Only the constant
  `docs/pilot.md` enters a Git tree; a one-file diff is checked before publication.
  Narrow write rights are contents and pull-requests; other grants are read-only.
- Initial publication creates only `pilot/automatic-synthetic-001` and a Draft
  PR into `sandbox/reca-auto-control-setup`. One trusted COMMENTED review at
  exactly the recorded PR/head may consume the correction. Live event, review
  ID/body hash, base and head are rechecked immediately before ref mutation.

## Immutable Action contract reviewed for this proposal

Pin: `openai/codex-action@c05cfd74ad95c626cdf05c6685e62becc3bf7813`.
Reviewed `action.yml`, `src/main.ts`, `src/runCodexExec.ts`,
`src/writeProxyConfig.ts`, README and security guidance from that Git commit.
The Action executes bundled `dist/main.js`; its runtime behavior is unverified
here. Dependencies inside the pin include immutable `actions/setup-node`.

| Input | Contract at this exact pin / choice here |
| --- | --- |
| `permission-profile` | Maps to `default_permissions`; `:read-only` supported. Mutually exclusive with `sandbox` and `safety-strategy: read-only`. Keep `drop-sudo`. |
| `prompt` | Fixed inline text passed as data through env/argv/stdin; no simultaneous `prompt-file`. Issue/review strings are only in request.json. |
| `output-file` | Maps to `--output-last-message`; fixed absolute workspace path `model-result.json`, not a transcript or arbitrary generated path. |
| `codex-version` | Installs BOTH CLI and Responses proxy at this version. Candidate pinned `0.138.0`, minimum documented profile support; exact package availability/model compatibility still needs owner review before activation. Never latest/default. |
| `output-schema` | Inline JSON Schema written by the Action and passed via `--output-schema`; no simultaneous `output-schema-file`. Independently validate the resulting JSON; do not assume this input validates publication. |
| `codex-home` | Empty dedicated runner-temp directory, populated only by trusted Action proxy configuration. No auth/config import. |
| `model`, `codex-args` | Owner-reviewed policy model name restricted to one safe line; fixed `["--ephemeral"]`. No untrusted argument/config overrides. |
| `openai-api-key` | Empty now. Future owner-approved synthetic-only project secret via this scoped input; Action proxies it and reduces privileges before Codex. Never Desktop/account credentials. |

The generic Learn Action guide describes an older surface (legacy sandbox and
schema via codex-args); the immutable source above establishes the actual input
names used here. References:
[pinned action.yml](https://github.com/openai/codex-action/blob/c05cfd74ad95c626cdf05c6685e62becc3bf7813/action.yml),
[pinned execution source](https://github.com/openai/codex-action/blob/c05cfd74ad95c626cdf05c6685e62becc3bf7813/src/runCodexExec.ts),
[pinned security guidance](https://github.com/openai/codex-action/blob/c05cfd74ad95c626cdf05c6685e62becc3bf7813/docs/security.md),
[Action guide](https://learn.chatgpt.com/docs/github-action),
[permission profiles](https://learn.chatgpt.com/docs/permissions),
[non-interactive mode](https://learn.chatgpt.com/docs/non-interactive-mode).

## Receipt protection and partial failures

Read-only GitHub UI inspection on 2026-10-22 confirmed ruleset **25595392**,
`Protect execution receipts`: Active, includes `refs/tags/reca-auto-exec-001-*`,
no exclusions shown, empty bypass list, restrict updates/deletions and block
force pushes checked; restrict creations unchecked. No settings changed.
The existing `Protect main and sandbox` ruleset was also listed Active.
Job-token receipt creation/enforcement has NOT been run or proven; therefore
`immutable_receipts_verified` remains false until a separately approved review.

| Last durable state | Consequence after failure |
| --- | --- |
| No gate ref | No model allowed. Orphan annotated tag objects confer no reservation. |
| Gate ref created, including ambiguous POST result | Phase consumed, even if model never starts, fails, times out or artifact is absent. No retry/reclaim. |
| Valid artifact, no publisher ref | Only the original successful attempt may proceed after independent live checks. No job rerun. |
| Publisher ref created | Publication reserved BEFORE Git mutations; branch/PR/done failures burn the phase. Human inspection required, no automated repair. |
| Done ref created | Records sole PR/head. Initial completion permits at most the one separately checked correction. |

All receipts are create-only; the controller never deletes/updates them. A
409/422, timeout or ambiguous network failure stops. Concurrency serializes jobs;
global phase tags, rather than per-run artifacts alone, prevent later runs from
buying another attempt. These are at most TWO CLI sessions, not two provider
requests: Codex can make multiple turns, retries and billable requests per session.

## Separate activation migration — not part of this PR

GitHub Actions **issues triggers use the default branch**, currently `main`
(read-only UI inspection; its tree contains only README.md), not the PR's setup
branch. Renaming this disabled file or merging into the sandbox target alone
does not constitute a valid activation plan. Before ANY activation:

1. Obtain explicit owner authorization for activation, first run and spending.
   Select one synthetic Issue and exact digest; leave Issue #1 unselected.
2. Review the default branch and its protection, protected sandbox base and
   workflow/policy paths. Plan a separate reviewed migration PR that installs
   the workflow under `.github/workflows` on the default branch through normal
   protection. Do not bypass/change rules, or trigger by relabeling now. Review
   `pull_request_review` behavior and trusted source selection separately too.
3. Pin reviewed controller in policy and `RECA_CONTROLLER_SHA`. Load approved
   policy from the later workflow commit at `github.sha`; set its exact
   `RECA_WORKFLOW_SHA` only after that commit exists (no self-referential hash).
   Reconcile this default-branch migration with immutable sandbox base SHA.
   Ensure existing/future workflows cannot launch on this preparation push.
4. Recheck receipt ruleset and least-privilege create-only receipt/pilot/Draft PR
   rights, including any inherited settings. Owner previously reported Actions
   PR creation enabled and default token read-only; runtime rights remain
   unproven. Preserve protections and no bypass.
5. Review exact Action distribution/dependencies, CLI and proxy release,
   compatible model, runner support, config layers, artifact provenance, output
   handling, process/secret isolation and all rerun/partial-failure paths. Never
   install account credentials or private data. Separately authorize any runtime
   validation; no extra synthetic tests are requested by this issue.
6. Only then replace the empty Action input with a dedicated restricted project
   secret, approve public-runner/model/cost/receipt policy flags, and authorize
   the one exact event. No merge or activation is authorized by Issue #5.

## Network boundary and future cost approval

**Codex Action sandbox is not proof of a general enforced outbound firewall or
provider-only egress.** The permission profile restricts local commands; the
Action setup, proxy and agent have other network paths. No provider-only claim
is made and no `reca-synthetic-egress` network is required. This is suitable for
review as a public synthetic lab proposal only. Actual private `reca-digital/demo`
needs a separately isolated architecture and explicit authorization; it must not
reuse this public runner design or credentials. No demo access occurred here.

Future estimate: for each billable request j, sum
`(input_j * input_rate + cached_j * cached_rate + output_j * output_rate) / 1e6`,
with non-overlapping input/cached categories, billable reasoning in output where
applicable, plus tool/other charges. Sum over both CLI sessions and retries.
Illustration only, NOT a model price or bound: 2 sessions x 10 requests x
(8,000 uncached input tokens x USD 2/M + 2,000 billable output tokens x USD 10/M)
= **USD 0.72**, before other charges. Actual usage can exceed every assumption.

Future owner checklist: select model and current dated tariff; estimate cumulative
context/turns, reasoning, retries, timeout tail and tool charges; define accepted
USD exposure; inspect enforceable provider quotas/rate limits and project access;
confirm whether any spending setting is actually enforced or merely an alert;
set a revocation/monitoring owner. A two-minute step, four-minute job, two lifetime
sessions and a 12,000-byte artifact are NOT hard token/request/USD caps. No hard
spending cap is claimed without provider enforcement. Cost approval stays false.

## Verification for this revision

Local syntax/JSON/YAML/static review only; no new tests, Actions, API/model calls,
secrets or settings changes. Runtime/CI, CLI/proxy/model compatibility, effective
job-token permissions, sandbox/isolation and provider spending exposure remain
activation blockers. **GO: disabled review. NO-GO: enable, run, merge or spend.**
