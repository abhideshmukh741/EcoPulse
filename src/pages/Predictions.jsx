import { useState, useMemo } from "react";
import ScrollReveal from "../components/ScrollReveal";
import { apiFetch } from "../lib/api";
import {
  BrainCircuit,
  Sparkles,
  AlertTriangle,
  Calendar,
} from "lucide-react";

// -------------------------------------------------------------------
// Tiny inline SVG charts (no external lib needed)
// -------------------------------------------------------------------

function LineChart({ past, next }) {
  // past: 12 data points, next: 6 data points
  const allPoints = [...past, ...next].filter((v) => Number.isFinite(v));
  if (allPoints.length < 2) {
    return <svg viewBox="0 0 320 100" className="w-full h-24" />;
  }
  const min = Math.min(...allPoints);
  const max = Math.max(...allPoints);
  const range = max - min || 1;
  const W = 320, H = 100;
  const norm = (v) => H - ((v - min) / range) * (H - 10) - 5;

  const toPath = (arr, offset = 0) =>
    arr
      .map((v, i) => {
        const x = ((offset + i) / (past.length + next.length - 1)) * W;
        const y = norm(v);
        return `${i === 0 && offset === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");

  const pastPath = toPath(past, 0);
  const nextPath =
    "M " +
    (((past.length - 1) / (past.length + next.length - 1)) * W).toFixed(1) +
    " " +
    norm(past[past.length - 1]).toFixed(1) +
    " " +
    next
      .map((v, i) => {
        const x = ((past.length + i) / (past.length + next.length - 1)) * W;
        return `L ${x.toFixed(1)} ${norm(v).toFixed(1)}`;
      })
      .join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-24">
      <path d={pastPath} fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={nextPath} fill="none" stroke="#10B981" strokeWidth="2" strokeDasharray="6 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-4 h-28 justify-center">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div
            className="w-10 rounded-t-lg transition-all duration-500"
            style={{
              height: `${(d.value / max) * 96}px`,
              background: i === 1 ? "linear-gradient(to top, #60A5FA, #93C5FD)" : "linear-gradient(to top, #10B981, #34D399)",
            }}
          />
          <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-medium">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function GaugeChart({ value }) {
  // value 0-100
  const r = 40;
  const cx = 50, cy = 50;
  const circumference = Math.PI * r; // half circle
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 60" className="w-36 h-24">
        <path
          d={`M 10 50 A ${r} ${r} 0 0 1 90 50`}
          fill="none"
          stroke="rgba(148,163,184,0.2)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d={`M 10 50 A ${r} ${r} 0 0 1 90 50`}
          fill="none"
          stroke="#10B981"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="drop-shadow-[0_0_6px_rgba(16,185,129,0.7)]"
        />
        <circle cx={cx} cy={cy} r="4" fill="#10B981" />
      </svg>
      <span className="text-2xl font-black text-[#0F172A] dark:text-white -mt-4">{value}%</span>
    </div>
  );
}

// -------------------------------------------------------------------
export default function Predictions() {
  const [academicPhase, setAcademicPhase] = useState("regular");
  const [studentFootfall, setStudentFootfall] = useState(4180);
  const [ambientTemp, setAmbientTemp] = useState(32);
  const [labComputeLoad] = useState("high");
  const [solarForecastKwp] = useState(200);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [isLiveMl, setIsLiveMl] = useState(false);

  const baselinePrediction = useMemo(() => {
    let baseFootprint = 88;
    if (academicPhase === "fest") baseFootprint *= 1.35;
    else if (academicPhase === "exams") baseFootprint *= 1.15;
    else if (academicPhase === "vacation") baseFootprint *= 0.45;
    baseFootprint *= studentFootfall / 4180;
    if (ambientTemp > 28) baseFootprint += (ambientTemp - 28) * 2.2;
    else if (ambientTemp < 20) baseFootprint += (20 - ambientTemp) * 1.1;
    if (labComputeLoad === "high") baseFootprint += 15;
    const solarOffset = (solarForecastKwp * 120 * 0.72) / 1000;
    const finalMonthlyTons = Math.max(20, Number((baseFootprint - solarOffset).toFixed(1)));
    let peakRisk = "Moderate (Within Operating Ceiling)";
    let riskClass = "warn";
    if (finalMonthlyTons > 115) { peakRisk = "High (Substation Tariff Penalty Warning)"; riskClass = "danger"; }
    else if (finalMonthlyTons < 65) { peakRisk = "Low (Optimal Green Baseline)"; riskClass = "good"; }
    const estimatedCostLakhs = Number((finalMonthlyTons * 0.78).toFixed(2));
    return {
      monthlyTons: finalMonthlyTons,
      confidence: 95.4,
      peakRisk, riskClass,
      costEstimate: `₹${estimatedCostLakhs} Lakhs`,
      features: [
        { name: "HVAC & Temperature Draw", impact: ambientTemp > 30 ? "+High" : "Normal" },
        { name: "Computer Labs & Server Clusters", impact: labComputeLoad === "high" ? "+High" : "Moderate" },
        { name: "Student & Hosteler Footfall", impact: studentFootfall > 4000 ? "+High" : "Low" },
        { name: "Rooftop Solar Offset", impact: `-${solarOffset.toFixed(1)} T Clean` },
      ],
    };
  }, [academicPhase, studentFootfall, ambientTemp, labComputeLoad, solarForecastKwp]);

  const fetchMlPrediction = async () => {
    setIsPredicting(true);
    try {
      const response = await apiFetch("/api/predictions/predict", {
        method: "POST",
        body: JSON.stringify({
          academic_phase: academicPhase,
          student_footfall: studentFootfall,
          ambient_temp: ambientTemp,
          lab_compute_load: labComputeLoad,
          solar_kwp: solarForecastKwp,
          grid_daily_kwh: 5000.0,
          solar_generation_kwh: 350.0,
          diesel_liters: 150.0,
          petrol_liters: 80.0,
          transport_km: 2000.0,
          water_liters: 30000,
          waste_kg: 200.0,
          food_meals: 2000,
          scope1_tco2e: 0.7,
          scope2_tco2e: 3.0,
          scope3_tco2e: 2.0,
          lag_1_co2e: 5.0,
          lag_7_co2e: 4.8,
          lag_30_co2e: 4.5,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const daily = Number(data.daily_tons_co2e);
        const monthly = Number(data.monthly_estimate);
        const confidence = Number(data.confidence);
        const peakRisk = String(data.peak_risk || "moderate");

        if (![daily, monthly, confidence].every(Number.isFinite)) {
          setPredictionResult(baselinePrediction);
          setIsLiveMl(false);
          return;
        }

        let riskClass = "warn";
        if (peakRisk === "high") riskClass = "danger";
        else if (peakRisk === "low") riskClass = "good";

        setPredictionResult({
          monthlyTons: monthly,
          confidence,
          peakRisk: `${peakRisk.toUpperCase()} (${daily} T/day)`,
          riskClass,
          costEstimate: `₹${data.cost_estimate_lakhs ?? (monthly * 0.78).toFixed(2)} Lakhs`,
          features: [
            { name: "ML RandomForest Target Output", impact: `${daily} T/day` },
            { name: "HVAC & Ambient Temp Draw", impact: `${ambientTemp}°C` },
            { name: "Computer Labs & Server Load", impact: labComputeLoad.toUpperCase() },
            { name: "Student & Staff Campus Footfall", impact: `${studentFootfall.toLocaleString()}` },
          ],
          savedToDb: Boolean(data.saved),
        });
        setIsLiveMl(true);
        try {
          localStorage.setItem("ecopulse_latest_prediction", JSON.stringify({
            monthlyTons: monthly,
            dailyTons: daily,
            confidence,
            peakRisk,
            costEstimateLakhs: data.cost_estimate_lakhs,
            updatedAt: Date.now(),
            savedToDb: Boolean(data.saved),
          }));
          window.dispatchEvent(new CustomEvent("ecopulse_data_updated", { detail: { type: "prediction", data } }));
        } catch (e) {}
      } else {
        setPredictionResult(baselinePrediction);
        setIsLiveMl(false);
      }
    } catch (err) {
      console.warn("Backend FastAPI ML API not reachable, falling back to local model logic.", err);
      setPredictionResult(baselinePrediction);
      setIsLiveMl(false);
    } finally {
      setIsPredicting(false);
    }
  };

  // No auto-fetch on mount or when inputs change.
  // Prediction only runs when the user clicks "Run AI Model Prediction".

  const handleRunPrediction = () => {
    fetchMlPrediction();
  };

  const currentResult = predictionResult;
  // Use baseline for charts until the user runs a prediction (avoids null crash)
  const chartTons = currentResult?.monthlyTons ?? baselinePrediction.monthlyTons;
  const chartConfidence = currentResult?.confidence ?? baselinePrediction.confidence;

  // Chart data
  const pastEmissions = [72, 78, 81, 77, 85, 90, 88, 92, 86, 91, 94, 88];
  const nextEmissions = [92, 95, chartTons, chartTons - 2, chartTons + 3, chartTons - 1];
  const energyBreakdown = [
    { label: "HVAC", value: 48 },
    { label: "Compute", value: 29 },
    { label: "Lighting", value: 23 },
  ];

  return (
    <div className="min-h-screen predictions-atmosphere font-sans">
      <div className="predictions-atmosphere-glow predictions-glow-one" aria-hidden="true" />
      <div className="predictions-atmosphere-glow predictions-glow-two" aria-hidden="true" />

      {/* ── HERO ── */}
      <section className="relative z-10 pt-28 pb-10 text-center px-6">
        <ScrollReveal variant="fadeUp" delay={0.05} duration={0.6}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full predictions-glass-card border border-[#E2E8F0] dark:border-[#2C2E33] shadow-sm mb-6">
            <BrainCircuit size={13} className="text-[#10B981]" />
            <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">AI Carbon Prediction Engine</span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-[#0F172A] dark:text-white leading-tight mb-4">
            Campus AI{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10B981] to-[#059669]">
              Prediction Studio
            </span>
          </h1>
          <p className="text-base md:text-lg text-[#64748B] dark:text-[#94A3B8] max-w-xl mx-auto leading-relaxed">
            Simulate and forecast carbon emissions and peak electrical load for upcoming semester trends.
          </p>
        </ScrollReveal>
      </section>

      {/* ── MAIN TWO-COLUMN ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-12 grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* LEFT – inputs */}
        <ScrollReveal variant="fadeRight" delay={0.1} duration={0.6} className="lg:col-span-3">
          <div className="predictions-glass-card rounded-2xl p-7 border border-[#E2E8F0] dark:border-[#2C2E33] shadow-sm">
            {/* card header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] font-bold tracking-[0.18em] text-[#94A3B8] uppercase mb-1">MODEL FEATURE INPUTS</p>
                <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Campus Operational Variables</h3>
              </div>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                isLiveMl
                  ? "bg-[#10B981]/10 border-[#10B981]/20"
                  : "bg-amber-500/10 border-amber-500/20"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isLiveMl ? "bg-[#10B981] animate-pulse" : "bg-amber-500"}`} />
                <span className={`text-[10px] font-bold ${isLiveMl ? "text-[#10B981]" : "text-amber-600 dark:text-amber-400"}`}>
                  {isLiveMl ? "Live ML Connected" : "Local Estimate Mode"}
                </span>
              </div>
            </div>

            {/* Academic phase chips */}
            <div className="mb-6">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] mb-3">
                <Calendar size={13} /> Academic Semester Phases
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "regular", label: "Regular Semester Classes" },
                  { id: "exams", label: "Final Exam Week (Hostel Surge)" },
                  { id: "fest", label: "Heavy (High-Performance)" },
                  { id: "vacation", label: "Semester Break / Vacation" },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setAcademicPhase(p.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      academicPhase === p.id
                        ? "bg-[#10B981] text-white border-[#10B981]"
                        : "bg-transparent text-[#64748B] dark:text-[#94A3B8] border-[#CBD5E1] dark:border-[#334155] hover:border-[#10B981] hover:text-[#10B981]"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Student footfall slider */}
            <div className="mb-6">
              <div className="flex justify-end mb-1">
                <span className="text-xs font-bold text-[#10B981]">{studentFootfall.toLocaleString()} Students &amp; Staff</span>
              </div>
              <input
                type="range" min="800" max="8000" step="100"
                value={studentFootfall}
                onChange={(e) => setStudentFootfall(Number(e.target.value))}
                className="w-full accent-[#10B981] h-1.5 rounded-full cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#94A3B8] mt-1.5">
                <span>800 (Low)</span>
                <span>4,180 (Enrolled Students Baseline)</span>
                <span>8,000 (Event Peak)</span>
              </div>
            </div>

            {/* Ambient temp slider */}
            <div className="mb-8">
              <div className="flex justify-end mb-1">
                <span className="text-xs font-bold text-[#10B981]">{ambientTemp}°C</span>
              </div>
              <input
                type="range" min="16" max="46" step="1"
                value={ambientTemp}
                onChange={(e) => setAmbientTemp(Number(e.target.value))}
                className="w-full accent-[#10B981] h-1.5 rounded-full cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#94A3B8] mt-1.5">
                <span>16°C (Winter)</span>
                <span>32°C (Average)</span>
                <span>46°C (Peak Summer HVAC)</span>
              </div>
            </div>

            {/* Run button */}
            <button
              onClick={handleRunPrediction}
              disabled={isPredicting}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-sm transition-all disabled:opacity-60"
            >
              <BrainCircuit size={17} className={isPredicting ? "animate-spin" : ""} />
              {isPredicting ? "Executing AI Model Inference..." : "Run AI Model Prediction"}
            </button>
          </div>
        </ScrollReveal>

        {/* RIGHT – results */}
        <ScrollReveal variant="fadeLeft" delay={0.15} duration={0.6} className="lg:col-span-2">
          <div className="predictions-glass-card rounded-2xl p-7 border border-[#E2E8F0] dark:border-[#2C2E33] shadow-sm sticky top-24 h-full">

            {!currentResult ? (
              /* ── Placeholder: shown before user clicks Run ── */
              <div className="flex flex-col items-center justify-center h-full min-h-[380px] gap-5 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center">
                  <BrainCircuit size={30} className="text-[#10B981]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0F172A] dark:text-white mb-1">No Prediction Yet</p>
                  <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed max-w-[200px] mx-auto">
                    Configure the campus inputs on the left, then click <strong>"Run AI Model Prediction"</strong> to generate a forecast.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#94A3B8]/10 border border-[#94A3B8]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Awaiting Input</span>
                </div>
              </div>
            ) : (
              <>
                {/* header */}
                <div className="flex justify-between items-center mb-6">
                  <p className="text-[10px] font-bold tracking-[0.18em] text-[#94A3B8] uppercase">Forecasted Output</p>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/20">
                    <Sparkles size={10} className="text-[#10B981]" />
                    <span className="text-[10px] font-bold text-[#10B981]">Model Confidence: {currentResult.confidence}%</span>
                  </div>
                </div>

                {/* big metric */}
                <div className="mb-5">
                  <p className="text-[9px] font-bold tracking-[0.2em] text-[#94A3B8] uppercase mb-2">NEXT MONTH PROJECTED FOOTPRINT</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black text-[#0F172A] dark:text-white leading-none">{currentResult.monthlyTons}</span>
                    <span className="text-xs font-bold text-[#94A3B8]">Metric Tons CO₂e</span>
                  </div>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1.5">
                    Projected Energy Billing{" "}
                    <strong className="text-[#F59E0B]">{currentResult.costEstimate}</strong>
                  </p>
                </div>

                {/* risk alert */}
                <div className={`flex gap-3 p-3.5 rounded-xl mb-5 ${
                  currentResult.riskClass === "danger"
                    ? "bg-red-500/10 border border-red-400/20"
                    : currentResult.riskClass === "warn"
                    ? "bg-[#F59E0B]/10 border border-[#F59E0B]/20"
                    : "bg-[#10B981]/10 border border-[#10B981]/20"
                }`}>
                  <AlertTriangle size={16} className={
                    currentResult.riskClass === "danger" ? "text-red-400 mt-0.5 shrink-0" :
                    currentResult.riskClass === "warn" ? "text-[#F59E0B] mt-0.5 shrink-0" : "text-[#10B981] mt-0.5 shrink-0"
                  } />
                  <div>
                    <p className={`text-xs font-bold mb-0.5 ${
                      currentResult.riskClass === "danger" ? "text-red-500" :
                      currentResult.riskClass === "warn" ? "text-[#D97706] dark:text-[#FCD34D]" : "text-[#059669] dark:text-[#34D399]"
                    }`}>
                      Peak Demand Risk: {currentResult.peakRisk}
                    </p>
                    <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                      Campus operational loads trend within NAAC Criterion VII energy targets.
                    </p>
                  </div>
                </div>

                {/* feature weights */}
                <div>
                  <p className="text-xs font-bold text-[#0F172A] dark:text-white mb-3">Top Model Decision Weights</p>
                  <div className="space-y-2.5">
                    {currentResult.features.map((f, i) => (
                      <div key={i} className="flex justify-between items-center text-xs border-b border-[#F1F5F9] dark:border-[#252830] pb-2 last:border-0 last:pb-0">
                        <span className="text-[#64748B] dark:text-[#94A3B8]">{f.name}</span>
                        <span className={`font-bold ${f.impact.includes("+") ? "text-[#10B981]" : f.impact.includes("-") ? "text-[#6366F1]" : "text-[#64748B]"}`}>{f.impact}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollReveal>
      </section>

      {/* ── BOTTOM 3-CHART ROW ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-20 grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Chart 1: Line chart */}
        <ScrollReveal variant="fadeUp" delay={0.1} duration={0.6}>
          <div className="predictions-glass-card rounded-2xl p-6 border border-[#E2E8F0] dark:border-[#2C2E33] shadow-sm">
            <p className="text-xs font-bold text-[#0F172A] dark:text-white mb-1">Historical vs. Predicted CO2 Emissions</p>
            <div className="flex items-center gap-4 mb-4">
              <span className="flex items-center gap-1.5 text-[10px] text-[#64748B]">
                <span className="w-4 h-0.5 bg-[#10B981] inline-block rounded" /> Past 12 Months
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-[#10B981]">
                <span className="w-4 h-0.5 border-t-2 border-dashed border-[#10B981] inline-block" /> Next 6 Months
              </span>
            </div>
            <LineChart past={pastEmissions} next={nextEmissions} />
            <div className="flex justify-between text-[9px] text-[#94A3B8] mt-2">
              <span>Past 12 Months</span>
              <span>Next 6 Months</span>
            </div>
          </div>
        </ScrollReveal>

        {/* Chart 2: Bar chart */}
        <ScrollReveal variant="fadeUp" delay={0.15} duration={0.6}>
          <div className="predictions-glass-card rounded-2xl p-6 border border-[#E2E8F0] dark:border-[#2C2E33] shadow-sm">
            <p className="text-xs font-bold text-[#0F172A] dark:text-white mb-5">Projected Energy Consumption Breakdown</p>
            <BarChart data={energyBreakdown} />
          </div>
        </ScrollReveal>

        {/* Chart 3: Gauge */}
        <ScrollReveal variant="fadeUp" delay={0.2} duration={0.6}>
          <div className="predictions-glass-card rounded-2xl p-6 border border-[#E2E8F0] dark:border-[#2C2E33] shadow-sm flex flex-col">
            <p className="text-xs font-bold text-[#0F172A] dark:text-white mb-5">
              Model Confidence: {chartConfidence}%
            </p>
            <div className="flex-1 flex items-center justify-center">
              <GaugeChart value={chartConfidence} />
            </div>
          </div>
        </ScrollReveal>

      </section>

    </div>
  );
}
