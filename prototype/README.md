# Offline multi-file validation prototype

Run locally with Node.js 20+:

```sh
node --test prototype/validate-changes.test.mjs
```

This is a **standalone, non-executing proof of concept**, not an Actions job or production publishing pipeline. It accepts a plain JSON-shaped object with a `files` array of one or two entries, each with exact `path` and `content` keys. Allowed paths are the two fictional app files in `ALLOWED_PATHS`. The validator rejects duplicate/unknown paths, schema extras, oversized UTF-8 payloads, selected dangerous strings and control characters.

**Not a security boundary:** regular expressions cannot establish JavaScript/CSS safety. This implementation does not parse ASTs, detect secrets reliably, establish semantic correctness, validate dependencies, execute tests on generated code, check filesystem symlinks, verify Git history or safely authorize GitHub writes. It must not be connected to untrusted generated code for automatic execution or merge.

Required next-step design before a real code-writing runner:
1. Review exact sandbox repository checkout and permitted file extensions/paths; harden against symlinks, renames and binary outputs.
2. Use an AST-aware review and isolated resource-limited environment without network, production data, privileged filesystem mounts or secrets.
3. Compare the complete actual git diff and verify exact base/head commits and permitted GitHub targets before creating a Draft PR.
4. Preserve one-shot receipts, human-per-Issue cost approval, no auto-merge, no auto-deploy and `RECA_AUTO_ENABLED=false` by default.
5. Obtain explicit new owner authorization before any billed invocation.

Run-time checks are in `validate-changes.test.mjs`. Existing AUTO-001/AUTO-002 code, workflow, receipts, GitHub variables and the private `reca-digital/demo` are untouched.
