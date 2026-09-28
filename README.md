# Personal Transaction

Shaxsiy xarajat va daromadlarni hisobga olish uchun mobil ilova (iOS / Android). Ilova toʻliq **offline** ishlaydi: backend, server, roʻyxatdan oʻtish va internet talab qilinmaydi. Barcha maʼlumot faqat telefonning oʻzida saqlanadi.

## Asosiy tamoyillar

- **Backend yoʻq.** Maʼlumotlar qurilmadagi SQLite bazasida saqlanadi va hech qayerga yuborilmaydi.
- **Bank integratsiyasi yoʻq.** Ilova bank API'lariga (TBC, Uzum, Uzcard va h.k.) ulanmaydi, bank login/parol, karta maʼlumotlari yoki SMS kodlarini soʻramaydi. Hamma tranzaksiyalar qoʻlda kiritiladi.
- **Balans saqlanmaydi, hisoblanadi.** Har bir hisob balansi = boshlangʻich balans + daromadlar − xarajatlar ± oʻtkazmalar. Shuning uchun balans hech qachon tranzaksiyalardan farq qilmaydi.
- **Oʻchirish xavfsiz.** Tranzaksiya oʻchirilganda darhol yoʻqolmaydi — "Qaytarish" tugmasi bilan tiklash mumkin.
- **Interfeys oʻzbek tilida** (lotin), valyuta — soʻm (UZS).

## Imkoniyatlar

- **Hisoblar** — karta, naqd pul va boshqa hisoblar. Kartaga ixtiyoriy karta raqami (faqat koʻrsatish uchun) yozish mumkin. Keraksiz hisobni arxivlash.
- **Tranzaksiyalar** — xarajat, daromad va hisoblar orasida oʻtkazma. Bitta tranzaksiyaga bir nechta kategoriya, izoh va sana.
- **Qidiruv va filtrlar** — izoh, hisob, kategoriya yoki summa boʻyicha qidirish; davr, tur, hisob va kategoriya boʻyicha filtrlash.
- **Kategoriyalar** — tayyor kategoriyalar (Oziq-ovqat, Taksi, Korzinka, Dorixona, Fitnes va h.k.) va oʻzingiz yaratadigan kategoriyalar, ikonkasi bilan.
- **Statistika** — oylik daromad/xarajat grafigi, kategoriyalar boʻyicha taqsimot, hisoblar faolligi va oʻtgan oyga nisbatan oʻzgarish (%).
- **Himoya** — 4 xonali PIN kod, Face ID / barmoq izi bilan ochish. Notoʻgʻri PIN koʻp kiritilsa vaqtincha bloklanadi. Ilovalar almashtirgichida maʼlumotlar yashiriladi.
- **Qulayliklar** — tungi rejim, pastga tortib yangilash (pull-to-refresh), haptik javob.

## Texnologiyalar

| Soha           | Texnologiya                                       |
| -------------- | ------------------------------------------------- |
| Platforma      | Expo SDK 57, React Native 0.86, React 19.2        |
| Til            | TypeScript (strict)                               |
| Navigatsiya    | Expo Router (fayl asosidagi routing, native tabs) |
| Maʼlumotlar    | SQLite (`expo-sqlite`) + Drizzle ORM              |
| Maxfiy saqlash | `expo-secure-store` (PIN xeshi)                   |
| Biometriya     | `expo-local-authentication`                       |
| Roʻyxatlar     | FlashList                                         |
| Animatsiya     | Reanimated 4                                      |
| Test           | Jest (`jest-expo`)                                |
| Build          | EAS Build / EAS Submit                            |

Shrift — Roboto. React Compiler yoqilgan.

## Loyiha tuzilmasi

