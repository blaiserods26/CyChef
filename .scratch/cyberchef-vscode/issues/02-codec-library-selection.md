# 02 - Codec Library Selection and Packaging Footprint

Type: research
Status: resolved
Blocked by:

## Question

Which lightweight npm packages, pure TypeScript implementations, or native Node.js / Web Crypto primitives should be chosen for the initial operation catalogue to ensure high performance and minimal extension bundle size?
Specifically, review the best choices for:
- Base encodings: Base64 (native), Base32 (e.g. `hi-base32` or custom), Base58 (`bs58`), Base85/Ascii85, Base91.
- Radix conversions: To/From Hex, Binary, Decimal, Octal.
- Ciphers: ROT13/ROTN (pure algorithmic), XOR (multi-format key handling).
- Web & Tokens: JWT decode/verify (pure payload inspection vs signature validation).
- Hashes: MD5, SHA-1, SHA-256, SHA-512 (native Node.js `crypto`).

## Answer

Zero external npm runtime dependencies selected:
1. **Base64 / Base64url**: Native Node.js `Buffer.from(..., 'base64')` / `'base64url'`.
2. **Base32, Base58, Base85, Base91**: Clean pure TypeScript implementations (~30-40 lines each) consuming `Uint8Array`.
3. **Radix Conversions (Hex, Binary, Dec, Octal)**: Native `Buffer.from(..., 'hex')` + native `BigInt` / `parseInt`.
4. **Ciphers & Bitwise (ROT13/ROTN, XOR)**: Pure TypeScript bitwise XOR with multi-format key parsing (utf8, hex, base64, latin1) and algorithmic ROT.
5. **JWT**: Pure TypeScript inspection via base64url decode + `JSON.parse` with timestamp humanization (`exp`, `iat`, `nbf`), avoiding 200KB+ heavy auth dependencies.
6. **Hashes**: Native Node.js `node:crypto` (`crypto.createHash`) providing synchronous execution, hardware acceleration, and full MD5 + SHA-1/256/384/512 support.
Total dependency footprint: 0 KB npm packages; expected VSIX package size under 200 KB.
