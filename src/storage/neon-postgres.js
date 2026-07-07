import { Pool } from "@neondatabase/serverless";
import { StorageAdapter } from "./adapter.js";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS cap_kv (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  expires_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS cap_hash (
  key TEXT NOT NULL,
  field TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  PRIMARY KEY (key, field)
);
CREATE TABLE IF NOT EXISTS cap_set (
  key TEXT NOT NULL,
  member TEXT NOT NULL,
  PRIMARY KEY (key, member)
);
CREATE INDEX IF NOT EXISTS idx_cap_kv_expires ON cap_kv(expires_at);
CREATE INDEX IF NOT EXISTS idx_cap_hash_expires ON cap_hash(expires_at);
`;

export class NeonPGAdapter extends StorageAdapter {
  constructor(connectionString) {
    super();
    const url = connectionString || process.env.DATABASE_URL;
    if (!url) throw new Error("Neon Postgres connection string required (DATABASE_URL)");
    this.pool = new Pool({ connectionString: url });
    this._initialized = false;
  }

  async _ensureInit() {
    if (this._initialized) return;
    await this.pool.query(SCHEMA_SQL);
    this._initialized = true;
  }

  async get(key) {
    await this._ensureInit();
    const { rows } = await this.pool.query(
      "SELECT value FROM cap_kv WHERE key = $1 AND (expires_at IS NULL OR expires_at > NOW())",
      [key]
    );
    return rows[0]?.value ?? null;
  }

  async set(key, value, ttl) {
    await this._ensureInit();
    const expiresAt = ttl ? new Date(Date.now() + ttl * 1000).toISOString() : null;
    await this.pool.query(
      `INSERT INTO cap_kv (key, value, expires_at) VALUES ($1, $2, $3)
       ON CONFLICT (key) DO UPDATE SET value = $2, expires_at = $3`,
      [key, value, expiresAt]
    );
  }

  async del(key) {
    await this._ensureInit();
    await this.pool.query("DELETE FROM cap_kv WHERE key = $1", [key]);
  }

  async setnx(key, value, ttl) {
    await this._ensureInit();
    const expiresAt = ttl ? new Date(Date.now() + ttl * 1000).toISOString() : null;
    const { rowCount } = await this.pool.query(
      `INSERT INTO cap_kv (key, value, expires_at) VALUES ($1, $2, $3)
       ON CONFLICT (key) DO NOTHING
       RETURNING key`,
      [key, value, expiresAt]
    );
    return rowCount > 0;
  }

  async getdel(key) {
    await this._ensureInit();
    const { rows } = await this.pool.query(
      "DELETE FROM cap_kv WHERE key = $1 AND (expires_at IS NULL OR expires_at > NOW()) RETURNING value",
      [key]
    );
    return rows[0]?.value ?? null;
  }

  async incr(key) {
    await this._ensureInit();
    const { rows } = await this.pool.query(
      `INSERT INTO cap_kv (key, value) VALUES ($1, '1')
       ON CONFLICT (key) DO UPDATE SET value = (
         CASE WHEN cap_kv.expires_at IS NOT NULL AND cap_kv.expires_at <= NOW()
         THEN '1'
         ELSE (cap_kv.value::bigint + 1)::text
         END
       )
       RETURNING value::bigint`,
      [key]
    );
    return Number(rows[0]?.value ?? 1);
  }

  async expire(key, ttl) {
    await this._ensureInit();
    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
    await this.pool.query(
      "UPDATE cap_kv SET expires_at = $2 WHERE key = $1",
      [key, expiresAt]
    );
  }

  async exists(key) {
    await this._ensureInit();
    const { rows } = await this.pool.query(
      "SELECT 1 FROM cap_kv WHERE key = $1 AND (expires_at IS NULL OR expires_at > NOW())",
      [key]
    );
    return rows.length ? 1 : 0;
  }

  async hget(key, field) {
    await this._ensureInit();
    const { rows } = await this.pool.query(
      "SELECT value FROM cap_hash WHERE key = $1 AND field = $2 AND (expires_at IS NULL OR expires_at > NOW())",
      [key, field]
    );
    return rows[0]?.value ?? null;
  }

  async hmget(key, fields) {
    await this._ensureInit();
    if (!fields?.length) return [];
    const { rows } = await this.pool.query(
      "SELECT field, value FROM cap_hash WHERE key = $1 AND field = ANY($2::text[]) AND (expires_at IS NULL OR expires_at > NOW())",
      [key, fields]
    );
    const map = Object.fromEntries(rows.map(r => [r.field, r.value]));
    return fields.map(f => map[f] ?? null);
  }

  async hgetall(key) {
    await this._ensureInit();
    const { rows } = await this.pool.query(
      "SELECT field, value FROM cap_hash WHERE key = $1 AND (expires_at IS NULL OR expires_at > NOW())",
      [key]
    );
    if (!rows.length) return null;
    return Object.fromEntries(rows.map(r => [r.field, r.value]));
  }

  async hset(key, field, value) {
    await this._ensureInit();
    await this.pool.query(
      `INSERT INTO cap_hash (key, field, value) VALUES ($1, $2, $3)
       ON CONFLICT (key, field) DO UPDATE SET value = $3`,
      [key, field, value]
    );
  }

  async hmset(key, data) {
    await this._ensureInit();
    const entries = Array.isArray(data)
      ? data.reduce((acc, _, i) => { if (i % 2 === 0) acc.push([data[i], data[i + 1]]); return acc; }, [])
      : Object.entries(data);
    for (const [field, value] of entries) {
      await this.hset(key, field, value);
    }
  }

  async hincrby(key, field, incr) {
    await this._ensureInit();
    const { rows } = await this.pool.query(
      `INSERT INTO cap_hash (key, field, value) VALUES ($1, $2, $3)
       ON CONFLICT (key, field) DO UPDATE SET value = (
         CASE WHEN cap_hash.expires_at IS NOT NULL AND cap_hash.expires_at <= NOW()
         THEN $3
         ELSE (cap_hash.value::bigint + $3::bigint)::text
         END
       )
       RETURNING value::bigint`,
      [key, field, String(incr)]
    );
    return Number(rows[0]?.value ?? incr);
  }

  async hdel(key, field) {
    await this._ensureInit();
    await this.pool.query(
      "DELETE FROM cap_hash WHERE key = $1 AND field = $2",
      [key, field]
    );
  }

  async sadd(key, member) {
    await this._ensureInit();
    await this.pool.query(
      "INSERT INTO cap_set (key, member) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [key, member]
    );
  }

  async srem(key, member) {
    await this._ensureInit();
    await this.pool.query(
      "DELETE FROM cap_set WHERE key = $1 AND member = $2",
      [key, member]
    );
  }

  async smembers(key) {
    await this._ensureInit();
    const { rows } = await this.pool.query(
      "SELECT member FROM cap_set WHERE key = $1 ORDER BY member",
      [key]
    );
    return rows.map(r => r.member);
  }

  async scard(key) {
    await this._ensureInit();
    const { rows } = await this.pool.query(
      "SELECT COUNT(*)::int AS count FROM cap_set WHERE key = $1",
      [key]
    );
    return rows[0]?.count ?? 0;
  }

  async sismember(key, member) {
    await this._ensureInit();
    const { rows } = await this.pool.query(
      "SELECT 1 FROM cap_set WHERE key = $1 AND member = $2",
      [key, member]
    );
    return rows.length ? 1 : 0;
  }

  async ping() {
    try {
      await this._ensureInit();
      await this.pool.query("SELECT 1");
      return true;
    } catch { return false; }
  }

  async send(cmd, args) {
    if (cmd === "HSET") {
      const key = args[0];
      const entries = args.slice(1);
      return this.hmset(key, entries);
    }
    const method = cmd.toLowerCase();
    if (this[method]) return this[method](...args);
    throw new Error(`Unknown command: ${cmd}`);
  }
}
