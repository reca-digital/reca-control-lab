import test from 'node:test';
import assert from 'node:assert/strict';
import {validateChanges} from './validate-changes.mjs';

const good = {
  files: [
    {path: 'sandbox-app/src/styles.css', content: '.title { color: navy; }'},
    {path: 'sandbox-app/src/App.jsx', content: 'export default function App() { return <h1>Тест</h1>; }'}
  ]
};
test('accepts two allowlisted files in canonical order', () => {
  assert.deepEqual(validateChanges(good).map(x => x.path), [
    'sandbox-app/src/App.jsx', 'sandbox-app/src/styles.css'
  ]);
});
test('accepts one allowlisted file', () => {
  assert.equal(validateChanges({files: [good.files[0]]}).length, 1);
});
const bad = [
  null, {}, {files: []},
  {files: [good.files[0], good.files[1], good.files[0]]},
  {files: [{path:'../demo/.env', content:'no'}]},
  {files: [{path:'sandbox-app/src/../src/App.jsx', content:'no'}]},
  {files: [{path:'/sandbox-app/src/App.jsx', content:'no'}]},
  {files: [{path:'sandbox-app\\src\\App.jsx', content:'no'}]},
  {files: [good.files[0], good.files[0]]},
  {files: [{path:'sandbox-app/src/App.jsx', content:''}]},
  {files: [{path:'sandbox-app/src/App.jsx', content:'x'.repeat(16001)}]},
  {files: [{path:'sandbox-app/src/App.jsx', content:'fetch("/secret")'}]},
  {files: [{path:'sandbox-app/src/App.jsx', content:'import("untrusted")'}]},
  {files: [{path:'sandbox-app/src/App.jsx', content:'process.env.PRIVATE'}]},
  {files: [{path:'sandbox-app/src/App.jsx', content:'eval("1+1")'}]},
  {files: [{path:'sandbox-app/src/App.jsx', content:'http://example.org'}]},
  {files: [{path:'sandbox-app/src/App.jsx', content:'secret\u0000hidden'}]},
  {files: [{path:'sandbox-app/src/App.jsx', content:'x', extra:true}]},
  {files: [{path:'sandbox-app/src/App.jsx', content:15}]},
  {files: [good.files[0]], extra:true}
];
for (const [i, input] of bad.entries()) {
  test('rejects disallowed payload ' + i, () => assert.throws(() => validateChanges(input)));
}
