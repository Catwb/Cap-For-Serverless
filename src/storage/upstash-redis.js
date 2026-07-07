import { Redis } from "@upstash/redis";
import { StorageAdapter } from "./adapter.js";

const KEY_FIRST = new Set([
  "get", "getdel", "set", "incr", "decr", "expire", "ttl",
  "sadd", "srem", "smembers", "scard", "sismember",
  "hget", "hset", "hmget", "hgetall", "hincrby", "hdel",
]);

export class UpstashRedisAdapter extends StorageAdapter {
  constructor(opts = {}) {
    super();
    const cfg = opts.cfg || {};
    const url = opts.url || cfg.UPSTASH_REDIS_REST_URL || cfg.KV_REST_API_URL;
    const token = opts.token || cfg.UPSTASH_REDIS_REST_TOKEN || cfg.KV_REST_API_TOKEN;
    if (!url) throw new Error("Upstash Redis URL required (UPSTASH_REDIS_REST_URL)");
    this.prefix = opts.prefix || cfg.REDIS_PREFIX || "";
    this.client = new Redis({ url, token });
  }

  _p(k) {
    return typeof k === "string" && k.length ? this.prefix + k : k;
  }

  async get(key) { return this.client.get(this._p(key)); }
  async set(key, value, ttl) { return this.client.set(this._p(key), value, ttl ? { ex: ttl } : undefined); }
  async del(key) { return this.client.del(this._p(key)); }
  async setnx(key, value, ttl) {
    const r = await this.client.set(this._p(key), value, { nx: true, ex: ttl });
    return r === "OK" || r === true;
  }
  async getdel(key) { return this.client.getdel(this._p(key)); }
  async incr(key) { return this.client.incr(this._p(key)); }
  async expire(key, ttl) { return this.client.expire(this._p(key), ttl); }
  async exists(key) { return this.client.exists(this._p(key)); }
  async hget(key, field) { return this.client.hget(this._p(key), field); }
  async hmget(key, fields) { return this.client.hmget(this._p(key), ...fields); }
  async hgetall(key) { return this.client.hgetall(this._p(key)); }
  async hset(key, field, value) { return this.client.hset(this._p(key), { [field]: value }); }
  async hmset(key, data) {
    if (Array.isArray(data)) {
      const obj = {};
      for (let i = 0; i < data.length; i += 2) obj[data[i]] = data[i + 1];
      return this.client.hset(this._p(key), obj);
    }
    return this.client.hset(this._p(key), data);
  }
  async hincrby(key, field, incr) { return this.client.hincrby(this._p(key), field, incr); }
  async hdel(key, field) { return this.client.hdel(this._p(key), field); }
  async sadd(key, member) { return this.client.sadd(this._p(key), member); }
  async srem(key, member) { return this.client.srem(this._p(key), member); }
  async smembers(key) { return this.client.smembers(this._p(key)); }
  async scard(key) { return this.client.scard(this._p(key)); }
  async sismember(key, member) { return this.client.sismember(this._p(key), member); }
  async ping() {
    try { await this.client.set("__ping__", "1", { ex: 1 }); return true; }
    catch { return false; }
  }
  async send(cmd, args) {
    if (!args || args.length === 0) return this.client[cmd]();
    const prefixed = KEY_FIRST.has(cmd) ? [this._p(args[0]), ...args.slice(1)] : args.map(a => this._p(a));
    return this.client[cmd](...prefixed);
  }
}
