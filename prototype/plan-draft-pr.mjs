// Plan-only sandbox Draft PR publisher. No network, credentials or GitHub writes.
// The trusted caller MUST run verifyCommittedDiff() independently before using this.
import {verifyCommittedDiff} from './verify-diff.mjs';
const SHA=/^[a-f0-9]{40}$/;
const TARGET_REPO='reca-digital/reca-control-lab';
const TARGET_BASE='sandbox/reca-auto-control-setup';
const BRANCH_PREFIX='prototype/review-only-';
const fail=why=>{throw new Error(why);};
export function planSandboxDraftPR({
  repoDir,base,head,payload,remote,requestId
}) {
  if(!Number.isSafeInteger(requestId)||requestId<1)fail('Invalid request identifier');
  if (!remote || typeof remote!=='object' || Array.isArray(remote) ||
      Object.keys(remote).sort().join(',')!==
      ['baseRef','baseSha','existingBranch','existingPr','repository','visibility'].sort().join(','))
    fail('Invalid remote snapshot');
  if(remote.repository!==TARGET_REPO||remote.visibility!=='public'||
     remote.baseRef!==TARGET_BASE||!SHA.test(remote.baseSha)||
     remote.baseSha!==base||remote.existingBranch!==false||remote.existingPr!==false)
    fail('Target is not isolated, pinned, or unused');
  const proof=verifyCommittedDiff({repoDir,base,head,payload});
  // Return immutable parameters. Never trust generated text for branch/title/body.
  return Object.freeze({
    repository:TARGET_REPO,
    base:TARGET_BASE,
    expectedBaseSha:base,
    candidateHeadSha:head,
    branch:BRANCH_PREFIX+requestId,
    draft:true,
    title:'Sandbox code review #'+requestId,
    body:'Isolated offline verification of '+proof.totalFiles+
      ' allowlisted file(s). No production/deployment authorization.',
    files:Object.freeze([...proof.files])
  });
}
