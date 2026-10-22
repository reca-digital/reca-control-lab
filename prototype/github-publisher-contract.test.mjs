import test from 'node:test';
import assert from 'node:assert/strict';
import {publisherRequest as make} from './github-publisher-contract.mjs';
const A='a'.repeat(40),B='b'.repeat(40);
const entry={path:'sandbox-app/src/App.jsx',mode:'100644',type:'blob',sha:A};
const good=[
 ['blob',{content:'hello'},'POST','/git/blobs'],
 ['tree',{baseTree:A,entries:[entry]},'POST','/git/trees'],
 ['commit',{parent:A,tree:B,message:'sandbox: code review 42'},'POST','/git/commits'],
 ['compare',{base:A,head:B},'GET','/compare/'+A+'...'+B],
 ['branch',{name:'prototype/review-only-42',sha:B},'POST','/git/refs'],
 ['pr',{head:'prototype/review-only-42',title:'Sandbox code review #42',
  body:'Isolated offline verification of 1 allowlisted file(s).'},'POST','/pulls']
];
for(const [kind,data,method,path] of good)
 test('allows only fixed '+kind+' request',()=>{
   const x=make(kind,data);
   assert.equal(x.method,method);
   assert.equal(x.path,'/repos/reca-digital/reca-control-lab'+path);
   if(kind==='pr'){assert.equal(x.body.draft,true);assert.equal(x.body.base,'sandbox/reca-auto-control-setup')}
 });
const bad=[
 ['unknown',{}],
 ['blob',{content:''}],['blob',{content:'x',url:'https://elsewhere'}],
 ['tree',{baseTree:'bad',entries:[entry]}],
 ['tree',{baseTree:A,entries:[entry,entry]}],
 ['tree',{baseTree:A,entries:[{...entry,path:'../.env'}]}],
 ['tree',{baseTree:A,entries:[{...entry,mode:'120000'}]}],
 ['commit',{parent:A,tree:B,message:'deploy now'}],
 ['compare',{base:'main',head:B}],
 ['branch',{name:'main',sha:A}],
 ['branch',{name:'prototype/review-only-42',sha:'short'}],
 ['pr',{head:'prototype/review-only-42',title:'Sandbox code review #41',body:'Isolated offline verification of 1 allowlisted file(s).'}],
 ['pr',{head:'prototype/review-only-42',title:'Sandbox code review #42',body:'https://other'}]
];
for(const [i,[kind,data]] of bad.entries())
 test('rejects unauthorized operation '+i,()=>assert.throws(()=>make(kind,data)));
