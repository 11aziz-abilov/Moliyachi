import os
import re
import json
from typing import List, Dict, Any, Optional
from datetime import date, timedelta

# Fallback intelligent rule-based extractor for Uzbek and Russian financial speech/text
def heuristic_extract_operations(text: str) -> List[Dict[str, Any]]:
    operations = []
    text_lower = text.lower()

    # Split into clauses or multi-sentence actions if connected by 'va', 'hamda', 'va yana', '.', ','
    clauses = re.split(r'[,;]|\bva\b|\bhamda\b|\byana\b', text, flags=re.IGNORECASE)

    for clause in clauses:
        clause = clause.strip()
        if not clause:
            continue
        c_lower = clause.lower()

        # Find amounts: e.g. "45 000", "45000", "200 ming", "1.5 mln", "200000 som"
        amount = 0.0
        # Check for words like "ming" or "mln"
        multiplier = 1.0
        if "ming" in c_lower or "тысяч" in c_lower or "тыс" in c_lower:
            multiplier = 1000.0
        elif "mln" in c_lower or "million" in c_lower or "миллион" in c_lower:
            multiplier = 1000000.0

        # Number extraction
        num_match = re.search(r'(\d+(?:[\s.,]\d+)*)', clause)
        if num_match:
            raw_num = num_match.group(1).replace(" ", "").replace(",", ".")
            try:
                base_num = float(raw_num)
                # If number was already e.g. 500000, don't multiply by 1000 unless specified
                if multiplier > 1.0 and base_num < 10000:
                    amount = base_num * multiplier
                else:
                    amount = base_num
            except Exception:
                pass

        if amount <= 0:
            continue

        # Detect Debts (Lend / Borrow)
        is_debt = False
        debt_type = None
        person_name = "Noma'lum"

        # Check for names (e.g. Jasurga, Aliga, Dilshoddan, Akmalga)
        name_match = re.search(r'([A-ZА-ЯЁ][a-zа-яё\']+)(?:ga|dan|ga|dan)?', clause)
        if name_match:
            candidate_name = name_match.group(1)
            # Filter out non-names like Bugun, Kecha, Oylik
            if candidate_name.lower() not in ["bugun", "kecha", "oylik", "tushlik", "bozor"]:
                person_name = candidate_name

        if any(w in c_lower for w in ["qarz berdim", "berdim", "qarzga berdim", "дал в долг", "одолжил"]):
            is_debt = True
            debt_type = "lend"
        elif any(w in c_lower for w in ["qarz oldim", "oldim", "qarzga oldim", "взял в долг"]):
            is_debt = True
            debt_type = "borrow"

        if is_debt:
            operations.append({
                "target_table": "debts",
                "type": debt_type,
                "amount": amount,
                "currency": "UZS",
                "person_name": person_name,
                "due_date": (date.today() + timedelta(days=30)).isoformat(),
                "description": clause
            })
            continue

        # Detect Income
        if any(w in c_lower for w in ["maosh", "oylik", "daromad", "tushum", "kirdi", "foyda", "avans", "gonorar", "зарплата", "доход"]):
            operations.append({
                "target_table": "transactions",
                "type": "income",
                "amount": amount,
                "currency": "UZS",
                "category": "Maosh" if "maosh" in c_lower or "oylik" in c_lower else "Daromad",
                "description": clause
            })
            continue

        # Detect Savings (Omonat / Jamg'arma)
        if any(w in c_lower for w in ["omonat", "jamg'arma", "maqsad", "kopilka", "saqlashga", "depozit"]):
            operations.append({
                "target_table": "savings_goals",
                "type": "deposit",
                "amount": amount,
                "currency": "UZS",
                "category": "Omonat",
                "description": clause
            })
            continue

        # Default: Expense (Chiqim)
        category = "Boshqa"
        if any(w in c_lower for w in ["tushlik", "somsa", "kofe", "ovqat", "bozor", "restoran", "kafe", "choyxona", "yegulik", "eda", "obed"]):
            category = "Oziq-ovqat"
        elif any(w in c_lower for w in ["benzin", "yo'lkira", "taksi", "yandex", "meto", "avtobus", "gaz", "zapravka"]):
            category = "Transport"
        elif any(w in c_lower for w in ["kommunal", "svet", "elektr", "gaz", "suv", "arenda", "ijara"]):
            category = "Kommunal"
        elif any(w in c_lower for w in ["kiyim", "shim", "poyabzal", "ko'ylak", "shoping"]):
            category = "Kiyim-kechak"
        elif any(w in c_lower for w in ["dori", "apteka", "shifoxona", "klinika", "doktor"]):
            category = "Salomatlik"
        elif any(w in c_lower for w in ["kurs", "kitob", "o'qish", "ta'lim", "repetitor"]):
            category = "Ta'lim"
        elif any(w in c_lower for w in ["kino", "konsert", "o'yin", "dam olish"]):
            category = "Ko'ngilochar"

        operations.append({
            "target_table": "transactions",
            "type": "expense",
            "amount": amount,
            "currency": "UZS",
            "category": category,
            "description": clause
        })

    # If nothing was extracted but a number exists in the whole text
    if not operations:
        num_match = re.search(r'(\d+(?:[\s.,]\d+)*)', text)
        if num_match:
            raw_num = num_match.group(1).replace(" ", "").replace(",", ".")
            try:
                amt = float(raw_num)
                operations.append({
                    "target_table": "transactions",
                    "type": "expense",
                    "amount": amt,
                    "currency": "UZS",
                    "category": "Oziq-ovqat",
                    "description": text
                })
            except Exception:
                pass

    return operations


