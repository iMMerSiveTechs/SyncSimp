# Vibecode Payments Integration Guide

This guide explains how SyncSimp leverages Vibecode's new RevenueCat payment system, and how other Expo app builders can benefit from understanding this integration pattern.

## Overview

Vibecode now has a **Payments tab** that automatically connects your app to RevenueCat. When you set up payments through this tab, Vibecode:

1. Creates a RevenueCat project for your app
2. Sets up a Test Store app (for development testing)
3. Sets up an App Store app (for production)
4. Injects the necessary API keys into your app's environment

## How It Works in Vibecode

### Automatic Setup

When you click "Setup Project" in the Payments tab, Vibecode:

1. **Creates RevenueCat Project** - A new project is created with your app name
2. **Creates Apps** - Both Test Store (for sandbox testing) and App Store apps are created
3. **Injects API Keys** - The following environment variables are automatically set:
   - `EXPO_PUBLIC_VIBECODE_REVENUECAT_TEST_KEY` - For development builds
   - `EXPO_PUBLIC_VIBECODE_REVENUECAT_APPLE_KEY` - For production builds

### RevenueCat Connection (MCP)

Once set up, Vibecode has a direct connection to RevenueCat that allows the AI assistant to:

- Create products, entitlements, and offerings
- Set up packages and pricing
- Configure the entire monetization structure
- All through natural language requests

**You never need to log into RevenueCat directly** - just tell the assistant what pricing structure you want!

## SyncSimp's Integration Pattern

SyncSimp uses a robust pattern that works whether or not RevenueCat is configured:

### 1. RevenueCat Client (`src/lib/revenuecatClient.ts`)

The client gracefully handles all scenarios:

```typescript
// Check if RevenueCat is enabled
const isEnabled = isRevenueCatEnabled();

// All operations return a Result type
const result = await getOfferings();
if (result.ok) {
  // Use result.data
} else {
  // Handle result.reason: 'web_not_supported' | 'not_configured' | 'sdk_error'
}
```

Key features:
- **Non-blocking** - App works perfectly without RevenueCat
- **Web-safe** - Automatically disabled on web platforms
- **Type-safe** - Full TypeScript support with result types
- **Graceful degradation** - Falls back to free plan when not configured

### 2. Product Structure

SyncSimp uses this product structure:

| Product | Type | Price | Package ID |
|---------|------|-------|------------|
| Pro Unlimited | Subscription (Monthly) | $19.99 | `$rc_monthly` |
| Single Sync | Consumable | $7.99 | `$rc_custom_sync_single` |
| 5 Sync Pack | Consumable | $34.99 | `$rc_custom_sync_pack_5` |
| 10 Sync Pack | Consumable | $59.99 | `$rc_custom_sync_pack_10` |

Entitlement: `pro_unlimited` - Granted by Pro subscription

### 3. Purchase Flow

```typescript
// 1. Load offerings on screen mount
const result = await getOfferings();
if (result.ok && result.data.current) {
  const packages = result.data.current.availablePackages;
  // Map packages by identifier
}

// 2. Purchase a package
const purchaseResult = await purchasePackage(selectedPackage);
if (purchaseResult.ok) {
  // Success! Check entitlements if needed
}

// 3. Check entitlements
const hasProResult = await hasEntitlement("pro_unlimited");
if (hasProResult.ok && hasProResult.data) {
  // User has Pro access
}
```

## For Other Expo App Builders

If you're using a different app builder (not Vibecode), here's what you need to know:

### Manual Setup Required

1. **Create RevenueCat Account** at app.revenuecat.com
2. **Create Project** and add your iOS/Android apps
3. **Get API Keys** from Project Settings > API Keys
4. **Set Environment Variables**:
   ```
   EXPO_PUBLIC_REVENUECAT_API_KEY=your_api_key_here
   ```

### Modify revenuecatClient.ts

Update the key detection to match your environment:

```typescript
// For other Expo builders, update these lines:
const testKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
const prodKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
// Or use separate keys for dev/prod:
const apiKey = __DEV__
  ? process.env.EXPO_PUBLIC_REVENUECAT_TEST_KEY
  : process.env.EXPO_PUBLIC_REVENUECAT_PROD_KEY;
```

### Create Products Manually

In RevenueCat dashboard:

1. **Products** - Create products matching your App Store/Play Store products
2. **Entitlements** - Create entitlements for feature access
3. **Offerings** - Create offerings with packages
4. **Attach Products** - Link products to packages and entitlements

## Key Differences: Vibecode vs Manual Setup

| Feature | Vibecode | Other Expo Builders |
|---------|----------|---------------------|
| Project Creation | Automatic | Manual in RevenueCat |
| API Key Injection | Automatic | Manual env vars |
| Product Setup | AI-assisted (tell it what you want) | Manual in dashboard |
| Test Store | Auto-created for sandbox testing | May need App Store sandbox |
| Configuration Changes | Natural language requests | Manual dashboard changes |

## Best Practices

### 1. Always Check if Enabled

```typescript
if (!isRevenueCatEnabled()) {
  // Show appropriate fallback UI
  // Don't show purchase buttons or subscription features
}
```

### 2. Handle All Result States

```typescript
const result = await purchasePackage(pkg);
if (result.ok) {
  // Success
} else if (result.reason === 'web_not_supported') {
  // Show "Purchase on mobile app" message
} else if (result.reason === 'not_configured') {
  // Show "Payments coming soon" message
} else if (result.reason === 'sdk_error') {
  // User cancelled or payment failed
}
```

### 3. Restore Purchases

Always provide a "Restore Purchases" option:

```typescript
const result = await restorePurchases();
if (result.ok) {
  // Check if any entitlements were restored
  const hasProResult = await hasEntitlement("pro_unlimited");
  // Update UI accordingly
}
```

### 4. Sync User Identity

When your user logs in, sync their ID with RevenueCat:

```typescript
await setUserId(user.id);
```

When they log out:

```typescript
await logoutUser();
```

## Testing

### In Vibecode

1. Products work immediately with Test Store
2. Use the app in sandbox mode to test purchases
3. Test Store simulates real purchase flows

### In Other Builders

1. Set up App Store Connect sandbox testers
2. Use TestFlight builds for iOS testing
3. Internal testing tracks for Android

## Summary

SyncSimp demonstrates a robust pattern for integrating RevenueCat that:

- Works seamlessly with Vibecode's automated payment setup
- Degrades gracefully when payments aren't configured
- Provides a great UX for both configured and non-configured states
- Can be adapted for other Expo-based app builders with minimal changes

The key insight is that **Vibecode's Payments tab + AI assistant can replace hours of manual RevenueCat configuration** - you just describe what pricing you want, and it's set up automatically.
