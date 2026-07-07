import bcrypt from "bcryptjs";

function bytesToHex(bytes) {
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}

function bytesToBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function bytesToBase64url(bytes) {
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  return bytes;
}

function base64ToBytes(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function randomHex(bytesCount) {
  const bytes = crypto.getRandomValues(new Uint8Array(bytesCount));
  return bytesToHex(bytes);
}

export function randomBase64url(bytesCount) {
  const bytes = crypto.getRandomValues(new Uint8Array(bytesCount));
  return bytesToBase64url(bytes);
}

export async function sha256Hex(str) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return bytesToHex(new Uint8Array(bytes));
}

export function timingSafeEqual(a, b) {
  const bufA = typeof a === "string" ? new TextEncoder().encode(a) : (a instanceof Uint8Array ? a : new Uint8Array(a));
  const bufB = typeof b === "string" ? new TextEncoder().encode(b) : (b instanceof Uint8Array ? b : new Uint8Array(b));
  if (bufA.length !== bufB.length) return false;
  let result = 0;
  for (let i = 0; i < bufA.length; i++) result |= bufA[i] ^ bufB[i];
  return result === 0;
}

export function uuidv4() {
  return crypto.randomUUID();
}

export function randomId(len) {
  return randomHex(len);
}

export function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function generateSecretKey() {
  const raw = bytesToBase64(crypto.getRandomValues(new Uint8Array(32))).replace(/[+/=]/g, "");
  return `sk-${raw}`;
}

export function generateJwtSecret() {
  return bytesToBase64url(crypto.getRandomValues(new Uint8Array(32)));
}

export const TOKEN_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

export function generateSessionToken() {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(30)));
}
