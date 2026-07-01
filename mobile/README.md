# Parcela Mobile (Expo)

Sender and recipient flows for **Expo Go** testing. Staff dashboards stay on the Next.js web app.

## Requirements

- Node.js 20+
- [Expo Go](https://expo.dev/go) on your phone (iOS or Android)
- Phone and PC on the **same Wi‑Fi** network

## What to test (latest build)

After splash (`collection.png`, ~6s), you should see:

1. **Welcome** — animated title + step-by-step “How it works” → **Get started**
2. **Home** — clear **Send a parcel** / **Track a parcel** buttons (teal + outlined)
3. **Fonts** — Syne headings, Onest body (no flash of system font)
4. **Track → Collection** — `collection` illustration on the collect screen
5. **Send → Stations** — **List | Map** toggle; map shows VIP (red) and STC (green) pins

Welcome shows again after each full reload until you tap **Get started**.

## Start the app

```bash
cd mobile
npm run start:clear
```

If Metro was already running, stop it (Ctrl+C) and restart with `start:clear` after pulling fixes.

Scan the QR code with:

- **Android:** Expo Go app
- **iOS:** Camera app → opens in Expo Go

### Expo Go version

This project uses **Expo SDK 54** — the version that matches **Expo Go on the App Store** (iOS and Android). You do **not** need a special update beyond what’s already installed.

> **Note:** SDK 55/56 are newer than App Store Expo Go. If you ever see “requires a newer version of Expo Go” with no store update, the project SDK needs to match the store (currently 54).

### Troubleshooting

| Error | Fix |
|-------|-----|
| `transformFile` / Babel errors | Run `npm install` in `mobile/` (needs `babel-preset-expo` + `react-native-worklets`) |
| Port in use | Press `Y` for another port, or `npx expo start --port 8085 -c` |
| Can’t connect on phone | Same Wi‑Fi as PC; try `npx expo start --tunnel` |

## Project layout

```
mobile/
  app/           Expo Router screens (home, send, track)
  src/
    components/  Native UI + splash
    lib/         Booking, tracking, stations (AsyncStorage)
    constants/   Theme tokens (teal / amber)
  assets/images/ Brand illustrations
```

## Web app (unchanged)

The Next.js app in the repo root still runs separately:

```bash
npm run dev:fresh   # port 3001
```

Mobile and web share the same flows and mock data logic; web is not required to run the mobile app.
