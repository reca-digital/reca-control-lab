# Fixed GitHub Publisher request contract

This module exposes a **pure function** that constructs an allowlisted subset of GitHub REST request descriptions. It does not send requests, handle credentials, create a branch or PR, or grant authorization.

Allowed operations: UTF-8 blob, Git tree under a known base **tree SHA**, commit with one known parent, compare two full SHAs, creation of a dedicated review branch and creation of a Draft PR targeting only `sandbox/reca-auto-control-setup` in the public `reca-digital/reca-control-lab` repository.

Run with `node --test prototype/*.test.mjs` in read-only GitHub Actions CI.

**Not a secure GitHub client:** a later privileged adapter must separately verify authenticated repository identity and live base SHA, server-returned blob/commit/tree data, receipt reservation and pending PR absence. It must verify that the tree SHA is actually the parent commit's tree; a commit SHA is NOT interchangeable with its tree SHA. This request contract is deliberately not connected to `publish-sandbox-draft.mjs`, which currently uses `createTree(base,blobs)` and requires revision before any actual remote write. There is no hard cost cap, filesystem isolation or AST audit. No merge or deploy capability is implemented. Neither Actions policy nor private `reca-digital/demo` is modified.
