import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {publishSandboxDraft} from './publish-sandbox-draft.mjs';
const H='a'.repeat(40),T='b'.repeat(40),C='c'.repeat(40);
function fixture(){
 const dir=mkdtempSync(join(tmpdir(),'reca-publisher-'));
 const git=(...args)=>execFileSync('git',args,{cwd:dir,encoding:'utf8'}).trim();
 git('init','-q');git('config','user.email','test@example.invalid');git('config','user.name','Tester');
 writeFileSync(join(dir,'README.md'),'base');git('add','.');git('commit','-qm','base');
 const base=git('rev-parse','HEAD');
 mkdirSync(join(dir,'sandbox-app/src'),{recursive:true});
 const content='export default function App(){return <h1>Lab</h1>}';
 writeFileSync(join(dir,'sandbox-app/src/App.jsx'),content);
 git('add','.');git('commit','-qm','candidate');
 const head=git('rev-parse','HEAD');
 const payload={files:[{path:'sandbox-app/src/App.jsx',content}]};
 const remote={repository:'reca-digital/reca-control-lab',visibility:'public',
  baseRef:'sandbox/reca-auto-control-setup',baseSha:base,existingBranch:false,existingPr:false};
 const calls=[];
 const client={
  readState:async()=>{calls.push('read');return {...remote}},
  createBlob:async()=>{calls.push('blob');return H},
  createTree:async()=>{calls.push('tree');return T},
  createCommit:async()=>{calls.push('commit');return C},
  compare:async()=>{calls.push('compare');return [{path:'sandbox-app/src/App.jsx',status:'added'}]},
  createBranch:async()=>{calls.push('branch')},
  createDraftPR:async x=>{calls.push('pr');assert.equal(x.draft,true);return {number:99,draft:true}}
 };
 const args={client,repoDir:dir,base,head,payload,requestId:73,
  authorization:{approved:true,requestId:73,baseSha:base,headSha:head,receipt:'reca-code-73-reserved'}};
 return {args,calls,remote,dispose:()=>rmSync(dir,{recursive:true,force:true})};
}
test('makes exactly one draft with validated plan',async()=>{
 const f=fixture();try{
  const result=await publishSandboxDraft(f.args);
  assert.equal(result.number,99);assert.equal(result.draft,true);
  assert.deepEqual(f.calls,['read','read','blob','tree','commit','compare','read','branch','pr']);
 }finally{f.dispose()}
});
const faults=[
 f=>f.args.authorization.approved=false,
 f=>f.args.authorization.receipt='unreserved',
 f=>f.args.authorization.headSha=H,
 f=>f.remote.repository='reca-digital/demo',
 f=>f.remote.visibility='private',
 f=>f.remote.existingPr=true,
 f=>f.remote.existingBranch=true,
 f=>f.remote.baseSha=H,
 f=>f.args.payload.files[0].content='tampered',
 f=>{let i=0; f.args.client.readState=async()=>{f.calls.push('read');return i++?{...f.remote,existingPr:true}:{...f.remote}}},
 f=>f.args.client.compare=async()=>[{path:'sandbox-app/src/styles.css',status:'modified'}],
 f=>f.args.client.createBlob=async()=> 'bad-sha'
];
for(const [i,inject] of faults.entries()){
 test('fails closed on invalid input '+i,async()=>{
  const f=fixture();try{
   inject(f);await assert.rejects(publishSandboxDraft(f.args));
   assert.equal(f.calls.includes('pr'),false);
  }finally{f.dispose()}
 });
}
