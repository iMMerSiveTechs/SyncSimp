# RevenueCat Quick Reference

Quick code snippets for common RevenueCat operations in SyncSimp App.

## Configuration

**API Key Location:**
- RevenueCat Dashboard → Apps → [Your iOS App] → "Public app-specific API key" (at the top)
- **Don't use** the secret keys from "API Keys" tab - those are for server-side only!

**Current Key:** `test_WNUpxIRyKaYMMlBWsTvzqFwpLXX`
**Entitlement:** `SyncSimp App Pro`

## Products

| Product | Package ID | Type |
|---------|-----------|------|
| Monthly | `$rc_monthly` | Subscription |
| Yearly | `$rc_annual` | Subscription |
| Lifetime | `$rc_lifetime` | Non-consumable |
| Consumable | `$rc_custom_consumable` | Consumable |

## Essential Code Snippets

### Check if RevenueCat is enabled
```typescript
import { isRevenueCatEnabled } from "@/lib/revenuecatClient";

if (isRevenueCatEnabled()) {
  // Ready to use
}
```

### Check for Pro access
```typescript
import { hasSyncSimpPro } from "@/lib/revenuecatClient";

const result = await hasSyncSimpPro();
if (result.ok && result.data) {
  // Show Pro features
}
```

### Get offerings
```typescript
import { getOfferings } from "@/lib/revenuecatClient";

const result = await getOfferings();
if (result.ok && result.data.current) {
  const packages = result.data.current.availablePackages;
}
```

### Purchase a product
```typescript
import { getPackage, purchasePackage } from "@/lib/revenuecatClient";

// Get monthly subscription
const pkgResult = await getPackage("$rc_monthly");

if (pkgResult.ok && pkgResult.data) {
  const result = await purchasePackage(pkgResult.data);

  if (result.ok) {
    Alert.alert("Success!");
  }
}
```

### Restore purchases
```typescript
import { restorePurchases } from "@/lib/revenuecatClient";

const result = await restorePurchases();
if (result.ok) {
  Alert.alert("Purchases restored!");
}
```

### Show native paywall
```typescript
import { NativePaywall } from "@/components/NativePaywall";
import { useState } from "react";

const [showPaywall, setShowPaywall] = useState(false);

// In JSX:
<NativePaywall
  visible={showPaywall}
  onDismiss={() => setShowPaywall(false)}
  onPurchaseComplete={() => {
    setShowPaywall(false);
    Alert.alert("Welcome to Pro!");
  }}
/>
```

### Show customer center
```typescript
import { CustomerCenter } from "@/components/CustomerCenter";
import { useState } from "react";

const [showCenter, setShowCenter] = useState(false);

// In JSX:
<CustomerCenter
  visible={showCenter}
  onDismiss={() => setShowCenter(false)}
/>
```

### Get customer info
```typescript
import { getCustomerInfo } from "@/lib/revenuecatClient";

const result = await getCustomerInfo();
if (result.ok) {
  console.log("Active entitlements:", result.data.entitlements.active);
}
```

### Check specific entitlement
```typescript
import { hasEntitlement } from "@/lib/revenuecatClient";

const result = await hasEntitlement("SyncSimp App Pro");
if (result.ok && result.data) {
  // User has this entitlement
}
```

### Set user ID (optional - for cross-platform)
```typescript
import { setUserId } from "@/lib/revenuecatClient";

await setUserId("user_12345");
```

## Error Handling

All functions return a `RevenueCatResult`:

```typescript
type RevenueCatResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "web_not_supported" | "not_configured" | "sdk_error"; error?: unknown };
```

**Always check `result.ok` before using `result.data`:**

```typescript
const result = await hasSyncSimpPro();

if (result.ok) {
  // Safe to use result.data
  console.log(result.data);
} else {
  // Handle error
  console.log("Error:", result.reason);
}
```

## Common Patterns

### Protect Pro Features
```typescript
const FeatureScreen = () => {
  const [hasPro, setHasPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPro = async () => {
      const result = await hasSyncSimpPro();
      if (result.ok) {
        setHasPro(result.data);
      }
      setLoading(false);
    };
    checkPro();
  }, []);

  if (loading) return <ActivityIndicator />;
  if (!hasPro) return <UpgradePrompt />;

  return <ProFeature />;
};
```

### Purchase with Loading State
```typescript
const [isPurchasing, setIsPurchasing] = useState(false);

const handlePurchase = async (packageId: string) => {
  setIsPurchasing(true);

  const pkgResult = await getPackage(packageId);
  if (!pkgResult.ok || !pkgResult.data) {
    Alert.alert("Error", "Product not available");
    setIsPurchasing(false);
    return;
  }

  const result = await purchasePackage(pkgResult.data);

  if (result.ok) {
    Alert.alert("Success!", "Purchase complete!");
  } else if (result.reason !== "sdk_error") {
    Alert.alert("Error", "Purchase failed");
  }

  setIsPurchasing(false);
};
```

### Restore on App Launch
```typescript
useEffect(() => {
  const restore = async () => {
    if (isRevenueCatEnabled()) {
      await restorePurchases();
    }
  };
  restore();
}, []);
```

## Files

- **`src/lib/revenuecatClient.ts`** - All SDK functions
- **`src/lib/revenuecatProducts.ts`** - Product constants
- **`src/components/NativePaywall.tsx`** - Paywall component
- **`src/components/CustomerCenter.tsx`** - Customer center component

## Full Documentation

See [REVENUECAT_INTEGRATION_GUIDE.md](./REVENUECAT_INTEGRATION_GUIDE.md) for complete documentation.
