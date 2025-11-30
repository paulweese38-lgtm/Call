# Production Assets Guide

## Overview

This guide covers all visual assets needed for CallWall's production release on the Apple App Store and Google Play Store.

## Required Assets

### App Icon

**Purpose**: Main app icon shown on device home screen

**iOS Requirements**:
- **1024x1024px** - App Store listing (PNG, no transparency, no rounded corners)
- Automatically generated smaller sizes by Expo

**Android Requirements**:
- **1024x1024px** - Google Play Store listing
- Adaptive icon: 432x432px foreground + background

**File Locations**:
```
Call/assets/
├── icon.png (1024x1024px - iOS/Android app icon)
├── adaptive-icon.png (432x432px - Android foreground)
└── favicon.png (48x48px - Web favicon, optional)
```

**Design Guidelines**:
- Simple, recognizable design
- Works at small sizes (20x20px)
- No text (icon should be self-explanatory)
- Consistent with brand colors (#3B82F6 blue)
- Consider showing: shield, phone, or wall metaphor

**Design Tool Recommendations**:
- Figma (free, web-based)
- Sketch (Mac only, paid)
- Adobe Illustrator (paid)
- Canva (has app icon templates)

### Splash Screen

**Purpose**: Shown while app is loading

**Requirements**:
- **1242x2688px** (iPhone 13 Pro Max resolution)
- PNG with transparency OR solid background
- Simple, quick-loading design

**File Location**:
```
Call/assets/splash.png
```

**Design Guidelines**:
- Brand colors (#3B82F6 blue on white, or white on blue)
- Simple logo or app name
- Centered design (safe area considerations)
- Avoid too much text or detail

**Example Design**:
```
┌─────────────────┐
│                 │
│                 │
│   [CallWall]    │
│    [Shield]     │
│                 │
│                 │
└─────────────────┘
```

### Notification Icon

**Purpose**: Shown in notification tray

**Android Requirements**:
- **96x96px**
- PNG with transparency
- White silhouette on transparent background
- Simple, recognizable shape

**iOS Requirements**:
- Uses app icon automatically (no separate file)

**File Location**:
```
Call/assets/notification-icon.png
```

**Design Guidelines**:
- Simple silhouette (no gradients or colors)
- High contrast
- Recognizable at small sizes

### Notification Sound (Optional)

**Purpose**: Custom sound for push notifications

**Requirements**:
- **WAV or MP3** format
- Short duration (1-2 seconds)
- Clear, non-intrusive sound

**File Location**:
```
Call/assets/notification-sound.wav
```

## App Store Screenshots

### iOS Screenshots

**Required Sizes**:
1. **iPhone 6.7" Display** (iPhone 14 Pro Max): 1290x2796px
2. **iPhone 6.5" Display** (iPhone 11 Pro Max): 1242x2688px
3. **iPhone 5.5" Display** (iPhone 8 Plus): 1242x2208px
4. **iPad Pro 12.9" Display**: 2048x2732px (if supporting iPad)

**Number Required**:
- Minimum: 3 screenshots per size
- Maximum: 10 screenshots per size
- Recommended: 5-6 screenshots showcasing key features

**What to Show**:
1. **Screen 1**: Legal protection tools (Debt Validation/Cease & Desist forms)
2. **Screen 2**: Voicemail intelligence (list with transcriptions and threat levels)
3. **Screen 3**: Phone management (phone number tracking and blocking)
4. **Screen 4**: AI voice playground (personality selector)
5. **Screen 5**: Subscription tiers comparison
6. **Screen 6** (optional): Profile/settings

**Design Tips**:
- Use actual app interface (not mockups)
- Add subtle overlay text describing the feature
- Show realistic data (not Lorem Ipsum)
- Keep UI clean (hide debug info, use full data)
- Consider adding device frame

**Tools for Screenshots**:
- Simulator screenshots (iOS Simulator → Cmd+S)
- Fastlane Frameit (adds device frames)
- Figma/Sketch (for adding text overlays)

### Android Screenshots

**Required Sizes**:
- **Phone**: 1080x1920px minimum (16:9 ratio)
- **Tablet** (optional): 1536x2048px minimum

**Number Required**:
- Minimum: 2 screenshots
- Maximum: 8 screenshots
- Recommended: 4-6 screenshots

**What to Show**:
Same key features as iOS (Legal, Voicemail, Phone, Voice)

**Tools**:
- Android Emulator screenshots (screenshot button or Cmd+S)
- Same tools as iOS for overlays and frames

## App Store Graphics

### Feature Graphic (Android Only)

**Purpose**: Large banner at top of Play Store listing

**Requirements**:
- **1024x500px**
- PNG or JPEG
- No transparency

**Design**:
```
┌────────────────────────────────────────────┐
│  CallWall - Protect Yourself from         │
│  Harassment & Debt Collection Calls       │
│                                            │
│  [Shield icon]  [Phone icon]  [AI icon]   │
│  Legal Tools    Voicemail     AI Voice    │
└────────────────────────────────────────────┘
```

### Promo Graphic (Optional)

**Purpose**: Additional promotional material for Play Store

**Requirements**:
- **180x120px**
- PNG or JPEG

**Design**: Miniature version of feature graphic or key app benefit

## App Store Listing Assets

### App Preview Videos (Optional but Recommended)

**iOS Requirements**:
- **30 seconds maximum** duration
- **Portrait orientation**
- MP4 format
- Same sizes as screenshots

**Android Requirements**:
- **30 seconds to 2 minutes** duration
- MP4 format
- 16:9 or 9:16 aspect ratio

**Content Ideas**:
1. **15-second quick tour**: Show all 4 main features
2. **30-second walkthrough**: Demonstrate recording a voicemail and getting threat analysis
3. **Focus video**: Deep dive into legal document generation

**Tools**:
- Screen recording on device (iOS: Control Center → Screen Recording)
- QuickTime Player (Mac) for device recording
- iMovie, Adobe Premiere, or Final Cut Pro for editing

### App Icon Variations

**iOS App Store Connect**:
- May request alternative icons for promotions
- Consider seasonal variations (holidays, events)

**Android Play Store**:
- Supports icon experiments (A/B testing)
- Create 2-3 variations to test

## Asset Creation Workflow

### Step 1: Design Phase

1. **Research competitors**: Look at similar apps (legal, security, VOIP)
2. **Create mood board**: Collect design inspiration
3. **Define brand colors**: Primary (#3B82F6), Secondary, Accent
4. **Sketch concepts**: Paper sketches or low-fi digital
5. **Create design system**: Typography, spacing, components

### Step 2: Production Phase

**App Icon**:
```bash
1. Design at 1024x1024px in Figma/Sketch
2. Export as PNG (no transparency, sRGB color space)
3. Place in Call/assets/icon.png
4. For Android adaptive:
   - Export foreground layer (432x432px)
   - Place in Call/assets/adaptive-icon.png
   - Set background color in app.json
```

**Splash Screen**:
```bash
1. Design at 1242x2688px
2. Export as PNG
3. Place in Call/assets/splash.png
4. Update backgroundColor in app.json if needed
```

**Screenshots**:
```bash
1. Build app in development mode
2. Open in iOS Simulator (various sizes)
3. Navigate to each key screen
4. Take screenshots (Cmd+S)
5. Add text overlays in Figma/Photoshop (optional)
6. Export at correct dimensions
```

### Step 3: Optimization Phase

**Compress Images**:
```bash
# Install ImageOptim (Mac) or use online tools
# Reduces file size without quality loss

imageoptim Call/assets/*.png
```

**Validate**:
- App icon: No transparency, correct size
- Splash: Quick loading (< 200KB)
- Screenshots: Clear text, realistic data

### Step 4: Integration

Update `app.json`:
```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "backgroundColor": "#ffffff"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#3B82F6"
      }
    }
  }
}
```

Build and test:
```bash
eas build --profile preview --platform ios
# Install on device and verify all assets appear correctly
```

## Asset Checklist

### Required Assets:
- [ ] App icon (1024x1024px)
- [ ] Adaptive icon foreground (432x432px, Android)
- [ ] Splash screen (1242x2688px)
- [ ] Notification icon (96x96px, Android)
- [ ] iOS screenshots (5 sizes × 3-6 screenshots each)
- [ ] Android screenshots (1080x1920px × 4-6 screenshots)
- [ ] Feature graphic (1024x500px, Android)

### Optional Assets:
- [ ] Notification sound (WAV/MP3)
- [ ] App preview video (30 seconds)
- [ ] Promo graphic (180x120px)
- [ ] Alternative icons for A/B testing

### Quality Checks:
- [ ] All images exported at correct dimensions
- [ ] No transparency where not allowed
- [ ] sRGB color space (not P3 or CMYK)
- [ ] Compressed/optimized file sizes
- [ ] Text is readable on screenshots
- [ ] Consistent branding across all assets
- [ ] Tested on actual devices (not just simulator)

## Tools and Resources

### Design Tools
- **Figma** (free): https://figma.com
- **Canva** (free templates): https://canva.com
- **Sketch** (Mac, paid): https://sketch.com
- **Adobe XD** (free): https://adobe.com/products/xd.html

### Asset Generation
- **App Icon Generator**: https://appicon.co
- **Adaptive Icon Generator**: https://icon.kitchen
- **Screenshot Framer**: https://www.screely.com
- **FastLane Frameit**: https://docs.fastlane.tools/actions/frameit/

### Optimization
- **ImageOptim** (Mac): https://imageoptim.com
- **TinyPNG** (online): https://tinypng.com
- **Squoosh** (online): https://squoosh.app

### Inspiration
- **Mobbin** (app design gallery): https://mobbin.com
- **Dribbble** (design community): https://dribbble.com/tags/app-icon
- **Pttrns** (mobile patterns): https://pttrns.com

### Testing
- **Simulator** (comes with Xcode)
- **TestFlight** (iOS beta testing)
- **Firebase App Distribution** (iOS + Android)

## Brand Guidelines

### Color Palette
- **Primary Blue**: #3B82F6 (app accent, CTA buttons)
- **White**: #FFFFFF (backgrounds, text on dark)
- **Dark Gray**: #1F2937 (primary text)
- **Light Gray**: #F3F4F6 (secondary backgrounds)
- **Success Green**: #10B981 (confirmations)
- **Warning Orange**: #F59E0B (offline, caution)
- **Error Red**: #EF4444 (errors, threats)

### Typography
- **Primary Font**: System font (SF Pro on iOS, Roboto on Android)
- **Headings**: 600-700 weight
- **Body**: 400 weight
- **Small/Caption**: 12-14px

### Icon Style
- **Style**: Line icons with 2px stroke
- **Corner Radius**: 4px for rounded elements
- **Padding**: 16px standard spacing

---

**Last Updated**: 2025-11-30
**Status**: Ready for asset creation
