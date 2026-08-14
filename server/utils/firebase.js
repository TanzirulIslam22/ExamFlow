import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { ApiError } from '../middleware/error.js';

const CERT_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
const certsCache = { certs: null, fetchedAt: 0 };
const CACHE_MS = 12 * 60 * 60 * 1000;

async function getCerts() {
  if (certsCache.certs && Date.now() - certsCache.fetchedAt < CACHE_MS) return certsCache.certs;
  const res = await fetch(CERT_URL);
  if (!res.ok) throw new ApiError(500, 'Could not fetch Firebase certificate keys');
  certsCache.certs = await res.json();
  certsCache.fetchedAt = Date.now();
  return certsCache.certs;
}

export async function verifyFirebaseToken(idToken) {
  if (!config.firebaseProjectId) throw new ApiError(400, 'Firebase login is not configured on this server');

  let header;
  try {
    header = JSON.parse(Buffer.from(idToken.split('.')[0], 'base64url').toString());
  } catch {
    throw new ApiError(401, 'Invalid Firebase token');
  }

  const certs = await getCerts();
  const cert = certs[header.kid];
  if (!cert) throw new ApiError(401, 'Unable to find matching Firebase key');

  let decoded;
  try {
    decoded = jwt.verify(idToken, cert, {
      algorithms: ['RS256'],
      audience: config.firebaseProjectId,
      issuer: `https://securetoken.google.com/${config.firebaseProjectId}`,
    });
  } catch {
    throw new ApiError(401, 'Invalid or expired Firebase session');
  }

  return decoded;
}

export function normalizePhone(p) {
  let digits = String(p || '').replace(/[^\d]/g, '');
  if (digits.length === 13 && digits.startsWith('880')) digits = '0' + digits.slice(3);
  if (digits.length === 12 && digits.startsWith('880')) digits = '0' + digits.slice(3);
  return digits;
}
