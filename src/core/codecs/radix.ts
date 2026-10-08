// Radix Conversions: Hex, Binary, Decimal, Octal

export type HexDelimiter = 'None' | 'Space' | 'Colon' | '0x';
export type RadixDelimiter = 'None' | 'Space' | 'Comma';

export function toHex(bytes: Uint8Array, delimiter: HexDelimiter = 'None'): string {
  const buf = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const raw = buf.toString('hex');

  switch (delimiter) {
    case 'Space':
      return raw.replace(/(.{2})/g, '$1 ').trim();
    case 'Colon':
      return raw.replace(/(.{2})/g, '$1:').slice(0, -1);
    case '0x':
      return Array.from(bytes, b => '0x' + b.toString(16).padStart(2, '0')).join(', ');
    default:
      return raw;
  }
}

export function fromHex(str: string): Uint8Array {
  // Strip common prefixes and delimiters: 0x, commas, spaces, colons
  const clean = str
    .replace(/0x/gi, '')
    .replace(/[\s,:]+/g, '');

  if (clean.length % 2 !== 0) {
    throw new Error('Hex string must have an even length');
  }

  if (clean.length > 0 && !/^[0-9a-fA-F]+$/.test(clean)) {
    throw new Error('Invalid hexadecimal characters detected');
  }

  const buf = Buffer.from(clean, 'hex');
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

export function toBinary(bytes: Uint8Array, delimiter: RadixDelimiter = 'Space'): string {
  const parts = Array.from(bytes, b => b.toString(2).padStart(8, '0'));
  switch (delimiter) {
    case 'Space':
      return parts.join(' ');
    case 'Comma':
      return parts.join(', ');
    default:
      return parts.join('');
  }
}

export function fromBinary(str: string): Uint8Array {
  const clean = str.replace(/[\s,]+/g, '');
  if (clean.length % 8 !== 0) {
    // If not divisible by 8, pad leading zeros or handle gracefully
    const padded = clean.padStart(Math.ceil(clean.length / 8) * 8, '0');
    return fromBinary(padded);
  }

  const bytes = new Uint8Array(clean.length / 8);
  for (let i = 0; i < clean.length; i += 8) {
    bytes[i / 8] = parseInt(clean.slice(i, i + 8), 2);
  }
  return bytes;
}

export function toDecimal(bytes: Uint8Array, delimiter: RadixDelimiter = 'Space'): string {
  const parts = Array.from(bytes, b => b.toString(10));
  switch (delimiter) {
    case 'Space':
      return parts.join(' ');
    case 'Comma':
      return parts.join(', ');
    default:
      return parts.join(' ');
  }
}

export function fromDecimal(str: string): Uint8Array {
  const parts = str.trim().split(/[\s,]+/).filter(Boolean);
  const bytes = new Uint8Array(parts.length);
  for (let i = 0; i < parts.length; i++) {
    const val = parseInt(parts[i], 10);
    if (isNaN(val) || val < 0 || val > 255) {
      throw new Error(`Invalid byte decimal value: "${parts[i]}"`);
    }
    bytes[i] = val;
  }
  return bytes;
}

export function toOctal(bytes: Uint8Array, delimiter: RadixDelimiter = 'Space'): string {
  const parts = Array.from(bytes, b => b.toString(8).padStart(3, '0'));
  switch (delimiter) {
    case 'Space':
      return parts.join(' ');
    case 'Comma':
      return parts.join(', ');
    default:
      return parts.join('');
  }
}

export function fromOctal(str: string): Uint8Array {
  const parts = str.trim().split(/[\s,]+/).filter(Boolean);
  if (parts.length === 1 && parts[0].length % 3 === 0 && !str.includes(' ')) {
    // Continuous 3-digit octal
    const raw = parts[0];
    const bytes = new Uint8Array(raw.length / 3);
    for (let i = 0; i < raw.length; i += 3) {
      bytes[i / 3] = parseInt(raw.slice(i, i + 3), 8);
    }
    return bytes;
  }

  const bytes = new Uint8Array(parts.length);
  for (let i = 0; i < parts.length; i++) {
    const val = parseInt(parts[i], 8);
    if (isNaN(val) || val < 0 || val > 255) {
      throw new Error(`Invalid byte octal value: "${parts[i]}"`);
    }
    bytes[i] = val;
  }
  return bytes;
}
