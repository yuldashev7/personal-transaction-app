# Personal Transaction

Offline-first shaxsiy moliya ilovasi (iOS / Android). Bank integratsiyasi va backend yoʻq — barcha maʼlumot qurilmadagi SQLite'da. Balans har doim tranzaksiyalardan hisoblanadi.

Stack: Expo SDK 57, React Native 0.86, Expo Router, SQLite + Drizzle, TypeScript (strict).

## Ishga tushirish (Expo Go)

```bash
npm install
npx expo start --lan --clear   # telefon va Mac bitta Wi-Fi'da boʻlsa
npm run start:tunnel           # boshqa tarmoqda boʻlsa (bir marta `npx expo login` kerak)
```

QR kodni telefondagi Expo Go bilan skanerlang.

Expo Go'da Face ID ishlamaydi (Apple cheklovi) — ilova PIN'i va Android barmoq izi ishlaydi. Face ID'ni tekshirish uchun quyidagi native build kerak.

## Build (EAS)

```bash
npx eas-cli@latest login
npx eas-cli@latest build --profile preview --platform android   # telefonga oʻrnatiladigan APK
npx eas-cli@latest build --profile preview --platform ios       # ad hoc, Apple Developer akkaunt kerak
npx eas-cli@latest build --profile production                   # App Store / Google Play uchun
npx eas-cli@latest submit --profile production
```

Profillar `eas.json`'da. Versiya raqamlari (build number / versionCode) EAS serverida avtomatik oshiriladi.

## Scriptlar

| Buyruq                | Vazifa                         |
| --------------------- | ------------------------------ |
| `npm run typecheck`   | TypeScript tekshiruvi          |
| `npm run lint`        | ESLint                         |
| `npm test`            | Jest testlari                  |
| `npm run format`      | Prettier bilan formatlash      |
| `npm run db:generate` | Drizzle migratsiya yaratish    |
| `npx expo-doctor`     | Dependency / config tekshiruvi |
