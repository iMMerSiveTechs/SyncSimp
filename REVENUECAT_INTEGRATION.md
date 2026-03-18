# RevenueCat Integration Guide for Onboarding Payments

This guide explains how to integrate RevenueCat payments into the onboarding flow to enable real purchases.

## Prerequisites

✅ RevenueCat is already connected (as indicated by the user)
✅ Onboarding flow is complete with placeholders
✅ Product structure is designed and ready

## Product Setup in RevenueCat

### 1. Subscription Product (Pro Unlimited)

**Product Details:**
- **Product ID**: `com.syncsimp.pro.unlimited` (or use your bundle ID prefix)
- **Type**: Auto-renewable subscription
- **Duration**: 1 month
- **Price**: $19.99/month
- **Entitlement ID**: `pro_unlimited`

**Steps in RevenueCat:**
1. Go to your RevenueCat project
2. Navigate to "Products" tab
3. Click "Add Product"
4. Enter the product ID above
5. Select "Subscription" type
6. Configure pricing in App Store Connect (monthly at $19.99)
7. Create entitlement called "pro_unlimited" and attach this product

### 2. Consumable Product (Per-Sync Credits)

**Product Details:**
- **Product ID**: `com.syncsimp.sync.single`
- **Type**: Consumable
- **Price**: $7.99 per sync

**Optional Bundle Products** (for quantity discounts):
- 5-pack: `com.syncsimp.sync.pack5` - $34.99 (saves $5)
- 10-pack: `com.syncsimp.sync.pack10` - $59.99 (saves $20)

**Steps in RevenueCat:**
1. Go to your RevenueCat project
2. Navigate to "Products" tab
3. Click "Add Product"
4. Enter product ID
5. Select "Consumable" type
6. Configure pricing in App Store Connect

### 3. Create Offering

Create an offering called "onboarding" that includes:
- The Pro Unlimited subscription as the default package
- The per-sync consumable as an alternative

## Code Integration

### Step 1: Install RevenueCat SDK

The RevenueCat SDK (`react-native-purchases`) requires native code, so it needs to be installed through the Vibecode Payments tab or by your developer.

### Step 2: Initialize RevenueCat

In your app startup (likely in `App.tsx` or a hook), initialize RevenueCat:

```typescript
import Purchases from 'react-native-purchases';

// In your app initialization
useEffect(() => {
  const initializeRevenueCat = async () => {
    // Get API key from environment
    const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

    if (apiKey) {
      await Purchases.configure({ apiKey });
      console.log('[RevenueCat] Initialized');
    }
  };

  initializeRevenueCat();
}, []);
```

### Step 3: Update OnboardingUpgradeScreen

Replace the placeholder functions with real purchase logic:

#### For Pro Unlimited Purchase:

```typescript
const handleProPurchase = async () => {
  try {
    // 1. Get offerings
    const offerings = await Purchases.getOfferings();
    const proPackage = offerings.current?.monthly; // or offerings.current?.availablePackages[0]

    if (!proPackage) {
      Alert.alert("Error", "Pro package not available");
      return;
    }

    // 2. Make the purchase
    const { customerInfo } = await Purchases.purchasePackage(proPackage);

    // 3. Check if user has the entitlement
    if (customerInfo.entitlements.active['pro_unlimited']) {
      console.log('[OnboardingUpgrade] Pro purchase successful');

      // 4. Update backend (optional - to track purchases)
      await api.post('/api/user/subscription', {
        type: 'pro_unlimited',
        revenueCatCustomerId: customerInfo.originalAppUserId,
      });

      // 5. Complete onboarding
      completeOnboardingMutation.mutate();
    }
  } catch (error: any) {
    if (error.userCancelled) {
      console.log('[OnboardingUpgrade] User cancelled purchase');
    } else {
      console.error('[OnboardingUpgrade] Purchase error:', error);
      Alert.alert("Purchase Failed", error.message || "Please try again");
    }
  }
};
```

#### For Per-Sync Purchase:

