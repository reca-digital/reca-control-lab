# Offline committed-diff verifier

This **does not publish a Draft PR** and is not connected to GitHub Actions or Codex. It validates an independently prepared, committed sandbox candidate *before a future, separately authorized publisher* could create a Draft PR.

Run offline tests with Node.js 20+ and Git installed:

```sh
node --test prototype/validate-changes.test.mjs prototype/verify-diff.test.mjs
```

Call `verifyCommittedDiff({repoDir,base,head,payload})`, where `base` and `head` are full immutable 40-character commit SHAs, `repoDir` is a **trusted local test Git repository path**, and `payload` is the output object with `files: [{path,content}]`. It requires that head descends from base and that the complete committed diff changes only one or two allowlisted synthetic files, with allowed add/modify status and regular file mode `100644`. It compares the exact committed UTF-8 blob content to the separately validated payload and rejects extra files, symlinks, renames, deletes, invalid commit pins or mismatched data.

**Security limitations:** the existing string/regex validator is not a JavaScript/CSS parser, source-code sandbox, malware/secret detector or permission boundary. Git commands read a provided repository path; do not execute this on untrusted Git configuration or untrusted local filesystem mounts. There are no AST-based checks, runtime tests of generated code, authenticated GitHub PR verification, network isolation or production integration yet. A future trusted publisher must independently verify GitHub target repo/base/head against server state and require human authorization. No automatic code execution, deployment or merge is approved.

Scope is intentionally limited to `reca-digital/reca-control-lab`. Do not check out or modify private `reca-digital/demo`. Existing AUTO-002 policy stays disabled and previously consumed receipts remain immutable.
