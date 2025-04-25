// src/components/MortgageCalculator.jsx
import { useState, useEffect } from "react";

export default function MortgageCalculator() {
  /* --- form state ------------------------------------------------------- */
  const [housePrice,  setHousePrice]  = useState(30_000_000);
  const [downPayment, setDownPayment] = useState(0);
  const [annualRate,  setAnnualRate]  = useState(5);
  const [months,      setMonths]      = useState(36);

  /* --- result state ----------------------------------------------------- */
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  /* --- helper ----------------------------------------------------------- */
  const formatKzt = num =>
    new Intl.NumberFormat("ru-KZ", {
      style: "currency",
      currency: "KZT",
      maximumFractionDigits: 0,
    }).format(num);

  /* --- API call --------------------------------------------------------- */
  async function calculate() {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("http://192.168.0.2:8080/mortgage/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          house_price: housePrice,
          down_payment: downPayment,
          annual_rate: annualRate,
          months,
          extra: [],             // ← early‑repayment list, if you add that UI
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setResult(await res.json());
    } catch (err) {
      setErrorMsg(err.message || "Ошибка запроса");
    } finally {
      setLoading(false);
    }
  }

  /* --- re‑calculate whenever inputs change ----------------------------- */
  useEffect(() => { calculate(); }, [housePrice, downPayment, annualRate, months]);

  /* --- UI --------------------------------------------------------------- */
  return (
    <div className="mx-auto max-w-xl p-6 space-y-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-semibold text-teal-700">
        Калькулятор ипотеки
      </h1>

      {/* Стоимость жилья --------------------------------------------------- */}
      <div>
        <label className="font-medium">Стоимость жилья: {formatKzt(housePrice)}</label>
        <input type="range" min="5000000" max="100000000" step="100000"
               value={housePrice}
               onChange={e => setHousePrice(+e.target.value)}
               className="w-full" />
      </div>

      {/* Сумма накоплений / первоначальный взнос -------------------------- */}
      <div>
        <label className="font-medium">
          Сумма накоплений (аванс): {formatKzt(downPayment)}
        </label>
        <input type="range" min="0" max={housePrice} step="100000"
               value={downPayment}
               onChange={e => setDownPayment(+e.target.value)}
               className="w-full" />
      </div>

      {/* Ставка ----------------------------------------------------------- */}
      <div className="flex items-center space-x-2">
        <label className="font-medium">Ставка, % годовых:</label>
        <input type="number" min="0" max="20" step="0.1"
               value={annualRate}
               onChange={e => setAnnualRate(+e.target.value)}
               className="w-24 px-2 py-1 border rounded" />
      </div>

      {/* Срок ------------------------------------------------------------- */}
      <div>
        <label className="font-medium">Срок займа (мес): {months}</label>
        <input type="range" min="6" max="360" step="6"
               value={months}
               onChange={e => setMonths(+e.target.value)}
               className="w-full" />
      </div>

      {/* --- Results ------------------------------------------------------ */}
      {loading && <p className="text-sm text-gray-500">Расчёт...</p>}
      {errorMsg && (
        <p className="text-sm text-red-600">Ошибка: {errorMsg}</p>
      )}
      {result && !loading && (
        <div className="grid grid-cols-2 gap-4 text-center bg-gray-50 p-4 rounded">
          <div>
            <p className="text-gray-500 text-sm">Платёж / мес</p>
            <p className="text-lg font-bold">
              {formatKzt(result.monthly_payment)}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Переплата</p>
            <p className="text-lg font-bold">
              {formatKzt(result.overpayment)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
