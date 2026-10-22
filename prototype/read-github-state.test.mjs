import test from 'node:test';
import assert from 'node:assert/strict';
import {readSandboxState} from './read-github-state.mjs';
const ROOT='/repos/reca-digital/reca-control-lab';
const BASE='sandbox/reca-auto-control-setup';
const SHA='a'.repeat(40);
function harness(overrides={}){
  const paths=[];
  const data={
    [ROOT]:{full_name:'reca-digital/reca-control-lab',private:false,archived:false},
    [ROOT+'/git/ref/heads/'+BASE]:{ref:'refs/heads/'+BASE,object:{sha:SHA}},
    [ROOT+'/git/ref/heads/prototype/review-only-31']:null,
    [ROOT+'/pulls?state=all&head=reca-digital%3Aprototype/review-only-31&per_page=100']:[]
  };
  Object.assign(data,overrides);
  return {paths,request:async(method,path,opts)=>{
    paths.push({method,path,opts});
    if(!(path in data))throw new Error('Unexpected URL '+path);
    return data[path];
  }};
}
test('returns pinned, public, unused sandbox snapshot with GET only',async()=>{
  const h=harness();
  const state=await readSandboxState({request:h.request,requestId:31});
  assert.deepEqual(state,{repository:'reca-digital/reca-control-lab',
    visibility:'public',baseRef:BASE,baseSha:SHA,
    existingBranch:false,existingPr:false});
  assert.equal(h.paths.length,4);
  assert.ok(h.paths.every(p=>p.method==='GET'&&p.path.startsWith(ROOT)));
});
const bad=[
  {[ROOT]:{full_name:'reca-digital/demo',private:false,archived:false}},
  {[ROOT]:{full_name:'reca-digital/reca-control-lab',private:true,archived:false}},
  {[ROOT]:{full_name:'reca-digital/reca-control-lab',private:false,archived:true}},
  {[ROOT+'/git/ref/heads/'+BASE]:{ref:'refs/heads/main',object:{sha:SHA}}},
  {[ROOT+'/git/ref/heads/'+BASE]:{ref:'refs/heads/'+BASE,object:{sha:'bad'}}},
  {[ROOT+'/pulls?state=all&head=reca-digital%3Aprototype/review-only-31&per_page=100']:[
    {head:{ref:'wrong',repo:{full_name:'reca-digital/reca-control-lab'}}}]}
];
for(const [i,v] of bad.entries())test('rejects compromised GitHub result '+i,async()=>{
  const h=harness(v);
  await assert.rejects(readSandboxState({request:h.request,requestId:31}));
});
test('detects a pre-existing target branch',async()=>{
  const key=ROOT+'/git/ref/heads/prototype/review-only-31';
  const h=harness({[key]:{ref:'refs/heads/prototype/review-only-31'}});
  const s=await readSandboxState({request:h.request,requestId:31});
  assert.equal(s.existingBranch,true);
});
test('rejects user-controlled invalid IDs',async()=>{
  const h=harness();for(const id of [0,-1,1.5,'31',1000001])
    await assert.rejects(readSandboxState({request:h.request,requestId:id}));
  assert.equal(h.paths.length,0);
});
