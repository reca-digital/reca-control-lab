// Offline-only verifier. Uses local Git object database; cannot write or publish.
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {validateChanges, ALLOWED_PATHS} from './validate-changes.mjs';
const SHA = /^[a-f0-9]{40}$/;
const fail = message => { throw new Error(message); };
export function verifyCommittedDiff({repoDir, base, head, payload}) {
  if (typeof repoDir !== 'string' || !SHA.test(base) || !SHA.test(head) || base === head)
    fail('Expected distinct pinned full commit SHAs and repository directory');
  const cwd = resolve(repoDir);
  function git(args, opts={}) {
    return execFileSync('git', ['--no-pager', ...args], {
      cwd, encoding: opts.encoding ?? 'utf8', maxBuffer: 1024 * 1024,
      timeout: 5000, stdio: ['ignore', 'pipe', 'pipe']
    });
  }
  for (const sha of [base, head]) {
    if (git(['rev-parse', '--verify', sha + '^{commit}']).trim() !== sha)
      fail('Unknown or noncommit SHA');
  }
  if (git(['merge-base', base, head]).trim() !== base)
    fail('Head is not descended from pinned base');
  const proposed = validateChanges(payload);
  const raw = git(['diff', '--name-status', '--no-renames', '--no-ext-diff', '-z', base, head]);
  const parts = raw ? raw.split('\0').slice(0, -1) : [];
  if (parts.length === 0 || parts.length % 2) fail('Invalid or empty diff');
  const changed = [];
  for (let i=0; i<parts.length; i+=2) {
    const status = parts[i], file = parts[i+1];
    if (!['A','M'].includes(status) || !ALLOWED_PATHS.includes(file))
      fail('Disallowed git change or path');
    if (changed.includes(file)) fail('Duplicate git path');
    changed.push(file);
    const entry = git(['ls-tree', head, '--', file]).trim();
    if (!entry.startsWith('100644 blob ') || !entry.endsWith('\t' + file))
      fail('Nonregular file or unexpected mode');
    const bytes = git(['show', head + ':' + file], {encoding:'buffer'});
    const text = new TextDecoder('utf-8', {fatal:true}).decode(bytes);
    const claimed = proposed.find(x => x.path === file);
    if (!claimed || claimed.content !== text) fail('Committed bytes do not match approved payload');
  }
  if (changed.length !== proposed.length) fail('Payload/diff file mismatch');
  return {base, head, files:changed.sort(), totalFiles:changed.length};
}
