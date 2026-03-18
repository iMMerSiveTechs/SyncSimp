# RevenueCat Integration Guide for SyncSimp App

Complete guide for integrating RevenueCat SDK into your SyncSimp App with Expo.

## Table of Contents

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Product Setup](#product-setup)
4. [Implementation](#implementation)
5. [Testing](#testing)
6. [Best Practices](#best-practices)

---

## Installation

The RevenueCat SDK is already installed in this project:

```bash
# Already installed via:
npx expo install react-native-purchases react-native-purchases-ui
```

**Dependencies:**
- `react-native-purchases@^9.6.7` - Core SDK
- `react-native-purchases-ui@^9.6.7` - Pre-built paywall and customer center UI

---

## Configuration

### 1. API Key Setup

**Where to Find Your API Key:**

1. Go to RevenueCat Dashboard → Your Project
2. Click "Apps" in the left sidebar
3. Click on your iOS app
4. You'll see "Public app-specific API key" at the top - **copy this key**

**Note:** Don't use the secret keys from the "API Keys" tab in the left menu - those are for server-to-server API calls. The SDK needs the **public app-specific key** shown in your app's settings.

Your API key is configured in `src/lib/revenuecatClient.ts`:

```typescript
const testKey = "test_WNUpxIRyKaYMMlBWsTvzqFwpLXX"; // Your test key (or app-specific key)
```

The SDK automatically uses the test key in development (`__DEV__` mode) and the production key in release builds.

**For Your App:**
- Replace `test_WNUpxIRyKaYMMlBWsTvzqFwpLXX` with your actual public app-specific API key
- Or set it via the Payments tab in Vibecode (recommended)

### 2. Entitlement Configuration

**Primary Entitlement:** `SyncSimp App Pro`

This entitlement grants access to Pro features when a user subscribes.

---

## Product Setup

### Products Configured

Your app supports 4 product types:

| Product | Identifier | Package ID | Type | Entitlement |
|---------|-----------|------------|------|-------------|
| **Monthly** | `monthly` | `$rc_monthly` | Subscription | SyncSimp App Pro |
| **Yearly** | `yearly` | `$rc_annual` | Subscription | SyncSimp App Pro |
| **Lifetime** | `lifetime` | `$rc_lifetime` | Non-consumable | SyncSimp App Pro |
| **Consumable** | `consumable` | `$rc_custom_consumable` | Consumable | - |

### RevenueCat Dashboard Setup

1. **Create a Project** in RevenueCat (if you haven't already)
2. **Add an iOS App:**
   - Go to your project
   - Click "Apps" in the left sidebar
   - Click "+ New" to add an app
   - Select "Apple App Store" as the platform
   - Enter your app's Bundle ID (e.g., `com.nemurium.syncsimp.app`)
   - **Your public API key is automatically generated for this app**
3. **Get Your API Key:**
   - Click on your iOS app in the "Apps" section
   - You'll see "Public app-specific API key" at the top
   - Copy this key - this is what you use in the SDK (not the secret keys from the API Keys tab!)
4. **Create Entitlement** named `SyncSimp App Pro`
   - Go to "Entitlements" in the left sidebar
   - Click "+ New"
   - Enter identifier: `SyncSimp App Pro`
5. **Create Products:**
   - Go to "Products" in the left sidebar
   - Create your 4 products (Monthly, Yearly, Lifetime, Consumable)
   - Match the store product IDs to your App Store Connect products
6. **Attach Products** to the entitlement:
   - Open the `SyncSimp App Pro` entitlement
   - Click "Attach" and select Monthly, Yearly, and Lifetime products
7. **Create Offering:**
   - Go to "Offerings" in the left sidebar
   - Create a new offering
   - Add packages using the Package IDs above
8. **Set as Current Offering**

---

## Implementation

### Basic Usage

#### 1. Check RevenueCat Status

```typescript
import { isRevenueCatEnabled } from "@/lib/revenuecatClient";

if (isRevenueCatEnabled()) {
  // RevenueCat is configured
} else {
  // RevenueCat not configured
}
```

#### 2. Check for Pro Access

```typescript
import { hasSyncSimpPro } from "@/lib/revenuecatClient";

const checkProAccess = async () => {
  const result = await hasSyncSimpPro();

  if (result.ok && result.data) {
    // User has Pro access
    console.log("User is a Pro member!");
  } else {
    // User doesn't have Pro
    console.log("User is on free plan");
  }
};
```

#### 3. Get Customer Info

```typescript
import { getCustomerInfo } from "@/lib/revenuecatClient";

const loadCustomerInfo = async () => {
  const result = await getCustomerInfo();

  if (result.ok) {
    const customerInfo = result.data;
    console.log("Active entitlements:", customerInfo.entitlements.active);
    console.log("Latest expiration:", customerInfo.latestExpirationDate);
  }
};
```

#### 4. Get Available Offerings

```typescript
import { getOfferings } from "@/lib/revenuecatClient";

const loadProducts = async () => {
  const result = await getOfferings();

  if (result.ok && result.data.current) {
    const packages = result.data.current.availablePackages;

    packages.forEach((pkg) => {
      console.log(`${pkg.identifier}: ${pkg.product.priceString}`);
    });
  }
};
```

#### 5. Purchase a Package

```typescript
import { purchasePackage, getPackage } from "@/lib/revenuecatClient";

const purchaseMonthly = async () => {
  // Get the monthly package
  const packageResult = await getPackage("$rc_monthly");

  if (packageResult.ok && packageResult.data) {
    // Purchase it
    const purchaseResult = await purchasePackage(packageResult.data);

    if (purchaseResult.ok) {
      Alert.alert("Success!", "You're now a Pro member!");
    } else {
      console.log("Purchase failed:", purchaseResult.reason);
    }
  }
};
```

#### 6. Restore Purchases

```typescript
import { restorePurchases } from "@/lib/revenuecatClient";

const restore = async () => {
  const result = await restorePurchases();

  if (result.ok) {
    Alert.alert("Restored!", "Your purchases have been restored.");
  } else {
    Alert.alert("Error", "Unable to restore purchases.");
  }
};
```

### Advanced Usage

#### Present Native Paywall

```typescript
import { NativePaywall } from "@/components/NativePaywall";

function MyScreen() {
  const [showPaywall, setShowPaywall] = useState(false);

  return (
    <>
      <Button title="Upgrade to Pro" onPress={() => setShowPaywall(true)} />

      <NativePaywall
        visible={showPaywall}
        onDismiss={() => setShowPaywall(false)}
        onPurchaseComplete={() => {
          setShowPaywall(false);
          Alert.alert("Welcome to Pro!");
        }}
      />
    </>
  );
}
```

#### Present Customer Center

```typescript
import { CustomerCenter } from "@/components/CustomerCenter";

function SettingsScreen() {
  const [showCustomerCenter, setShowCustomerCenter] = useState(false);

  return (
    <>
      <Button
        title="Manage Subscription"
        onPress={() => setShowCustomerCenter(true)}
      />

      <CustomerCenter
        visible={showCustomerCenter}
        onDismiss={() => setShowCustomerCenter(false)}
      />
    </>
  );
}
```

#### Check Specific Entitlement

```typescript
import { hasEntitlement } from "@/lib/revenuecatClient";

const checkAccess = async () => {
  const result = await hasEntitlement("SyncSimp App Pro");

  if (result.ok && result.data) {
    // User has Pro entitlement
  } else if (result.ok) {
    // User doesn't have Pro
  } else {
    // Error checking entitlement
    console.log("Error:", result.reason);
  }
};
```

#### Set User ID (for cross-platform tracking)

```typescript
import { setUserId } from "@/lib/revenuecatClient";

const loginUser = async (userId: string) => {
  const result = await setUserId(userId);

  if (result.ok) {
    console.log("User ID set successfully");
  }
};
```

---

## Testing

### Test Store (Sandbox) Testing

1. Use your test API key: `test_WNUpxIRyKaYMMlBWsTvzqFwpLXX`
2. RevenueCat Test Store allows testing without App Store Connect
3. Products work immediately without Apple review

### iOS Sandbox Testing

1. Create a sandbox test user in App Store Connect
2. Sign out of your Apple ID on device
3. When making a purchase, sign in with sandbox account
4. You can test subscriptions without actual charges

### Testing Checklist

- [ ] RevenueCat initializes without errors
- [ ] Offerings load successfully
- [ ] Products display with correct prices
- [ ] Purchase flow completes
- [ ] Entitlements grant correctly after purchase
- [ ] Restore purchases works
- [ ] Customer Center loads (iOS)
- [ ] Subscription management works
- [ ] Cross-platform user tracking (if using setUserId)

---

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```typescript
const result = await getOfferings();

if (!result.ok) {
  switch (result.reason) {
    case "web_not_supported":
      // Handle web platform
      break;
    case "not_configured":
      // RevenueCat not set up
      break;
    case "sdk_error":
      // SDK error occurred
      console.log(result.error);
      break;
  }
}
```

### 2. Check Before Purchase

```typescript
const purchase = async () => {
  if (!isRevenueCatEnabled()) {
    Alert.alert("Not Available", "Purchases are not available yet.");
    return;
  }

  // Proceed with purchase
};
```

### 3. Handle User Cancellation

```typescript
const result = await purchasePackage(package);

if (!result.ok && result.reason === "sdk_error") {
  // User likely cancelled - don't show error
  return;
}
```

### 4. Verify Entitlements After Purchase

```typescript
const result = await purchasePackage(package);

if (result.ok) {
  // Double-check entitlement was granted
  const proResult = await hasSyncSimpPro();

  if (proResult.ok && proResult.data) {
    // Confirmed Pro access
  }
}
```

### 5. Restore on App Launch

```typescript
useEffect(() => {
  const restoreOnLaunch = async () => {
    if (isRevenueCatEnabled()) {
      await restorePurchases();
    }
  };

  restoreOnLaunch();
}, []);
```

### 6. Provide Restore Option

Always give users a way to restore purchases:

```typescript
<Button title="Restore Purchases" onPress={handleRestore} />
```

---

## Files Reference

### Core Files

- **`src/lib/revenuecatClient.ts`** - Main SDK wrapper with all functions
- **`src/lib/revenuecatProducts.ts`** - Product configurations and constants
- **`src/components/NativePaywall.tsx`** - Pre-built paywall component
- **`src/components/CustomerCenter.tsx`** - Customer center component

### Helper Functions

| Function | Purpose |
|----------|---------|
| `isRevenueCatEnabled()` | Check if SDK is configured |
| `hasSyncSimpPro()` | Check for Pro entitlement |
| `hasEntitlement(id)` | Check any entitlement |
| `hasActiveSubscription()` | Check if user has any active subscription |
| `getOfferings()` | Get available products |
| `getPackage(id)` | Get specific package |
| `purchasePackage(pkg)` | Make a purchase |
| `restorePurchases()` | Restore previous purchases |
| `getCustomerInfo()` | Get customer info and entitlements |
| `setUserId(id)` | Set user ID for cross-platform tracking |
| `logoutUser()` | Log out user |

---

## Troubleshooting

### Products Not Loading

1. **Verify API key is correct:**
   - Make sure you're using the **public app-specific API key** from your app's settings
   - NOT the secret keys from the "API Keys" tab (those are for server-side only)
   - Go to: RevenueCat Dashboard → Apps → [Your iOS App] → Copy the public key at the top
2. Check RevenueCat dashboard has offerings configured
3. Ensure offering is set as "Current"
4. Check console logs for errors
5. Verify your iOS app is properly set up in RevenueCat with your correct Bundle ID

### Purchases Not Completing

1. Test with sandbox account on real device
2. Verify products exist in App Store Connect
3. Check RevenueCat product IDs match App Store Connect
4. Ensure app bundle ID matches

### Entitlements Not Granting

1. Verify products are attached to entitlement in RevenueCat
2. Check entitlement identifier matches exactly: `SyncSimp App Pro`
3. Try restoring purchases
4. Check RevenueCat dashboard for the customer

---

## Additional Resources

- [RevenueCat Documentation](https://www.revenuecat.com/docs)
- [RevenueCat Expo Guide](https://www.revenuecat.com/docs/getting-started/installation/expo)
- [Paywall Documentation](https://www.revenuecat.com/docs/tools/paywalls)
- [Customer Center Documentation](https://www.revenuecat.com/docs/tools/customer-center)
- [RevenueCat Dashboard](https://app.revenuecat.com)

---

**Last Updated:** 2025-12-08
**SDK Version:** 9.6.7
**Integration Status:** ✅ Complete
