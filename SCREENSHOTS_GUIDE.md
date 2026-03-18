# Screenshot Guide for SyncSymp Help System

This document explains what screenshots are needed for the in-app help system and how to create/add them.

## 📸 Overview

The app now has a comprehensive help system with step-by-step guides for setting up Apple App Store Connect and RevenueCat credentials. Currently, the help modals show text instructions with placeholder screenshots. You can add real screenshots to make the guides even more helpful.

## 🎯 Where Users See Help

1. **CredentialsScreen** - When adding Apple/RevenueCat API keys
   - "Need Help?" button next to "Apple App Store Connect"
   - "Need Help?" button next to "RevenueCat"

2. **ConfigWizardScreen** - When configuring products
   - "Help" button next to "RevenueCat Settings"

## 📋 Screenshots Needed

### Apple App Store Connect (5 screenshots)

#### 1. **apple-issuer-id.png** or **apple-issuer-id.jpg**
- **What to capture**: App Store Connect → Users and Access → Keys page
- **What to highlight**: The "Issuer ID" text at the top of the page
- **Context**: Shows users exactly where to find their Issuer ID (UUID format)
- **Annotation tips**: Draw a red box or arrow pointing to the Issuer ID

#### 2. **apple-create-key.png** or **apple-create-key.jpg**
- **What to capture**: The "Generate API Key" dialog that appears after clicking the + button
- **What to highlight**: The name field and "App Manager" role selection
- **Context**: Shows how to create a new API key with the correct permissions
- **Annotation tips**: Highlight the role dropdown showing "App Manager" selected

#### 3. **apple-key-id.png** or **apple-key-id.jpg**
- **What to capture**: The keys list showing existing API keys
- **What to highlight**: The "Key ID" column with an example key ID visible
- **Context**: Shows where to find the Key ID after creating a key
- **Annotation tips**: Circle or highlight one Key ID as an example

#### 4. **apple-download-p8.png** or **apple-download-p8.jpg**
- **What to capture**: Either the key creation success screen OR the key details page showing the download button
- **What to highlight**: The "Download API Key" button
- **Context**: Shows how to download the P8 file (only available once!)
- **Annotation tips**: Add a warning icon or text saying "Only download once!"

#### 5. **apple-keys-overview.png** or **apple-keys-overview.jpg** (Optional bonus)
- **What to capture**: Full view of the Keys page showing navigation path
- **What to highlight**: The breadcrumb or navigation showing: Users and Access → Keys
- **Context**: Helps users understand how to navigate to the Keys section

### RevenueCat Dashboard (4 screenshots)

#### 6. **revenuecat-project-id.png** or **revenuecat-project-id.jpg**
- **What to capture**: RevenueCat → Project Settings page
- **What to highlight**: The "Project ID" field showing format like "proj_abc123"
- **Context**: Shows where to find the Project ID
- **Annotation tips**: Circle the Project ID field

#### 7. **revenuecat-app-id.png** or **revenuecat-app-id.jpg**
- **What to capture**: RevenueCat → Apps → [Select iOS App] → App Settings
- **What to highlight**: The "App ID" or "App identifier" field showing format like "app_abc123"
- **Context**: Shows where to find the iOS App ID
- **Annotation tips**: Circle or highlight the App ID

#### 8. **revenuecat-api-key.png** or **revenuecat-api-key.jpg**
- **What to capture**: RevenueCat → Project Settings → API Keys section
- **What to highlight**: The "Generate New Key" button and the key type selector showing "Public"
- **Context**: Shows how to create a new public API key
- **Annotation tips**: Highlight the "Public" key type option

#### 9. **revenuecat-navigation.png** or **revenuecat-navigation.jpg** (Optional bonus)
- **What to capture**: RevenueCat dashboard showing the left sidebar
- **What to highlight**: The navigation items: Project Settings, Apps
- **Context**: Helps users understand the dashboard layout

## 🛠️ How to Create Good Screenshots

### General Guidelines:
1. **Use a clean browser window** - Hide bookmarks bar, close unnecessary tabs
2. **Use default zoom level** - Don't zoom in/out too much
3. **Show context** - Include enough of the page so users can orient themselves
4. **Recommended size**: 1200-1600px wide for clarity
5. **Format**: PNG (for UI elements) or JPG (for full page screenshots)
6. **Aspect ratio**: Try to keep around 4:3 or 16:9 for consistency

### Annotation Tools:
- **Mac**: Use Preview or Skitch for annotations
- **Windows**: Use Snipping Tool or Paint 3D
- **Online**: Use Figma, Canva, or Photopea (free Photoshop alternative)
- **Simple**: Just use arrows, boxes, or circles in bright colors (red, blue, yellow)

### What to Highlight:
- Use **red boxes/circles** for the most important elements
- Use **arrows** to show where to click
- Add **text labels** if the UI element name isn't clear
- Use **numbers** (1, 2, 3) if showing multiple steps in one screenshot

## 📤 How to Add Screenshots to the App

### Option 1: Via Vibecode App (Easiest)
1. Open the Vibecode app
2. Go to the **IMAGES** tab
3. Upload your screenshots (or generate placeholder images)
4. Name them exactly as listed above (e.g., `apple-issuer-id.png`)
5. The app will automatically place them in `/assets/images/help-screenshots/`

### Option 2: Manual Upload (if you have direct file access)
1. Place your screenshot files in: `/assets/images/help-screenshots/`
2. Name them exactly as listed above
3. The app will automatically detect and use them

### Option 3: Using AI Image Generation (Quick Mockups)
If you don't have access to actual Apple/RevenueCat accounts, you can:
1. Ask me to create mockup images showing the general layout
2. Upload those mockups via the IMAGES tab
3. Replace them with real screenshots later

## 🔄 How the Help System Works

1. When a user taps "Need Help?" or "Help" button, a modal opens
2. The modal shows numbered steps with descriptions
3. Each step can have an accompanying screenshot
4. If no screenshot exists, a placeholder appears with the message "📸 Screenshot coming soon"
5. Users can scroll through all steps and see visual + text guidance

## 🎨 Component Details

The help system uses:
- **HelpModal component** (`/src/components/HelpModal.tsx`) - Reusable modal for displaying steps
- **Automatic screenshot loading** - Checks for images in `/assets/images/help-screenshots/`
- **Responsive layout** - Screenshots scale to fit different screen sizes
- **Smooth scrolling** - Users can easily browse through all steps

## ✅ Current Status

- ✅ HelpModal component created
- ✅ Help buttons added to CredentialsScreen (Apple & RevenueCat)
- ✅ Help button added to ConfigWizardScreen (RevenueCat)
- ✅ Text instructions written for all steps
- ⏳ **Screenshots pending** - Currently showing placeholders

## 💡 Tips for Screenshot Creation

1. **Start with the most important ones first**:
   - `apple-issuer-id.png` (most confusing for users)
   - `revenuecat-project-id.png` (users need this immediately)

2. **Test the layout**: Take a screenshot and view it on your phone to ensure text is readable

3. **Update as needed**: If Apple or RevenueCat changes their UI, screenshots can be easily replaced

4. **Privacy**: Make sure to blur out any personal information (email addresses, real project names, etc.)

## 🚀 Next Steps

1. I'll look into creating the screenshots (or you can create mockups)
2. Upload them via the IMAGES tab in the Vibecode app
3. The app will automatically start showing them in the help modals
4. Users will have visual guidance for every step of the setup process!

---

**Questions?** Let me know if you need help creating specific screenshots or if you want me to adjust the help text/layout!
