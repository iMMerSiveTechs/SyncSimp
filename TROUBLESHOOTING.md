# Complete Troubleshooting Guide for SyncSimp

This guide provides detailed solutions for every possible error you might encounter while setting up your iOS app with in-app purchases.

---

## Table of Contents

1. [Before You Start: Prerequisites](#before-you-start-prerequisites)
2. [Step 1 Errors: Credentials](#step-1-errors-credentials)
3. [Step 2 Errors: Configuration](#step-2-errors-configuration)
4. [Step 3 Errors: Validation](#step-3-errors-validation)
5. [Step 4 Errors: Sync](#step-4-errors-sync)
6. [Common Mistakes](#common-mistakes)
7. [Still Need Help?](#still-need-help)

---

## Before You Start: Prerequisites

### What You Need BEFORE Using SyncSimp

**Apple Requirements:**
1. ✅ Paid Apple Developer Account ($99/year)
2. ✅ Bundle ID registered in Apple Developer Portal with In-App Purchase capability
3. ✅ App created in App Store Connect with the same Bundle ID
4. ✅ App Store Connect API Key with "App Manager" role

**RevenueCat Requirements:**
1. ✅ Free RevenueCat account (app.revenuecat.com)
2. ✅ Project created in RevenueCat
3. ✅ iOS app added to RevenueCat with exact Bundle ID match

### Bundle ID Best Practices
- Format: `com.YourCompany.YourAppName`
- Must be EXACTLY the same everywhere (Apple, RevenueCat, SyncSimp)
- Case-sensitive!
- No wildcards - use explicit Bundle ID

---

## Step 1 Errors: Credentials

### Error: "Missing Apple Credentials"

**What it means:** You haven't entered your Apple API credentials yet.

**How to fix:**

1. **Open App Store Connect** → appstoreconnect.apple.com
2. **Go to Users and Access** → Click "Keys" tab (or "Integrations" → "App Store Connect API")
3. **Create API Key** (if you don't have one):
   - Click "+" button
   - Name: "SyncSimp API Key"
   - Access: Select "App Manager"
   - Click "Generate"
4. **Copy Issuer ID** (at top of page):
   - Format: `12345678-1234-1234-1234-123456789abc`
5. **Copy Key ID**:
   - 10 characters, e.g., `ABCD123456`
6. **Download P8 File**:
   - Click "Download API Key"
   - ⚠️ SAVE IT! You can only download once
7. **Enter in SyncSimp** → Go to Step 1, paste all three values

**Common mistakes:**
- Wrong key role (needs "App Manager" or higher)
- Mixing up Key ID and Issuer ID
- Lost P8 file (solution: create new API key)

---

### Error: "Apple Credentials Are Invalid"

**What it means:** The credentials you entered don't authenticate with Apple's servers.

**How to fix:**

1. **Verify each credential carefully:**
   - Issuer ID: UUID format (8-4-4-4-12 characters)
   - Key ID: Exactly 10 characters
   - P8 File: Correct file for this Key ID

2. **Check for copy-paste errors:**
   - No extra spaces before/after
   - No line breaks
   - Complete value copied

3. **Verify key status in App Store Connect:**
   - Key should show "Active" (not "Revoked")
   - If revoked, create new key

4. **Check key permissions:**
   - Must be "App Manager" role or higher
   - "Developer" role is insufficient

5. **Try creating fresh API key:**
   - Sometimes starting over is fastest
   - Delete old entries in SyncSimp
   - Create brand new API key in Apple
   - Enter new values

**Common mistakes:**
- Using revoked/expired API key
- Insufficient permissions on key
- Uploading wrong P8 file (if you have multiple keys)
- Extra whitespace in copy-paste

---

### Error: "Missing RevenueCat Credentials"

**What it means:** You haven't entered your RevenueCat API key.

**How to fix:**

1. **Create RevenueCat Account** (if new):
   - Go to app.revenuecat.com
   - Sign up for free

2. **Create Project**:
   - Click "Create new project"
   - Name it (e.g., "SyncSimp")

3. **Add iOS App**:
   - Click "Add app"
   - Select "iOS"
   - Enter Bundle ID (MUST match Apple exactly)

4. **Get API Key**:
   - Project Settings → API Keys
   - Click "Create New Public API Key"
   - Name it (e.g., "SyncSimp Production")
   - Copy the key (starts with `sk_` or `appl_`)

5. **Enter in SyncSimp** → Step 1, paste API key

**Common mistakes:**
- Using secret key instead of public key
- Bundle ID mismatch with Apple
- Creating key before adding iOS app

---

## Step 2 Errors: Configuration

### Error: "Missing RevenueCat Project ID or App ID"

**What it means:** You need to tell SyncSimp which RevenueCat project/app to sync to.

**How to fix:**

1. **Get Project ID**:
   - Log into app.revenuecat.com
   - Select your project
   - Project Settings (gear icon)
   - Copy "Project ID" (format: `proj_abc123`)

2. **Get iOS App ID**:
   - Still in RevenueCat
   - Click "Apps" in sidebar
   - Find your iOS app
   - Copy "App ID" (format: `app_abc123` or UUID)
   - ⚠️ This is NOT your Apple Bundle ID!

3. **Enter in SyncSimp** → Step 2, paste both IDs at top of form

**Common mistakes:**
- Using Bundle ID instead of RevenueCat App ID
- Using project name instead of project ID
- Not saving after entering

---

## Step 3 Errors: Validation

### Error: "App Not Found in App Store Connect"

**What it means:** Your app doesn't exist in App Store Connect, or Bundle ID doesn't match.

**How to fix:**

**Part A: Register Bundle ID in Apple Developer Portal**

1. Go to developer.apple.com
2. Certificates, Identifiers & Profiles
3. Identifiers → Click "+" button
4. Select "App IDs" → Continue
5. Description: Your app name
6. Bundle ID: `com.YourCompany.AppName` (EXACT match with SyncSimp)
7. Select "Explicit" (not Wildcard)
8. ✅ Enable "In-App Purchase" capability
9. Continue → Register

**Part B: Create App in App Store Connect**

1. Go to appstoreconnect.apple.com
2. Apps → Click "+" → New App
3. Platform: iOS
4. Name: Your app name
5. Primary Language: English (or your preference)
6. Bundle ID: Select the one you just registered
7. SKU: Any unique identifier (e.g., `app-001`)
8. User Access: Full Access
9. Click "Create"

**Part C: Verify**

1. Wait 30 seconds for propagation
2. Go back to SyncSimp
3. Run validation check again
4. Should now show "✓ App found"

**Common mistakes:**
- Forgetting to register Bundle ID before creating app
- Bundle ID mismatch (case-sensitive!)
- Forgetting In-App Purchase capability
- Using wildcard Bundle ID

---

### Error: "RevenueCat Connection Failed"

**What it means:** Can't connect to RevenueCat with your API key.

**How to fix:**

1. **Verify API key in RevenueCat:**
   - app.revenuecat.com → Your project
   - Project Settings → API Keys
   - Check key is "Active"

2. **Confirm key type:**
   - Must be "Public API Key"
   - Starts with `sk_` or `appl_`
   - NOT a secret backend key

3. **Try creating new key:**
   - Click "Create New Public API Key"
   - Name it
   - Copy ENTIRE key
   - Update in SyncSimp Step 1

4. **Verify project exists:**
   - Make sure you're in correct RevenueCat account
   - Project hasn't been deleted

**Common mistakes:**
- Wrong key type (secret vs public)
- Partial key copied
- Old/revoked key
- Wrong RevenueCat account

---

### Error: "Missing IAP Shared Secret in RevenueCat"

**What it means:** RevenueCat needs your App Store Connect Shared Secret to verify purchases.

**How to fix:**

**Part A: Get Shared Secret from Apple**

1. Go to appstoreconnect.apple.com
2. My Apps → Select your app
3. App Information (left sidebar)
4. Scroll to "App-Specific Shared Secret"
5. If no secret exists:
   - Click "Generate"
6. If secret exists:
   - Click "View" or "Regenerate"
7. Copy the secret (long alphanumeric string)

**Part B: Add to RevenueCat**

1. Go to app.revenuecat.com
2. Your project → Apps → Your iOS app
3. Find "App Store Connect shared secret" field
   - Might be under "Service credentials"
4. Paste the secret
5. Click "Save" or "Update"
6. Wait 30 seconds

**Part C: Re-validate**

1. Go back to SyncSimp
2. Run validation check again

**Common mistakes:**
- Using master shared secret (app-specific is better)
- Not clicking Save
- Pasting in wrong field

---

### Error: "Missing App Store Connect Key in RevenueCat"

**What it means:** RevenueCat needs your Apple API credentials to sync data.

**How to fix:**

1. **You already have these credentials!**
   - Same Issuer ID, Key ID, and P8 file from Step 1

2. **Add to RevenueCat:**
   - app.revenuecat.com → Your project
   - Apps → Your iOS app
   - Find "App Store Connect API" section

3. **Enter credentials:**
   - Issuer ID: (Same as Step 1)
   - Key ID: (Same as Step 1)
   - Upload P8 file: (Same file as Step 1)

4. **Save configuration:**
   - Click "Save" or "Update"
   - RevenueCat will test connection

5. **Re-validate in SyncSimp:**
   - Should now pass

**Common mistakes:**
- Using different API key (should be same as SyncSimp)
- Not clicking Save
- Wrong P8 file

---

## Step 4 Errors: Sync

### Error: "Sync Failed - Apple API Error"

**Possible causes:**
- Network issue
- API credentials expired/revoked
- App doesn't have IAP capability
- Rate limiting

**How to fix:**

1. **Check credentials still valid:**
   - Go back to Step 3
   - Run validation check
   - If fails, fix credentials first

2. **Verify IAP capability:**
   - developer.apple.com
   - Identifiers → Your Bundle ID
   - Confirm "In-App Purchase" is enabled

3. **Wait and retry:**
   - If rate limited, wait 5 minutes
   - Try sync again

---

### Error: "Sync Failed - RevenueCat Error"

**Possible causes:**
- API key insufficient permissions
- RevenueCat project misconfigured
- Products already exist

**How to fix:**

1. **Verify API key permissions:**
   - Must have write access
   - Try creating new key

2. **Check RevenueCat app settings:**
   - Confirm IAP secret is present
   - Confirm ASC key is present

3. **Check for existing products:**
   - If products already exist in RevenueCat
   - May need to delete and recreate

---

## Common Mistakes

### 1. Bundle ID Mismatches
- ❌ Apple: `com.company.App`
- ❌ RevenueCat: `com.company.app` (different case!)
- ✅ Must be EXACTLY the same everywhere

### 2. Wrong API Key Types
- ❌ Using secret key in mobile app
- ❌ Using insufficient permission key
- ✅ Use public key with proper permissions

### 3. Skipping Prerequisites
- ❌ Creating app in RevenueCat before Apple
- ❌ Forgetting to enable IAP capability
- ✅ Follow order: Apple first, then RevenueCat

### 4. Copy-Paste Errors
- ❌ Partial values copied
- ❌ Extra spaces/line breaks
- ✅ Carefully copy entire value

### 5. Not Saving Changes
- ❌ Entering values but not clicking Save
- ❌ Leaving screen without saving
- ✅ SyncSimp auto-saves, but verify green checkmarks

---

## Still Need Help?

### In-App Help Features

1. **Visual Guides:**
   - Tap "Need Help?" on Credentials screen
   - Tap "Help" on Config Wizard screen
   - See screenshots of where to find everything

2. **Error Fix Instructions:**
   - When validation fails
   - Tap "How to Fix This" button
   - Get step-by-step instructions

3. **Logs:**
   - Check LOGS tab in Vibecode app
   - See detailed error messages
   - Backend logs: `backend/server.log`

### External Resources

1. **Apple Documentation:**
   - App Store Connect API: developer.apple.com/documentation/appstoreconnectapi
   - In-App Purchase: developer.apple.com/in-app-purchase/

2. **RevenueCat Documentation:**
   - Getting Started: docs.revenuecat.com
   - iOS Setup: docs.revenuecat.com/docs/ios

3. **Common Status Pages:**
   - Apple: developer.apple.com/system-status
   - RevenueCat: status.revenuecat.com

---

## Quick Reference Checklist

Use this checklist to ensure everything is set up correctly:

### Apple Setup
- [ ] Paid Apple Developer account active
- [ ] Bundle ID registered with IAP capability
- [ ] App created in App Store Connect
- [ ] API Key created with "App Manager" role
- [ ] Issuer ID, Key ID, and P8 file saved

### RevenueCat Setup
- [ ] Account created at app.revenuecat.com
- [ ] Project created
- [ ] iOS app added with correct Bundle ID
- [ ] Public API key created
- [ ] App Store Connect shared secret added
- [ ] App Store Connect API credentials added
- [ ] Project ID and App ID noted

### SyncSimp Setup
- [ ] Step 1: All Apple credentials entered
- [ ] Step 1: RevenueCat API key entered
- [ ] Step 2: RevenueCat Project ID and App ID entered
- [ ] Step 2: Products configured
- [ ] Step 3: All validation checks pass (green)
- [ ] Step 4: Sync completed successfully

---

**Remember:** Every error message in SyncSimp has a "How to Fix This" button that gives you detailed instructions specific to your error. Use it!

---

*Last updated: 2025*
*Made with ✨ by Vibecode*
