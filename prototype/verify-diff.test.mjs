import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {verifyCommittedDiff} from './verify-diff.mjs';
function fixture(extra) {
  const dir=mkdtempSync(join(tmpdir(),'reca-verifier-'));
  const git=(...args)=>execFileSync('git',args,{cwd:dir,encoding:'utf8'}).trim();
  git('init','-q');git('config','user.email','test@example.invalid');git('config','user.name','Tester');
  writeFileSync(join(dir,'README.md'),'base');git('add','.');git('commit','-qm','base');
  const base=git('rev-parse','HEAD');mkdirSync(join(dir,'sandbox-app/src'),{recursive:true});
  const file='sandbox-app/src/App.jsx',content='export default function App(){ return <h1>ok</h1>; }';
  writeFileSync(join(dir,file),content);
  if(extra) extra(dir,git);
  git('add','.');git('commit','-qm','head');const head=git('rev-parse','HEAD');
  return {dir,base,head,payload:{files:[{path:file,content}]},dispose:()=>rmSync(dir,{recursive:true,force:true})};
}
test('accepts exact one-file pinned committed diff',()=>{const x=fixture();try{assert.equal(verifyCommittedDiff({repoDir:x.dir,base:x.base,head:x.head,payload:x.payload}).totalFiles,1)}finally{x.dispose()}});
test('rejects unclaimed extra file',()=>{const x=fixture(dir=>writeFileSync(join(dir,'extra.txt'),'bad'));try{assert.throws(()=>verifyCommittedDiff({repoDir:x.dir,base:x.base,head:x.head,payload:x.payload}))}finally{x.dispose()}});
test('rejects mismatched content',()=>{const x=fixture();try{x.payload.files[0].content='wrong';assert.throws(()=>verifyCommittedDiff({repoDir:x.dir,base:x.base,head:x.head,payload:x.payload}))}finally{x.dispose()}});
test('rejects reversed commits',()=>{const x=fixture();try{assert.throws(()=>verifyCommittedDiff({repoDir:x.dir,base:x.head,head:x.base,payload:x.payload}))}finally{x.dispose()}});
test('rejects shortened hash',()=>{const x=fixture();try{assert.throws(()=>verifyCommittedDiff({repoDir:x.dir,base:x.base.slice(0,7),head:x.head,payload:x.payload}))}finally{x.dispose()}});
test('rejects symlink mode',()=>{const x=fixture(dir=>{rmSync(join(dir,'sandbox-app/src/App.jsx'));symlinkSync('../../README.md',join(dir,'sandbox-app/src/App.jsx'));});try{assert.throws(()=>verifyCommittedDiff({repoDir:x.dir,base:x.base,head:x.head,payload:x.payload}))}finally{x.dispose()}});
