import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Info, Calculator, Layers, DollarSign, AlertTriangle } from "lucide-react";

// ---------------------- Century 21 palette (from your brand list) ----------------------
const C21 = {
  gold: "#b99861",          // Gold Texture
  goldAccent: "#beaf87",    // Relentless Gold
  darkGold: "#a19276",      // Dark Gold
  lightGold: "#f1ebdf",     // Light Gold
  white: "#ffffff",         // White
  lightGrey: "#e6e7e8",     // Light Grey
  medGrey: "#808285",       // Medium Grey
  obsGrey: "#252526",       // Obsessed Grey
  ink: "#121212",           // Digital Black
};

// ---------------------- Utilities ----------------------
const fmt = (n) => Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
const fmt2 = (n) => Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); // kept for tests
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const toInt = (v) => Math.max(0, Math.round(Number(v || 0)));
const dollars0 = (n) => "$" + fmt(n);
const dollars2 = (n) => "$" + fmt2(n); // kept for tests

// Program-locked down payment percentages
const LOCKED_DOWN_BY_PROGRAM = {
  Conventional: 5,
  FHA: 3.5,
  VA: 0,
  USDA: 0,
};

function estimateMonthlyPMI(loan, ltv) {
  if (ltv < 0.8) return 0;
  let annualRate = 0.006;
  if (ltv >= 0.97) annualRate = 0.012;
  else if (ltv >= 0.95) annualRate = 0.011;
  else if (ltv >= 0.90) annualRate = 0.009;
  else if (ltv >= 0.85) annualRate = 0.0075;
  return (loan * annualRate) / 12;
}

function pmt(rateMonthly, n, pv) {
  if (rateMonthly === 0) return -(pv / n);
  const r = rateMonthly;
  return -(pv * r) / (1 - Math.pow(1 + r, -n));
}

// ---------------------- Lightweight runtime tests (console only) ----------------------
(function runSelfTests() {
  const approx = (a, b, eps = 0.02) => Math.abs(a - b) < eps;
  try {
    const payment = -pmt(0.0675 / 12, 360, 300000);
    console.assert(approx(Number(payment.toFixed(2)), 1945.29), "PMT formula sanity check failed");
    console.assert(estimateMonthlyPMI(300000, 0.95) === (300000 * 0.011) / 12, "PMI @95% LTV failed");
    console.assert(estimateMonthlyPMI(300000, 0.79) === 0, "PMI below 80% LTV should be 0");
    // Formatting + helpers
    console.assert(fmt2(undefined) === "0.00", "fmt2 should handle undefined -> 0.00");
    console.assert(dollars2(1234.5) === "$1,234.50", "dollars2 format failed");
    console.assert(dollars0(1234.56) === "$1,235", "dollars0 should round to whole dollars");
    // Program lock mapping
    console.assert(LOCKED_DOWN_BY_PROGRAM.FHA === 3.5 && LOCKED_DOWN_BY_PROGRAM.VA === 0 && LOCKED_DOWN_BY_PROGRAM.USDA === 0 && LOCKED_DOWN_BY_PROGRAM.Conventional === 5, "Locked down payment mapping failed");
  } catch (e) {
    console.warn("Self-tests encountered an error:", e);
  }
})();

