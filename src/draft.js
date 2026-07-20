const FORMAT = 'living-legacy-map';
const VERSION = 1;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const bytesToBase64 = bytes => btoa(String.fromCharCode(...bytes));
const base64ToBytes = value => Uint8Array.from(atob(value), character => character.charCodeAt(0));

function envelope(kind, state) {
  return { format: FORMAT, version: VERSION, kind, state };
}

function parseEnvelope(text, expectedKind) {
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('草稿文件無法讀取。');
  }
  if (value?.format !== FORMAT || value.version !== VERSION || value.kind !== expectedKind || !value.state) {
    throw new Error('這不是可使用的明日藏寶圖草稿。');
  }
  return value;
}

export function lightDraft(state) {
  const withoutAmount = item => {
    const { amount, ...safe } = item;
    return safe;
  };
  return JSON.stringify(envelope('light', {
    ...state,
    assets: state.assets.map(withoutAmount),
    debts: state.debts.map(withoutAmount),
    people: state.people.map(withoutAmount),
    gifts: state.gifts.map(withoutAmount)
  }), null, 2);
}

export function parseLightDraft(text) {
  return parseEnvelope(text, 'light').state;
}

async function deriveKey(password, salt) {
  const material = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 250000 },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptFullDraft(state, password) {
  if (String(password).length < 12) throw new Error('密碼至少需要 12 個字元。');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const plaintext = encoder.encode(JSON.stringify(envelope('full', state)));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext));
  return JSON.stringify({
    format: FORMAT,
    version: VERSION,
    kind: 'encrypted-full',
    iterations: 250000,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(ciphertext)
  });
}

export async function decryptFullDraft(text, password) {
  try {
    const payload = JSON.parse(text);
    if (payload?.format !== FORMAT || payload.version !== VERSION || payload.kind !== 'encrypted-full') {
      throw new Error();
    }
    const salt = base64ToBytes(payload.salt);
    const iv = base64ToBytes(payload.iv);
    const key = await deriveKey(password, salt);
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv }, key, base64ToBytes(payload.ciphertext)
    );
    return parseEnvelope(decoder.decode(plaintext), 'full').state;
  } catch {
    throw new Error('密碼不正確，或完整草稿無法讀取。');
  }
}
