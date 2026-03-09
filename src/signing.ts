/**
 * Signing module for skill verification
 *
 * Uses Ed25519 for digital signatures
 */

import crypto from 'node:crypto';

export interface KeyPair {
  publicKey: string;  // hex encoded
  privateKey: string; // hex encoded
}

export interface SignatureResult {
  signature: string;  // hex encoded
  algorithm: string;
  timestamp: string;
}

/**
 * Generate a new Ed25519 key pair
 */
export function generateKeyPair(): KeyPair {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');

  return {
    publicKey: publicKey.export({ type: 'spki', format: 'der' }).toString('hex'),
    privateKey: privateKey.export({ type: 'pkcs8', format: 'der' }).toString('hex'),
  };
}

/**
 * Sign content with a private key
 */
export function signContent(content: string, privateKeyHex: string): SignatureResult {
  const privateKey = crypto.createPrivateKey({
    key: Buffer.from(privateKeyHex, 'hex'),
    format: 'der',
    type: 'pkcs8',
  });

  const signature = crypto.sign(null, Buffer.from(content), privateKey);

  return {
    signature: signature.toString('hex'),
    algorithm: 'ed25519',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Verify a signature with a public key
 */
export function verifySignature(
  content: string,
  signatureHex: string,
  publicKeyHex: string
): boolean {
  try {
    const publicKey = crypto.createPublicKey({
      key: Buffer.from(publicKeyHex, 'hex'),
      format: 'der',
      type: 'spki',
    });

    const signature = Buffer.from(signatureHex, 'hex');

    return crypto.verify(null, Buffer.from(content), publicKey, signature);
  } catch {
    return false;
  }
}

/**
 * Create a skill attestation (signed manifest)
 */
export interface SkillAttestation {
  skillId: string;
  version: string;
  contentHash: string;
  source: string;
  signature: SignatureResult;
  signedBy: string;
  timestamp: string;
}

export function createAttestation(
  skillId: string,
  version: string,
  contentHash: string,
  source: string,
  privateKeyHex: string,
  signedBy: string
): SkillAttestation {
  const payload = JSON.stringify({ skillId, version, contentHash, source });
  const signature = signContent(payload, privateKeyHex);

  return {
    skillId,
    version,
    contentHash,
    source,
    signature,
    signedBy,
    timestamp: new Date().toISOString(),
  };
}

export function verifyAttestation(
  attestation: SkillAttestation,
  publicKeyHex: string
): boolean {
  const payload = JSON.stringify({
    skillId: attestation.skillId,
    version: attestation.version,
    contentHash: attestation.contentHash,
    source: attestation.source,
  });

  return verifySignature(payload, attestation.signature.signature, publicKeyHex);
}
