// Base Encodings: Base64, Base32, Base58, Base85, Base91

export function encodeBase64(bytes: Uint8Array, urlSafe = false): string {
  const buf = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return urlSafe ? buf.toString('base64url') : buf.toString('base64');
}

export function decodeBase64(str: string, urlSafe = false): Uint8Array {
  const buf = Buffer.from(str.trim(), urlSafe ? 'base64url' : 'base64');
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

// Base32 (RFC 4648)
const B32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function encodeBase32(bytes: Uint8Array, pad = true): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += B32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
      value &= (1 << bits) - 1;
    }
  }

  if (bits > 0) {
    output += B32_ALPHABET[(value << (5 - bits)) & 31];
  }

  if (pad) {
    while (output.length % 8 !== 0) {
      output += '=';
    }
  }

  return output;
}

export function decodeBase32(str: string): Uint8Array {
  const cleaned = str.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const result: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = B32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      result.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(result);
}

// Base58 (Bitcoin Alphabet)
const B58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function encodeBase58(bytes: Uint8Array): string {
  if (bytes.length === 0) return '';
  const digits = [0];
  for (let i = 0; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }

  let str = '';
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    str += B58_ALPHABET[0];
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    str += B58_ALPHABET[digits[i]];
  }
  return str;
}

export function decodeBase58(str: string): Uint8Array {
  const clean = str.trim();
  if (clean.length === 0) return new Uint8Array(0);

  const bytes = [0];
  for (let i = 0; i < clean.length; i++) {
    const value = B58_ALPHABET.indexOf(clean[i]);
    if (value === -1) {
      throw new Error(`Invalid Base58 character "${clean[i]}"`);
    }
    let carry = value;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }

  const result: number[] = [];
  for (let i = 0; i < clean.length && clean[i] === B58_ALPHABET[0]; i++) {
    result.push(0);
  }
  for (let i = bytes.length - 1; i >= 0; i--) {
    result.push(bytes[i]);
  }
  return new Uint8Array(result);
}

// Base85 / Ascii85 (Adobe variant)
export function encodeBase85(bytes: Uint8Array): string {
  let output = '';
  const len = bytes.length;
  let i = 0;

  while (i < len) {
    const chunk = [0, 0, 0, 0];
    const chunkLen = Math.min(4, len - i);
    for (let j = 0; j < chunkLen; j++) {
      chunk[j] = bytes[i + j];
    }
    i += chunkLen;

    const tuple = ((chunk[0] << 24) >>> 0) + (chunk[1] << 16) + (chunk[2] << 8) + chunk[3];
    if (chunkLen === 4 && tuple === 0) {
      output += 'z';
      continue;
    }

    const encoded = [
      Math.floor(tuple / 52200625) % 85,
      Math.floor(tuple / 614125) % 85,
      Math.floor(tuple / 7225) % 85,
      Math.floor(tuple / 85) % 85,
      tuple % 85
    ];

    for (let j = 0; j < chunkLen + 1; j++) {
      output += String.fromCharCode(encoded[j] + 33);
    }
  }

  return output;
}

export function decodeBase85(str: string): Uint8Array {
  const clean = str.replace(/\s+/g, '').replace(/^<~|~>$/g, '');
  const bytes: number[] = [];
  let i = 0;

  while (i < clean.length) {
    if (clean[i] === 'z') {
      bytes.push(0, 0, 0, 0);
      i++;
      continue;
    }

    const chunkLen = Math.min(5, clean.length - i);
    let tuple = 0;
    const pows = [52200625, 614125, 7225, 85, 1];

    for (let j = 0; j < 5; j++) {
      const code = j < chunkLen ? clean.charCodeAt(i + j) - 33 : 84;
      tuple += code * pows[j];
    }
    i += chunkLen;

    const b = [
      (tuple >>> 24) & 0xff,
      (tuple >>> 16) & 0xff,
      (tuple >>> 8) & 0xff,
      tuple & 0xff
    ];

    for (let j = 0; j < chunkLen - 1; j++) {
      bytes.push(b[j]);
    }
  }

  return new Uint8Array(bytes);
}

// Base91
const B91_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_`{|}~"';

export function encodeBase91(bytes: Uint8Array): string {
  let queue = 0;
  let nbits = 0;
  let output = '';

  for (let i = 0; i < bytes.length; i++) {
    queue |= (bytes[i] & 255) << nbits;
    nbits += 8;
    if (nbits > 13) {
      let val = queue & 8191;
      if (val > 88) {
        queue >>= 13;
        nbits -= 13;
      } else {
        val = queue & 16383;
        queue >>= 14;
        nbits -= 14;
      }
      output += B91_ALPHABET[val % 91] + B91_ALPHABET[Math.floor(val / 91)];
    }
  }

  if (nbits > 0) {
    output += B91_ALPHABET[queue % 91];
    if (nbits > 7 || queue > 90) {
      output += B91_ALPHABET[Math.floor(queue / 91)];
    }
  }

  return output;
}

export function decodeBase91(str: string): Uint8Array {
  const result: number[] = [];
  let queue = 0;
  let nbits = 0;
  let val = -1;

  for (let i = 0; i < str.length; i++) {
    const c = B91_ALPHABET.indexOf(str[i]);
    if (c === -1) continue;

    if (val === -1) {
      val = c;
    } else {
      val += c * 91;
      queue |= val << nbits;
      nbits += (val & 8191) > 88 ? 13 : 14;
      while (nbits >= 8) {
        result.push(queue & 255);
        queue >>= 8;
        nbits -= 8;
      }
      val = -1;
    }
  }

  if (val !== -1) {
    result.push((queue | (val << nbits)) & 255);
  }

  return new Uint8Array(result);
}
