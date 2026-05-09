# Mobile App Build (iOS / Android)

This repo is set up to ship as a native iOS and Android app via [Capacitor](https://capacitorjs.com/). The web app keeps working independently — Capacitor just wraps the static build in a native shell so you can submit to the App Store / Play Store.

## One-time setup (on a Mac for iOS, any machine for Android)

```bash
# Install Capacitor packages
bun add @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android

# Build the web app first — Capacitor copies `dist/client` into the native projects
bun run build

# Add native platforms (creates `ios/` and `android/` folders)
bunx cap add ios
bunx cap add android
```

## Iterating

After every web change:

```bash
bun run build
bunx cap sync          # copies dist/client into ios/ and android/
```

To open in the native IDE:

```bash
bunx cap open ios       # opens Xcode (Mac only)
bunx cap open android   # opens Android Studio
```

## App Store submission checklist

### Required assets
- App icon: 1024×1024 PNG (no transparency, no rounded corners — Apple rounds them)
- Splash screen: 2732×2732 PNG, content centered (Capacitor will mask)
- Screenshots: 6.7" (iPhone 15 Pro Max), 6.5", 5.5", 12.9" iPad Pro

Place icons at `ios/App/App/Assets.xcassets/AppIcon.appiconset/` once `cap add ios` has scaffolded.

### Apple Developer account ($99/yr)
- Sign up at https://developer.apple.com/programs/
- Create an App Store Connect record (matches `appId` `com.flagsixsix.coach`)

### Privacy & ToS (required to ship to App Store)
- Privacy policy URL (must say what data you collect — currently: nothing leaves the device)
- Terms of Service URL
- Mark as **No data collected** in App Store Connect privacy questionnaire (true today since we use localStorage only)

### COPPA / Kids
- This app is aimed at coaches (adults), but you handle kids' jersey numbers / names.
- Recommend: rate as 4+, do **not** target the "Made for Kids" section, and disclose in privacy policy that names are stored locally.

### TestFlight (before public release)
1. In Xcode: Product → Archive
2. Distribute App → App Store Connect → Upload
3. Add internal testers (you + your assistant coaches) via App Store Connect
4. Iterate based on real coaching-staff feedback

### Public submission
1. Fill out App Store Connect listing (description, keywords, support URL)
2. Submit for review (typically 24-48 hour turnaround)
3. Release manually after approval so you control launch timing

## Recommended next features to ship before public release

These are not required, but they're what makes "another play designer" turn into "the app coaches recommend":

1. **Cloud sync (Supabase)** — multi-device for the same coach, share roster with assistants
2. **In-app subscription** — Free: 1 team, 5 customs. Pro $4.99/mo or $19.99/yr: unlimited.
3. **Sign in with Apple** — required by Apple if you ship any social sign-in
4. **Onboarding** — first-launch flow: name your team → add 6 players → call your first play
5. **Push reminders** — "Practice in 1 hour" / "Game day tomorrow"
6. **Video upload per play** — coach films the play in practice, attaches it to the playbook
