# Lock Screen Facts

An Android app that shows a rotating fact on your lock screen via notifications.
Pick categories (Science, History, Space, Animals, Geography, Human Body) and how
often the fact refreshes.

## How it works

Android apps can't draw directly on the lock screen, so this app pre-schedules a
queue of ~50 local notifications at your chosen interval. Notifications appear on
the lock screen by default. A background task and app-open logic keep the queue
topped up and dismiss older facts.

## Development

```bash
npm install
npx expo start        # run in Expo Go (background task won't run there; queue tops up on app open)
npm test              # unit tests
```

## Building an installable APK

Requires a free [Expo account](https://expo.dev) and `npm i -g eas-cli`.

```bash
eas login
eas build -p android --profile preview
```

When the build finishes, install the APK from the link EAS prints (or the QR code)
on your Android device.

## Notes

- Android 13+ asks for notification permission on first launch — accept it.
- Notification timing is approximate; Android may batch or defer notifications
  under battery optimization.
