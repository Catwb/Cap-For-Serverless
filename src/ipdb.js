let _token = null;
let _storage = null;

export function initIpdb(storage, cfg) {
  _storage = storage;
  _token = cfg.IPINFO_TOKEN || null;
}

export async function loadSettings() {
  if (!_storage) return;
  try {
    const raw = await _storage.get("settings:ipinfo_token");
    if (raw) _token = raw;
  } catch {}
}

export function isLoaded() {
  return !!_token;
}

export function getStatus() {
  return { mode: _token ? "ipinfo" : null, loaded: !!_token, ipinfoToken: !!_token };
}

export async function saveSettings(body) {
  if (body.ipinfoToken) {
    _token = body.ipinfoToken;
    if (_storage) await _storage.set("settings:ipinfo_token", body.ipinfoToken);
  }
}

export async function clearSettings() {
  _token = null;
  if (_storage) await _storage.del("settings:ipinfo_token");
}

export async function lookup(ip) {
  if (!_token) return { country: null, asn: null, org: null };
  try {
    const res = await fetch(`https://ipinfo.io/${ip}?token=${_token}`);
    if (!res.ok) return { country: null, asn: null, org: null };
    const data = await res.json();
    return {
      country: data.country || null,
      asn: data.org ? `AS${data.org.split(" ")[0]}` : null,
      org: data.org || null,
    };
  } catch {
    return { country: null, asn: null, org: null };
  }
}
