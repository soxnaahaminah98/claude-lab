// Calls both callable functions in the local emulator.
//   node scripts/call-samples.mjs validation   bad inputs only (needs no API key)
//   node scripts/call-samples.mjs samples      fictional text + label (needs the key)
//   node scripts/call-samples.mjs              both
// Only fictional data is sent: see samples/ and the text below.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const BASE = process.env.FUNCTIONS_URL ?? 'http://127.0.0.1:5001/demo-it-parc/europe-west1';
const SAMPLE_TEXT = 'Portable Exemple Tech DEMO-14, étiquette TEST-0001, l’écran reste noir au démarrage.';

async function call(name, data) {
  const response = await fetch(`${BASE}/${name}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ data }),
  });
  const body = await response.json().catch(() => null);
  return { http: response.status, body };
}

function show(title, { http, body }) {
  console.log(`\n== ${title} (HTTP ${http})`);
  console.log(JSON.stringify(body, null, 2));
}

async function validation() {
  show('text: empty', await call('describeAssetFromText', { text: '   ' }));
  show('text: 2,001 characters', await call('describeAssetFromText', { text: 'a'.repeat(2001) }));
  show('image: GIF declared', await call('describeAssetFromImage', { imageBase64: 'R0lGODlhAQABAAAAACw=', mimeType: 'image/gif' }));
  show('image: not an image', await call('describeAssetFromImage', { imageBase64: Buffer.from('hello world!').toString('base64'), mimeType: 'image/png' }));
  const big = Buffer.alloc(4 * 1024 * 1024 + 1);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(big);
  show('image: 4 MB + 1 byte', await call('describeAssetFromImage', { imageBase64: big.toString('base64'), mimeType: 'image/png' }));
}

async function samples() {
  show('text: sample note', await call('describeAssetFromText', { text: SAMPLE_TEXT }));
  const labelPath = fileURLToPath(new URL('../samples/fictional-label.png', import.meta.url));
  const label = await readFile(labelPath);
  show('image: fictional label', await call('describeAssetFromImage', { imageBase64: label.toString('base64'), mimeType: 'image/png' }));
}

const mode = process.argv[2] ?? 'all';
if (mode === 'validation' || mode === 'all') await validation();
if (mode === 'samples' || mode === 'all') await samples();
