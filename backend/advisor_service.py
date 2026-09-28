import os
import json
from typing import Dict, Any, List, Optional
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
import models

def calculate_financial_health_and_insights(db: Session, user_id: str) -> Dict[str, Any]:
    # 1. Fetch transactions of last 30 days
    thirty_days_ago = date.today() - timedelta(days=30)
    transactions = db.query(models.Transaction).filter(
        models.Transaction.user_id == user_id,
        models.Transaction.date >= thirty_days_ago
    ).all()

    total_income = sum(float(t.amount) for t in transactions if t.type == "income")
    total_expense = sum(float(t.amount) for t in transactions if t.type == "expense")

    # Categories breakdown
    cat_expenses = {}
    for t in transactions:
        if t.type == "expense":
            cat_expenses[t.category] = cat_expenses.get(t.category, 0.0) + float(t.amount)

    # 2. Impulsive spending detection
    # Impulsive categories: Ko'ngilochar, Kafe/Kofe, Rejasiz xaridlar, Taksi
    impulsive_categories = ["Ko'ngilochar", "Kiyim-kechak", "Kafe/Restoran"]
    impulsive_total = sum(cat_expenses.get(cat, 0.0) for cat in impulsive_categories)
    impulsive_percentage = (impulsive_total / total_expense * 100) if total_expense > 0 else 0.0

    impulsive_status = "ideal"
    impulsive_advice = "Rejasiz xarajatlar minimal darajada saqlanmoqda. Barakalla!"
    if impulsive_percentage > 25:
        impulsive_status = "high"
        impulsive_advice = f"Oylik xarajatlaringizning {impulsive_percentage:.1f}% qismi ({impulsive_total:,.0f} UZS) impulsiv toifalarga sarflanmoqda. Kofe va ko'ngilochar xarajatlarni haftalik rejalashtirish tavsiya etiladi."
    elif impulsive_percentage > 15:
        impulsive_status = "moderate"
        impulsive_advice = f"Impulsiv xarajatlar {impulsive_percentage:.1f}% ni tashkil etadi. Kichik tejamkorlik orqali omonatga ko'proq mablag' yo'naltirishingiz mumkin."

    # 3. Debt-to-Income (DTI) Ratio
    # Debts that user must pay (type == 'borrow', status == 'active')
    active_borrows = db.query(models.Debt).filter(
        models.Debt.user_id == user_id,
        models.Debt.type == "borrow",
        models.Debt.status == "active"
    ).all()

    total_active_debt_balance = sum(float(d.total_amount - d.paid_amount) for d in active_borrows)
    # Estimated monthly debt obligation (assume 3-month repayment window if no due_date)
    monthly_debt_obligation = total_active_debt_balance / 3 if total_active_debt_balance > 0 else 0.0

    dti_ratio = (monthly_debt_obligation / total_income * 100) if total_income > 0 else (50.0 if total_active_debt_balance > 0 else 0.0)

    dti_level = "safe"
    dti_warning = None
    if dti_ratio > 40:
        dti_level = "critical"
        dti_warning = f"Qarz yukingiz (DTI) oylik sof daromadingizning {dti_ratio:.1f}% ini tashkil qilmoqda! Bu 40% lik xavfli chegaradan yuqori. Yangi kredit yoki qarz olishni to'xtating va darhol 'Snowball' yoki 'Avalanche' to'lov strategiyasini qo'llang."
    elif dti_ratio > 30:
        dti_level = "warning"
        dti_warning = f"Qarz yuki {dti_ratio:.1f}% ko'rsatkichida (30-40% oraliq). Xarajatlarni qat'iy nazorat qiling."
    else:
        dti_warning = f"Qarz yuklamasi me'yorda ({dti_ratio:.1f}%). Moliyaviy xavfsizlik zonadasiz."

    # 4. Savings Goals velocity & advice
    savings_goals = db.query(models.SavingsGoal).filter(
        models.SavingsGoal.user_id == user_id,
        models.SavingsGoal.status == "in_progress"
    ).all()

    savings_advice_list = []
    for goal in savings_goals:
        target = float(goal.target_amount)
        current = float(goal.current_amount)
        remaining = max(0.0, target - current)
        pct = (current / target * 100) if target > 0 else 0

        # Calculate recommendations
        daily_boost_25k = 25000 * 30  # 750,000 UZS per month extra
        months_saved = (remaining / (daily_boost_25k + 1)) if remaining > 0 else 0
        advice = f"'{goal.title}': {pct:.1f}% to'plandi ({current:,.0f} / {target:,.0f} UZS). Agar kuniga 25 000 so'm qo'shimcha tejab jamg'arsangiz, maqsadga taxminan {max(1, int(months_saved))} oy oldinroq erishasiz!"
        savings_advice_list.append({
            "goal_id": goal.id,
            "title": goal.title,
            "current_amount": current,
            "target_amount": target,
            "percentage": pct,
            "advice": advice
        })

    # Overall financial health score (0-100)
    health_score = 75
    if total_income > 0:
        savings_rate = ((total_income - total_expense) / total_income) * 100
        health_score = int(min(100, max(20, 50 + (savings_rate * 0.5) - (dti_ratio * 0.4) - (impulsive_percentage * 0.3))))
    else:
        health_score = 65

    return {
        "health_score": health_score,
        "monthly_income": total_income,
        "monthly_expense": total_expense,
        "net_savings": max(0.0, total_income - total_expense),
        "dti_ratio": round(dti_ratio, 1),
        "dti_level": dti_level,
        "dti_warning": dti_warning,
        "impulsive_total": impulsive_total,
        "impulsive_percentage": round(impulsive_percentage, 1),
        "impulsive_status": impulsive_status,
        "impulsive_advice": impulsive_advice,
        "category_breakdown": [{"category": k, "amount": v} for k, v in sorted(cat_expenses.items(), key=lambda x: x[1], reverse=True)],
        "savings_goals_insights": savings_advice_list
    }


