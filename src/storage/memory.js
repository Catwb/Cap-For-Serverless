import { StorageAdapter } from "./adapter.js";

export class MemoryAdapter extends StorageAdapter {
  constructor() {
    super();
    this._data = new Map();
  }

  async get(key) { const v = this._data.get(key); return v === undefined ? null : v.value; }
  async set(key, value, ttl) { this._data.set(key, { value, expires: ttl ? Date.now() + ttl * 1000 : null }); }
  async del(key) { this._data.delete(key); }
  async setnx(key, value, ttl) {
    if (this._data.has(key)) return false;
    this._data.set(key, { value, expires: ttl ? Date.now() + ttl * 1000 : null });
    return true;
  }
  async getdel(key) {
    const v = this._data.get(key);
    if (!v) return null;
    if (v.expires && Date.now() > v.expires) { this._data.delete(key); return null; }
    this._data.delete(key);
    return v.value;
  }
  async incr(key) {
    const v = this._data.get(key);
    const n = (v ? Number(v.value) : 0) + 1;
    this._data.set(key, { value: String(n), expires: v?.expires || null });
    return n;
  }
  async expire(key, ttl) {
    const v = this._data.get(key);
    if (v) { v.expires = Date.now() + ttl * 1000; }
  }
  async exists(key) { return this._data.has(key) ? 1 : 0; }
  async hget(key, field) {
    const v = this._data.get(key);
    if (!v) return null;
    if (v.expires && Date.now() > v.expires) { this._data.delete(key); return null; }
    const obj = typeof v.value === "string" ? JSON.parse(v.value) : v.value;
    return obj[field] ?? null;
  }
  async hmget(key, fields) {
    const v = this._data.get(key);
    if (!v) return fields.map(() => null);
    const obj = typeof v.value === "string" ? JSON.parse(v.value) : v.value;
    return fields.map(f => obj[f] ?? null);
  }
  async hgetall(key) {
    const v = this._data.get(key);
    if (!v) return null;
    if (v.expires && Date.now() > v.expires) { this._data.delete(key); return null; }
    return typeof v.value === "string" ? JSON.parse(v.value) : v.value;
  }
  async hset(key, field, value) {
    let v = this._data.get(key);
    let obj = v ? (typeof v.value === "string" ? JSON.parse(v.value) : v.value) : {};
    obj[field] = value;
    this._data.set(key, { value: obj, expires: v?.expires || null });
  }
  async hmset(key, data) {
    let v = this._data.get(key);
    let obj = v ? (typeof v.value === "string" ? JSON.parse(v.value) : v.value) : {};
    if (Array.isArray(data)) {
      for (let i = 0; i < data.length; i += 2) obj[data[i]] = data[i + 1];
    } else {
      Object.assign(obj, data);
    }
    this._data.set(key, { value: obj, expires: v?.expires || null });
  }
  async hincrby(key, field, incr) {
    let v = this._data.get(key);
    let obj = v ? (typeof v.value === "string" ? JSON.parse(v.value) : v.value) : {};
    obj[field] = (Number(obj[field]) || 0) + incr;
    this._data.set(key, { value: obj, expires: v?.expires || null });
    return obj[field];
  }
  async hdel(key, field) {
    const v = this._data.get(key);
    if (!v) return;
    const obj = typeof v.value === "string" ? JSON.parse(v.value) : v.value;
    delete obj[field];
    this._data.set(key, { value: obj, expires: v?.expires || null });
  }
  async sadd(key, member) {
    let v = this._data.get(key);
    let s = v ? v.value : new Set();
    if (!(s instanceof Set)) s = new Set([s].flat());
    s.add(member);
    this._data.set(key, { value: s, expires: v?.expires || null });
  }
  async srem(key, member) {
    const v = this._data.get(key);
    if (!v) return;
    let s = v.value;
    if (s instanceof Set) s.delete(member);
  }
  async smembers(key) {
    const v = this._data.get(key);
    if (!v) return [];
    return v.value instanceof Set ? [...v.value] : [];
  }
  async scard(key) {
    const v = this._data.get(key);
    if (!v) return 0;
    return v.value instanceof Set ? v.value.size : 0;
  }
  async sismember(key, member) {
    const v = this._data.get(key);
    if (!v) return 0;
    return v.value instanceof Set && v.value.has(member) ? 1 : 0;
  }
  async ping() { return true; }
  async send(cmd, args) {
    if (this[cmd]) return this[cmd](...args);
    return null;
  }
}
