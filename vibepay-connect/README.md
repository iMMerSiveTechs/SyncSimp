# VibePay Connect

**Sync simple.** Calm engineering for in-app purchases.

VibePay Connect is a CLI tool that automates the painful process of setting up in-app purchases for iOS apps. It syncs your subscription configuration across Apple App Store Connect, RevenueCat, and your local Expo project from a single YAML file.

## Why VibePay Connect?

Setting up in-app purchases manually involves:
- Creating products in App Store Connect (20+ clicks per product)
- Configuring localizations, pricing, and intro offers
- Setting up RevenueCat entitlements, offerings, and product mappings
- Configuring server notifications
- Testing StoreKit configuration locally

**With VibePay Connect**: Define everything once in `vibepay.yml`, run one command, done.

## Features

- 🎯 **Single Source of Truth**: One `vibepay.yml` file drives everything
- ✨ **Idempotent Sync**: Run multiple times safely - only creates what's missing
- 🔎 **Preflight Checks**: Validates credentials and configuration before syncing
- 🚀 **Automated Setup**:
  - App Store Connect: Subscription groups, products, localizations, pricing
  - RevenueCat: Entitlements, offerings, product mappings
  - Local: Expo configuration helpers
- 🎨 **Calm UX**: Clear, structured output with helpful error messages

## Installation

```bash
npm install -g vibepay-connect
# or
bun install -g vibepay-connect
```

## Quick Start

### 1. Initialize

```bash
vibepay init
```

This interactive wizard will:
- Collect your Apple App Store Connect API credentials
- Collect your RevenueCat API key
- Generate a starter `vibepay.yml` configuration

### 2. Check Setup

```bash
vibepay check
```

Validates:
- Apple API credentials
- App existence in App Store Connect
- Agreements/Tax/Banking status
- RevenueCat project connection
- Configuration file validity

### 3. Sync Everything

```bash
vibepay run
```

Automatically syncs:
- **Apple App Store Connect**: Creates/updates products, localizations, pricing
- **RevenueCat**: Creates entitlements, offerings, maps products
- **Local Project**: Generates StoreKit test configuration

## Configuration

### vibepay.yml Schema

```yaml
version: 1

app:
  name: My App
  bundleId: com.company.myapp
  platform: ios

apple:
  subscriptionGroup:
    referenceName: premium
    id: premium
  locales:
    - id: en-US
      name: Premium Access
      description: Full access to all premium features
  review:
    notes: Standard subscription
    supportUrl: https://myapp.com/support
    privacyPolicyUrl: https://myapp.com/privacy

revenuecat:
  projectId: your-project-id
  iosAppId: app1234567890

entitlements:
  - id: premium
    displayName: Premium
    description: Full access to all features

plans:
  - id: pro_monthly
    displayName: Pro Monthly
    store: ios
    type: auto_renewable
    appleProductId: com.myapp.pro.monthly
    entitlement: premium
    duration: P1M  # ISO 8601 duration
    price:
      currency: USD
      amount: 9.99
    introOffer:
      type: free_trial
      duration: P7D  # 7-day free trial
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
```

### Configuration Reference

#### `app`
- `name`: Your app name
- `bundleId`: iOS bundle identifier (must match App Store Connect)
- `platform`: Currently only `"ios"` supported

#### `apple.subscriptionGroup`
- `referenceName`: Internal reference name
- `id`: Subscription group identifier

#### `apple.locales`
Array of localizations:
- `id`: Locale code (e.g., `en-US`, `fr-FR`)
- `name`: Display name for the product
- `subtitle`: (Optional) Subtitle
- `description`: Full description

