# RevenueCat Setup Guide for SyncSimp

## Step-by-Step Instructions

### 1. Create Your RevenueCat Project
1. Go to app.revenuecat.com
2. Create a new project called "SyncSimp"
3. Note your **Project ID** (you'll need this later)

### 2. Add Your iOS App
1. Click "Apps" in the sidebar
2. Add new app → Select "iOS"
3. Enter your Bundle ID: `com.YourCompany.SyncSimp` (replace with your actual Bundle ID)
4. Note your **iOS App ID** (you'll need this later)

### 3. Create Products in App Store Connect FIRST

Before setting up RevenueCat, create these products in App Store Connect:

**Product IDs to create:**
- `com.yourcompany.syncsimp.pro.unlimited` (subscription)
- `com.yourcompany.syncsimp.sync.single` (consumable)
- `com.yourcompany.syncsimp.sync.pack5` (consumable)
- `com.yourcompany.syncsimp.sync.pack10` (consumable)

**Product Details:**

1. **Pro Unlimited Subscription**
   - Type: Auto-renewable subscription
   - Product ID: `com.yourcompany.syncsimp.pro.unlimited`
   - Reference Name: "SyncSimp Pro Unlimited"
   - Price: $19.99
   - Subscription Duration: 1 month
   - Free Trial: 7 days (optional)

2. **Single Sync Credit**
   - Type: Consumable
   - Product ID: `com.yourcompany.syncsimp.sync.single`
   - Reference Name: "Single Sync Credit"
   - Price: $7.99

3. **5-Pack Sync Credits**
   - Type: Consumable
   - Product ID: `com.yourcompany.syncsimp.sync.pack5`
   - Reference Name: "5 Sync Credits"
   - Price: $34.99

4. **10-Pack Sync Credits**
   - Type: Consumable
   - Product ID: `com.yourcompany.syncsimp.sync.pack10`
   - Reference Name: "10 Sync Credits"
   - Price: $59.99

### 4. Create Entitlement in RevenueCat

1. Go to "Entitlements" tab in RevenueCat
2. Click "Create Entitlement"
3. Name it: **"pro_unlimited"**
4. Description: "Unlimited access to SyncSimp automation features"

### 5. Create Products in RevenueCat (Step 7 of 8)

1. Go to Products tab
2. Create each product:
   - Click "Add Product"
   - Select your iOS app
   - Enter the App Store Product ID (e.g., `com.yourcompany.syncsimp.pro.unlimited`)
   - Map the subscription to the "pro_unlimited" entitlement
   - For consumables, don't map to entitlements (usage tracked in backend)

Repeat for all 4 products.

### 6. Create Offering

1. Go to "Offerings" tab
2. Create offering named "default"
3. Add packages:
   - **Unlimited**: Maps to `com.yourcompany.syncsimp.pro.unlimited`
   - **Single**: Maps to `com.yourcompany.syncsimp.sync.single`
   - **Pack 5**: Maps to `com.yourcompany.syncsimp.sync.pack5`
   - **Pack 10**: Maps to `com.yourcompany.syncsimp.sync.pack10`

### 7. Get Your API Key

1. Go to Project Settings → API Keys
2. Click "Create New Public API Key"
3. Give it a name: "SyncSimp Production"
4. Copy the key (starts with `sk_...`)
5. **Save this key** - you'll enter it in the SyncSimp app

## Important Notes

- **Bundle ID must match** between App Store Connect, RevenueCat, and your app
- Products must exist in App Store Connect BEFORE adding to RevenueCat
- The API key is public (safe to use in mobile apps)
- RevenueCat doesn't set your prices - Apple does in App Store Connect
- Free tier (1 sync/month) is managed in backend logic - no IAP needed

## What You'll Need for SyncSimp App

When you reach Step 1 (Credentials) in SyncSimp, you'll enter:
- **RevenueCat API Key**: The key you just created (starts with `sk_...`)
- **RevenueCat Project ID**: Found in Project Settings
- **RevenueCat iOS App ID**: Found in Apps section

## Pricing Summary

- **Free**: $0/month - 1 sync/month (verified account)
- **Pay-Per-Sync**: $7.99 per sync - no subscription
- **Pro Unlimited**: $19.99/month - unlimited syncs

All tiers include email support, Pro tier gets priority support.
