// Sandbox-only Publisher adapter; no API credentials or network access in this module.
// A caller-supplied GitHub client MUST be separately authenticated and scoped to the lab.
// This module is NOT wired to Actions. No model calls or deployments.
import {planSandboxDraftPR} from './plan-draft-pr.mjs';
import {validateChanges} from './validate-changes.mjs';
const SHA=/^[a-f0-9]{40}$/;
const abort=m=>{throw new Error(m);};
const equal=(a,b)=>a===b;
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&
  Object.keys(o).sort().join('|')===keys.sort().join('|');
export async function publishSandboxDraft({client,repoDir,base,head,payload,requestId,authorization}) {
  if(!client||typeof client.readState!=='function'||typeof client.createBlob!=='function'||
     typeof client.createTree!=='function'||typeof client.createCommit!=='function'||
     typeof client.compare!=='function'||typeof client.createBranch!=='function'||
     typeof client.createDraftPR!=='function')abort('Trusted GitHub client required');
  // Authorization must be supplied by a separate, trusted admission system.
  // Never derive authorization from an Issue, model output or PR comments.
  if(!exact(authorization,['approved','requestId','baseSha','headSha','receipt'])||
     authorization.approved!==true||authorization.requestId!==requestId||
     authorization.baseSha!==base||authorization.headSha!==head||
     !/^reca-code-[0-9]+-reserved$/.test(authorization.receipt))
    abort('Missing externally validated one-shot authorization');
  const first=await client.readState(requestId);
  const plan=planSandboxDraftPR({repoDir,base,head,payload,remote:first,requestId});
  const files=validateChanges(payload);
  // A second live-state read prevents ordinary races, but GitHub does not offer
  // an atomic transaction across a branch creation and PR creation.
  const before=await client.readState(requestId);
  if(JSON.stringify(first)!==JSON.stringify(before))abort('Remote state changed');
  const blobs=[];
  for(const file of files){
    const sha=await client.createBlob(file.content);
    if(!SHA.test(sha))abort('Invalid blob response');
    blobs.push({path:file.path,mode:'100644',type:'blob',sha});
  }
  const tree=await client.createTree(base,blobs);
  if(!SHA.test(tree))abort('Invalid tree response');
  const commit=await client.createCommit({parent:base,tree,message:'sandbox: code review '+requestId});
  if(!SHA.test(commit))abort('Invalid commit response');
  const diff=await client.compare(base,commit);
  if(!Array.isArray(diff)||diff.length!==files.length||
    diff.some(f=>!exact(f,['path','status'])||
      !['added','modified'].includes(f.status)||!files.some(x=>equal(x.path,f.path))))
    abort('Remote compare differs from approved file set');
  const last=await client.readState(requestId);
  if(JSON.stringify(before)!==JSON.stringify(last))abort('Remote changed before publication');
  // No force update or retry. Any ambiguous failure burns the external receipt.
  await client.createBranch(plan.branch,commit);
  const pr=await client.createDraftPR({
    head:plan.branch,base:plan.base,title:plan.title,body:plan.body,draft:true
  });
  if(!Number.isSafeInteger(pr?.number)||pr.number<1||pr?.draft!==true)
    abort('Unexpected PR response');
  return Object.freeze({number:pr.number,branch:plan.branch,commit,base:plan.base,draft:true});
}
