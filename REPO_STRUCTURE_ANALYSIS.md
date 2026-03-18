# SyncSimp - Repository Structure Analysis

## Overview

**SyncSimp** is a production-ready React Native (Expo SDK 53) mobile app that automates the setup and management of iOS in-app purchases across Apple App Store Connect and RevenueCat. It features a Hono backend with SQLite (Prisma ORM) and uses Firebase for authentication and user/project data storage.

- **Bundle ID:** `com.nemurium.syncsimp.app`
- **Version:** 1.0.1
- **Total codebase:** ~10,800 lines of TypeScript across frontend and backend

---

## Directory Structure

```
SyncSimp/
├── App.tsx                      # Root component (ErrorBoundary, providers, Firebase auth)
├── index.ts                     # Expo entry point
├── app.json                     # Expo config (SDK 53, iOS/Android settings)
├── eas.json                     # EAS Build configuration
├── package.json                 # Frontend dependencies
├── tailwind.config.js           # Nativewind/Tailwind config
├── babel.config.js              # Babel config
├── metro.config.js              # Metro bundler config
├── tsconfig.json                # TypeScript config
├── global.css                   # Global Tailwind imports
│
├── src/
│   ├── screens/                 # 15 screen components
│   │   ├── ProjectsScreen.tsx       # Main list of sync projects (Firestore)
│   │   ├── ProjectDetailScreen.tsx  # Project detail with step-by-step workflow
│   │   ├── CreateProjectScreen.tsx  # New project wizard (saves to Firestore)
│   │   ├── ConfigWizardScreen.tsx   # Product configuration (subscriptions/IAP/consumables)
│   │   ├── EditConfigScreen.tsx     # YAML config editor
│   │   ├── CredentialsScreen.tsx    # Apple/RevenueCat API key entry
│   │   ├── CheckScreen.tsx          # Credential validation screen
│   │   ├── SyncScreen.tsx           # Execute sync to Apple + RevenueCat
│   │   ├── ScreenshotToolScreen.tsx # App Store screenshot resizer tool
│   │   ├── VideoToolScreen.tsx      # App preview video tool
│   │   ├── LoginModalScreen.tsx     # Firebase email/password login modal
│   │   ├── SettingsScreen.tsx       # User settings (Firebase-based)
│   │   ├── OnboardingWelcomeScreen.tsx
│   │   ├── OnboardingFeaturesScreen.tsx
│   │   └── OnboardingUpgradeScreen.tsx
│   │
│   ├── components/              # Shared UI components
│   │   ├── LoginWithEmailPassword.tsx  # Firebase auth form
│   │   ├── ErrorFixModal.tsx           # Actionable error diagnostics
│   │   ├── HelpModal.tsx               # In-app help
│   │   ├── LoginButton.tsx
│   │   ├── NativePaywall.tsx           # Native IAP paywall
│   │   ├── RevenueCatPaywall.tsx       # RevenueCat paywall UI
│   │   ├── CustomerCenter.tsx          # Subscription management
│   │   └── ComponentWithDataFetchingExample.tsx
│   │
│   ├── navigation/
│   │   ├── RootNavigator.tsx    # Root stack + bottom tab navigator
│   │   └── types.ts             # Navigation type definitions
│   │
│   ├── lib/                     # Core libraries & clients
│   │   ├── firebase.ts              # Firebase config with AsyncStorage persistence
│   │   ├── useFirebaseSession.ts    # Memoized Firebase auth hook
│   │   ├── useSession.tsx           # Re-exports Firebase session hook
│   │   ├── api.ts                   # Backend HTTP client
│   │   ├── authClient.ts            # Legacy auth client (Better Auth remnant)
│   │   ├── queryClient.ts           # TanStack React Query client
│   │   ├── revenuecatClient.ts      # RevenueCat SDK wrapper
│   │   └── revenuecatProducts.ts    # Product/offering definitions
│   │
│   ├── hooks/
│   │   ├── useAutoLogin.ts          # Auto-login on app start
│   │   └── useOnboardingCheck.ts    # Check if onboarding completed
│   │
│   ├── shared/
│   │   └── contracts.ts         # Zod schemas shared between frontend/backend
│   │
│   ├── constants/
│   │   └── errorFixes.ts        # Error fix instructions mapping
│   │
│   ├── state/
│   │   └── rootStore.example.ts # State management template
│   │
│   ├── types/
│   │   └── ai.ts                # AI-related type definitions
│   │
│   └── utils/
│       └── cn.ts                # Tailwind class merge utility
│
├── backend/                     # Hono backend server (port 3000)
│   ├── src/
│   │   ├── index.ts             # Hono app setup, CORS, route mounting
│   │   ├── env.ts               # Environment variable validation
│   │   ├── db.ts                # Prisma client instance
│   │   ├── lib/                 # Backend business logic
│   │   │   ├── apple.ts         # Apple App Store Connect API integration
│   │   │   └── revenuecat.ts    # RevenueCat API integration
│   │   └── routes/
│   │       ├── sync.ts          # Core sync engine (~646 lines) - Apple + RevenueCat sync
│   │       ├── validation.ts    # Credential validation endpoints
│   │       ├── upload.ts        # Image upload handling
│   │       ├── dev.ts           # Development/debug endpoints
│   │       └── sample.ts        # Sample data endpoints
│   ├── prisma/                  # Prisma schema + migrations
│   └── package.json             # Backend dependencies
│
├── assets/                      # App icons, splash screens, images
├── patches/                     # Patch files for dependencies
├── syncsimp/                    # Additional app-specific assets/config
└── vibepay-connect/             # Payment integration module
```

