import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {readSandboxState} from './read-github-state.mjs';
import {planSandboxDraftPR} from './plan-draft-pr.mjs';

function setup() {
  const dir=mkdtempSync(join(tmpdir(),'reca-integrated-'));
  const git=(...args)=>execFileSync('git',args,{cwd:dir,encoding:'utf8'}).trim();
  git('init','-q');git('config','user.name','Lab');git('config','user.email','lab@example.invalid');
  writeFileSync(join(dir,'README.md'),'base');
  git('add','.');git('commit','-qm','base');
  const base=git('rev-parse','HEAD');
  mkdirSync(join(dir,'sandbox-app/src'),{recursive:true});
  const path='sandbox-app/src/styles.css', content='.example { color: navy; }';
  writeFileSync(join(dir,path),content);git('add','.');git('commit','-qm','candidate');
  const head=git('rev-parse','HEAD'),requestId=47;
  const prefix='/repos/reca-digital/reca-control-lab';
  const replies={
    [prefix]:{full_name:'reca-digital/reca-control-lab',private:false,archived:false},
    [prefix+'/git/ref/heads/sandbox/reca-auto-control-setup']:{ref:'refs/heads/sandbox/reca-auto-control-setup',object:{sha:base}},
    [prefix+'/git/ref/heads/prototype/review-only-47']:null,
    [prefix+'/pulls?state=all&head=reca-digital%3Aprototype/review-only-47&per_page=100']:[]
  };
  const request=async(method,url)=>{assert.equal(method,'GET');if(!(url in replies))throw Error('Unexpected path');return replies[url];};
  const clean=()=>rmSync(dir,{recursive:true,force:true});
  return {dir,base,head,requestId,payload:{files:[{path,content}]},replies,request,clean};
}

test('read-only snapshot feeds strict Draft PR planner without writing to GitHub',async()=>{
  const x=setup();
  try {
    const remote=await readSandboxState({request:x.request,requestId:x.requestId});
    const plan=planSandboxDraftPR({repoDir:x.dir,base:x.base,head:x.head,
      payload:x.payload,remote,requestId:x.requestId});
    assert.equal(plan.draft,true);
    assert.equal(plan.repository,'reca-digital/reca-control-lab');
    assert.equal(plan.base,'sandbox/reca-auto-control-setup');
    assert.equal(plan.candidateHeadSha,x.head);
    assert.deepEqual(plan.files,['sandbox-app/src/styles.css']);
  }finally{x.clean()}
});

test('rejects moved remote sandbox ref before any proposed PR',async()=>{
  const x=setup();
  try {
    x.replies['/repos/reca-digital/reca-control-lab/git/ref/heads/sandbox/reca-auto-control-setup'].object.sha='f'.repeat(40);
    const remote=await readSandboxState({request:x.request,requestId:x.requestId});
    assert.throws(()=>planSandboxDraftPR({repoDir:x.dir,base:x.base,head:x.head,
      payload:x.payload,remote,requestId:x.requestId}));
  }finally{x.clean()}
});

test('rejects existing PR before any proposed branch',async()=>{
  const x=setup();
  try {
    x.replies['/repos/reca-digital/reca-control-lab/pulls?state=all&head=reca-digital%3Aprototype/review-only-47&per_page=100']=[
      {head:{ref:'prototype/review-only-47',repo:{full_name:'reca-digital/reca-control-lab'}}}
    ];
    const remote=await readSandboxState({request:x.request,requestId:x.requestId});
    assert.throws(()=>planSandboxDraftPR({repoDir:x.dir,base:x.base,head:x.head,
      payload:x.payload,remote,requestId:x.requestId}));
  }finally{x.clean()}
});
