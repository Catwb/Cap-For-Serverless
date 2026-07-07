export class StorageAdapter {
  async get(key) { throw new Error("not implemented"); }
  async set(key, value, ttl) { throw new Error("not implemented"); }
  async del(key) { throw new Error("not implemented"); }
  async setnx(key, value, ttl) { throw new Error("not implemented"); }
  async getdel(key) { throw new Error("not implemented"); }
  async incr(key) { throw new Error("not implemented"); }
  async expire(key, ttl) { throw new Error("not implemented"); }
  async exists(key) { throw new Error("not implemented"); }
  async hget(key, field) { throw new Error("not implemented"); }
  async hmget(key, fields) { throw new Error("not implemented"); }
  async hgetall(key) { throw new Error("not implemented"); }
  async hset(key, field, value) { throw new Error("not implemented"); }
  async hmset(key, data) { throw new Error("not implemented"); }
  async hincrby(key, field, incr) { throw new Error("not implemented"); }
  async hdel(key, field) { throw new Error("not implemented"); }
  async sadd(key, member) { throw new Error("not implemented"); }
  async srem(key, member) { throw new Error("not implemented"); }
  async smembers(key) { throw new Error("not implemented"); }
  async scard(key) { throw new Error("not implemented"); }
  async sismember(key, member) { throw new Error("not implemented"); }
  async ping() { throw new Error("not implemented"); }
  async send(cmd, args) { throw new Error("not implemented"); }
}
