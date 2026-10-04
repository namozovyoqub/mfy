# Surxondaryo Viloyati MFY Pasport Tizimi va Xatlov Platformasi

Ushbu platforma Surxondaryo viloyatining barcha tuman va shaharlari bo'yicha aholining ijtimoiy-iqtisodiy holatini aniqlash, xonadonbay xatlov o'tkazish (100 ta savoldan iborat so'rovnoma), mahallalar mas'ullari faoliyatini muvofiqlashtirish hamda Google Sheets va sun'iy intellekt (Gemini Flash) orqali chuqur tahlil yuritish uchun mo'ljallangan yagona professional tizimdir.

---

## 🚀 Asosiy Imkoniyatlar

1. **Mahallalar Mas'ullari (MFY Raislari) Bo'limi:**
   - Surxondaryo viloyatining barcha 15 ta tuman va shaharlari bo'yicha **723 ta mahalla** to'liq qamrab olingan.
   - Tumanlar, mahalla nomi, mas'ul F.I.Sh, telefon raqami va holati (Faol / Vakant) bo'yicha tezkor qidiruv va filtrlash.
   - Bitta bosish orqali to'g'ridan-to'g'ri qo'ng'iroq qilish imkoniyati (`tel:`).
   - Yangi mas'ul qo'shish, mavjudlarini tahrirlash va ro'yxatni Excel / CSV formatida eksport qilish.

2. **100 ta Savoldan Iborat Xonadonbay Xatlov So'rovnomasi:**
   - Rasmiy "Aholining ijtimoiy-iqtisodiy holatini aniqlash bo'yicha so'rovnoma" asosidagi 17 ta mantiqiy blok:
     - I. Xonadon to'g'risidagi ma'lumotlar (Oila boshlig'i, aholi, yosh toifalari)
     - II. Mehnat va bandlik
     - III. Ishsizlarni ishga joylashtirish
     - IV. Oila daromadi va xarajatlari
     - V. Kredit va qarzdorlik
     - VI. Tadbirkorlik
     - VII. Kasb-hunar va til o'rganish
     - VIII. Ta'lim
     - IX. Tibbiy holat
     - X. Uy-joy va maishiy sharoit
     - XI. Kommunal xizmatlar
     - XII. Maishiy texnika ta'minoti
     - XIII. Tomorqa va chorvachilik
     - XIV. Sport va yoshlar
     - XV. Oilaning eng asosiy 3 ta muammosi
     - XVI. Oilaning eng asosiy 3 ta ehtiyoji
     - XVII. Mas'ul xodim xulosasi va baholash
   - Bosqichma-bosqich (Wizard) navigatsiya, to'ldirilish foizi (progress bar), avtosaqlash (draft) va xatlovlar arxivi.

3. **Google Sheets va Apps Script bilan Doimiy Sinxronlashtirish:**
   - **Apps Script ID:** `1IyoVMJ98zSeHEYeCVmLEN7slOoroZ7tKpuZccVKUvKQ`
   - Tizimda to'ldirilgan har bir so'rovnoma avtomatik ravishda Google Sheetsga yoziladi.
   - Tizimdagi umumiy statistika, grafiklar va hisob-kitoblar ham lokal kiritilgan ma'lumotlar, ham Google Sheetsdan kelayotgan oqim bilan **doimiy bog'langan holda yangilanib turadi**.
   - Loyiha ichida tayyor `Code.gs` skripti mavjud.

4. **Sun'iy Intellekt (Google Gemini Flash) Tahlil Moduli:**
   - Gemini Flash AI orqali viloyat va mahallalar xatlov natijalarini real vaqtda chuqur tahlil qilish uchun qulay interfeys.
   - API kalit kiritish modali va tayyor chaqiruv infratuzilmasi ta'minlangan (foydalanuvchi kalit kiritishi bilan zudlik bilan ishga tushadi).

5. **Yuqori Tezlik va Yengil Arxitektura:**
   - 21.7 Megabaytlik eski og'ir baza o'rniga yengil, modulli va zamonaviy arxitektura joriy etildi (yuklanish tezligi 10 barobardan ortiq oshirildi).

---

## 📁 Loyiha Tuzilmasi

```
mfy/
├── index.html            # Asosiy veb-ilova sahifasi (SPA)
├── css/
│   └── style.css         # Dizayn, responsiv uslublar, dark/light rejim
├── js/
│   ├── data.js           # 723 ta mahalla, 100 ta savol sxemasi, viloyat bazasi
│   ├── officials.js      # Mahallalar mas'ullarini filtrlash va boshqarish
│   ├── survey.js         # 100 ta savol so'rovnomasi va arxiv
│   ├── sync.js           # Google Apps Script va Sheets real-time sinxronlash
│   ├── stats.js          # Chart.js grafiklari va statistik tahlil
│   └── ai.js             # Gemini Flash AI moduli
├── data/
│   ├── officials.json    # 723 ta mahalla raislari ma'lumotlari
│   └── survey_schema.json# 100 ta savol to'liq sxemasi
├── Code.gs               # Google Apps Script Web App kodi
├── vercel.json           # Vercel deployment konfiguratsiyasi
├── package.json          # Node konfiguratsiyasi
└── README.md             # Qo'llanma va hujjatlar
```

---

## 🔧 Google Sheets va Apps Scriptni Ulash

1. O'zingizning Google Sheets jadvalingizni oching (yoki Apps Script ID: `1IyoVMJ98zSeHEYeCVmLEN7slOoroZ7tKpuZccVKUvKQ`).
2. Google Sheets menyusidan: **Extensions (Kengaytmalar) -> Apps Script** bo'limiga o'ting.
3. Loyihamizdagi `Code.gs` fayli ichidagi kodni nusxalab, Apps Script muharririga joylang va Saqlang (Save).
4. **Deploy (Joylashtirish) -> New deployment (Yangi joylashtirish)** tugmasini bosing:
   - Select type: **Web app**
   - Execute as: **Me** (Mening nomimdan)
   - Who has access: **Anyone** (Har kim)
5. **Deploy** tugmasini bosing va berilgan `Web app URL` manzilini nusxalab oling.
6. Tizimimizdagi yuqori o'ng burchakdagi **⚙ Apps Script** tugmasini bosib, o'sha URL manzilni kiritib saqlang!

---

## 🌐 Deploy (GitHub va Vercel)

Loyiha Vercel va GitHub uchun 100% tayyor holatda sozlangan.
- GitHub'ga push qilinganda avtomatik Vercel'da ishga tushadi.
- `npx vercel` yoki Vercel Dashboard orqali to'g'ridan-to'g'ri statik deploy qilish mumkin.
