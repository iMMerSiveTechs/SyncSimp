# EAS Build & Submission Error Diagnostic System

## Overview

SyncSimp now includes a comprehensive error explanation system that helps users understand and fix Expo EAS build and submission failures. When an error occurs, users get detailed step-by-step instructions instead of cryptic error messages.

## How It Works

### 1. Error Detection

The system automatically detects common EAS errors by analyzing error messages for specific keywords:

```typescript
// Example: Automatic detection
const errorMessage = "Missing App Store Connect API credentials";
const errorFix = getErrorFixForValidationResult("EAS", errorMessage);
// Returns: EAS_MISSING_CREDENTIALS with full fix instructions
```

### 2. Error Types Covered

The system recognizes 7 common EAS error scenarios:

| Error Type | Detected When | Fix Time |
|------------|---------------|----------|
| **Missing Credentials** | Error mentions "credentials" + "App Store Connect" | 10-15 min |
| **Bundle ID Issues** | Error mentions "bundle" + "identifier/mismatch" | 10-15 min |
| **Provisioning/Certificates** | Error mentions "provisioning/certificate/signing" | 10-20 min |
| **Unsigned Agreements** | Error mentions "agreement/terms/pending action" | 3-5 min |
| **Build Failures** | Error mentions "build failed/compilation" | 15-45 min |
| **Upload Timeouts** | Error mentions "timeout/timed out" | 5-10 min |
| **Version Conflicts** | Error mentions "version/build number" + "exists/duplicate" | 3-5 min |

### 3. User Experience

When an error occurs:
1. User sees the error message
2. A "How to Fix This" button appears
3. Tapping opens a modal with:
   - Clear error title (e.g., "Bundle ID Mismatch")
   - Description of what went wrong
   - Estimated time to fix
   - Step-by-step instructions
   - Common mistakes to avoid
   - Help resources/links

## Usage Examples

### For Developers: Adding to Your Screens

```typescript
import { getErrorFixForValidationResult } from "@/constants/errorFixes";

// When you catch an error from EAS:
catch (error: any) {
  const errorMessage = error.message;

  // Get the fix instructions
  const errorFix = getErrorFixForValidationResult("EAS", errorMessage);

  if (errorFix) {
    // Show "How to Fix This" button
    // On press, show HelpModal with errorFix.steps
  }
}
```

### Real Example: Bundle ID Error

**Error Message Received:**
```
Error: App with bundle identifier 'com.nemurium.syncsimp.app' was not found in App Store Connect
```

**What User Sees:**
- Title: "Bundle ID Mismatch or Not Registered"
- Description: "The bundle ID in your app.json doesn't match what's registered..."
- 5 detailed steps to fix
- Common mistakes listed
- Estimated time: 10-15 minutes

## Architecture

```
src/constants/errorFixes.ts
├── ERROR_FIXES object (contains all error definitions)
│   ├── EAS_MISSING_CREDENTIALS
│   ├── EAS_INVALID_BUNDLE_ID
│   ├── EAS_INVALID_PROVISIONING
│   ├── EAS_MISSING_AGREEMENT
│   ├── EAS_BUILD_FAILED
│   ├── EAS_SUBMIT_TIMEOUT
│   └── EAS_INVALID_VERSION
│
└── getErrorFixForValidationResult()
    └── Analyzes error message → Returns matching ErrorFix
```

## Benefits

### For Users
- **No more confusion**: Clear explanations instead of technical jargon
- **Actionable steps**: Know exactly what to do to fix the issue
- **Time estimation**: Know how long the fix will take
- **Avoid mistakes**: Common pitfalls are highlighted upfront

### For Developers (You & Your Team)
- **Reduced support burden**: Users can self-serve most issues
- **Better UX**: Users feel empowered, not stuck
- **Extensible**: Easy to add new error types as you discover them

## Adding New Error Types

To add a new error type:

1. **Define the error in errorFixes.ts:**

```typescript
EAS_YOUR_ERROR_NAME: {
  title: "User-Friendly Error Title",
  description: "What went wrong in simple terms",
  estimatedTime: "5-10 minutes",
  steps: [
    {
      number: 1,
      instruction: "First thing to do",
      details: "More context about step 1"
    },
    // ... more steps
  ],
  commonMistakes: [
    "Mistake users often make #1",
    "Mistake users often make #2"
  ],
  needsHelp: "Additional context or link to docs"
}
```

2. **Add detection logic in getErrorFixForValidationResult():**

```typescript
if (lowerError.includes("your keyword") || lowerError.includes("another keyword")) {
  return ERROR_FIXES.EAS_YOUR_ERROR_NAME;
}
```

## Integration with Vibecode

This system was built for SyncSimp but can be adapted for any Expo app:

1. Copy `src/constants/errorFixes.ts` to your project
2. Copy `src/components/HelpModal.tsx` (if you want the UI)
3. Import and use `getErrorFixForValidationResult()` in your error handling

## Your Specific Case

**Your Error:** "Build succeeds but fails to send to App Store Connect"

This is likely one of:
- **EAS_MISSING_CREDENTIALS**: No ASC API key configured in EAS
- **EAS_INVALID_BUNDLE_ID**: Bundle ID doesn't match what's in ASC
- **EAS_INVALID_PROVISIONING**: Provisioning profile issue

**To get the exact error:**
1. Check the full EAS build logs at expo.dev
2. Look for the actual error message
3. The system will automatically show the right fix based on that message

**Quick test:** If you can share the exact error message from EAS, the system will identify which of the 7 error types it is and show you the fix!

## Future Enhancements

Potential additions:
- Screenshot annotations showing where to click in ASC
- Video walkthroughs for complex fixes
- Direct links to specific ASC pages
- Integration with EAS API to auto-fetch error details
- Community-contributed fixes

## Questions?

The system is fully functional and ready to use. If you encounter an error that isn't covered, you can:
1. Add it to `errorFixes.ts` following the pattern
2. Submit feedback so we can add it to the system
3. Check the EAS documentation for that specific error

---

**Pro Tip:** The error detection is keyword-based, so even partial error messages will trigger the right fix. The system is forgiving and tries multiple keyword combinations.
