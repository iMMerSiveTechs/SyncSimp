import inquirer from 'inquirer';
import { writeFileSync } from 'fs';
import yaml from 'js-yaml';
import { saveCredentials } from '../core/credentials.js';
import { generateStarterConfig } from '../core/config.js';
import * as logger from '../ui/logger.js';
import { phase } from '../ui/spinners.js';
import * as apple from '../core/apple.js';
import * as revenuecat from '../core/revenuecat.js';

export async function initCommand(): Promise<void> {
  logger.summaryBox([
    'Let\'s set up automation for your in-app purchases.',
    '',
    'We\'ll connect Apple App Store Connect, RevenueCat,',
    'and generate your syncsimp.yml configuration file.'
  ]);

  logger.heading('App Configuration');

  const appAnswers = await inquirer.prompt([
    {
      type: 'input',
      name: 'bundleId',
      message: 'Bundle ID (e.g. com.company.app):',
      validate: (input: string) => input.length > 0 || 'Bundle ID is required'
    },
    {
      type: 'input',
      name: 'appName',
      message: 'App name:',
      default: (answers: any) => answers.bundleId
    },
    {
      type: 'input',
      name: 'subscriptionGroup',
      message: 'Subscription group ID:',
      default: 'premium'
    }
  ]);

  logger.heading('Apple App Store Connect');

  const appleAnswers = await inquirer.prompt([
    {
      type: 'input',
      name: 'ascKeyPath',
      message: 'Path to App Store Connect API key (.p8):',
      validate: (input: string) => input.length > 0 || 'Key path is required'
    },
    {
      type: 'input',
      name: 'ascIssuerId',
      message: 'Issuer ID:',
      validate: (input: string) => input.length > 0 || 'Issuer ID is required'
    },
    {
      type: 'input',
      name: 'ascKeyId',
      message: 'Key ID:',
      validate: (input: string) => input.length > 0 || 'Key ID is required'
    },
    {
      type: 'input',
      name: 'iapKeyPath',
      message: 'Path to In-App Purchase API key (.p8):',
      validate: (input: string) => input.length > 0 || 'IAP key path is required'
    }
  ]);

  logger.heading('RevenueCat');

  const rcAnswers = await inquirer.prompt([
    {
      type: 'input',
      name: 'rcApiKey',
      message: 'RevenueCat API key:',
      validate: (input: string) => input.length > 0 || 'API key is required'
    },
    {
      type: 'input',
      name: 'rcProjectId',
      message: 'RevenueCat project ID:',
      validate: (input: string) => input.length > 0 || 'Project ID is required'
    },
    {
      type: 'input',
      name: 'rcIosAppId',
      message: 'RevenueCat iOS app ID:',
      validate: (input: string) => input.length > 0 || 'iOS app ID is required'
    }
  ]);

  logger.blank();

  // Validate credentials
  const spinner = phase('Validating credentials...');
  spinner.start();

  try {
    const appleCreds = {
      ascIssuerId: appleAnswers.ascIssuerId,
      ascKeyId: appleAnswers.ascKeyId,
      ascKeyPath: appleAnswers.ascKeyPath,
      iapKeyPath: appleAnswers.iapKeyPath
    };

    const appleValid = await apple.checkAppleCredentials(appleCreds);
    if (!appleValid) {
      spinner.fail('Apple credentials invalid');
      throw new Error('Apple App Store Connect credentials are invalid');
    }
    spinner.text = 'Apple credentials valid ✓';

    const rcValid = await revenuecat.checkRevenueCatCredentials({ apiKey: rcAnswers.rcApiKey });
    if (!rcValid) {
      spinner.fail('RevenueCat credentials invalid');
      throw new Error('RevenueCat API key is invalid');
    }
    spinner.succeed('Credentials validated');
  } catch (error) {
    spinner.fail('Validation failed');
    logger.error((error as Error).message);
    process.exit(1);
  }

  // Save credentials
  saveCredentials({
    apple: {
      ascIssuerId: appleAnswers.ascIssuerId,
      ascKeyId: appleAnswers.ascKeyId,
      ascKeyPath: appleAnswers.ascKeyPath,
      iapKeyPath: appleAnswers.iapKeyPath
    },
    revenuecat: {
      apiKey: rcAnswers.rcApiKey
    }
  });

  logger.success('Credentials saved to .syncsimp.local.json');

  // Generate starter config
  const config = generateStarterConfig(appAnswers.bundleId, appAnswers.appName, appAnswers.subscriptionGroup);

  // Update RevenueCat IDs
  config.revenuecat.projectId = rcAnswers.rcProjectId;
  config.revenuecat.iosAppId = rcAnswers.rcIosAppId;

  const yamlContent = yaml.dump(config, { indent: 2, lineWidth: 120 });
  writeFileSync('syncsimp.yml', yamlContent, 'utf8');

  logger.success('Generated syncsimp.yml');

  logger.nextSteps([
    'Review and edit your plans in syncsimp.yml',
    'Run `syncsimp check` to audit your setup',
    'Run `syncsimp run` to sync with Apple and RevenueCat'
  ]);
}
