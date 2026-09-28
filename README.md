# Smart Finance AI (Moliyachi Platformasi)

Smart Finance AI — shaxsiy va oilaviy moliyaviy oqimlarni (daromad, xarajat, omonat, qarzlar) markazlashgan holda kuzatish, erkin matn va ovozli buyruqlar orqali operatsiyalarni avtomatlashtirish hamda sun'iy intellekt (AI Moliyachi) yordamida chuqur analitika taqdim etuvchi zamonaviy FinTech platformasi.

---

## 🚀 Texnologik Stek

- **Frontend:** Next.js 16+ (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts (Donut & Bar grafiklari), Glassmorphism va Dark/Light mode.
- **Backend API:** Python (FastAPI), Uvicorn, SQLAlchemy ORM, Pydantic v2.
- **Ma'lumotlar Bazasi:** SQLite (barcha 6 ta jadval bilan noldan tayyor sozlangan) va PostgreSQL (DATABASE_URL orqali to'liq mos).
- **Ovoz Tahlili (STT):** OpenAI Whisper API + WebRTC / MediaRecorder + Web Speech API fallback.
- **AI Moliyachi (LLM):** OpenAI GPT-4o-mini (JSON Mode) + O'rnatilgan aqlli o'zbek/rus tili NLP parseri (API kalitisiz ham 100% ishlaydi).

---

## 📁 Loyiha Strukturasi

```
Moliyachi site/
├── backend/
│   ├── database.py         # SQLAlchemy engine va DB sessiyalari
│   ├── models.py           # users, wallets, transactions, debts, savings_goals, input_logs
│   ├── schemas.py          # Pydantic DTO modellari
│   ├── ai_service.py       # Whisper STT, GPT-4o-mini strukturalash va NLP fallback
│   ├── advisor_service.py  # DTI tahlili, impulsiv xarajatlar detektori, AI Chat
│   ├── main.py             # FastAPI REST endpointlari va atomik tranzaksiyalar
│   └── requirements.txt    # Python kutubxonalari
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx            # Boshqaruv paneli (Dashboard)
│   │   │   ├── wallets/page.tsx    # Hamyonlar & Kartalar
│   │   │   ├── transactions/page.tsx # Tranzaksiyalar daftari & CSV eksport
│   │   │   ├── debts/page.tsx      # Qarzlar daftari (Lend & Borrow)
│   │   │   ├── goals/page.tsx      # Omonat & Maqsadlar
│   │   │   ├── ai-advisor/page.tsx # AI Moliyachi Tahlili & Live Chat
│   │   │   └── logs/page.tsx       # Kiritish tarixi & JSON ko'rish
│   │   ├── components/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── SmartInputBar.tsx   # Mikrofon bilan ovoz yozish va matn paneli
│   │   │   ├── ConfirmationModal.tsx # Interaktiv tasdiqlash oynasi
│   │   │   ├── DashboardCharts.tsx # Recharts grafiklari
│   │   │   ├── SettingsModal.tsx   # API kalit va valyuta sozlamalari
│   │   │   └── AppLayout.tsx
│   │   └── lib/
│   │       └── api.ts              # API klient va modellar
│   └── package.json
└── start.bat               # Bitta bosishda loyihani ishga tushirish skripti
```

---

## ⚡ Loyihani Ishga Tushirish

### 1. Avtomatik ishga tushirish:
Loyihaning ildiz papkasidagi `start.bat` faylini ikki marta bosing. U avtomatik ravishda FastAPI backend va Next.js frontendni ishga tushiradi:
- **Frontend UI:** `http://localhost:3000`
- **Backend Swagger API Docs:** `http://127.0.0.1:8000/docs`

### 2. Qo'lda terminal orqali ishga tushirish:

**Backend:**
```bash
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

**Frontend:**
```bash
cd frontend
npm run dev -- -p 3000
```

---

## 💡 Asosiy Imkoniyatlar va Sinov Ssenariylari

1. **Smart Kiritish (Section 4.1):**
   - Dashboard markazidagi panelga quyidagi matnni kiriting yoki mikrofonda ayting:
     `Bugun 45 000 so'mga tushlik qildim va Jasurga benzinga 200 000 so'm qarz berdim`
   - **"AI Tahlil"** tugmasini bosing.
   - Ekraningizda **Interaktiv Tasdiqlash Modali** ochiladi. Unda 2 ta operatsiya ajratilgan bo'ladi (Chiqim: 45 000 UZS "Oziq-ovqat" va Qarz berdim: 200 000 UZS "Jasur").
   - Summani, hamyonni tahrirlashingiz va **"Tasdiqlash & Bazaga Saqlash"** tugmasi orqali ma'lumotlar bazasiga atomik tarzda yozib, hamyon balanslarini avtomatik yangilashingiz mumkin!

2. **Qarzlar Daftari (Section 5):**
   - "Menga qarzdorlar" va "Mening qarzlarim" alohida tablarda.
   - Qarz to'lov progressi, muddatlar va "To'lov qayd qilish" modali.

3. **Omonat va Maqsadlar:**
   - Maqsadlar bo'yicha progress barlar va AI tezlatish tavsiyalari ("Har kuni 25 000 so'm orttirilsa, maqsadga 2 oy oldin erishiladi").

4. **AI Moliyachi Tahlili & Live Chat (Section 4.2):**
   - Moliyaviy salomatlik reytingi (0 - 100).
   - Impulsiv xarajatlar aniqlagichi (rejasiz xarajatlar ulushi).
   - Qarz yuki (DTI) ko'rsatkichi (35-40% xavf nazorati).
   - O'zbek tilida kontekstli savol-javob qiluvchi jonli chatbot.
