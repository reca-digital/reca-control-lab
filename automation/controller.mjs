// Preparation only. No entry point performs work while policy.enabled is false.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const REPO = 'reca-digital/reca-control-lab';
const BASE = 'sandbox/reca-auto-control-setup';
const BRANCH = 'pilot/automatic-synthetic-002';
const OUTPUT = 'docs/pilot.md';
const LABEL = 'synthetic-executor-approved';
const OWNER = 343788291;
const SHA = /^[a-f0-9]{40}$/;
const HASH = /^[a-f0-9]{64}$/;
const env = process.env;
const p = JSON.parse(fs.readFileSync(env.RECA_POLICY_PATH || new URL('./policy.json', import.meta.url), 'utf8'));
const stage = process.argv[2];
const hash = text => crypto.createHash('sha256').update(text, 'utf8').digest('hex');
const requireThat = (ok, message) => { if (!ok) throw new Error(message); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
let phase;
let event;
let parent;
let prior;
let correctionPr;
let liveIssue;
let reviewText = '';
let reviewId = null;
let reviewHash = null;

async function api(route, method = 'GET', body, missing = false) {
  const comparison = /^\/compare\/[a-f0-9]{40}\.\.\.[a-f0-9]{40}$/.test(route);
  requireThat((route === '' || route.startsWith('/')) &&
    (!route.includes('..') || comparison), 'Invalid API route');
  const r = await fetch('https://api.github.com/repos/' + REPO + route, {
    method, redirect: 'error', signal: AbortSignal.timeout(20000),
    headers: {
      Authorization: 'Bearer ' + env.GH_TOKEN,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  if (missing && r.status === 404) return null;
  requireThat(r.ok, 'GitHub rejected ' + method + ' ' + route + ': ' + r.status);
  return r.status === 204 ? null : r.json();
}

const refPath = name => '/git/ref/' + name;
const receiptName = kind => 'tags/reca-auto-exec-002-' + phase + '-' + kind;
function claims() {
  return {
    run: env.GITHUB_RUN_ID, attempt: 1, phase, issue: p.issue.number,
    body_sha256: p.issue.body_sha256, parent, controller: p.controller_sha,
    review_id: reviewId, review_sha256: reviewHash
  };
}
async function receipt(kind, missing = false) {
  const ref = await api(refPath(receiptName(kind)), 'GET', undefined, missing);
  if (!ref) return null;
  requireThat(ref.object.type === 'tag', 'Reservation must be annotated');
  const tag = await api('/git/tags/' + ref.object.sha);
  const c = JSON.parse(tag.message);
  requireThat(tag.object.sha === p.controller_sha && tag.object.type === 'commit',
    'Reservation controller mismatch');
  return c;
}
async function reserve(kind, extra = {}) {
  // A unique ref is the atomic, durable claim. 409/422/network ambiguity burns
  // this phase. Never delete, update, retry or reclaim reservation refs.
  const tag = await api('/git/tags', 'POST', {
    tag: receiptName(kind).slice(5), message: JSON.stringify({ ...claims(), ...extra }),
    object: p.controller_sha, type: 'commit'
  });
  await api('/git/refs', 'POST', { ref: 'refs/' + receiptName(kind), sha: tag.sha });
}
async function assertReceipt(kind) {
  const got = await receipt(kind);
  requireThat(same(got, claims()), 'Reservation belongs to another attempt or input');
}
async function assertFirstAttempt() {
  requireThat(env.GITHUB_RUN_ATTEMPT === '1', 'Reruns are forbidden in every job');
  requireThat(/^[1-9][0-9]*$/.test(env.GITHUB_RUN_ID || ''), 'Invalid run id');
  const run = await api('/actions/runs/' + env.GITHUB_RUN_ID);
  requireThat(run.run_attempt === 1 && run.head_sha === env.RECA_WORKFLOW_SHA &&
    run.event === env.GITHUB_EVENT_NAME, 'Live run is stale or rerun');
}
async function preflight() {
  requireThat(['gate', 'model', 'publisher'].includes(stage), 'Unknown stage');
  requireThat(p.enabled === true && p.api_access_authorized === true &&
    p.owner_approved === true && p.immutable_receipts_verified === true &&
    p.public_runner_reviewed === true && p.cost_approved === true &&
    p.model_reviewed === true, 'Disabled or owner approvals incomplete');
  requireThat(p.repository === REPO && p.output === OUTPUT &&
    p.output_branch === BRANCH && p.base === BASE &&
    p.max_worker_attempts === 2 && p.max_corrections === 1 &&
    p.production_repo_access === false && p.deploy_authorized === false &&
    p.correction.trusted_reviewer_id === OWNER &&
    p.model.action_sha === 'c05cfd74ad95c626cdf05c6685e62becc3bf7813' &&
    p.model.cli_version === '0.138.0' && p.model.permission_profile === ':read-only' &&
    p.model.safety_strategy === 'drop-sudo', 'Policy boundary mismatch');
  requireThat(SHA.test(p.controller_sha) && SHA.test(env.RECA_WORKFLOW_SHA) &&
    SHA.test(p.base_sha) && HASH.test(p.issue.body_sha256 || '') &&
    Number.isSafeInteger(p.issue.number) && p.issue.number > 0 &&
    p.issue.author_id === OWNER && p.issue.approver_id === OWNER &&
    p.issue.preapproved === true, 'Unpinned approval');
  requireThat(env.RECA_AUTO_ENABLED === 'true' && env.GITHUB_REPOSITORY === REPO &&
    env.GITHUB_SHA === env.RECA_WORKFLOW_SHA && env.RECA_CONTROLLER_SHA === p.controller_sha,
    'Untrusted repository or source');
  requireThat(env.GH_TOKEN && env.GITHUB_ACTOR_ID === String(OWNER),
    'Untrusted numeric actor');
  event = JSON.parse(fs.readFileSync(env.GITHUB_EVENT_PATH, 'utf8'));
  requireThat(event.repository?.full_name === REPO && event.repository.private === false &&
    event.sender?.id === OWNER, 'Untrusted event');
  await assertFirstAttempt();
  phase = env.GITHUB_EVENT_NAME === 'issues' ? 'initial' :
    env.GITHUB_EVENT_NAME === 'pull_request_review' ? 'correction' : null;
  requireThat(phase, 'Unexpected event');
  const repo = await api('');
  requireThat(repo.full_name === REPO && repo.private === false && repo.archived === false,
    'Public repository boundary failed');
  liveIssue = await api('/issues/' + p.issue.number);
  requireThat(!liveIssue.pull_request && liveIssue.state === 'open' &&
    liveIssue.user.id === OWNER && hash(liveIssue.body || '') === p.issue.body_sha256 &&
    same(liveIssue.labels.map(x => x.name).sort(), [LABEL]),
    'Issue author, payload or exact label set changed');
  requireThat(Buffer.byteLength(liveIssue.body || '', 'utf8') <= 16000, 'Issue data too large');
  const base = await api(refPath('heads/' + BASE));
  requireThat(base.object.sha === p.base_sha, 'Target branch moved');
  const prs = await api('/pulls?state=all&head=reca-digital:' +
    encodeURIComponent(BRANCH) + '&per_page=100');
  if (phase === 'initial') {
    requireThat(event.action === 'labeled' && event.label?.name === LABEL &&
      event.issue?.number === p.issue.number && event.issue.user?.id === OWNER &&
      event.issue.body === liveIssue.body &&
      same(event.issue.labels.map(x => x.name).sort(), [LABEL]), 'Unexpected issue event');
    parent = p.base_sha;
    const branch = await api(refPath('heads/' + BRANCH), 'GET', undefined, true);
    requireThat(!branch && prs.length === 0, 'Duplicate initial publication');
  } else {
    requireThat(event.action === 'submitted' && p.correction.enabled === true &&
      event.review?.user?.id === OWNER && Number.isSafeInteger(event.review.id),
      'Correction not authorized');
    // The initial receipt fixes both the only PR and its expected head.
    const savedPhase = phase;
    phase = 'initial';
    const done = await receipt('done');
    phase = savedPhase;
    requireThat(done.phase === 'initial' && done.issue === p.issue.number &&
      done.body_sha256 === p.issue.body_sha256 && Number.isSafeInteger(done.pr) &&
      SHA.test(done.commit), 'No matching initial publication');
    const pr = await api('/pulls/' + done.pr);
    requireThat(prs.length === 1 && prs[0].number === pr.number &&
      pr.state === 'open' && pr.draft === true &&
      pr.head.repo.full_name === REPO && pr.head.ref === BRANCH &&
      pr.base.ref === BASE && pr.base.sha === p.base_sha &&
      pr.head.sha === done.commit && event.pull_request?.number === pr.number &&
      event.pull_request.head.sha === pr.head.sha, 'Unexpected PR or stale head');
    reviewId = event.review.id;
    reviewHash = hash(event.review.body || '');
    const review = await api('/pulls/' + pr.number + '/reviews/' + reviewId);
    requireThat(review.user.id === OWNER && review.state === 'COMMENTED' &&
      review.commit_id === pr.head.sha && event.review.body === review.body &&
      hash(review.body || '') === reviewHash, 'Review changed or untrusted');
    parent = pr.head.sha;
    reviewText = review.body;
    requireThat(Buffer.byteLength(reviewText || '', 'utf8') <= 16000, 'Review data too large');
    correctionPr = pr.number;
    const f = await api('/contents/' + OUTPUT + '?ref=' + parent);
    requireThat(f.type === 'file' && f.encoding === 'base64', 'Invalid prior document');
    prior = Buffer.from(f.content, 'base64').toString('utf8');
    validateDocument(Buffer.from(prior));
  }
}
function validateDocument(data) {
  requireThat(data.length > 0 && data.length <= 12000, 'Output size exceeded');
  const text = new TextDecoder('utf-8', { fatal: true }).decode(data);
  requireThat(text.startsWith('# ') && !/[\x00-\x08\x0b-\x1f\x7f]/.test(text),
    'Expected plain UTF-8 Markdown');
  requireThat(!/[<>]|\x60|https?:|!\[|data:|javascript:|BEGIN .*PRIVATE KEY|sk-[a-zA-Z0-9]{12}/i.test(text),
    'Output contains prohibited markup, links, code or credential-like text');
  return text;
}
async function gate() {
  requireThat(!await receipt('gate', true) && !await receipt('publisher', true) &&
    !await receipt('done', true), 'Attempt already consumed');
  // Global initial/correction claim, not just a per-run artifact. Reserved BEFORE model.
  await reserve('gate');
}
async function model() {
  await assertReceipt('gate');
  requireThat(!await receipt('publisher', true) && !await receipt('done', true),
    'Model phase already published');
  requireThat(typeof p.model.name === 'string' &&
    /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/.test(p.model.name) &&
    !p.model.name.startsWith('OWNER_'), 'Owner must select and review model');
  const operation = process.argv[3];
  if (operation === 'prepare') {
    // Only data crosses this boundary. Never emit Issue/review text to the
    // shell, GITHUB_OUTPUT, expressions, paths, CLI args or Codex configuration.
    fs.mkdirSync('model-input');
    fs.writeFileSync('model-input/request.json', JSON.stringify({
      task: liveIssue.body, review: reviewText, previous_document: prior || ''
    }), { flag: 'wx' });
    requireThat(!fs.existsSync('model-result.json') && !fs.existsSync('model-output'),
      'Runner contains stale output');
    // A fresh hosted runner and an empty explicit Codex home: no Desktop,
    // account auth, cache restore, private checkout or inherited MCP config.
    fs.mkdirSync(path.join(env.RUNNER_TEMP, 'reca-codex-home'));
    fs.appendFileSync(env.GITHUB_OUTPUT,
      'model=' + p.model.name + '\ncli-version=' + p.model.cli_version + '\n');
  } else if (operation === 'collect') {
    // The Action's output schema is a generation constraint, not authorization.
    // Independently validate the raw final message before making an artifact.
    const raw = readRegularFile('model-result.json', 24000);
    const result = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(raw));
    requireThat(result && same(Object.keys(result).sort(), ['content', 'path']) &&
      result.path === OUTPUT && typeof result.content === 'string', 'Invalid model result schema');
    const content = validateDocument(Buffer.from(result.content, 'utf8'));
    fs.mkdirSync('model-output');
    fs.writeFileSync('model-output/pilot.md', content, { flag: 'wx' });
  } else {
    throw new Error('Expected fixed model prepare/collect operation');
  }
}
function readRegularFile(filename, maxBytes) {
  const stat = fs.lstatSync(filename);
  requireThat(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1 &&
    stat.size > 0 && stat.size <= maxBytes, 'Invalid output file or size');
  return fs.readFileSync(filename);
}
async function publisher() {
  await assertReceipt('gate');
  requireThat(!await receipt('publisher', true) && !await receipt('done', true),
    'Publisher already consumed');
  requireThat(fs.lstatSync('model-output').isDirectory() &&
    !fs.lstatSync('model-output').isSymbolicLink() &&
    same(fs.readdirSync('model-output'), ['pilot.md']), 'Unexpected artifact entries');
  const filename = 'model-output/pilot.md';
  const content = validateDocument(readRegularFile(filename, 12000));
  if (phase === 'correction') requireThat(content !== prior, 'Correction must change document');
  await reserve('publisher'); // Burn BEFORE any publication; never retry partial failure.
  await assertFirstAttempt();
  const commit = await api('/git/commits/' + parent);
  const blob = await api('/git/blobs', 'POST', { content, encoding: 'utf-8' });
  const tree = await api('/git/trees', 'POST', {
    base_tree: commit.tree.sha,
    tree: [{ path: OUTPUT, mode: '100644', type: 'blob', sha: blob.sha }]
  });
  const next = await api('/git/commits', 'POST', {
    message: 'docs: synthetic pilot ' + phase + ' [skip ci]',
    tree: tree.sha, parents: [parent]
  });
  const diff = await api('/compare/' + parent + '...' + next.sha);
  requireThat(diff.files?.length === 1 && diff.files[0].filename === OUTPUT &&
    ['added', 'modified'].includes(diff.files[0].status), 'Unexpected generated diff');
  // Revalidate live payload/head immediately before moving a ref.
  await preflight();
  let pr;
  if (phase === 'initial') {
    await api('/git/refs', 'POST', { ref: 'refs/heads/' + BRANCH, sha: next.sha });
    pr = await api('/pulls', 'POST', {
      title: 'Synthetic pilot: one document', head: BRANCH, base: BASE, draft: true,
      body: 'Synthetic documentation only. One initial attempt and at most one pinned review correction. No merge or follow-on tasks.'
    });
  } else {
    await api('/git/refs/heads/' + BRANCH, 'PATCH', { sha: next.sha, force: false });
    pr = await api('/pulls/' + correctionPr);
  }
  requireThat(pr.draft === true && pr.head.sha === next.sha && pr.base.ref === BASE,
    'Unexpected published PR state');
  await reserve('done', { pr: pr.number, commit: next.sha });
  // No merges, labels, workflow dispatch, issue creation or automatic follow-on.
}
try {
  await preflight(); // Independently called in gate, model AND publisher.
  await ({ gate, model, publisher }[stage])();
} catch (error) {
  console.error('STOP: ' + error.message);
  process.exitCode = 1;
}
