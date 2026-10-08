// Operation Registry with all built-in Operations
import { Operation, OperationCategory } from './types.js';
import {
  encodeBase64,
  decodeBase64,
  encodeBase32,
  decodeBase32,
  encodeBase58,
  decodeBase58,
  encodeBase85,
  decodeBase85,
  encodeBase91,
  decodeBase91
} from './codecs/bases.js';
import {
  toHex,
  fromHex,
  toBinary,
  fromBinary,
  toDecimal,
  fromDecimal,
  toOctal,
  fromOctal,
  HexDelimiter,
  RadixDelimiter
} from './codecs/radix.js';
import { rotN, rot47, xor, XorKeyFormat } from './codecs/ciphers.js';
import { decodeJwt, formatJwtInspection } from './codecs/jwt.js';
import { computeHash, HashAlgorithm } from './codecs/hashes.js';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export class OperationRegistry {
  private static instance: OperationRegistry;
  private readonly operations = new Map<string, Operation>();

  private constructor() {
    this.registerBuiltIns();
  }

  static getInstance(): OperationRegistry {
    if (!OperationRegistry.instance) {
      OperationRegistry.instance = new OperationRegistry();
    }
    return OperationRegistry.instance;
  }

  register(op: Operation): void {
    if (this.operations.has(op.id)) {
      throw new Error(`Operation "${op.id}" is already registered`);
    }
    this.operations.set(op.id, op);
  }

  get(id: string): Operation | undefined {
    return this.operations.get(id);
  }

  getAll(): Operation[] {
    return Array.from(this.operations.values());
  }

  getByCategory(category: OperationCategory): Operation[] {
    return this.getAll().filter(op => op.category === category);
  }

  search(query: string): Operation[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.getAll();
    return this.getAll().filter(op =>
      op.id.toLowerCase().includes(q) ||
      op.name.toLowerCase().includes(q) ||
      op.description.toLowerCase().includes(q) ||
      op.keywords.some(k => k.toLowerCase().includes(q))
    );
  }

  private registerBuiltIns(): void {
    // --- BASES ---
    this.register({
      id: 'to-base64',
      name: 'To Base64',
      description: 'Encodes bytes or text into Base64 format',
      category: 'Bases',
      keywords: ['base64', 'b64', 'encode'],
      args: [
        {
          name: 'urlSafe',
          label: 'URL Safe (- and _)',
          type: 'boolean',
          defaultValue: false
        }
      ],
      run: (input, args) => {
        const res = encodeBase64(input, Boolean(args?.urlSafe));
        return textEncoder.encode(res);
      }
    });

    this.register({
      id: 'from-base64',
      name: 'From Base64',
      description: 'Decodes Base64 or URL-safe Base64 into original bytes',
      category: 'Bases',
      keywords: ['base64', 'b64', 'decode'],
      args: [
        {
          name: 'urlSafe',
          label: 'URL Safe',
          type: 'boolean',
          defaultValue: false
        }
      ],
      run: (input, args) => {
        const str = textDecoder.decode(input);
        return decodeBase64(str, Boolean(args?.urlSafe));
      }
    });

    this.register({
      id: 'to-base32',
      name: 'To Base32',
      description: 'Encodes data to RFC 4648 Base32',
      category: 'Bases',
      keywords: ['base32', 'b32', 'encode'],
      args: [
        {
          name: 'pad',
          label: 'Add Padding (=)',
          type: 'boolean',
          defaultValue: true
        }
      ],
      run: (input, args) => {
        const res = encodeBase32(input, args?.pad ?? true);
        return textEncoder.encode(res);
      }
    });

    this.register({
      id: 'from-base32',
      name: 'From Base32',
      description: 'Decodes RFC 4648 Base32 back to bytes',
      category: 'Bases',
      keywords: ['base32', 'b32', 'decode'],
      run: (input) => {
        const str = textDecoder.decode(input);
        return decodeBase32(str);
      }
    });

    this.register({
      id: 'to-base58',
      name: 'To Base58',
      description: 'Encodes data using Bitcoin Base58 alphabet',
      category: 'Bases',
      keywords: ['base58', 'b58', 'bitcoin', 'crypto'],
      run: (input) => {
        const res = encodeBase58(input);
        return textEncoder.encode(res);
      }
    });

    this.register({
      id: 'from-base58',
      name: 'From Base58',
      description: 'Decodes Bitcoin Base58 back to bytes',
      category: 'Bases',
      keywords: ['base58', 'b58', 'decode'],
      run: (input) => {
        const str = textDecoder.decode(input);
        return decodeBase58(str);
      }
    });

    this.register({
      id: 'to-base85',
      name: 'To Base85 (Ascii85)',
      description: 'Encodes data to Ascii85 / Base85 format',
      category: 'Bases',
      keywords: ['base85', 'b85', 'ascii85'],
      run: (input) => {
        const res = encodeBase85(input);
        return textEncoder.encode(res);
      }
    });

    this.register({
      id: 'from-base85',
      name: 'From Base85 (Ascii85)',
      description: 'Decodes Ascii85 / Base85 back to bytes',
      category: 'Bases',
      keywords: ['base85', 'b85', 'ascii85', 'decode'],
      run: (input) => {
        const str = textDecoder.decode(input);
        return decodeBase85(str);
      }
    });

    this.register({
      id: 'to-base91',
      name: 'To Base91',
      description: 'Encodes data into BasE91 printable ASCII representation',
      category: 'Bases',
      keywords: ['base91', 'b91'],
      run: (input) => {
        const res = encodeBase91(input);
        return textEncoder.encode(res);
      }
    });

    this.register({
      id: 'from-base91',
      name: 'From Base91',
      description: 'Decodes BasE91 back to original bytes',
      category: 'Bases',
      keywords: ['base91', 'b91', 'decode'],
      run: (input) => {
        const str = textDecoder.decode(input);
        return decodeBase91(str);
      }
    });

    // --- RADIX ---
    this.register({
      id: 'to-hex',
      name: 'To Hex',
      description: 'Converts bytes to hexadecimal string with optional delimiter',
      category: 'Radix',
      keywords: ['hex', 'hexadecimal', 'bytes'],
      args: [
        {
          name: 'delimiter',
          label: 'Delimiter',
          type: 'choice',
          defaultValue: 'None',
          options: [
            { label: 'None', value: 'None' },
            { label: 'Space', value: 'Space' },
            { label: 'Colon', value: 'Colon' },
            { label: '0x with comma', value: '0x' }
          ]
        }
      ],
      run: (input, args) => {
        const delim = (args?.delimiter as HexDelimiter) || 'None';
        const res = toHex(input, delim);
        return textEncoder.encode(res);
      }
    });

    this.register({
      id: 'from-hex',
      name: 'From Hex',
      description: 'Converts hexadecimal string (with or without 0x/delimiters) to bytes',
      category: 'Radix',
      keywords: ['hex', 'from hex', 'unhex', 'decode'],
      run: (input) => {
        const str = textDecoder.decode(input);
        return fromHex(str);
      }
    });

    this.register({
      id: 'to-binary',
      name: 'To Binary',
      description: 'Converts bytes to 8-bit binary bit representation',
      category: 'Radix',
      keywords: ['binary', 'bin', 'bits', '01'],
      args: [
        {
          name: 'delimiter',
          label: 'Delimiter',
          type: 'choice',
          defaultValue: 'Space',
          options: [
            { label: 'Space', value: 'Space' },
            { label: 'Comma', value: 'Comma' },
            { label: 'None', value: 'None' }
          ]
        }
      ],
      run: (input, args) => {
        const delim = (args?.delimiter as RadixDelimiter) || 'Space';
        const res = toBinary(input, delim);
        return textEncoder.encode(res);
      }
    });

    this.register({
      id: 'from-binary',
      name: 'From Binary',
      description: 'Converts 8-bit binary strings (0s and 1s) back to bytes',
      category: 'Radix',
      keywords: ['binary', 'bin', 'bits', 'decode'],
      run: (input) => {
        const str = textDecoder.decode(input);
        return fromBinary(str);
      }
    });

    this.register({
      id: 'to-decimal',
      name: 'To Decimal',
      description: 'Converts each byte into decimal number (0-255)',
      category: 'Radix',
      keywords: ['decimal', 'dec', 'numbers'],
      args: [
        {
          name: 'delimiter',
          label: 'Delimiter',
          type: 'choice',
          defaultValue: 'Space',
          options: [
            { label: 'Space', value: 'Space' },
            { label: 'Comma', value: 'Comma' }
          ]
        }
      ],
      run: (input, args) => {
        const delim = (args?.delimiter as RadixDelimiter) || 'Space';
        const res = toDecimal(input, delim);
        return textEncoder.encode(res);
      }
    });

    this.register({
      id: 'from-decimal',
      name: 'From Decimal',
      description: 'Converts space/comma separated decimal numbers (0-255) back to bytes',
      category: 'Radix',
      keywords: ['decimal', 'dec', 'numbers', 'decode'],
      run: (input) => {
        const str = textDecoder.decode(input);
        return fromDecimal(str);
      }
    });

    this.register({
      id: 'to-octal',
      name: 'To Octal',
      description: 'Converts bytes to octal representation',
      category: 'Radix',
      keywords: ['octal', 'oct', 'radix 8'],
      args: [
        {
          name: 'delimiter',
          label: 'Delimiter',
          type: 'choice',
          defaultValue: 'Space',
          options: [
            { label: 'Space', value: 'Space' },
            { label: 'Comma', value: 'Comma' },
            { label: 'None', value: 'None' }
          ]
        }
      ],
      run: (input, args) => {
        const delim = (args?.delimiter as RadixDelimiter) || 'Space';
        const res = toOctal(input, delim);
        return textEncoder.encode(res);
      }
    });

    this.register({
      id: 'from-octal',
      name: 'From Octal',
      description: 'Converts octal numbers back to bytes',
      category: 'Radix',
      keywords: ['octal', 'oct', 'decode'],
      run: (input) => {
        const str = textDecoder.decode(input);
        return fromOctal(str);
      }
    });

    // --- CIPHERS ---
    this.register({
      id: 'rot13',
      name: 'ROT13',
      description: 'Rotates ASCII letters by 13 positions (symmetric)',
      category: 'Ciphers',
      keywords: ['rot13', 'caesar', 'rot', 'cipher'],
      run: (input) => rotN(input, 13)
    });

    this.register({
      id: 'rot-n',
      name: 'ROT-N',
      description: 'Caesar cipher shift by N positions',
      category: 'Ciphers',
      keywords: ['rot', 'caesar', 'shift', 'cipher'],
      args: [
        {
          name: 'amount',
          label: 'Shift Amount (1-25)',
          type: 'number',
          defaultValue: 13,
          min: 1,
          max: 25,
          step: 1
        }
      ],
      run: (input, args) => {
        const amount = Number(args?.amount ?? 13);
        return rotN(input, amount);
      }
    });

    this.register({
      id: 'rot47',
      name: 'ROT47',
      description: 'Rotates ASCII printable characters (33-126) by 47 positions',
      category: 'Ciphers',
      keywords: ['rot47', 'rot', 'cipher'],
      run: (input) => rot47(input)
    });

    this.register({
      id: 'xor',
      name: 'XOR',
      description: 'Bitwise repeating-key XOR operation (symmetric)',
      category: 'Ciphers',
      keywords: ['xor', 'bitwise', 'cipher', 'key'],
      args: [
        {
          name: 'key',
          label: 'Key',
          type: 'text',
          defaultValue: ''
        },
        {
          name: 'format',
          label: 'Key Format',
          type: 'choice',
          defaultValue: 'utf8',
          options: [
            { label: 'UTF-8', value: 'utf8' },
            { label: 'Hex', value: 'hex' },
            { label: 'Base64', value: 'base64' },
            { label: 'Latin1', value: 'latin1' }
          ]
        }
      ],
      run: (input, args) => {
        const key = String(args?.key ?? '');
        const format = (args?.format as XorKeyFormat) || 'utf8';
        return xor(input, key, format);
      }
    });

    // --- WEB & TOKENS ---
    this.register({
      id: 'jwt-decode',
      name: 'JWT Decode',
      description: 'Inspects and formats JSON Web Token header, claims, and ISO timestamps',
      category: 'Web & Tokens',
      keywords: ['jwt', 'json web token', 'bearer', 'auth', 'token'],
      run: (input) => {
        const token = textDecoder.decode(input).trim();
        const inspected = decodeJwt(token);
        const formatted = formatJwtInspection(inspected);
        return textEncoder.encode(formatted);
      }
    });

    this.register({
      id: 'url-encode',
      name: 'URL Encode',
      description: 'Percent-encodes special characters for URLs (encodeURIComponent)',
      category: 'Web & Tokens',
      keywords: ['url', 'uri', 'percent encode', 'web'],
      run: (input) => {
        const str = textDecoder.decode(input);
        const encoded = encodeURIComponent(str);
        return textEncoder.encode(encoded);
      }
    });

    this.register({
      id: 'url-decode',
      name: 'URL Decode',
      description: 'Decodes percent-encoded characters from URLs (decodeURIComponent)',
      category: 'Web & Tokens',
      keywords: ['url', 'uri', 'percent decode', 'web'],
      run: (input) => {
        const str = textDecoder.decode(input);
        const decoded = decodeURIComponent(str);
        return textEncoder.encode(decoded);
      }
    });

    // --- HASHING ---
    const registerHash = (id: string, name: string, alg: HashAlgorithm) => {
      this.register({
        id,
        name,
        description: `Computes cryptographic ${name} checksum`,
        category: 'Hashing',
        keywords: [name.toLowerCase(), 'hash', 'digest', 'checksum'],
        args: [
          {
            name: 'format',
            label: 'Output Format',
            type: 'choice',
            defaultValue: 'hex',
            options: [
              { label: 'Hex', value: 'hex' },
              { label: 'Base64', value: 'base64' }
            ]
          }
        ],
        run: (input, args) => {
          const digest = computeHash(input, alg);
          if (args?.format === 'base64') {
            return textEncoder.encode(Buffer.from(digest).toString('base64'));
          }
          return textEncoder.encode(Buffer.from(digest).toString('hex'));
        }
      });
    };

    registerHash('md5', 'MD5', 'md5');
    registerHash('sha1', 'SHA-1', 'sha1');
    registerHash('sha256', 'SHA-256', 'sha256');
    registerHash('sha384', 'SHA-384', 'sha384');
    registerHash('sha512', 'SHA-512', 'sha512');
  }
}
