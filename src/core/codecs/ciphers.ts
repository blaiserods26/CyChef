// Ciphers: ROT-N, ROT47, XOR

export type XorKeyFormat = 'utf8' | 'hex' | 'base64' | 'latin1';

export function rotN(bytes: Uint8Array, shift: number): Uint8Array {
  const normShift = ((shift % 26) + 26) % 26;
  const result = new Uint8Array(bytes.length);

  for (let i = 0; i < bytes.length; i++) {
    const c = bytes[i];
    if (c >= 65 && c <= 90) {
      // Uppercase A-Z
      result[i] = ((c - 65 + normShift) % 26) + 65;
    } else if (c >= 97 && c <= 122) {
      // Lowercase a-z
      result[i] = ((c - 97 + normShift) % 26) + 97;
    } else {
      result[i] = c;
    }
  }

  return result;
}

export function rot47(bytes: Uint8Array): Uint8Array {
  const result = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    const c = bytes[i];
    // Printable ASCII: 33 ('!') to 126 ('~')
    if (c >= 33 && c <= 126) {
      result[i] = 33 + ((c - 33 + 47) % 94);
    } else {
      result[i] = c;
    }
  }
  return result;
}

export function parseXorKey(keyStr: string, format: XorKeyFormat): Uint8Array {
  switch (format) {
    case 'hex': {
      const clean = keyStr.replace(/[\s,:]+/g, '');
      const buf = Buffer.from(clean, 'hex');
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    }
    case 'base64': {
      const buf = Buffer.from(keyStr.trim(), 'base64');
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    }
    case 'latin1': {
      const buf = Buffer.from(keyStr, 'latin1');
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    }
    case 'utf8':
    default:
      return new TextEncoder().encode(keyStr);
  }
}

export function xor(bytes: Uint8Array, keyStr: string, keyFormat: XorKeyFormat = 'utf8'): Uint8Array {
  const key = parseXorKey(keyStr, keyFormat);
  if (key.length === 0) {
    return new Uint8Array(bytes);
  }

  const result = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    result[i] = bytes[i] ^ key[i % key.length];
  }
  return result;
}
