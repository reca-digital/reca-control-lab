// Offline prototype only. No GitHub token, AI call, file writes or deployment.
export const ALLOWED_PATHS = Object.freeze([
  'sandbox-app/src/App.jsx',
  'sandbox-app/src/styles.css'
]);
const MAX_FILES = 2;
const MAX_TOTAL_BYTES = 16000;
const BAD_CONTENT = /(?:-----BEGIN [A-Z ]*PRIVATE KEY-----|sk-[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9_]{12,}|https?:\/\/|<script\b|\beval\s*\(|\bnew\s+Function\s*\(|\bimport\s*\(|\brequire\s*\(|\bfetch\s*\(|\bprocess\.env\b|\bchild_process\b|\bXMLHttpRequest\b)/i;

function fail(message) { throw new Error(message); }
function ownKeys(object, keys) {
  return Object.keys(object).sort().join(',') === [...keys].sort().join(',');
}
export function validateChanges(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) ||
      !ownKeys(payload, ['files'])) fail('Invalid payload schema');
  const files = payload.files;
  if (!Array.isArray(files) || files.length === 0 || files.length > MAX_FILES)
    fail('Invalid file count');
  let bytes = 0;
  const seen = new Set();
  const normalized = [];
  for (const entry of files) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry) ||
        !ownKeys(entry, ['path', 'content']) ||
        typeof entry.path !== 'string' || typeof entry.content !== 'string')
      fail('Invalid file schema');
    if (!ALLOWED_PATHS.includes(entry.path) || entry.path.includes('..') ||
        entry.path.includes('\\') || entry.path.startsWith('/'))
      fail('File not explicitly permitted');
    if (seen.has(entry.path)) fail('Duplicate file');
    seen.add(entry.path);
    const n = Buffer.byteLength(entry.content, 'utf8');
    bytes += n;
    if (!n || bytes > MAX_TOTAL_BYTES) fail('Output size exceeded');
    if (/[\x00-\x08\x0B-\x1F\x7F]/.test(entry.content) ||
        BAD_CONTENT.test(entry.content)) fail('Content requires manual security review');
    normalized.push({path: entry.path, content: entry.content});
  }
  return normalized.sort((a, b) => a.path.localeCompare(b.path, 'en'));
}
