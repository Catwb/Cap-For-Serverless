import {
  deserializeRswKeypair,
  generateRswKeypair,
  serializeRswKeypair,
} from "capjs-core";

const RSW_REDIS_KEY = "settings:rsw_keypair";
const DEFAULT_BITS = Number(process.env.RSW_BITS) || 2048;

let _keypair = null;
let _version = null;
let _bits = null;
let _created = null;
let _generating = null;
let _storage = null;

export function initRswStore(storage) {
  _storage = storage;
}

function clearMemory() {
  _keypair = null;
  _version = null;
  _bits = null;
  _created = null;
}

function status() {
  return { exists: !!_keypair, bits: _bits, created: _created, generating: !!_generating };
}

async function persist(kp, bits) {
  if (!_storage) return;
  const ser = serializeRswKeypair(kp);
  const version = String(Date.now());
  const created = String(Date.now());
  await _storage.send("HSET", [
    RSW_REDIS_KEY, "N", ser.N, "p", ser.p, "q", ser.q,
    "bits", String(ser.bits ?? bits ?? DEFAULT_BITS),
    "version", version, "created", created,
  ]);
  _keypair = deserializeRswKeypair(ser);
  _version = version;
  _bits = ser.bits ?? bits ?? DEFAULT_BITS;
  _created = Number(created);
}

export async function loadRswKeypair() {
  if (!_storage) return status();
  try {
    const obj = await _storage.hgetall(RSW_REDIS_KEY);
    if (!obj?.N || !obj.p || !obj.q) { clearMemory(); return status(); }
    if (_version && obj.version === _version) return status();
    _keypair = deserializeRswKeypair({ N: obj.N, p: obj.p, q: obj.q, bits: obj.bits ? Number(obj.bits) : null });
    _version = obj.version || null;
    _bits = obj.bits ? Number(obj.bits) : (_keypair.bits ?? null);
    _created = obj.created ? Number(obj.created) : null;
  } catch { clearMemory(); }
  return status();
}

export function getRswKeypair() {
  return _keypair;
}

export function getRswStatus() {
  return status();
}

export function ensureRswKeypair() {
  if (_keypair) return Promise.resolve(status());
  if (_generating) return _generating;
  _generating = (async () => {
    await loadRswKeypair();
    if (_keypair) return status();
    const bits = DEFAULT_BITS;
    const kp = generateRswKeypair(bits);
    await persist(kp, bits);
    return status();
  })().finally(() => { _generating = null; });
  return _generating;
}
