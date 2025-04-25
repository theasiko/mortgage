# app/logic.py
from dataclasses import dataclass
import math
from typing import List, Dict, Optional

@dataclass
class EarlyRepayment:
    month: int        # 1‑based month index
    amount: float     # extra principal payment (KZT)

def annuity_payment(principal: float, annual_rate: float, months: int) -> float:
    """Monthly annuity payment."""
    r = annual_rate / 12 / 100        # monthly rate in decimals
    if r == 0:
        return principal / months
    k = r * (1 + r) ** months / ((1 + r) ** months - 1)
    return principal * k

def schedule(
    principal: float,
    annual_rate: float,
    months: int,
    extra: Optional[List[EarlyRepayment]] = None,
) -> List[Dict]:
    """Return a month‑by‑month amortisation schedule."""
    extra_map = {e.month: e.amount for e in (extra or [])}
    balance   = principal
    payment   = annuity_payment(principal, annual_rate, months)
    plan      = []

    for m in range(1, months + 1):
        interest        = balance * (annual_rate / 12 / 100)
        principal_part  = payment - interest

        # early repayment (if any)
        overpay         = extra_map.get(m, 0.0)
        principal_part += overpay
        balance         = max(balance - principal_part, 0)

        plan.append(
            dict(
                month=m,
                payment=round(payment, 2),
                interest=round(interest, 2),
                principal=round(principal_part, 2),
                balance=round(balance, 2),
            )
        )
        if balance == 0:
            break
    return plan
