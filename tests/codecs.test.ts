import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

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
} from '../src/core/codecs/bases.js';

import {
  toHex,
  fromHex,
  toBinary,
  fromBinary,
  toDecimal,
  fromDecimal,
  toOctal,
  fromOctal
} from '../src/core/codecs/radix.js';

import {
  rotN,
  rot47,
  xor
} from '../src/core/codecs/ciphers.js';

import {
  decodeJwt
} from '../src/core/codecs/jwt.js';

import {
  computeHash
} from '../src/core/codecs/hashes.js';

describe('Base Encodings', () => {
  const textEncoder = new TextEncoder();
  const textDecoder = new TextDecoder();

  test('Base64 standard and url-safe', () => {
    const input = textEncoder.encode('Hello World! <>?');
    const b64 = encodeBase64(input, false);
    assert.equal(b64, 'SGVsbG8gV29ybGQhIDw+Pw==');
    assert.deepEqual(decodeBase64(b64, false), input);

    const b64url = encodeBase64(input, true);
    assert.equal(b64url, 'SGVsbG8gV29ybGQhIDw-Pw');
    assert.deepEqual(decodeBase64(b64url, true), input);
  });

  test('Base32 RFC 4648', () => {
    const input = textEncoder.encode('CyberChef');
    const b32 = encodeBase32(input);
    assert.equal(b32, 'IN4WEZLSINUGKZQ=');
    assert.deepEqual(decodeBase32(b32), input);

    assert.throws(() => {
      decodeBase32('INVALID-CHAR-!@#');
    }, /Invalid Base32 character/);
  });

  test('Base58 Bitcoin alphabet', () => {
    const input = textEncoder.encode('Hello World');
    const b58 = encodeBase58(input);
    assert.equal(b58, 'JxF12TrwUP45BMd');
    assert.deepEqual(decodeBase58(b58), input);

    // Leading zeros check
    const withZeros = new Uint8Array([0, 0, 72, 105]);
    const b58Zeros = encodeBase58(withZeros);
    assert.ok(b58Zeros.startsWith('11'));
    assert.deepEqual(decodeBase58(b58Zeros), withZeros);
  });

  test('Base85 / Ascii85', () => {
    const input = textEncoder.encode('CyberChef VSCode');
    const b85 = encodeBase85(input);
    assert.deepEqual(decodeBase85(b85), input);
  });

  test('Base91', () => {
    const input = textEncoder.encode('The quick brown fox jumps over the lazy dog');
    const b91 = encodeBase91(input);
    assert.deepEqual(decodeBase91(b91), input);
  });
});

describe('Radix Conversions', () => {
  const textEncoder = new TextEncoder();

  test('Hex conversion with delimiters', () => {
    const input = textEncoder.encode('Chef');
    assert.equal(toHex(input, 'None'), '43686566');
    assert.equal(toHex(input, 'Space'), '43 68 65 66');
    assert.equal(toHex(input, 'Colon'), '43:68:65:66');
    assert.equal(toHex(input, '0x'), '0x43, 0x68, 0x65, 0x66');

    assert.deepEqual(fromHex('43686566'), input);
    assert.deepEqual(fromHex('43 68 65 66'), input);
    assert.deepEqual(fromHex('43:68:65:66'), input);
    assert.deepEqual(fromHex('0x43, 0x68, 0x65, 0x66'), input);
  });

  test('Binary conversion', () => {
    const input = new Uint8Array([5, 255]);
    const bin = toBinary(input, 'Space');
    assert.equal(bin, '00000101 11111111');
    assert.deepEqual(fromBinary(bin), input);
    assert.deepEqual(fromBinary('0000010111111111'), input);
  });

  test('Decimal conversion', () => {
    const input = new Uint8Array([10, 20, 30]);
    const dec = toDecimal(input, 'Space');
    assert.equal(dec, '10 20 30');
    assert.deepEqual(fromDecimal(dec), input);
  });

  test('Octal conversion', () => {
    const input = new Uint8Array([8, 64, 255]);
    const oct = toOctal(input, 'Space');
    assert.equal(oct, '010 100 377');
    assert.deepEqual(fromOctal(oct), input);
  });
});

describe('Ciphers', () => {
  const textEncoder = new TextEncoder();
  const textDecoder = new TextDecoder();

  test('ROT13 / ROT-N', () => {
    const plain = textEncoder.encode('Hello World 123');
    const rot13Res = rotN(plain, 13);
    assert.equal(textDecoder.decode(rot13Res), 'Uryyb Jbeyq 123');
    assert.deepEqual(rotN(rot13Res, 13), plain);

    const rot5Res = rotN(plain, 5);
    assert.deepEqual(rotN(rot5Res, 21), plain); // 5 + 21 = 26
  });

  test('ROT47', () => {
    const plain = textEncoder.encode('Hello World!');
    const rot47Res = rot47(plain);
    assert.equal(textDecoder.decode(rot47Res), 'w6==@ (@C=5P');
    assert.deepEqual(rot47(rot47Res), plain);
  });

  test('XOR with multiple key formats', () => {
    const plain = textEncoder.encode('SecretMessage');
    
    // UTF-8 key
    const xorUtf8 = xor(plain, 'key', 'utf8');
    assert.deepEqual(xor(xorUtf8, 'key', 'utf8'), plain);

    // Hex key
    const xorHex = xor(plain, 'deadbeef', 'hex');
    assert.deepEqual(xor(xorHex, 'deadbeef', 'hex'), plain);
  });
});

describe('JWT Decode', () => {
  test('Inspects valid JWT without error and extracts human dates', () => {
    // Header: {"alg":"HS256","typ":"JWT"}
    // Payload: {"sub":"1234567890","name":"John Doe","iat":1516239022,"exp":1716239022}
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE3MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const inspected = decodeJwt(token);

    assert.equal(inspected.header.alg, 'HS256');
    assert.equal(inspected.header.typ, 'JWT');
    assert.equal(inspected.payload.name, 'John Doe');
    assert.equal(inspected.payload.sub, '1234567890');
    assert.ok(inspected.humanClaims?.exp);
    assert.ok(inspected.humanClaims?.iat);
  });
});

describe('Hashes', () => {
  const textEncoder = new TextEncoder();

  test('MD5 hash', () => {
    const input = textEncoder.encode('CyberChef');
    const hash = computeHash(input, 'md5');
    const hex = Buffer.from(hash).toString('hex');
    assert.equal(hex, '2b58822e7f45550def8fb247c333d80c');
  });

  test('SHA-256 hash', () => {
    const input = textEncoder.encode('CyberChef');
    const hash = computeHash(input, 'sha256');
    const hex = Buffer.from(hash).toString('hex');
    assert.equal(hex, '99ba1625ff362954606ca1e2207a2911185f51159a85c91b4fab2d16f5a78001');
  });
});