```
src/
├── app/                 # Ekranlar (Expo Router): har bir fayl — bitta ekran
│   ├── (tabs)/          # Pastki tablar: Asosiy, Tranzaksiyalar, Statistika, Sozlamalar
│   ├── account/         # Hisob qoʻshish / tahrirlash
│   ├── category/        # Kategoriya qoʻshish / tahrirlash
│   ├── transaction/     # Tranzaksiya qoʻshish / tahrirlash
│   ├── accounts.tsx     # Barcha hisoblar
│   ├── categories.tsx   # Barcha kategoriyalar
│   └── pin.tsx          # PIN oʻrnatish / oʻzgartirish
├── database/            # SQLite ulanishi, sxema, migratsiyalar, boshlangʻich maʼlumotlar
│   └── migrations/      # Drizzle migratsiyalari (SQL)
├── features/            # Biznes logika boʻlimlar boʻyicha
│   ├── accounts/
│   ├── categories/
│   ├── transactions/
│   ├── statistics/
│   └── security/        # PIN, biometriya, ilova qulfi
└── shared/
    ├── ui/              # Umumiy komponentlar (Button, Text, Toast, Screen …)
    ├── lib/             # Pul, sana, validatsiya, xatolar, logger
    ├── hooks/
    └── theme/           # Ranglar, oʻlchamlar, tipografiya
```

Har bir `features/<boʻlim>/` ichida bir xil qatlamlar bor:

- `types.ts` — turlar
- `validation.ts` — kiritilgan qiymatlarni tekshirish
- `repository.ts` — yozish (qoʻshish, tahrirlash, oʻchirish)
- `queries.ts` — oʻqish (SQL soʻrovlar)
- `hooks.ts` — ekranlar uchun React hooklar (maʼlumot oʻzgarsa ekran avtomatik yangilanadi)
- `presentation.ts` — koʻrsatish uchun formatlash
- `components/` — shu boʻlimga tegishli UI

## Ishga tushirish

Talablar: Node.js 20+, telefonda **Expo Go** ilovasi.

```bash
npm install
npx expo start --lan --clear   # telefon va kompyuter bitta Wi-Fi'da boʻlsa
npm run start:tunnel           # boshqa tarmoqda boʻlsa (bir marta `npx expo login` kerak)
```

Terminaldagi QR kodni telefon kamerasi (iOS) yoki Expo Go (Android) bilan skanerlang.

> Expo Go'da Face ID ishlamaydi (Apple cheklovi) — PIN va Android barmoq izi ishlaydi. Face ID faqat ilovaning oʻz build'ida ishlaydi.

## Build (EAS)

```bash
npx eas-cli@latest login
npx eas-cli@latest build --profile preview --platform android   # telefonga oʻrnatiladigan APK (bepul)
npx eas-cli@latest build --profile preview --platform ios       # Apple Developer akkaunt kerak
npx eas-cli@latest build --profile production                   # App Store / Google Play uchun
npx eas-cli@latest submit --profile production
```

Profillar `eas.json` da. Build raqamlari EAS serverida avtomatik oshiriladi.

## Skriptlar

| Buyruq                 | Vazifa                         |
| ---------------------- | ------------------------------ |
| `npm start`            | Dev serverni ishga tushirish   |
| `npm run typecheck`    | TypeScript tekshiruvi          |
| `npm run lint`         | ESLint                         |
| `npm test`             | Jest testlari                  |
| `npm run format`       | Prettier bilan formatlash      |
| `npm run format:check` | Formatlashni tekshirish        |
| `npm run db:generate`  | Drizzle migratsiya yaratish    |
| `npx expo-doctor`      | Dependency / config tekshiruvi |

## Maʼlumotlar bazasi

Jadvallar: `accounts`, `categories`, `transactions`, `transaction_categories`, `settings`.

- Summalar butun son sifatida (tiyinlarda) saqlanadi — kasr xatolari boʻlmaydi.
- Sxema oʻzgarsa: `src/database/schema.ts` ni tahrirlang va `npm run db:generate` bilan migratsiya yarating. Migratsiyalar ilova ochilganda avtomatik qoʻllanadi, undan oldin baza zaxira nusxasi olinadi.

## Litsenziya

[MIT](LICENSE) © 2026 Faxriddin Yuldashev