#### `plans`
Array of in-app purchase products:
- `id`: Internal identifier
- `displayName`: Human-readable name
- `store`: `"ios"` (Android support coming)
- `type`: `"auto_renewable"` | `"non_consumable"` | `"consumable"`
- `appleProductId`: Product ID in App Store Connect
- `entitlement`: Reference to entitlement ID
- `duration`: ISO 8601 duration (e.g., `P1M` = 1 month, `P1Y` = 1 year)
- `price.currency`: ISO 4217 currency code
- `price.amount`: Price amount
- `introOffer`: (Optional) Intro offer configuration
- `rc.offering`: RevenueCat offering ID
- `rc.packageId`: RevenueCat package identifier

#### `offerings`
Array of RevenueCat offerings:
- `id`: Offering identifier
- `displayName`: Human-readable name
- `description`: (Optional) Description
- `primary`: Exactly one must be `true`
- `packages`: Array of `{ planId }` references

## Prerequisites

### Apple App Store Connect
1. **Developer Account**: Enrolled in Apple Developer Program ($99/year)
2. **App Created**: App must exist in App Store Connect
3. **API Key**:
   - Go to App Store Connect → Users and Access → Keys
   - Create new key with "Admin" or "Developer" role
   - Download `.p8` file (save securely)
   - Note Issuer ID and Key ID
4. **In-App Purchase Key**:
   - Same location, create separate key for In-App Purchases
   - Download `.p8` file
5. **Agreements Complete**: Paid Apps agreement signed, tax/banking info submitted

### RevenueCat
1. **Account**: Free account at [revenuecat.com](https://www.revenuecat.com)
2. **Project Created**: Set up a project for your app
3. **iOS App Added**: Add iOS app to project
4. **API Key**: Generate a project-level API key with **write permissions**
   - Settings → API Keys → Create New Key
   - Copy the secret key (won't be shown again)

## Security

⚠️ **Important**: Credentials are currently stored in `.vibepay.local.json` in **plain text**. This is for development only.

**Protect your credentials**:
- Add `.vibepay.local.json` to `.gitignore` (done automatically)
- Never commit credential files
- Use strong file permissions (`chmod 600 .vibepay.local.json`)

**Future versions** will use secure credential storage (OS keychain).

## Commands

### `vibepay init`
Interactive setup wizard. Creates `.vibepay.local.json` and starter `vibepay.yml`.

### `vibepay check`
Run preflight diagnostics:
- Validates credentials
- Checks app existence
- Verifies RevenueCat connection
- Validates configuration file

### `vibepay run`
Idempotent sync:
1. Syncs App Store Connect (products, pricing, localizations)
2. Configures RevenueCat (entitlements, offerings, mappings)
3. Updates local project configuration

## Limitations & Roadmap

### Current Limitations
- **iOS only** (Android support planned)
- **Price tiers**: Simplified - manual verification recommended
- **Server notifications**: Manual configuration required
- **Credentials**: Stored in plain text (secure storage coming)
- **Apple API**: Some endpoints may be read-only (testing required)

### Roadmap
- [ ] Secure credential storage (keychain integration)
- [ ] Android/Google Play support
- [ ] Price tier auto-mapping
- [ ] StoreKit configuration file generation
- [ ] Expo config plugin integration
- [ ] Promotional offers support
- [ ] Test mode / dry-run

## Troubleshooting

### "API key is invalid"
- Verify your `.p8` file path is correct
- Check Issuer ID and Key ID match App Store Connect
- Ensure key hasn't been revoked

### "App not found"
- Verify `bundleId` matches exactly (case-sensitive)
- Ensure app exists in App Store Connect
- Check you're using the correct Apple Developer account

### "Agreements not complete"
- Sign Paid Apps agreement in App Store Connect
- Complete tax forms
- Add banking information

## Contributing

VibePay Connect is built for the Vibecode platform but can be used standalone.

## License

MIT

## Support

- Issues: [GitHub Issues](https://github.com/vibecode/vibepay-connect/issues)
- Docs: [docs.vibecode.com](https://docs.vibecode.com)

---

**Made with ✨ by Vibecode** – The best and first AI app builder
