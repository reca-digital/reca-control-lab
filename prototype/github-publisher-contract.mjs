// A pure transport contract. No fetch, tokens, I/O or GitHub writes.
// Transport must independently enforce repository identity, permissions and one-shot receipts.
const REPO='/repos/reca-digital/reca-control-lab';
const SHA=/^[a-f0-9]{40}$/;
const BLOB=/^[a-f0-9]{40}$/;
const BRANCH=/^prototype\/review-only-[1-9][0-9]{0,5}$/;
const BASE='sandbox/reca-auto-control-setup';
const fail=message=>{throw new Error(message)};
function record(v,keys) {
  return v!==null&&typeof v==='object'&&!Array.isArray(v)&&
    Object.keys(v).sort().join('|')===[...keys].sort().join('|');
}
export function publisherRequest(kind,data) {
  if(typeof kind!=='string'||!record(data,(
    {blob:['content'],tree:['baseTree','entries'],commit:['parent','tree','message'],
     compare:['base','head'],branch:['name','sha'],pr:['head','title','body']}[kind]||[]
  )))fail('Unrecognized operation or request shape');
  let method='POST', path,body;
  switch(kind){
    case 'blob':
      if(typeof data.content!=='string'||Buffer.byteLength(data.content,'utf8')>16000||
        data.content.length===0)fail('Invalid blob');
      path='/git/blobs';body={content:data.content,encoding:'utf-8'};break;
    case 'tree':
      if(!SHA.test(data.baseTree)||!Array.isArray(data.entries)||
        data.entries.length===0||data.entries.length>2)fail('Invalid tree');
      if(data.entries.some(x=>!record(x,['path','mode','type','sha'])||
        !['sandbox-app/src/App.jsx','sandbox-app/src/styles.css'].includes(x.path)||
        x.mode!=='100644'||x.type!=='blob'||!BLOB.test(x.sha))||
        new Set(data.entries.map(x=>x.path)).size!==data.entries.length)
        fail('Tree changed unknown paths');
      path='/git/trees';body={base_tree:data.baseTree,tree:data.entries};break;
    case 'commit':
      if(!SHA.test(data.parent)||!SHA.test(data.tree)||
        !/^sandbox: code review [1-9][0-9]{0,5}$/.test(data.message))fail('Invalid commit');
      path='/git/commits';body={message:data.message,tree:data.tree,parents:[data.parent]};break;
    case 'compare':
      if(!SHA.test(data.base)||!SHA.test(data.head))fail('Invalid compare');
      method='GET';path='/compare/'+data.base+'...'+data.head;break;
    case 'branch':
      if(!BRANCH.test(data.name)||!SHA.test(data.sha))fail('Invalid branch');
      path='/git/refs';body={ref:'refs/heads/'+data.name,sha:data.sha};break;
    case 'pr':
      if(!BRANCH.test(data.head)||data.title!=='Sandbox code review #'+
         data.head.slice('prototype/review-only-'.length)||
         typeof data.body!=='string'||data.body.length>600||
         !data.body.startsWith('Isolated offline verification of '))
        fail('Invalid Draft PR request');
      path='/pulls';body={head:data.head,base:BASE,title:data.title,body:data.body,draft:true};break;
  }
  return Object.freeze({method,path:REPO+path,...(body?{body:structuredClone(body)}:{})});
}
