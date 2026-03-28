# SyncSimp - Standalone Expo + Firebase App

SyncSimp is a React Native mobile app built with Expo SDK 53 that automates iOS in-app purchase setup across Apple App Store Connect and RevenueCat.

## Stack
- **Frontend**: Expo SDK 53, React Native 0.76.7, TypeScript
- **Auth & Data**: Firebase Auth + Cloud Firestore
- **Payments**: RevenueCat SDK (`react-native-purchases`)
- **Styling**: Nativewind (TailwindCSS for React Native)
- **Icons**: lucide-react-native
- **Backend**: Hono.js (being migrated to Firebase Cloud Functions)

## Environment Variables
- `EXPO_PUBLIC_RC_TEST_KEY` - RevenueCat public SDK key (development)
- `EXPO_PUBLIC_RC_APPLE_KEY` - RevenueCat public SDK key (production)
- `EXPO_PUBLIC_BACKEND_URL` - Backend server URL (temporary, until Cloud Functions migration)

## Project Structure
- `src/screens/` - All app screens
- `src/components/` - Shared UI components
- `src/lib/firebase.ts` - Firebase config and CRUD operations
- `src/lib/revenuecatClient.ts` - RevenueCat SDK wrapper
- `src/lib/api.ts` - Backend API client
- `src/navigation/` - React Navigation setup
- `backend/` - Hono backend (to be replaced by Firebase Cloud Functions)

## Key Rules
- Use bun instead of npm
- All styling via Nativewind (TailwindCSS classes), except for components like LinearGradient where inline styles are needed
- TypeScript strict -- be diligent about typechecking
- Firebase handles all auth and user/project data on the frontend
- Backend is stateless -- receives project data and calls Apple/RevenueCat APIs