async def answer_financial_chat(db: Session, user_id: str, message: str, custom_api_key: Optional[str] = None) -> str:
    insights = calculate_financial_health_and_insights(db, user_id)
    wallets = db.query(models.Wallet).filter(models.Wallet.user_id == user_id).all()
    total_balance = sum(float(w.balance) for w in wallets)

    api_key = custom_api_key or os.getenv("OPENAI_API_KEY")

    if api_key:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=api_key)

            context_str = f"""Foydalanuvchi ma'lumotlari:
- Jami joriy balans (barcha hamyonlar): {total_balance:,.0f} UZS
- Oylik daromad: {insights['monthly_income']:,.0f} UZS
- Oylik chiqim: {insights['monthly_expense']:,.0f} UZS
- Moliyaviy salomatlik bali: {insights['health_score']}/100
- Qarz yuki (DTI): {insights['dti_ratio']}% ({insights['dti_level']})
- Impulsiv xarajatlar: {insights['impulsive_percentage']}% ({insights['impulsive_total']:,.0f} UZS)
- Eng katta xarajat toifalari: {insights['category_breakdown'][:3]}
"""
            system_prompt = f"""Siz professional va mehribon 'AI Moliyachi' shaxsiy moliya maslahatchisisiz.
Foydalanuvchining savoliga uning real moliyaviy kontekstidan kelib chiqib, aniq raqamlar, faktlar va taktik tavsiyalar bilan o'zbek tilida ravon, professional va rag'batlantiruvchi tarzda javob bering.

{context_str}"""

            resp = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                temperature=0.3
            )
            return resp.choices[0].message.content
        except Exception as e:
            print(f"Chat API error: {e}")

    # Fallback intelligent contextual responses
    msg_l = message.lower()
    if "nimaga" in msg_l or "qayerga" in msg_l or "sarfladim" in msg_l or "ko'p" in msg_l:
        top_cats = insights['category_breakdown'][:2]
        cats_text = ", ".join([f"{c['category']} ({c['amount']:,.0f} UZS)" for c in top_cats]) if top_cats else "Oziq-ovqat"
        return f"Tahlillarimga ko'ra, oxirgi 30 kunda eng ko'p mablag' **{cats_text}** toifalariga sarflangan. Jami xarajatlaringiz {insights['monthly_expense']:,.0f} UZS ni tashkil etadi. Ushbu toifalarni 10-15% qisqartirish orqali oyiga qo'shimcha {insights['monthly_expense']*0.12:,.0f} UZS tejashingiz mumkin!"

    if "qarz" in msg_l or "dti" in msg_l:
        return f"Sizning joriy Qarz yuklama darajangiz (DTI) **{insights['dti_ratio']}%** ni tashkil etadi ({insights['dti_warning']}). Qarzni tezroq uzish uchun yuqori foizli yoki shaxsiy qarz beruvchilardan boshlab to'lashni tavsiya qilaman."

    if "omonat" in msg_l or "jamg'ar" in msg_l or "maqsad" in msg_l:
        if insights['savings_goals_insights']:
            first_g = insights['savings_goals_insights'][0]
            return f"Jamg'arma bo'yicha: {first_g['advice']} Bundan tashqari, har oy maosh olganingizda avtomatik 10% ini darhol omonat hisobiga o'tkazish odatini shakllantiring."
        return "Sizda hali faol omonat maqsadi yaratilmagan. 'Omonat va Maqsadlar' bo'limida yangi moliyaviy maqsad qo'shing va AI Moliyachi sizga unga erishishning eng tezkor marshrutini hisoblab beradi!"

    return f"Moliyaviy ko'rsatkichlaringiz: Sof balansingiz {total_balance:,.0f} UZS, oylik kirim {insights['monthly_income']:,.0f} UZS, oylik chiqim {insights['monthly_expense']:,.0f} UZS. Moliyaviy salomatlik reytingingiz {insights['health_score']}/100. Qaysi yo'nalish bo'yicha (xarajatlarni qisqartirish, qarzlar yoki omonat) batafsil maslahat olishni xohlaysiz?"
