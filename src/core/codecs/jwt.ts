// Web & Tokens: JWT Decoder & Inspector

export interface JwtInspection {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signatureHex: string;
  signatureRaw: string;
  humanClaims?: Record<string, string>;
}

export function decodeJwt(token: string): JwtInspection {
  const parts = token.trim().split('.');
  if (parts.length < 2) {
    throw new Error('Invalid JWT: Expected at least 2 dot-separated parts (header.payload[.signature])');
  }

  let header: Record<string, unknown>;
  let payload: Record<string, unknown>;

  try {
    const headerJson = Buffer.from(parts[0], 'base64url').toString('utf8');
    header = JSON.parse(headerJson);
  } catch (err: any) {
    throw new Error(`Invalid JWT Header: ${err?.message || err}`);
  }

  try {
    const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
    payload = JSON.parse(payloadJson);
  } catch (err: any) {
    throw new Error(`Invalid JWT Payload: ${err?.message || err}`);
  }

  const signatureRaw = parts[2] || '';
  const signatureHex = signatureRaw ? Buffer.from(signatureRaw, 'base64url').toString('hex') : '';

  const humanClaims: Record<string, string> = {};
  for (const field of ['exp', 'iat', 'nbf', 'auth_time']) {
    const val = payload[field];
    if (typeof val === 'number') {
      try {
        humanClaims[field] = new Date(val * 1000).toISOString();
      } catch {
        // Ignore date conversion failure
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

export function formatJwtInspection(inspection: JwtInspection): string {
  const result: Record<string, unknown> = {
    HEADER: inspection.header,
    PAYLOAD: inspection.payload
  };

  if (inspection.humanClaims && Object.keys(inspection.humanClaims).length > 0) {
    result['EXPLANATION / DATES'] = inspection.humanClaims;
  }

  result['SIGNATURE (HEX)'] = inspection.signatureHex;

  return JSON.stringify(result, null, 2);
}
