export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const UINT256_MAX = (1n << 256n) - 1n;

export function normalizeAddress(value) {
  if (!value || typeof value !== "string") return null;
  const match = value.match(/0x[a-fA-F0-9]{40}/);
  return match ? match[0].toLowerCase() : null;
}

export function extractAddresses(text) {
  if (!text) return [];
  return [...new Set((text.match(/0x[a-fA-F0-9]{40}/g) || []).map((addr) => addr.toLowerCase()))];
}

export function normalizeHex(value) {
  if (!value || value === "0x") return "0x";
  if (typeof value !== "string" || !value.startsWith("0x")) {
    throw new Error("Hex value must start with 0x");
  }
  if (!/^0x[0-9a-fA-F]*$/.test(value)) {
    throw new Error("Hex value must contain only hexadecimal characters");
  }
  if ((value.length - 2) % 2 !== 0) {
    throw new Error("Hex value must contain complete bytes");
  }
  return value.toLowerCase();
}

export function hexToBigInt(value) {
  if (!value || value === "0x") return 0n;
  return BigInt(value);
}

export function wordAt(data, index) {
  const start = 10 + index * 64;
  const word = data.slice(start, start + 64);
  if (word.length !== 64) {
    throw new Error(`Missing ABI word at index ${index}`);
  }
  return word;
}

export function addressFromWord(word) {
  return `0x${word.slice(24)}`.toLowerCase();
}

export function uintFromWord(word) {
  return BigInt(`0x${word}`);
}

export function bigIntToString(value) {
  return value.toString();
}

export function isZeroValue(value) {
  return hexToBigInt(value || "0x0") === 0n;
}

export function includesAddress(list = [], address) {
  const target = normalizeAddress(address);
  if (!target) return false;
  return list.map((addr) => normalizeAddress(addr)).filter(Boolean).includes(target);
}

export function resolveAddressLabel(address, addressBook = {}) {
  const normalized = normalizeAddress(address);
  if (!normalized) return address || "unknown";
  for (const [label, value] of Object.entries(addressBook)) {
    if (normalizeAddress(value) === normalized) return label;
  }
  return normalized;
}
