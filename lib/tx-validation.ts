const HEX64 = /^[a-f0-9]{64}$/i
const EVM_HASH = /^0x[a-f0-9]{64}$/i
const BASE58_64 = /^[1-9A-HJ-NP-Za-km-z]{64}$/

export function normalizeTransactionHash(value: string) {
  const trimmed = value.trim()
  return HEX64.test(trimmed) || EVM_HASH.test(trimmed) ? trimmed.toLowerCase() : trimmed
}

export function isPlausibleTransactionHash(value: string) {
  const trimmed = value.trim()
  return HEX64.test(trimmed) || EVM_HASH.test(trimmed) || BASE58_64.test(trimmed)
}
