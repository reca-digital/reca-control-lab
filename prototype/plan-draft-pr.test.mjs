import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {planSandboxDraftPR} from './plan-draft-pr.mjs';

function fixture(){
 const dir=mkdtempSync(join(tmpdir(),'reca-plan-'));
 const git=(...args)=>execFileSync('git',args,{cwd:dir,encoding:'utf8'}).trim();
 git('init','-q');git('config','user.email','test@example.invalid');git('config','user.name','Tester');
 writeFileSync(join(dir,'README.md'),'sandbox fixture');
 git('add','.');git('commit','-qm','base');
 const base=git('rev-parse','HEAD');
 mkdirSync(join(dir,'sandbox-app/src'),{recursive:true});
 const content='export default function App(){ return <h1>OK</h1>; }';
 writeFileSync(join(dir,'sandbox-app/src/App.jsx'),content);
 git('add','.');git('commit','-qm','candidate'); const head=git('rev-parse','HEAD');
 return {repoDir:dir,base,head,payload:{files:[{path:'sandbox-app/src/App.jsx',content}]},
  remote:{repository:'reca-digital/reca-control-lab',visibility:'public',
    baseRef:'sandbox/reca-auto-control-setup',baseSha:base,
    existingBranch:false,existingPr:false},
  requestId:29,dispose:()=>rmSync(dir,{recursive:true,force:true})};
}
test('returns isolated Draft PR plan without side effects',()=>{
 const x=fixture();try{
  const p=planSandboxDraftPR(x);
  assert.equal(p.draft,true);assert.equal(p.branch,'prototype/review-only-29');
  assert.equal(p.expectedBaseSha,x.base);assert.deepEqual(p.files,['sandbox-app/src/App.jsx']);
 }finally{x.dispose()}
});
const mutations=[
 x=>x.remote.repository='reca-digital/demo',
 x=>x.remote.visibility='private',
 x=>x.remote.baseRef='main',
 x=>x.remote.baseSha='0'.repeat(40),
 x=>x.remote.existingPr=true,
 x=>x.remote.existingBranch=true,
 x=>x.requestId=0,
 x=>x.payload.files[0].content='not the committed file',
 x=>x.head=x.base,
 x=>x.remote.extra='ignored'
];
for(const [i,mutate] of mutations.entries()){
 test('rejects unsafe plan '+i,()=>{
  const x=fixture();try{mutate(x);assert.throws(()=>planSandboxDraftPR(x))}finally{x.dispose()}
 });
}
