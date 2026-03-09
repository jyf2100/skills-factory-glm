import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  generateKeyPair,
  signContent,
  verifySignature,
  createAttestation,
  verifyAttestation
} from './signing.js';

describe('signing', () => {
  let keyPair: { publicKey: string; privateKey: string };

  beforeEach(() => {
    keyPair = generateKeyPair();
  });

  describe('generateKeyPair', () => {
    it('should generate a valid key pair', () => {
      assert.ok(keyPair.publicKey);
      assert.ok(keyPair.privateKey);
    });

    it('should generate different keys each time', () => {
      const keyPair2 = generateKeyPair();
      assert.notStrictEqual(keyPair.publicKey, keyPair2.publicKey);
    });
  });

  describe('signContent', () => {
    it('should sign content', () => {
      const content = 'test content';
      const result = signContent(content, keyPair.privateKey);
      assert.ok(result.signature);
      assert.strictEqual(result.algorithm, 'ed25519');
    });

    it('should produce verifiable signature', () => {
      const content = 'test content';
      const result = signContent(content, keyPair.privateKey);
      const verified = verifySignature(content, result.signature, keyPair.publicKey);
      assert.strictEqual(verified, true);
    });

    it('should fail for tampered content', () => {
      const content = 'original';
      const tampered = 'tampered';
      const result = signContent(content, keyPair.privateKey);
      const verified = verifySignature(tampered, result.signature, keyPair.publicKey);
      assert.strictEqual(verified, false);
    });
  });

  describe('createAttestation', () => {
    it('should create valid attestation', () => {
      const attestation = createAttestation(
        'test-skill',
        '1.0.0',
        'abc123',
        'github.com/owner/repo',
        keyPair.privateKey,
        'admin'
      );
      assert.strictEqual(attestation.skillId, 'test-skill');
      assert.strictEqual(attestation.version, '1.0.0');
    });

    it('should create verifiable attestation', () => {
      const attestation = createAttestation(
        'test-skill',
        '1.0.0',
        'abc123',
        'github.com/owner/repo',
        keyPair.privateKey,
        'admin'
      );
      const verified = verifyAttestation(attestation, keyPair.publicKey);
      assert.strictEqual(verified, true);
    });

    it('should reject tampered attestation', () => {
      const attestation = createAttestation(
        'test-skill',
        '1.0.0',
        'abc123',
        'github.com/owner/repo',
        keyPair.privateKey,
        'admin'
      );
      const tampered = { ...attestation, skillId: 'different' };
      const verified = verifyAttestation(tampered, keyPair.publicKey);
      assert.strictEqual(verified, false);
    });
  });
});
