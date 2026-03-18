import inquirer from "inquirer";
import { saveCredentials, SyncSimpCredentials } from "../core/credentials.js";
import { writeFileSync } from "fs";
import * as logger from "../ui/logger.js";
import { icons } from "../ui/theme.js";

/**
 * Interactive setup wizard
 */
export async function init(): Promise<void> {
  logger.summaryBox("✨ VibePay Connect", [
    "Let's set up automation for your in-app purchases.",
    "We'll connect Apple, RevenueCat, and generate vibepay.yml.",
  ]);

  logger.heading("App Information");

  const appAnswers = await inquirer.prompt([
    {
      type: "input",
      name: "bundleId",
      message: "Bundle ID:",
      validate: (input) => (input.length > 0 ? true : "Bundle ID is required"),
    },
    {
      type: "input",
      name: "appName",
      message: "App name:",
      validate: (input) => (input.length > 0 ? true : "App name is required"),
    },
    {
      type: "input",
      name: "subscriptionGroupId",
      message: "Subscription group ID:",
      default: "premium",
    },
  ]);

  logger.heading("Apple App Store Connect");

  const appleAnswers = await inquirer.prompt([
    {
      type: "input",
      name: "ascKeyPath",
      message: "App Store Connect API .p8 key path:",
      validate: (input) => (input.length > 0 ? true : "Key path is required"),
    },
    {
      type: "input",
      name: "ascIssuerId",
      message: "App Store Connect Issuer ID:",
      validate: (input) => (input.length > 0 ? true : "Issuer ID is required"),
    },
    {
      type: "input",
      name: "ascKeyId",
      message: "App Store Connect Key ID:",
      validate: (input) => (input.length > 0 ? true : "Key ID is required"),
    },
    {
      type: "input",
      name: "iapKeyPath",
      message: "In-App Purchase API .p8 key path:",
      validate: (input) => (input.length > 0 ? true : "IAP key path is required"),
    },
  ]);

  logger.heading("RevenueCat");

  const rcAnswers = await inquirer.prompt([
    {
      type: "input",
      name: "rcProjectId",
      message: "RevenueCat Project ID:",
      validate: (input) => (input.length > 0 ? true : "Project ID is required"),
    },
    {
      type: "input",
      name: "rcIosAppId",
      message: "RevenueCat iOS App ID:",
      validate: (input) => (input.length > 0 ? true : "iOS App ID is required"),
    },
    {
      type: "input",
      name: "rcApiKey",
      message: "RevenueCat API Key (with write permissions):",
      validate: (input) => (input.length > 0 ? true : "API Key is required"),
    },
  ]);

  // Save credentials
  const creds: SyncSimpCredentials = {
    apple: {
      ascIssuerId: appleAnswers.ascIssuerId,
      ascKeyId: appleAnswers.ascKeyId,
      ascKeyPath: appleAnswers.ascKeyPath,
      iapKeyPath: appleAnswers.iapKeyPath,
    },
    revenuecat: {
      apiKey: rcAnswers.rcApiKey,
    },
  };

  saveCredentials(creds);
  logger.success("Credentials saved to .vibepay.local.json");

  // Generate starter vibepay.yml
  const starterConfig = `version: 1

app:
  name: ${appAnswers.appName}
  bundleId: ${appAnswers.bundleId}
  platform: ios

apple:
  subscriptionGroup:
    referenceName: ${appAnswers.subscriptionGroupId}
    id: ${appAnswers.subscriptionGroupId}
  locales:
    - id: en-US
      name: Premium Access
      description: Full access to all premium features
  review:
    notes: Standard subscription for premium features
    supportUrl: https://example.com/support
    privacyPolicyUrl: https://example.com/privacy

revenuecat:
  projectId: ${rcAnswers.rcProjectId}
  iosAppId: ${rcAnswers.rcIosAppId}

entitlements:
  - id: premium
    displayName: Premium
    description: Full access to all features

plans:
  - id: pro_monthly
    displayName: Pro Monthly
    store: ios
    type: auto_renewable
    appleProductId: pro.monthly
    entitlement: premium
    duration: P1M
    price:
      currency: USD
      amount: 9.99
    rc:
      offering: default
      packageId: monthly

offerings:
  - id: default
    displayName: Default Offering
    description: Main subscription offering
    primary: true
    packages:
      - planId: pro_monthly
`;

  writeFileSync("vibepay.yml", starterConfig, "utf8");
  logger.success("Generated vibepay.yml");

  logger.line();
  logger.line(icons.sparkle + " Setup complete!");
  logger.line();

  logger.nextSteps([
    "Review and edit your plans in vibepay.yml",
    "Run 'vibepay check' to audit your setup",
    "Run 'vibepay run' to sync with Apple and RevenueCat",
  ]);
}