export default function MortgageCalculatorLanding() {
  // Language toggle
  const [lang, setLang] = useState("en");

  // Base inputs
  const [homePrice, setHomePrice] = useState(375000);
  const [downPct, setDownPct] = useState(LOCKED_DOWN_BY_PROGRAM.Conventional);
  const [rate, setRate] = useState(6.75);
  const [termYears, setTermYears] = useState(30);
  const [annualTaxes, setAnnualTaxes] = useState(4500);
  const [annualInsurance, setAnnualInsurance] = useState(2800);
  const [monthlyHOA, setMonthlyHOA] = useState(95);
  const [monthlyCDD, setMonthlyCDD] = useState(25);
  const [budget, setBudget] = useState(2500);

  // County + Program
  const [county, setCounty] = useState("Polk");
  const [program, setProgram] = useState("Conventional");
  const fixedDownByProgram = { Conventional: 5, FHA: 3.5, VA: 0, USDA: 0 };

// When program changes, force the matching down %
React.useEffect(() => {
  setDownPct(fixedDownByProgram[program]);
}, [program]);

  // Scenarios (same county + program, named like your version)
  const [scenarios, setScenarios] = useState([
    { id: 1, priceDelta: 0, rateDelta: 0, downPctDelta: 0, name: "Current" },
    { id: 2, priceDelta: 30000, rateDelta: -0.25, downPctDelta: 2, name: "Optimistic" },
    { id: 3, priceDelta: -20000, rateDelta: 0.5, downPctDelta: -2, name: "Conservative" },
  ]);

  // County presets (fills taxes/insurance only; user can override)
  const countyPresets = {
    Polk: { taxes: 0.0118 * homePrice, insurance: 1700, description: "Rural charm, growing cities" },
    Osceola: { taxes: 0.0128 * homePrice, insurance: 1900, description: "Close to theme parks" },
    Orange: { taxes: 0.0142 * homePrice, insurance: 2100, description: "Urban center, Disney area" },
  };

  // Program notes (EN/ES)
  const notes = {
    en: {
      Conventional: "Private mortgage insurance required when LTV > 80%. Can be removed once LTV ≤ 80%.",
      FHA: "1.75% upfront MIP (financed) plus monthly MIP.",
      VA: "Funding fee varies (financed). No monthly MI.",
      USDA: "1% upfront guarantee fee (financed) plus 0.35% annual fee.",
    },
    es: {
      Conventional: "Seguro hipotecario privado requerido cuando LTV > 80%. Puede eliminarse automáticamente una vez que LTV ≤ 80%.",
      FHA: "1.75% de MIP inicial (financiado) más MIP mensual.",
      VA: "La tarifa de financiamiento varía (financiada). Sin seguro mensual.",
      USDA: "1% de tarifa de garantía inicial (financiada) más 0.35% anual.",
    },
  };

  // Copy (EN/ES)
  const t = (key) => {
    const dict = {
      title: "Daniel's Home Affordability Calculator",
      subtitle: "Skip the surprises. Know your real budget.",
      heroPitch: "Get real monthly payments for Polk, Osceola, and Orange County homes. Compare scenarios instantly and make confident decisions with insider market knowledge.",
      inputs: "Home Details",
      price: "Target Home Price",
      down: "Down Payment (%)",
      rate: "Interest Rate (%)",
      term: "Loan Term (years)",
      county: "Florida County",
      taxes: "Annual Property Taxes",
      insurance: "Annual Home Insurance",
      hoa: "Monthly HOA Fees",
      cdd: "Monthly CDD Fees",
      budget: "Comfortable Monthly Budget",
      applyCounty: "Quick-Fill County Costs",
      programs: "Loan Programs",
      conventional: "Conventional",
      fha: "FHA",
      va: "VA",
      usda: "USDA",
      scenarios: "Smart Scenario Comparison",
      priceDelta: "Price Adjustment",
      rateDelta: "Rate Change",
      downDelta: "Down Payment Shift",
      reset: "Reset All Scenarios",
      monthly: "Total Monthly Payment",
      principalInterest: "Principal & Interest",
      tax: "Property Taxes",
      ins: "Home Insurance",
      hoaLabel: "HOA",
      cddLabel: "CDD",
      pmi: "Mortgage Insurance",
      softWarn: "This payment exceeds your comfort budget. Consider adjusting your criteria.",
      disclaimer: "Educational estimates only • Not a loan commitment • Subject to credit approval • Equal Housing Opportunity",
      contactHeader: "Ready to Start House Hunting?",
      contactSub: "Get Daniel's insider market analysis and personalized home recommendations for your budget.",
      name: "Full Name",
      email: "Email Address",
      phone: "Phone Number",
      send: "Get My Market Analysis",
      lockedAt: "Locked at",
    };

    const es = {
      title: "Calculadora de Asequibilidad de Daniel",
      subtitle: "Sin sorpresas. Conoce tu presupuesto real.",
      heroPitch: "Obtén pagos mensuales reales para casas en Polk, Osceola y Orange County. Compara escenarios al instante y toma decisiones confiadas con conocimiento interno del mercado.",
      inputs: "Detalles de la Casa",
      price: "Precio de Casa Objetivo",
      down: "Enganche (%)",
      rate: "Tasa de Interés (%)",
      term: "Plazo del Préstamo (años)",
      county: "Condado de Florida",
      taxes: "Impuestos Anuales de Propiedad",
      insurance: "Seguro Anual de Casa",
      hoa: "Cuotas Mensuales HOA",
      cdd: "Cuotas Mensuales CDD",
      budget: "Presupuesto Mensual Cómodo",
      applyCounty: "Auto-llenar Costos del Condado",
      programs: "Programas de Préstamo",
      conventional: "Convencional",
      fha: "FHA",
      va: "VA",
      usda: "USDA",
      scenarios: "Comparación Inteligente de Escenarios",
      priceDelta: "Ajuste de Precio",
      rateDelta: "Cambio de Tasa",
      downDelta: "Cambio de Enganche",
      reset: "Reiniciar Todos los Escenarios",
      monthly: "Pago Mensual Total",
      principalInterest: "Capital e Interés",
      tax: "Impuestos de Propiedad",
      ins: "Seguro de Casa",
      hoaLabel: "HOA",
      cddLabel: "CDD",
      pmi: "Seguro Hipotecario",
      softWarn: "Este pago excede tu presupuesto cómodo. Considera ajustar tus criterios.",
      disclaimer: "Solo estimaciones educativas • No es compromiso de préstamo • Sujeto a aprobación crediticia • Igualdad de Oportunidades de Vivienda",
      contactHeader: "¿Listo para Buscar Casa?",
      contactSub: "Obtén el análisis interno del mercado de Daniel y recomendaciones personalizadas de casas para tu presupuesto.",
      name: "Nombre Completo",
      email: "Dirección de Correo",
      phone: "Número de Teléfono",
      send: "Obtener Mi Análisis del Mercado",
      lockedAt: "Fijado en",
    };

    return (lang === "en" ? dict : es)[key] || key;
  };

  function scenarioResult(idx) {
    const s = scenarios[idx];
    const price = homePrice + (s?.priceDelta || 0);
    const baseDpPct = LOCKED_DOWN_BY_PROGRAM[program] ?? 0;
    const dpPct = clamp(baseDpPct + (s?.downPctDelta || 0), 0, 100);
    const ir = clamp(rate + (s?.rateDelta || 0), 0, 25);

    const dp = (dpPct / 100) * price;
    let loan = price - dp;
    let upfront = 0;
    let mi = 0;
    const ltv = loan / price;

    if (program === "FHA") {
      upfront = loan * 0.0175;
      loan += upfront;
      mi = (loan * 0.0055) / 12;
    } else if (program === "VA") {
      const vaFeeRate = (baseDpPct >= 5 ? 0.015 : 0.0215); // uses base dp for fee tier
      upfront = loan * vaFeeRate;
      loan += upfront;
      mi = 0;
    } else if (program === "USDA") {
      upfront = loan * 0.01;
      loan += upfront;
      mi = (loan * 0.0035) / 12;
    } else {
      mi = estimateMonthlyPMI(loan, ltv);
    }

    const n = termYears * 12;
    const r = ir / 100 / 12;
    const pi = -pmt(r, n, loan);
    const escrows = (annualTaxes ?? 0) / 12 + (annualInsurance ?? 0) / 12 + (monthlyHOA ?? 0) + (monthlyCDD ?? 0);
    const total = pi + mi + escrows;

    return { price, dpPct, ir, loan, pi, mi, escrows, total, upfront };
  }

const results = [scenarioResult(0)];

  function applyCountyDefaults() {
    const p = countyPresets[county];
    setAnnualTaxes(Math.round(p.taxes));
    setAnnualInsurance(p.insurance);
  }

  function resetScenarios() {
    setScenarios([
      { id: 1, priceDelta: 0, rateDelta: 0, downPctDelta: 0, name: "Current" },
      { id: 2, priceDelta: 30000, rateDelta: -0.25, downPctDelta: 2, name: "Optimistic" },
      { id: 3, priceDelta: -20000, rateDelta: 0.5, downPctDelta: -2, name: "Conservative" },
    ]);
  }

  // Precompute style strings to avoid nested template strings inside JSX
  const pageBg = { background: `linear-gradient(135deg, ${C21.white}, ${C21.lightGold})` };
  const panelBg = { background: `linear-gradient(180deg, ${C21.white}EE, ${C21.white}F8)` };
  const darkLeadBg = { background: `linear-gradient(165deg, ${C21.ink}, ${C21.obsGrey})` };

  return (
    <div className="min-h-screen" style={pageBg}>
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-3 items-start">
          <Card className="lg:col-span-2 shadow-xl rounded-3xl border border-black/5" style={panelBg}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: C21.ink }}>
                    {t("title")}
                  </CardTitle>
                  <p className="text-lg mt-2 font-medium" style={{ color: C21.medGrey }}>{t("subtitle")}</p>
                </div>
                <div className="flex items-center gap-3 rounded-full p-1" style={{ background: C21.lightGrey }}>
                  <span className="text-sm font-semibold px-3 py-1 rounded-full bg-white shadow-sm">EN</span>
                  <Switch checked={lang === "es"} onCheckedChange={(v) => setLang(v ? "es" : "en")} />
                  <span className="text-sm font-semibold px-3 py-1 rounded-full bg-white shadow-sm">ES</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="flex items-start gap-3 text-lg leading-relaxed" style={{ color: C21.obsGrey }}>
                <Home className="h-6 w-6 shrink-0 mt-1" style={{ color: C21.gold }}/>
                {t("heroPitch")}
              </p>
            </CardContent>
          </Card>

          {/* Lead Capture */}
          <Card className="shadow-xl rounded-3xl border-0 text-white" style={darkLeadBg}>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="h-6 w-6" style={{ color: C21.gold }}/>
                {t("contactHeader")}
              </CardTitle>
              <p className="opacity-90 text-sm" style={{ color: C21.goldAccent }}>{t("contactSub")}</p>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <Label className="font-medium" style={{ color: C21.lightGrey }}>{t("name")}</Label>
                <Input placeholder="Jane Doe" className="bg-white/10 border-white/20 text-white placeholder:text-white/70" />
              </div>
              <div>
                <Label className="font-medium" style={{ color: C21.lightGrey }}>{t("email")}</Label>
                <Input type="email" placeholder="you@example.com" className="bg-white/10 border-white/20 text-white placeholder:text-white/70" />
              </div>
              <div>
                <Label className="font-medium" style={{ color: C21.lightGrey }}>{t("phone")}</Label>
                <Input placeholder="(555) 555-5555" className="bg-white/10 border-white/20 text-white placeholder:text-white/70" />
              </div>
              <Button className="w-full mt-2 font-semibold" style={{ background: C21.gold, color: C21.ink, borderColor: C21.gold }}>
                {t("send")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Inputs */}
          <Card className="lg:col-span-1 rounded-3xl shadow-lg border-0" style={panelBg}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl" style={{ color: C21.ink }}>
                <Calculator className="h-6 w-6" style={{ color: C21.gold }}/>
                {t("inputs")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="space-y-2">
                <Label className="font-semibold">{t("price")}</Label>
                <Input type="number" value={homePrice} onChange={(e) => setHomePrice(Number(e.target.value || 0))} className="text-lg font-semibold"/>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold flex items-center gap-2">
                  {t("down")} 
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: C21.lightGrey, color: C21.ink }}>
                    <Lock className="h-3 w-3"/> {t("lockedAt")} {fmt(LOCKED_DOWN_BY_PROGRAM[program])}%
                  </span>
                  <span className="text-sm font-normal ml-2" style={{ color: C21.medGrey }}>
                    {"(" + dollars0((downPct / 100) * homePrice) + ")"}
                  </span>
                </Label>
                <Input type="number" step="0.1" value={downPct} disabled className="text-lg font-semibold bg-gray-100 cursor-not-allowed"/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">{t("rate")}</Label>
                  <Input type="number" step="0.01" value={rate} onChange={(e) => setRate(Number(e.target.value || 0))} className="font-semibold"/>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">{t("term")}</Label>
                  <Input type="number" value={termYears} onChange={(e) => setTermYears(Number(e.target.value || 0))} className="font-semibold"/>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" style={{ color: C21.gold }}/>
                  {t("county")}
                </Label>
                <select className="w-full h-12 rounded-xl border-2 bg-white px-4 text-lg font-semibold focus:outline-none" style={{ borderColor: C21.lightGrey }} value={county} onChange={(e) => setCounty(e.target.value)}>
                  {Object.entries(countyPresets).map(([key, value]) => (
                    <option key={key} value={key}>
                      {key} County - {value.description}
                    </option>
                  ))}
                </select>
                <Button type="button" className="w-full font-semibold" style={{ background: C21.gold, color: C21.ink }} onClick={applyCountyDefaults}>
                  {t("applyCounty")}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">{t("taxes")}</Label>
                  <Input type="number" value={annualTaxes} onChange={(e) => setAnnualTaxes(Number(e.target.value || 0))}/>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">{t("insurance")}</Label>
                  <Input type="number" value={annualInsurance} onChange={(e) => setAnnualInsurance(Number(e.target.value || 0))}/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">{t("hoa")}</Label>
                  <Input type="number" value={monthlyHOA} onChange={(e) => setMonthlyHOA(Number(e.target.value || 0))}/>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">{t("cdd")}</Label>
                  <Input type="number" value={monthlyCDD} onChange={(e) => setMonthlyCDD(Number(e.target.value || 0))}/>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold" style={{ color: C21.ink }}>{t("budget")}</Label>
                <Input type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value || 0))} className="text-lg font-semibold"/>
              </div>

              <div className="pt-2">
                <p className="text-xs flex gap-2 items-start" style={{ color: C21.medGrey }}>
                  <Info className="h-4 w-4 shrink-0 mt-0.5" style={{ color: C21.gold }}/> 
                  {t("disclaimer")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Programs & Scenarios */}
          <div className="space-y-6">
            {/* Programs */}
            <Card className="rounded-3xl shadow-lg border border-black/5" style={panelBg}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl" style={{ color: C21.ink }}>
                  <Layers className="h-6 w-6" style={{ color: C21.gold }}/>
                  {t("programs")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={program} onValueChange={setProgram} className="w-full">
                  <TabsList className="grid grid-cols-4 h-12 rounded-xl" style={{ background: C21.lightGrey }}>
                    <TabsTrigger value="Conventional" className="rounded-lg font-semibold">{t("conventional")}</TabsTrigger>
                    <TabsTrigger value="FHA" className="rounded-lg font-semibold">{t("fha")}</TabsTrigger>
                    <TabsTrigger value="VA" className="rounded-lg font-semibold">{t("va")}</TabsTrigger>
                    <TabsTrigger value="USDA" className="rounded-lg font-semibold">{t("usda")}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="Conventional" className="text-sm mt-4 p-4 rounded-xl" style={{ background: C21.lightGold, color: C21.obsGrey }}>
                    <p className="font-medium">{notes[lang].Conventional}</p>
                  </TabsContent>
                  <TabsContent value="FHA" className="text-sm mt-4 p-4 rounded-xl" style={{ background: C21.lightGold, color: C21.obsGrey }}>
                    <p className="font-medium">{notes[lang].FHA}</p>
                  </TabsContent>
                  <TabsContent value="VA" className="text-sm mt-4 p-4 rounded-xl" style={{ background: C21.lightGold, color: C21.obsGrey }}>
                    <p className="font-medium">{notes[lang].VA}</p>
                  </TabsContent>
                  <TabsContent value="USDA" className="text-sm mt-4 p-4 rounded-xl" style={{ background: C21.lightGold, color: C21.obsGrey }}>
                    <p className="font-medium">{notes[lang].USDA}</p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

          {/* Results */}
          <div className="space-y-6">
            {results.map((r, i) => (
              <Card key={i} className="rounded-3xl shadow-lg border border-black/5" style={panelBg}>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg" style={{ color: C21.ink }}>{t("monthly")}</span>
                    <span className="text-2xl font-bold" style={{ color: C21.gold }}>{dollars0(r.total)}</span>
                 </CardTitle>
                  <p className="text-sm" style={{ color: C21.medGrey }}>{t("monthly")}</p>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl p-3" style={{ background: C21.lightGold }}>
                      <div className="text-xs mb-1" style={{ color: C21.medGrey }}>{t("price")}</div>
                      <div className="font-bold text-lg" style={{ color: C21.ink }}>{dollars0(r.price)}</div>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: C21.lightGold }}>
                      <div className="text-xs mb-1" style={{ color: C21.medGrey }}>{t("down")}</div>
                      <div className="font-bold text-lg" style={{ color: C21.ink }}>{fmt2(r.dpPct) + "%"}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl p-3" style={{ background: C21.lightGold }}>
                      <div className="text-xs mb-1" style={{ color: C21.medGrey }}>{t("rate")}</div>
                      <div className="font-bold text-lg" style={{ color: C21.ink }}>{fmt2(r.ir) + "%"}</div>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: C21.lightGold }}>
                      <div className="text-xs mb-1" style={{ color: C21.medGrey }}>Loan Amount</div>
                      <div className="font-bold text-lg" style={{ color: C21.ink }}>{dollars0(Math.round(r.loan))}</div>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    {[
                      { key: "principalInterest", val: dollars0(r.pi) },
                      { key: "pmi", val: dollars0(r.mi) },
                      { key: "tax", val: dollars0((annualTaxes ?? 0) / 12) },
                      { key: "ins", val: dollars0((annualInsurance ?? 0) / 12) },
                      { key: "hoa/cdd", label: t("hoaLabel") + " / " + t("cddLabel"), val: dollars0((monthlyHOA ?? 0) + (monthlyCDD ?? 0)) },
                    ].map((row, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b" style={{ borderColor: C21.lightGrey }}>
                        <span className="text-sm" style={{ color: C21.ink }}>{row.label || t(row.key)}</span>
                        <span className="font-semibold" style={{ color: C21.ink }}>{row.val}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center py-3 rounded-xl px-3 font-bold text-lg" style={{ background: C21.gold, color: C21.ink }}>
                      <span>Total Monthly</span>
                      <span>{dollars0(r.total)}</span>
                    </div>
                  </div>

                  {r.total > budget && budget > 0 && (
                    <div className="flex items-start gap-2 text-sm rounded-xl p-3 mt-3 border" style={{ background: "#FFF7E6", color: "#8A6D3B", borderColor: "#F5E0B7" }}>
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0"/>
                      <span>{t("softWarn")}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-4" style={{ background: C21.ink }}>
        <div className="max-w-7xl mx-auto p-6 sm:p-8 text-center">
          <p className="text-sm mb-2" style={{ color: C21.lightGrey }}>{t("disclaimer")}</p>
          <p className="text-xs" style={{ color: C21.gold }}>
            Daniel Bustamante • Central Florida Real Estate • Equal Housing Opportunity • REALTOR®
          </p>
          <p className="text-xs mt-2" style={{ color: C21.lightGrey }}>
            Currently showing: {county} County • {program} Program
          </p>
        </div>
      </footer>
    </div>
  );
}
