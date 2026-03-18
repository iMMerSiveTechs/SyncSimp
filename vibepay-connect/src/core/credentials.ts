import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

/**
 * Credentials type
 * WARNING: This is stored in plain text for development purposes only.
 * Production version should use secure credential storage (keytar/keychain).
 */
export type SyncSimpCredentials = {
  apple: {
    ascIssuerId: string; // App Store Connect API Issuer ID
    ascKeyId: string; // App Store Connect API Key ID
    ascKeyPath: string; // Path to .p8 file
    iapKeyPath: string; // Path to In-App Purchase .p8 file
  };
  revenuecat: {
    apiKey: string; // RevenueCat project-level API key with write perms
  };
};

const CREDS_FILE = ".vibepay.local.json";

/**
 * Load credentials from local file
 */
export function loadCredentials(projectRoot: string = process.cwd()): SyncSimpCredentials {
  const credsPath = join(projectRoot, CREDS_FILE);

  if (!existsSync(credsPath)) {
    throw new Error(
      `Credentials file not found: ${credsPath}\n\nRun 'vibepay init' to set up your credentials.`
    );
  }

  try {
    const content = readFileSync(credsPath, "utf8");
    const creds = JSON.parse(content) as SyncSimpCredentials;

    validateCredentials(creds);

    return creds;
  } catch (error: any) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in ${CREDS_FILE}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Save credentials to local file
 */
export function saveCredentials(creds: SyncSimpCredentials, projectRoot: string = process.cwd()): void {
  const credsPath = join(projectRoot, CREDS_FILE);

  validateCredentials(creds);

  const content = JSON.stringify(creds, null, 2);
  writeFileSync(credsPath, content, "utf8");
}

/**
 * Validate credentials structure
 */
function validateCredentials(creds: SyncSimpCredentials): void {
  const errors: string[] = [];

  if (!creds.apple?.ascIssuerId) {
    errors.push("apple.ascIssuerId is required");
  }
  if (!creds.apple?.ascKeyId) {
    errors.push("apple.ascKeyId is required");
  }
  if (!creds.apple?.ascKeyPath) {
    errors.push("apple.ascKeyPath is required");
  }
  if (!creds.apple?.iapKeyPath) {
    errors.push("apple.iapKeyPath is required");
  }
  if (!creds.revenuecat?.apiKey) {
    errors.push("revenuecat.apiKey is required");
  }

  if (errors.length > 0) {
    throw new Error(
      `Credential validation failed:\n\n${errors.map((e) => `  • ${e}`).join("\n")}`
    );
  }
}

/**
 * Check if credentials file exists
 */
export function hasCredentials(projectRoot: string = process.cwd()): boolean {
  const credsPath = join(projectRoot, CREDS_FILE);
  return existsSync(credsPath);
}
