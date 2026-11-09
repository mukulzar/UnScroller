# UnScroller

UnScroller is an Android app that helps interrupt scrolling through YouTube Shorts and Instagram Reels. It uses Android's Accessibility service to recognize those feeds and, when protection is enabled, take the action you selected.

## What it does

- Lets you enable or disable protection and choose which supported apps to watch.
- Can return to Home, open another app, or show a mindful pause when it detects a supported feed.
- Saves preferences and daily interruption counts on the device.
- Does not need an UnScroller account.

Detection depends on the target apps' interface and may stop working if YouTube or Instagram changes it.

## Run on an Android device

Keep the development server available if prompted. This installs a development build; it is not a Play Store release.

## Enable Accessibility

1. Open UnScroller and tap **Open Accessibility Settings**.
2. In Android's Accessibility settings, find **UnScroller Shorts and Reels blocker** (the category name and location vary by device).
3. Turn on the service and confirm Android's prompt.
4. Return to UnScroller and turn on protection from the Dashboard. Choose the apps and interruption action you want.

Accessibility access is powerful. Android will warn that a service may view screen content and perform actions. UnScroller needs it to inspect the active YouTube or Instagram interface and leave a detected Shorts or Reels feed. The service is configured for those two packages and processes the detection on the device. Turn the service off in Android Accessibility settings whenever you no longer want it.

### “Restricted setting” message on sideloaded installs

Some Android versions block Accessibility for apps installed outside an app store. If Android shows **Restricted setting**, and you trust the exact app build you installed:

1. Open **Settings → Apps → UnScroller** (or **App info**).
2. Open the **More** menu (`⋮`) and choose **Allow restricted settings**, if that option is shown.
3. Return to **Settings → Accessibility** and enable UnScroller as described above.

Names and menus differ across Android versions and manufacturers. Only allow restricted settings for an app you trust and obtained from a source you trust.

## Play Protect and installation safety

**Do not turn off Google Play Protect just to enable UnScroller.** Play Protect helps check apps, especially sideloaded APKs. If it warns about an APK, stop and verify where it came from; do not bypass a harmful-app warning unless you have independently verified the build and understand the risk. Prefer building this public source yourself or using a release whose publisher and integrity you can verify.

## Privacy and data

The current app code stores settings, interruption counts, pause state, and the optional friction-code hash in app-private storage on the phone. The Accessibility service is configured to observe YouTube and Instagram only, and the detection logic examines their active UI locally. This repository contains no UnScroller account or analytics upload feature.

**Important limitation:** the Android manifest currently declares the `INTERNET` permission. The app code does not contain an UnScroller server upload, but that permission means this build is not technically network-blocked, and this README cannot guarantee that no network traffic can ever occur (for example, from a modified build or development tooling). Development builds use React Native's development server. Do not treat the permission as proof of offline behavior; review the source and build you install if this is a strict requirement.

Uninstalling the app removes its app-private settings. Android Accessibility access can expose sensitive screen information to an enabled service, so grant it only if you understand and accept what the service does.

## Build checks

```sh
npm test -- --runInBand
npm run lint
```