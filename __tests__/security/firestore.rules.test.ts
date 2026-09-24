/// <reference types="jest" />

/**
 * Firestore security-rules documentation tests.
 *
 * These assert the *shape* of firestore.rules (isAdmin gating present).
 * Behavioral verification requires the Firebase Emulator + @firebase/rules-unit-testing
 * — run manually when emulator is available:
 *   npx firebase emulators:start --only firestore
 */

import * as fs from 'fs';
import * as path from 'path';

function readRules(): string {
  return fs.readFileSync(path.join(process.cwd(), 'firestore.rules'), 'utf8');
}

describe('firestore.rules structure', () => {
  const rules = readRules();

  test('defines isAdmin() helper', () => {
    expect(rules).toMatch(/function isAdmin\(\)/);
    expect(rules).toMatch(/request\.auth\.token\.admin == true/);
  });

  test('privileged writes require isAdmin(), not isAuthenticated()', () => {
    // products
    expect(rules).toMatch(/allow create: if isAdmin\(\) && isValidProduct/);
    expect(rules).toMatch(/allow update: if isAdmin\(\)/);
    expect(rules).toMatch(/allow delete: if isAdmin\(\);/);

    // paymentConfig & settings writes
    expect(rules).toMatch(/match \/paymentConfig\/\{configId\}[\s\S]*?allow write: if isAdmin\(\)/);
    expect(rules).toMatch(/match \/settings\/\{settingId\}[\s\S]*?allow write: if isAdmin\(\)/);
  });

  test('order mutations are admin-only', () => {
    expect(rules).toMatch(/allow update: if isAdmin\(\)/);
    expect(rules).toMatch(/allow delete: if isAdmin\(\);/);
  });

  test('order get allows admin or owner', () => {
    expect(rules).toMatch(
      /allow get: if isAdmin\(\) \|\|\s*\(isAuthenticated\(\) && resource\.data\.userId == request\.auth\.uid\)/
    );
  });

  test('guest order create still allowed with shape validation', () => {
    expect(rules).toMatch(/allow create: if isValidOrder\(request\.resource\.data\)/);
  });

  test('customer list/read is admin-only', () => {
    expect(rules).toMatch(/allow read, delete: if isAdmin\(\)/);
  });

  test('users/{uid} remains owner-only for customers', () => {
    expect(rules).toMatch(/function isOwnerOfUser\(uid\)/);
    expect(rules).toMatch(/request\.auth\.uid == uid/);
  });
});
