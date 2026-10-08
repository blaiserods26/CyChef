// Hashing using Node.js crypto
import * as crypto from 'node:crypto';

export type HashAlgorithm = 'md5' | 'sha1' | 'sha256' | 'sha384' | 'sha512' | 'ripemd160';

export function computeHash(bytes: Uint8Array, algorithm: HashAlgorithm): Uint8Array {
  const hash = crypto.createHash(algorithm);
  hash.update(bytes);
  const digest = hash.digest();
  return new Uint8Array(digest.buffer, digest.byteOffset, digest.byteLength);
}
