# Read-only GitHub snapshot adapter — prototype

`readSandboxState({request,requestId})` constructs **fixed GET-only** GitHub API paths for the public `reca-digital/reca-control-lab` repository and protected sandbox branch. It checks repository visibility, exact base ref/SHA, existence of one dedicated review branch and previous PRs. It returns exactly the six keys expected by `planSandboxDraftPR`.

Run with `node --test prototype/*.test.mjs`. Unit tests use a deterministic in-memory fake request and do not use GitHub credentials.

This adapter has **no production transport, authentication, retries or mutation permissions**. The injected request function is not trusted by itself. It should never be used to authorize a paid model call or publication. Concurrent changes are possible between reads. Publishing also requires independently verified Git commit ancestry/content and a durable one-shot receipt; it is NOT implemented in this module. Currently open PR #30 contains the separate mocked write-side adapter.

Nothing here reaches `reca-digital/demo`, enables existing Codex Actions or changes policy/secrets/tags.
