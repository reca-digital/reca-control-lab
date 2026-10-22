// Read-only GitHub state adapter for the public RECA laboratory.
// No token handling, network by default, writes, Codex or deployment.
const REPO='reca-digital/reca-control-lab';
const BASE='sandbox/reca-auto-control-setup';
const SHA=/^[0-9a-f]{40}$/;
const fail=s=>{throw new Error(s);};
export async function readSandboxState({request,requestId}) {
  if(typeof request!=='function'||!Number.isSafeInteger(requestId)||
     requestId<1||requestId>1000000)fail('Invalid read-only inputs');
  // The adapter never allows a caller to supply URL, repository or branch name.
  const path='/repos/'+REPO;
  const branch='prototype/review-only-'+requestId;
  const [repo,ref,existing,prs]=await Promise.all([
    request('GET',path),
    request('GET',path+'/git/ref/heads/'+BASE),
    request('GET',path+'/git/ref/heads/'+branch,{allow404:true}),
    request('GET',path+'/pulls?state=all&head=reca-digital%3A'+branch+'&per_page=100')
  ]);
  if(repo?.full_name!==REPO||repo.private!==false||repo.archived!==false)
    fail('Repository boundary invalid');
  if(ref?.ref!=='refs/heads/'+BASE||!SHA.test(ref?.object?.sha))
    fail('Base ref invalid');
  if(existing!==null&&(!existing||existing.ref!=='refs/heads/'+branch))
    fail('Unexpected branch response');
  if(!Array.isArray(prs)||prs.some(x=>x?.head?.ref!==branch||
     x?.head?.repo?.full_name!==REPO))fail('Unexpected pull request result');
  return Object.freeze({
    repository:REPO,visibility:'public',baseRef:BASE,
    baseSha:ref.object.sha,existingBranch:existing!==null,existingPr:prs.length>0
  });
}