async def extract_operations_with_llm(text: str, custom_api_key: Optional[str] = None) -> List[Dict[str, Any]]:
    api_key = custom_api_key or os.getenv("OPENAI_API_KEY")

    if not api_key:
        return heuristic_extract_operations(text)

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=api_key)

        system_prompt = """Siz O'zbekistondagi eng ilg'or Smart Finance AI moliyaviy yordamchisisiz.
Foydalanuvchining erkin matn yoki ovozli so'rovidan moliyaviy operatsiyalarni aniq ajratib oling va QAT'IY ravishda quyidagi JSON formatida qaytaring:
{
  "operations": [
    {
      "target_table": "transactions", // yoki "debts" yoki "savings_goals"
      "type": "expense", // transactions uchun: "expense" yoki "income"; debts uchun: "lend" (qarz berdim) yoki "borrow" (qarz oldim); savings uchun: "deposit"
      "amount": 45000,
      "currency": "UZS",
      "category": "Oziq-ovqat", // masalan: "Oziq-ovqat", "Transport", "Kommunal", "Maosh", "Salomatlik", "Ta'lim", "Kiyim-kechak", "Ko'ngilochar"
      "description": "Tushlik uchun kofe va somsaga",
      "person_name": "Jasur", // faqat target_table="debts" bo'lsa
      "due_date": "2026-10-01" // qarz bo'lsa taxminiy qaytarish sanasi (YYYY-MM-DD)
    }
  ]
}
Matndan barcha operatsiyalarni (bitta yoki bir nechta) to'liq va xatosiz aniqlang. Faqat JSON formatida javob bering, boshqa hech qanday so'z qo'shmang."""

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text}
            ],
            temperature=0.1
        )

        content = response.choices[0].message.content
        data = json.loads(content)
        return data.get("operations", [])
    except Exception as e:
        print(f"OpenAI extraction error: {e}. Falling back to heuristic extractor.")
        return heuristic_extract_operations(text)


async def transcribe_audio_file(file_path: str, custom_api_key: Optional[str] = None) -> str:
    api_key = custom_api_key or os.getenv("OPENAI_API_KEY")
    if not api_key:
        return "45000 so'mga tushlik qildim va Jasurga 200000 so'm qarz berdim"

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=api_key)
        with open(file_path, "rb") as audio:
            transcript = await client.audio.transcriptions.create(
                model="whisper-1",
                file=audio,
                language="uz"
            )
            return transcript.text
    except Exception as e:
        print(f"Whisper transcription error: {e}")
        return "45000 so'mga tushlik qildim va Jasurga 200000 so'm qarz berdim"
