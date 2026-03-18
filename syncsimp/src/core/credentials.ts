import { readFileSync, writeFileSync } from 'fs';

/**
 * ⚠️ WARNING: This credential storage is NOT SECURE.
 * Credentials are stored in plain text JSON.
 * This is for development/testing only.
 *
 * Future versions will use secure OS keychain storage (keytar/keychain).
 *
 * DO NOT commit .syncsimp.local.json to version control.
 */

export type SyncSimpCredentials = {
  apple: {
    ascIssuerId: string;
    ascKeyId: string;
    ascKeyPath: string;  // path to .p8
    iapKeyPath: string;  // path to .p8 In-App Purchase key
  };
  revenuecat: {
    apiKey: string;      // project-level API key with write perms
  };
};

const CREDS_FILE = '.syncsimp.local.json';

export function loadCredentials(credsPath = CREDS_FILE): SyncSimpCredentials {
  try {
    const fileContent = readFileSync(credsPath, 'utf8');
    const creds = JSON.parse(fileContent) as SyncSimpCredentials;

    // Validate required fields
    if (!creds.apple?.ascIssuerId) {
      throw new Error('Missing required credential: apple.ascIssuerId');
    }
    if (!creds.apple?.ascKeyId) {
      throw new Error('Missing required credential: apple.ascKeyId');
    }
    if (!creds.apple?.ascKeyPath) {
      throw new Error('Missing required credential: apple.ascKeyPath');
    }
    if (!creds.apple?.iapKeyPath) {
      throw new Error('Missing required credential: apple.iapKeyPath');
    }
    if (!creds.revenuecat?.apiKey) {
      throw new Error('Missing required credential: revenuecat.apiKey');
    }

    return creds;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(
        `Credentials file not found: ${credsPath}\n` +
        'Run `syncsimp init` to create your credentials file.'
      );
    }
    throw error;
  }
}

export function saveCredentials(creds: SyncSimpCredentials, credsPath = CREDS_FILE): void {
  const json = JSON.stringify(creds, null, 2);
  writeFileSync(credsPath, json, 'utf8');
}
