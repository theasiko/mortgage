from app.logic import annuity_payment

def test_annuity_roundtrip():
    p  = 10_000_000      # principal
    mp = annuity_payment(p, 5, 36)
    assert round(mp, 2) == 299713.74
