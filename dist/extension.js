"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode3 = __toESM(require("vscode"));

// src/core/codecs/bases.ts
function encodeBase64(bytes, urlSafe = false) {
  const buf = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return urlSafe ? buf.toString("base64url") : buf.toString("base64");
}
function decodeBase64(str, urlSafe = false) {
  const buf = Buffer.from(str.trim(), urlSafe ? "base64url" : "base64");
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}
var B32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function encodeBase32(bytes, pad = true) {
  let bits = 0;
  let value = 0;
  let output = "";
  for (let i = 0; i < bytes.length; i++) {
    value = value << 8 | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += B32_ALPHABET[value >>> bits - 5 & 31];
      bits -= 5;
      value &= (1 << bits) - 1;
    }
  }
  if (bits > 0) {
    output += B32_ALPHABET[value << 5 - bits & 31];
  }
  if (pad) {
    while (output.length % 8 !== 0) {
      output += "=";
    }
  }
  return output;
}
function decodeBase32(str) {
  const cleaned = str.toUpperCase().replace(/=+$/, "").replace(/\s+/g, "");
  let bits = 0;
  let value = 0;
  const result = [];
  for (let i = 0; i < cleaned.length; i++) {
    const idx = B32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1)
      continue;
    value = value << 5 | idx;
    bits += 5;
    if (bits >= 8) {
      result.push(value >>> bits - 8 & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(result);
}
var B58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function encodeBase58(bytes) {
  if (bytes.length === 0)
    return "";
  const digits = [0];
  for (let i = 0; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = carry / 58 | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = carry / 58 | 0;
    }
  }
  let str = "";
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    str += B58_ALPHABET[0];
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    str += B58_ALPHABET[digits[i]];
  }
  return str;
}
function decodeBase58(str) {
  const clean = str.trim();
  if (clean.length === 0)
    return new Uint8Array(0);
  const bytes = [0];
  for (let i = 0; i < clean.length; i++) {
    const value = B58_ALPHABET.indexOf(clean[i]);
    if (value === -1) {
      throw new Error(`Invalid Base58 character "${clean[i]}"`);
    }
    let carry = value;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 255;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 255);
      carry >>= 8;
    }
  }
  const result = [];
  for (let i = 0; i < clean.length && clean[i] === B58_ALPHABET[0]; i++) {
    result.push(0);
  }
  for (let i = bytes.length - 1; i >= 0; i--) {
    result.push(bytes[i]);
  }
  return new Uint8Array(result);
}
function encodeBase85(bytes) {
  let output = "";
  const len = bytes.length;
  let i = 0;
  while (i < len) {
    const chunk = [0, 0, 0, 0];
    const chunkLen = Math.min(4, len - i);
    for (let j = 0; j < chunkLen; j++) {
      chunk[j] = bytes[i + j];
    }
    i += chunkLen;
    const tuple = (chunk[0] << 24 >>> 0) + (chunk[1] << 16) + (chunk[2] << 8) + chunk[3];
    if (chunkLen === 4 && tuple === 0) {
      output += "z";
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
function decodeBase85(str) {
  const clean = str.replace(/\s+/g, "").replace(/^<~|~>$/g, "");
  const bytes = [];
  let i = 0;
  while (i < clean.length) {
    if (clean[i] === "z") {
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
      tuple >>> 24 & 255,
      tuple >>> 16 & 255,
      tuple >>> 8 & 255,
      tuple & 255
    ];
    for (let j = 0; j < chunkLen - 1; j++) {
      bytes.push(b[j]);
    }
  }
  return new Uint8Array(bytes);
}
var B91_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_`{|}~"';
function encodeBase91(bytes) {
  let queue = 0;
  let nbits = 0;
  let output = "";
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
function decodeBase91(str) {
  const result = [];
  let queue = 0;
  let nbits = 0;
  let val = -1;
  for (let i = 0; i < str.length; i++) {
    const c = B91_ALPHABET.indexOf(str[i]);
    if (c === -1)
      continue;
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
    result.push((queue | val << nbits) & 255);
  }
  return new Uint8Array(result);
}

// src/core/codecs/radix.ts
function toHex(bytes, delimiter = "None") {
  const buf = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const raw = buf.toString("hex");
  switch (delimiter) {
    case "Space":
      return raw.replace(/(.{2})/g, "$1 ").trim();
    case "Colon":
      return raw.replace(/(.{2})/g, "$1:").slice(0, -1);
    case "0x":
      return Array.from(bytes, (b) => "0x" + b.toString(16).padStart(2, "0")).join(", ");
    default:
      return raw;
  }
}
function fromHex(str) {
  const clean = str.replace(/0x/gi, "").replace(/[\s,:]+/g, "");
  if (clean.length % 2 !== 0) {
    throw new Error("Hex string must have an even length");
  }
  if (clean.length > 0 && !/^[0-9a-fA-F]+$/.test(clean)) {
    throw new Error("Invalid hexadecimal characters detected");
  }
  const buf = Buffer.from(clean, "hex");
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}
function toBinary(bytes, delimiter = "Space") {
  const parts = Array.from(bytes, (b) => b.toString(2).padStart(8, "0"));
  switch (delimiter) {
    case "Space":
      return parts.join(" ");
    case "Comma":
      return parts.join(", ");
    default:
      return parts.join("");
  }
}
function fromBinary(str) {
  const clean = str.replace(/[\s,]+/g, "");
  if (clean.length % 8 !== 0) {
    const padded = clean.padStart(Math.ceil(clean.length / 8) * 8, "0");
    return fromBinary(padded);
  }
  const bytes = new Uint8Array(clean.length / 8);
  for (let i = 0; i < clean.length; i += 8) {
    bytes[i / 8] = parseInt(clean.slice(i, i + 8), 2);
  }
  return bytes;
}
function toDecimal(bytes, delimiter = "Space") {
  const parts = Array.from(bytes, (b) => b.toString(10));
  switch (delimiter) {
    case "Space":
      return parts.join(" ");
    case "Comma":
      return parts.join(", ");
    default:
      return parts.join(" ");
  }
}
function fromDecimal(str) {
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
function toOctal(bytes, delimiter = "Space") {
  const parts = Array.from(bytes, (b) => b.toString(8).padStart(3, "0"));
  switch (delimiter) {
    case "Space":
      return parts.join(" ");
    case "Comma":
      return parts.join(", ");
    default:
      return parts.join("");
  }
}
function fromOctal(str) {
  const parts = str.trim().split(/[\s,]+/).filter(Boolean);
  if (parts.length === 1 && parts[0].length % 3 === 0 && !str.includes(" ")) {
    const raw = parts[0];
    const bytes2 = new Uint8Array(raw.length / 3);
    for (let i = 0; i < raw.length; i += 3) {
      bytes2[i / 3] = parseInt(raw.slice(i, i + 3), 8);
    }
    return bytes2;
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

// src/core/codecs/ciphers.ts
function rotN(bytes, shift) {
  const normShift = (shift % 26 + 26) % 26;
  const result = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    const c = bytes[i];
    if (c >= 65 && c <= 90) {
      result[i] = (c - 65 + normShift) % 26 + 65;
    } else if (c >= 97 && c <= 122) {
      result[i] = (c - 97 + normShift) % 26 + 97;
    } else {
      result[i] = c;
    }
  }
  return result;
}
function rot47(bytes) {
  const result = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    const c = bytes[i];
    if (c >= 33 && c <= 126) {
      result[i] = 33 + (c - 33 + 47) % 94;
    } else {
      result[i] = c;
    }
  }
  return result;
}
function parseXorKey(keyStr, format) {
  switch (format) {
    case "hex": {
      const clean = keyStr.replace(/[\s,:]+/g, "");
      const buf = Buffer.from(clean, "hex");
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    }
    case "base64": {
      const buf = Buffer.from(keyStr.trim(), "base64");
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    }
    case "latin1": {
      const buf = Buffer.from(keyStr, "latin1");
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    }
    case "utf8":
    default:
      return new TextEncoder().encode(keyStr);
  }
}
function xor(bytes, keyStr, keyFormat = "utf8") {
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

// src/core/codecs/jwt.ts
function decodeJwt(token) {
  const parts = token.trim().split(".");
  if (parts.length < 2) {
    throw new Error("Invalid JWT: Expected at least 2 dot-separated parts (header.payload[.signature])");
  }
  let header;
  let payload;
  try {
    const headerJson = Buffer.from(parts[0], "base64url").toString("utf8");
    header = JSON.parse(headerJson);
  } catch (err) {
    throw new Error(`Invalid JWT Header: ${err?.message || err}`);
  }
  try {
    const payloadJson = Buffer.from(parts[1], "base64url").toString("utf8");
    payload = JSON.parse(payloadJson);
  } catch (err) {
    throw new Error(`Invalid JWT Payload: ${err?.message || err}`);
  }
  const signatureRaw = parts[2] || "";
  const signatureHex = signatureRaw ? Buffer.from(signatureRaw, "base64url").toString("hex") : "";
  const humanClaims = {};
  for (const field of ["exp", "iat", "nbf", "auth_time"]) {
    const val = payload[field];
    if (typeof val === "number") {
      try {
        humanClaims[field] = new Date(val * 1e3).toISOString();
      } catch {
      }
    }
  }
  return {
    header,
    payload,
    signatureHex,
    signatureRaw,
    humanClaims
  };
}
function formatJwtInspection(inspection) {
  const result = {
    HEADER: inspection.header,
    PAYLOAD: inspection.payload
  };
  if (inspection.humanClaims && Object.keys(inspection.humanClaims).length > 0) {
    result["EXPLANATION / DATES"] = inspection.humanClaims;
  }
  result["SIGNATURE (HEX)"] = inspection.signatureHex;
  return JSON.stringify(result, null, 2);
}

// src/core/codecs/hashes.ts
var crypto = __toESM(require("node:crypto"));
function computeHash(bytes, algorithm) {
  const hash = crypto.createHash(algorithm);
  hash.update(bytes);
  const digest = hash.digest();
  return new Uint8Array(digest.buffer, digest.byteOffset, digest.byteLength);
}

// src/core/registry.ts
var textEncoder = new TextEncoder();
var textDecoder = new TextDecoder();
var OperationRegistry = class _OperationRegistry {
  static instance;
  operations = /* @__PURE__ */ new Map();
  constructor() {
    this.registerBuiltIns();
  }
  static getInstance() {
    if (!_OperationRegistry.instance) {
      _OperationRegistry.instance = new _OperationRegistry();
    }
    return _OperationRegistry.instance;
  }
  register(op) {
    if (this.operations.has(op.id)) {
      throw new Error(`Operation "${op.id}" is already registered`);
    }
    this.operations.set(op.id, op);
  }
  get(id) {
    return this.operations.get(id);
  }
  getAll() {
    return Array.from(this.operations.values());
  }
  getByCategory(category) {
    return this.getAll().filter((op) => op.category === category);
  }
  search(query) {
    const q = query.trim().toLowerCase();
    if (!q)
      return this.getAll();
    return this.getAll().filter(
      (op) => op.id.toLowerCase().includes(q) || op.name.toLowerCase().includes(q) || op.description.toLowerCase().includes(q) || op.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }
  registerBuiltIns() {
    this.register({
      id: "to-base64",
      name: "To Base64",
      description: "Encodes bytes or text into Base64 format",
      category: "Bases",
      keywords: ["base64", "b64", "encode"],
      args: [
        {
          name: "urlSafe",
          label: "URL Safe (- and _)",
          type: "boolean",
          defaultValue: false
        }
      ],
      run: (input, args) => {
        const res = encodeBase64(input, Boolean(args?.urlSafe));
        return textEncoder.encode(res);
      }
    });
    this.register({
      id: "from-base64",
      name: "From Base64",
      description: "Decodes Base64 or URL-safe Base64 into original bytes",
      category: "Bases",
      keywords: ["base64", "b64", "decode"],
      args: [
        {
          name: "urlSafe",
          label: "URL Safe",
          type: "boolean",
          defaultValue: false
        }
      ],
      run: (input, args) => {
        const str = textDecoder.decode(input);
        return decodeBase64(str, Boolean(args?.urlSafe));
      }
    });
    this.register({
      id: "to-base32",
      name: "To Base32",
      description: "Encodes data to RFC 4648 Base32",
      category: "Bases",
      keywords: ["base32", "b32", "encode"],
      args: [
        {
          name: "pad",
          label: "Add Padding (=)",
          type: "boolean",
          defaultValue: true
        }
      ],
      run: (input, args) => {
        const res = encodeBase32(input, args?.pad ?? true);
        return textEncoder.encode(res);
      }
    });
    this.register({
      id: "from-base32",
      name: "From Base32",
      description: "Decodes RFC 4648 Base32 back to bytes",
      category: "Bases",
      keywords: ["base32", "b32", "decode"],
      run: (input) => {
        const str = textDecoder.decode(input);
        return decodeBase32(str);
      }
    });
    this.register({
      id: "to-base58",
      name: "To Base58",
      description: "Encodes data using Bitcoin Base58 alphabet",
      category: "Bases",
      keywords: ["base58", "b58", "bitcoin", "crypto"],
      run: (input) => {
        const res = encodeBase58(input);
        return textEncoder.encode(res);
      }
    });
    this.register({
      id: "from-base58",
      name: "From Base58",
      description: "Decodes Bitcoin Base58 back to bytes",
      category: "Bases",
      keywords: ["base58", "b58", "decode"],
      run: (input) => {
        const str = textDecoder.decode(input);
        return decodeBase58(str);
      }
    });
    this.register({
      id: "to-base85",
      name: "To Base85 (Ascii85)",
      description: "Encodes data to Ascii85 / Base85 format",
      category: "Bases",
      keywords: ["base85", "b85", "ascii85"],
      run: (input) => {
        const res = encodeBase85(input);
        return textEncoder.encode(res);
      }
    });
    this.register({
      id: "from-base85",
      name: "From Base85 (Ascii85)",
      description: "Decodes Ascii85 / Base85 back to bytes",
      category: "Bases",
      keywords: ["base85", "b85", "ascii85", "decode"],
      run: (input) => {
        const str = textDecoder.decode(input);
        return decodeBase85(str);
      }
    });
    this.register({
      id: "to-base91",
      name: "To Base91",
      description: "Encodes data into BasE91 printable ASCII representation",
      category: "Bases",
      keywords: ["base91", "b91"],
      run: (input) => {
        const res = encodeBase91(input);
        return textEncoder.encode(res);
      }
    });
    this.register({
      id: "from-base91",
      name: "From Base91",
      description: "Decodes BasE91 back to original bytes",
      category: "Bases",
      keywords: ["base91", "b91", "decode"],
      run: (input) => {
        const str = textDecoder.decode(input);
        return decodeBase91(str);
      }
    });
    this.register({
      id: "to-hex",
      name: "To Hex",
      description: "Converts bytes to hexadecimal string with optional delimiter",
      category: "Radix",
      keywords: ["hex", "hexadecimal", "bytes"],
      args: [
        {
          name: "delimiter",
          label: "Delimiter",
          type: "choice",
          defaultValue: "None",
          options: [
            { label: "None", value: "None" },
            { label: "Space", value: "Space" },
            { label: "Colon", value: "Colon" },
            { label: "0x with comma", value: "0x" }
          ]
        }
      ],
      run: (input, args) => {
        const delim = args?.delimiter || "None";
        const res = toHex(input, delim);
        return textEncoder.encode(res);
      }
    });
    this.register({
      id: "from-hex",
      name: "From Hex",
      description: "Converts hexadecimal string (with or without 0x/delimiters) to bytes",
      category: "Radix",
      keywords: ["hex", "from hex", "unhex", "decode"],
      run: (input) => {
        const str = textDecoder.decode(input);
        return fromHex(str);
      }
    });
    this.register({
      id: "to-binary",
      name: "To Binary",
      description: "Converts bytes to 8-bit binary bit representation",
      category: "Radix",
      keywords: ["binary", "bin", "bits", "01"],
      args: [
        {
          name: "delimiter",
          label: "Delimiter",
          type: "choice",
          defaultValue: "Space",
          options: [
            { label: "Space", value: "Space" },
            { label: "Comma", value: "Comma" },
            { label: "None", value: "None" }
          ]
        }
      ],
      run: (input, args) => {
        const delim = args?.delimiter || "Space";
        const res = toBinary(input, delim);
        return textEncoder.encode(res);
      }
    });
    this.register({
      id: "from-binary",
      name: "From Binary",
      description: "Converts 8-bit binary strings (0s and 1s) back to bytes",
      category: "Radix",
      keywords: ["binary", "bin", "bits", "decode"],
      run: (input) => {
        const str = textDecoder.decode(input);
        return fromBinary(str);
      }
    });
    this.register({
      id: "to-decimal",
      name: "To Decimal",
      description: "Converts each byte into decimal number (0-255)",
      category: "Radix",
      keywords: ["decimal", "dec", "numbers"],
      args: [
        {
          name: "delimiter",
          label: "Delimiter",
          type: "choice",
          defaultValue: "Space",
          options: [
            { label: "Space", value: "Space" },
            { label: "Comma", value: "Comma" }
          ]
        }
      ],
      run: (input, args) => {
        const delim = args?.delimiter || "Space";
        const res = toDecimal(input, delim);
        return textEncoder.encode(res);
      }
    });
    this.register({
      id: "from-decimal",
      name: "From Decimal",
      description: "Converts space/comma separated decimal numbers (0-255) back to bytes",
      category: "Radix",
      keywords: ["decimal", "dec", "numbers", "decode"],
      run: (input) => {
        const str = textDecoder.decode(input);
        return fromDecimal(str);
      }
    });
    this.register({
      id: "to-octal",
      name: "To Octal",
      description: "Converts bytes to octal representation",
      category: "Radix",
      keywords: ["octal", "oct", "radix 8"],
      args: [
        {
          name: "delimiter",
          label: "Delimiter",
          type: "choice",
          defaultValue: "Space",
          options: [
            { label: "Space", value: "Space" },
            { label: "Comma", value: "Comma" },
            { label: "None", value: "None" }
          ]
        }
      ],
      run: (input, args) => {
        const delim = args?.delimiter || "Space";
        const res = toOctal(input, delim);
        return textEncoder.encode(res);
      }
    });
    this.register({
      id: "from-octal",
      name: "From Octal",
      description: "Converts octal numbers back to bytes",
      category: "Radix",
      keywords: ["octal", "oct", "decode"],
      run: (input) => {
        const str = textDecoder.decode(input);
        return fromOctal(str);
      }
    });
    this.register({
      id: "rot13",
      name: "ROT13",
      description: "Rotates ASCII letters by 13 positions (symmetric)",
      category: "Ciphers",
      keywords: ["rot13", "caesar", "rot", "cipher"],
      run: (input) => rotN(input, 13)
    });
    this.register({
      id: "rot-n",
      name: "ROT-N",
      description: "Caesar cipher shift by N positions",
      category: "Ciphers",
      keywords: ["rot", "caesar", "shift", "cipher"],
      args: [
        {
          name: "amount",
          label: "Shift Amount (1-25)",
          type: "number",
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
      id: "rot47",
      name: "ROT47",
      description: "Rotates ASCII printable characters (33-126) by 47 positions",
      category: "Ciphers",
      keywords: ["rot47", "rot", "cipher"],
      run: (input) => rot47(input)
    });
    this.register({
      id: "xor",
      name: "XOR",
      description: "Bitwise repeating-key XOR operation (symmetric)",
      category: "Ciphers",
      keywords: ["xor", "bitwise", "cipher", "key"],
      args: [
        {
          name: "key",
          label: "Key",
          type: "text",
          defaultValue: ""
        },
        {
          name: "format",
          label: "Key Format",
          type: "choice",
          defaultValue: "utf8",
          options: [
            { label: "UTF-8", value: "utf8" },
            { label: "Hex", value: "hex" },
            { label: "Base64", value: "base64" },
            { label: "Latin1", value: "latin1" }
          ]
        }
      ],
      run: (input, args) => {
        const key = String(args?.key ?? "");
        const format = args?.format || "utf8";
        return xor(input, key, format);
      }
    });
    this.register({
      id: "jwt-decode",
      name: "JWT Decode",
      description: "Inspects and formats JSON Web Token header, claims, and ISO timestamps",
      category: "Web & Tokens",
      keywords: ["jwt", "json web token", "bearer", "auth", "token"],
      run: (input) => {
        const token = textDecoder.decode(input).trim();
        const inspected = decodeJwt(token);
        const formatted = formatJwtInspection(inspected);
        return textEncoder.encode(formatted);
      }
    });
    this.register({
      id: "url-encode",
      name: "URL Encode",
      description: "Percent-encodes special characters for URLs (encodeURIComponent)",
      category: "Web & Tokens",
      keywords: ["url", "uri", "percent encode", "web"],
      run: (input) => {
        const str = textDecoder.decode(input);
        const encoded = encodeURIComponent(str);
        return textEncoder.encode(encoded);
      }
    });
    this.register({
      id: "url-decode",
      name: "URL Decode",
      description: "Decodes percent-encoded characters from URLs (decodeURIComponent)",
      category: "Web & Tokens",
      keywords: ["url", "uri", "percent decode", "web"],
      run: (input) => {
        const str = textDecoder.decode(input);
        const decoded = decodeURIComponent(str);
        return textEncoder.encode(decoded);
      }
    });
    const registerHash = (id, name, alg) => {
      this.register({
        id,
        name,
        description: `Computes cryptographic ${name} checksum`,
        category: "Hashing",
        keywords: [name.toLowerCase(), "hash", "digest", "checksum"],
        args: [
          {
            name: "format",
            label: "Output Format",
            type: "choice",
            defaultValue: "hex",
            options: [
              { label: "Hex", value: "hex" },
              { label: "Base64", value: "base64" }
            ]
          }
        ],
        run: (input, args) => {
          const digest = computeHash(input, alg);
          if (args?.format === "base64") {
            return textEncoder.encode(Buffer.from(digest).toString("base64"));
          }
          return textEncoder.encode(Buffer.from(digest).toString("hex"));
        }
      });
    };
    registerHash("md5", "MD5", "md5");
    registerHash("sha1", "SHA-1", "sha1");
    registerHash("sha256", "SHA-256", "sha256");
    registerHash("sha384", "SHA-384", "sha384");
    registerHash("sha512", "SHA-512", "sha512");
  }
};

// src/editor/transformer.ts
var vscode = __toESM(require("vscode"));
var EditorTransformer = class _EditorTransformer {
  static instance;
  static getInstance() {
    if (!_EditorTransformer.instance) {
      _EditorTransformer.instance = new _EditorTransformer();
    }
    return _EditorTransformer.instance;
  }
  /**
   * Retrieves the currently selected text in the active text editor.
   * If there is no selection, returns the full document text (or empty string).
   */
  getActiveText() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return { text: "", isSelection: false };
    }
    const selection = editor.selection;
    if (!selection.isEmpty) {
      return {
        text: editor.document.getText(selection),
        isSelection: true
      };
    }
    return {
      text: editor.document.getText(),
      isSelection: false
    };
  }
  /**
   * Replaces the currently active selection(s) in the editor with the given text.
   * If there are multiple cursors/selections, replaces all selections or primary.
   */
  async replaceActiveSelection(newText) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage("No active editor open to replace text in.");
      return false;
    }
    const selections = editor.selections;
    const hasSelection = selections.some((s) => !s.isEmpty);
    const success = await editor.edit((editBuilder) => {
      if (hasSelection) {
        for (const sel of selections) {
          if (!sel.isEmpty) {
            editBuilder.replace(sel, newText);
          }
        }
      } else {
        const fullRange = new vscode.Range(
          editor.document.positionAt(0),
          editor.document.positionAt(editor.document.getText().length)
        );
        editBuilder.replace(fullRange, newText);
      }
    });
    if (success) {
      vscode.window.showInformationMessage("Successfully replaced in editor.");
    }
    return success;
  }
  /**
   * Directly transforms the active editor selection using an Operation.
   * If the operation requires arguments, prompts the user via VS Code native UI.
   */
  async transformSelection(opId, preArgs) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage("Open an editor to transform text.");
      return;
    }
    const op = OperationRegistry.getInstance().get(opId);
    if (!op) {
      vscode.window.showErrorMessage(`CyberChef operation "${opId}" not found.`);
      return;
    }
    const args = { ...preArgs };
    if (op.args && op.args.length > 0) {
      for (const argDef of op.args) {
        if (args[argDef.name] !== void 0)
          continue;
        const collected = await this.promptForArg(argDef);
        if (collected === void 0) {
          return;
        }
        args[argDef.name] = collected;
      }
    }
    const selections = editor.selections;
    const hasSelection = selections.some((s) => !s.isEmpty);
    const rangesToTransform = hasSelection ? selections.filter((s) => !s.isEmpty) : [
      new vscode.Range(
        editor.document.positionAt(0),
        editor.document.positionAt(editor.document.getText().length)
      )
    ];
    const textEncoder2 = new TextEncoder();
    const textDecoder2 = new TextDecoder();
    try {
      await editor.edit(async (editBuilder) => {
        for (const range of rangesToTransform) {
          const originalText = editor.document.getText(range);
          const inputBytes = textEncoder2.encode(originalText);
          const outputBytes = await op.run(inputBytes, args);
          const transformedText = textDecoder2.decode(outputBytes);
          editBuilder.replace(range, transformedText);
        }
      });
    } catch (err) {
      vscode.window.showErrorMessage(`Transform failed: ${err?.message || err}`);
    }
  }
  async promptForArg(argDef) {
    if (argDef.type === "choice" && argDef.options) {
      const pick = await vscode.window.showQuickPick(
        argDef.options.map((opt) => ({
          label: opt.label,
          value: opt.value,
          description: opt.value === argDef.defaultValue ? "(Default)" : void 0
        })),
        {
          placeHolder: `Select ${argDef.label}`
        }
      );
      return pick ? pick.value : void 0;
    }
    if (argDef.type === "boolean") {
      const pick = await vscode.window.showQuickPick(
        [
          { label: "Yes", value: true },
          { label: "No", value: false }
        ],
        { placeHolder: `${argDef.label}?` }
      );
      return pick ? pick.value : void 0;
    }
    const input = await vscode.window.showInputBox({
      prompt: `Enter ${argDef.label}`,
      value: String(argDef.defaultValue ?? ""),
      validateInput: (val) => {
        if (argDef.type === "number") {
          const num = Number(val);
          if (isNaN(num))
            return "Must be a valid number";
          if (argDef.min !== void 0 && num < argDef.min)
            return `Minimum is ${argDef.min}`;
          if (argDef.max !== void 0 && num > argDef.max)
            return `Maximum is ${argDef.max}`;
        }
        return null;
      }
    });
    if (input === void 0)
      return void 0;
    return argDef.type === "number" ? Number(input) : input;
  }
};

// src/webview/workbenchViewProvider.ts
var vscode2 = __toESM(require("vscode"));

// src/core/pipeline.ts
async function executeRecipe(input, steps, context) {
  const registry = OperationRegistry.getInstance();
  const stepResults = [];
  let current = input;
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (!step.enabled) {
      continue;
    }
    if (context?.signal?.aborted) {
      return {
        success: false,
        finalOutput: current,
        stepResults,
        failedStepIndex: i,
        error: "Recipe execution cancelled"
      };
    }
    const op = registry.get(step.opId);
    if (!op) {
      return {
        success: false,
        finalOutput: current,
        stepResults,
        failedStepIndex: i,
        error: `Unknown operation: "${step.opId}"`
      };
    }
    const startTime = Date.now();
    try {
      current = await op.run(current, step.args || {}, context);
      const durationMs = Date.now() - startTime;
      stepResults.push({
        opId: step.opId,
        output: current,
        durationMs
      });
    } catch (err) {
      const durationMs = Date.now() - startTime;
      const errorMsg = err?.message || String(err);
      stepResults.push({
        opId: step.opId,
        output: current,
        durationMs,
        error: errorMsg
      });
      return {
        success: false,
        finalOutput: current,
        stepResults,
        failedStepIndex: i,
        error: `Step ${i + 1} (${op.name}) failed: ${errorMsg}`
      };
    }
  }
  return {
    success: true,
    finalOutput: current,
    stepResults
  };
}

// src/webview/workbenchViewProvider.ts
var WorkbenchViewProvider = class {
  constructor(_extensionUri) {
    this._extensionUri = _extensionUri;
  }
  static viewType = "cyberchef.workbenchView";
  _view;
  resolveWebviewView(webviewView, _context, _token) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };
    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);
    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case "fetchSelection": {
          const selection = EditorTransformer.getInstance().getActiveText();
          this.sendMessage({
            command: "updateInput",
            text: selection.text,
            isSelection: selection.isSelection
          });
          break;
        }
        case "replaceInEditor": {
          await EditorTransformer.getInstance().replaceActiveSelection(message.text);
          break;
        }
        case "executeSingleOp": {
          await this.handleSingleOpExecution(message.opId, message.input, message.args);
          break;
        }
        case "executeRecipe": {
          await this.handleRecipeExecution(message.input, message.steps);
          break;
        }
        case "getOperations": {
          const ops = OperationRegistry.getInstance().getAll().map((op) => ({
            id: op.id,
            name: op.name,
            description: op.description,
            category: op.category,
            keywords: op.keywords,
            args: op.args
          }));
          this.sendMessage({ command: "operationsLoaded", operations: ops });
          break;
        }
      }
    });
    setTimeout(() => {
      const ops = OperationRegistry.getInstance().getAll().map((op) => ({
        id: op.id,
        name: op.name,
        description: op.description,
        category: op.category,
        keywords: op.keywords,
        args: op.args
      }));
      this.sendMessage({ command: "operationsLoaded", operations: ops });
      const active = EditorTransformer.getInstance().getActiveText();
      if (active.text && active.isSelection) {
        this.sendMessage({
          command: "updateInput",
          text: active.text,
          isSelection: true
        });
      }
    }, 200);
    vscode2.window.onDidChangeTextEditorSelection((e) => {
      if (!this._view || !this._view.visible)
        return;
      const selText = e.textEditor.document.getText(e.selections[0]);
      if (selText) {
        this.sendMessage({
          command: "editorSelectionPreview",
          text: selText
        });
      }
    });
  }
  sendMessage(message) {
    this._view?.webview.postMessage(message);
  }
  async handleSingleOpExecution(opId, inputStr, args) {
    const op = OperationRegistry.getInstance().get(opId);
    if (!op) {
      this.sendMessage({
        command: "executionResult",
        success: false,
        error: `Unknown operation: ${opId}`
      });
      return;
    }
    const textEncoder2 = new TextEncoder();
    const textDecoder2 = new TextDecoder();
    const startTime = Date.now();
    try {
      const inputBytes = textEncoder2.encode(inputStr);
      const outputBytes = await op.run(inputBytes, args || {});
      const outputStr = textDecoder2.decode(outputBytes);
      const durationMs = Date.now() - startTime;
      this.sendMessage({
        command: "executionResult",
        success: true,
        output: outputStr,
        durationMs
      });
    } catch (err) {
      this.sendMessage({
        command: "executionResult",
        success: false,
        error: err?.message || String(err),
        durationMs: Date.now() - startTime
      });
    }
  }
  async handleRecipeExecution(inputStr, steps) {
    const textEncoder2 = new TextEncoder();
    const textDecoder2 = new TextDecoder();
    const startTime = Date.now();
    try {
      const inputBytes = textEncoder2.encode(inputStr);
      const result = await executeRecipe(inputBytes, steps);
      const outputStr = textDecoder2.decode(result.finalOutput);
      const durationMs = Date.now() - startTime;
      this.sendMessage({
        command: "executionResult",
        success: result.success,
        output: outputStr,
        error: result.error,
        durationMs
      });
    } catch (err) {
      this.sendMessage({
        command: "executionResult",
        success: false,
        error: err?.message || String(err),
        durationMs: Date.now() - startTime
      });
    }
  }
  getHtmlForWebview(_webview) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CyberChef Workbench</title>
  <style>
    :root {
      --bg: var(--vscode-editor-background);
      --fg: var(--vscode-editor-foreground);
      --card-bg: var(--vscode-sideBar-background);
      --border: var(--vscode-panel-border, #3c3c3c);
      --btn-bg: var(--vscode-button-background);
      --btn-fg: var(--vscode-button-foreground);
      --btn-hover: var(--vscode-button-hoverBackground);
      --input-bg: var(--vscode-input-background);
      --input-fg: var(--vscode-input-foreground);
      --input-border: var(--vscode-input-border, #3c3c3c);
      --badge-bg: var(--vscode-badge-background);
      --badge-fg: var(--vscode-badge-foreground);
      --accent: var(--vscode-textLink-foreground, #4fc1ff);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif);
      font-size: var(--vscode-font-size, 12px);
      color: var(--fg);
      background-color: var(--bg);
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border);
      padding-bottom: 6px;
    }
    .header h2 { font-size: 13px; font-weight: 600; }
    .mode-switch {
      display: flex;
      gap: 4px;
      background: var(--input-bg);
      border-radius: 4px;
      padding: 2px;
    }
    .mode-btn {
      background: transparent;
      border: none;
      color: var(--fg);
      padding: 2px 8px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
    }
    .mode-btn.active {
      background: var(--btn-bg);
      color: var(--btn-fg);
      font-weight: 600;
    }

    .pane-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
      font-weight: 600;
      font-size: 11px;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .pane-actions { display: flex; gap: 4px; }

    textarea {
      width: 100%;
      height: 90px;
      background: var(--input-bg);
      color: var(--input-fg);
      border: 1px solid var(--input-border);
      border-radius: 4px;
      padding: 6px;
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: 11px;
      resize: vertical;
    }

    .btn {
      background: var(--btn-bg);
      color: var(--btn-fg);
      border: none;
      border-radius: 3px;
      padding: 4px 10px;
      cursor: pointer;
      font-size: 11px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .btn:hover { background: var(--btn-hover); }
    .btn-secondary {
      background: var(--input-bg);
      color: var(--fg);
      border: 1px solid var(--input-border);
    }
    .btn-secondary:hover { background: var(--border); }
    .btn-sm { padding: 2px 6px; font-size: 10px; }

    .search-box {
      width: 100%;
      background: var(--input-bg);
      color: var(--input-fg);
      border: 1px solid var(--input-border);
      border-radius: 4px;
      padding: 5px;
      margin-bottom: 6px;
      font-size: 11px;
    }

    .category-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 3px;
      margin-bottom: 6px;
    }
    .pill {
      background: var(--input-bg);
      border: 1px solid var(--input-border);
      border-radius: 10px;
      padding: 2px 7px;
      cursor: pointer;
      font-size: 10px;
      opacity: 0.8;
    }
    .pill.active {
      background: var(--btn-bg);
      color: var(--btn-fg);
      opacity: 1;
      border-color: var(--btn-bg);
    }

    .ops-grid {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 180px;
      overflow-y: auto;
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 4px;
      background: var(--card-bg);
    }
    .op-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 5px 8px;
      border-radius: 3px;
      background: var(--input-bg);
      cursor: pointer;
      border: 1px solid transparent;
    }
    .op-item:hover { border-color: var(--accent); }
    .op-item.selected {
      background: var(--btn-bg);
      color: var(--btn-fg);
      font-weight: 600;
    }
    .op-meta { display: flex; flex-direction: column; gap: 1px; }
    .op-name { font-size: 11px; }
    .op-cat { font-size: 9px; opacity: 0.7; }

    .op-args-panel {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 4px;
    }
    .arg-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      font-size: 11px;
    }
    .arg-input {
      background: var(--input-bg);
      color: var(--input-fg);
      border: 1px solid var(--input-border);
      border-radius: 3px;
      padding: 3px 6px;
      font-size: 11px;
      flex: 1;
      max-width: 140px;
    }

    .output-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 6px;
      gap: 6px;
    }
    .status-badge {
      font-size: 10px;
      opacity: 0.8;
      display: flex;
      gap: 6px;
    }
    .error-msg {
      color: #f48771;
      font-size: 11px;
      margin-top: 4px;
      padding: 4px;
      background: rgba(244, 135, 113, 0.1);
      border-radius: 3px;
      border: 1px solid #f48771;
    }

    /* Recipe Builder Styles */
    .recipe-steps {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 160px;
      overflow-y: auto;
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 4px;
      background: var(--card-bg);
    }
    .recipe-step-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 6px;
      border-radius: 3px;
      background: var(--input-bg);
      border: 1px solid var(--input-border);
      font-size: 11px;
    }
    .step-actions { display: flex; gap: 2px; }
  </style>
</head>
<body>
  <div class="header">
    <h2>CyberChef</h2>
    <div class="mode-switch">
      <button id="mode-quick" class="mode-btn active" onclick="setMode('quick')">Quick</button>
      <button id="mode-recipe" class="mode-btn" onclick="setMode('recipe')">Recipe</button>
    </div>
  </div>

  <!-- Input Section -->
  <div>
    <div class="pane-title">
      <span>Input</span>
      <div class="pane-actions">
        <button class="btn btn-secondary btn-sm" onclick="fetchActiveSelection()">Sync Selection</button>
        <button class="btn btn-secondary btn-sm" onclick="clearInput()">Clear</button>
      </div>
    </div>
    <textarea id="input-text" placeholder="Type, paste, or highlight code in editor..." oninput="onInputChanged()"></textarea>
  </div>

  <!-- Operations Section -->
  <div id="ops-container">
    <div class="pane-title">
      <span id="ops-title">Operations</span>
      <div class="pane-actions">
        <label style="font-size: 10px; display: flex; align-items: center; gap: 3px; cursor: pointer;">
          <input type="checkbox" id="auto-bake" checked onchange="toggleAutoBake()"> Auto-Bake
        </label>
      </div>
    </div>

    <input type="text" id="search-input" class="search-box" placeholder="Search (e.g. b64, hex, jwt, rot, sha)..." oninput="filterOperations()">

    <div class="category-pills" id="category-pills">
      <span class="pill active" onclick="selectCategory('All')">All</span>
      <span class="pill" onclick="selectCategory('Bases')">Bases</span>
      <span class="pill" onclick="selectCategory('Radix')">Radix</span>
      <span class="pill" onclick="selectCategory('Ciphers')">Ciphers</span>
      <span class="pill" onclick="selectCategory('Hashing')">Hashing</span>
      <span class="pill" onclick="selectCategory('Web & Tokens')">Web</span>
    </div>

    <!-- Quick Mode View -->
    <div id="quick-mode-view">
      <div class="ops-grid" id="ops-grid"></div>
      <div id="op-args-panel" class="op-args-panel" style="display: none;"></div>
      <div style="margin-top: 6px; display: flex; gap: 4px;">
        <button class="btn" style="flex: 1;" onclick="bakeSingleOp()">\u26A1 Bake Operation</button>
      </div>
    </div>

    <!-- Recipe Mode View -->
    <div id="recipe-mode-view" style="display: none;">
      <div class="pane-title" style="margin-top: 4px;">Recipe Pipeline</div>
      <div class="recipe-steps" id="recipe-steps">
        <div style="font-size: 10px; opacity: 0.6; text-align: center; padding: 10px;">Select operations from above to build recipe</div>
      </div>
      <div style="margin-top: 6px; display: flex; gap: 4px;">
        <button class="btn" style="flex: 1;" onclick="bakeRecipe()">\u26A1 Bake Recipe</button>
        <button class="btn btn-secondary btn-sm" onclick="clearRecipe()">Clear Steps</button>
      </div>
    </div>
  </div>

  <!-- Output Section -->
  <div>
    <div class="pane-title">
      <span>Output</span>
      <div class="pane-actions">
        <button class="btn btn-secondary btn-sm" onclick="useAsInput()">Use as Input</button>
        <button class="btn btn-secondary btn-sm" onclick="copyOutput()">Copy</button>
      </div>
    </div>
    <textarea id="output-text" readonly placeholder="Output appears here..."></textarea>
    <div id="error-box" class="error-msg" style="display: none;"></div>

    <div class="output-footer">
      <div class="status-badge" id="status-badge">Ready</div>
      <button class="btn" onclick="replaceInEditor()" style="background: var(--accent); color: #000; font-weight: 600;">
        \u270F\uFE0F Replace in Editor
      </button>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    let allOperations = [];
    let selectedCategory = 'All';
    let selectedOpId = 'to-base64';
    let currentMode = 'quick';
    let currentArgs = {};
    let recipeSteps = [];
    let autoBakeEnabled = true;

    // Initialize
    window.addEventListener('message', event => {
      const msg = event.data;
      switch (msg.command) {
        case 'operationsLoaded':
          allOperations = msg.operations;
          renderOperations();
          selectOperation(selectedOpId);
          break;
        case 'updateInput':
          document.getElementById('input-text').value = msg.text;
          if (autoBakeEnabled) triggerBake();
          break;
        case 'editorSelectionPreview':
          // Auto-sync editor highlight if input was empty or user wishes
          if (!document.getElementById('input-text').value) {
            document.getElementById('input-text').value = msg.text;
            if (autoBakeEnabled) triggerBake();
          }
          break;
        case 'executionResult':
          handleResult(msg);
          break;
      }
    });

    vscode.postMessage({ command: 'getOperations' });

    function setMode(mode) {
      currentMode = mode;
      document.getElementById('mode-quick').classList.toggle('active', mode === 'quick');
      document.getElementById('mode-recipe').classList.toggle('active', mode === 'recipe');
      document.getElementById('quick-mode-view').style.display = mode === 'quick' ? 'block' : 'none';
      document.getElementById('recipe-mode-view').style.display = mode === 'recipe' ? 'block' : 'none';
      renderOperations();
    }

    function toggleAutoBake() {
      autoBakeEnabled = document.getElementById('auto-bake').checked;
      if (autoBakeEnabled) triggerBake();
    }

    function selectCategory(cat) {
      selectedCategory = cat;
      const pills = document.querySelectorAll('#category-pills .pill');
      pills.forEach(p => p.classList.toggle('active', p.textContent === cat || (cat === 'Web & Tokens' && p.textContent === 'Web')));
      renderOperations();
    }

    function filterOperations() {
      renderOperations();
    }

    function renderOperations() {
      const grid = document.getElementById('ops-grid');
      const query = document.getElementById('search-input').value.toLowerCase().trim();

      const filtered = allOperations.filter(op => {
        const matchCat = selectedCategory === 'All' || op.category === selectedCategory;
        const matchQuery = !query ||
          op.id.toLowerCase().includes(query) ||
          op.name.toLowerCase().includes(query) ||
          op.description.toLowerCase().includes(query) ||
          (op.keywords && op.keywords.some(k => k.toLowerCase().includes(query)));
        return matchCat && matchQuery;
      });

      grid.innerHTML = '';
      filtered.forEach(op => {
        const item = document.createElement('div');
        item.className = 'op-item' + (currentMode === 'quick' && op.id === selectedOpId ? ' selected' : '');
        item.innerHTML = \`
          <div class="op-meta">
            <span class="op-name">\${op.name}</span>
            <span class="op-cat">\${op.category}</span>
          </div>
          \${currentMode === 'recipe' ? '<button class="btn btn-secondary btn-sm">+ Add</button>' : ''}
        \`;

        item.onclick = (e) => {
          if (currentMode === 'quick') {
            selectOperation(op.id);
          } else {
            addToRecipe(op.id);
          }
        };
        grid.appendChild(item);
      });
    }

    function selectOperation(opId) {
      selectedOpId = opId;
      currentArgs = {};
      renderOperations();
      renderArgsPanel();
      if (autoBakeEnabled) triggerBake();
    }

    function renderArgsPanel() {
      const panel = document.getElementById('op-args-panel');
      const op = allOperations.find(o => o.id === selectedOpId);
      if (!op || !op.args || op.args.length === 0) {
        panel.style.display = 'none';
        return;
      }

      panel.style.display = 'flex';
      panel.innerHTML = '<div style="font-weight: 600; font-size: 10px; text-transform: uppercase;">Parameters</div>';

      op.args.forEach(arg => {
        const row = document.createElement('div');
        row.className = 'arg-row';

        const label = document.createElement('span');
        label.textContent = arg.label;
        row.appendChild(label);

        if (arg.type === 'choice') {
          const select = document.createElement('select');
          select.className = 'arg-input';
          (arg.options || []).forEach(opt => {
            const optElem = document.createElement('option');
            optElem.value = opt.value;
            optElem.textContent = opt.label;
            if (opt.value === arg.defaultValue) optElem.selected = true;
            select.appendChild(optElem);
          });
          currentArgs[arg.name] = select.value;
          select.onchange = () => {
            currentArgs[arg.name] = select.value;
            if (autoBakeEnabled) triggerBake();
          };
          row.appendChild(select);
        } else if (arg.type === 'boolean') {
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.checked = Boolean(arg.defaultValue);
          currentArgs[arg.name] = checkbox.checked;
          checkbox.onchange = () => {
            currentArgs[arg.name] = checkbox.checked;
            if (autoBakeEnabled) triggerBake();
          };
          row.appendChild(checkbox);
        } else {
          const input = document.createElement('input');
          input.type = arg.type === 'number' ? 'number' : 'text';
          input.className = 'arg-input';
          input.value = arg.defaultValue ?? '';
          if (arg.min !== undefined) input.min = arg.min;
          if (arg.max !== undefined) input.max = arg.max;
          currentArgs[arg.name] = input.value;
          input.oninput = () => {
            currentArgs[arg.name] = arg.type === 'number' ? Number(input.value) : input.value;
            if (autoBakeEnabled) triggerBake();
          };
          row.appendChild(input);
        }

        panel.appendChild(row);
      });
    }

    function addToRecipe(opId) {
      const op = allOperations.find(o => o.id === opId);
      if (!op) return;
      const defaultArgs = {};
      (op.args || []).forEach(a => defaultArgs[a.name] = a.defaultValue);
      recipeSteps.push({ opId, args: defaultArgs, enabled: true });
      renderRecipeSteps();
      if (autoBakeEnabled) triggerBake();
    }

    function renderRecipeSteps() {
      const container = document.getElementById('recipe-steps');
      if (recipeSteps.length === 0) {
        container.innerHTML = '<div style="font-size: 10px; opacity: 0.6; text-align: center; padding: 10px;">Select operations from above to build recipe</div>';
        return;
      }

      container.innerHTML = '';
      recipeSteps.forEach((step, index) => {
        const op = allOperations.find(o => o.id === step.opId);
        const item = document.createElement('div');
        item.className = 'recipe-step-item';
        item.innerHTML = \`
          <span style="font-weight: 500;">\${index + 1}. \${op?.name || step.opId}</span>
          <div class="step-actions">
            <button class="btn btn-secondary btn-sm" onclick="moveStep(\${index}, -1)" \${index === 0 ? 'disabled' : ''}>\u25B2</button>
            <button class="btn btn-secondary btn-sm" onclick="moveStep(\${index}, 1)" \${index === recipeSteps.length - 1 ? 'disabled' : ''}>\u25BC</button>
            <button class="btn btn-secondary btn-sm" onclick="removeStep(\${index})">\u2715</button>
          </div>
        \`;
        container.appendChild(item);
      });
    }

    function moveStep(idx, delta) {
      const newIdx = idx + delta;
      if (newIdx < 0 || newIdx >= recipeSteps.length) return;
      const temp = recipeSteps[idx];
      recipeSteps[idx] = recipeSteps[newIdx];
      recipeSteps[newIdx] = temp;
      renderRecipeSteps();
      if (autoBakeEnabled) triggerBake();
    }

    function removeStep(idx) {
      recipeSteps.splice(idx, 1);
      renderRecipeSteps();
      if (autoBakeEnabled) triggerBake();
    }

    function clearRecipe() {
      recipeSteps = [];
      renderRecipeSteps();
      if (autoBakeEnabled) triggerBake();
    }

    function onInputChanged() {
      if (autoBakeEnabled) triggerBake();
    }

    function triggerBake() {
      if (currentMode === 'quick') {
        bakeSingleOp();
      } else {
        bakeRecipe();
      }
    }

    function bakeSingleOp() {
      const input = document.getElementById('input-text').value;
      vscode.postMessage({
        command: 'executeSingleOp',
        opId: selectedOpId,
        input,
        args: currentArgs
      });
    }

    function bakeRecipe() {
      const input = document.getElementById('input-text').value;
      vscode.postMessage({
        command: 'executeRecipe',
        input,
        steps: recipeSteps
      });
    }

    function handleResult(msg) {
      const outputElem = document.getElementById('output-text');
      const errorBox = document.getElementById('error-box');
      const badge = document.getElementById('status-badge');

      if (msg.success) {
        outputElem.value = msg.output;
        errorBox.style.display = 'none';
        badge.textContent = \`Done (\${msg.durationMs}ms) \u2022 \${msg.output.length} chars\`;
      } else {
        errorBox.textContent = msg.error || 'Execution failed';
        errorBox.style.display = 'block';
        badge.textContent = 'Error';
      }
    }

    function fetchActiveSelection() {
      vscode.postMessage({ command: 'fetchSelection' });
    }

    function clearInput() {
      document.getElementById('input-text').value = '';
      document.getElementById('output-text').value = '';
      document.getElementById('error-box').style.display = 'none';
      document.getElementById('status-badge').textContent = 'Cleared';
    }

    function useAsInput() {
      const out = document.getElementById('output-text').value;
      document.getElementById('input-text').value = out;
      triggerBake();
    }

    function copyOutput() {
      const out = document.getElementById('output-text').value;
      navigator.clipboard.writeText(out);
      const badge = document.getElementById('status-badge');
      badge.textContent = 'Copied to clipboard!';
      setTimeout(() => badge.textContent = 'Ready', 1500);
    }

    function replaceInEditor() {
      const out = document.getElementById('output-text').value;
      if (!out) return;
      vscode.postMessage({
        command: 'replaceInEditor',
        text: out
      });
    }
  </script>
</body>
</html>`;
  }
};

// src/extension.ts
function activate(context) {
  const registry = OperationRegistry.getInstance();
  const transformer = EditorTransformer.getInstance();
  const provider = new WorkbenchViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode3.window.registerWebviewViewProvider(
      WorkbenchViewProvider.viewType,
      provider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );
  context.subscriptions.push(
    vscode3.commands.registerCommand("cyberchef.openWorkbench", () => {
      vscode3.commands.executeCommand("workbench.view.extension.cyberchef-sidebar");
    })
  );
  context.subscriptions.push(
    vscode3.commands.registerCommand("cyberchef.transformSelection", async () => {
      const ops = registry.getAll();
      const pick = await vscode3.window.showQuickPick(
        ops.map((op) => ({
          label: op.name,
          description: `[${op.category}] ${op.description}`,
          id: op.id
        })),
        { placeHolder: "Select CyberChef Operation to apply to selection..." }
      );
      if (pick) {
        await transformer.transformSelection(pick.id);
      }
    })
  );
  const registerOpCommand = (commandId, opId, preArgs) => {
    context.subscriptions.push(
      vscode3.commands.registerCommand(commandId, async () => {
        await transformer.transformSelection(opId, preArgs);
      })
    );
  };
  registerOpCommand("cyberchef.toBase64", "to-base64");
  registerOpCommand("cyberchef.fromBase64", "from-base64");
  registerOpCommand("cyberchef.toHex", "to-hex");
  registerOpCommand("cyberchef.fromHex", "from-hex");
  registerOpCommand("cyberchef.toBinary", "to-binary");
  registerOpCommand("cyberchef.fromBinary", "from-binary");
  registerOpCommand("cyberchef.toDecimal", "to-decimal");
  registerOpCommand("cyberchef.fromDecimal", "from-decimal");
  registerOpCommand("cyberchef.rot13", "rot13");
  registerOpCommand("cyberchef.rotN", "rot-n");
  registerOpCommand("cyberchef.xor", "xor");
  registerOpCommand("cyberchef.jwtDecode", "jwt-decode");
  registerOpCommand("cyberchef.md5", "md5");
  registerOpCommand("cyberchef.sha256", "sha256");
  console.log("CyberChef for VS Code is now active.");
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
