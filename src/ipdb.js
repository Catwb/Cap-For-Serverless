let _loaded = false;
let _token = null;

export function initIpdb(storage) {
  _token = process.env.IPINFO_TOKEN;
  if (!_token) {
    _loaded = false;
    return;
  }
  _loaded = true;
}

export function isLoaded() {
  return _loaded && !!_token;
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