---

## Architecture

### Frontend (Expo + React Native)
- **Framework:** Expo SDK 53, React Native 0.76.7
- **Navigation:** React Navigation v7 (native stack + bottom tabs)
- **Styling:** Nativewind (TailwindCSS for React Native)
- **State/Data:** TanStack React Query for server state
- **Auth:** Firebase Auth (email/password) with AsyncStorage persistence
- **Data:** Cloud Firestore for user profiles and projects
- **Payments:** RevenueCat SDK for subscriptions
- **Icons:** lucide-react-native

### Backend (Hono + Bun)
- **Runtime:** Bun
- **Framework:** Hono (lightweight HTTP framework)
- **Database:** SQLite via Prisma ORM
- **Auth:** None (Firebase handles auth on frontend; backend is stateless)
- **Key integrations:**
  - Apple App Store Connect API (JWT-authenticated)
  - RevenueCat REST API

### Data Flow
1. User authenticates via Firebase on the frontend
2. Projects are stored in Firestore
3. When syncing, frontend sends project data in the request body to the backend
4. Backend calls Apple ASC API and RevenueCat API to create/update IAP products
5. Sync status and errors are returned to the frontend with actionable fix instructions

---

## Key Features

1. **IAP Sync Engine** - Automates creation of subscriptions, lifetime purchases, and consumables in App Store Connect and RevenueCat
2. **Product Types** - Supports `auto_renewable`, `non_consumable`, and `consumable` IAP types
3. **YAML Configuration** - Products defined via YAML config with localization support
4. **Credential Validation** - Validates Apple API keys and RevenueCat keys before sync
5. **Error Diagnostics** - Returns step-by-step fix instructions for common errors
6. **Screenshot Tool** - Resizes screenshots for App Store submission
7. **Video Tool** - App preview video creation
8. **Onboarding Flow** - Welcome, features, and upgrade screens
9. **RevenueCat Paywall** - Built-in subscription paywall

---

## API Endpoints (Backend)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/validation/check/:projectId` | Validate Apple/RevenueCat credentials |
| POST | `/api/sync/run/:projectId` | Execute full IAP sync |
| POST | `/api/upload/image` | Upload images |
| GET/POST | `/api/sample` | Sample data |
| GET | `/api/dev/*` | Development utilities |
| GET | `/health` | Health check |

---

## Navigation Structure

```
RootStack (Native Stack)
├── Tabs (Bottom Tab Navigator)
│   ├── ProjectsTab → ProjectsScreen
│   └── SettingsTab → SettingsScreen
├── ProjectDetail
├── CreateProject (modal)
├── EditConfig
├── ConfigWizard
├── Credentials
├── Check
├── Sync
├── ScreenshotTool
├── VideoTool
├── LoginModalScreen (modal)
├── OnboardingWelcome
├── OnboardingFeatures
└── OnboardingUpgrade
```

---

## Technology Stack Summary

| Layer | Technology |
|-------|-----------|
| Mobile Framework | Expo SDK 53 + React Native 0.76.7 |
| Language | TypeScript (entire stack) |
| Styling | Nativewind (TailwindCSS) |
| Navigation | React Navigation v7 |
| Server State | TanStack React Query |
| Auth | Firebase Auth |
| Database (Frontend) | Cloud Firestore |
| Database (Backend) | SQLite + Prisma ORM |
| Backend Framework | Hono |
| Runtime | Bun |
| Payments | RevenueCat |
| Build | EAS Build |
| Package Manager | Bun |