```typescript
const handlePerSyncPurchase = async () => {
  try {
    // Get the product
    const products = await Purchases.getProducts(['com.syncsimp.sync.single']);
    const product = products[0];

    if (!product) {
      Alert.alert("Error", "Product not available");
      return;
    }

    // For multiple syncs, we need to purchase multiple times
    // or create bundle products (5-pack, 10-pack)
    let successfulPurchases = 0;

    for (let i = 0; i < perSyncQuantity; i++) {
      try {
        const { customerInfo } = await Purchases.purchaseStoreProduct(product);
        successfulPurchases++;

        // Update backend to increment sync credits
        await api.post('/api/user/sync-credits/add', {
          quantity: 1,
          revenueCatCustomerId: customerInfo.originalAppUserId,
        });
      } catch (innerError: any) {
        if (innerError.userCancelled) {
          break; // Stop if user cancels
        }
        console.error('[OnboardingUpgrade] Purchase error:', innerError);
      }
    }

    if (successfulPurchases > 0) {
      Alert.alert(
        "Success",
        `Purchased ${successfulPurchases} sync credit${successfulPurchases > 1 ? 's' : ''}!`
      );
      completeOnboardingMutation.mutate();
    }
  } catch (error: any) {
    console.error('[OnboardingUpgrade] Purchase error:', error);
    Alert.alert("Purchase Failed", error.message || "Please try again");
  }
};
```

**Better approach for multiple syncs:**
Create bundle products in RevenueCat/App Store Connect to avoid multiple transactions:
- If user wants 3 syncs, offer a custom bundle
- Or map quantities to predefined bundles (1=single, 5=pack5, 10=pack10)

### Step 4: Create Backend Endpoints

Create backend routes to track purchases:

#### `/api/user/subscription` (POST)
```typescript
// Track subscription purchases
userRouter.post("/subscription", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { type, revenueCatCustomerId } = await c.req.json();

  // Store subscription info in database
  await db.subscription.create({
    data: {
      userId: user.id,
      type,
      revenueCatCustomerId,
      status: 'active',
    }
  });

  return c.json({ success: true });
});
```

#### `/api/user/sync-credits/add` (POST)
```typescript
// Add sync credits to user account
userRouter.post("/sync-credits/add", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { quantity, revenueCatCustomerId } = await c.req.json();

  // Increment user's sync credits
  await db.user.update({
    where: { id: user.id },
    data: {
      syncCredits: { increment: quantity }
    }
  });

  return c.json({ success: true, newBalance: user.syncCredits + quantity });
});
```

#### `/api/user/sync-credits` (GET)
```typescript
// Check user's sync credit balance
userRouter.get("/sync-credits", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  return c.json({ credits: user.syncCredits || 0 });
});
```

### Step 5: Add Database Fields

Update `backend/prisma/schema.prisma`:

```prisma
model User {
  id                    String    @id
  email                 String    @unique
  name                  String?
  emailVerified         Boolean   @default(false)
  image                 String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @default(now()) @updatedAt
  hasCompletedOnboarding Boolean  @default(false)
  syncCredits           Int       @default(1) // Free tier gets 1 credit
  subscriptionType      String?   // 'pro_unlimited' or null
  subscriptionStatus    String?   // 'active', 'expired', 'cancelled'
  revenueCatCustomerId  String?
  Profile               Profile?
  accounts              Account[]
  sessions              Session[]

  @@map("user")
}
```

Run migration:
```bash
cd backend
bunx prisma migrate dev --create-only --name add_payment_fields
bunx prisma migrate deploy
```

## Testing

### Test with Sandbox

1. **Create sandbox test account** in App Store Connect
2. **Sign in with sandbox account** on device
3. **Test purchases** - they won't charge real money
4. **Verify entitlements** are granted correctly
5. **Test restoration** - ensure purchases restore on reinstall

### Important Notes

- RevenueCat handles receipt validation automatically
- Purchases are tied to Apple ID, not your user account
- Use RevenueCat's webhook to sync purchase status to your backend
- Handle purchase restoration on app launch
- Test all edge cases (cancelled purchases, refunds, expired subscriptions)

## Current Status

✅ Onboarding UI complete with pricing options
✅ Per-sync quantity selector working
✅ Backend routes for onboarding completion ready
✅ Integration guide and code comments in place
⏳ RevenueCat SDK needs to be installed
⏳ Purchase handlers need to be implemented
⏳ Backend payment tracking needs to be added

## Next Steps

1. Go to the Vibecode Payments tab and complete RevenueCat setup
2. Install `react-native-purchases` SDK
3. Implement the purchase functions using the code above
4. Create products in RevenueCat dashboard
5. Test with sandbox accounts
6. Deploy and verify in production

---

**Questions?** Check the [RevenueCat Documentation](https://docs.revenuecat.com/) or ask for help!
